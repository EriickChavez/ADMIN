import { api } from "../../../api/client";
import type {
    MatchEvent,
    MatchEventInput,
    MatchEventResponse,
    MatchEventsResponse,
} from "../types";

export const matchEventsService = {
    listByMatch: async (matchId: string): Promise<MatchEvent[]> => {
        const { data } = await api.get<MatchEventsResponse>(
            `/matches/${matchId}/events`,
        );
        return data.events ?? [];
    },

    create: async (
        matchId: string,
        input: MatchEventInput,
    ): Promise<MatchEvent> => {
        const { data } = await api.post<MatchEventResponse>(
            `/matches/${matchId}/events`,
            input,
        );
        return data.event;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/match-events/${id}`);
    },
};