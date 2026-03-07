"use client";

import { useAuth } from "@/lib/auth-context";
import { Trophy, LogIn } from "lucide-react";

export function Login() {
    const { signInWithGoogle } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-black text-white">
            <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center gap-6 mb-10 text-center">
                    <div className="p-4 bg-primary/20 rounded-2xl border border-primary/30 rotate-6">
                        <Trophy size={48} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic mb-2">
                            BAPTISTINI <span className="text-primary">INCENTIVOS</span>
                        </h1>
                        <p className="text-zinc-500 font-medium tracking-wide text-sm uppercase">
                            Faça login para acessar o painel
                        </p>
                    </div>
                </div>

                <button
                    onClick={signInWithGoogle}
                    className="group relative w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-primary transition-all duration-300 active:scale-[0.98] overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <LogIn size={20} />
                    Entrar com Google
                </button>

                <p className="mt-8 text-center text-zinc-600 text-xs font-mono uppercase tracking-widest">
                    Acesso restrito a colaboradores
                </p>
            </div>

            <footer className="mt-20 text-zinc-800 text-xs font-mono">
                POWERED BY GAMIFY_ENGINE_V1
            </footer>
        </div>
    );
}
