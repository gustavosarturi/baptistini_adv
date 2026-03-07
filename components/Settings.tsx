"use client";

import { useGameStore } from "@/lib/store";
import { DifficultyLevel } from "@/lib/types";
import { Save, Settings as SettingsIcon, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function Settings() {
    const { extraSettings } = useGameStore();

    const [localExtraSettings, setLocalExtraSettings] = useState(extraSettings);
    const [newItem, setNewItem] = useState({ name: "", value: "", type: "Extra" as DifficultyLevel });
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        setLocalExtraSettings(extraSettings);
    }, [extraSettings]);

    const handleSave = async () => {
        try {
            await setDoc(doc(db, "settings", "extra"), localExtraSettings);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        } catch (error) {
            console.error("Error saving settings:", error);
        }
    };

    const handleExtraChange = (key: string, value: string) => {
        setLocalExtraSettings({
            ...localExtraSettings,
            [key]: { ...localExtraSettings[key], points: Number(value) }
        });
    };

    const handleAddItem = () => {
        if (!newItem.name || newItem.value === "") return;
        setLocalExtraSettings({
            ...localExtraSettings,
            [newItem.name]: { points: Number(newItem.value), type: newItem.type }
        });
        setNewItem({ name: "", value: "", type: "Extra" });
    };

    const handleRemoveItem = (key: string) => {
        const rest = { ...localExtraSettings };
        delete rest[key];
        setLocalExtraSettings(rest);
    };

    return (
        <div className="w-full max-w-4xl bg-secondary border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">

            {/* Custom Scoring Items Management */}
            <div>
                <div className="flex items-center justify-between mb-6 pt-6 border-t border-zinc-800 first:border-t-0 first:pt-0">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-zinc-800 rounded-xl">
                            <SettingsIcon className="text-zinc-400" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-white uppercase tracking-tight">
                            Itens de Pontuação Customizados
                        </h2>
                    </div>
                </div>

                {/* New Item Form */}
                <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl mb-8 shadow-inner">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase mb-4 tracking-widest">Adicionar Novo Item</h3>
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 ml-1">Nome do Item</label>
                            <input
                                type="text"
                                placeholder="ex: Meta Batida"
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div className="sm:w-32 w-full">
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 ml-1">Pontos</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={newItem.value}
                                    onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
                                    className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-primary outline-none no-spinner transition-all font-mono"
                                />
                                <span className="absolute right-3 top-3.5 text-[10px] font-bold text-zinc-600">PTS</span>
                            </div>
                        </div>
                        <div className="sm:w-40 w-full">
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 ml-1">Tipo de Registro</label>
                            <select
                                value={newItem.type}
                                onChange={(e) => setNewItem({ ...newItem, type: e.target.value as DifficultyLevel })}
                                className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="Light">Light</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                                <option value="Extra">Incentivo</option>
                            </select>
                        </div>
                        <button
                            onClick={handleAddItem}
                            disabled={!newItem.name || newItem.value === ""}
                            className="bg-primary hover:bg-yellow-400 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed text-black font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all h-[46px] w-full sm:w-auto"
                        >
                            <Plus size={18} />
                            Adicionar
                        </button>
                    </div>
                </div>

                {/* List of Scored Items grouped by type */}
                <div className="space-y-12">
                    {(['Light', 'Medium', 'Hard', 'Extra'] as DifficultyLevel[]).map((type) => {
                        const itemsOfType = Object.keys(localExtraSettings).filter(k => localExtraSettings[k].type === type);
                        if (itemsOfType.length === 0) return null;

                        return (
                            <div key={type} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <h3 className={`text-xs font-black mb-5 uppercase tracking-[0.2em] flex items-center gap-3
                                    ${type === 'Hard' ? 'text-red-500' : type === 'Medium' ? 'text-primary' : type === 'Extra' ? 'text-yellow-500' : 'text-blue-400'}
                                `}>
                                    <span className={`h-1 w-8 rounded-full
                                        ${type === 'Hard' ? 'bg-red-500' : type === 'Medium' ? 'bg-primary' : type === 'Extra' ? 'bg-yellow-500' : 'bg-blue-400'}
                                    `}></span>
                                    {type === 'Extra' ? 'Incentivos / Extras' : `${type} Items`}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {itemsOfType.sort().map((key) => (
                                        <div key={key} className="group bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-2xl relative transition-all hover:border-zinc-700 hover:bg-zinc-900/60 hover:translate-y-[-2px] hover:shadow-xl">
                                            <button
                                                onClick={() => handleRemoveItem(key)}
                                                className="absolute -top-2 -right-2 p-2 bg-red-950/90 text-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-lg z-10"
                                                title="Remover item"
                                            >
                                                <Trash2 size={14} />
                                            </button>

                                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2 truncate pr-6 tracking-wider" title={key}>
                                                {key}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={localExtraSettings[key].points}
                                                    onChange={(e) => handleExtraChange(key, e.target.value)}
                                                    className={`w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono text-lg focus:border-primary outline-none no-spinner transition-all
                                                        ${localExtraSettings[key].points < 0 ? 'text-red-400' : 'text-primary'}
                                                    `}
                                                />
                                                <span className="absolute right-4 top-3.5 text-[10px] font-bold text-zinc-600">PTS</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/30 text-[10px] text-zinc-500 leading-relaxed max-w-2xl">
                    <p>
                        <strong className="text-zinc-400">Nota:</strong> Itens marcados como &apos;Incentivo&apos; somam pontos fixos. Itens marcados como &apos;Light/Medium/Hard&apos; servem como atalhos no formulário de registro e seus pontos são multiplicados pelo Tier do associado.
                    </p>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-800">
                <button
                    onClick={handleSave}
                    className="bg-primary hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                >
                    {isSaved ? (
                        <>Salvo!</>
                    ) : (
                        <>
                            <Save size={18} />
                            Salvar Alterações
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
