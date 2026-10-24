import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { phasesService } from "./services/phases";
import type { PhaseInput } from "./types";

const listKey = (tournamentId?: string, categoryId?: string) =>
    ["phases", tournamentId, categoryId] as const;

export function usePhases(tournamentId?: string, categoryId?: string) {
    const query = useQuery({
        queryKey: listKey(tournamentId, categoryId),
        queryFn: () => phasesService.listByCategory(tournamentId!, categoryId!),
        enabled: !!tournamentId && !!categoryId,
    });

    const phases = [...(query.data ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder,
    );

    return {
        phases,
        isLoading: query.isLoading,
        isError: query.isError,
    };
}

export function usePhase(id?: string) {
    const query = useQuery({
        queryKey: ["phase", id],
        queryFn: () => phasesService.get(id!),
        enabled: !!id,
    });

    return {
        phase: query.data ?? null,
        isLoading: query.isLoading,
        isError: query.isError,
    };
}

export function useCreatePhase(tournamentId: string, categoryId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: PhaseInput) =>
            phasesService.create(tournamentId, categoryId, input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: listKey(tournamentId, categoryId) });
        },
    });
}

export function useUpdatePhase(tournamentId: string, categoryId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: Partial<PhaseInput> }) =>
            phasesService.update(id, input),
        onSuccess: (phase) => {
            qc.invalidateQueries({ queryKey: listKey(tournamentId, categoryId) });
            qc.invalidateQueries({ queryKey: ["phase", phase.id] });
        },
    });
}

export function useDeletePhase(tournamentId: string, categoryId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => phasesService.remove(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: listKey(tournamentId, categoryId) });
        },
    });
}