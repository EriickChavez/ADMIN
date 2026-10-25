import { http, HttpResponse } from "msw";
import { API_URL } from "../../../api/client";
import { DEMO_TOURNAMENT_ID, DEMO_USER_ID, getSessionUserId } from "../../../mocks/session";
import { errorResponse } from "../../../mocks/utils";
import type { Tournament, TournamentInput } from "../types";

type StoredTournament = Tournament & { ownerId: string };

const TOURNAMENTS_KEY = "mock_tournaments";

const seed: StoredTournament[] = [
    {
        id: DEMO_TOURNAMENT_ID,
        ownerId: DEMO_USER_ID,
        name: "Copa Laguna 2026",
        subtitle: null,
        description: null,
        slug: "copa-laguna-2026",
        startDate: "2026-06-01",
        endDate: "2026-06-15",
        timezone: "America/Mexico_City",
        roleId: "20000000-0000-0000-0000-000000000001",
        branding: null,
    },
];

const getAll = (): StoredTournament[] => {
    try {
        const raw = localStorage.getItem(TOURNAMENTS_KEY);
        if (raw) return JSON.parse(raw) as StoredTournament[];
    } catch {
        // si el JSON está corrupto, se usa el seed
    }
    return seed;
};

const saveAll = (list: StoredTournament[]) =>
    localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(list));

const toListItem = ({ ownerId: _ownerId, ...tournament }: StoredTournament): Tournament =>
    tournament;

const toWriteResponse = ({
    ownerId: _ownerId,
    roleId: _roleId,
    ...tournament
}: StoredTournament) => tournament;

export const tournamentsHandlers = [
    http.get(`${API_URL}/tournaments`, () => {
        const userId = getSessionUserId();
        if (!userId) return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");

        const mine = getAll()
            .filter((t) => t.ownerId === userId)
            .map(toListItem);

        return HttpResponse.json({ tournaments: mine });
    }),

    http.post(`${API_URL}/tournaments`, async ({ request }) => {
        const userId = getSessionUserId();
        if (!userId) return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");

        const body = (await request.json()) as TournamentInput;
        const all = getAll();

        if (all.some((t) => t.ownerId === userId)) {
            return errorResponse(409, "TOURNAMENT_ALREADY_EXISTS", "Solo puedes crear un torneo");
        }
        if (!body.name?.trim()) {
            return errorResponse(400, "VALIDATION_ERROR", "El nombre es obligatorio");
        }
        if (all.some((t) => t.slug === body.slug)) {
            return errorResponse(409, "SLUG_TAKEN", "Ese identificador ya está en uso");
        }

        const tournament: StoredTournament = {
            id: crypto.randomUUID(),
            ownerId: userId,
            name: body.name.trim(),
            subtitle: body.subtitle ?? null,
            description: body.description ?? null,
            slug: body.slug,
            startDate: body.startDate ?? null,
            endDate: body.endDate ?? null,
            timezone: body.timezone || "UTC",
            roleId: crypto.randomUUID(),
            branding: null,
        };

        saveAll([...all, tournament]);
        return HttpResponse.json({ tournament: toWriteResponse(tournament) }, { status: 201 });
    }),

    http.patch(`${API_URL}/tournaments/:id`, async ({ params, request }) => {
        const userId = getSessionUserId();
        if (!userId) return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");

        const all = getAll();
        const current = all.find((t) => t.id === params.id && t.ownerId === userId);
        if (!current) return errorResponse(404, "TOURNAMENT_NOT_FOUND", "Torneo no encontrado");

        const body = (await request.json()) as Partial<TournamentInput>;
        if (body.slug && all.some((t) => t.id !== current.id && t.slug === body.slug)) {
            return errorResponse(409, "SLUG_TAKEN", "Ese identificador ya está en uso");
        }

        const updated: StoredTournament = { ...current, ...body };
        saveAll(all.map((t) => (t.id === current.id ? updated : t)));
        return HttpResponse.json({ tournament: toWriteResponse(updated) });
    }),
];