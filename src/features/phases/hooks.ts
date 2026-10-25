import { useMemo } from "react";
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { phasesService } from "./services/phases";
import type {
    ClosePhasePayload,
    PhaseGroupInput,
    PhaseInput,
    SetManualRanksPayload,
    SyncPhaseTeamItem,
} from "./types";

const listKey = (tournamentId?: string, categoryId?: string) =>
    ["phases", tournamentId, categoryId] as const;
const groupsKey = (phaseId?: string) => ["phase-groups", phaseId] as const;
const teamsKey = (phaseId?: string) => ["phase-teams", phaseId] as const;

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

// ---- Grupos ----

export function usePhaseGroups(phaseId?: string) {
    const query = useQuery({
        queryKey: groupsKey(phaseId),
        queryFn: () => phasesService.listGroups(phaseId!),
        enabled: !!phaseId,
    });

    const groups = useMemo(
        () =>
            [...(query.data ?? [])].sort(
                (a, b) =>
                    a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "es"),
            ),
        [query.data],
    );

    return {
        groups,
        isLoading: query.isLoading,
        isError: query.isError,
    };
}

export function useCreatePhaseGroup(phaseId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: PhaseGroupInput) =>
            phasesService.createGroup(phaseId, input),
        onSuccess: () => qc.invalidateQueries({ queryKey: groupsKey(phaseId) }),
    });
}

export function useDeletePhaseGroup(phaseId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (groupId: string) => phasesService.removeGroup(groupId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: groupsKey(phaseId) });
            // Los equipos de ese grupo quedan sin grupo.
            qc.invalidateQueries({ queryKey: teamsKey(phaseId) });
        },
    });
}

// ---- Equipos de la fase ----

export function usePhaseTeams(phaseId?: string) {
    const query = useQuery({
        queryKey: teamsKey(phaseId),
        queryFn: () => phasesService.listTeams(phaseId!),
        enabled: !!phaseId,
    });

    return {
        assignments: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
    };
}

export function useSyncPhaseTeams(phaseId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (teams: SyncPhaseTeamItem[]) =>
            phasesService.syncTeams(phaseId, teams),
        onSuccess: () => qc.invalidateQueries({ queryKey: teamsKey(phaseId) }),
    });
}

// ---- Posiciones, desempates y cierre ----

const standingsKey = (tournamentId?: string, phaseId?: string) =>
    ["matches", tournamentId, "standings", phaseId] as const;

export function usePhaseStandings(
    tournamentId: string | undefined,
    phaseId: string | undefined,
    perGroup: number,
    bestNext: number,
) {
    const query = useQuery({
        // Cuelga de ["matches", tournamentId] a propósito: las posiciones se calculan con
        // los partidos, así que al finalizar uno (o cambiar sus goles) esa clave ya se
        // invalida y las tablas se refrescan solas.
        queryKey: [...standingsKey(tournamentId, phaseId), perGroup, bestNext],
        queryFn: () => phasesService.getStandings(phaseId!, { perGroup, bestNext }),
        enabled: !!tournamentId && !!phaseId,
        // Mientras cambias los números no parpadea la pantalla.
        placeholderData: keepPreviousData,
    });

    return {
        data: query.data ?? null,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
        refetch: query.refetch,
    };
}

export function useSetManualRanks(tournamentId: string, phaseId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: SetManualRanksPayload) =>
            phasesService.setManualRanks(phaseId, payload),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: standingsKey(tournamentId, phaseId) }),
    });
}

function useRefreshAfterClosure(tournamentId: string, phaseId: string) {
    const qc = useQueryClient();
    return () => {
        // La fase pasa a "finished" (o vuelve): se refrescan la fase, sus tablas y el listado.
        qc.invalidateQueries({ queryKey: ["phase", phaseId] });
        qc.invalidateQueries({ queryKey: standingsKey(tournamentId, phaseId) });
        qc.invalidateQueries({ queryKey: ["phases", tournamentId] });
    };
}

export function useClosePhase(tournamentId: string, phaseId: string) {
    const refresh = useRefreshAfterClosure(tournamentId, phaseId);
    return useMutation({
        mutationFn: (payload: ClosePhasePayload) =>
            phasesService.closePhase(phaseId, payload),
        onSuccess: refresh,
    });
}

export function useReopenPhase(tournamentId: string, phaseId: string) {
    const refresh = useRefreshAfterClosure(tournamentId, phaseId);
    return useMutation({
        mutationFn: () => phasesService.reopenPhase(phaseId),
        onSuccess: refresh,
    });
}