export interface Team {
    id: string;
    tournamentId: string;
    categoryId: string;
    name: string;
    abbreviation: string;
    logoUrl: string | null;
}

export interface TeamsResponse {
    teams: Team[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface TeamResponse {
    team: Team;
}

export interface TeamInput {
    categoryId: string;
    name: string;
    abbreviation: string;
    logoUrl?: string | null;
}

export interface TeamFormValues {
    categoryId: string;
    name: string;
    abbreviation: string;
}

export interface TeamsQuery {
    page?: number;
    limit?: number;
    categoryId?: string;
}