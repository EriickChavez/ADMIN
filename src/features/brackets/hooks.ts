import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bracketsService } from "./services/brackets";
import type {
    GenerateBracketPayload,
    ScheduleBracketNodePayload,
    SetBracketNodePenaltiesPayload,
} from "./types";

export function useBracket(
    tournamentId: string | undefined,
    phaseId: string | undefined,
) {
    const query = useQuery({
        // Cuelga de ["matches", tournamentId] a propósito: la llave cambia cuando cambian
        // los partidos (el ganador avanza), y esa clave ya se invalida al guardar
        // resultados desde la cédula.
        queryKey: ["matches", tournamentId, "bracket", phaseId],
        queryFn: () => bracketsService.get(phaseId!),
        enabled: !!tournamentId && !!phaseId,
    });

    return {
        nodes: query.data ?? [],
        isLoading: query.isLoading,
        error: query.error,
    };
}

function useRefreshMatches(tournamentId: string) {
    const qc = useQueryClient();
    return () => qc.invalidateQueries({ queryKey: ["matches", tournamentId] });
}

export function useGenerateBracket(tournamentId: string, phaseId: string) {
    const refresh = useRefreshMatches(tournamentId);
    return useMutation({
        mutationFn: (payload: GenerateBracketPayload) =>
            bracketsService.generate(phaseId, payload),
        onSuccess: refresh,
    });
}

export function useDeleteBracket(tournamentId: string, phaseId: string) {
    const refresh = useRefreshMatches(tournamentId);
    return useMutation({
        mutationFn: () => bracketsService.remove(phaseId),
        onSuccess: refresh,
    });
}

export function useScheduleBracketNode(tournamentId: string, phaseId: string) {
    const refresh = useRefreshMatches(tournamentId);
    return useMutation({
        mutationFn: ({
            nodeId,
            payload,
        }: {
            nodeId: string;
            payload: ScheduleBracketNodePayload;
        }) => bracketsService.scheduleNode(phaseId, nodeId, payload),
        // Se crea un partido: se refrescan la llave y las listas de partidos.
        onSuccess: refresh,
    });
}

export function useSetBracketNodePenalties(
    tournamentId: string,
    phaseId: string,
) {
    const refresh = useRefreshMatches(tournamentId);
    return useMutation({
        mutationFn: ({
            nodeId,
            payload,
        }: {
            nodeId: string;
            payload: SetBracketNodePenaltiesPayload;
        }) => bracketsService.setNodePenalties(phaseId, nodeId, payload),
        // El ganador avanza (o deja de avanzar): se refresca toda la llave.
        onSuccess: refresh,
    });
}