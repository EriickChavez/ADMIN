import { api } from "../../../api/client";
import type {
    Match,
    MatchInput,
    MatchUpdateInput,
    MatchResponse,
    MatchesQuery,
    MatchesResponse,
} from "../types";

type LifecycleAction = "start" | "finish" | "reopen";

async function lifecycle(
    matchId: string,
    action: LifecycleAction,
): Promise<Match> {
    const { data } = await api.post<MatchResponse>(
        `/matches/${matchId}/${action}`,
        {},
    );
    return data.match;
}

export const matchesService = {
    listByTournament: async (
        tournamentId: string,
        query: MatchesQuery = {},
    ): Promise<MatchesResponse> => {
        const { data } = await api.get<MatchesResponse>(
            `/tournaments/${tournamentId}/matches`,
            {
                params: {
                    page: query.page ?? 1,
                    limit: query.limit ?? 20,
                    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
                    ...(query.status ? { status: query.status } : {}),
                    ...(query.phaseId ? { phaseId: query.phaseId } : {}),
                },
            },
        );
        return data;
    },

    /**
     * Recupera todas las páginas para vistas que aplican filtros locales
     * (fecha, grupo o texto), de modo que no se limite a la página actual.
     * La API acepta un máximo de 100 registros por petición.
     */
    listAllByTournament: async (
        tournamentId: string,
        query: Omit<MatchesQuery, "page" | "limit"> = {},
    ): Promise<Match[]> => {
        const firstPage = await matchesService.listByTournament(tournamentId, {
            ...query,
            page: 1,
            limit: 100,
        });

        if (firstPage.pagination.totalPages <= 1) {
            return firstPage.matches;
        }

        const remainingPages: MatchesResponse[] = [];
        const totalPages = firstPage.pagination.totalPages;

        // Limita las peticiones concurrentes para no saturar la API en torneos grandes.
        for (let startPage = 2; startPage <= totalPages; startPage += 5) {
            const endPage = Math.min(startPage + 4, totalPages);
            const batch = await Promise.all(
                Array.from({ length: endPage - startPage + 1 }, (_, index) =>
                    matchesService.listByTournament(tournamentId, {
                        ...query,
                        page: startPage + index,
                        limit: 100,
                    }),
                ),
            );
            remainingPages.push(...batch);
        }

        return [firstPage, ...remainingPages].flatMap((response) => response.matches);
    },

    getById: async (matchId: string): Promise<Match> => {
        const { data } = await api.get<MatchResponse>(`/matches/${matchId}`);
        return data.match;
    },

    update: async (matchId: string, input: MatchUpdateInput): Promise<Match> => {
        const { data } = await api.patch<MatchResponse>(`/matches/${matchId}`, input);
        return data.match;
    },

    create: async (tournamentId: string, input: MatchInput): Promise<Match> => {
        const { data } = await api.post<MatchResponse>(
            `/tournaments/${tournamentId}/matches`,
            input,
        );
        return data.match;
    },

    remove: async (matchId: string): Promise<void> => {
        await api.delete(`/matches/${matchId}`);
    },

    /** Abre la cédula: scheduled o postponed → in_progress. */
    start: (matchId: string) => lifecycle(matchId, "start"),

    /** Cierra la cédula: in_progress → finished (fija el marcador desde los eventos). */
    finish: (matchId: string) => lifecycle(matchId, "finish"),

    /** Reabre la cédula: finished → in_progress. */
    reopen: (matchId: string) => lifecycle(matchId, "reopen"),

    /** Árbitros asignados al partido (ids de usuario). Cualquier miembro puede verlos. */
    getReferees: async (matchId: string): Promise<string[]> => {
        const { data } = await api.get<{ refereeUserIds: string[] }>(
            `/matches/${matchId}/referees`,
        );
        return data.refereeUserIds ?? [];
    },

    /** Reemplaza el conjunto completo de árbitros. Solo el dueño. [] deja el partido sin asignar. */
    setReferees: async (matchId: string, userIds: string[]): Promise<string[]> => {
        const { data } = await api.put<{ refereeUserIds: string[] }>(
            `/matches/${matchId}/referees`,
            { userIds },
        );
        return data.refereeUserIds ?? [];
    },
};