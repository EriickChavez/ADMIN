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

export function useUpdateMatch(tournamentId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: MatchUpdateInput }) =>
            matchesService.update(id, input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["matches", tournamentId] });
            qc.invalidateQueries({ queryKey: ["phase"] });
        },
    });
}
