import type { MatchEvent } from "../types";

/**
 * Marcador derivado de los eventos. El autogol suma al rival del equipo del
 * jugador que lo cometió.
 */
export function deriveScore(
    events: Pick<MatchEvent, "eventType" | "teamId">[],
    homeTeamId: string,
    awayTeamId: string,
) {
    let home = 0;
    let away = 0;

    for (const event of events) {
        let scoringTeamId: string | null = null;
        if (event.eventType === "gol" || event.eventType === "gol_penal") {
            scoringTeamId = event.teamId;
        } else if (event.eventType === "autogol") {
            scoringTeamId = event.teamId === homeTeamId ? awayTeamId : homeTeamId;
        }

        if (scoringTeamId === homeTeamId) home += 1;
        else if (scoringTeamId === awayTeamId) away += 1;
    }

    return { home, away };
}