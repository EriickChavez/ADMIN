
import { api } from "../../../api/client";
import type {
    Match,
    MatchInput,
    MatchUpdateInput,
    MatchResponse,
    MatchesQuery,
    MatchesResponse,
} from "../types";

export const matchesService = {
    listByTournament: async (
        tournamentId: string,
        query: MatchesQuery = {},
    ): Promise<MatchesResponse> => {
        const { data } = await api.get<MatchesResponse>(
            `/tournaments/${tournamentId}/matches`,
            {
                params: {
                    page: query.page ?? 1,
                    limit: query.limit ?? 20,
                    ...(query.categoryId
                        ? { categoryId: query.categoryId }
                        : {}),
                    ...(query.status ? { status: query.status } : {}),
                    ...(query.phaseId ? { phaseId: query.phaseId } : {}),
                },
            },
        );

        return data;
    },

    update: async (
        matchId: string,
        input: MatchUpdateInput,
    ): Promise<Match> => {
        const { data } = await api.patch<MatchResponse>(
            `/matches/${matchId}`,
            input,
        );

        return data.match;
    },

    create: async (
        tournamentId: string,
        input: MatchInput,
    ): Promise<Match> => {
        const { data } = await api.post<MatchResponse>(
            `/tournaments/${tournamentId}/matches`,
            input,
        );

        return data.match;
    },
};
