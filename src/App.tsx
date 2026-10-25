import { Navigate, Route, Routes } from "react-router-dom";
import {
  GuestRoute,
  LoginPage,
  ProtectedRoute,
  RegisterPage,
} from "./features/auth";
import {
  CategoriesPage,
  CategoryDetailPage,
  CategoryNewPage,
} from "./features/categories";
import { HomePage } from "./features/home";
import {
  PhaseDetailPage,
  PhaseEditPage,
  PhaseFixturesPage,
  PhaseNewPage,
  PhasesPage,
  PhaseStructurePage,
} from "./features/phases";
import {
  PlayerDetailPage,
  PlayerNewPage,
  PlayersPage,
} from "./features/players";
import { TeamDetailPage, TeamNewPage, TeamsPage } from "./features/teams";
import { BrandingPage, TournamentPage } from "./features/tournaments";
import { AppLayout } from "./app/layouts/AppLayout";

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tournament" element={<TournamentPage />} />
          <Route path="/tournament/branding" element={<BrandingPage />} />
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
          <Route path="/phases/:id/edit" element={<PhaseEditPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/teams/new" element={<TeamNewPage />} />
          <Route path="/teams/:id" element={<TeamDetailPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/new" element={<PlayerNewPage />} />
          <Route path="/players/:id" element={<PlayerDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
