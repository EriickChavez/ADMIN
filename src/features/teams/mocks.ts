import { http, HttpResponse } from "msw";
import { API_URL } from "../../api/client";
import { DEMO_TOURNAMENT_ID, getSessionUserId } from "../../mocks/session";
import { errorResponse } from "../../mocks/utils";
import type { Team, TeamInput } from "./types";

const STORAGE_KEY = "mock_teams";

const seed: Team[] = [
    {
        id: "40000000-0000-0000-0000-000000000001",
        tournamentId: DEMO_TOURNAMENT_ID,
        categoryId: "30000000-0000-0000-0000-000000000001",
        name: "Águilas FC",
        abbreviation: "AGU",
        logoUrl: null,
    },
    {
        id: "40000000-0000-0000-0000-000000000002",
        tournamentId: DEMO_TOURNAMENT_ID,
        categoryId: "30000000-0000-0000-0000-000000000001",
        name: "Leones",
        abbreviation: "LEO",
        logoUrl: null,
    },
    {
        id: "40000000-0000-0000-0000-000000000003",
        tournamentId: DEMO_TOURNAMENT_ID,
        categoryId: "30000000-0000-0000-0000-000000000002",
        name: "Tigres U18",
        abbreviation: "TIG",
        logoUrl: null,
    },
];

const getAll = (): Team[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as Team[];
    } catch {
        // corrupted
    }
    return seed;
};

const saveAll = (list: Team[]) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

export const teamsHandlers = [
    http.get(`${API_URL}/tournaments/:tournamentId/teams`, ({ params, request }) => {
        if (!getSessionUserId()) {
            return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
        }

        const url = new URL(request.url);
        const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
        const limit = Math.max(1, Number(url.searchParams.get("limit") ?? 20));
        const categoryId = url.searchParams.get("categoryId");

        let list = getAll().filter((t) => t.tournamentId === params.tournamentId);
        if (categoryId) list = list.filter((t) => t.categoryId === categoryId);

        const total = list.length;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const start = (page - 1) * limit;
        const teams = list.slice(start, start + limit);

        return HttpResponse.json({
            teams,
            pagination: { page, limit, total, totalPages },
        });
    }),

    http.post(
        `${API_URL}/tournaments/:tournamentId/teams`,
        async ({ params, request }) => {
            if (!getSessionUserId()) {
                return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
            }

            const body = (await request.json()) as TeamInput;
            const name = body.name?.trim();
            const abbreviation = body.abbreviation?.trim().toUpperCase() ?? "";
            const categoryId = body.categoryId;

            if (!name) {
                return errorResponse(400, "VALIDATION_ERROR", "El nombre es obligatorio");
            }
            if (!categoryId) {
                return errorResponse(
                    400,
                    "VALIDATION_ERROR",
                    "La categoría es obligatoria",
                );
            }
            if (abbreviation && abbreviation.length > 50) {
                return errorResponse(
                    400,
                    "VALIDATION_ERROR",
                    "La abreviatura máximo 50 caracteres",
                );
            }

            const team: Team = {
                id: crypto.randomUUID(),
                tournamentId: params.tournamentId as string,
                categoryId,
                name,
                abbreviation: abbreviation || name.slice(0, 3).toUpperCase(),
                logoUrl: body.logoUrl ?? null,
            };

            saveAll([...getAll(), team]);
            return HttpResponse.json({ team }, { status: 201 });
        },
    ),

    http.patch(`${API_URL}/teams/:id`, async ({ params, request }) => {
        if (!getSessionUserId()) {
            return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
        }

        const all = getAll();
        const current = all.find((t) => t.id === params.id);
        if (!current) {
            return errorResponse(404, "TEAM_NOT_FOUND", "Equipo no encontrado");
        }

        const body = (await request.json()) as Partial<TeamInput>;
        const name =
            body.name !== undefined ? body.name.trim() : current.name;
        const abbreviation =
            body.abbreviation !== undefined
                ? body.abbreviation.trim().toUpperCase()
                : current.abbreviation;

        if (!name) {
            return errorResponse(400, "VALIDATION_ERROR", "El nombre es obligatorio");
        }
        if (abbreviation.length > 50) {
            return errorResponse(
                400,
                "VALIDATION_ERROR",
                "La abreviatura máximo 50 caracteres",
            );
        }

        const updated: Team = {
            ...current,
            name,
            abbreviation,
            categoryId: body.categoryId ?? current.categoryId,
            logoUrl:
                body.logoUrl !== undefined ? body.logoUrl : current.logoUrl,
        };

        saveAll(all.map((t) => (t.id === current.id ? updated : t)));
        return HttpResponse.json({ team: updated });
    }),

    http.delete(`${API_URL}/teams/:id`, ({ params }) => {
        if (!getSessionUserId()) {
            return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
        }

        const all = getAll();
        if (!all.some((t) => t.id === params.id)) {
            return errorResponse(404, "TEAM_NOT_FOUND", "Equipo no encontrado");
        }

        saveAll(all.filter((t) => t.id !== params.id));
        return HttpResponse.json({ message: "Team deleted successfully" });
    }),
];