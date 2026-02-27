"use client";

import { ActivityLogger } from "@/components/ActivityLogger";
import { Leaderboard } from "@/components/Leaderboard";
import { Settings } from "@/components/Settings";
import { History } from "@/components/History";
import { MonthSelector } from "@/components/MonthSelector";
import { ClientRegistration } from "@/components/ClientRegistration";
import { AdminPanel } from "@/components/AdminPanel";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { Trophy, LayoutDashboard, Settings as SettingsIcon, History as HistoryIcon, Users, BarChart3, ShieldCheck } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<'ranking' | 'analytics' | 'history' | 'settings' | 'clients' | 'admin'>('ranking');

  return (
    <div className="flex flex-col items-center min-h-screen p-6 sm:p-12 font-sans bg-black selection:bg-primary selection:text-black">

      {/* Header */}
      <header className="flex flex-col items-center gap-4 mb-8 text-center text-white">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/20 rounded-xl border border-primary/30 rotate-3">
            <Trophy size={32} className="text-primary" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase italic">
            BAPTISTINI <span className="text-primary">INCENTIVOS</span>
          </h1>
        </div>
        <p className="text-zinc-500 font-medium tracking-wide text-sm uppercase">
          PROGRAMA DE INCENTIVOS
        </p>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mt-4 bg-zinc-900/50 p-1.5 rounded-full border border-zinc-800">
          <button
            onClick={() => setActiveTab('ranking')}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all
              ${activeTab === 'ranking' ? 'bg-primary text-black shadow-lg' : 'text-zinc-400 hover:text-white'}
            `}
          >
            <LayoutDashboard size={16} />
            Ranking
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all
              ${activeTab === 'analytics' ? 'bg-primary text-black shadow-lg' : 'text-zinc-400 hover:text-white'}
            `}
          >
            <BarChart3 size={16} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all
              ${activeTab === 'clients' ? 'bg-primary text-black shadow-lg' : 'text-zinc-400 hover:text-white'}
            `}
          >
            <Users size={16} />
            Clientes
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all
              ${activeTab === 'history' ? 'bg-primary text-black shadow-lg' : 'text-zinc-400 hover:text-white'}
            `}
          >
            <HistoryIcon size={16} />
            Histórico
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all
              ${activeTab === 'settings' ? 'bg-primary text-black shadow-lg' : 'text-zinc-400 hover:text-white'}
            `}
          >
            <SettingsIcon size={16} />
            Configurações
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all
              ${activeTab === 'admin' ? 'bg-primary text-black shadow-lg' : 'text-zinc-400 hover:text-white'}
            `}
          >
            <ShieldCheck size={16} />
            Admin
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-6xl flex flex-col items-center gap-8">

        {activeTab === 'ranking' && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-start justify-items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Left Column: Actions */}
            <section className="flex flex-col items-center w-full gap-8">
              <ActivityLogger />

              <div className="hidden lg:block w-full max-w-md p-6 border border-dashed border-zinc-800 rounded-2xl text-zinc-600 text-center text-sm">
                <p className="mb-2 font-bold text-zinc-400">DICA PRO</p>
                Fechar um contrato garante o maior aumento de XP. Certifique-se de registrá-lo imediatamente para garantir o 1º lugar.
              </div>
            </section>

            {/* Right Column: Rankings */}
            <section className="w-full flex flex-col items-center gap-6">
              <MonthSelector />
              <Leaderboard />
            </section>
          </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard />
        )}

        {activeTab === 'clients' && (
          <ClientRegistration />
        )}

        {activeTab === 'history' && (
          <History />
        )}

        {activeTab === 'admin' && (
          <AdminPanel />
        )}

        {activeTab === 'settings' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Settings />
          </div>
        )}

      </main>

      <footer className="mt-20 text-zinc-800 text-xs font-mono">
        POWERED BY GAMIFY_ENGINE_V1
      </footer>
    </div>
  );
}

