import { http, HttpResponse } from "msw";
import { API_URL } from "../../api/client";
import { DEMO_TOURNAMENT_ID, getSessionUserId } from "../../mocks/session";
import { errorResponse } from "../../mocks/utils";
import type { Category } from "./types";

const now = "2026-01-01T00:00:00.000Z";

const categories: Category[] = [
    {
        id: "30000000-0000-0000-0000-000000000001",
        tournamentId: DEMO_TOURNAMENT_ID,
        title: "Sub-14",
        minAge: 12,
        maxAge: 14,
        description: null,
        order: 1,
        createdAt: now,
        updatedAt: now,
    },
    {
        id: "30000000-0000-0000-0000-000000000002",
        tournamentId: DEMO_TOURNAMENT_ID,
        title: "Sub-18",
        minAge: 15,
        maxAge: 18,
        description: null,
        order: 2,
        createdAt: now,
        updatedAt: now,
    },
];

export const categoriesHandlers = [
    http.get(`${API_URL}/tournaments/:tournamentId/categories`, ({ params }) => {
        if (!getSessionUserId()) return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");

        return HttpResponse.json({
            categories: categories.filter((c) => c.tournamentId === params.tournamentId),
        });
    }),
];