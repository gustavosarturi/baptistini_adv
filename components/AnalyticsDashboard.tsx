"use client";

import { useGameStore } from "@/lib/store";
import { BarChart3, Clock, TrendingUp, Users, Activity, Award, Filter, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { MonthSelector } from "./MonthSelector";

export function AnalyticsDashboard() {
    const { logs, users, selectedMonth } = useGameStore();
    const [clientSortBy, setClientSortBy] = useState<'count' | 'time'>('count');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    // Filtrar logs pelo mês selecionado e opcionalmente por usuário selecionado
    const filteredLogs = useMemo(() => {
        let list = logs.filter(log => log.date.startsWith(selectedMonth));
        if (selectedUserId) {
            list = list.filter(l => l.user_id === selectedUserId);
        }
        return list;
    }, [logs, selectedMonth, selectedUserId]);

    // 1. Top Clientes
    const clientStats = useMemo(() => {
        const stats: Record<string, { count: number; time: number }> = {};
        filteredLogs.forEach(log => {
            if (!stats[log.client_name]) {
                stats[log.client_name] = { count: 0, time: 0 };
            }
            stats[log.client_name].count += 1;
            stats[log.client_name].time += log.time_spent;
        });

        return Object.entries(stats)
            .sort((a, b) => clientSortBy === 'count' ? b[1].count - a[1].count : b[1].time - a[1].time)
            .map(([name, data]) => ({ name, ...data }));
    }, [filteredLogs, clientSortBy]);

    // 2. Perfil de Carga (Gráfico de Rosca)
    const typeStats = useMemo(() => {
        const stats: Record<string, number> = { 'Light': 0, 'Medium': 0, 'Hard': 0, 'Extra': 0 };
        filteredLogs.forEach(log => {
            if (stats[log.complexity] !== undefined) {
                stats[log.complexity] += 1;
            } else if (log.complexity === 'Extra') {
                stats['Extra'] += 1;
            }
        });
        return stats;
    }, [filteredLogs]);

    // 3. Estatísticas de Tempo
    const totalMinutes = useMemo(() => {
        return filteredLogs.reduce((acc, log) => acc + log.time_spent, 0);
    }, [filteredLogs]);

    const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    // 4. Ranking de Usuários
    const userRankings = useMemo(() => {
        const rankings = users.map(user => {
            const score = logs
                .filter(l => l.date.startsWith(selectedMonth) && l.user_id === user.id)
                .reduce((acc, l) => acc + l.final_points, 0);
            return { user, score };
        });
        return rankings.sort((a, b) => b.score - a.score);
    }, [logs, selectedMonth, users]);

    const maxClientValue = Math.max(...clientStats.map(c => clientSortBy === 'count' ? c.count : c.time), 1);
    const totalLogs = filteredLogs.length || 1;

    const selectedUser = users.find(u => u.id === selectedUserId);

    return (
        <div className="w-full max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

            {/* Cabeçalho de Performance */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 bg-zinc-900/40 p-8 rounded-3xl border border-zinc-800 shadow-2xl backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-primary rounded-2xl shadow-[0_0_20px_rgba(255,229,0,0.3)]">
                            <TrendingUp className="text-black" size={32} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">ANÁLISE DE <span className="text-primary">PERFORMANCE</span></h2>
                            <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> DADOS ATUALIZADOS</span>
                                {selectedUserId && (
                                    <>
                                        <span>•</span>
                                        <button
                                            onClick={() => setSelectedUserId(null)}
                                            className="text-primary hover:underline cursor-pointer"
                                        >
                                            FILTRO: {selectedUser?.full_name} (X)
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Período de Análise</label>
                        <MonthSelector />
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 border-t md:border-t-0 md:border-l border-zinc-800 pt-6 md:pt-0 md:pl-8">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">Atividades</p>
                        <p className="text-2xl font-black text-white">{filteredLogs.length}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">Tempo Total</p>
                        <p className="text-2xl font-black text-primary">{formatTime(totalMinutes)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">Média Pts</p>
                        <p className="text-2xl font-black text-white">
                            {filteredLogs.length ? (filteredLogs.reduce((a, b) => a + b.final_points, 0) / filteredLogs.length).toFixed(1) : 0}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">Status</p>
                        <p className="text-2xl font-black text-green-500">ATIVO</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* 1. Top Clientes com Scroll e Ordenação */}
                <div className="lg:col-span-2 bg-secondary border border-zinc-800 rounded-3xl p-8 shadow-xl flex flex-col">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <Users className="text-primary" size={20} />
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Top Clientes</h3>
                        </div>

                        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-zinc-800">
                            <button
                                onClick={() => setClientSortBy('count')}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${clientSortBy === 'count' ? 'bg-primary text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Qtd. Atividades
                            </button>
                            <button
                                onClick={() => setClientSortBy('time')}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${clientSortBy === 'time' ? 'bg-primary text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Tempo Total
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                        {clientStats.map((client, idx) => (
                            <div key={idx} className="group flex flex-col gap-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-zinc-300 group-hover:text-primary transition-colors uppercase tracking-wide">
                                        {client.name}
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-mono text-zinc-500">{formatTime(client.time)}</span>
                                        <span className="text-sm font-black text-white">{client.count} ATIVIDADES</span>
                                    </div>
                                </div>
                                <div className="h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary to-yellow-600 transition-all duration-1000 ease-out"
                                        style={{ width: `${((clientSortBy === 'count' ? client.count : client.time) / maxClientValue) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {clientStats.length === 0 && (
                            <div className="py-20 text-center text-zinc-600 italic uppercase text-xs tracking-widest">
                                Nenhum dado disponível para este período
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Perfil de Carga (Gráfico de Rosca com Cores Corretas) */}
                <div className="bg-secondary border border-zinc-800 rounded-3xl p-8 shadow-xl">
                    <div className="flex items-center gap-3 mb-8">
                        <Activity className="text-primary" size={20} />
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Perfil de Atividade</h3>
                    </div>

                    <div className="flex flex-col items-center justify-center space-y-8 h-full pb-8">
                        <div className="relative w-48 h-48">
                            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                                {(['Light', 'Medium', 'Hard', 'Extra'] as const).reduce((acc, type) => {
                                    const count = typeStats[type];
                                    if (count === 0) return acc;

                                    const percent = (count / totalLogs) * 100;
                                    const colors = { Light: '#60a5fa', Medium: '#facc15', Hard: '#ef4444', Extra: '#8b5cf6' };
                                    const strokeDasharray = `${percent} 100`;
                                    const strokeDashoffset = -acc.offset;

                                    const circle = (
                                        <circle
                                            key={type}
                                            cx="50" cy="50" r="40"
                                            fill="transparent"
                                            stroke={colors[type]}
                                            strokeWidth="15"
                                            strokeDasharray={strokeDasharray}
                                            strokeDashoffset={strokeDashoffset}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000"
                                        />
                                    );

                                    return {
                                        offset: acc.offset + percent,
                                        elements: [...acc.elements, circle]
                                    };
                                }, { offset: 0, elements: [] as JSX.Element[] }).elements}
                                <circle cx="50" cy="50" r="32" fill="#09090b" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-white">{totalLogs === 1 && filteredLogs.length === 0 ? 0 : filteredLogs.length}</span>
                                <span className="text-[8px] font-bold text-zinc-500 uppercase">TOTAL</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            {[
                                { label: 'Light', color: 'bg-blue-400', val: typeStats.Light },
                                { label: 'Medium', color: 'bg-yellow-400', val: typeStats.Medium },
                                { label: 'Hard', color: 'bg-red-500', val: typeStats.Hard },
                                { label: 'Incentivos', color: 'bg-purple-500', val: typeStats.Extra },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase leading-none">{item.label}</span>
                                        <span className="text-xs font-black text-white">{item.val}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Ranking com Filtro por Usuário */}
                <div className="lg:col-span-3 bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative">
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <Award className="text-primary" size={24} />
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Ranking de <span className="text-primary">Performance</span></h3>
                        </div>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest hidden sm:block">Clique no associado para filtrar os dados</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                        {userRankings.map((rank, i) => (
                            <button
                                key={rank.user.id}
                                onClick={() => setSelectedUserId(selectedUserId === rank.user.id ? null : rank.user.id)}
                                className={`p-6 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-95 duration-300 group
                                    ${selectedUserId === rank.user.id ? 'border-primary bg-primary/20 ring-2 ring-primary/20' :
                                        i === 0 ? 'bg-primary/5 border-primary/40 shadow-[0_0_20px_rgba(255,229,0,0.05)]' : 'bg-zinc-900/40 border-zinc-800'}
                                `}
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="relative">
                                        <img src={rank.user.avatar_url} className={`w-12 h-12 rounded-full border-2 transition-all ${selectedUserId === rank.user.id ? 'border-primary grayscale-0' : 'border-zinc-700 grayscale group-hover:grayscale-0'}`} alt="" />
                                        {i === 0 && <div className="absolute -top-2 -right-2 bg-primary text-black text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg animate-bounce">#1</div>}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-white uppercase truncate w-24">{rank.user.full_name}</p>
                                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{rank.user.tier}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase">Pontuação Acumulada</p>
                                    <div className="flex items-end gap-1">
                                        <p className={`text-2xl font-black ${i === 0 || selectedUserId === rank.user.id ? 'text-primary' : 'text-white'}`}>{rank.score}</p>
                                        <p className="text-[10px] font-bold text-zinc-600 mb-1">PTS</p>
                                    </div>
                                </div>
                                <div className="mt-4 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-1000 ${selectedUserId === rank.user.id ? 'bg-white' : 'bg-primary'}`} style={{ width: `${(rank.score / (userRankings[0]?.score || 1)) * 100}%` }} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
