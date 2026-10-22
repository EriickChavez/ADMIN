import { useAuth } from "../auth";

export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <main>
      <h1>Hola, {user?.displayName}</h1>
      <p>{user?.email}</p>
      <button onClick={() => logout()}>Cerrar sesión</button>
    </main>
  );
}
