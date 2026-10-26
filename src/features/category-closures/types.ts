export interface CategoryClosure {
    categoryId: string;
    /** Campeón al momento de cerrar (null si el equipo se eliminó después). */
    championTeamId: string | null;
    closedAt: string;
}