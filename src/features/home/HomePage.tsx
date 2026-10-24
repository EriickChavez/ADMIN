import { useAuth } from "../auth";

export function HomePage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        Hola, {user?.displayName}
      </h1>
      <p className="mt-1 text-slate-500">Bienvenido de nuevo.</p>
    </div>
  );
}
