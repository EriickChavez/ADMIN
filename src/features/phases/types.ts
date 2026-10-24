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