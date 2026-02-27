import { Profile, ActivityLog } from "./types";

export const MOCK_USERS: Profile[] = [
    {
        id: "user_1",
        username: "gustavo_sarturi",
        full_name: "Gustavo Sarturi",
        tier: "Diamond",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Gustavo",
    },
    {
        id: "user_2",
        username: "thiago_baptistini",
        full_name: "Thiago Baptistini",
        tier: "Gold",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Thiago",
    },
    {
        id: "user_3",
        username: "beto_carrero",
        full_name: "Beto Carrero",
        tier: "Silver",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Beto",
    },
];


// Initial logs to populate the leaderboard
export const INITIAL_LOGS: ActivityLog[] = [
    {
        id: "log_1",
        user_id: "user_1",
        date: new Date().toISOString(),
        client_name: "Stratton Oakmont",
        description: "IPO Launch Meeting",
        time_spent: 120,
        complexity: "Hard",
        base_points: 50,
        multiplier: 5,
        final_points: 250,
        created_at: new Date().toISOString()
    },
    {
        id: "log_2",
        user_id: "user_2",
        date: new Date().toISOString(),
        client_name: "Pearson Hardman",
        process_number: "PH-2024-001",
        description: "Merger Negotiation",
        time_spent: 60,
        complexity: "Medium",
        base_points: 25,
        multiplier: 3,
        final_points: 75,
        created_at: new Date().toISOString()
    },
];
