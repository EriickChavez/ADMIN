import { api } from "../../../api/client";
import type { SponsorInput, TournamentSponsor } from "../types";

function toFormData(input: SponsorInput): FormData {
    const formData = new FormData();
    if (input.name !== undefined) formData.append("name", input.name);
    if (input.description !== undefined) {
        formData.append("description", input.description);
    }
    if (input.logo) formData.append("logo", input.logo);
    if (input.logoUrl !== undefined) formData.append("logoUrl", input.logoUrl);
    if (input.websiteUrl !== undefined && input.websiteUrl !== null) {
        formData.append("websiteUrl", input.websiteUrl);
    }
    if (input.pdf) formData.append("pdf", input.pdf);
    if (input.pdfUrl !== undefined) formData.append("pdfUrl", input.pdfUrl);
    if (input.removePdf !== undefined) {
        formData.append("removePdf", String(input.removePdf));
    }
    if (input.order !== undefined) formData.append("order", String(input.order));
    if (input.isActive !== undefined) {
        formData.append("isActive", String(input.isActive));
    }
    return formData;
}

export const sponsorsService = {
    // /admin trae todos los sponsors (activos e inactivos); el endpoint público
    // sin auth solo devuelve los vigentes, por eso el panel usa este.
    list: async (tournamentId: string): Promise<TournamentSponsor[]> => {
        const { data } = await api.get<{ sponsors: TournamentSponsor[] }>(
            `/tournaments/${tournamentId}/sponsors/admin`,
        );
        return data.sponsors ?? [];
    },

    create: async (
        tournamentId: string,
        input: SponsorInput,
    ): Promise<TournamentSponsor> => {
        const { data } = await api.post<{ sponsor: TournamentSponsor }>(
            `/tournaments/${tournamentId}/sponsors`,
            toFormData(input),
        );
        return data.sponsor;
    },

    update: async (
        tournamentId: string,
        id: string,
        input: SponsorInput,
    ): Promise<TournamentSponsor> => {
        const { data } = await api.patch<{ sponsor: TournamentSponsor }>(
            `/tournaments/${tournamentId}/sponsors/${id}`,
            toFormData(input),
        );
        return data.sponsor;
    },

    remove: async (tournamentId: string, id: string): Promise<void> => {
        await api.delete(`/tournaments/${tournamentId}/sponsors/${id}`);
    },
};