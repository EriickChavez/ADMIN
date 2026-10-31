import { Navigate, Route, Routes } from "react-router-dom";
import {
  GuestRoute,
  LoginPage,
  ProtectedRoute,
  RegisterPage,
} from "./features/auth";
import { PhaseBracketPage } from "./features/brackets";
import {
  CategoriesPage,
  CategoryDetailPage,
  CategoryNewPage,
} from "./features/categories";
import { HomePage } from "./features/home";
import { MatchSheetPage } from "./features/match-events";
import {
  CalendarsPage,
  MatchNewPage,
  MatchRefereesPage,
} from "./features/matches";
import { MembersPage } from "./features/members";
import {
  PhaseDetailPage,
  PhaseEditPage,
  PhaseFixturesPage,
  PhaseNewPage,
  PhaseResultsPage,
  PhasesPage,
  PhaseStandingsPage,
  PhaseStructurePage,
} from "./features/phases";
import {
  PlayerDetailPage,
  PlayerNewPage,
  PlayersPage,
} from "./features/players";
import { SponsorsPage } from "./features/sponsors";
import { TeamDetailPage, TeamNewPage, TeamsPage } from "./features/teams";
import { BrandingPage, TournamentPage } from "./features/tournaments";
import { AppLayout } from "./app/layouts/AppLayout";
import IdentityPage from "./features/identity";
import { SplashPage } from "./features/auth/pages/SplashPage";

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        {/* <Route path="/" element={<Navigate to="/splash" replace />} />
        <Route path="/splash" element={<SplashPage />} /> */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tournament" element={<TournamentPage />} />
          <Route path="/calendar" element={<CalendarsPage />} />
          <Route path="/matches/new" element={<MatchNewPage />} />
          <Route path="/matches/:id" element={<MatchSheetPage />} />
          <Route path="/matches/:id/referees" element={<MatchRefereesPage />} />
          <Route path="/tournament/branding" element={<BrandingPage />} />
          <Route path="/tournament/members" element={<MembersPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/new" element={<CategoryNewPage />} />
          <Route path="/categories/:id" element={<CategoryDetailPage />} />
          <Route path="/phases" element={<PhasesPage />} />
          <Route path="/phases/new" element={<PhaseNewPage />} />
          <Route path="/phases/:id" element={<PhaseDetailPage />} />
          <Route
            path="/phases/:id/structure"
            element={<PhaseStructurePage />}
          />
          <Route path="/phases/:id/fixtures" element={<PhaseFixturesPage />} />
          <Route path="/phases/:id/results" element={<PhaseResultsPage />} />
          <Route
            path="/phases/:id/standings"
            element={<PhaseStandingsPage />}
          />
          <Route path="/phases/:id/bracket" element={<PhaseBracketPage />} />
          <Route path="/phases/:id/edit" element={<PhaseEditPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/teams/new" element={<TeamNewPage />} />
          <Route path="/teams/:id" element={<TeamDetailPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/new" element={<PlayerNewPage />} />
          <Route path="/players/:id" element={<PlayerDetailPage />} />
          <Route path="/sponsors" element={<SponsorsPage />} />
          <Route path="/identity" element={<IdentityPage />} />
          <Route
            path="/tournament/sponsors"
            element={<Navigate to="/sponsors" replace />}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
