"use client";

import { useGameStore } from "@/lib/store";
import { UserTier, AuthorizedUser } from "@/lib/types";
import { ShieldCheck, Medal, Plus, Trash2, Key, UserCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, setDoc, doc, deleteDoc, orderBy } from "firebase/firestore";

export function AdminPanel() {
    const { users, setTier } = useGameStore();
    const [activeSubTab, setActiveSubTab] = useState<'tiers' | 'auth'>('tiers');
    
    // Auth Management State
    const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([]);
    const [newEmail, setNewEmail] = useState("");
    const [newName, setNewName] = useState("");
    const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
    const [isLoadingAuth, setIsLoadingAuth] = useState(false);

    // Fetch authorized users on mount or when auth tab is active
    useEffect(() => {
        if (activeSubTab === 'auth') {
            fetchAuthorizedUsers();
        }
    }, [activeSubTab]);

    const fetchAuthorizedUsers = async () => {
        if (!db) return;
        setIsLoadingAuth(true);
        try {
            const q = query(collection(db, "authorized_users"), orderBy("added_at", "desc"));
            const querySnapshot = await getDocs(q);
            const usersList: AuthorizedUser[] = [];
            querySnapshot.forEach((doc) => {
                usersList.push({ ...doc.data() as AuthorizedUser });
            });
            setAuthorizedUsers(usersList);
        } catch (error) {
            console.error("Error fetching authorized users:", error);
        } finally {
            setIsLoadingAuth(false);
        }
    };

    const handleAddAuthorizedUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail || !db) return;

        const email = newEmail.toLowerCase().trim();
        const userDocRef = doc(db, "authorized_users", email);
        
        const newUser: AuthorizedUser = {
            email,
            name: newName.trim() || undefined,
            role: newRole,
            added_at: new Date().toISOString(),
        };

        try {
            await setDoc(userDocRef, newUser);
            setNewEmail("");
            setNewName("");
            setNewRole("user");
            fetchAuthorizedUsers();
        } catch (error) {
            console.error("Error adding authorized user:", error);
        }
    };

    const handleDeleteAuthorizedUser = async (email: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, "authorized_users", email));
            fetchAuthorizedUsers();
        } catch (error) {
            console.error("Error deleting authorized user:", error);
        }
    };

    return (
        <div className="w-full max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Admin Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800 shadow-xl gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                        <ShieldCheck className="text-primary" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight italic">Painel de <span className="text-primary">Administração</span></h2>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Controle Total do Sistema</p>
                    </div>
                </div>
                
                {/* Sub-Tabs */}
                <div className="flex bg-black/40 p-1 rounded-xl border border-zinc-800/50">
                    <button
                        onClick={() => setActiveSubTab('tiers')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'tiers' ? 'bg-primary text-black' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Gestão de Tiers
                    </button>
                    <button
                        onClick={() => setActiveSubTab('auth')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'auth' ? 'bg-primary text-black' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Autorizações
                    </button>
                </div>
            </div>

            {activeSubTab === 'tiers' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {users.map((user) => (
                            <div key={user.id} className="bg-secondary border border-zinc-800 p-6 rounded-2xl flex items-center justify-between group hover:border-zinc-700 transition-all">
                                <div className="flex items-center gap-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                                        onChange={async (e) => {
                                            if (!db) return;
                                            const newTier = e.target.value as UserTier;
                                            setTier(user.id, newTier);
                                            try {
                                                await setDoc(doc(db, "authorized_users", user.id), { tier: newTier }, { merge: true });
                                            } catch (err) {
                                                console.error("Error updating tier:", err);
                                            }
                                        }}
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
                </>
            )}

            {activeSubTab === 'auth' && (
                <div className="space-y-6">
                    {/* Add New Authorized User Form */}
                    <div className="bg-secondary border border-zinc-800 p-6 rounded-3xl shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Plus className="text-primary" size={20} />
                            <h3 className="text-sm font-black text-white uppercase tracking-tight italic">Autorizar Novo Usuário</h3>
                        </div>
                        <form onSubmit={handleAddAuthorizedUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-1">
                                <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1 ml-1">Nome (Opcional)</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Ex: João Silva"
                                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1 ml-1">E-mail (Google)</label>
                                <input
                                    type="email"
                                    required
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="usuario@gmail.com"
                                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1 ml-1">Cargo/Role</label>
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary outline-none appearance-none"
                                >
                                    <option value="user">Usuário Comum</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="bg-primary hover:bg-yellow-400 text-black font-black text-[10px] py-3 rounded-xl transition-all shadow-lg active:scale-95 uppercase tracking-tighter"
                            >
                                Autorizar Acesso
                            </button>
                        </form>
                    </div>

                    {/* Authorized Users List */}
                    <div className="bg-secondary border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <UserCheck className="text-zinc-500" size={20} />
                                <h3 className="text-sm font-black text-white uppercase tracking-tight italic">Contas com Acesso Liberado</h3>
                            </div>
                            {isLoadingAuth && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-900/50 border-b border-zinc-800">
                                    <tr>
                                        <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Usuário</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">E-mail</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Cargo</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {authorizedUsers.length === 0 && !isLoadingAuth ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-zinc-600 font-medium italic text-xs">
                                                Nenhum usuário autorizado encontrado. Adicione o primeiro acima.
                                            </td>
                                        </tr>
                                    ) : (
                                        authorizedUsers.map((auth) => (
                                            <tr key={auth.email} className="hover:bg-zinc-900/40 transition-colors group text-xs">
                                                <td className="px-6 py-4 text-white font-bold">{auth.name || "---"}</td>
                                                <td className="px-6 py-4 text-zinc-400 font-mono">{auth.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${auth.role === 'admin' ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-zinc-800 text-zinc-400'}`}>
                                                        {auth.role === 'admin' ? 'Admin' : 'Usuário'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteAuthorizedUser(auth.email)}
                                                        className="text-zinc-700 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                                                        title="Revogar Acesso"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl">
                        <div className="flex gap-4">
                            <Key className="text-zinc-600 flex-shrink-0" size={24} />
                            <p className="text-[11px] text-zinc-500 leading-relaxed font-medium italic">
                                Ao remover o acesso de um e-mail, o usuário correspondente perderá a capacidade de acessar o sistema imediatamente na próxima vez que a página for carregada ou quando sua sessão expirar. Recomendamos que haja sempre pelo menos dois administradores autorizados.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
