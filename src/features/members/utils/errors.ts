import { ApiError } from "../../../api/client";

export function isUserNotFound(error: unknown): boolean {
    return error instanceof ApiError && error.code === "USER_NOT_FOUND";
}

export function getMemberErrorMessage(error: unknown): string {
    if (!(error instanceof ApiError)) return "Ocurrió un error inesperado";

    switch (error.code) {
        case "NETWORK_ERROR":
            return "No pudimos conectar con el servidor. Intenta de nuevo.";
        case "NOT_TOURNAMENT_OWNER":
            return "Solo el dueño del torneo puede hacer esto";
        case "NOT_TOURNAMENT_OWNER_OR_ADMIN":
            return "No tienes permisos para gestionar miembros de este torneo";
        case "ALREADY_TOURNAMENT_MEMBER":
            return "Esta persona ya es miembro del torneo";
        case "TARGET_USER_NOT_FOUND":
            return "No encontramos a ese usuario";
        case "USER_NOT_FOUND":
            return "No existe ninguna cuenta con ese correo";
        case "EMAIL_ALREADY_IN_USE":
            return 'Ya existe una cuenta con ese correo. Usa "Invitar existente" en vez de crear una nueva.';
        case "MEMBER_NOT_FOUND":
            return "Ese miembro ya no existe";
        case "CANNOT_MODIFY_OWNER":
            return "No puedes modificar ni quitar al dueño del torneo";
        case "TOURNAMENT_NOT_FOUND":
            return "El torneo no fue encontrado";
        case "VALIDATION_ERROR":
            return error.message || "Revisa los datos del formulario";
        default:
            return error.message || "Ocurrió un error al gestionar miembros";
    }
}