import { api } from "../../../api/client";
import type { CategoriesResponse, Category } from "../types";

export const categoriesService = {
    listByTournament: async (tournamentId: string): Promise<Category[]> => {
        const { data } = await api.get<CategoriesResponse>(
            `/tournaments/${tournamentId}/categories`
        );
        return data.categories ?? [];
    },
};