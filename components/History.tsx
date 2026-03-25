"use client";

import { useGameStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { MonthSelector } from "./MonthSelector";
import { useState } from "react";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Clock, Briefcase, Activity, Trash2, Filter, Edit2, Building2, X, Save } from "lucide-react";
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
    const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);

    // Filter logs for the selected month and user
    const filteredLogs = logs.filter(log => {
        const monthMatch = selectedMonth === 'all' || log.date.startsWith(selectedMonth);
        const userMatch = !selectedUserId || log.user_id === selectedUserId;
        return monthMatch && userMatch;
    });

    // Sort logs by date (newest first)
    const sortedLogs = [...filteredLogs].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const getUser = (userId: string) => users.find(u => u.id === userId);

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
                extra_type: editingLog.extra_type
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
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-zinc-800 rounded-xl">
                            <Activity className="text-zinc-400" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-white uppercase tracking-tight">
                            Histórico de Atividades
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <MonthSelector />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                        <Filter size={14} />
                        Filtrar por Associado:
                    </div>
                    <div className="flex overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap gap-2 scrollbar-thin scrollbar-thumb-zinc-800 w-full sm:w-auto">
                        <button
                            onClick={() => setSelectedUserId(null)}
                            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${!selectedUserId ? 'bg-primary border-primary text-black shadow-lg shadow-primary/20' : 'bg-black/40 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'}`}
                        >
                            TODOS
                        </button>
                        {users.map((u) => (
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
            </div>

            {/* List */}
            <div className="flex flex-col gap-3">
                {sortedLogs.length === 0 ? (
                    <div className="text-center py-12 bg-secondary border border-zinc-800 rounded-3xl">
                        <p className="text-zinc-500 italic">Nenhuma atividade registrada em {selectedMonth}.</p>
                    </div>
                ) : (
                    sortedLogs.map((log) => {
                        const user = getUser(log.user_id);
                        if (!user) return null;

                        return (
                            <div
                                key={log.id}
                                className="bg-secondary border border-zinc-800/50 hover:border-zinc-700 p-4 sm:p-5 rounded-2xl grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] gap-x-4 gap-y-3 sm:gap-x-5 items-start sm:items-center transition-all hover:bg-zinc-900/80 group relative"
                            >
                                {/* Date Badge */}
                                <div className="flex flex-col items-center justify-center bg-black/40 border border-zinc-800 rounded-xl p-2 sm:p-3 w-[65px] sm:w-[70px] flex-shrink-0 self-start sm:self-center">
                                    <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase leading-none mb-1">
                                        {new Date(log.created_at || log.date + "T12:00:00").toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                                    </span>
                                    <span className="text-xl sm:text-2xl font-black text-white leading-none">
                                        {new Date(log.created_at || log.date + "T12:00:00").getDate().toString().padStart(2, '0')}
                                    </span>
                                    {log.created_at && (
                                        <span className="text-[8px] sm:text-[10px] text-zinc-500 font-mono mt-1.5 leading-none">
                                            {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
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
