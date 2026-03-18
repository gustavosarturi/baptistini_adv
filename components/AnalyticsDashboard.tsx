"use client";

import { useGameStore } from "@/lib/store";
import { Clock, TrendingUp, Users, Activity, Award, Filter, Search, X, ChevronDown } from "lucide-react";
import { useMemo, useState, useRef, useEffect } from "react";
import { MonthSelector } from "./MonthSelector";

export function AnalyticsDashboard() {
    const { logs, users, selectedMonth, extraSettings } = useGameStore();
    const [clientSortBy, setClientSortBy] = useState<'count' | 'time'>('count');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Listar todas as atividades únicas presentes nos logs ou configurações
    const activityOptions = useMemo(() => {
        const fromLogs = logs.map(l => l.extra_type).filter((t): t is string => !!t);
        const fromSettings = Object.keys(extraSettings);
        return Array.from(new Set([...fromLogs, ...fromSettings])).sort();
    }, [logs, extraSettings]);

    const filteredOptions = useMemo(() => {
        return activityOptions.filter(option =>
            option.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [activityOptions, searchQuery]);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filtrar logs pelo mês selecionado, usuário e atividade
    const filteredLogs = useMemo(() => {
        let list = logs;

        // Só aplicamos filtro de mês se não "all"
        if (selectedMonth !== "all") {
            list = list.filter(log => log.date.startsWith(selectedMonth));
        }

        if (selectedUserId) {
            list = list.filter(l => l.user_id === selectedUserId);
        }

        if (selectedActivity) {
            list = list.filter(l => l.extra_type === selectedActivity);
        }

        if (selectedDepartment) {
            list = list.filter(l => l.department === selectedDepartment);
        }

        return list;
    }, [logs, selectedMonth, selectedUserId, selectedActivity, selectedDepartment]);

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

    // 3. Estatísticas de Atividade (Por Tempo e Frequência)
    const activityStats = useMemo(() => {
        const stats: Record<string, { count: number; time: number }> = {};
        filteredLogs.forEach(log => {
            const key = log.extra_type || 'Geral';
            if (!stats[key]) stats[key] = { count: 0, time: 0 };
            stats[key].count += 1;
            stats[key].time += log.time_spent;
        });

        const sortedByTime = Object.entries(stats)
            .sort((a, b) => b[1].time - a[1].time)
            .slice(0, 8);

        const sortedByFrequency = Object.entries(stats)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 8);

        return { sortedByTime, sortedByFrequency };
    }, [filteredLogs]);


    const maxActivityTime = useMemo(() => {
        const times = Object.values(activityStats.sortedByTime).map(s => s[1].time);
        return Math.max(...times, 1);
    }, [activityStats]);

    // 4. Evolução Mensal de Horas (Nova)
    const monthlyHoursStats = useMemo(() => {
        const stats: Record<string, number> = {};

        // Filtramos apenas por usuário e atividade para o gráfico histórico
        let historyLogs = logs;
        if (selectedUserId) historyLogs = historyLogs.filter(l => l.user_id === selectedUserId);
        if (selectedActivity) historyLogs = historyLogs.filter(l => l.extra_type === selectedActivity);
        if (selectedDepartment) historyLogs = historyLogs.filter(l => l.department === selectedDepartment);

        historyLogs.forEach(log => {
            const month = log.date.slice(0, 7);
            stats[month] = (stats[month] || 0) + log.time_spent;
        });

        return Object.entries(stats)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-6); // Últimos 6 meses
    }, [logs, selectedUserId, selectedActivity]);

    const totalMinutes = useMemo(() => {
        return filteredLogs.reduce((acc, log) => acc + log.time_spent, 0);
    }, [filteredLogs]);

    const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    const userRankings = useMemo(() => {
        const rankings = users.map(user => {
            const score = logs
                .filter(l => {
                    const monthMatch = selectedMonth === 'all' || l.date.startsWith(selectedMonth);
                    const activityMatch = !selectedActivity || l.extra_type === selectedActivity;
                    const deptMatch = !selectedDepartment || l.department === selectedDepartment;
                    return monthMatch && l.user_id === user.id && activityMatch && deptMatch;
                })
                .reduce((acc, l) => acc + l.final_points, 0);
            return { user, score };
        });
        return rankings.sort((a, b) => b.score - a.score);
    }, [logs, selectedMonth, users, selectedActivity, selectedDepartment]);

    const maxClientValue = Math.max(...clientStats.map(c => clientSortBy === 'count' ? c.count : c.time), 1);
    const maxActivityFreq = Math.max(...activityStats.sortedByFrequency.map(s => s[1].count), 1);
    const maxMonthlyHours = Math.max(...monthlyHoursStats.map(s => s[1]), 1);
    const totalLogs = filteredLogs.length || 1;

    const selectedUser = users.find(u => u.id === selectedUserId);

    return (
        <div className="w-full max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

            {/* Cabeçalho de Performance */}
            <div className="flex flex-col gap-8 bg-zinc-900/40 p-8 rounded-3xl border border-zinc-800 shadow-2xl backdrop-blur-sm">
                
                {/* Linha 1: Titulo e Filtros */}
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-primary rounded-2xl shadow-[0_0_20px_rgba(255,229,0,0.3)]">
                            <TrendingUp className="text-black" size={32} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">ANÁLISE DE <span className="text-primary">PERFORMANCE</span></h2>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> DADOS ATUALIZADOS</span>

                                {selectedUserId && (
                                    <button
                                        onClick={() => setSelectedUserId(null)}
                                        className="text-primary hover:underline cursor-pointer flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded"
                                    >
                                        FILTRO: {selectedUser?.full_name} (X)
                                    </button>
                                )}

                                {selectedActivity && (
                                    <button
                                        onClick={() => setSelectedActivity(null)}
                                        className="text-blue-400 hover:underline cursor-pointer flex items-center gap-1 bg-blue-400/10 px-2 py-0.5 rounded"
                                    >
                                        ATIVIDADE: {selectedActivity} (X)
                                    </button>
                                )}

                                {selectedDepartment && (
                                    <button
                                        onClick={() => setSelectedDepartment(null)}
                                        className="text-purple-400 hover:underline cursor-pointer flex items-center gap-1 bg-purple-400/10 px-2 py-0.5 rounded"
                                    >
                                        DEPTO: {selectedDepartment} (X)
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Depto</label>
                            <select
                                value={selectedDepartment || ""}
                                onChange={(e) => setSelectedDepartment(e.target.value || null)}
                                className="bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs focus:border-primary outline-none cursor-pointer transition-all"
                            >
                                <option value="">Todos</option>
                                <option value="Consultivo">Consultivo</option>
                                <option value="Operacional">Operacional</option>
                                <option value="Comercial">Comercial</option>
                                <option value="Estratégico">Estratégico</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Período de Análise</label>
                            <MonthSelector />
                        </div>
                    </div>
                </div>

                {/* Linha 2: Estatísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-zinc-800 pt-6">
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

            {/* Filtro por Atividade (Barra de Pesquisa) */}
            <div className="relative w-full max-w-2xl mx-auto" ref={dropdownRef}>
                <div className="relative group">
                    <div className={`absolute inset-0 bg-primary/20 rounded-2xl blur-xl transition-all duration-500 scale-90 ${isDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0'}`} />

                    <div className={`
                        relative flex items-center gap-4 bg-zinc-900/80 border p-4 rounded-2xl backdrop-blur-xl transition-all duration-300
                        ${isDropdownOpen ? 'border-primary shadow-[0_0_30px_rgba(255,229,0,0.1)]' : 'border-zinc-800 hover:border-zinc-700'}
                    `}>
                        <Search size={20} className={selectedActivity ? 'text-primary' : 'text-zinc-500'} />

                        <input
                            type="text"
                            placeholder="Pesquisar atividade..."
                            className="flex-1 bg-transparent border-none outline-none text-white font-bold placeholder:text-zinc-600 placeholder:font-medium"
                            value={selectedActivity || searchQuery}
                            onChange={(e) => {
                                if (selectedActivity) setSelectedActivity(null);
                                setSearchQuery(e.target.value);
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                        />

                        {(selectedActivity || searchQuery) && (
                            <button
                                onClick={() => {
                                    setSelectedActivity(null);
                                    setSearchQuery("");
                                    setIsDropdownOpen(false);
                                }}
                                className="p-1 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        )}

                        <div className="w-[1px] h-6 bg-zinc-800 mx-1" />

                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`p-1 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                        >
                            <ChevronDown size={20} />
                        </button>
                    </div>

                    {/* Dropdown de Sugestões */}
                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="max-h-64 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800">
                                <button
                                    onClick={() => {
                                        setSelectedActivity(null);
                                        setSearchQuery("");
                                        setIsDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-primary transition-colors">
                                            <Filter size={14} className="group-hover:text-black transition-colors" />
                                        </div>
                                        <span className="text-sm font-bold text-zinc-400 group-hover:text-white">Todas as Atividades</span>
                                    </div>
                                    {!selectedActivity && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                </button>

                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => {
                                                setSelectedActivity(option);
                                                setSearchQuery("");
                                                setIsDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                                                    <Activity size={14} className="group-hover:text-white transition-colors" />
                                                </div>
                                                <span className="text-sm font-bold text-zinc-400 group-hover:text-white">{option}</span>
                                            </div>
                                            {selectedActivity === option && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-8 text-center text-zinc-600 italic text-xs uppercase tracking-widest">
                                        Nenhuma atividade encontrada
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Grafico Mensal de Horas (Novo) */}
                <div className="lg:col-span-3 bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <Clock className="text-primary" size={20} />
                            <h3 className="text-lg font-black text-white uppercase tracking-tight italic">Evolução de Horas <span className="text-primary">Mês a Mês</span></h3>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500">
                            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> HISTÓRICO</div>
                        </div>
                    </div>

                    <div className="h-[200px] flex items-end gap-2 sm:gap-4 px-2">
                        {monthlyHoursStats.length > 0 ? monthlyHoursStats.map(([month, minutes]) => (
                            <div key={month} className="flex-1 flex flex-col items-center gap-4 group">
                                <div className="w-full relative flex flex-col items-center">
                                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-[10px] font-bold text-white px-2 py-1 rounded pointer-events-none z-10 whitespace-nowrap">
                                        {formatTime(minutes)}
                                    </div>
                                    <div
                                        className="w-full bg-gradient-to-t from-zinc-800 to-primary/80 rounded-t-lg group-hover:to-primary transition-all duration-700 ease-out relative"
                                        style={{ height: `${(minutes / maxMonthlyHours) * 160 + 10}px` }}
                                    >
                                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                                <div className="text-[10px] font-black text-zinc-500 group-hover:text-white transition-colors uppercase">
                                    {new Date(month + "-02").toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                                </div>
                            </div>
                        )) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600 italic uppercase text-xs">
                                Sem dados históricos suficientes
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Clientes com Scroll e Ordenação */}
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
                                        <span className={`font-mono transition-all ${clientSortBy === 'time' ? 'text-sm font-black text-white' : 'text-[10px] text-zinc-500'}`}>
                                            {formatTime(client.time)}
                                        </span>
                                        <span className={`font-black uppercase transition-all ${clientSortBy === 'count' ? 'text-sm text-white' : 'text-[10px] text-zinc-500'}`}>
                                            {client.count} ATIVIDADES
                                        </span>
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

                {/* Perfil de Carga (Gráfico de Rosca) */}
                <div className="bg-secondary border border-zinc-800 rounded-3xl p-8 shadow-xl">
                    <div className="flex items-center gap-3 mb-8">
                        <Activity className="text-primary" size={20} />
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Perfil de Complexidade</h3>
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

                {/* 5. Rank de Atividades (Pontos e Frequência) */}
                <div className="lg:col-span-3 bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-12">
                    
                    {/* Atividades por Tempo */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Clock className="text-primary" size={20} />
                            <h3 className="text-lg font-black text-white uppercase tracking-tight italic">Atividades com <span className="text-primary">Mais Tempo Gasto</span></h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activityStats.sortedByTime.length > 0 ? activityStats.sortedByTime.map(([name, data]) => (
                                <div key={name} className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4 hover:border-primary/30 transition-colors group">
                                    <div className="flex justify-between items-end mb-2">
                                        <h4 className="text-xs font-bold text-zinc-300 truncate w-2/3 group-hover:text-white transition-colors">{name}</h4>
                                        <span className="text-xs font-black text-primary uppercase">{formatTime(data.time)}</span>
                                    </div>
                                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-primary transition-all duration-1000 ease-out"
                                            style={{ width: `${(data.time / maxActivityTime) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-2 py-8 text-center text-zinc-600 italic uppercase text-xs">Sem dados</div>
                            )}
                        </div>
                    </section>

                    {/* Atividades por Frequência */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Activity className="text-blue-400" size={20} />
                            <h3 className="text-lg font-black text-white uppercase tracking-tight italic">Atividades <span className="text-blue-400">Mais Frequentes</span></h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activityStats.sortedByFrequency.length > 0 ? activityStats.sortedByFrequency.map(([name, data]) => (
                                <div key={name} className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4 hover:border-blue-400/30 transition-colors group">
                                    <div className="flex justify-between items-end mb-2">
                                        <h4 className="text-xs font-bold text-zinc-300 truncate w-2/3 group-hover:text-white transition-colors">{name}</h4>
                                        <span className="text-xs font-black text-blue-400 uppercase">{data.count}x</span>
                                    </div>
                                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                                            style={{ width: `${(data.count / maxActivityFreq) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-2 py-8 text-center text-zinc-600 italic uppercase text-xs">Sem dados</div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Ranking com Filtro por Usuário */}
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
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
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
