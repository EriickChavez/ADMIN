import { api } from "../../../api/client";
import type {
    Team,
    TeamInput,
    TeamResponse,
    TeamsQuery,
    TeamsResponse,
} from "../types";

export const teamsService = {
    listByTournament: async (
        tournamentId: string,
        query: TeamsQuery = {},
    ): Promise<TeamsResponse> => {
        const { data } = await api.get<TeamsResponse>(
            `/tournaments/${tournamentId}/teams`,
            {
                params: {
                    page: query.page ?? 1,
                    limit: query.limit ?? 20,
                    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
                },
            },
        );
        return data;
    },

    create: async (tournamentId: string, input: TeamInput): Promise<Team> => {
        const { data } = await api.post<TeamResponse>(
            `/tournaments/${tournamentId}/teams`,
            input,
        );
        return data.team;
    },

    update: async (id: string, input: Partial<TeamInput>): Promise<Team> => {
        const { data } = await api.patch<TeamResponse>(`/teams/${id}`, input);
        return data.team;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/teams/${id}`);
    },
};