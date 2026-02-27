"use client";

import { useGameStore } from "@/lib/store";
import { Trophy, Medal, Star } from "lucide-react";

export function Leaderboard() {
    const { getLeaderboard, currentUser } = useGameStore();
    const leaderboard = getLeaderboard();
    const maxScore = leaderboard[0]?.score || 1; // Prevent division by zero

    return (
        <div className="w-full max-w-2xl bg-secondary border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                    <Trophy className="text-primary" size={28} />
                    Top Performances
                </h2>
                <div className="relative overflow-hidden px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                    <span className="relative z-10">ATUALIZAÇÃO EM TEMPO REAL</span>
                    <div className="absolute inset-0 w-full h-full bg-primary/20 animate-shine" />
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {leaderboard.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 italic">
                        Nenhuma atividade registrada neste mês.
                    </div>
                ) : (
                    leaderboard.map((entry, index) => {
                        const isCurrentUser = entry.user.id === currentUser?.id;
                        const progress = (entry.score / maxScore) * 100 || 5; // Min 5% for visual

                        return (
                            <div
                                key={entry.user.id}
                                className={`
                    relative flex items-center gap-4 p-4 rounded-xl transition-all
                    ${isCurrentUser
                                        ? 'bg-zinc-800/80 border border-primary/30 z-10 scale-[1.02] shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                                        : 'bg-black/40 border border-zinc-900 even:bg-black/60'}
                `}
                            >
                                {/* Rank */}
                                <div className="w-8 flex justify-center flex-shrink-0 font-black text-xl italic text-zinc-500">
                                    {index === 0 ? <Medal className="text-yellow-400" /> :
                                        index === 1 ? <Medal className="text-zinc-300" /> :
                                            index === 2 ? <Medal className="text-amber-700" /> :
                                                `#${index + 1}`}
                                </div>

                                {/* Avatar & Tier Badge */}
                                <div className="relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={entry.user.avatar_url}
                                        alt={entry.user.username}
                                        className={`
                        w-12 h-12 rounded-full border-2 object-cover bg-zinc-800
                        ${index === 0 ? 'border-yellow-400' : 'border-zinc-700'}
                    `}
                                    />
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold border border-black
                    ${entry.user.tier === 'Diamond' ? 'bg-cyan-400 text-black' :
                                            entry.user.tier === 'Gold' ? 'bg-yellow-400 text-black' :
                                                entry.user.tier === 'Silver' ? 'bg-zinc-300 text-black' : 'bg-amber-700 text-white'}
                    `}>
                                        {entry.user.tier[0]}
                                    </div>
                                </div>

                                {/* User Info */}
                                <div className="flex-1 z-10">
                                    <div className="flex justify-between items-end mb-1">
                                        <div className="flex flex-col">
                                            <span className={`font-bold text-sm ${isCurrentUser ? 'text-white' : 'text-zinc-300'}`}>
                                                {entry.user.full_name}
                                            </span>
                                            <span className="text-[10px] uppercase text-zinc-500 tracking-wider font-semibold">
                                                Associado {entry.user.tier}
                                            </span>
                                        </div>
                                        <span className="font-mono font-bold text-primary text-lg">
                                            {entry.score.toLocaleString()} <span className="text-xs text-zinc-500">PTS</span>
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden relative">
                                        <div
                                            className={`h-full absolute left-0 top-0 transition-all duration-1000 ease-out rounded-full ${index === 0 ? 'bg-gradient-to-r from-yellow-600 to-yellow-300' :
                                                'bg-zinc-600'
                                                }`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* High Score Badge */}
                                {index === 0 && (
                                    <div className="absolute top-0 right-0 p-2">
                                        <Star className="text-yellow-500/20 w-12 h-12 -rotate-12" />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Monthly Goal Marker */}
            <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-between text-xs text-zinc-500">
                <span>META MENSAL</span>
                <span className="text-primary font-bold">10,000 PTS</span>
            </div>
        </div>
    );
}
