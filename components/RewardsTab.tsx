"use client";

import { useGameStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { collection, addDoc, updateDoc, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Gift, Wallet, CheckCircle2, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";

export function RewardsTab() {
    const { currentUser, users, logs, getUserBalance, availableRewards } = useGameStore();
    const { role } = useAuth();
    const isAdmin = role === 'admin';

    const [isRequesting, setIsRequesting] = useState(false);
    const [selectedRewardId, setSelectedRewardId] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    // Current Year hardcoded for the view, but could be dynamic
    const currentYear = new Date().getFullYear();
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

    const userBalance = currentUser ? getUserBalance(currentUser.id) : 0;

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !db) return;

        if (!selectedRewardId) {
            alert("Por favor, selecione uma recompensa.");
            return;
        }

        const rewardInfo = availableRewards.find(r => r.id === selectedRewardId);
        if (!rewardInfo) return;

        const points = rewardInfo.cost;
        const finalDesc = rewardInfo.name;

        if (points <= 0) {
            alert("A pontuação deve ser maior que zero.");
            return;
        }

        if (points > userBalance) {
            alert("Você não tem saldo suficiente para este resgate.");
            return;
        }

        const d = new Date();
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        try {
            await addDoc(collection(db, "activity_logs"), {
                user_id: currentUser.id,
                date: dateStr,
                client_name: "RESGATE DE RECOMPENSA",
                description: finalDesc,
                time_spent: 0,
                complexity: 'Extra',
                department: currentUser.department || "Consultivo",
                base_points: -points,
                multiplier: 1,
                final_points: -points,
                type: 'redemption',
                status: 'pending',
                created_at: new Date().toISOString()
            });

            // Torna a recompensa única removendo-a do banco para ninguém mais solicitar
            const updatedRewards = availableRewards.filter(r => r.id !== selectedRewardId);
            const rewardsObj = Object.fromEntries(updatedRewards.map(r => [r.id, r]));
            await setDoc(doc(db, "settings", "rewards"), rewardsObj);

            setSelectedRewardId("");
            setIsRequesting(false);
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 3000);
        } catch (err) {
            console.error("Erro ao solicitar", err);
            alert("Erro ao solicitar resgate.");
        }
    };

    const handleApprove = async (logId: string) => {
        if (!db) return;
        try {
            await updateDoc(doc(db, "activity_logs", logId), { status: 'approved' });
        } catch (err) {
            console.error("Erro ao aprovar:", err);
            alert("Erro ao aprovar o resgate.");
        }
    };

    const handleReject = async (logId: string) => {
        if (!db) return;
        try {
            // Se for rejeitado, devolvemos a recompensa para a vitrine
            const logToReject = logs.find(l => l.id === logId);
            if (logToReject) {
                const restoredReward = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: logToReject.description,
                    cost: Math.abs(logToReject.final_points)
                };
                
                const newRewardsList = [...availableRewards, restoredReward];
                const rewardsObj = Object.fromEntries(newRewardsList.map(r => [r.id, r]));
                await setDoc(doc(db, "settings", "rewards"), rewardsObj);
            }

            await updateDoc(doc(db, "activity_logs", logId), { status: 'rejected' });
        } catch (err) {
            console.error("Erro ao rejeitar:", err);
            alert("Erro ao rejeitar o resgate.");
        }
    };

    const pendingAdminConfigs = isAdmin ? logs.filter(l => l.type === 'redemption' && l.status === 'pending') : [];

    const globalExtractLogs = logs.filter(log => {
        if (log.type !== 'redemption') return false;
        if (log.status === 'rejected') return false;
        const isHiddenUser = users.find(u => u.id === log.user_id)?.is_hidden;
        if (isHiddenUser && !isAdmin) return false;
        return true;
    }).sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime());


    // Helper to calc for a specific user and year
    const calcUserYearData = (userId: string, year: number) => {
        const userLogs = logs.filter(log => log.user_id === userId && log.date.startsWith(`${year}-`) && log.status !== 'rejected');
        
        let totalYearEarned = 0;
        let totalYearRedeemed = 0;
        
        const monthlyData = months.map((m, i) => {
            const mLogs = userLogs.filter(log => log.date.startsWith(`${year}-${m}`));
            const pontuacao = mLogs.filter(l => l.type !== 'redemption').reduce((acc, l) => acc + l.final_points, 0);
            const resgates = mLogs.filter(l => l.type === 'redemption' && l.status === 'approved').reduce((acc, l) => acc + l.final_points, 0);
            
            totalYearEarned += pontuacao;
            totalYearRedeemed += resgates;
            
            return {
                name: monthNames[i],
                Pontuação: pontuacao,
                Resgate: resgates, // Usually negative
                Total: pontuacao + resgates
            };
        });

        return { monthlyData, totalYearEarned, totalYearRedeemed, finalTotal: totalYearEarned + totalYearRedeemed };
    };

    const currentUserData = currentUser ? calcUserYearData(currentUser.id, currentYear) : null;

    return (
        <div className="w-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {isSuccess && (
                <div className="bg-green-500/20 border border-green-500 text-green-400 p-4 rounded-xl flex items-center justify-center gap-2">
                    <CheckCircle2 size={20} />
                    Solicitação de resgate enviada com sucesso! Aguardando aprovação do Admin.
                </div>
            )}

            {isAdmin && pendingAdminConfigs.length > 0 && (
                <div className="w-full bg-secondary border border-yellow-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(255,215,0,0.05)] overflow-x-auto relative mt-2">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl" />
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Clock className="text-yellow-500" />
                        Visão de Administrador: Aprovação de Resgates Pendentes
                        <span className="p-1 px-2 text-xs bg-yellow-500/20 text-yellow-500 rounded-lg">{pendingAdminConfigs.length} aguardando</span>
                    </h2>
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-zinc-500 uppercase bg-black/40 border-b border-zinc-800">
                            <tr>
                                <th className="px-4 py-3 rounded-tl-lg">Usuário</th>
                                <th className="px-4 py-3">Data Solicitação</th>
                                <th className="px-4 py-3">Recompensa</th>
                                <th className="px-4 py-3">Pontos</th>
                                <th className="px-4 py-3 text-right rounded-tr-lg">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="text-zinc-300">
                            {pendingAdminConfigs.map(log => {
                                const reqUser = users.find(u => u.id === log.user_id);
                                return (
                                    <tr key={log.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/40">
                                        <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                                            {reqUser?.avatar_url ? (
                                                <>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={reqUser.avatar_url} alt="" className="w-6 h-6 rounded-full border border-zinc-700" />
                                                </>
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                                    {reqUser?.full_name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            {reqUser?.full_name || 'Desconhecido'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-zinc-400">{new Date(log.date).toLocaleDateString('pt-BR')}</td>
                                        <td className="px-4 py-3 font-medium">{log.description}</td>
                                        <td className="px-4 py-3 font-bold text-yellow-500">{Math.abs(log.final_points)} pts</td>
                                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                                            <button onClick={() => handleReject(log.id)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all">Rejeitar</button>
                                            <button onClick={() => handleApprove(log.id)} className="px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 text-xs font-bold hover:bg-yellow-500/20 transition-all border border-yellow-500/20">Aprovar</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {currentUserData && (
                <>
                    {/* User Wallet */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <div className="bg-secondary border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div>
                                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <Wallet className="text-primary" />
                                    Saldo Disponível
                                </h2>
                                <p className="text-zinc-400 text-sm mb-6">Esta é a sua pontuação atual para troca por recompensas.</p>
                            </div>
                            <div className="text-5xl font-black text-white flex items-end gap-2 drop-shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                                {userBalance} <span className="text-xl text-primary mb-1 uppercase">pts</span>
                            </div>
                        </div>

                        <div className="bg-secondary border border-zinc-800 rounded-2xl p-6 shadow-2xl">
                            {isRequesting ? (
                                <form onSubmit={handleRequest} className="flex flex-col gap-4 h-full justify-between animate-in fade-in">
                                    <div>
                                        <h3 className="font-bold text-white flex items-center gap-2 mb-4"><Gift size={16} className="text-primary"/> Solicitar Resgate</h3>
                                        <div className="flex flex-col gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Qual o prêmio?</label>
                                                {availableRewards.length > 0 ? (
                                                    <select
                                                        required
                                                        value={selectedRewardId}
                                                        onChange={e => setSelectedRewardId(e.target.value)}
                                                        className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary appearance-none cursor-pointer"
                                                    >
                                                        <option value="" disabled>Selecione um prêmio...</option>
                                                        {availableRewards.map(r => (
                                                            <option key={r.id} value={r.id}>{r.name} - {r.cost} pts</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <div className="text-sm text-zinc-400 p-3 bg-black/50 rounded-lg border border-zinc-700">
                                                        Nenhuma recompensa disponível no catálogo.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setIsRequesting(false)} className="flex-1 py-2 rounded-lg bg-zinc-800 text-white font-bold text-sm hover:bg-zinc-700">Cancelar</button>
                                        <button type="submit" className="flex-1 py-2 rounded-lg bg-primary text-black font-bold text-sm hover:bg-yellow-400">Confirmar</button>
                                    </div>
                                </form>
                            ) : (
                                <div className="flex flex-col h-full justify-center items-center text-center gap-4 py-4">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <Gift size={32} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">Quer trocar seus pontos?</h3>
                                        <p className="text-zinc-500 text-sm">Escolha no catálogo a recompensa que você deseja resgatar.</p>
                                    </div>
                                    <button onClick={() => setIsRequesting(true)} className="mt-2 w-full py-3 rounded-xl bg-primary text-black font-black uppercase tracking-wider hover:bg-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all">
                                        Solicitar Resgate
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pending Redemptions */}
                    {logs.filter(l => l.user_id === currentUser?.id && l.type === 'redemption' && l.status === 'pending').length > 0 && (
                        <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                            <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><Clock size={16}/> Meus Resgates Pendentes</h3>
                            <div className="flex flex-col gap-2">
                                {logs.filter(l => l.user_id === currentUser?.id && l.type === 'redemption' && l.status === 'pending').map(log => (
                                    <div key={log.id} className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-yellow-500/20">
                                        <div>
                                            <div className="text-white font-medium">{log.description}</div>
                                            <div className="text-xs text-zinc-500">{new Date(log.date).toLocaleDateString('pt-BR')}</div>
                                        </div>
                                        <div className="text-yellow-500 font-bold">{log.final_points} pts</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Chart */}
                    <div className="w-full bg-secondary border border-zinc-800 rounded-2xl p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6">Evolução no Ano ({currentYear})</h2>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={currentUserData.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                                    <Tooltip 
                                        cursor={{ fill: '#27272a' }} 
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', color: '#fff' }}
                                    />
                                    <Legend />
                                    <ReferenceLine y={0} stroke="#3f3f46" />
                                    <Bar dataKey="Pontuação" fill="#ffe500" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Resgate" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="w-full bg-secondary border border-zinc-800 rounded-2xl p-6 shadow-xl overflow-x-auto">
                        <h2 className="text-xl font-bold text-white mb-6">Extrato ({currentYear})</h2>
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-zinc-500 uppercase bg-zinc-900 border-b border-zinc-800">
                                <tr>
                                    <th className="px-4 py-3"></th>
                                    {monthNames.map(m => <th key={m} className="px-4 py-3 text-right">{m}</th>)}
                                    <th className="px-4 py-3 text-right font-black text-primary">{currentYear}</th>
                                </tr>
                            </thead>
                            <tbody className="text-zinc-300">
                                <tr className="border-b border-zinc-800/50">
                                    <td className="px-4 py-3 font-semibold text-white">PONTUAÇÃO</td>
                                    {currentUserData.monthlyData.map(d => <td key={d.name} className="px-4 py-3 text-right">{d.Pontuação || ''}</td>)}
                                    <td className="px-4 py-3 text-right font-bold text-white">{currentUserData.totalYearEarned}</td>
                                </tr>
                                <tr className="border-b border-zinc-800/50">
                                    <td className="px-4 py-3 font-semibold text-red-400">RESGATE</td>
                                    {currentUserData.monthlyData.map(d => <td key={d.name} className="px-4 py-3 text-right text-red-400">{d.Resgate || ''}</td>)}
                                    <td className="px-4 py-3 text-right font-bold text-red-400">{currentUserData.totalYearRedeemed}</td>
                                </tr>
                                <tr className="bg-zinc-900/40">
                                    <td className="px-4 py-3 font-black text-white">TOTAL</td>
                                    {currentUserData.monthlyData.map(d => <td key={d.name} className="px-4 py-3 text-right font-bold">{d.Total}</td>)}
                                    <td className="px-4 py-3 text-right font-black text-primary">{currentUserData.finalTotal}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {isAdmin && (
                <div className="flex flex-col gap-8">
                    <div className="w-full bg-secondary border border-zinc-800 rounded-2xl p-6 shadow-xl overflow-x-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">Relatório Admin de Recompensas ({currentYear})</h2>
                    </div>

                    <div className="flex flex-col gap-12">
                        {users.filter(u => !u.is_hidden).map(user => {
                            const data = calcUserYearData(user.id, currentYear);
                            if (data.finalTotal === 0 && data.totalYearEarned === 0) return null; // Skip users with no points
                            return (
                                <div key={user.id}>
                                    <div className="flex items-center gap-3 mb-2">
                                        {user.avatar_url ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={user.avatar_url} alt={user.full_name} className="w-10 h-10 rounded-full border-2 border-primary/20 object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold border-2 border-primary/20">
                                                {user.full_name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <h3 className="text-primary font-bold uppercase tracking-widest m-0 flex items-center">
                                            {user.full_name} 
                                            <span className="text-zinc-500 font-normal text-xs ml-2 mt-0.5">Saldo: {getUserBalance(user.id)} pts</span>
                                        </h3>
                                    </div>
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-[10px] text-zinc-500 uppercase bg-zinc-900 border-b border-zinc-800">
                                            <tr>
                                                <th className="px-4 py-2"></th>
                                                {monthNames.map(m => <th key={m} className="px-4 py-2 text-right">{m}</th>)}
                                                <th className="px-4 py-2 text-right font-black text-primary">TOTAL</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-zinc-300 text-xs">
                                            <tr className="border-b border-zinc-800/50">
                                                <td className="px-4 py-2 font-semibold">PONTUAÇÃO</td>
                                                {data.monthlyData.map(d => <td key={d.name} className="px-4 py-2 text-right">{d.Pontuação || ''}</td>)}
                                                <td className="px-4 py-2 text-right font-bold">{data.totalYearEarned}</td>
                                            </tr>
                                            <tr className="border-b border-zinc-800/50">
                                                <td className="px-4 py-2 font-semibold text-red-400">RESGATE</td>
                                                {data.monthlyData.map(d => <td key={d.name} className="px-4 py-2 text-right text-red-400">{d.Resgate || ''}</td>)}
                                                <td className="px-4 py-2 text-right font-bold text-red-400">{data.totalYearRedeemed}</td>
                                            </tr>
                                            <tr className="bg-zinc-900/40">
                                                <td className="px-4 py-2 font-bold text-white">SALDO</td>
                                                {data.monthlyData.map(d => <td key={d.name} className="px-4 py-2 text-right font-bold">{d.Total}</td>)}
                                                <td className="px-4 py-2 text-right font-black text-primary">{data.finalTotal}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )
                        })}
                    </div>
                </div>
                </div>
            )}

            {/* Extrato Global de Resgates */}
            <div className="w-full bg-secondary border border-zinc-800 rounded-2xl p-6 shadow-xl mt-8">
                <h2 className="text-xl font-black text-white mb-6 uppercase tracking-wider italic flex items-center gap-3">
                    Extrato de <span className="text-primary">Resgates</span>
                </h2>
                <div className="space-y-3">
                    {globalExtractLogs.length === 0 ? (
                        <p className="text-zinc-500 italic text-sm text-center py-8">Nenhum resgate efetuado ainda.</p>
                    ) : (
                        globalExtractLogs.map(log => {
                            const user = users.find(u => u.id === log.user_id);
                            const isPending = log.status === 'pending';
                            return (
                                <div key={log.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-black/40 border rounded-xl transition-colors gap-3 sm:gap-0 ${isPending ? 'border-yellow-500/20 hover:border-yellow-500/40' : 'border-zinc-800 hover:border-zinc-700'}`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full text-xs">
                                        <div className="text-zinc-500 font-mono w-24">
                                            {new Date(log.created_at || log.date).toLocaleDateString('pt-BR')}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'User')}`} className="w-6 h-6 rounded-full border border-zinc-700" alt="" />
                                            <span className="text-white font-bold uppercase">{user?.full_name || log.user_id?.split('@')[0] || 'Desconhecido'}</span>
                                        </div>
                                        <div className="text-zinc-400 flex-1 sm:ml-2">
                                            {isPending ? 'solicitou' : 'resgatou'} <span className={`${isPending ? 'text-yellow-500' : 'text-primary'} font-bold`}>{log.description}</span>
                                            {isPending && <span className="ml-2 text-[9px] uppercase font-bold text-yellow-500/50 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">Pendente</span>}
                                        </div>
                                    </div>
                                    <div className={`${isPending ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' : 'text-red-400 bg-red-400/10 border-red-400/20'} font-black flex items-center gap-1 self-end sm:self-auto px-3 py-1 rounded-lg border`}>
                                        {Math.abs(log.final_points)} <span className={`text-[10px] uppercase font-bold ${isPending ? 'text-yellow-500/50' : 'text-red-500/50'} pt-0.5`}>XP</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
