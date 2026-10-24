export interface Player {
    id: string;
    tournamentId: string;
    categoryId: string;
    teamId: string;
    firstName: string;
    lastName: string;
    birthDate: string | null;
    number: number | null;
    isCaptain: boolean;
    role: string | null;
}

export interface PlayersResponse {
    players: Player[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface PlayerResponse {
    player: Player;
}

export interface PlayerInput {
    categoryId: string;
    teamId: string;
    firstName: string;
    lastName: string;
    birthDate: string | null;
    number: number | null;
    isCaptain: boolean;
    role: string | null;
}

export interface PlayerFormValues {
    categoryId: string;
    teamId: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    number: string;
    isCaptain: boolean;
    role: string;
}

export interface PlayersQuery {
    page?: number;
    limit?: number;
    categoryId?: string;
    teamId?: string;
}