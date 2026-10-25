export type MatchStatus =
    | "scheduled"
    | "in_progress"
    | "finished"
    | "cancelled"
    | "postponed";

export interface MatchTeamSummary {
    id: string;
    name: string;
    abbreviation: string | null;
    logoUrl: string | null;
}

export interface MatchCategorySummary {
    id: string;
    title: string;
}

export interface Match {
    id: string;
    tournamentId: string;
    categoryId: string;
    homeTeamId: string;
    awayTeamId: string;
    scheduledAt: string;
    venue: string | null;
    status: MatchStatus;
    phaseId?: string | null;
    phaseGroupId?: string | null;
    round?: number | null;
    homeScore?: number | null;
    awayScore?: number | null;
    homePenalties?: number | null;
    awayPenalties?: number | null;
    /** Solo vienen en el listado y el detalle (respuesta enriquecida). */
    homeTeam?: MatchTeamSummary;
    awayTeam?: MatchTeamSummary;
    category?: MatchCategorySummary;
}

export interface MatchesPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface MatchesResponse {
    matches: Match[];
    pagination: MatchesPagination;
}

export interface MatchResponse {
    match: Match;
}

export interface MatchUpdateInput {
    scheduledAt?: string;
    venue?: string | null;
    status?: MatchStatus;
}

export interface MatchInput {
    categoryId: string;
    homeTeamId: string;
    awayTeamId: string;
    scheduledAt: string;
    venue?: string;
    phaseId?: string | null;
    phaseGroupId?: string | null;
    round?: number | null;
}

export interface MatchesQuery {
    page?: number;
    limit?: number;
    categoryId?: string;
    status?: MatchStatus;
    phaseId?: string;
}

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
    scheduled: "Programado",
    in_progress: "En curso",
    finished: "Finalizado",
    cancelled: "Cancelado",
    postponed: "Pospuesto",
};