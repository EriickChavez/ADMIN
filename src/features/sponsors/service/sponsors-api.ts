import { api } from "../../../api/client";

import type {
    TournamentSponsor,
    CreateSponsorPayload,
    UpdateSponsorPayload,
} from "../types";

function toFormData(payload: CreateSponsorPayload | UpdateSponsorPayload): FormData {
    const formData = new FormData();
    if (payload.name !== undefined) formData.append("name", payload.name);
    if (payload.description !== undefined)
        formData.append("description", payload.description);
    if (payload.logo) formData.append("logo", payload.logo);
    if (payload.logoUrl !== undefined) formData.append("logoUrl", payload.logoUrl);
    if (payload.websiteUrl !== undefined && payload.websiteUrl !== null)
        formData.append("websiteUrl", payload.websiteUrl);
    if (payload.pdf) formData.append("pdf", payload.pdf);
    if (payload.pdfUrl !== undefined) formData.append("pdfUrl", payload.pdfUrl);
    if ("removePdf" in payload && payload.removePdf !== undefined)
        formData.append("removePdf", String(payload.removePdf));
    if (payload.order !== undefined) formData.append("order", String(payload.order));
    if (payload.isActive !== undefined)
        formData.append("isActive", String(payload.isActive));
    return formData;
}

export const sponsorsApi = {
    // /admin trae todos los sponsors (activos e inactivos); el endpoint público
    // sin auth solo devuelve los vigentes, por eso el panel usa este.
    listByTournament: async (tournamentId: string) => {
        const { data } = await api.get<{ sponsors: TournamentSponsor[] }>(
            `/tournaments/${tournamentId}/sponsors/admin`
        );
        return data;
    },

    create: async (tournamentId: string, payload: CreateSponsorPayload) => {
        const { data } = await api.postForm<{ sponsor: TournamentSponsor }>(
            `/tournaments/${tournamentId}/sponsors`,
            toFormData(payload)
        );
        return data.sponsor;
    },

    update: async (tournamentId: string, id: string, payload: UpdateSponsorPayload) => {
        const { data } = await api.patchForm<{ sponsor: TournamentSponsor }>(
            `/tournaments/${tournamentId}/sponsors/${id}`,
            toFormData(payload)
        );
        return data.sponsor;
    },

    delete: async (tournamentId: string, id: string) => {
        const { data } = await api.delete<{ message: string }>(
            `/tournaments/${tournamentId}/sponsors/${id}`
        );
        return data;
    },
};