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

// ---- Posiciones y clasificación (GET /phases/:id/standings) ----

export interface StandingRow {
    teamId: string;
    position: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    /** Equipos con el mismo valor siguen empatados tras los desempates automáticos. */
    tieGroup: number | null;
    /** true si el orden de este equipo lo decidió el admin. */
    resolvedManually: boolean;
}

export interface GroupStandings {
    group: PhaseGroup;
    standings: StandingRow[];
}

export interface QualifiedTeam {
    teamId: string;
    groupId: string;
    position: number;
    via: "group" | "best_next";
}

export interface BestNextEntry {
    teamId: string;
    groupId: string;
    points: number;
    goalDifference: number;
    goalsFor: number;
    qualified: boolean;
}

export interface PendingTie {
    scope: "group" | "best_next";
    groupId: string | null;
    teamIds: string[];
}

export interface Qualification {
    perGroup: number;
    bestNext: number;
    qualified: QualifiedTeam[];
    bestNextRanking: BestNextEntry[];
    pendingTies: PendingTie[];
}

export interface PhaseProgress {
    expectedMatches: number;
    finishedMatches: number;
    isComplete: boolean;
}

export type ManualRankScope = "group" | "best_next";

export interface ManualRank {
    teamId: string;
    scope: ManualRankScope;
    rank: number;
}

export interface SetManualRanksPayload {
    scope: ManualRankScope;
    ranks: { teamId: string; rank: number }[];
}

// ---- Cierre de fase ----

export interface ClosedQualifiedTeam {
    teamId: string;
    groupId: string | null;
    position: number;
    via: "group" | "best_next";
    points: number;
    goalDifference: number;
    goalsFor: number;
}

/** Foto de los clasificados guardada al cerrar la fase. */
export interface PhaseClosure {
    qualifiersPerGroup: number;
    bestNextCount: number;
    closedAt: string;
    qualified: ClosedQualifiedTeam[];
}

export interface ClosePhasePayload {
    perGroup: number;
    bestNext: number;
}

export interface PhaseStandingsResponse {
    phase: Phase;
    progress: PhaseProgress;
    groups: GroupStandings[];
    qualification: Qualification | null;
    manualRanks: ManualRank[];
    /** null si la fase sigue abierta. */
    closure: PhaseClosure | null;
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