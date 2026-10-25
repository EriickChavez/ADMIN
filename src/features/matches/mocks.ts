// src/features/matches/mocks.ts

import { http, HttpResponse } from "msw";
import { API_URL } from "../../api/client";
import { getSessionUserId } from "../../mocks/session";
import { errorResponse } from "../../mocks/utils";
import type { Match, MatchInput, MatchStatus } from "./types";

const STORAGE_KEY = "mock_matches";

const getAll = (): Match[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as Match[];
    } catch {
        // Si el almacenamiento está dañado, se inicia con una lista vacía.
    }

    return [];
};

const saveAll = (matches: Match[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
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
                Math.max(1, Number(url.searchParams.get("limit") ?? 20)),
            );

            const categoryId = url.searchParams.get("categoryId");
            const status = url.searchParams.get("status");
            const phaseId = url.searchParams.get("phaseId");

            let matches = getAll().filter(
                (match) => match.tournamentId === params.tournamentId,
            );

            if (categoryId) {
                matches = matches.filter(
                    (match) => match.categoryId === categoryId,
                );
            }

            if (status) {
                matches = matches.filter(
                    (match) => match.status === status,
                );
            }

            if (phaseId) {
                matches = matches.filter(
                    (match) => match.phaseId === phaseId,
                );
            }

            matches.sort((a, b) =>
                a.scheduledAt.localeCompare(b.scheduledAt),
            );

            const total = matches.length;
            const start = (page - 1) * limit;

            return HttpResponse.json({
                matches: matches.slice(start, start + limit),
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

            const body = (await request.json()) as {
                scheduledAt?: string;
                venue?: string | null;
                status?: MatchStatus;
            };

            const matches = getAll();
            const index = matches.findIndex(
                (match) => match.id === params.matchId,
            );

            if (index < 0) {
                return errorResponse(
                    404,
                    "NOT_FOUND",
                    "Partido no encontrado",
                );
            }

            const current = matches[index];

            if (
                body.scheduledAt &&
                Number.isNaN(Date.parse(body.scheduledAt))
            ) {
                return errorResponse(
                    400,
                    "VALIDATION_ERROR",
                    "La fecha del partido no es válida",
                );
            }

            const allowedStatuses: MatchStatus[] = [
                "scheduled",
                "cancelled",
                "postponed",
            ];

            if (
                body.status &&
                body.status !== current.status &&
                !allowedStatuses.includes(body.status)
            ) {
                return errorResponse(
                    400,
                    "VALIDATION_ERROR",
                    "El estado no se puede cambiar desde el calendario",
                );
            }

            const updated: Match = {
                ...current,
                ...(body.scheduledAt
                    ? {
                        scheduledAt: new Date(
                            body.scheduledAt,
                        ).toISOString(),
                    }
                    : {}),
                ...(body.venue !== undefined
                    ? { venue: body.venue?.trim() || null }
                    : {}),
                ...(body.status ? { status: body.status } : {}),
            };

            matches[index] = updated;
            saveAll(matches);

            return HttpResponse.json({ match: updated });
        },
    ),
];