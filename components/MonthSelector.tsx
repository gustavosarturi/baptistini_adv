"use client";

import { useGameStore } from "@/lib/store";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export function MonthSelector() {
    const { selectedMonth, setSelectedMonth } = useGameStore();

    const handlePrevMonth = () => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        date.setMonth(date.getMonth() - 1);
        setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    };

    const handleNextMonth = () => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        date.setMonth(date.getMonth() + 1);
        setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    };

    const isAllTime = selectedMonth === 'all';

    let formattedDate = "Todo o Período";
    if (!isAllTime) {
        const [year, month] = selectedMonth.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        formattedDate = date.toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric'
        });
    }

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800">
                <button
                    onClick={handlePrevMonth}
                    disabled={isAllTime}
                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors disabled:opacity-20"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-2 min-w-[140px] justify-center">
                    <Calendar size={16} className="text-primary" />
                    <span className="text-sm font-bold text-white uppercase tracking-wide">
                        {formattedDate}
                    </span>
                </div>

                <button
                    onClick={handleNextMonth}
                    disabled={isAllTime}
                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors disabled:opacity-20"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <button
                onClick={() => setSelectedMonth(isAllTime ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` : 'all')}
                className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border
                    ${isAllTime ? 'bg-primary text-black border-primary shadow-[0_0_15px_rgba(255,229,0,0.3)]' : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:text-white hover:border-zinc-600'}
                `}
            >
                {isAllTime ? 'Mensal' : 'Tudo'}
            </button>
        </div>
    );
}
