import { ApiError } from "../../../api/client";
import { getMatchErrorMessage } from "../../matches";

export function getBracketErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        switch (error.code) {
            case "INVALID_BRACKET_PHASE":
                return `No se puede generar la llave: ${error.message}`;
            case "SOURCE_PHASE_NOT_CLOSED":
                return "La fase de grupos debe estar cerrada antes de generar la llave";
            case "NOT_ENOUGH_QUALIFIED_TEAMS":
                return "Se necesitan al menos 2 clasificados para generar la llave";
            case "BRACKET_IN_PROGRESS":
                return "La llave ya tiene partidos o resultados, no se puede regenerar ni eliminar";
            case "BRACKET_NODE_NOT_FOUND":
                return "Ese cruce ya no existe";
            case "BRACKET_NODE_NOT_READY":
                return "Aún no se conocen los dos equipos de este cruce";
            case "BRACKET_NODE_ALREADY_SCHEDULED":
                return "Este partido ya está programado";
            case "BRACKET_LEG_NOT_AVAILABLE":
                return "Este cruce se juega a partido único";
            case "BRACKET_FIRST_LEG_REQUIRED":
                return "Programa primero el partido de ida";
            case "SECOND_LEG_BEFORE_FIRST":
                return "La vuelta debe programarse después de la ida";
            case "BRACKET_PENALTIES_NOT_APPLICABLE":
                return "Los penales solo aplican cuando terminaron los dos partidos y el global quedó empatado";
            case "BRACKET_ADVANCE_CONFLICT":
                return "Este cambio alteraría quién avanza, y el siguiente cruce ya tiene partido. Borra o reprograma ese partido primero";
            case "BRACKET_MATCH_TEAMS_LOCKED":
                return "Los equipos de un partido de la llave no se pueden cambiar";
            case "INVALID_PENALTIES":
                return "Penales inválidos: no pueden quedar empatados";
            case "CHAMPION_NOT_DECIDED":
                return "Aún no se puede cerrar: la final todavía no tiene ganador";
            case "CATEGORY_ALREADY_CLOSED":
                return "El campeonato de esta categoría ya está cerrado";
            case "CATEGORY_NOT_CLOSED":
                return "El campeonato de esta categoría no está cerrado";
            case "NOT_TOURNAMENT_OWNER":
                return "Solo el dueño del torneo puede hacer esta acción";
            default:
                return getMatchErrorMessage(error);
        }
    }
    return getMatchErrorMessage(error);
}