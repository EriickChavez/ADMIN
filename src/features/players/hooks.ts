import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { playersService } from "./services/players";
import type { PlayerInput, PlayersQuery } from "./types";

const listKey = (tournamentId?: string, query?: PlayersQuery) =>
    ["players", tournamentId, query ?? {}] as const;

/**
 * Listado de jugadores.
 * - Si hay teamId → usa GET /teams/:teamId/players (soportado por la API).
 * - categoryId se aplica en cliente (la API no filtra por categoría en el listado del torneo).
 */
export function usePlayers(tournamentId?: string, query: PlayersQuery = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const teamId = query.teamId;
    const categoryId = query.categoryId;

    const result = useQuery({
        queryKey: listKey(tournamentId, { page, limit, teamId, categoryId }),
        queryFn: async () => {
            if (teamId) {
                return playersService.listByTeam(teamId, { page, limit });
            }

            if (categoryId) {
                const data = await playersService.listByTournament(tournamentId!, {
                    page: 1,
                    limit: 200,
                });
                const filtered = data.players.filter((p) => p.categoryId === categoryId);
                const total = filtered.length;
                const totalPages = Math.max(1, Math.ceil(total / limit));
                const start = (page - 1) * limit;
                return {
                    players: filtered.slice(start, start + limit),
                    pagination: { page, limit, total, totalPages },
                };
            }

            return playersService.listByTournament(tournamentId!, { page, limit });
        },
        enabled: !!tournamentId || !!teamId,
    });

    return {
        players: result.data?.players ?? [],
        pagination: result.data?.pagination ?? null,
        isLoading: result.isLoading,
        isError: result.isError,
    };
}

export function usePlayer(tournamentId: string | undefined, playerId?: string) {
    const { players, isLoading } = usePlayers(tournamentId, { limit: 200 });
    const player = players.find((p) => p.id === playerId) ?? null;
    return { player, isLoading };
}

export function useCreatePlayer(tournamentId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: PlayerInput) =>
            playersService.create(tournamentId, input),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: ["players", tournamentId] }),
    });
}

export function useUpdatePlayer(tournamentId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: Partial<PlayerInput> }) =>
            playersService.update(id, input),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: ["players", tournamentId] }),
    });
}

export function useDeletePlayer(tournamentId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => playersService.remove(id),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: ["players", tournamentId] }),
    });
}