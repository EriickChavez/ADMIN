import { ApiError } from "../../../api/client";
import type {
    ImportRowError,
    ImportValidationDetails,
} from "../types";

export function getImportRowErrors(
    error: unknown,
): { errors: ImportRowError[]; truncated: boolean } | null {
    if (!(error instanceof ApiError)) return null;

    if (error.code !== "IMPORT_VALIDATION_FAILED") return null;

    const details = error.details as unknown as
        | ImportValidationDetails
        | undefined;

    if (!details || !Array.isArray(details.errors)) return null;

    return {
        errors: details.errors,
        truncated: Boolean(details.truncated),
    };
}

export function getImportErrorMessage(error: unknown): string {
    if (!(error instanceof ApiError)) {
        return "Ocurrió un error inesperado durante la importación.";
    }

    switch (error.code) {
        case "NETWORK_ERROR":
            return "No pudimos conectar con el servidor. Intenta de nuevo.";

        case "NOT_TOURNAMENT_OWNER":
            return "Solo el propietario del torneo puede importar datos.";

        case "TOURNAMENT_NOT_FOUND":
            return "No se encontró el torneo.";

        case "IMPORT_FILE_REQUIRED":
            return "Selecciona un archivo de Excel.";

        case "IMPORT_FILE_TOO_LARGE":
            return "El archivo excede el tamaño máximo permitido de 5 MB.";

        case "INVALID_IMPORT_FILE":
            return `El archivo no es válido: ${error.message}`;

        case "CATEGORY_STARTED":
            return "No puedes importar equipos o jugadores a una categoría que ya comenzó.";

        case "CATEGORY_FINISHED":
            return "No puedes importar datos a una categoría cuyo campeonato está cerrado.";

        case "IMPORT_VALIDATION_FAILED":
            return "El archivo contiene errores. Corrígelos antes de volver a importarlo.";

        default:
            return error.message || "No se pudo completar la importación.";
    }
}
