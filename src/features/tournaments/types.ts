export interface TournamentBranding {
  tournamentId: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  updatedAt: string;
}

export interface Tournament {
  id: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  slug: string;
  startDate: string | null;
  endDate: string | null;
  timezone: string;
  roleId: string;
  /** Tope de sponsors del torneo; lo define el administrador de la plataforma. */
  maxSponsors?: number;
  branding: TournamentBranding | null;
}

export interface MyTournamentsResponse {
  tournaments: Tournament[];
}

/**
 * Cuerpo de crear y editar. El `slug` no se envía: la API lo genera a partir del
 * nombre. Los campos vacíos se omiten (no se mandan como null).
 */
export interface TournamentInput {
  name?: string;
  subtitle?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
}

export interface TournamentFormValues {
  name: string;
  subtitle: string;
  description: string;
  /** Solo para mostrar y para la vista previa: lo genera la API. */
  slug: string;
  startDate: string;
  endDate: string;
  timezone: string;
}

export interface TournamentResponse {
  tournament: Omit<Tournament, "roleId">;
}