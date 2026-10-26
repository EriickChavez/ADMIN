import { ApiError } from "../../../api/client";
import { getMatchErrorMessage } from "../../matches";

export function getClosureErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        switch (error.code) {
            case "CHAMPION_NOT_DECIDED":
                return "Aún no se puede cerrar: la final todavía no tiene ganador";
            case "CATEGORY_ALREADY_CLOSED":
                return "El campeonato de esta categoría ya está cerrado";
            case "CATEGORY_NOT_CLOSED":
                return "El campeonato de esta categoría no está cerrado";
            case "NOT_TOURNAMENT_OWNER":
                return "Solo el dueño del torneo puede hacer esta acción";
            case "CATEGORY_FINISHED":
                return "El campeonato de esta categoría está cerrado: ya no se pueden hacer cambios. Reábrelo primero";
            default:
                return getMatchErrorMessage(error);
        }
    }
    return getMatchErrorMessage(error);
}