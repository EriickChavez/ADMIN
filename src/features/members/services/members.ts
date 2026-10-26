import { api } from "../../../api/client";
import type {
    CreateMemberAccountPayload,
    Member,
    PublicUserSummary,
} from "../types";

export const membersService = {
    list: async (tournamentId: string): Promise<Member[]> => {
        const { data } = await api.get<{ members: Member[] }>(
            `/tournaments/${tournamentId}/members`,
        );
        return data.members ?? [];
    },

    invite: async (tournamentId: string, userId: string): Promise<Member> => {
        const { data } = await api.post<{ member: Member }>(
            `/tournaments/${tournamentId}/members`,
            { userId },
        );
        return data.member;
    },

    createAccount: async (
        tournamentId: string,
        payload: CreateMemberAccountPayload,
    ): Promise<Member> => {
        const { data } = await api.post<{ member: Member }>(
            `/tournaments/${tournamentId}/members/create-account`,
            payload,
        );
        return data.member;
    },

    remove: async (tournamentId: string, memberId: string): Promise<void> => {
        await api.delete(`/tournaments/${tournamentId}/members/${memberId}`);
    },

    // No devuelve el correo ni datos privados: solo id, nombre y avatar.
    lookupByEmail: async (email: string): Promise<PublicUserSummary> => {
        const { data } = await api.get<{ user: PublicUserSummary }>(
            "/users/lookup",
            { params: { email } },
        );
        return data.user;
    },
};