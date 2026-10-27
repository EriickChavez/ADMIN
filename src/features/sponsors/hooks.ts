import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sponsorsApi } from "./service/sponsors-api";
import type { CreateSponsorPayload, UpdateSponsorPayload } from "./types";

export function useCreateSponsor(tournamentId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateSponsorPayload) =>
            sponsorsApi.create(tournamentId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["tournaments", tournamentId, "sponsors"],
            });
        },
    });
}

export function useDeleteSponsor(tournamentId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => sponsorsApi.delete(tournamentId, id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["tournaments", tournamentId, "sponsors"],
            });
        },
    });
}

export function useSponsors(tournamentId?: string) {
    return useQuery({
        queryKey: ["tournaments", tournamentId, "sponsors"],
        queryFn: () => sponsorsApi.listByTournament(tournamentId!),
        enabled: Boolean(tournamentId),
    });
}

export function useUpdateSponsor(tournamentId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateSponsorPayload }) =>
            sponsorsApi.update(tournamentId, id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["tournaments", tournamentId, "sponsors"],
            });
        },
    });
}