export type MatchEventType =
    | "gol"
    | "gol_penal"
    | "autogol"
    | "asistencia"
    | "tarjeta_amarilla"
    | "tarjeta_roja"
    | "cambio"
    | "otro";

export interface MatchEvent {
    id: string;
    matchId: string;
    eventType: MatchEventType;
    minute: number | null;
    teamId: string;
    playerId: string | null;
    assistedByPlayerId: string | null;
    description: string | null;
}

export interface MatchEventsResponse {
    events: MatchEvent[];
}

export interface MatchEventResponse {
    event: MatchEvent;
}

export interface MatchEventInput {
    eventType: MatchEventType;
    teamId: string;
    playerId?: string;
    minute?: number;
    description?: string;
}

/** Los únicos eventos que la cédula de ADMIN registra por ahora. */
export const GOAL_EVENT_TYPES = ["gol", "gol_penal", "autogol"] as const;

export type GoalEventType = (typeof GOAL_EVENT_TYPES)[number];

export const GOAL_EVENT_LABELS: Record<GoalEventType, string> = {
    gol: "Gol",
    gol_penal: "Gol de penal",
    autogol: "Autogol",
};