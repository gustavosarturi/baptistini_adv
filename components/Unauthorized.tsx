"use client";

import { useAuth } from "@/lib/auth-context";
import { ShieldAlert, LogOut, Mail } from "lucide-react";

export function Unauthorized() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 font-sans bg-black text-white">
      <div className="w-full max-w-md p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl text-center animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
            <ShieldAlert size={48} className="text-red-500" />
          </div>
        </div>
        
        <h1 className="text-3xl font-black mb-2 tracking-tight uppercase italic">
          ACESSO <span className="text-red-500">NEGADO</span>
        </h1>
        
        <p className="text-zinc-400 mb-8 font-medium">
          Sua conta não tem autorização para acessar este sistema. Entre em contato com o administrador para solicitar acesso.
        </p>

        <div className="flex flex-col gap-4">
          <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 flex items-center gap-3">
            {user?.photoURL && (
              <img src={user.photoURL} alt={user.displayName || ""} className="w-10 h-10 rounded-full border border-zinc-600" />
            )}
            <div className="text-left overflow-hidden">
              <p className="text-xs text-zinc-500 font-bold uppercase truncate">{user?.displayName}</p>
              <p className="text-sm text-zinc-300 font-mono truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => window.location.href = `mailto:admin@baptistini.com?subject=Solicitação de Acesso - ${user?.email}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-100 text-black rounded-xl font-bold hover:bg-white transition-all transform hover:scale-[1.02] active:scale-95"
          >
            <Mail size={18} />
            Contatar Administrador
          </button>

          <button
            onClick={signOut}
            className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-900 text-zinc-400 rounded-xl font-bold hover:text-white border border-zinc-800 transition-all"
          >
            <LogOut size={18} />
            Sair da Conta
          </button>
        </div>

        <p className="mt-8 text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
          SECURITY_ERROR_CODE: 403_FORBIDDEN
        </p>
      </div>
    </div>
  );
}
