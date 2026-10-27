export interface ApiErrorDetail {
    path: string
    message: string
}

export class ApiError extends Error {
    code: string
    details?: ApiErrorDetail[]
    status?: number

    constructor(
        code: string,
        message: string,
        details?: ApiErrorDetail[],
        status?: number,
    ) {
        super(message)
        this.code = code
        this.details = details
        this.status = status
        this.name = 'ApiError'
    }
}


export class NetworkError extends Error {
    constructor(message = 'No se pudo conectar con el servidor') {
        super(message)
        this.name = 'NetworkError'
    }
}

