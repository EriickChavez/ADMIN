export interface TournamentSponsor {
    id: string;
    tournamentId: string;
    name: string;
    description: string;
    logoUrl: string;
    websiteUrl: string | null;
    pdfUrl: string | null;
    order: number;
    isActive: boolean;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
    updatedAt: string;
}

/** Sirve para crear (name, description y logo son obligatorios) y para editar (todo opcional). */
export interface SponsorInput {
    name?: string;
    description?: string;
    logo?: File | null;
    logoUrl?: string;
    websiteUrl?: string | null;
    pdf?: File | null;
    pdfUrl?: string;
    removePdf?: boolean;
    order?: number;
    isActive?: boolean;
}