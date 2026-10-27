import { ApiError } from "../../../api/client";
import { NetworkError } from "../../../shared/types/api-error";


export function getSponsorErrorMessage(error: unknown): string {
    if (error instanceof NetworkError)
        return "No pudimos conectar con el servidor. Intenta de nuevo.";
    if (error instanceof ApiError) {
        switch (error.code) {
            case "SPONSOR_LIMIT_REACHED":
                return error.message;
            case "LOGO_REQUIRED":
                return "Debes subir un logo o proporcionar una URL de logo";
            case "AMBIGUOUS_LOGO_INPUT":
                return "Sube un logo o pon una URL, no ambos";
            case "AMBIGUOUS_PDF_INPUT":
                return "Sube un PDF o pon una URL, no ambos";
            case "WEBSITE_AND_PDF_CONFLICT":
                return "Un sponsor no puede tener sitio web y PDF al mismo tiempo";
            case "INVALID_DATE_RANGE":
                return "La fecha de fin debe ser igual o posterior a la de inicio";
            case "INVALID_FILE_TYPE":
                return "El tipo de archivo no es válido";
            case "FILE_TOO_LARGE":
                return "El archivo excede el tamaño máximo permitido";
            case "NOT_TOURNAMENT_OWNER":
                return "Solo el dueño (OWNER) del torneo puede gestionar sponsors";
            case "TOURNAMENT_NOT_FOUND":
                return "El torneo no fue encontrado";
            case "TOURNAMENT_SPONSOR_NOT_FOUND":
                return "El sponsor ya no existe";
            default:
                return error.message || "Ocurrió un error con el sponsor";
        }
    }
    return "Ocurrió un error inesperado";
}