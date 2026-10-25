import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, GitBranch, Trash2 } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { useMyTournament } from "../../tournaments";
import { PhaseForm } from "../components/PhaseForm";
import { useDeletePhase, usePhase, useUpdatePhase } from "../hooks";
import { getPhaseErrorMessage } from "../utils/errors";

export function PhaseEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournament, isLoading: loadingTournament } = useMyTournament();
  const { phase, isLoading } = usePhase(id);
  const updatePhase = useUpdatePhase(
    phase?.tournamentId ?? "",
    phase?.categoryId ?? "",
  );
  const deletePhase = useDeletePhase(
    phase?.tournamentId ?? "",
    phase?.categoryId ?? "",
  );
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (loadingTournament || isLoading) {
    return (
      <div>
        <div className="mb-8 h-8 w-40 animate-pulse rounded-lg bg-slate-200/70" />
        <div className="h-72 animate-pulse rounded-xl bg-slate-200/70" />
      </div>
    );
  }

  if (!tournament) return <Navigate to="/tournament" replace />;

  if (!phase) {
    return (
      <div>
        <PageHeader title="Fase" description="" />
        <Card className="flex flex-col items-center px-6 py-12 text-center">
          <GitBranch size={28} className="text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-900">
            Fase no encontrada
          </p>
          <Link
            to="/phases"
            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Ver todas las fases →
          </Link>
        </Card>
      </div>
    );
  }

  const onDelete = async () => {
    setDeleteError(null);
    try {
      await deletePhase.mutateAsync(phase.id);
      navigate("/phases", { replace: true });
    } catch (err) {
      setDeleteError(getPhaseErrorMessage(err));
      setConfirmDelete(false);
    }
  };

  return (
    <div>
      <Link
        to={`/phases/${phase.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} />
        {phase.name}
      </Link>

      <PageHeader
        title="Editar fase"
        description="Edita o elimina esta fase."
      />

      {saved && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0 text-emerald-600"
          />
          <div>
            <p className="text-sm font-semibold text-emerald-900">
              Cambios guardados
            </p>
            <p className="mt-0.5 text-sm text-emerald-800">
              La fase se actualizó correctamente.
            </p>
          </div>
        </div>
      )}

      <Card className="p-5 sm:p-6">
        <PhaseForm
          key={phase.id}
          initial={phase}
          submitLabel="Guardar cambios"
          submittingLabel="Guardando…"
          onSubmit={async (input) => {
            setSaved(false);
            await updatePhase.mutateAsync({ id: phase.id, input });
            setSaved(true);
          }}
        />
      </Card>

      <Card className="mt-6 border-red-100 p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-900">
          Zona de peligro
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Eliminar la fase es permanente. No se puede hacer si ya tiene
          partidos.
        </p>
        {deleteError && (
          <p className="mt-3 text-sm text-red-600">{deleteError}</p>
        )}
        {!confirmDelete ? (
          <Button
            type="button"
            variant="secondary"
            className="mt-4 !border-red-200 !text-red-700 hover:!bg-red-50"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={16} />
            Eliminar fase
          </Button>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              className="!bg-red-600 hover:!bg-red-700"
              disabled={deletePhase.isPending}
              onClick={onDelete}
            >
              {deletePhase.isPending ? "Eliminando…" : "Sí, eliminar"}
            </Button>
            <button
              type="button"
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
              onClick={() => setConfirmDelete(false)}
            >
              Cancelar
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
