"use client";

import { useGameStore } from "@/lib/store";
import { UserTier } from "@/lib/types";
import { ShieldCheck, Lock, Users, Medal, ChevronRight } from "lucide-react";
import { useState } from "react";

export function AdminPanel() {
    const { users, setTier } = useGameStore();
    const [password, setPassword] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === "admin") {
            setIsAuthenticated(true);
            setError("");
        } else {
            setError("Senha incorreta");
            setPassword("");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="w-full max-w-md bg-secondary border border-zinc-800 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                        <Lock className="text-zinc-600" size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Painel do <span className="text-primary">Administrador</span></h2>
                        <p className="text-zinc-500 text-xs font-medium uppercase mt-1">Acesso Restrito</p>
                    </div>

                    <form onSubmit={handleLogin} className="w-full space-y-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-center focus:border-primary outline-none transition-all font-mono"
                            />
                        </div>
                        {error && <p className="text-red-500 text-[10px] font-bold uppercase">{error}</p>}
                        <button
                            type="submit"
                            className="w-full bg-primary hover:bg-yellow-400 text-black font-black py-4 rounded-xl transition-all shadow-lg active:scale-95"
                        >
                            ENTRAR NO SISTEMA
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800 shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                        <ShieldCheck className="text-primary" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight italic">Gestão de <span className="text-primary">Associados</span></h2>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Controle de Hierarquia e Tiers</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAuthenticated(false)}
                    className="text-zinc-600 hover:text-white text-[10px] font-bold uppercase tracking-widest"
                >
                    Sair
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map((user) => (
                    <div key={user.id} className="bg-secondary border border-zinc-800 p-6 rounded-2xl flex items-center justify-between group hover:border-zinc-700 transition-all">
                        <div className="flex items-center gap-4">
                            <img src={user.avatar_url} className="w-12 h-12 rounded-full border-2 border-zinc-800 group-hover:border-primary/50 transition-all" alt="" />
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-wide">{user.full_name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`text-[9px] font-black px-2 py-0.5 rounded uppercase
                                        ${user.tier === 'Diamond' ? 'bg-blue-500/20 text-blue-400' :
                                            user.tier === 'Gold' ? 'bg-primary/20 text-primary' :
                                                user.tier === 'Silver' ? 'bg-zinc-400/20 text-zinc-400' : 'bg-red-400/20 text-red-100'}
                                    `}>
                                        {user.tier}
                                    </div>
                                    <span className="text-[10px] text-zinc-600 font-mono">@{user.username}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-bold text-zinc-600 uppercase mb-1 ml-1">Alterar Tier</label>
                            <select
                                value={user.tier}
                                onChange={(e) => setTier(user.id, e.target.value as UserTier)}
                                className="bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-primary outline-none cursor-pointer appearance-none text-center min-w-[100px]"
                            >
                                <option value="Bronze">Bronze</option>
                                <option value="Silver">Silver</option>
                                <option value="Gold">Gold</option>
                                <option value="Diamond">Diamond</option>
                            </select>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl">
                <div className="flex gap-4">
                    <Medal className="text-primary flex-shrink-0" size={24} />
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                        <strong className="text-primary uppercase block mb-1">Nota do Administrador:</strong>
                        A alteração do Tier de um associado afeta instantaneamente o multiplicador de pontos para todas as atividades registradas por ele a partir de agora. O histórico de pontos já acumulados permanece com o multiplicador do momento em que a atividade foi salva.
                    </p>
                </div>
            </div>
        </div>
    );
}
