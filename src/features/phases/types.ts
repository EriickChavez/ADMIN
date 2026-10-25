export type PhaseType = "group" | "knockout" | "league";
export type PhaseStatus = "upcoming" | "active" | "finished";

export interface Phase {
    id: string;
    tournamentId: string;
    categoryId: string;
    name: string;
    type: PhaseType;
    status: PhaseStatus;
    sortOrder: number;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PhasesResponse {
    phases: Phase[];
}

export interface PhaseResponse {
    phase: Phase;
}

export interface PhaseInput {
    name: string;
    type: PhaseType;
    status?: PhaseStatus;
    sortOrder?: number;
    startDate?: string | null;
    endDate?: string | null;
}

export interface PhaseFormValues {
    name: string;
    type: PhaseType;
    status: PhaseStatus;
    sortOrder: string;
    startDate: string;
    endDate: string;
}

// ---- Grupos y equipos de la fase ----

export interface PhaseGroup {
    id: string;
    phaseId: string;
    name: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface PhaseTeam {
    id: string;
    phaseId: string;
    teamId: string;
    phaseGroupId: string | null;
    seed: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface PhaseGroupsResponse {
    groups: PhaseGroup[];
}

export interface PhaseGroupResponse {
    group: PhaseGroup;
}

export interface PhaseTeamsResponse {
    teams: PhaseTeam[];
}

export interface PhaseGroupInput {
    name: string;
    sortOrder?: number;
}

export interface SyncPhaseTeamItem {
    teamId: string;
    phaseGroupId?: string | null;
    seed?: number | null;
}

export const PHASE_TYPE_LABELS: Record<PhaseType, string> = {
    group: "Grupos",
    knockout: "Eliminación",
    league: "Liga",
};

export const PHASE_STATUS_LABELS: Record<PhaseStatus, string> = {
    upcoming: "Próxima",
    active: "Activa",
    finished: "Finalizada",
};

// "Finalizada" solo se alcanza cerrando la fase (genera la foto de clasificados).
export const EDITABLE_PHASE_STATUSES: PhaseStatus[] = ["upcoming", "active"];