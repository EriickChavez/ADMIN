import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { membersService } from "./services/members";
import type { CreateMemberAccountPayload } from "./types";

const membersKey = (tournamentId?: string) => ["members", tournamentId] as const;

export function useMembers(tournamentId?: string) {
    const query = useQuery({
        queryKey: membersKey(tournamentId),
        queryFn: () => membersService.list(tournamentId!),
        enabled: !!tournamentId,
    });

    return {
        members: query.data ?? [],
        isLoading: query.isLoading,
        error: query.error,
    };
}

export function useInviteMember(tournamentId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (userId: string) => membersService.invite(tournamentId, userId),
        onSuccess: () => qc.invalidateQueries({ queryKey: membersKey(tournamentId) }),
    });
}

export function useCreateMemberAccount(tournamentId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateMemberAccountPayload) =>
            membersService.createAccount(tournamentId, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: membersKey(tournamentId) }),
    });
}

export function useRemoveMember(tournamentId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (memberId: string) =>
            membersService.remove(tournamentId, memberId),
        onSuccess: () => qc.invalidateQueries({ queryKey: membersKey(tournamentId) }),
    });
}

export function useLookupUser(email: string) {
    const query = useQuery({
        queryKey: ["users", "lookup", email],
        queryFn: () => membersService.lookupByEmail(email),
        enabled: email.length > 3,
        retry: false,
        staleTime: 30_000,
    });

    return {
        user: query.data ?? null,
        isLoading: query.isLoading,
        error: query.error,
    };
}