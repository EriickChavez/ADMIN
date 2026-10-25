import { ApiError } from "../../../api/client";

export function getMatchErrorMessage(error: unknown): string {
    if (!(error instanceof ApiError)) return "Ocurrió un error inesperado";

    switch (error.code) {
        case "NETWORK_ERROR":
            return "No pudimos conectar con el servidor. Intenta de nuevo.";
        case "NOT_TOURNAMENT_OWNER":
        case "NOT_TOURNAMENT_OWNER_OR_ADMIN":
            return "No tienes permisos para gestionar partidos en este torneo";
        case "TOURNAMENT_NOT_FOUND":
            return "El torneo no fue encontrado";
        case "MATCH_NOT_FOUND":
            return "El partido ya no existe";
        case "INVALID_CATEGORY":
            return "La categoría no es válida para este torneo";
        case "INVALID_TEAM":
            return "Uno o ambos equipos no son válidos para esta categoría";
        case "SAME_TEAM_MATCH":
            return "El equipo local y visitante deben ser diferentes";
        case "INVALID_MATCH_STATUS":
            return "El estado del partido no es válido";
        case "INVALID_MATCH_TRANSITION":
            return "Ese cambio de estado no es posible desde el estado actual del partido";
        case "MATCH_HAS_EVENTS":
            return "No se pueden cambiar los equipos ni la categoría de un partido que ya tiene eventos";
        case "CATEGORY_CLOSED":
        case "CATEGORY_FINISHED":
            return "El campeonato de esta categoría está cerrado: ya no se pueden crear ni modificar partidos. Reábrelo primero";
        case "VALIDATION_ERROR":
            return error.message || "Revisa los datos del partido";
        default:
            return error.message || "Ocurrió un error con el partido";
    }
}