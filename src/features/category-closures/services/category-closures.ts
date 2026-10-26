import { api } from "../../../api/client";
import type { CategoryClosure } from "../types";

export const categoryClosuresService = {
    // Qué categorías del torneo tienen el campeonato cerrado.
    list: async (tournamentId: string): Promise<CategoryClosure[]> => {
        const { data } = await api.get<{ closures: CategoryClosure[] }>(
            `/tournaments/${tournamentId}/category-closures`,
        );
        return data.closures ?? [];
    },

    close: async (
        tournamentId: string,
        categoryId: string,
    ): Promise<CategoryClosure> => {
        const { data } = await api.post<{ closure: CategoryClosure }>(
            `/tournaments/${tournamentId}/categories/${categoryId}/close`,
            {},
        );
        return data.closure;
    },

    reopen: async (tournamentId: string, categoryId: string): Promise<void> => {
        await api.post(
            `/tournaments/${tournamentId}/categories/${categoryId}/reopen`,
            {},
        );
    },
};