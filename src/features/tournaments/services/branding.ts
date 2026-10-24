import { api } from "../../../api/client";
import type { TournamentBranding } from "../types";

export interface BrandingResponse {
    branding: TournamentBranding;
}

export interface BrandingUploadInput {
    logo?: File | null;
    banner?: File | null;
}

export const brandingService = {
    get: async (tournamentId: string): Promise<TournamentBranding | null> => {
        try {
            const { data } = await api.get<BrandingResponse>(
                `/tournaments/${tournamentId}/branding`,
            );
            return data.branding;
        } catch (e: unknown) {
            const err = e as { status?: number; code?: string };
            if (err.status === 404 || err.code === "BRANDING_NOT_FOUND") return null;
            throw e;
        }
    },

    update: async (
        tournamentId: string,
        input: BrandingUploadInput,
    ): Promise<TournamentBranding> => {
        const form = new FormData();
        if (input.logo) form.append("logo", input.logo);
        if (input.banner) form.append("banner", input.banner);

        const { data } = await api.patch<BrandingResponse>(
            `/tournaments/${tournamentId}/branding`,
            form,
        );
        return data.branding;
    },
};