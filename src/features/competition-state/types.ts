export type CategoryState = "not_started" | "in_progress" | "finished";

export interface CategoryCompetitionState {
    categoryId: string;
    state: CategoryState;
}

export interface CompetitionState {
    tournamentState: CategoryState;
    categories: CategoryCompetitionState[];
}

export const CATEGORY_STATE_LABELS: Record<CategoryState, string> = {
    not_started: "Sin empezar",
    in_progress: "En curso",
    finished: "Campeonato cerrado",
};