import { useQuery } from "@tanstack/react-query";
import { competitionStateService } from "./services/competition-state";
import type { CategoryState } from "./types";

export function useCompetitionState(tournamentId?: string) {
    const query = useQuery({
        // Cuelga de ["matches", tournamentId] a propósito: el estado depende de los
        // partidos, y esa clave ya se invalida al guardar resultados, programar o
        // borrar partidos, y al cerrar o reabrir un campeonato.
        queryKey: ["matches", tournamentId, "competition-state"],
        queryFn: () => competitionStateService.get(tournamentId!),
        enabled: !!tournamentId,
    });

    return { data: query.data ?? null, isLoading: query.isLoading };
}

/**
 * Qué categorías todavía aceptan cambios de plantilla (equipos y jugadores).
 * Mientras carga se asume que todo está abierto: el backend es quien decide de verdad.
 */
export function useCategoryLocks(tournamentId?: string) {
    const { data } = useCompetitionState(tournamentId);
    const stateById = new Map(
        (data?.categories ?? []).map((c) => [c.categoryId, c.state] as const),
    );

    const stateOf = (categoryId: string): CategoryState =>
        stateById.get(categoryId) ?? "not_started";

    return {
        stateOf,
        /** Se pueden agregar, mover o eliminar equipos y jugadores. */
        isOpen: (categoryId: string) => stateOf(categoryId) === "not_started",
    };
}