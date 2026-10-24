import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesService } from "./services/categories";
import type { CategoryInput } from "./types";

const listKey = (tournamentId?: string) => ["categories", tournamentId] as const;

export function useCategories(tournamentId?: string) {
  const query = useQuery({
    queryKey: listKey(tournamentId),
    queryFn: () => categoriesService.listByTournament(tournamentId!),
    enabled: !!tournamentId,
  });

  const categories = [...(query.data ?? [])].sort((a, b) => a.order - b.order);

  return {
    categories,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useCategory(tournamentId: string | undefined, categoryId?: string) {
  const { categories, isLoading } = useCategories(tournamentId);
  const category = categories.find((c) => c.id === categoryId) ?? null;
  return { category, isLoading };
}

export function useCreateCategory(tournamentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInput) =>
      categoriesService.create(tournamentId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: listKey(tournamentId) }),
  });
}

export function useUpdateCategory(tournamentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryInput }) =>
      categoriesService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: listKey(tournamentId) }),
  });
}

export function useDeleteCategory(tournamentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: listKey(tournamentId) }),
  });
}