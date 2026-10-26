export interface Member {
    id: string;
    tournamentId: string;
    userId: string;
    roleId: string;
    roleName: "OWNER" | "ADMIN";
    status: string;
    displayName: string;
    avatarUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PublicUserSummary {
    id: string;
    displayName: string;
    avatarUrl: string | null;
}

export interface CreateMemberAccountPayload {
    email: string;
    displayName: string;
    password: string;
}