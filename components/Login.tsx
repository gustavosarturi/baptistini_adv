"use client";

import { useAuth } from "@/lib/auth-context";
import { LogIn } from "lucide-react";
import { auth } from "@/lib/firebase";

export function Login() {
    const { signInWithGoogle } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-black text-white">
            <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center gap-6 mb-10 text-center">
                    <div className="flex items-center justify-center rounded-full shadow-[0_0_30px_rgba(255,242,59,0.3)] mb-4 bg-black p-4 z-10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/bap.svg" alt="Baptistini Logo" className="w-16 h-16 sm:w-20 sm:h-20" />
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
                    onClick={() => {
                        console.log("Login: Botão clicado!");
                        if (!auth) {
                            alert("ERRO: O Firebase não foi inicializado. Verifique se as variáveis de ambiente (NEXT_PUBLIC_FIREBASE_...) foram adicionadas no painel do Vercel e se você fez o 'Redeploy'.");
                            return;
                        }
                        signInWithGoogle();
                    }}
                    className={`group relative w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-primary transition-all duration-300 active:scale-[0.98] overflow-hidden ${!auth ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <LogIn size={20} />
                    {auth ? "Entrar com Google" : "Firebase não configurado"}
                </button>

                {!auth && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-[10px] text-red-500 font-black uppercase text-center leading-tight">
                            ⚠️ AVISO: Variáveis de ambiente faltando no Vercel.<br/>
                            O botão só funcionará após configurar o Firebase Settings.
                        </p>
                    </div>
                )}

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
