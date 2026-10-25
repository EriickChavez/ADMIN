import { http, HttpResponse } from "msw";
import { API_URL } from "../../api/client";
import { DB_KEYS, readList, writeList } from "../../mocks/db";
import { getSessionUserId } from "../../mocks/session";
import { errorResponse } from "../../mocks/utils";
import type { Match, MatchStatus } from "../matches";
import { GOAL_EVENT_TYPES, type MatchEvent, type MatchEventInput } from "./types";
import { deriveScore } from "./utils/score";

const unauthorized = () =>
    errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");

const readMatches = () => readList<Match>(DB_KEYS.matches);
const readEvents = () => readList<MatchEvent>(DB_KEYS.matchEvents);

/** Recalcula y guarda el marcador del partido a partir de sus eventos. */
function syncScore(matchId: string): Match | null {
    const matches = readMatches();
    const index = matches.findIndex((m) => m.id === matchId);
    if (index < 0) return null;

    const match = matches[index];
    const events = readEvents().filter((e) => e.matchId === matchId);
    const { home, away } = deriveScore(events, match.homeTeamId, match.awayTeamId);

    const updated: Match = {
        ...match,
        homeScore: home,
        awayScore: away,
        // Si el marcador deja de estar empatado, los penales ya no aplican.
        ...(home === away
            ? {}
            : { homePenalties: null, awayPenalties: null }),
    };
    matches[index] = updated;
    writeList(DB_KEYS.matches, matches);
    return updated;
}

function transition(matchId: string, from: MatchStatus[], to: MatchStatus) {
    const matches = readMatches();
    const index = matches.findIndex((m) => m.id === matchId);
    if (index < 0) {
        return errorResponse(404, "MATCH_NOT_FOUND", "Partido no encontrado");
    }

    const match = matches[index];
    if (!from.includes(match.status)) {
        return errorResponse(
            409,
            "INVALID_MATCH_TRANSITION",
            "Ese cambio de estado no es posible desde el estado actual del partido",
        );
    }

    matches[index] = { ...match, status: to };
    writeList(DB_KEYS.matches, matches);
    // Al iniciar queda 0-0; al finalizar se fija el marcador desde los eventos.
    return HttpResponse.json({ match: syncScore(matchId) });
}

// Además de los eventos, aquí vive el ciclo de vida del partido (start, finish
// y reopen): el marcador sale de los eventos, así que van juntos.
export const matchEventsHandlers = [
    http.post(`${API_URL}/matches/:matchId/start`, ({ params }) => {
        if (!getSessionUserId()) return unauthorized();
        return transition(
            params.matchId as string,
            ["scheduled", "postponed"],
            "in_progress",
        );
    }),

    http.post(`${API_URL}/matches/:matchId/finish`, ({ params }) => {
        if (!getSessionUserId()) return unauthorized();
        return transition(params.matchId as string, ["in_progress"], "finished");
    }),

    http.post(`${API_URL}/matches/:matchId/reopen`, ({ params }) => {
        if (!getSessionUserId()) return unauthorized();
        return transition(params.matchId as string, ["finished"], "in_progress");
    }),

    http.get(`${API_URL}/matches/:matchId/events`, ({ params }) => {
        if (!getSessionUserId()) return unauthorized();

        const events = readEvents()
            .filter((e) => e.matchId === params.matchId)
            .sort((a, b) => (a.minute ?? 9999) - (b.minute ?? 9999));
        return HttpResponse.json({ events });
    }),

    http.post(
        `${API_URL}/matches/:matchId/events`,
        async ({ params, request }) => {
            if (!getSessionUserId()) return unauthorized();

            const match = readMatches().find((m) => m.id === params.matchId);
            if (!match) {
                return errorResponse(404, "MATCH_NOT_FOUND", "Partido no encontrado");
            }
            if (match.status !== "in_progress") {
                return errorResponse(
                    409,
                    "MATCH_NOT_IN_PROGRESS",
                    "La cédula no está abierta",
                );
            }

            const body = (await request.json()) as MatchEventInput;

            if (!(GOAL_EVENT_TYPES as readonly string[]).includes(body.eventType)) {
                return errorResponse(
                    400,
                    "VALIDATION_ERROR",
                    "Este mock solo registra goles, goles de penal y autogoles",
                );
            }
            if (body.teamId !== match.homeTeamId && body.teamId !== match.awayTeamId) {
                return errorResponse(
                    400,
                    "INVALID_TEAM",
                    "El equipo no participa en este partido",
                );
            }
            if (
                body.minute !== undefined &&
                (!Number.isInteger(body.minute) || body.minute < 0 || body.minute > 300)
            ) {
                return errorResponse(
                    400,
                    "VALIDATION_ERROR",
                    "El minuto debe ser un entero entre 0 y 300",
                );
            }

            const event: MatchEvent = {
                id: crypto.randomUUID(),
                matchId: params.matchId as string,
                eventType: body.eventType,
                minute: body.minute ?? null,
                teamId: body.teamId,
                playerId: body.playerId ?? null,
                assistedByPlayerId: null,
                description: body.description?.trim() || null,
            };

            writeList(DB_KEYS.matchEvents, [...readEvents(), event]);
            syncScore(match.id);
            return HttpResponse.json({ event }, { status: 201 });
        },
    ),

    http.delete(`${API_URL}/match-events/:id`, ({ params }) => {
        if (!getSessionUserId()) return unauthorized();

        const events = readEvents();
        const event = events.find((e) => e.id === params.id);
        if (!event) {
            return errorResponse(404, "MATCH_EVENT_NOT_FOUND", "Evento no encontrado");
        }

        const match = readMatches().find((m) => m.id === event.matchId);
        if (!match || match.status !== "in_progress") {
            return errorResponse(
                409,
                "MATCH_NOT_IN_PROGRESS",
                "La cédula no está abierta",
            );
        }

        writeList(
            DB_KEYS.matchEvents,
            events.filter((e) => e.id !== event.id),
        );
        syncScore(match.id);
        return HttpResponse.json({ message: "Match event deleted successfully" });
    }),
];