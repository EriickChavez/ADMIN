import { useQuery } from "@tanstack/react-query";
import { categoriesService } from "./services/categories";


export function useCategories(tournamentId?: string) {
    const query = useQuery({
        queryKey: ["categories", tournamentId],
        queryFn: () => categoriesService.listByTournament(tournamentId!),
        enabled: !!tournamentId,
    });

    const categories = [...(query.data ?? [])].sort((a, b) => a.order - b.order);

    return { categories, isLoading: query.isLoading };
}