import { api } from "../../../api/client";
import type {
    Match,
    MatchInput,
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
                    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
                    ...(query.status ? { status: query.status } : {}),
                    ...(query.phaseId ? { phaseId: query.phaseId } : {}),
                },
            },
        );
        return data;
    },

    create: async (tournamentId: string, input: MatchInput): Promise<Match> => {
        const { data } = await api.post<MatchResponse>(
            `/tournaments/${tournamentId}/matches`,
            input,
        );
        return data.match;
    },
};