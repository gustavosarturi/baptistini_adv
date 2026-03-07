"use client";

import { useGameStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { MonthSelector } from "./MonthSelector";
import { Clock, Briefcase, Activity, Trash2, Filter } from "lucide-react";
import { useState } from "react";

export function History() {
    const { logs, users, selectedMonth, removeLog } = useGameStore();
    const { role } = useAuth();
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

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

    const handleDelete = (logId: string) => {
        if (window.confirm("Tem certeza que deseja excluir este registro?")) {
            removeLog(logId);
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

                {role === 'admin' && (
                    <div className="flex flex-wrap items-center gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-wider mr-2">
                            <Filter size={14} />
                            Filtrar por Associado:
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedUserId(null)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${!selectedUserId ? 'bg-primary border-primary text-black shadow-lg shadow-primary/20' : 'bg-black/40 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'}`}
                            >
                                TODOS
                            </button>
                            {users.map((u) => (
                                <button
                                    key={u.id}
                                    onClick={() => setSelectedUserId(u.id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedUserId === u.id ? 'bg-primary border-primary text-black shadow-lg shadow-primary/20' : 'bg-black/40 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'}`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={u.avatar_url} className="w-4 h-4 rounded-full object-cover" alt="" />
                                    {u.full_name.split(' ')[0]}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
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
                                className="bg-secondary border border-zinc-800/50 hover:border-zinc-700 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-5 transition-all hover:bg-zinc-900/80 group"
                            >
                                {/* Date Badge */}
                                <div className="flex flex-col items-center bg-black/40 border border-zinc-800 rounded-xl p-3 min-w-[70px]">
                                    <span className="text-xs font-bold text-zinc-500 uppercase">
                                        {new Date(log.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                                    </span>
                                    <span className="text-2xl font-black text-white">
                                        {new Date(log.date).getDate()}
                                    </span>
                                </div>

                                {/* User & Content */}
                                <div className="flex-1 flex flex-col gap-1 w-full">
                                    {/* User Row */}
                                    <div className="flex items-center gap-2 mb-1">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={user.avatar_url}
                                            alt={user.username}
                                            className="w-5 h-5 rounded-full object-cover border border-zinc-700"
                                        />
                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                                            {user.full_name}
                                        </span>
                                    </div>

                                    {/* Activity Type & Description */}
                                    <h3 className="text-white font-bold leading-snug flex items-center gap-2">
                                        {log.extra_type && (
                                            <span className="text-primary bg-primary/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-tighter border border-primary/20">
                                                {log.extra_type}
                                            </span>
                                        )}
                                        {log.description}
                                    </h3>

                                    {/* Meta Data */}
                                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-zinc-500 font-mono">
                                        <div className="flex items-center gap-1.5">
                                            <Briefcase size={12} />
                                            <span className="text-zinc-400">{log.client_name}</span>
                                        </div>
                                        {log.process_number && (
                                            <span className="px-1.5 py-0.5 bg-zinc-900 rounded text-[10px] border border-zinc-800">
                                                {log.process_number}
                                            </span>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={12} />
                                            <span>{log.time_spent} min</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Score & Delete Badge */}
                                <div className="flex flex-row sm:flex-col items-center gap-4 sm:gap-2 min-w-[100px] justify-end sm:text-right w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-zinc-800 pt-3 sm:pt-0 sm:pl-5 mt-2 sm:mt-0 relative">

                                    <button
                                        onClick={() => handleDelete(log.id)}
                                        className="sm:absolute sm:-top-2 sm:-right-2 p-2 rounded-full text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
                                        title="Excluir Registro"
                                    >
                                        <Trash2 size={16} />
                                    </button>

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
        </div>
    );
}
