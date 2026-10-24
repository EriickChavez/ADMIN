import { http, HttpResponse } from "msw";
import { API_URL } from "../../api/client";
import { DEMO_TOURNAMENT_ID, getSessionUserId } from "../../mocks/session";
import { errorResponse } from "../../mocks/utils";
import type { Category, CategoryInput } from "./types";

const STORAGE_KEY = "mock_categories";
const now = () => new Date().toISOString();

const seed: Category[] = [
  {
    id: "30000000-0000-0000-0000-000000000001",
    tournamentId: DEMO_TOURNAMENT_ID,
    title: "Sub-14",
    minAge: 12,
    maxAge: 14,
    description: null,
    order: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-0000-0000-000000000002",
    tournamentId: DEMO_TOURNAMENT_ID,
    title: "Sub-18",
    minAge: 15,
    maxAge: 18,
    description: null,
    order: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const getAll = (): Category[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Category[];
  } catch {
    // corrupted
  }
  return seed;
};

const saveAll = (list: Category[]) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

export const categoriesHandlers = [
  http.get(`${API_URL}/tournaments/:tournamentId/categories`, ({ params }) => {
    if (!getSessionUserId()) {
      return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
    }
    const list = getAll().filter((c) => c.tournamentId === params.tournamentId);
    return HttpResponse.json({ categories: list });
  }),

  http.post(
    `${API_URL}/tournaments/:tournamentId/categories`,
    async ({ params, request }) => {
      if (!getSessionUserId()) {
        return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
      }

      const body = (await request.json()) as CategoryInput;
      const title = body.title?.trim();
      if (!title) {
        return errorResponse(400, "VALIDATION_ERROR", "El título es obligatorio");
      }

      const all = getAll();
      const tournamentId = params.tournamentId as string;
      const siblings = all.filter((c) => c.tournamentId === tournamentId);
      const maxOrder = siblings.reduce((m, c) => Math.max(m, c.order), 0);

      if (body.minAge != null && body.maxAge != null && body.minAge > body.maxAge) {
        return errorResponse(
          400,
          "VALIDATION_ERROR",
          "La edad mínima no puede ser mayor que la máxima",
        );
      }

      const category: Category = {
        id: crypto.randomUUID(),
        tournamentId,
        title,
        minAge: body.minAge ?? null,
        maxAge: body.maxAge ?? null,
        description: body.description?.trim() || null,
        order: body.order ?? maxOrder + 1,
        createdAt: now(),
        updatedAt: now(),
      };

      saveAll([...all, category]);
      return HttpResponse.json({ category }, { status: 201 });
    },
  ),

  http.patch(`${API_URL}/categories/:id`, async ({ params, request }) => {
    if (!getSessionUserId()) {
      return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
    }

    const all = getAll();
    const current = all.find((c) => c.id === params.id);
    if (!current) {
      return errorResponse(404, "CATEGORY_NOT_FOUND", "Categoría no encontrada");
    }

    const body = (await request.json()) as Partial<CategoryInput>;
    const title =
      body.title !== undefined ? body.title.trim() : current.title;
    if (!title) {
      return errorResponse(400, "VALIDATION_ERROR", "El título es obligatorio");
    }

    const minAge =
      body.minAge !== undefined ? body.minAge : current.minAge;
    const maxAge =
      body.maxAge !== undefined ? body.maxAge : current.maxAge;

    if (minAge != null && maxAge != null && minAge > maxAge) {
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "La edad mínima no puede ser mayor que la máxima",
      );
    }

    const updated: Category = {
      ...current,
      title,
      minAge,
      maxAge,
      description:
        body.description !== undefined
          ? body.description?.trim() || null
          : current.description,
      order: body.order ?? current.order,
      updatedAt: now(),
    };

    saveAll(all.map((c) => (c.id === current.id ? updated : c)));
    return HttpResponse.json({ category: updated });
  }),

  http.delete(`${API_URL}/categories/:id`, ({ params }) => {
    if (!getSessionUserId()) {
      return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
    }

    const all = getAll();
    if (!all.some((c) => c.id === params.id)) {
      return errorResponse(404, "CATEGORY_NOT_FOUND", "Categoría no encontrada");
    }

    saveAll(all.filter((c) => c.id !== params.id));
    return HttpResponse.json({ message: "Category deleted successfully" });
  }),
];