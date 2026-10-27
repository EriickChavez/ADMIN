import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sponsorsService } from "./services/sponsors";
import type { SponsorInput } from "./types";

const sponsorsKey = (tournamentId?: string) => ["sponsors", tournamentId] as const;

export function useSponsors(tournamentId?: string) {
    const query = useQuery({
        queryKey: sponsorsKey(tournamentId),
        queryFn: () => sponsorsService.list(tournamentId!),
        enabled: !!tournamentId,
    });

    return {
        sponsors: query.data ?? [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

export function useCreateSponsor(tournamentId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: SponsorInput) =>
            sponsorsService.create(tournamentId, input),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: sponsorsKey(tournamentId) }),
    });
}

export function useUpdateSponsor(tournamentId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: SponsorInput }) =>
            sponsorsService.update(tournamentId, id, input),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: sponsorsKey(tournamentId) }),
    });
}

export function useDeleteSponsor(tournamentId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => sponsorsService.remove(tournamentId, id),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: sponsorsKey(tournamentId) }),
    });
}