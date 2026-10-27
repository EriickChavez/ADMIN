import { api } from "../../../api/client";
import type { CompetitionState } from "../types";

export const competitionStateService = {
    get: async (tournamentId: string): Promise<CompetitionState> => {
        const { data } = await api.get<CompetitionState>(
            `/tournaments/${tournamentId}/competition-state`,
        );
        return data;
    },
};