import { useMutation, useQueryClient } from "@tanstack/react-query";
import { phasesService } from "./services/phases";
import type { PhaseGroup } from "./types";
import { getPhaseErrorMessage } from "./utils/errors";

export interface ApplyPhaseFormatInput {
    /** Todas las categorías del torneo (la categoría plantilla se excluye sola). */
    categories: { id: string }[];
    /** Categorías con el campeonato cerrado: el backend rechaza fases nuevas, se omiten. */
    closedCategoryIds: string[];
}

export interface ApplyPhaseFormatResult {
    appliedTo: string[];
    skipped: { categoryId: string; reason: string }[];
    createdPhases: number;
    createdGroups: number;
}

export class EmptySourceError extends Error {
    constructor() {
        super("EMPTY_SOURCE");
        this.name = "EmptySourceError";
    }
}

/**
 * Copia las fases (y sus grupos) de una categoría plantilla al resto del torneo.
 * No copia equipos. Solo aplica a categorías que aún no tienen fases; las que tienen
 * el campeonato cerrado se omiten siempre.
 */
export function useApplyPhaseFormat(
    tournamentId: string,
    sourceCategoryId: string,
) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({
            categories,
            closedCategoryIds,
        }: ApplyPhaseFormatInput): Promise<ApplyPhaseFormatResult> => {
            const sourcePhases = await phasesService.listByCategory(
                tournamentId,
                sourceCategoryId,
            );
            if (sourcePhases.length === 0) throw new EmptySourceError();

            const closed = new Set(closedCategoryIds);

            const groupsByPhase = new Map<string, PhaseGroup[]>();
            await Promise.all(
                sourcePhases.map(async (phase) => {
                    groupsByPhase.set(
                        phase.id,
                        phase.type === "group"
                            ? await phasesService.listGroups(phase.id)
                            : [],
                    );
                }),
            );

            const result: ApplyPhaseFormatResult = {
                appliedTo: [],
                skipped: [],
                createdPhases: 0,
                createdGroups: 0,
            };

            for (const category of categories) {
                if (category.id === sourceCategoryId) continue;

                if (closed.has(category.id)) {
                    result.skipped.push({
                        categoryId: category.id,
                        reason: "Campeonato cerrado",
                    });
                    continue;
                }

                try {
                    const existing = await phasesService.listByCategory(
                        tournamentId,
                        category.id,
                    );
                    if (existing.length > 0) {
                        result.skipped.push({
                            categoryId: category.id,
                            reason: "Ya tiene fases",
                        });
                        continue;
                    }

                    for (const source of sourcePhases) {
                        const created = await phasesService.create(
                            tournamentId,
                            category.id,
                            {
                                name: source.name,
                                type: source.type,
                                // Una copia empieza sin resultados: nunca "Finalizada",
                                // aunque la original lo esté (se marca al cerrar la fase).
                                status: "upcoming",
                                sortOrder: source.sortOrder,
                                startDate: source.startDate,
                                endDate: source.endDate,
                            },
                        );
                        result.createdPhases += 1;

                        for (const group of groupsByPhase.get(source.id) ?? []) {
                            await phasesService.createGroup(created.id, {
                                name: group.name,
                                sortOrder: group.sortOrder,
                            });
                            result.createdGroups += 1;
                        }
                    }
                    result.appliedTo.push(category.id);
                } catch (err) {
                    // Una categoría que falla no detiene a las demás.
                    result.skipped.push({
                        categoryId: category.id,
                        reason: getPhaseErrorMessage(err),
                    });
                }
            }

            return result;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["phases", tournamentId] }),
    });
}