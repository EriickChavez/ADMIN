import { api } from "../../../api/client";
import type {
    ClosePhasePayload,
    ManualRank,
    Phase,
    PhaseClosure,
    PhaseGroup,
    PhaseGroupInput,
    PhaseGroupResponse,
    PhaseGroupsResponse,
    PhaseInput,
    PhaseResponse,
    PhaseStandingsResponse,
    PhasesResponse,
    PhaseTeam,
    PhaseTeamsResponse,
    SetManualRanksPayload,
    SyncPhaseTeamItem,
} from "../types";

function toBody(input: Partial<PhaseInput>) {
    const body: Record<string, unknown> = {};
    if (input.name !== undefined) body.name = input.name;
    if (input.type !== undefined) body.type = input.type;
    if (input.status !== undefined) body.status = input.status;
    if (input.sortOrder !== undefined) body.sortOrder = input.sortOrder;
    if (input.startDate !== undefined) {
        if (input.startDate) body.startDate = input.startDate;
        else body.startDate = null;
    }
    if (input.endDate !== undefined) {
        if (input.endDate) body.endDate = input.endDate;
        else body.endDate = null;
    }
    return body;
}

export const phasesService = {
    listByCategory: async (
        tournamentId: string,
        categoryId: string,
    ): Promise<Phase[]> => {
        const { data } = await api.get<PhasesResponse>(
            `/tournaments/${tournamentId}/categories/${categoryId}/phases`,
        );
        return data.phases ?? [];
    },

    get: async (id: string): Promise<Phase> => {
        const { data } = await api.get<PhaseResponse>(`/phases/${id}`);
        return data.phase;
    },

    create: async (
        tournamentId: string,
        categoryId: string,
        input: PhaseInput,
    ): Promise<Phase> => {
        const { data } = await api.post<PhaseResponse>(
            `/tournaments/${tournamentId}/categories/${categoryId}/phases`,
            toBody(input),
        );
        return data.phase;
    },

    update: async (id: string, input: Partial<PhaseInput>): Promise<Phase> => {
        const { data } = await api.patch<PhaseResponse>(
            `/phases/${id}`,
            toBody(input),
        );
        return data.phase;
    },

    remove: async (id: string, force = false): Promise<void> => {
        await api.delete(`/phases/${id}`, force ? { params: { force: "true" } } : undefined);
    },

    // ---- Grupos ----

    listGroups: async (phaseId: string): Promise<PhaseGroup[]> => {
        const { data } = await api.get<PhaseGroupsResponse>(
            `/phases/${phaseId}/groups`,
        );
        return data.groups ?? [];
    },

    createGroup: async (
        phaseId: string,
        input: PhaseGroupInput,
    ): Promise<PhaseGroup> => {
        const { data } = await api.post<PhaseGroupResponse>(
            `/phases/${phaseId}/groups`,
            input,
        );
        return data.group;
    },

    removeGroup: async (id: string): Promise<void> => {
        await api.delete(`/phase-groups/${id}`);
    },

    // ---- Equipos de la fase ----

    listTeams: async (phaseId: string): Promise<PhaseTeam[]> => {
        const { data } = await api.get<PhaseTeamsResponse>(
            `/phases/${phaseId}/teams`,
        );
        return data.teams ?? [];
    },

    // Reemplaza la lista completa de equipos de la fase.
    syncTeams: async (
        phaseId: string,
        teams: SyncPhaseTeamItem[],
    ): Promise<PhaseTeam[]> => {
        const { data } = await api.put<PhaseTeamsResponse>(
            `/phases/${phaseId}/teams`,
            { teams },
        );
        return data.teams ?? [];
    },

    // ---- Posiciones, desempates y cierre ----

    getStandings: async (
        phaseId: string,
        params: { perGroup: number; bestNext: number },
    ): Promise<PhaseStandingsResponse> => {
        const { data } = await api.get<PhaseStandingsResponse>(
            `/phases/${phaseId}/standings`,
            { params },
        );
        return data;
    },

    // Reemplaza todas las decisiones manuales de un tipo (group o best_next).
    setManualRanks: async (
        phaseId: string,
        payload: SetManualRanksPayload,
    ): Promise<ManualRank[]> => {
        const { data } = await api.put<{ manualRanks: ManualRank[] }>(
            `/phases/${phaseId}/standings/manual-ranks`,
            payload,
        );
        return data.manualRanks ?? [];
    },

    closePhase: async (
        phaseId: string,
        payload: ClosePhasePayload,
    ): Promise<{ phase: Phase; closure: PhaseClosure }> => {
        const { data } = await api.post<{ phase: Phase; closure: PhaseClosure }>(
            `/phases/${phaseId}/close`,
            payload,
        );
        return data;
    },

    reopenPhase: async (phaseId: string): Promise<Phase> => {
        const { data } = await api.post<PhaseResponse>(
            `/phases/${phaseId}/reopen`,
            {},
        );
        return data.phase;
    },
};