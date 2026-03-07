"use client";

import { useGameStore } from "@/lib/store";
import { Clock, CreditCard } from "lucide-react";

export function ActivityFeed() {
    const { logs, users } = useGameStore();

    // Sort logs by newest first
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    return (
        <div className="w-full bg-secondary bg-opacity-50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-zinc-400 font-bold uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
                <Clock size={16} />
                Atividades Recentes
            </h3>

            <div className="flex flex-col gap-0">
                {sortedLogs.map((log) => {
                    const user = users.find(u => u.id === log.user_id);
                    const date = new Date(log.date + "T12:00:00"); // Add time to avoid TZ issues

                    return (
                        <div key={log.id} className="group flex items-start gap-4 py-4 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/50 transition-colors px-2 rounded-lg">

                            {/* Date Block */}
                            <div className="flex flex-col items-center min-w-[50px] text-zinc-500">
                                <span className="text-xs font-bold uppercase">
                                    {date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').slice(0, 3)}
                                </span>
                                <span className="text-xl font-black text-zinc-300">
                                    {date.getDate().toString().padStart(2, '0')}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-white text-sm truncate">{log.client_name}</span>
                                    {log.process_number && (
                                        <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-700">
                                            {log.process_number}
                                        </span>
                                    )}
                                </div>
                                <p className="text-zinc-400 text-sm truncate">{log.description}</p>
                                <div className="flex items-center gap-2 mt-2 text-xs">
                                    <span className="text-zinc-600 flex items-center gap-1">
                                        <CreditCard size={10} /> {user?.full_name?.split(' ')[0]}
                                    </span>
                                    <span className={`
                    px-1.5 rounded text-[10px] font-bold border
                    ${log.complexity === 'Hard' ? 'text-red-400 border-red-900 bg-red-900/10' :
                                            log.complexity === 'Medium' ? 'text-yellow-400 border-yellow-900 bg-yellow-900/10' :
                                                'text-blue-400 border-blue-900 bg-blue-900/10'}
                  `}>
                                        {log.complexity}
                                    </span>
                                </div>
                            </div>

                            {/* Points */}
                            <div className="text-right">
                                <div className="font-mono font-bold text-green-400">+{log.final_points}</div>
                                <div className="text-[10px] text-zinc-600">PTS</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {logs.length === 0 && (
                <div className="text-center py-8 text-zinc-600 text-sm italic">
                    Nenhuma atividade registrada ainda.
                </div>
            )}
        </div>
    );
}
