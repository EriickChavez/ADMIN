import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { SPONSOR_URL } from "../../../api/client";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { ConfirmBox } from "../../../shared/components/ui/ConfirmBox";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { useMyTournament, type Tournament } from "../../tournaments";
import { SponsorForm } from "../components/SponsorForm";
import {
  useCreateSponsor,
  useDeleteSponsor,
  useSponsors,
  useUpdateSponsor,
} from "../hooks";
import type { SponsorInput, TournamentSponsor } from "../types";
import { getSponsorErrorMessage } from "../utils/errors";

// El logo puede venir como ruta relativa (subido como archivo, servido por la API)
// o como URL absoluta (si el sponsor se creó con una URL externa).
const resolveLogoSrc = (logoUrl: string) =>
  /^https?:\/\//.test(logoUrl) ? logoUrl : `${SPONSOR_URL}${logoUrl}`;

export function SponsorsPage() {
  const { tournament, isLoading: loadingTournament } = useMyTournament();
  const { sponsors, isLoading, error, refetch } = useSponsors(tournament?.id);
  const createSponsor = useCreateSponsor(tournament?.id ?? "");
  const updateSponsor = useUpdateSponsor(tournament?.id ?? "");
  const deleteSponsor = useDeleteSponsor(tournament?.id ?? "");

  const [editing, setEditing] = useState<TournamentSponsor | "new" | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loadingTournament) {
    return (
      <div>
        <div className="mb-8 h-8 w-48 animate-pulse rounded-lg bg-slate-200/70" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-200/70" />
      </div>
    );
  }

  if (!tournament) return <Navigate to="/tournament" replace />;

  // El tope lo define la plataforma. Si el torneo no lo expone, se asume 0 y se bloquea
  // la creación por seguridad (el backend decide de verdad).
  const maxSponsors =
    (tournament as Tournament & { maxSponsors?: number }).maxSponsors ?? 0;
  const availableSlots = Math.max(maxSponsors - sponsors.length, 0);
  const limitReached = availableSlots <= 0;

  function handleSubmit(input: SponsorInput) {
    setFormError(null);
    const onError = (err: unknown) => setFormError(getSponsorErrorMessage(err));

    if (editing && editing !== "new") {
      updateSponsor.mutate(
        { id: editing.id, input },
        { onSuccess: () => setEditing(null), onError },
      );
    } else {
      // Si por una condición de carrera el backend rechaza por límite, se muestra su error.
      createSponsor.mutate(input, {
        onSuccess: () => setEditing(null),
        onError,
      });
    }
  }

  function handleDelete(id: string) {
    setConfirmId(null);
    setActionError(null);
    deleteSponsor.mutate(id, {
      onError: (err) => setActionError(getSponsorErrorMessage(err)),
    });
  }

  return (
    <div>
      <PageHeader
        title="Sponsors"
        description="Patrocinadores que se muestran en tu torneo."
        actions={
          <Button
            type="button"
            onClick={() => {
              setFormError(null);
              setEditing("new");
            }}
            disabled={limitReached || editing !== null}
            title={limitReached ? "Límite de sponsors alcanzado" : undefined}
          >
            <Plus size={16} />
            Nuevo sponsor
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span
          title="Sponsors usados / límite máximo del torneo"
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            limitReached
              ? "bg-red-50 text-red-600"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {sponsors.length} / {maxSponsors}
        </span>
        <p className="text-xs text-slate-500">
          {limitReached
            ? "Alcanzaste el límite de sponsors de este torneo. Contacta al administrador de la plataforma para aumentarlo."
            : `Puedes agregar ${availableSlots} sponsor${availableSlots === 1 ? "" : "s"} más.`}
        </p>
      </div>

      {editing !== null && (
        <SponsorForm
          key={editing === "new" ? "new" : editing.id}
          sponsor={editing === "new" ? null : editing}
          submitting={createSponsor.isPending || updateSponsor.isPending}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={() => {
            setEditing(null);
            setFormError(null);
          }}
        />
      )}

      {actionError && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {actionError}
        </p>
      )}

      <Card className="p-5 sm:p-6">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <div>
            <p className="text-sm text-red-600">
              {getSponsorErrorMessage(error)}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Reintentar
            </button>
          </div>
        ) : sponsors.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No hay sponsors registrados"
            description={`Este torneo admite hasta ${maxSponsors} sponsor${maxSponsors === 1 ? "" : "s"}.`}
            action={
              !limitReached ? (
                <Button type="button" onClick={() => setEditing("new")}>
                  <Plus size={16} />
                  Agregar primer sponsor
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {sponsors.map((sponsor) => (
              <li key={sponsor.id} className="px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <img
                      src={resolveLogoSrc(sponsor.logoUrl)}
                      alt={sponsor.name}
                      className="h-11 w-11 shrink-0 rounded-lg border border-slate-200 bg-white object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-slate-900">
                          {sponsor.name}
                        </h3>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            sponsor.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {sponsor.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-xs text-slate-500">
                        {sponsor.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setFormError(null);
                        setEditing(sponsor);
                      }}
                      disabled={editing !== null}
                    >
                      <Pencil size={15} />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setConfirmId(sponsor.id)}
                      disabled={deleteSponsor.isPending}
                      className="text-red-600"
                    >
                      <Trash2 size={15} />
                      Eliminar
                    </Button>
                  </div>
                </div>

                {confirmId === sponsor.id && (
                  <div className="mt-3">
                    <ConfirmBox
                      message={`¿Eliminar al sponsor "${sponsor.name}"? Esta acción no se puede deshacer.`}
                      confirmLabel="Sí, eliminar"
                      pending={deleteSponsor.isPending}
                      onConfirm={() => handleDelete(sponsor.id)}
                      onCancel={() => setConfirmId(null)}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
