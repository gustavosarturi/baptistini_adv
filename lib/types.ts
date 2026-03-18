export type UserTier = 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
export type DifficultyLevel = 'Light' | 'Medium' | 'Hard' | 'Manual' | 'Extra';
export type Department = 'Consultivo' | 'Operacional' | 'Comercial' | 'Estratégico';

export type Profile = {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    tier: UserTier;
};

export type AuthorizedUser = {
    email: string;
    role: 'admin' | 'user';
    name?: string;
    avatar_url?: string; // New: Sync from Google
    added_at: string;
};

export type Client = {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    created_at: string;
};

export type ActivityLog = {
    id: string;
    user_id: string;
    date: string; // ISO Date
    client_name: string;
    process_number?: string;
    description: string;
    time_spent: number; // minutes
    complexity: DifficultyLevel;
    extra_type?: string;
    department?: Department;
    base_points: number;
    multiplier: number;
    final_points: number;
    created_at: string;
};

export type ExtraSetting = {
    points: number;
    type: DifficultyLevel;
};

export const DEFAULT_EXTRA_VALUES: Record<string, ExtraSetting> = {
    // Tarefas Padrão
    'Tarefa Light': { points: 10, type: 'Light' },
    'Tarefa Medium': { points: 25, type: 'Medium' },
    'Tarefa Hard': { points: 50, type: 'Hard' },
    // Pontualidade
    'Pontualidade Semanal': { points: 25, type: 'Extra' },
    'Falta/Dia': { points: -50, type: 'Extra' },
    'Atraso (>15min)': { points: -10, type: 'Extra' },
    // Assiduidade
    'Engajado/Semanal': { points: 25, type: 'Extra' },
    'Regular/Semanal': { points: 10, type: 'Extra' },
    'Desmotivado/Semanal': { points: -50, type: 'Extra' },
    // Sugestão
    'Idéia Inovadora': { points: 250, type: 'Extra' },
    'Melhoria Aplicada': { points: 100, type: 'Extra' },
    'Sugestão Aplicada': { points: 50, type: 'Extra' },
    // Rotina
    'Protocolo Recepção': { points: 25, type: 'Extra' },
    'Protocolo Fluxo Inicial': { points: 50, type: 'Extra' },
    'Entrega Resumo Livro': { points: 25, type: 'Extra' },
    'Entrega Relatório': { points: 25, type: 'Extra' },
    'Limpeza/Desorganização': { points: -25, type: 'Extra' }
};

export const TIER_MULTIPLIERS: Record<UserTier, number> = {
    'Bronze': 1,
    'Silver': 2,
    'Gold': 3,
    'Diamond': 5
};
