import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { teamsService } from "./services/teams";
import type { TeamInput, TeamsQuery } from "./types";

const listKey = (tournamentId?: string, query?: TeamsQuery) =>
    ["teams", tournamentId, query ?? {}] as const;

export function useTeams(
    tournamentId?: string,
    query: TeamsQuery = {},
) {
    const q = {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        categoryId: query.categoryId,
    };

    const result = useQuery({
        queryKey: listKey(tournamentId, q),
        queryFn: () =>
            teamsService.listByTournament(tournamentId!, q),
        enabled: !!tournamentId,
    });

    return {
        teams: result.data?.teams ?? [],
        pagination: result.data?.pagination ?? null,
        isLoading: result.isLoading,
        isError: result.isError,
    };
}

/** Carga todos los equipos que coinciden con los filtros. */
export function useAllTeams(
    tournamentId?: string,
    query: Omit<TeamsQuery, "page" | "limit"> = {},
) {
    const q = {
        categoryId: query.categoryId,
    };

    const result = useQuery({
        queryKey: ["teams", tournamentId, "all", q],
        queryFn: () =>
            teamsService.listAllByTournament(tournamentId!, q),
        enabled: !!tournamentId,
    });

    return {
        teams: result.data ?? [],
        isLoading: result.isLoading,
        isFetching: result.isFetching,
        isError: result.isError,
    };
}

export function useTeam(
    tournamentId: string | undefined,
    teamId?: string,
) {
    const result = useQuery({
        queryKey: ["teams", tournamentId, "detail", teamId],
        queryFn: () =>
            teamsService.findById(tournamentId!, teamId!),
        enabled: Boolean(tournamentId && teamId),
    });

    return {
        team: result.data ?? null,
        isLoading: result.isLoading,
        isError: result.isError,
    };
}

export function useCreateTeam(tournamentId: string) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (input: TeamInput) =>
            teamsService.create(tournamentId, input),
        onSuccess: () =>
            qc.invalidateQueries({
                queryKey: ["teams", tournamentId],
            }),
    });
}

export function useUpdateTeam(tournamentId: string) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            input,
        }: {
            id: string;
            input: Partial<TeamInput>;
        }) => teamsService.update(id, input),
        onSuccess: () =>
            qc.invalidateQueries({
                queryKey: ["teams", tournamentId],
            }),
    });
}

export function useDeleteTeam(tournamentId: string) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => teamsService.remove(id),
        onSuccess: () =>
            qc.invalidateQueries({
                queryKey: ["teams", tournamentId],
            }),
    });
}