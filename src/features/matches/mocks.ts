import { http, HttpResponse } from "msw";
import { API_URL } from "../../api/client";
import { DB_KEYS, readList, writeList } from "../../mocks/db";
import { getSessionUserId } from "../../mocks/session";
import { errorResponse } from "../../mocks/utils";
import type { Match, MatchInput, MatchUpdateInput } from "./types";

const getAll = (): Match[] => readList<Match>(DB_KEYS.matches);

const saveAll = (list: Match[]) => writeList(DB_KEYS.matches, list);

export const matchesHandlers = [
    http.get(
        `${API_URL}/tournaments/:tournamentId/matches`,
        ({ params, request }) => {
            if (!getSessionUserId()) {
                return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
            }

            const url = new URL(request.url);
            const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
            const limit = Math.min(
                100,
                Math.max(1, Number(url.searchParams.get("limit") ?? 20)),
            );
            const categoryId = url.searchParams.get("categoryId");
            const status = url.searchParams.get("status");
            const phaseId = url.searchParams.get("phaseId");

            let list = getAll().filter((m) => m.tournamentId === params.tournamentId);
            if (categoryId) list = list.filter((m) => m.categoryId === categoryId);
            if (status) list = list.filter((m) => m.status === status);
            if (phaseId) list = list.filter((m) => m.phaseId === phaseId);
            list.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

            const total = list.length;
            const start = (page - 1) * limit;

            return HttpResponse.json({
                matches: list.slice(start, start + limit),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.max(1, Math.ceil(total / limit)),
                },
            });
        },
    ),

    http.get(`${API_URL}/matches/:matchId`, ({ params }) => {
        if (!getSessionUserId()) {
            return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
        }

        const match = getAll().find((m) => m.id === params.matchId);
        if (!match) {
            return errorResponse(404, "MATCH_NOT_FOUND", "Partido no encontrado");
        }
        return HttpResponse.json({ match });
    }),

    http.post(
        `${API_URL}/tournaments/:tournamentId/matches`,
        async ({ params, request }) => {
            if (!getSessionUserId()) {
                return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
            }

            const body = (await request.json()) as MatchInput;

            if (!body.categoryId || !body.homeTeamId || !body.awayTeamId) {
                return errorResponse(400, "VALIDATION_ERROR", "Faltan datos del partido");
            }
            if (body.homeTeamId === body.awayTeamId) {
                return errorResponse(
                    400,
                    "SAME_TEAM_MATCH",
                    "El equipo local y visitante deben ser diferentes",
                );
            }
            if (!body.scheduledAt || Number.isNaN(Date.parse(body.scheduledAt))) {
                return errorResponse(
                    400,
                    "VALIDATION_ERROR",
                    "La fecha del partido no es válida",
                );
            }

            const match: Match = {
                id: crypto.randomUUID(),
                tournamentId: params.tournamentId as string,
                categoryId: body.categoryId,
                homeTeamId: body.homeTeamId,
                awayTeamId: body.awayTeamId,
                scheduledAt: new Date(body.scheduledAt).toISOString(),
                venue: body.venue?.trim() || null,
                status: "scheduled",
                phaseId: body.phaseId ?? null,
                phaseGroupId: body.phaseGroupId ?? null,
                round: body.round ?? null,
                homeScore: null,
                awayScore: null,
                homePenalties: null,
                awayPenalties: null,
            };

            saveAll([...getAll(), match]);
            return HttpResponse.json({ match }, { status: 201 });
        },
    ),

    http.patch(
        `${API_URL}/matches/:matchId`,
        async ({ params, request }) => {
            if (!getSessionUserId()) {
                return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
            }

            const body = (await request.json()) as MatchUpdateInput;
            const matches = getAll();
            const index = matches.findIndex((match) => match.id === params.matchId);
            if (index < 0) {
                return errorResponse(404, "MATCH_NOT_FOUND", "Partido no encontrado");
            }

            const current = matches[index];
            if (body.scheduledAt && Number.isNaN(Date.parse(body.scheduledAt))) {
                return errorResponse(400, "VALIDATION_ERROR", "La fecha del partido no es válida");
            }

            if (body.status && body.status !== current.status) {
                if (body.status === "in_progress" || body.status === "finished") {
                    return errorResponse(
                        400,
                        "USE_LIFECYCLE_ENDPOINTS",
                        "Para iniciar, finalizar o reabrir un partido usa los botones de la cédula",
                    );
                }
                if (!["scheduled", "cancelled", "postponed"].includes(body.status)) {
                    return errorResponse(400, "VALIDATION_ERROR", "El estado del partido no es válido");
                }
            }

            // Penales: ambos o ninguno, y solo con el marcador empatado.
            let penalties: Partial<Match> = {};
            if (body.homePenalties !== undefined || body.awayPenalties !== undefined) {
                const home = body.homePenalties ?? null;
                const away = body.awayPenalties ?? null;

                if (home !== null || away !== null) {
                    if (home === null || away === null) {
                        return errorResponse(
                            400,
                            "VALIDATION_ERROR",
                            "Registra los penales de ambos equipos",
                        );
                    }
                    if (
                        !Number.isInteger(home) ||
                        !Number.isInteger(away) ||
                        home < 0 ||
                        away < 0
                    ) {
                        return errorResponse(
                            400,
                            "VALIDATION_ERROR",
                            "Los penales deben ser números enteros",
                        );
                    }
                    const tied =
                        current.homeScore != null &&
                        current.homeScore === current.awayScore;
                    if (!tied) {
                        return errorResponse(
                            400,
                            "VALIDATION_ERROR",
                            "Los penales solo se pueden registrar con el marcador empatado",
                        );
                    }
                }
                penalties = { homePenalties: home, awayPenalties: away };
            }

            const updated: Match = {
                ...current,
                ...(body.scheduledAt ? { scheduledAt: new Date(body.scheduledAt).toISOString() } : {}),
                ...(body.venue !== undefined ? { venue: body.venue?.trim() || null } : {}),
                ...(body.status ? { status: body.status } : {}),
                ...penalties,
            };
            matches[index] = updated;
            saveAll(matches);
            return HttpResponse.json({ match: updated });
        },
    ),

];