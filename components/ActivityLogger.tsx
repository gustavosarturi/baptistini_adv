"use client";

import { useGameStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { DifficultyLevel, TIER_MULTIPLIERS } from "@/lib/types";
import { Briefcase, CheckCircle2, Clock, FileText, Scale, Zap, UserPlus, Building2, Search, ChevronDown, Star, X } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function ActivityLogger() {
    const { currentUser, extraSettings, clients, logs, users } = useGameStore();
    const { role } = useAuth();

    const [activitySearch, setActivitySearch] = useState("");
    const [isActivityDropdownOpen, setIsActivityDropdownOpen] = useState(false);
    const activityDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (activityDropdownRef.current && !activityDropdownRef.current.contains(event.target as Node)) {
                setIsActivityDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const recentActivities = useMemo(() => {
        if (!currentUser) return [];
        const userLogs = logs.filter(log => log.user_id === currentUser.id);
        const stats: Record<string, number> = {};
        userLogs.forEach(log => {
            if (log.extra_type) stats[log.extra_type] = (stats[log.extra_type] || 0) + 1;
        });
        return Object.entries(stats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(entry => entry[0])
            .filter(type => extraSettings[type]);
    }, [logs, currentUser, extraSettings]);

    const getLocalDateString = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const [formData, setFormData] = useState({
        target_user_id: "",
        date: getLocalDateString(),
        client_name: "",
        process_number: "",
        description: "",
        time_spent: "",
        extra_type: "",
        department: "" as "" | "Consultivo" | "Operacional" | "Comercial" | "Estratégico" | "Marketing"
    });

    const [clientSearch, setClientSearch] = useState("");
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase())
    );

    const handleQuickRegisterClient = async () => {
        if (!clientSearch || !db) return;
        try {
            await addDoc(collection(db, "clients"), {
                name: clientSearch,
                created_at: new Date().toISOString()
            });
            setFormData({ ...formData, client_name: clientSearch });
            setIsClientDropdownOpen(false);
        } catch (error) {
            console.error("Error creating quick client:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !formData.extra_type || !db) return;
        
        // Block if not 'Extra' and no valid client name is selected
        const selectedItemRaw = extraSettings[formData.extra_type];
        if (selectedItemRaw?.type !== 'Extra' && !formData.client_name) {
            alert("Por favor, selecione ou cadastre um cliente válido.");
            return;
        }

        const targetUserId = formData.target_user_id || currentUser.id;
        const targetUser = users.find(u => u.id === targetUserId) || currentUser;

        const finalDepartment = formData.department || targetUser.department;
        if (!finalDepartment) {
            alert("Por favor, informe o departamento.");
            return;
        }

        const selectedItem = extraSettings[formData.extra_type];
        
        // Calculate points here to save in Firestore
        const base_points = selectedItem.points;
        const multiplier = selectedItem.type === 'Extra' ? 1 : TIER_MULTIPLIERS[targetUser.tier];
        const final_points = base_points * multiplier;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { target_user_id, ...dataToSave } = formData;

        try {
            await addDoc(collection(db, "activity_logs"), {
                ...dataToSave,
                department: finalDepartment,
                date: getLocalDateString(),
                user_id: targetUser.id,
                user_name: targetUser.full_name,
                complexity: selectedItem.type,
                time_spent: Number(formData.time_spent) || 0,
                base_points,
                multiplier,
                final_points,
                created_at: new Date().toISOString()
            });

            // Reset form
            setFormData({
                target_user_id: formData.target_user_id, // Keep the same selected user
                date: getLocalDateString(),
                client_name: "",
                process_number: "",
                description: "",
                time_spent: "",
                extra_type: "",
                department: ""
            });
            setClientSearch("");

            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 2000);
        } catch (error) {
            console.error("Error saving activity log:", error);
        }
    };

    if (!currentUser) return null;

    let targetUser = currentUser;
    if (role === 'admin' && formData.target_user_id) {
        targetUser = users.find(u => u.id === formData.target_user_id) || currentUser;
    }

    // Calculate Preview Logic
    let previewBase = 0;
    let previewMultiplier = 1;
    let selectedType: DifficultyLevel = 'Light';

    if (formData.extra_type) {
        const setting = extraSettings[formData.extra_type];
        if (setting) {
            previewBase = setting.points;
            selectedType = setting.type;
            previewMultiplier = setting.type === 'Extra' ? 1 : TIER_MULTIPLIERS[targetUser.tier];
        }
    }

    const previewTotal = previewBase * previewMultiplier;


    return (
        <div className="w-full max-w-md bg-secondary border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
            {/* Dynamic Glow based on Difficulty */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-all duration-700
         ${selectedType === 'Extra' ? 'bg-yellow-500/20' :
                    selectedType === 'Hard' ? 'bg-red-500/20' :
                        selectedType === 'Medium' ? 'bg-primary/10' : 'bg-blue-500/10'}
      `} />

            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Scale className="text-primary" />
                Registrar Atividade
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {role === 'admin' && (
                    <div className="mb-2">
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 flex items-center gap-1">
                            <Zap size={12} /> Registrar para (Admin)
                        </label>
                        <select
                            value={formData.target_user_id || currentUser.id}
                            onChange={(e) => setFormData({ ...formData, target_user_id: e.target.value })}
                            className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-primary outline-none transition-all cursor-pointer"
                        >
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.full_name}</option>
                            ))}
                        </select>
                    </div>
                )}
                {/* Activity Selector (Combobox) */}
                <div ref={activityDropdownRef} className="relative z-50">
                    <label className="block text-xs font-bold text-primary uppercase mb-1 flex items-center gap-1">
                        <Zap size={12} />
                        O que você fez?
                    </label>
                    <div 
                        onClick={() => setIsActivityDropdownOpen(true)}
                        className={`relative w-full bg-black/50 border rounded-lg px-3 py-2.5 text-white text-sm outline-none cursor-pointer transition-all flex items-center justify-between
                            ${isActivityDropdownOpen ? 'border-primary shadow-[0_0_15px_rgba(255,229,0,0.15)] ring-1 ring-primary' : 'border-zinc-700 hover:border-zinc-600'}
                        `}
                    >
                        {!isActivityDropdownOpen ? (
                            <span className={formData.extra_type ? "text-white" : "text-zinc-500"}>
                                {formData.extra_type || "Selecione uma atividade..."}
                            </span>
                        ) : (
                            <div className="flex items-center gap-2 w-full">
                                <Search size={14} className="text-primary flex-shrink-0" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Pesquisar..."
                                    value={activitySearch}
                                    onChange={(e) => setActivitySearch(e.target.value)}
                                    className="bg-transparent border-none outline-none w-full text-white placeholder:text-zinc-500"
                                />
                                {activitySearch && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setActivitySearch(""); }}
                                        className="text-zinc-500 hover:text-white"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        )}
                        <ChevronDown size={16} className={`text-zinc-500 transition-transform ${isActivityDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Dropdown Menu */}
                    {isActivityDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
                            {/* Favoritos / Recentes */}
                            {!activitySearch && recentActivities.length > 0 && (
                                <div className="mb-2">
                                    <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900 flex items-center gap-1.5 sticky top-0 z-10 border-b border-zinc-800">
                                        <Star size={12} className="text-yellow-500" />
                                        Mais Usados (Recentes)
                                    </div>
                                    {recentActivities.map(key => {
                                        const s = extraSettings[key];
                                        return (
                                            <button
                                                key={`recent-${key}`}
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, extra_type: key });
                                                    setIsActivityDropdownOpen(false);
                                                    setActivitySearch("");
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-primary/20 hover:text-primary transition-colors flex justify-between items-center group"
                                            >
                                                <span className="truncate">{key}</span>
                                                <span className="text-[10px] font-bold opacity-50 group-hover:opacity-100 flex-shrink-0">
                                                    {s.points > 0 ? '+' : ''}{s.points} pts
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Categorias */}
                            {(role === 'admin' ? ['Light', 'Medium', 'Hard', 'Extra'] : ['Light', 'Medium', 'Hard'] as DifficultyLevel[]).map(type => {
                                const items = Object.entries(extraSettings).filter(([key, item]) => 
                                    item.type === type && key.toLowerCase().includes(activitySearch.toLowerCase())
                                );
                                if (items.length === 0) return null;

                                return (
                                    <div key={`group-${type}`} className="mb-2 last:mb-0">
                                        <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900 sticky top-0 z-10 border-b border-zinc-800">
                                            {type === 'Extra' ? '🎁 INCENTIVOS / EXTRAS' : `🚀 TAREFA ${type.toUpperCase()}`}
                                        </div>
                                        {items.sort().map(([key, s]) => (
                                            <button
                                                key={`item-${key}`}
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, extra_type: key });
                                                    setIsActivityDropdownOpen(false);
                                                    setActivitySearch("");
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex justify-between items-center ${formData.extra_type === key ? 'bg-zinc-800 text-white font-bold' : ''}`}
                                            >
                                                <span className="truncate">{key}</span>
                                                <span className={`text-[10px] font-bold p-1 rounded-md flex-shrink-0 ml-2
                                                    ${type === 'Hard' ? 'bg-red-500/10 text-red-400' :
                                                      type === 'Medium' ? 'bg-primary/10 text-primary' :
                                                      type === 'Extra' ? 'bg-yellow-500/10 text-yellow-500' :
                                                      'bg-blue-500/10 text-blue-400'}
                                                `}>
                                                    {s.points > 0 ? '+' : ''}{s.points} pts
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                );
                            })}
                            
                            {/* Fallback caso não encontre nada na pesquisa */}
                            {activitySearch && 
                                Object.keys(extraSettings).filter(k => k.toLowerCase().includes(activitySearch.toLowerCase())).length === 0 && (
                                <div className="px-4 py-6 text-center text-zinc-500 text-xs italic">
                                    Nenhuma atividade encontrada para &quot;{activitySearch}&quot;
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Department Selector */}
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 flex items-center gap-1">
                        <Building2 size={12} />
                        Departamento
                    </label>
                    <select
                        required
                        value={formData.department || targetUser.department || ""}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value as "" | "Consultivo" | "Operacional" | "Comercial" | "Estratégico" | "Marketing" })}
                        className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-primary outline-none transition-all cursor-pointer"
                    >
                        <option value="">Selecione um departamento...</option>
                        <option value="Consultivo">Consultivo</option>
                        <option value="Operacional">Operacional</option>
                        <option value="Comercial">Comercial</option>
                        <option value="Estratégico">Estratégico</option>
                        <option value="Marketing">Marketing</option>
                    </select>
                </div>

                {/* Client & Process Row */}
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Cliente</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-3 text-zinc-600 w-4 h-4" />
                            <input
                                required={selectedType !== 'Extra'}
                                type="text"
                                placeholder={selectedType === 'Extra' ? "Contexto (Opcional)" : "Pesquisar Cliente..."}
                                value={formData.client_name || clientSearch}
                                onFocus={() => setIsClientDropdownOpen(true)}
                                onChange={(e) => {
                                    setClientSearch(e.target.value);
                                    if (formData.client_name) setFormData({ ...formData, client_name: "" });
                                    setIsClientDropdownOpen(true);
                                }}
                                className="w-full bg-black/50 border border-zinc-700 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            />

                            {isClientDropdownOpen && (selectedType !== 'Extra' || clientSearch) && (
                                <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                                    {filteredClients.length > 0 ? (
                                        filteredClients.map(client => (
                                            <button
                                                key={client.id}
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, client_name: client.name });
                                                    setClientSearch(client.name);
                                                    setIsClientDropdownOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-primary hover:text-black transition-colors border-b border-zinc-800 last:border-0"
                                            >
                                                {client.name}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-xs flex flex-col gap-2">
                                            <span className="text-zinc-500 italic">Esse cliente não existe, registrar um novo?</span>
                                            {clientSearch && (
                                                <button
                                                    type="button"
                                                    onClick={handleQuickRegisterClient}
                                                    className="w-full text-left px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors font-semibold flex items-center gap-2"
                                                >
                                                    <UserPlus size={14} />
                                                    Cadastrar &quot;{clientSearch}&quot;
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="w-1/3">
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Processo #</label>
                        <input
                            required={selectedType !== 'Extra'}
                            type="text"
                            placeholder="Número do Processo"
                            value={formData.process_number}
                            onChange={(e) => setFormData({ ...formData, process_number: e.target.value })}
                            className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-primary outline-none"
                        />
                    </div>
                </div>

                {/* Task Description */}
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Descrição / Observações</label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 text-zinc-600 w-4 h-4" />
                        <input
                            required={selectedType !== 'Extra'}
                            type="text"
                            placeholder="Descreva brevemente..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-black/50 border border-zinc-700 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm focus:border-primary outline-none"
                        />
                    </div>
                </div>

                {/* Time & Indicators */}
                <div className="flex gap-3 items-end">
                    {/* Time Input */}
                    <div className="w-[120px]">
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Tempo (Min)</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-3 text-zinc-600 w-4 h-4" />
                            <input
                                required
                                type="number"
                                placeholder="60"
                                value={formData.time_spent}
                                onChange={(e) => setFormData({ ...formData, time_spent: e.target.value })}
                                className="w-full bg-black/50 border border-zinc-700 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm focus:border-primary outline-none no-spinner"
                            />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-2">
                        {/* Date Indicator */}
                        <div className="bg-black/30 border border-zinc-800 rounded-lg p-2 flex items-center justify-between h-[34px]">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase px-1">Data</span>
                            <span className="text-xs font-black px-2 text-zinc-300">
                                {new Date(formData.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </span>
                        </div>

                        {/* Tier Indicator */}
                        <div className="bg-black/30 border border-zinc-800 rounded-lg p-2 flex items-center justify-between h-[34px]">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase px-1">Seu Tier</span>
                            <span className={`text-xs font-black px-2 py-0.5 rounded
                                ${targetUser.tier === 'Diamond' ? 'bg-blue-500/20 text-blue-400' :
                                    targetUser.tier === 'Gold' ? 'bg-primary/20 text-primary' :
                                        targetUser.tier === 'Silver' ? 'bg-zinc-400/20 text-zinc-400' : 'bg-red-400/20 text-red-100'}
                            `}>
                                {targetUser.tier} (×{TIER_MULTIPLIERS[targetUser.tier]})
                            </span>
                        </div>
                    </div>
                </div>

                {/* Dynamic Points Preview */}
                <div className="text-center py-3 bg-black/40 rounded-xl mt-1 border border-white/5 shadow-inner">
                    <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">Impacto no Ranking</span>
                    <div className="text-3xl font-black text-white flex items-center justify-center gap-2 mt-1">
                        {selectedType === 'Extra' ? (
                            <>
                                <span className={previewTotal < 0 ? 'text-red-500' : 'text-yellow-500'}>
                                    {previewTotal > 0 ? '+' : ''}{previewTotal}
                                </span>
                                <span className="text-xs font-bold text-zinc-600 uppercase">Pontos Fixos</span>
                            </>
                        ) : (
                            <>
                                <span className="text-zinc-600 text-lg">{previewBase}</span>
                                <span className="text-zinc-700 text-sm">×</span>
                                <span className="text-primary">{TIER_MULTIPLIERS[targetUser.tier]}</span>
                                <span className="text-zinc-700 text-sm">=</span>
                                <span className={`drop-shadow-[0_0_10px_rgba(255,215,0,0.3)] ${previewTotal === 0 ? 'text-zinc-600' : 'text-primary'}`}>
                                    {previewTotal}
                                </span>
                                <span className="text-xs font-bold text-zinc-600 uppercase">PTS</span>
                            </>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!formData.extra_type}
                    className="mt-2 w-full font-black text-black py-4 rounded-xl bg-primary hover:bg-yellow-400 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
                >
                    {isSuccess ? (
                        <>
                            <CheckCircle2 size={20} />
                            FEITO!
                        </>
                    ) : (
                        "CONFIRMAR REGISTRO"
                    )}
                </button>
            </form>
        </div>
    );
}
