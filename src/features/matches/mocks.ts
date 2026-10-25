
import { http, HttpResponse } from "msw";
import { API_URL } from "../../api/client";
import { getSessionUserId } from "../../mocks/session";
import { errorResponse } from "../../mocks/utils";
import type { Match, MatchInput } from "./types";

const STORAGE_KEY = "mock_matches";

const getAll = (): Match[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as Match[];
    } catch {
        // El almacenamiento está vacío o contiene datos inválidos.
    }

    return [];
};

const saveAll = (list: Match[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

export const matchesHandlers = [
    http.get(
        `${API_URL}/tournaments/:tournamentId/matches`,
        ({ params, request }) => {
            if (!getSessionUserId()) {
                return errorResponse(
                    401,
                    "UNAUTHORIZED",
                    "No hay sesión activa",
                );
            }

            const url = new URL(request.url);
            const page = Math.max(
                1,
                Number(url.searchParams.get("page") ?? 1),
            );
            const limit = Math.min(
                100,
                Math.max(
                    1,
                    Number(url.searchParams.get("limit") ?? 20),
                ),
            );

            const categoryId = url.searchParams.get("categoryId");
            const status = url.searchParams.get("status");
            const phaseId = url.searchParams.get("phaseId");

            let list = getAll().filter(
                (match) => match.tournamentId === params.tournamentId,
            );

            if (categoryId) {
                list = list.filter(
                    (match) => match.categoryId === categoryId,
                );
            }

            if (status) {
                list = list.filter((match) => match.status === status);
            }

            if (phaseId) {
                list = list.filter(
                    (match) => match.phaseId === phaseId,
                );
            }

            list.sort((a, b) =>
                a.scheduledAt.localeCompare(b.scheduledAt),
            );

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

    http.post(
        `${API_URL}/tournaments/:tournamentId/matches`,
        async ({ params, request }) => {
            if (!getSessionUserId()) {
                return errorResponse(
                    401,
                    "UNAUTHORIZED",
                    "No hay sesión activa",
                );
            }

            const body = (await request.json()) as MatchInput;

            if (
                !body.categoryId ||
                !body.homeTeamId ||
                !body.awayTeamId
            ) {
                return errorResponse(
                    400,
                    "VALIDATION_ERROR",
                    "Faltan datos del partido",
                );
            }

            if (body.homeTeamId === body.awayTeamId) {
                return errorResponse(
                    400,
                    "SAME_TEAM_MATCH",
                    "El equipo local y visitante deben ser diferentes",
                );
            }

            if (
                !body.scheduledAt ||
                Number.isNaN(Date.parse(body.scheduledAt))
            ) {
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
                return errorResponse(
                    401,
                    "UNAUTHORIZED",
                    "No hay sesión activa",
                );
            }

            const matchId = String(params.matchId);
            const body = (await request.json()) as Partial<Match>;
            const all = getAll();

            const index = all.findIndex(
                (match) => match.id === matchId,
            );

            if (index < 0) {
                return errorResponse(
                    404,
                    "MATCH_NOT_FOUND",
                    "El partido no existe",
                );
            }

            const current = all[index];
            const nextStatus = body.status ?? current.status;

            const validStatuses = [
                "scheduled",
                "in_progress",
                "finished",
                "cancelled",
                "postponed",
            ];

            if (!validStatuses.includes(nextStatus)) {
                return errorResponse(
                    400,
                    "INVALID_MATCH_STATUS",
                    "El estado del partido no es válido",
                );
            }

            const nextHomeScore =
                body.homeScore === undefined
                    ? current.homeScore
                    : body.homeScore;

            const nextAwayScore =
                body.awayScore === undefined
                    ? current.awayScore
                    : body.awayScore;

            const scoreIsValid = (value: unknown) =>
                value === null ||
                (typeof value === "number" &&
                    Number.isInteger(value) &&
                    value >= 0);

            if (
                !scoreIsValid(nextHomeScore) ||
                !scoreIsValid(nextAwayScore)
            ) {
                return errorResponse(
                    400,
                    "VALIDATION_ERROR",
                    "Los marcadores deben ser números enteros no negativos",
                );
            }

            if (
                (nextHomeScore == null) !==
                (nextAwayScore == null)
            ) {
                return errorResponse(
                    400,
                    "VALIDATION_ERROR",
                    "Captura ambos marcadores o deja ambos vacíos",
                );
            }

            let scheduledAt = current.scheduledAt;

            if (body.scheduledAt !== undefined) {
                if (
                    !body.scheduledAt ||
                    Number.isNaN(Date.parse(body.scheduledAt))
                ) {
                    return errorResponse(
                        400,
                        "VALIDATION_ERROR",
                        "La fecha del partido no es válida",
                    );
                }

                scheduledAt = new Date(body.scheduledAt).toISOString();
            }

            const updated: Match = {
                ...current,
                scheduledAt,
                venue:
                    body.venue === undefined
                        ? current.venue
                        : body.venue?.trim() || null,
                status: nextStatus,
                homeScore: nextHomeScore,
                awayScore: nextAwayScore,
                homePenalties:
                    body.homePenalties === undefined
                        ? current.homePenalties
                        : body.homePenalties,
                awayPenalties:
                    body.awayPenalties === undefined
                        ? current.awayPenalties
                        : body.awayPenalties,
            };

            all[index] = updated;
            saveAll(all);

            return HttpResponse.json({ match: updated });
        },
    ),
];
