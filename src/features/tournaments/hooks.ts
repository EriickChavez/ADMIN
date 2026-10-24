import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tournamentsService } from "./services/tournaments";
import type { TournamentInput } from "./types";

const MINE_KEY = ["tournaments", "mine"];

export function useMyTournament() {
  const query = useQuery({
    queryKey: MINE_KEY,
    queryFn: tournamentsService.listMine,
  });

  return {
    tournament: query.data?.[0] ?? null,
    isLoading: query.isLoading,
  };
}

export function useCreateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TournamentInput) => tournamentsService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: MINE_KEY }),
  });
}

export function useUpdateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TournamentInput }) =>
      tournamentsService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: MINE_KEY }),
  });
}
