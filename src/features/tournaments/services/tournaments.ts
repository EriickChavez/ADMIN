import { api } from "../../../api/client";
import type {
  MyTournamentsResponse,
  Tournament,
  TournamentInput,
  TournamentResponse,
} from "../types";

export const tournamentsService = {
  listMine: async (): Promise<Tournament[]> => {
    const { data } = await api.get<MyTournamentsResponse>("/tournaments");
    return data.tournaments ?? [];
  },

  create: async (input: TournamentInput) =>
    (await api.post<TournamentResponse>("/tournaments", input)).data.tournament,

  update: async (id: string, input: TournamentInput) =>
    (await api.patch<TournamentResponse>(`/tournaments/${id}`, input)).data.tournament,
};
