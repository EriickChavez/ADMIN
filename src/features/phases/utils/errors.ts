import { ApiError } from "../../../api/client";

export function getPhaseErrorMessage(error: unknown): string {
    if (!(error instanceof ApiError)) return "Ocurrió un error inesperado";

    switch (error.code) {
        case "NETWORK_ERROR":
            return "No pudimos conectar con el servidor. Intenta de nuevo.";
        case "NOT_TOURNAMENT_OWNER":
        case "NOT_TOURNAMENT_OWNER_OR_ADMIN":
            return "No tienes permisos para gestionar fases en este torneo";
        case "TOURNAMENT_NOT_FOUND":
            return "El torneo no fue encontrado";
        case "CATEGORY_NOT_FOUND":
            return "La categoría no fue encontrada";
        case "CATEGORY_CLOSED":
        case "CATEGORY_FINISHED":
            return "El campeonato de esta categoría está cerrado: ya no se pueden hacer cambios. Reábrelo primero";
        case "PHASE_NOT_FOUND":
            return "La fase ya no existe";
        case "PHASE_GROUP_NOT_FOUND":
            return "El grupo ya no existe";
        case "PHASE_GROUP_NOT_ALLOWED":
            return "Los grupos solo se permiten en fases de tipo grupos";
        case "INVALID_PHASE_DATE_RANGE":
            return "La fecha de fin debe ser mayor o igual a la de inicio";
        case "TEAM_NOT_IN_CATEGORY":
            return "Uno o más equipos no pertenecen a esta categoría";
        case "DUPLICATE_PHASE_TEAM":
            return "Un equipo solo puede asignarse una vez por fase";
        case "PHASE_HAS_MATCHES":
            return "No se puede eliminar una fase que todavía tiene partidos";
        case "PHASE_STRUCTURE_LOCKED":
            return "Esta fase ya tiene partidos: sus grupos y la asignación de equipos ya no se pueden cambiar. Elimina primero sus partidos";
        case "STANDINGS_NOT_AVAILABLE":
            return "Las posiciones por grupo solo existen en fases de tipo grupos";
        case "TEAM_NOT_IN_PHASE":
            return "Uno o más equipos no forman parte de esta fase";
        case "DUPLICATE_MANUAL_RANK":
            return "Cada equipo debe tener una posición distinta dentro de su empate";
        case "PHASE_ALREADY_CLOSED":
            return "La fase ya está cerrada";
        case "PHASE_NOT_CLOSED":
            return "La fase no está cerrada";
        case "PHASE_HAS_BRACKET":
            return "No se puede reabrir: ya existe una llave generada con estos clasificados. Elimínala primero";
        case "PHASE_NOT_COMPLETE":
            return `No se puede cerrar: faltan partidos por terminar. ${error.message}`;
        case "PHASE_HAS_PENDING_TIES":
            return "No se puede cerrar: hay empates sin resolver que afectan quién clasifica";
        case "INVALID_QUALIFICATION_CONFIG":
            return `Configuración de clasificación inválida: ${error.message}`;
        case "VALIDATION_ERROR":
            return error.message || "Revisa los datos del formulario";
        default:
            return error.message || "Ocurrió un error con la fase";
    }
}