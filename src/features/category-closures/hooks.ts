import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoryClosuresService } from "./services/category-closures";

const closuresKey = (tournamentId?: string) =>
    ["category-closures", tournamentId] as const;

export function useCategoryClosures(tournamentId?: string) {
    const query = useQuery({
        queryKey: closuresKey(tournamentId),
        queryFn: () => categoryClosuresService.list(tournamentId!),
        enabled: !!tournamentId,
    });

    return {
        closures: query.data ?? [],
        isLoading: query.isLoading,
    };
}

function useRefreshAfterChange(tournamentId: string) {
    const qc = useQueryClient();
    return () => {
        qc.invalidateQueries({ queryKey: closuresKey(tournamentId) });
        // La categoría pasa a "finished" (o vuelve): cambia lo que se puede editar.
        qc.invalidateQueries({ queryKey: ["matches", tournamentId] });
        qc.invalidateQueries({ queryKey: ["phases", tournamentId] });
    };
}

export function useCloseCategory(tournamentId: string, categoryId: string) {
    const refresh = useRefreshAfterChange(tournamentId);
    return useMutation({
        mutationFn: () => categoryClosuresService.close(tournamentId, categoryId),
        onSuccess: refresh,
    });
}

export function useReopenCategory(tournamentId: string, categoryId: string) {
    const refresh = useRefreshAfterChange(tournamentId);
    return useMutation({
        mutationFn: () => categoryClosuresService.reopen(tournamentId, categoryId),
        onSuccess: refresh,
    });
}