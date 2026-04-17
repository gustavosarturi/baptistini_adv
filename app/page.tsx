"use client";

import { ActivityLogger } from "@/components/ActivityLogger";
import { Leaderboard } from "@/components/Leaderboard";
import { Settings } from "@/components/Settings";
import { History } from "@/components/History";
import { MonthSelector } from "@/components/MonthSelector";
import { ClientRegistration } from "@/components/ClientRegistration";
import { RewardsTab } from "@/components/RewardsTab";
import { AdminPanel } from "@/components/AdminPanel";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { Login } from "@/components/Login";
import { Unauthorized } from "@/components/Unauthorized";
import { useAuth } from "@/lib/auth-context";
import { Trophy, LayoutDashboard, Settings as SettingsIcon, History as HistoryIcon, Users, BarChart3, ShieldCheck, LogOut, Gift, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { onSnapshot, collection, doc, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useGameStore } from "@/lib/store";
import { Profile, ActivityLog, Client, ExtraSetting, RewardItem } from "@/lib/types";

export default function Home() {
  const { user, role, isAuthorized, loading, signOut } = useAuth();
  const { setUsers, setLogs, setClients, setExtraSettings, setCurrentUser, users, getUserBalance, setAvailableRewards } = useGameStore();
  const [activeTab, setActiveTab] = useState<'ranking' | 'analytics' | 'history' | 'settings' | 'clients' | 'admin' | 'rewards'>('ranking');
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    if (user && isAuthorized) {
        const hasSeen = localStorage.getItem('saw_update_v1_1');
        if (!hasSeen) {
            setShowUpdateModal(true);
        }
    }
  }, [user, isAuthorized]);

  const handleCloseUpdate = () => {
      localStorage.setItem('saw_update_v1_1', 'true');
      setShowUpdateModal(false);
  };

  // If a non-admin tries to access an admin tab, redirect to ranking
  useEffect(() => {
    if (role === 'user' && (activeTab === 'admin' || activeTab === 'settings')) {
      setActiveTab('ranking');
    }
  }, [role, activeTab]);

  // Sync Users from authorized_users
  useEffect(() => {
    if (!isAuthorized || !db) return;
    
    console.log("Firestore: Syncing authorized_users...");
    const unsubscribe = onSnapshot(collection(db, "authorized_users"), (snapshot) => {
        const profileList: Profile[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                username: doc.id.split('@')[0], // Extract username from email
                full_name: data.name || "Colaborador",
                avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.id}`,
                tier: data.tier || "Bronze",
                department: data.department,
                is_hidden: data.is_hidden
            };
        });
        setUsers(profileList);
    });
    return () => unsubscribe();
  }, [isAuthorized, setUsers]);

  // Sync Logs from activity_logs
  const isInitialLogsLoad = useRef(true);

  useEffect(() => {
    if (!isAuthorized || !db) return;

    console.log("Firestore: Syncing activity_logs...");
    const q = query(collection(db, "activity_logs"), orderBy("date", "desc"), limit(500));
    const unsubscribe = onSnapshot(q, (snapshot) => {

        if (!isInitialLogsLoad.current) {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const newLog = change.doc.data() as ActivityLog;
                    try {
                        // Buscar nome de quem pontuou usando a store global atual
                        const profileList = useGameStore.getState().users;
                        const userProfile = profileList.find(u => u.id === newLog.user_id) || { full_name: newLog.user_id.split('@')[0] };
                        
                        // Exibir balão de notificação para a tela de todos
                        toast.success(`${userProfile.full_name.split(' ')[0]} acabou de pontuar!`, {
                            description: `Ganhou +${newLog.final_points} XP (${newLog.department || 'Geral'})`,
                            icon: "🎮",
                            duration: 5000,
                        });
                        
                        // Efeito Sonoro estilo "Moeda de Jogo" (100% Nativo sem arquivos externos)
                        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
                        const oscillator = audioCtx.createOscillator();
                        const gainNode = audioCtx.createGain();
                        
                        oscillator.type = 'sine';
                        oscillator.frequency.setValueAtTime(987.77, audioCtx.currentTime); // B5 note
                        oscillator.frequency.setValueAtTime(1318.51, audioCtx.currentTime + 0.1); // E6 note
                        
                        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
                        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioCtx.destination);
                        
                        oscillator.start(audioCtx.currentTime);
                        oscillator.stop(audioCtx.currentTime + 0.5);
                    } catch (err) {
                        console.log("Sound check skipped (user hasn't interacted with page yet)", err);
                    }
                }
            });
        }
        
        isInitialLogsLoad.current = false;

        const logList: ActivityLog[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data() as Omit<ActivityLog, 'id'>
        }));
        setLogs(logList);
    });
    return () => unsubscribe();
  }, [isAuthorized, setLogs]);

  // Sync Current User Profile
  useEffect(() => {
    if (user && users.length > 0) {
        const email = user.email?.toLowerCase();
        const found = users.find(u => u.id === email);
        if (found) {
            setCurrentUser(found.id);
        }
    }
  }, [user, users, setCurrentUser]);

  // Sync Clients from clients
  useEffect(() => {
    if (!isAuthorized || !db) return;
    
    console.log("Firestore: Syncing clients...");
    const unsubscribe = onSnapshot(collection(db, "clients"), (snapshot) => {
        const clientList = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        } as Client));
        setClients(clientList);
    });
    return () => unsubscribe();
  }, [isAuthorized, setClients]);

  // Sync Settings from settings/extra doc
  useEffect(() => {
    if (!isAuthorized || !db) return;
    
    console.log("Firestore: Syncing extraSettings...");
    const unsubscribe = onSnapshot(doc(db, "settings", "extra"), (snapshot) => {
        if (snapshot.exists()) {
            setExtraSettings(snapshot.data() as Record<string, ExtraSetting>);
        }
    });
    return () => unsubscribe();
  }, [isAuthorized, setExtraSettings]);

  // Sync Rewards from settings/rewards doc
  useEffect(() => {
    if (!isAuthorized || !db) return;
    
    console.log("Firestore: Syncing availableRewards...");
    const unsubscribe = onSnapshot(doc(db, "settings", "rewards"), (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.data();
            const rewardsList = Object.values(data) as RewardItem[];
            setAvailableRewards(rewardsList);
        } else {
            setAvailableRewards([]);
        }
    });
    return () => unsubscribe();
  }, [isAuthorized, setAvailableRewards]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 font-mono text-xs animate-pulse">AUTENTICANDO...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!isAuthorized) {
    return <Unauthorized />;
  }

  const isAdmin = role === 'admin';

  return (
    <div className="flex flex-col items-center min-h-screen p-6 sm:p-12 font-sans bg-black selection:bg-primary selection:text-black">

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-secondary border border-zinc-700/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative">
                <button onClick={handleCloseUpdate} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                    <X size={20} />
                </button>
                <div className="bg-primary/10 p-6 border-b border-primary/20 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-black mb-4">
                        <Gift size={24} />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-wider">Nova Atualização!</h2>
                    <p className="text-primary font-bold text-sm tracking-widest mt-1">SISTEMA GAMIFICADO V1.1</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="text-zinc-300 text-sm leading-relaxed space-y-4 text-left">
                        <p>Temos novidades incríveis na sua área de <strong>Recompensas</strong>!</p>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400">
                            <li><strong className="text-white">Novo Catálogo de Prêmios:</strong> Agora ficou ainda mais fácil pedir resgates. Não precisa mais digitar os prêmios manualmente, basta escolher diretamente na nossa vitrine.</li>
                            <li><strong className="text-white">Mais Transparência:</strong> O custo de cada prêmio é puxado automaticamente do sistema, sem erros.</li>
                            <li><strong className="text-white">Foto de Perfil:</strong> Adicionamos a foto do usuário também nos relatórios de saldos e resgates do painel administrativo.</li>
                        </ul>
                    </div>
                    <button onClick={handleCloseUpdate} className="w-full mt-6 bg-primary text-black font-black uppercase tracking-wider py-3 rounded-xl hover:bg-yellow-400 transition-colors shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                        Entendi, vamos lá!
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* User Bar */}
      <div className="w-full max-w-6xl flex justify-end mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-4 bg-zinc-900/50 p-2 pl-4 rounded-full border border-zinc-800">
          <div className="flex flex-col items-end">
            <span className="text-white text-xs font-bold">{user.displayName}</span>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-[10px] font-mono">{user.email}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${isAdmin ? 'bg-primary text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                {role}
              </span>
              <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20 text-yellow-500">
                <Gift size={10} />
                <span className="text-[10px] font-black">{getUserBalance(user.email || "")} pts</span>
              </div>
            </div>
          </div>
          {user.photoURL && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=27272a&color=fff`} referrerPolicy="no-referrer" alt={user.displayName || ""} className="w-8 h-8 rounded-full border border-zinc-700" />
          )}
          <button
            onClick={signOut}
            className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-red-400 transition-colors"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="flex flex-col items-center gap-4 mb-8 text-center text-white">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mb-2 sm:mb-0">
          <div className="flex items-center justify-center rounded-full shadow-[0_0_20px_rgba(255,242,59,0.3)] mb-2 sm:mb-0 bg-black p-2">
            {/* Logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/bap.svg" alt="Baptistini Logo" className="w-20 h-20" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase italic text-center sm:text-left">
            BAPTISTINI<br className="sm:hidden" /> <span className="text-primary">INCENTIVOS</span>
          </h1>
        </div>
        <p className="flex items-center gap-2 text-zinc-500 font-medium tracking-wide text-sm uppercase">
          <Trophy size={16} className="text-primary" />
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
            Registro
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
            onClick={() => setActiveTab('rewards')}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all
              ${activeTab === 'rewards' ? 'bg-primary text-black shadow-lg' : 'text-zinc-400 hover:text-white'}
            `}
          >
            <Gift size={16} />
            Recompensas
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

          {isAdmin && (
            <>
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
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-6xl flex flex-col items-center gap-8">

        {activeTab === 'ranking' && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-start justify-items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Left Column: Actions */}
            <section className="flex flex-col items-center w-full gap-8">
              <ActivityLogger />

              <div className="mt-8 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/30 text-[10px] text-zinc-500 leading-relaxed max-w-2xl">
                    <p>
                        <strong className="text-zinc-400">Nota:</strong> Itens marcados como &apos;Incentivo&apos; somam pontos fixos. Itens marcados como &apos;Light/Medium/Hard&apos; servem como atalhos no formulário de registro e seus pontos são multiplicados pelo Tier do associado.
                    </p>
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

        {activeTab === 'rewards' && (
          <RewardsTab />
        )}

        {activeTab === 'history' && (
          <History />
        )}

        {isAdmin && activeTab === 'admin' && (
          <AdminPanel />
        )}

        {isAdmin && activeTab === 'settings' && (
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

