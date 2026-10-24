import { Navigate, Route, Routes } from "react-router-dom";
import {
  GuestRoute,
  LoginPage,
  ProtectedRoute,
  RegisterPage,
} from "./features/auth";
import { TournamentPage } from "./features/tournaments";
import { HomePage } from "./features/home/HomePage";
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
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
