import { create } from 'zustand';
import { ActivityLog, DifficultyLevel, DEFAULT_EXTRA_VALUES, Profile, TIER_MULTIPLIERS, ExtraSetting, Client, UserTier } from './types';
import { MOCK_USERS, INITIAL_LOGS } from './mock-data';

const INITIAL_CLIENTS: Client[] = [];

interface GameState {
    users: Profile[];
    logs: ActivityLog[];
    currentUser: Profile | null;
    clients: Client[];

    // New Settings
    // (pointSettings removed in favor of all-custom items)

    // Extra Points Settings
    extraSettings: Record<string, ExtraSetting>;
    setExtraSettings: (settings: Record<string, ExtraSetting>) => void;
    addExtraSetting: (name: string, value: number, type: DifficultyLevel) => void;
    removeExtraSetting: (name: string) => void;

    // Monthly Filter
    selectedMonth: string; // Format: "YYYY-MM" or "all"
    setSelectedMonth: (month: string) => void;

    setCurrentUser: (userId: string) => void;
    setTier: (userId: string, tier: UserTier) => void;

    // Client Management
    addClient: (name: string, email?: string, phone?: string) => void;
    removeClient: (clientId: string) => void;
    updateClient: (clientId: string, data: Partial<Omit<Client, 'id' | 'created_at'>>) => void;

    addLog: (id: string, data: {
        date: string;
        client_name: string;
        process_number?: string;
        description: string;
        time_spent: number;
        complexity: DifficultyLevel;
        extra_type?: string;
    }) => void;

    removeLog: (logId: string) => void;
    setUsers: (users: Profile[]) => void;
    setLogs: (logs: ActivityLog[]) => void;
    setClients: (clients: Client[]) => void;

    getLeaderboard: () => { user: Profile; score: number }[];
}

export const useGameStore = create<GameState>((set, get) => ({
    users: [],
    logs: [],
    currentUser: null,
    clients: [],

    extraSettings: DEFAULT_EXTRA_VALUES,
    setExtraSettings: (settings) => set({ extraSettings: settings }),

    addExtraSetting: (name, value, type) => set((state) => ({
        extraSettings: { ...state.extraSettings, [name]: { points: value, type } }
    })),

    removeExtraSetting: (name) => set((state) => {
        const { [name]: _, ...rest } = state.extraSettings;
        return { extraSettings: rest };
    }),

    selectedMonth: new Date().toISOString().slice(0, 7), // Current YYYY-MM
    setSelectedMonth: (month) => set({ selectedMonth: month }),

    setCurrentUser: (userId: string) => {
        const user = get().users.find((u) => u.id === userId) || null;
        set({ currentUser: user });
    },

    setTier: (userId, tier) => {
        set((state) => ({
            users: state.users.map(u => u.id === userId ? { ...u, tier } : u),
            // Also update currentUser if it matches
            currentUser: state.currentUser?.id === userId ? { ...state.currentUser, tier } : state.currentUser
        }));
    },

    // Client Management Implementation
    addClient: (name, email, phone) => {
        const newClient: Client = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            email,
            phone,
            created_at: new Date().toISOString(),
        };
        set((state) => ({ clients: [...state.clients, newClient] }));
    },

    removeClient: (clientId) => {
        set((state) => ({
            clients: state.clients.filter((c) => c.id !== clientId)
        }));
    },

    updateClient: (clientId, data) => {
        set((state) => ({
            clients: state.clients.map((c) => c.id === clientId ? { ...c, ...data } : c)
        }));
    },

    removeLog: (logId) => {
        set((state) => ({
            logs: state.logs.filter((log) => log.id !== logId)
        }));
    },

    setUsers: (users) => set({ users }),
    setLogs: (logs) => set({ logs }),
    setClients: (clients) => set({ clients }),

    addLog: (id: string, data: any) => {
        const { currentUser, extraSettings } = get();
        if (!currentUser) return;

        let base_points = 0;
        let multiplier = TIER_MULTIPLIERS[currentUser.tier];

        if (data.extra_type) {
            const setting = extraSettings[data.extra_type];
            if (setting) {
                base_points = setting.points;
                if (setting.type === 'Extra') multiplier = 1;
            }
        }

        const final_points = base_points * multiplier;

        const newLog: ActivityLog = {
            id,
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
            base_points,
            multiplier,
            final_points,
            ...data
        };

        set((state) => ({ logs: [...state.logs, newLog] }));
    },

    getLeaderboard: () => {
        const { users, logs, selectedMonth } = get();

        const scores = users.map((user) => {
            const userLogs = logs.filter((log) => {
                if (selectedMonth === 'all') {
                    return log.user_id === user.id;
                }
                const logMonth = log.date.slice(0, 7); // Extract YYYY-MM
                return log.user_id === user.id && logMonth === selectedMonth;
            });
            const score = userLogs.reduce((total, log) => total + log.final_points, 0);
            return { user, score };
        });

        return scores.sort((a, b) => b.score - a.score);
    },
}));
