"use client";

import { useGameStore } from "@/lib/store";
import { Users, Plus, Trash2, Search, Mail, Phone, UserPlus } from "lucide-react";
import { useState } from "react";

export function ClientRegistration() {
    const { clients, addClient, removeClient } = useGameStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [newClient, setNewClient] = useState({ name: "", email: "", phone: "" });

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddClient = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClient.name) return;
        addClient(newClient.name, newClient.email, newClient.phone);
        setNewClient({ name: "", email: "", phone: "" });
        setIsAdding(false);
    };

    return (
        <div className="w-full max-w-4xl bg-secondary border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                        <Users className="text-primary" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white uppercase tracking-tight">
                            Cadastro de Clientes
                        </h2>
                        <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
                            Gerencie sua base de contatos
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-primary hover:bg-yellow-400 text-black px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-primary/20 active:scale-95"
                >
                    {isAdding ? <><Plus className="rotate-45" size={18} /> Cancelar</> : <><UserPlus size={18} /> Novo Cliente</>}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAddClient} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl animate-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Nome Completo</label>
                            <input
                                required
                                type="text"
                                placeholder="ex: João Silva"
                                value={newClient.name}
                                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Email (Opcional)</label>
                            <input
                                type="email"
                                placeholder="joao@email.com"
                                value={newClient.email}
                                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Telefone (Opcional)</label>
                            <input
                                type="text"
                                placeholder="(11) 99999-9999"
                                value={newClient.phone}
                                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                                className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button
                            type="submit"
                            className="bg-zinc-100 hover:bg-white text-black px-6 py-2 rounded-lg font-bold transition-all"
                        >
                            Salvar Cliente
                        </button>
                    </div>
                </form>
            )}

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input
                    type="text"
                    placeholder="Pesquisar cliente por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:border-primary/50 outline-none transition-all"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                        <div
                            key={client.id}
                            className="group bg-zinc-900/30 border border-zinc-800 p-5 rounded-2xl hover:border-zinc-700 transition-all hover:bg-zinc-900/50 relative overflow-hidden"
                        >
                            <div className="flex flex-col gap-3">
                                <div className="flex items-start justify-between">
                                    <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-primary font-bold">
                                        {client.name.charAt(0).toUpperCase()}
                                    </div>
                                    <button
                                        onClick={() => removeClient(client.id)}
                                        className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                                        title="Remover cliente"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div>
                                    <h3 className="text-white font-bold truncate leading-tight">{client.name}</h3>
                                    <div className="mt-2 space-y-1">
                                        {client.email && (
                                            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                                                <Mail size={12} className="text-zinc-700" />
                                                <span className="truncate">{client.email}</span>
                                            </div>
                                        )}
                                        {client.phone && (
                                            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                                                <Phone size={12} className="text-zinc-700" />
                                                <span>{client.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="text-[9px] font-mono text-zinc-700 uppercase">
                                    ID: {client.id}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-900 rounded-3xl">
                        <Users className="mx-auto text-zinc-800 mb-4" size={48} />
                        <p className="text-zinc-600 font-medium tracking-wide">Nenhum cliente encontrado.</p>
                        <p className="text-zinc-800 text-xs mt-1 uppercase">Tente uma busca diferente ou adicione um novo.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
