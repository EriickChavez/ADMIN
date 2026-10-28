import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Trash2, Users } from "lucide-react";
import { ApiError } from "../../../api/client";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { useCategories } from "../../categories";
import { RosterLockNotice, useCategoryLocks } from "../../competition-state";
import { useMyTournament } from "../../tournaments";
import { TeamForm } from "../components/TeamForm";
import { useDeleteTeam, useTeam, useUpdateTeam } from "../hooks";

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournament, isLoading: loadingTournament } = useMyTournament();
  const { categories, isLoading: loadingCategories } = useCategories(
    tournament?.id,
  );
  const { isOpen } = useCategoryLocks(tournament?.id);
  const { team, isLoading, isError: isTeamError } = useTeam(tournament?.id, id);
  const updateTeam = useUpdateTeam(tournament?.id ?? "");
  const deleteTeam = useDeleteTeam(tournament?.id ?? "");
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (loadingTournament || (tournament && (isLoading || loadingCategories))) {
    return (
      <div>
        <div className="mb-8 h-8 w-40 animate-pulse rounded-lg bg-slate-200/70" />
        <div className="h-72 animate-pulse rounded-xl bg-slate-200/70" />
      </div>
    );
  }

  if (!tournament) return <Navigate to="/tournament" replace />;

  if (isTeamError) {
    return (
      <div>
        <PageHeader
          title="No se pudo cargar el equipo"
          description="Ocurrió un error al consultar sus datos."
        />
        <Card className="p-6">
          <p role="alert" className="text-sm text-rose-700">
            Revisa tu conexión e inténtalo de nuevo.
          </p>
          <Link
            to="/teams"
            className="mt-4 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Volver a equipos →
          </Link>
        </Card>
      </div>
    );
  }

  if (!team) {
    return (
      <div>
        <PageHeader title="Equipo" description="" />
        <Card className="flex flex-col items-center px-6 py-12 text-center">
          <Users size={28} className="text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-900">
            Equipo no encontrado
          </p>
          <Link
            to="/teams"
            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Ver todos los equipos →
          </Link>
        </Card>
      </div>
    );
  }

  // Con la categoría empezada o cerrada se pueden corregir los datos del equipo,
  // pero no eliminarlo ni moverlo a otra categoría.
  const locked = !isOpen(team.categoryId);
  const lockedCategories = categories.filter((c) => c.id === team.categoryId);
  // Se conserva la categoría actual aunque esté bloqueada, para que el selector la muestre.
  const formCategories = categories.filter(
    (c) => isOpen(c.id) || c.id === team.categoryId,
  );

  const onDelete = async () => {
    setDeleteError(null);
    try {
      await deleteTeam.mutateAsync(team.id);
      navigate("/teams", { replace: true });
    } catch (err) {
      setDeleteError(
        err instanceof ApiError ? err.message : "No se pudo eliminar el equipo",
      );
      setConfirmDelete(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={team.name}
        description={`${team.abbreviation} · Edita o elimina este equipo.`}
      />

      {locked && (
        <RosterLockNotice
          tournamentId={tournament.id}
          categories={lockedCategories}
        />
      )}

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
              El equipo se actualizó correctamente.
            </p>
          </div>
        </div>
      )}

      <Card className="p-5 sm:p-6">
        <TeamForm
          key={team.id}
          initial={team}
          categories={formCategories}
          submitLabel="Guardar cambios"
          submittingLabel="Guardando…"
          onSubmit={async (input) => {
            setSaved(false);
            await updateTeam.mutateAsync({ id: team.id, input });
            setSaved(true);
          }}
          extraActions={
            <Link
              to="/teams"
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Volver al listado
            </Link>
          }
        />
      </Card>

      <Card className="mt-6 border-red-100 p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-900">
          Zona de peligro
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Eliminar el equipo es permanente. Los jugadores asociados podrían
          quedar afectados.
        </p>
        {locked && (
          <p className="mt-3 text-sm text-amber-700">
            No se puede eliminar: la categoría ya empezó o su campeonato está
            cerrado.
          </p>
        )}
        {deleteError && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {deleteError}
          </p>
        )}
        {!confirmDelete ? (
          <Button
            type="button"
            variant="secondary"
            className="mt-4 !border-red-200 !text-red-700 hover:!bg-red-50"
            disabled={locked}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={16} />
            Eliminar equipo
          </Button>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              className="!bg-red-600 hover:!bg-red-700"
              disabled={deleteTeam.isPending}
              onClick={onDelete}
            >
              {deleteTeam.isPending ? "Eliminando…" : "Sí, eliminar"}
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
