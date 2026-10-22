import { Navigate, Route, Routes } from "react-router-dom";
import { GuestRoute, LoginPage, ProtectedRoute, RegisterPage } from "./features/auth";
import { HomePage } from "./features/home/HomePage";

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
