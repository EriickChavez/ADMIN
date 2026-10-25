import { api } from "../../../api/client";
import type {
    Player,
    PlayerInput,
    PlayerResponse,
    PlayersQuery,
    PlayersResponse,
} from "../types";

/** Body de create: la API exige number y no acepta null en opcionales. */
function toCreateBody(input: PlayerInput) {
    const body: Record<string, unknown> = {
        categoryId: input.categoryId,
        teamId: input.teamId,
        firstName: input.firstName,
        lastName: input.lastName,
        number: input.number,
    };
    if (input.birthDate) body.birthDate = input.birthDate;
    if (input.isCaptain) body.isCaptain = true;
    if (input.role) body.role = input.role;
    return body;
}

/** Body de update: null sí está permitido en birthDate/role. */
function toUpdateBody(input: Partial<PlayerInput>) {
    const body: Record<string, unknown> = {};
    if (input.categoryId !== undefined) body.categoryId = input.categoryId;
    if (input.teamId !== undefined) body.teamId = input.teamId;
    if (input.firstName !== undefined) body.firstName = input.firstName;
    if (input.lastName !== undefined) body.lastName = input.lastName;
    if (input.number !== undefined) body.number = input.number;
    if (input.birthDate !== undefined) body.birthDate = input.birthDate;
    if (input.isCaptain !== undefined) body.isCaptain = input.isCaptain;
    if (input.role !== undefined) body.role = input.role;
    return body;
}

export const playersService = {
    listByTournament: async (
        tournamentId: string,
        query: PlayersQuery = {},
    ): Promise<PlayersResponse> => {
        // La API solo acepta page/limit en este endpoint (no categoryId/teamId).
        const { data } = await api.get<PlayersResponse>(
            `/tournaments/${tournamentId}/players`,
            {
                params: {
                    page: query.page ?? 1,
                    limit: query.limit ?? 20,
                },
            },
        );
        return data;
    },

    listByTeam: async (
        teamId: string,
        query: Omit<PlayersQuery, "teamId" | "categoryId"> = {},
    ): Promise<PlayersResponse> => {
        const { data } = await api.get<PlayersResponse>(`/teams/${teamId}/players`, {
            params: {
                page: query.page ?? 1,
                limit: query.limit ?? 20,
            },
        });
        return data;
    },

    /** Busca por ID recorriendo páginas válidas de la API (máximo 100). */
    findById: async (tournamentId: string, playerId: string): Promise<Player | null> => {
        const firstPage = await playersService.listByTournament(tournamentId, {
            page: 1,
            limit: 100,
        });
        const firstMatch = firstPage.players.find((player) => player.id === playerId);
        if (firstMatch) return firstMatch;

        for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
            const response = await playersService.listByTournament(tournamentId, {
                page,
                limit: 100,
            });
            const match = response.players.find((player) => player.id === playerId);
            if (match) return match;
        }

        return null;
    },

    create: async (tournamentId: string, input: PlayerInput): Promise<Player> => {
        const { data } = await api.post<PlayerResponse>(
            `/tournaments/${tournamentId}/players`,
            toCreateBody(input),
        );
        return data.player;
    },

    update: async (id: string, input: Partial<PlayerInput>): Promise<Player> => {
        const { data } = await api.patch<PlayerResponse>(
            `/players/${id}`,
            toUpdateBody(input),
        );
        return data.player;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/players/${id}`);
    },
};