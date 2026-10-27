import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MatchesQuery, MatchInput, MatchUpdateInput } from "./types";
import { matchesService } from "./services/matches";


export function useMatches(tournamentId?: string, query: MatchesQuery = {}) {
    const q = {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        categoryId: query.categoryId,
        status: query.status,
        phaseId: query.phaseId,
    };

    const result = useQuery({
        queryKey: ["matches", tournamentId, q],
        queryFn: () => matchesService.listByTournament(tournamentId!, q),
        enabled: !!tournamentId,
        placeholderData: keepPreviousData,
    });

    return {
        matches: result.data?.matches ?? [],
        pagination: result.data?.pagination ?? null,
        isLoading: result.isLoading,
        isFetching: result.isFetching,
        isPlaceholderData: result.isPlaceholderData,
        isError: result.isError,
    };
}

/**
 * Carga todos los partidos que coinciden con los filtros soportados por la API.
 * Se utiliza en el calendario, donde fecha, grupo y búsqueda de texto se filtran
 * en cliente y deben abarcar todas las páginas, no solo la página visible.
 */
export function useAllMatches(
    tournamentId?: string,
    query: Omit<MatchesQuery, "page" | "limit"> = {},
) {
    const q = {
        categoryId: query.categoryId,
        status: query.status,
        phaseId: query.phaseId,
    };

    const result = useQuery({
        queryKey: ["matches", tournamentId, "all", q],
        queryFn: () => matchesService.listAllByTournament(tournamentId!, q),
        enabled: !!tournamentId,
    });

    return {
        matches: result.data ?? [],
        isLoading: result.isLoading,
        isFetching: result.isFetching,
        isError: result.isError,
    };
}

export function useMatch(matchId?: string) {
    const result = useQuery({
        queryKey: ["match", matchId],
        queryFn: () => matchesService.getById(matchId!),
        enabled: !!matchId,
    });

    return {
        match: result.data ?? null,
        isLoading: result.isLoading,
        isError: result.isError,
    };
}

interface CreateMatchesItem {
    /** Identifica la fila para asociarle su error. */
    key: string;
    input: MatchInput;
}

/**
 * Crea varios partidos en serie: cada error queda asociado a su fila y no se
 * satura el servidor. Un fallo no detiene los demás.
 */
export function useCreateMatches(tournamentId: string) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({
            items,
            onProgress,
        }: {
            items: CreateMatchesItem[];
            onProgress?: (done: number, total: number) => void;
        }) => {
            const errors: Record<string, unknown> = {};
            let created = 0;

            for (const [index, item] of items.entries()) {
                try {
                    await matchesService.create(tournamentId, item.input);
                    created += 1;
                } catch (err) {
                    errors[item.key] = err;
                }
                onProgress?.(index + 1, items.length);
            }

            return { created, errors };
        },
        // Una sola vez al final, aunque alguno haya fallado.
        onSettled: () =>
            qc.invalidateQueries({ queryKey: ["matches", tournamentId] }),
    });
}

/** Crea un partido suelto (fuera de una fase). */
export function useCreateMatch(tournamentId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: MatchInput) => matchesService.create(tournamentId, input),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: ["matches", tournamentId] }),
    });
}

export function useDeleteMatch(tournamentId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (matchId: string) => matchesService.remove(matchId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["matches", tournamentId] });
            qc.invalidateQueries({ queryKey: ["phase"] });
        },
    });
}

export function useUpdateMatch(tournamentId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: MatchUpdateInput }) =>
            matchesService.update(id, input),
        onSuccess: (_match, { id }) => {
            qc.invalidateQueries({ queryKey: ["matches", tournamentId] });
            qc.invalidateQueries({ queryKey: ["match", id] });
            qc.invalidateQueries({ queryKey: ["phase"] });
        },
    });
}

type LifecycleAction = "start" | "finish" | "reopen";

function useMatchLifecycle(tournamentId: string, action: LifecycleAction) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (matchId: string) => matchesService[action](matchId),
        onSuccess: (_match, matchId) => {
            // Esta clave también cubre posiciones, llaves y estado de la competencia.
            qc.invalidateQueries({ queryKey: ["matches", tournamentId] });
            qc.invalidateQueries({ queryKey: ["match", matchId] });
        },
    });
}

export const useStartMatch = (tournamentId: string) =>
    useMatchLifecycle(tournamentId, "start");

export const useFinishMatch = (tournamentId: string) =>
    useMatchLifecycle(tournamentId, "finish");

export const useReopenMatch = (tournamentId: string) =>
    useMatchLifecycle(tournamentId, "reopen");

// ---- Árbitros ----

const refereesKey = (matchId?: string) => ["match-referees", matchId] as const;

export function useMatchReferees(matchId?: string) {
    const query = useQuery({
        queryKey: refereesKey(matchId),
        queryFn: () => matchesService.getReferees(matchId!),
        enabled: !!matchId,
        staleTime: 30_000,
    });

    return {
        refereeUserIds: query.data ?? [],
        isLoading: query.isLoading,
        error: query.error,
    };
}

export function useSetMatchReferees(matchId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (userIds: string[]) =>
            matchesService.setReferees(matchId, userIds),
        // La respuesta trae el conjunto final: se guarda directo, sin volver a pedirlo.
        onSuccess: (userIds) => qc.setQueryData(refereesKey(matchId), userIds),
    });
}