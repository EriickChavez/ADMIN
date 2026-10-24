import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { TournamentForm } from "../components/TournamentForm";
import { TournamentPreview } from "../components/TournamentPreview";
import {
  useCreateTournament,
  useMyTournament,
  useUpdateTournament,
} from "../hooks";
import type { TournamentFormValues } from "../types";

const emptyValues: TournamentFormValues = {
  name: "",
  subtitle: "",
  description: "",
  slug: "",
  startDate: "",
  endDate: "",
  timezone: "UTC",
};

export function TournamentPage() {
  const { tournament, isLoading } = useMyTournament();
  const createTournament = useCreateTournament();
  const updateTournament = useUpdateTournament();
  const navigate = useNavigate();
  const location = useLocation();
  const [preview, setPreview] = useState<TournamentFormValues>(emptyValues);
  const justCreated =
    (location.state as { created?: boolean } | null)?.created === true;

  if (isLoading) {
    return (
      <div>
        <div className="mb-8 space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200/70" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded-lg bg-slate-200/70" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="order-first h-80 animate-pulse rounded-xl bg-slate-200/70 lg:order-none lg:col-start-3 lg:row-start-1" />
          <div className="h-[34rem] animate-pulse rounded-xl bg-slate-200/70 lg:col-span-2 lg:row-start-1" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={tournament ? "Tu torneo" : "Crea tu torneo"}
        description={
          tournament
            ? "Edita los datos generales de tu torneo."
            : "Empieza con lo básico, podrás cambiarlo después. Solo puedes tener un torneo."
        }
      />

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <TournamentForm
            key={tournament?.id ?? "new"}
            initial={tournament}
            submitLabel={tournament ? "Guardar cambios" : "Crear torneo"}
            submittingLabel={tournament ? "Guardando..." : "Creando..."}
            onValuesChange={setPreview}
            onSubmit={async (input) => {
              if (tournament) {
                await updateTournament.mutateAsync({
                  id: tournament.id,
                  input,
                });
                return;
              }
              await createTournament.mutateAsync(input);
              navigate("/tournament", {
                replace: true,
                state: { created: true },
              });
            }}
          />
        </div>

        <aside className="order-first min-w-0 lg:order-none">
          <div className="lg:sticky lg:top-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Vista previa
            </p>
            <TournamentPreview
              values={preview}
              branding={tournament?.branding ?? null}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
