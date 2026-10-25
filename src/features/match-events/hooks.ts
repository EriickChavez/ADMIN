import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { matchEventsService } from "./services/match-events";
import type { MatchEventInput } from "./types";

const eventsKey = (matchId?: string) => ["match-events", matchId] as const;

export function useMatchEvents(matchId?: string) {
    const result = useQuery({
        queryKey: eventsKey(matchId),
        queryFn: () => matchEventsService.listByMatch(matchId!),
        enabled: !!matchId,
    });

    return {
        events: result.data ?? [],
        isLoading: result.isLoading,
        isError: result.isError,
    };
}

function useRefreshAfterEvent(tournamentId: string, matchId: string) {
    const qc = useQueryClient();
    return () => {
        qc.invalidateQueries({ queryKey: eventsKey(matchId) });
        // El marcador cambia con los eventos: también refresca partidos y, más
        // adelante, posiciones y llaves (cuelgan de esta clave).
        qc.invalidateQueries({ queryKey: ["matches", tournamentId] });
        qc.invalidateQueries({ queryKey: ["match", matchId] });
    };
}

export function useCreateMatchEvent(tournamentId: string, matchId: string) {
    const refresh = useRefreshAfterEvent(tournamentId, matchId);
    return useMutation({
        mutationFn: (input: MatchEventInput) =>
            matchEventsService.create(matchId, input),
        onSuccess: refresh,
    });
}

export function useDeleteMatchEvent(tournamentId: string, matchId: string) {
    const refresh = useRefreshAfterEvent(tournamentId, matchId);
    return useMutation({
        mutationFn: (eventId: string) => matchEventsService.remove(eventId),
        onSuccess: refresh,
    });
}