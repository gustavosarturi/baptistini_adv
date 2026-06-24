"use client";

import { useGameStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { MonthSelector } from "./MonthSelector";
import { useState, useMemo, useRef, useEffect } from "react";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Clock, Briefcase, Activity, Trash2, Edit2, Building2, X, Save, Calendar, Award, Users, Search, ChevronDown, ChevronRight, Layers } from "lucide-react";
import { ActivityLog } from "@/lib/types";

function formatDuration(minutes: number) {
    if (!minutes || minutes <= 0) return "0 min";
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function History() {
    const { logs, users, selectedMonth, removeLog, clients, extraSettings } = useGameStore();
    const { role } = useAuth();
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);

    const [specificDate, setSpecificDate] = useState<string>("");

    const [clientSearchQuery, setClientSearchQuery] = useState("");
    const [groupBy, setGroupBy] = useState<'none' | 'day' | 'week' | 'month'>('none');
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const clientDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
                setIsClientDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredClients = useMemo(() => {
        return clients.filter(c => c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()));
    }, [clients, clientSearchQuery]);

    // Filter logs for the selected month/date and user
    const filteredLogs = logs.filter(log => {
        const dateMatch = specificDate ? log.date === specificDate : (selectedMonth === 'all' || log.date.startsWith(selectedMonth));
        const userMatch = !selectedUserId || log.user_id === selectedUserId;
        const clientMatch = !selectedClient || log.client_name === selectedClient;
        return dateMatch && userMatch && clientMatch;
    });

    // Sort logs by date and created_at as a tiebreaker
    const sortedLogs = [...filteredLogs].sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff === 0 && a.created_at && b.created_at) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return dateDiff;
    });

    const getUser = (userId: string) => users.find(u => u.id === userId);

    const toggleGroup = (key: string) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

    const groupedLogs = useMemo(() => {
        if (groupBy === 'none') return { "all": sortedLogs };
        
        const groups: Record<string, typeof sortedLogs> = {};
        sortedLogs.forEach(log => {
            let key = "";
            const d = new Date(log.date + "T12:00:00");
            if (groupBy === 'day') {
                key = d.toLocaleDateString('pt-BR');
            } else if (groupBy === 'month') {
                key = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            } else if (groupBy === 'week') {
                const day = d.getDay(); 
                const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                const monday = new Date(d.setDate(diff));
                key = `Semana de ${monday.toLocaleDateString('pt-BR')}`;
            }
            if (!groups[key]) groups[key] = [];
            groups[key].push(log);
        });
        return groups;
    }, [sortedLogs, groupBy]);

    // --- KPIs ---
    const totalActivities = sortedLogs.length;
    const totalMinutes = sortedLogs.reduce((acc, log) => acc + log.time_spent, 0);

    const topUserStats = useMemo(() => {
        const stats: Record<string, { pts: number, acts: number }> = {};
        sortedLogs.forEach(log => {
            if (!stats[log.user_id]) stats[log.user_id] = { pts: 0, acts: 0 };
            stats[log.user_id].pts += log.final_points;
            stats[log.user_id].acts += 1;
        });
        const sorted = Object.entries(stats).sort((a, b) => b[1].pts - a[1].pts);
        return sorted.length > 0 ? sorted[0] : null;
    }, [sortedLogs]);

    const topClientStats = useMemo(() => {
        const stats: Record<string, number> = {};
        sortedLogs.forEach(log => {
            if (!log.client_name) return;
            stats[log.client_name] = (stats[log.client_name] || 0) + 1;
        });
        const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
        return sorted.length > 0 ? sorted[0] : null;
    }, [sortedLogs]);

    const topUser = topUserStats ? getUser(topUserStats[0]) : null;
    const topClientName = topClientStats ? topClientStats[0] : null;

    const handleDelete = async (logId: string) => {
        if (window.confirm("Tem certeza que deseja excluir este registro?")) {
            if (!db) return;
            try {
                removeLog(logId); // Optimistic remote
                await deleteDoc(doc(db, "activity_logs", logId));
            } catch (error) {
                console.error("Erro ao excluir log:", error);
                alert("Erro ao excluir. Tente novamente.");
            }
        }
    };

    const handleUpdateLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db || !editingLog) return;
        try {
            await updateDoc(doc(db, "activity_logs", editingLog.id), {
                description: editingLog.description?.trim(),
                client_name: editingLog.client_name,
                department: editingLog.department,
                extra_type: editingLog.extra_type,
                date: editingLog.date
            });
            setEditingLog(null);
        } catch (error) {
            console.error("Erro ao atualizar log:", error);
            alert("Erro ao atualizar. Tente novamente.");
        }
    };

    return (
        <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header & Filter */}
            <div className="flex flex-col gap-6 mb-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-zinc-800 rounded-xl">
                            <Activity className="text-zinc-400" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-white uppercase tracking-tight">
                            Histórico de Atividades
                        </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 justify-center">
                        <div className="flex items-center gap-2 bg-black/40 border border-zinc-800 rounded-lg px-2 h-[34px]">
                            <Calendar size={14} className="text-zinc-500" />
                            <input 
                                type="date"
                                value={specificDate}
                                onChange={(e) => setSpecificDate(e.target.value)}
                                className="bg-transparent text-xs text-zinc-300 font-bold outline-none [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]"
                                title="Filtrar por dia exato"
                            />
                            {specificDate && (
                                <button onClick={() => setSpecificDate("")} className="text-zinc-500 hover:text-white">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        {!specificDate && <MonthSelector />}
                        <div className="flex items-center gap-1 bg-black/40 border border-zinc-800 rounded-lg p-1">
                            <Layers size={14} className="text-zinc-500 ml-1" />
                            <select 
                                value={groupBy} 
                                onChange={(e) => setGroupBy(e.target.value as any)}
                                className="bg-transparent text-xs text-zinc-300 font-bold outline-none border-none py-1 px-2 cursor-pointer appearance-none"
                                title="Agrupar por"
                            >
                                <option value="none" className="bg-zinc-900">Lista Simples</option>
                                <option value="day" className="bg-zinc-900">Agrupar Dia</option>
                                <option value="week" className="bg-zinc-900">Agrupar Semana</option>
                                <option value="month" className="bg-zinc-900">Agrupar Mês</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* KPIs / Resumo */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                            <Activity size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Entregas</span>
                        </div>
                        <span className="text-2xl font-black text-white">{totalActivities}</span>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                            <Clock size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Horas</span>
                        </div>
                        <span className="text-2xl font-black text-primary">{formatDuration(totalMinutes)}</span>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                            <Award size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Destaque</span>
                        </div>
                        <span className="text-sm font-black text-white truncate" title={topUser?.full_name || "-"}>
                            {topUser ? topUser.full_name.split(' ')[0] : "-"}
                        </span>
                        {topUserStats && <span className="text-[10px] text-zinc-500 font-bold">{topUserStats[1].pts} pts</span>}
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                            <Briefcase size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Top Empresa</span>
                        </div>
                        <span className="text-sm font-black text-white truncate" title={topClientName || "-"}>
                            {topClientName || "-"}
                        </span>
                        {topClientStats && <span className="text-[10px] text-zinc-500 font-bold">{topClientStats[1]} itens</span>}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl animate-in fade-in slide-in-from-top-2">
                    {/* User Filter */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                            <Users size={14} />
                            Associado:
                        </div>
                        <div className="flex overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap gap-2 scrollbar-thin scrollbar-thumb-zinc-800 w-full sm:w-auto">
                            <button
                                onClick={() => setSelectedUserId(null)}
                                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${!selectedUserId ? 'bg-primary border-primary text-black shadow-lg shadow-primary/20' : 'bg-black/40 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'}`}
                            >
                                TODOS
                            </button>
                            {users.filter(u => !u.is_hidden).map((u) => (
                                <button
                                    key={u.id}
                                    onClick={() => setSelectedUserId(u.id)}
                                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedUserId === u.id ? 'bg-primary border-primary text-black shadow-lg shadow-primary/20' : 'bg-black/40 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'}`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || 'User')}&background=27272a&color=fff`} referrerPolicy="no-referrer" className="w-4 h-4 rounded-full object-cover" alt="" />
                                    {u.full_name.split(' ')[0]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Client Filter (Combobox) */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                            <Briefcase size={14} />
                            Empresa:
                        </div>
                        <div className="relative w-full max-w-sm" ref={clientDropdownRef}>
                            <div className={`
                                relative flex items-center gap-3 bg-black/40 border rounded-xl backdrop-blur-xl transition-all duration-300 px-3 py-2
                                ${isClientDropdownOpen ? 'border-primary shadow-[0_0_15px_rgba(255,229,0,0.1)]' : 'border-zinc-800 hover:border-zinc-700'}
                            `}>
                                <Search size={16} className={selectedClient ? 'text-primary' : 'text-zinc-500'} />
                                
                                <input
                                    type="text"
                                    placeholder="Buscar empresa..."
                                    className="flex-1 bg-transparent border-none outline-none text-white text-xs font-bold placeholder:text-zinc-600 placeholder:font-medium"
                                    value={selectedClient || clientSearchQuery}
                                    onChange={(e) => {
                                        if (selectedClient) setSelectedClient(null);
                                        setClientSearchQuery(e.target.value);
                                        setIsClientDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsClientDropdownOpen(true)}
                                />

                                {(selectedClient || clientSearchQuery) && (
                                    <button
                                        onClick={() => {
                                            setSelectedClient(null);
                                            setClientSearchQuery("");
                                            setIsClientDropdownOpen(false);
                                        }}
                                        className="p-1 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}

                                <div className="w-[1px] h-4 bg-zinc-800 mx-1" />

                                <button
                                    onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                                    className={`p-1 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-transform duration-300 ${isClientDropdownOpen ? 'rotate-180' : ''}`}
                                >
                                    <ChevronDown size={16} />
                                </button>
                            </div>

                            {/* Dropdown List */}
                            {isClientDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-[50] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="max-h-60 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800">
                                        <button
                                            onClick={() => {
                                                setSelectedClient(null);
                                                setClientSearchQuery("");
                                                setIsClientDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center group-hover:bg-primary transition-colors">
                                                    <Briefcase size={12} className="group-hover:text-black transition-colors text-zinc-500" />
                                                </div>
                                                <span className="text-xs font-bold text-zinc-400 group-hover:text-white">Todas as Empresas</span>
                                            </div>
                                            {!selectedClient && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                        </button>

                                        {filteredClients.length > 0 ? (
                                            filteredClients.map((c) => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => {
                                                        setSelectedClient(c.name);
                                                        setClientSearchQuery("");
                                                        setIsClientDropdownOpen(false);
                                                    }}
                                                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group text-left mt-1"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                                                            <Briefcase size={12} className="text-zinc-500 group-hover:text-white transition-colors" />
                                                        </div>
                                                        <span className="text-xs font-bold text-zinc-400 group-hover:text-white truncate max-w-[200px]">{c.name}</span>
                                                    </div>
                                                    {selectedClient === c.name && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-3 py-6 text-center text-zinc-600 italic text-[10px] uppercase tracking-widest">
                                                Nenhuma empresa encontrada
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            
            {/* List */}
            <div className="flex flex-col gap-4">
                {sortedLogs.length === 0 ? (
                    <div className="text-center py-12 bg-secondary border border-zinc-800 rounded-3xl">
                        <p className="text-zinc-500 italic">Nenhuma atividade encontrada.</p>
                    </div>
                ) : (
                    Object.entries(groupedLogs).map(([groupName, logsInGroup]) => {
                        const isGrouped = groupBy !== 'none';
                        const isOpen = isGrouped ? !!openGroups[groupName] : true;
                        
                        // Calculate Group KPIs
                        let groupPointsStats: Record<string, number> = {};
                        let groupClientStats: Record<string, number> = {};
                        let groupMinutes = 0;
                        
                        if (isGrouped) {
                            logsInGroup.forEach(log => {
                                groupPointsStats[log.user_id] = (groupPointsStats[log.user_id] || 0) + log.final_points;
                                if (log.client_name) groupClientStats[log.client_name] = (groupClientStats[log.client_name] || 0) + 1;
                                groupMinutes += log.time_spent;
                            });
                        }
                        
                        const topGroupUser = isGrouped ? Object.entries(groupPointsStats).sort((a,b) => b[1]-a[1])[0] : null;
                        const topGroupClient = isGrouped ? Object.entries(groupClientStats).sort((a,b) => b[1]-a[1])[0] : null;
                        const groupTopUserProfile = topGroupUser ? getUser(topGroupUser[0]) : null;

                        return (
                            <div key={groupName} className={`flex flex-col gap-2 ${isGrouped ? 'bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-2' : ''}`}>
                                
                                {/* Group Header */}
                                {isGrouped && (
                                    <button 
                                        onClick={() => toggleGroup(groupName)}
                                        className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl hover:bg-zinc-800/50 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            {isOpen ? <ChevronDown size={20} className="text-primary" /> : <ChevronRight size={20} className="text-zinc-500" />}
                                            <h3 className="text-lg font-black text-white uppercase tracking-tighter">{groupName}</h3>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-4 text-xs">
                                            <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-md border border-zinc-800">
                                                <Activity size={12} className="text-zinc-500" />
                                                <span className="font-bold text-white">{logsInGroup.length} <span className="text-zinc-500 font-normal">ativ</span></span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-md border border-zinc-800">
                                                <Clock size={12} className="text-zinc-500" />
                                                <span className="font-bold text-primary">{formatDuration(groupMinutes)}</span>
                                            </div>
                                            {groupTopUserProfile && (
                                                <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-md border border-zinc-800">
                                                    <Award size={12} className="text-yellow-500" />
                                                    <span className="font-bold text-white max-w-[100px] truncate">{groupTopUserProfile.full_name.split(' ')[0]}</span>
                                                </div>
                                            )}
                                            {topGroupClient && (
                                                <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-md border border-zinc-800">
                                                    <Briefcase size={12} className="text-blue-400" />
                                                    <span className="font-bold text-white max-w-[100px] truncate">{topGroupClient[0]}</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                )}

                                {/* Group Content */}
                                {isOpen && (
                                    <div className={`flex flex-col gap-3 ${isGrouped ? 'px-2 pb-2 mt-2' : ''}`}>
                                        {logsInGroup.map(log => {
                                            const user = getUser(log.user_id);
                                            if (!user || user.is_hidden) return null;

                                            return (
                                                <div
                                                    key={log.id}
                                                    className="bg-secondary border border-zinc-800/50 hover:border-zinc-700 p-4 sm:p-5 rounded-2xl grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] gap-x-4 gap-y-3 sm:gap-x-5 items-start sm:items-center transition-all hover:bg-zinc-900/80 group relative"
                                                >
                                                    {/* Date Badge */}
                                                    <div className="flex flex-col items-center justify-center bg-black/40 border border-zinc-800 rounded-xl p-2 sm:p-3 w-[65px] sm:w-[70px] flex-shrink-0 self-start sm:self-center">
                                                        <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase leading-none mb-1">
                                                            {new Date(log.date + "T12:00:00").toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                                                        </span>
                                                        <span className="text-xl sm:text-2xl font-black text-white leading-none">
                                                            {new Date(log.date + "T12:00:00").getDate().toString().padStart(2, '0')}
                                                        </span>
                                                    </div>

                                                    {/* User & Content */}
                                                    <div className="flex flex-col gap-1 w-full min-w-0">
                                                        {/* User Row */}
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=27272a&color=fff`}
                                                                alt={user.username}
                                                                referrerPolicy="no-referrer"
                                                                className="w-5 h-5 rounded-full object-cover border border-zinc-700"
                                                            />
                                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                                                                {user.full_name}
                                                            </span>
                                                        </div>

                                                        {/* Activity Type & Description */}
                                                        <h3 className="text-white text-sm sm:text-base font-bold leading-snug flex flex-wrap items-center gap-2">
                                                            {log.extra_type && (
                                                                <span className="text-primary bg-primary/10 px-2 py-0.5 rounded text-[9px] sm:text-[10px] uppercase tracking-tighter border border-primary/20">
                                                                    {log.extra_type}
                                                                </span>
                                                            )}
                                                            {log.description}
                                                            {role === 'admin' && (
                                                                <button 
                                                                    onClick={() => setEditingLog(log)}
                                                                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-primary transition-all ml-1"
                                                                    title="Editar registro"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>
                                                            )}
                                                        </h3>

                                                        {/* Meta Data */}
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1 text-[10px] sm:text-xs text-zinc-500 font-mono">
                                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                <Briefcase size={12} />
                                                                <span className="text-zinc-400 max-w-[120px] sm:max-w-none truncate">{log.client_name}</span>
                                                            </div>
                                                            {log.process_number && (
                                                                <span className="px-1.5 py-0.5 bg-zinc-900 rounded text-[9px] border border-zinc-800 flex-shrink-0">
                                                                    {log.process_number}
                                                                </span>
                                                            )}
                                                            {log.department && (
                                                                <div className="flex items-center gap-1.5 sm:border-l border-zinc-800 sm:pl-3 flex-shrink-0 border-l-0 pl-0">
                                                                    <Building2 size={12} className="text-purple-400" />
                                                                    <span className="text-purple-400/80 uppercase">{log.department}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1.5 sm:border-l border-zinc-800 sm:pl-3 flex-shrink-0 border-l-0 pl-0">
                                                                <Clock size={12} className="text-zinc-600" />
                                                                <span>{formatDuration(log.time_spent)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Score & Delete Badge */}
                                                    <div className="col-span-2 sm:col-span-1 flex flex-row sm:flex-col items-center gap-4 sm:gap-2 justify-between sm:justify-end sm:text-right border-t sm:border-t-0 sm:border-l border-zinc-800 pt-3 sm:pt-0 sm:pl-5 mt-1 sm:mt-0 relative w-full">
                                                        {role === 'admin' && (
                                                            <button
                                                                onClick={() => handleDelete(log.id)}
                                                                className="sm:absolute sm:-top-2 sm:-right-2 p-2 rounded-full text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
                                                                title="Excluir Registro"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                        <div className="flex flex-col items-end">
                                                            <span className={`text-xs font-bold uppercase py-0.5 px-2 rounded-full mb-1
                                                                ${log.complexity === 'Hard' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                                    log.complexity === 'Medium' ? 'bg-primary/10 text-primary border border-primary/20' :
                                                                        log.complexity === 'Extra' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                                                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'}
                                                            `}>
                                                                {log.complexity === 'Extra' ? 'Incentivo' : log.complexity}
                                                            </span>
                                                            <div className="text-xl font-black text-white">
                                                                {log.final_points > 0 ? '+' : ''}{log.final_points} <span className="text-[10px] text-zinc-600 font-normal">XP</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal de Edição (Admin) */}
            {editingLog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <form 
                        onSubmit={handleUpdateLog} 
                        className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-secondary">
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">
                                Editar <span className="text-primary">Registro</span>
                            </h3>
                            <button 
                                type="button" 
                                onClick={() => setEditingLog(null)}
                                className="p-2 text-zinc-500 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                            {/* Data */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                                    <Clock size={12} /> Data da Atividade
                                </label>
                                <input
                                    type="date"
                                    value={editingLog.date}
                                    onChange={(e) => setEditingLog({ ...editingLog, date: e.target.value })}
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none transition-colors [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]"
                                    required
                                />
                            </div>

                            {/* Cliente */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                                    <Briefcase size={12} /> Cliente
                                </label>
                                <select
                                    value={editingLog.client_name}
                                    onChange={(e) => setEditingLog({ ...editingLog, client_name: e.target.value })}
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none transition-colors"
                                    required
                                >
                                    <option value="" disabled>Selecione um cliente</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                    {/* Caso o cliente tenha sido apagado, mas ainda exista no log histórico: */}
                                    {!clients.find(c => c.name === editingLog.client_name) && (
                                        <option value={editingLog.client_name}>{editingLog.client_name} (Antigo)</option>
                                    )}
                                </select>
                            </div>

                            {/* Departamento */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                                    <Building2 size={12} /> Departamento
                                </label>
                                <select
                                    value={editingLog.department || ""}
                                    onChange={(e) => setEditingLog({ ...editingLog, department: e.target.value as ActivityLog["department"] })}
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none transition-colors"
                                >
                                    <option value="" disabled>Selecione um departamento</option>
                                    <option value="Consultivo">Consultivo</option>
                                    <option value="Operacional">Operacional</option>
                                    <option value="Comercial">Comercial</option>
                                    <option value="Estratégico">Estratégico</option>
                                    <option value="Marketing">Marketing</option>
                                </select>
                            </div>

                            {/* Tipo de Atividade */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                                    <Activity size={12} /> Tipo de Atividade
                                </label>
                                <select
                                    value={editingLog.extra_type || ""}
                                    onChange={(e) => setEditingLog({ ...editingLog, extra_type: e.target.value })}
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none transition-colors"
                                >
                                    <option value="">Nenhum / Atividade Genérica</option>
                                    {Object.entries(extraSettings).map(([key, item]) => (
                                        <option key={key} value={key}>{key} ({item.type})</option>
                                    ))}
                                    {/* Fallback caso a atividade não exista mais no extraSettings */}
                                    {editingLog.extra_type && !extraSettings[editingLog.extra_type] && (
                                        <option value={editingLog.extra_type}>{editingLog.extra_type} (Antipo)</option>
                                    )}
                                </select>
                            </div>

                            {/* Descrição */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                                    Descrição da Atividade
                                </label>
                                <textarea
                                    value={editingLog.description}
                                    onChange={(e) => setEditingLog({ ...editingLog, description: e.target.value })}
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none transition-colors resize-none h-24"
                                    placeholder="Detalhes sobre a atividade..."
                                    required
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-zinc-800 bg-secondary flex justify-end">
                            <button
                                type="submit"
                                className="px-6 py-2.5 bg-primary text-black font-black uppercase text-xs rounded-xl hover:bg-white transition-colors flex items-center gap-2 tracking-widest shadow-[0_0_20px_rgba(255,229,0,0.2)]"
                            >
                                <Save size={16} />
                                Salvar Alterações
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
