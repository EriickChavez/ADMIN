import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { TournamentForm } from "../components/TournamentForm";
import {
  useCreateTournament,
  useMyTournament,
  useUpdateTournament,
} from "../hooks";

export function TournamentPage() {
  const { tournament, isLoading } = useMyTournament();
  const createTournament = useCreateTournament();
  const updateTournament = useUpdateTournament();
  const navigate = useNavigate();
  const location = useLocation();
  const justCreated =
    (location.state as { created?: boolean } | null)?.created === true;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200/70" />
        <div className="h-96 animate-pulse rounded-xl bg-slate-200/70" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {tournament ? "Tu torneo" : "Crea tu torneo"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {tournament
            ? "Edita los datos generales de tu torneo."
            : "Empieza con lo básico, podrás cambiarlo después. Solo puedes tener un torneo."}
        </p>
      </header>

      {tournament && justCreated && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0 text-emerald-600"
          />
          <div>
            <p className="text-sm font-semibold text-emerald-900">
              ¡Torneo creado!
            </p>
            <p className="mt-0.5 text-sm text-emerald-800">
              Siguiente paso: crea tu primera categoría.
            </p>
            <Link
              to="/categories/new"
              className="mt-2 inline-block text-sm font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
            >
              Crear categoría
            </Link>
          </div>
        </div>
      )}

      <TournamentForm
        key={tournament?.id ?? "new"}
        initial={tournament}
        submitLabel={tournament ? "Guardar cambios" : "Crear torneo"}
        submittingLabel={tournament ? "Guardando..." : "Creando..."}
        onSubmit={async (input) => {
          if (tournament) {
            await updateTournament.mutateAsync({ id: tournament.id, input });
            return;
          }
          await createTournament.mutateAsync(input);
          navigate("/tournament", { replace: true, state: { created: true } });
        }}
      />
    </div>
  );
}
