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
    /** En un cambio es el jugador que sale. */
    playerId: string | null;
    assistedByPlayerId: string | null;
    /** Solo en un cambio: el jugador que entra. */
    substitutePlayerId?: string | null;
    description: string | null;
    clientEventId?: string | null;
    occurredAt?: string | null;
    /** Evento generado por el sistema (roja por doble amarilla). */
    derivedFromEventId?: string | null;
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
    assistedByPlayerId?: string;
    substitutePlayerId?: string;
    minute?: number;
    description?: string;
    /** UUID del cliente: un reintento con el mismo id no duplica el evento. */
    clientEventId?: string;
}

/** Orden en que se ofrecen en el formulario. */
export const EVENT_TYPES: MatchEventType[] = [
    "gol",
    "gol_penal",
    "autogol",
    "tarjeta_amarilla",
    "tarjeta_roja",
    "asistencia",
    "cambio",
    "otro",
];

export const EVENT_TYPE_META: Record<
    MatchEventType,
    { label: string; badge: string }
> = {
    gol: {
        label: "Gol",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    gol_penal: {
        label: "Gol de penal",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    autogol: {
        label: "Autogol",
        badge: "bg-orange-50 text-orange-700 border-orange-200",
    },
    tarjeta_amarilla: {
        label: "Tarjeta amarilla",
        badge: "bg-amber-50 text-amber-700 border-amber-200",
    },
    tarjeta_roja: {
        label: "Tarjeta roja",
        badge: "bg-rose-50 text-rose-700 border-rose-200",
    },
    asistencia: {
        label: "Asistencia",
        badge: "bg-sky-50 text-sky-700 border-sky-200",
    },
    cambio: {
        label: "Cambio",
        badge: "bg-violet-50 text-violet-700 border-violet-200",
    },
    otro: {
        label: "Otro",
        badge: "bg-slate-50 text-slate-700 border-slate-200",
    },
};

/** Solo los eventos que suman al marcador (los usa el cálculo del marcador). */
export const GOAL_EVENT_TYPES = ["gol", "gol_penal", "autogol"] as const;

export type GoalEventType = (typeof GOAL_EVENT_TYPES)[number];

export const GOAL_EVENT_LABELS: Record<GoalEventType, string> = {
    gol: "Gol",
    gol_penal: "Gol de penal",
    autogol: "Autogol",
};