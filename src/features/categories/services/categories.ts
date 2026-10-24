import { api } from "../../../api/client";
import type {
  CategoriesResponse,
  Category,
  CategoryInput,
  CategoryResponse,
} from "../types";

export const categoriesService = {
  listByTournament: async (tournamentId: string): Promise<Category[]> => {
    const { data } = await api.get<CategoriesResponse>(
      `/tournaments/${tournamentId}/categories`,
    );
    return data.categories ?? [];
  },

  create: async (
    tournamentId: string,
    input: CategoryInput,
  ): Promise<Category> => {
    const { data } = await api.post<CategoryResponse>(
      `/tournaments/${tournamentId}/categories`,
      input,
    );
    return data.category;
  },

  update: async (id: string, input: CategoryInput): Promise<Category> => {
    const { data } = await api.patch<CategoryResponse>(
      `/categories/${id}`,
      input,
    );
    return data.category;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};