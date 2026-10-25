import { api } from "../../../api/client";
import type {
    Team,
    TeamInput,
    TeamResponse,
    TeamsQuery,
    TeamsResponse,
} from "../types";

function toBody(input: Partial<TeamInput>) {
    const body: Record<string, unknown> = {};

    if (input.categoryId !== undefined) body.categoryId = input.categoryId;
    if (input.name !== undefined) body.name = input.name;

    if (input.abbreviation !== undefined && input.abbreviation !== "") {
        body.abbreviation = input.abbreviation;
    }

    // La API valida que logoUrl sea una URL válida.
    if (input.logoUrl) body.logoUrl = input.logoUrl;

    return body;
}

export const teamsService = {
    listByTournament: async (
        tournamentId: string,
        query: TeamsQuery = {},
    ): Promise<TeamsResponse> => {
        const { data } = await api.get<TeamsResponse>(
            `/tournaments/${tournamentId}/teams`,
            {
                params: {
                    page: query.page ?? 1,
                    limit: query.limit ?? 20,
                    ...(query.categoryId
                        ? { categoryId: query.categoryId }
                        : {}),
                },
            },
        );

        return data;
    },

    /**
     * Recupera todos los equipos que coinciden con los filtros.
     * Solicita páginas de 100 equipos y procesa hasta cinco páginas
     * concurrentemente por lote.
     */
    listAllByTournament: async (
        tournamentId: string,
        query: Omit<TeamsQuery, "page" | "limit"> = {},
    ): Promise<Team[]> => {
        const firstPage = await teamsService.listByTournament(
            tournamentId,
            {
                ...query,
                page: 1,
                limit: 100,
            },
        );

        const pages: TeamsResponse[] = [firstPage];
        const totalPages = firstPage.pagination.totalPages;

        for (
            let startPage = 2;
            startPage <= totalPages;
            startPage += 5
        ) {
            const endPage = Math.min(startPage + 4, totalPages);

            const batch = await Promise.all(
                Array.from(
                    { length: endPage - startPage + 1 },
                    (_, index) =>
                        teamsService.listByTournament(tournamentId, {
                            ...query,
                            page: startPage + index,
                            limit: 100,
                        }),
                ),
            );

            pages.push(...batch);
        }

        return pages.flatMap((page) => page.teams);
    },

    /** Busca un equipo por ID aunque no esté en la primera página. */
    findById: async (
        tournamentId: string,
        teamId: string,
    ): Promise<Team | null> => {
        const firstPage = await teamsService.listByTournament(
            tournamentId,
            {
                page: 1,
                limit: 100,
            },
        );

        const firstMatch = firstPage.teams.find(
            (team) => team.id === teamId,
        );

        if (firstMatch) return firstMatch;

        for (
            let page = 2;
            page <= firstPage.pagination.totalPages;
            page += 1
        ) {
            const response = await teamsService.listByTournament(
                tournamentId,
                {
                    page,
                    limit: 100,
                },
            );

            const match = response.teams.find(
                (team) => team.id === teamId,
            );

            if (match) return match;
        }

        return null;
    },

    create: async (
        tournamentId: string,
        input: TeamInput,
    ): Promise<Team> => {
        const { data } = await api.post<TeamResponse>(
            `/tournaments/${tournamentId}/teams`,
            toBody(input),
        );

        return data.team;
    },

    update: async (
        id: string,
        input: Partial<TeamInput>,
    ): Promise<Team> => {
        const { data } = await api.patch<TeamResponse>(
            `/teams/${id}`,
            toBody(input),
        );

        return data.team;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/teams/${id}`);
    },
};