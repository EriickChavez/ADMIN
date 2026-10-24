import { http, HttpResponse } from "msw";
import { API_URL } from "../../api/client";
import { DEMO_TOURNAMENT_ID, getSessionUserId } from "../../mocks/session";
import { errorResponse } from "../../mocks/utils";
import type { Player, PlayerInput } from "./types";

const STORAGE_KEY = "mock_players";

const seed: Player[] = [
    {
        id: "50000000-0000-0000-0000-000000000001",
        tournamentId: DEMO_TOURNAMENT_ID,
        categoryId: "30000000-0000-0000-0000-000000000001",
        teamId: "40000000-0000-0000-0000-000000000001",
        firstName: "Carlos",
        lastName: "Ramírez",
        birthDate: "2012-05-12",
        number: 10,
        isCaptain: true,
        role: null,
    },
    {
        id: "50000000-0000-0000-0000-000000000002",
        tournamentId: DEMO_TOURNAMENT_ID,
        categoryId: "30000000-0000-0000-0000-000000000001",
        teamId: "40000000-0000-0000-0000-000000000001",
        firstName: "Luis",
        lastName: "Mendoza",
        birthDate: "2013-01-20",
        number: 7,
        isCaptain: false,
        role: null,
    },
];

const getAll = (): Player[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as Player[];
    } catch {
        // corrupted
    }
    return seed;
};

const saveAll = (list: Player[]) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

function paginate(list: Player[], request: Request) {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit = Math.max(1, Number(url.searchParams.get("limit") ?? 20));
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    return {
        players: list.slice(start, start + limit),
        pagination: { page, limit, total, totalPages },
    };
}

export const playersHandlers = [
    http.get(
        `${API_URL}/tournaments/:tournamentId/players`,
        ({ params, request }) => {
            if (!getSessionUserId()) {
                return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
            }

            const url = new URL(request.url);
            const categoryId = url.searchParams.get("categoryId");
            const teamId = url.searchParams.get("teamId");

            let list = getAll().filter((p) => p.tournamentId === params.tournamentId);
            if (categoryId) list = list.filter((p) => p.categoryId === categoryId);
            if (teamId) list = list.filter((p) => p.teamId === teamId);

            return HttpResponse.json(paginate(list, request));
        },
    ),

    http.get(`${API_URL}/teams/:teamId/players`, ({ params, request }) => {
        const list = getAll().filter((p) => p.teamId === params.teamId);
        return HttpResponse.json(paginate(list, request));
    }),

    http.post(
        `${API_URL}/tournaments/:tournamentId/players`,
        async ({ params, request }) => {
            if (!getSessionUserId()) {
                return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
            }

            const body = (await request.json()) as PlayerInput;
            const firstName = body.firstName?.trim();
            const lastName = body.lastName?.trim();

            if (!firstName) {
                return errorResponse(400, "VALIDATION_ERROR", "El nombre es obligatorio");
            }
            if (!lastName) {
                return errorResponse(
                    400,
                    "VALIDATION_ERROR",
                    "El apellido es obligatorio",
                );
            }
            if (!body.teamId) {
                return errorResponse(400, "VALIDATION_ERROR", "El equipo es obligatorio");
            }
            if (!body.categoryId) {
                return errorResponse(
                    400,
                    "VALIDATION_ERROR",
                    "La categoría es obligatoria",
                );
            }
            if (body.number == null || !Number.isInteger(body.number)) {
                return errorResponse(400, "VALIDATION_ERROR", "El número es obligatorio");
            }
            if (body.number < 0 || body.number > 999) {
                return errorResponse(400, "VALIDATION_ERROR", "Número entre 0 y 999");
            }

            const player: Player = {
                id: crypto.randomUUID(),
                tournamentId: params.tournamentId as string,
                categoryId: body.categoryId,
                teamId: body.teamId,
                firstName,
                lastName,
                birthDate: body.birthDate || null,
                number: body.number,
                isCaptain: !!body.isCaptain,
                role: body.role?.trim() || null,
            };

            saveAll([...getAll(), player]);
            return HttpResponse.json({ player }, { status: 201 });
        },
    ),

    http.patch(`${API_URL}/players/:id`, async ({ params, request }) => {
        if (!getSessionUserId()) {
            return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
        }

        const all = getAll();
        const current = all.find((p) => p.id === params.id);
        if (!current) {
            return errorResponse(404, "PLAYER_NOT_FOUND", "Jugador no encontrado");
        }

        const body = (await request.json()) as Partial<PlayerInput>;
        const firstName =
            body.firstName !== undefined ? body.firstName.trim() : current.firstName;
        const lastName =
            body.lastName !== undefined ? body.lastName.trim() : current.lastName;

        if (!firstName) {
            return errorResponse(400, "VALIDATION_ERROR", "El nombre es obligatorio");
        }
        if (!lastName) {
            return errorResponse(400, "VALIDATION_ERROR", "El apellido es obligatorio");
        }

        const updated: Player = {
            ...current,
            firstName,
            lastName,
            categoryId: body.categoryId ?? current.categoryId,
            teamId: body.teamId ?? current.teamId,
            birthDate:
                body.birthDate !== undefined ? body.birthDate || null : current.birthDate,
            number: body.number !== undefined ? body.number : current.number,
            isCaptain:
                body.isCaptain !== undefined ? body.isCaptain : current.isCaptain,
            role:
                body.role !== undefined ? body.role?.trim() || null : current.role,
        };

        saveAll(all.map((p) => (p.id === current.id ? updated : p)));
        return HttpResponse.json({ player: updated });
    }),

    http.delete(`${API_URL}/players/:id`, ({ params }) => {
        if (!getSessionUserId()) {
            return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
        }

        const all = getAll();
        if (!all.some((p) => p.id === params.id)) {
            return errorResponse(404, "PLAYER_NOT_FOUND", "Jugador no encontrado");
        }

        saveAll(all.filter((p) => p.id !== params.id));
        return HttpResponse.json({ message: "Player deleted successfully" });
    }),
];