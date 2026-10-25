import { http, HttpResponse } from "msw";
import { API_URL } from "../../api/client";
import { DEMO_TOURNAMENT_ID, getSessionUserId } from "../../mocks/session";
import { errorResponse } from "../../mocks/utils";
import type { Phase, PhaseInput, PhaseStatus, PhaseType } from "./types";

import type { Match } from "../matches/types";

const STORAGE_KEY = "mock_phases";
const MATCHES_KEY = "mock_matches";

const now = () => new Date().toISOString();

const seed: Phase[] = [
    {
        id: "60000000-0000-0000-0000-000000000001",
        tournamentId: DEMO_TOURNAMENT_ID,
        categoryId: "30000000-0000-0000-0000-000000000001",
        name: "Fase de grupos",
        type: "group",
        status: "upcoming",
        sortOrder: 1,
        startDate: null,
        endDate: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
    },
];

const getAll = (): Phase[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as Phase[];
    } catch {
        // corrupted
    }
    return seed;
};

const saveAll = (list: Phase[]) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

const TYPES: PhaseType[] = ["group", "knockout", "league"];
const STATUSES: PhaseStatus[] = ["upcoming", "active", "finished"];

export const phasesHandlers = [
    http.get(
        `${API_URL}/tournaments/:tournamentId/categories/:categoryId/phases`,
        ({ params }) => {
            const list = getAll().filter(
                (p) =>
                    p.tournamentId === params.tournamentId &&
                    p.categoryId === params.categoryId,
            );
            return HttpResponse.json({ phases: list });
        },
    ),

    http.post(
        `${API_URL}/tournaments/:tournamentId/categories/:categoryId/phases`,
        async ({ params, request }) => {
            if (!getSessionUserId()) {
                return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
            }

            const body = (await request.json()) as PhaseInput;
            const name = body.name?.trim();
            if (!name) {
                return errorResponse(400, "VALIDATION_ERROR", "El nombre es obligatorio");
            }
            if (!body.type || !TYPES.includes(body.type)) {
                return errorResponse(400, "VALIDATION_ERROR", "Tipo de fase inválido");
            }

            const siblings = getAll().filter(
                (p) =>
                    p.tournamentId === params.tournamentId &&
                    p.categoryId === params.categoryId,
            );
            const maxOrder = siblings.reduce((m, p) => Math.max(m, p.sortOrder), 0);

            const phase: Phase = {
                id: crypto.randomUUID(),
                tournamentId: params.tournamentId as string,
                categoryId: params.categoryId as string,
                name,
                type: body.type,
                status:
                    body.status && STATUSES.includes(body.status)
                        ? body.status
                        : "upcoming",
                sortOrder: body.sortOrder ?? maxOrder + 1,
                startDate: body.startDate || null,
                endDate: body.endDate || null,
                createdAt: now(),
                updatedAt: now(),
            };

            saveAll([...getAll(), phase]);
            return HttpResponse.json({ phase }, { status: 201 });
        },
    ),

    http.get(`${API_URL}/phases/:id`, ({ params }) => {
        const phase = getAll().find((p) => p.id === params.id);
        if (!phase) {
            return errorResponse(404, "PHASE_NOT_FOUND", "Fase no encontrada");
        }
        return HttpResponse.json({ phase });
    }),

    http.patch(`${API_URL}/phases/:id`, async ({ params, request }) => {
        if (!getSessionUserId()) {
            return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
        }

        const all = getAll();
        const current = all.find((p) => p.id === params.id);
        if (!current) {
            return errorResponse(404, "PHASE_NOT_FOUND", "Fase no encontrada");
        }

        const body = (await request.json()) as Partial<PhaseInput>;
        const name =
            body.name !== undefined ? body.name.trim() : current.name;
        if (!name) {
            return errorResponse(400, "VALIDATION_ERROR", "El nombre es obligatorio");
        }

        const updated: Phase = {
            ...current,
            name,
            type: body.type ?? current.type,
            status: body.status ?? current.status,
            sortOrder: body.sortOrder ?? current.sortOrder,
            startDate:
                body.startDate !== undefined
                    ? body.startDate || null
                    : current.startDate,
            endDate:
                body.endDate !== undefined ? body.endDate || null : current.endDate,
            updatedAt: now(),
        };

        saveAll(all.map((p) => (p.id === current.id ? updated : p)));
        return HttpResponse.json({ phase: updated });
    }),

    http.delete(`${API_URL}/phases/:id`, ({ params }) => {
        if (!getSessionUserId()) {
            return errorResponse(
                401,
                "UNAUTHORIZED",
                "No hay sesión activa",
            );
        }

        const all = getAll();

        if (!all.some((phase) => phase.id === params.id)) {
            return errorResponse(
                404,
                "PHASE_NOT_FOUND",
                "Fase no encontrada",
            );
        }

        let matches: Match[] = [];

        try {
            const raw = localStorage.getItem(MATCHES_KEY);

            if (raw) {
                matches = JSON.parse(raw) as Match[];
            }
        } catch {
            return errorResponse(
                500,
                "MOCK_STORAGE_ERROR",
                "No se pudieron verificar los partidos de la fase.",
            );
        }

        if (matches.some((match) => match.phaseId === params.id)) {
            return errorResponse(
                409,
                "PHASE_HAS_MATCHES",
                "No se puede eliminar una fase que todavía tiene partidos",
            );
        }

        saveAll(all.filter((phase) => phase.id !== params.id));

        return HttpResponse.json({
            message: "Phase deleted successfully",
        });
    }),
];