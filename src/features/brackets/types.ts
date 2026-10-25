export type BracketStage = "play_in" | "main" | "third_place";

export interface BracketNodeSource {
    nodeId: string;
    kind: "winner" | "loser";
}

export interface BracketNode {
    id: string;
    stage: BracketStage;
    round: number;
    position: number;
    /** 1 = partido único; 2 = ida y vuelta. */
    legs: 1 | 2;
    homeTeamId: string | null;
    awayTeamId: string | null;
    homeSeed: number | null;
    awaySeed: number | null;
    /** De dónde saldrá el equipo mientras no se conoce. */
    homeSource: BracketNodeSource | null;
    awaySource: BracketNodeSource | null;
    /** Partido de ida (o el único). */
    matchId: string | null;
    /** Partido de vuelta; en él, el local es el visitante del cruce. */
    secondLegMatchId: string | null;
    /** Penales del cruce a dos partidos (respecto a homeTeamId / awayTeamId). */
    homePenalties: number | null;
    awayPenalties: number | null;
    winnerTeamId: string | null;
}

export interface GenerateBracketPayload {
    sourcePhaseId: string;
    thirdPlace?: boolean;
    /** Cruces del cuadro principal a ida y vuelta (sin gol de visitante). */
    twoLegged?: boolean;
    /** Con ida y vuelta, la final a partido único. */
    singleLegFinal?: boolean;
}

export interface ScheduleBracketNodePayload {
    scheduledAt: string;
    venue?: string;
    /** 1 = partido único o ida (por defecto); 2 = vuelta. */
    leg?: 1 | 2;
}

export interface SetBracketNodePenaltiesPayload {
    homePenalties: number | null;
    awayPenalties: number | null;
}