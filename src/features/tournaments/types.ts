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
  branding: TournamentBranding | null;
}

export interface MyTournamentsResponse {
  tournaments: Tournament[];
}

export interface TournamentInput {
  name: string;
  subtitle: string | null;
  description: string | null;
  slug: string;
  startDate: string | null;
  endDate: string | null;
  timezone: string;
}

export interface TournamentFormValues {
  name: string;
  subtitle: string;
  description: string;
  slug: string;
  startDate: string;
  endDate: string;
  timezone: string;
}

export interface TournamentResponse {
  tournament: Omit<Tournament, "roleId">;
}