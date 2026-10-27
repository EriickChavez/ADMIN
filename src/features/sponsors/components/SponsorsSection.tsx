import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Handshake, Plus, Star } from "lucide-react";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { Card } from "../../../shared/components/ui/Card";
import { Button } from "../../../shared/components/ui/Button";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { useMyTournament } from "../../tournaments";
import { getSponsorErrorMessage } from "../utils/sponsor-error-message";
import type { TournamentSponsor } from "../types";
import { SponsorItem } from "./SponsorItem";
import {
  useSponsors,
  useCreateSponsor,
  useUpdateSponsor,
  useDeleteSponsor,
} from "../hooks";
import { type SponsorSubmitValues, SponsorFormModal } from "./SponsorFormModal";

interface SponsorsSectionProps {
  tournamentId?: string;
  maxSponsors?: number;
  embedded?: boolean;
}

export function SponsorsSection({
  tournamentId: propTournamentId,
  maxSponsors: propMaxSponsors,
  embedded = false,
}: SponsorsSectionProps = {}) {
  const { tournament, isLoading: loadingTournament } = useMyTournament();
  const tournamentId = propTournamentId || tournament?.id || "";
  const maxSponsors = propMaxSponsors ?? tournament?.maxSponsors ?? 10;

  const { data, isLoading, isError, error, refetch } =
    useSponsors(tournamentId);

  const createSponsor = useCreateSponsor(tournamentId);
  const updateSponsor = useUpdateSponsor(tournamentId);
  const deleteSponsor = useDeleteSponsor(tournamentId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] =
    useState<TournamentSponsor | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  if (loadingTournament && !propTournamentId) {
    return (
      <div>
        <div className="mb-8 space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200/70" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded-lg bg-slate-200/70" />
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-slate-200/70" />
      </div>
    );
  }

  if (!tournament && !propTournamentId) {
    return <Navigate to="/tournament" replace />;
  }

  const sponsors = data?.sponsors ?? [];
  const availableSlots = Math.max(maxSponsors - sponsors.length, 0);
  const limitReached = availableSlots <= 0;

  function handleOpenCreate() {
    if (limitReached) return;
    setEditingSponsor(null);
    setModalError(null);
    setModalOpen(true);
  }

  function handleOpenEdit(sponsor: TournamentSponsor) {
    setEditingSponsor(sponsor);
    setModalError(null);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditingSponsor(null);
    setModalError(null);
  }

  function handleSubmitForm(values: SponsorSubmitValues) {
    setModalError(null);
    const { logo, removePdf, ...rest } = values;

    if (editingSponsor) {
      updateSponsor.mutate(
        { id: editingSponsor.id, payload: { ...rest, logo, removePdf } },
        {
          onSuccess: () => handleCloseModal(),
          onError: (err) => setModalError(getSponsorErrorMessage(err)),
        },
      );
    } else {
      createSponsor.mutate(
        { ...rest, logo },
        {
          onSuccess: () => handleCloseModal(),
          onError: (err) => setModalError(getSponsorErrorMessage(err)),
        },
      );
    }
  }

  function handleDeleteSponsor(sponsor: TournamentSponsor) {
    const isConfirm = window.confirm(
      `¿Estás seguro de que deseas eliminar al sponsor "${sponsor.name}"?`,
    );
    if (!isConfirm) return;

    deleteSponsor.mutate(sponsor.id, {
      onError: (err) => alert(getSponsorErrorMessage(err)),
    });
  }

  const content = (
    <div className="flex flex-col gap-4">
      {limitReached && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Alcanzaste el límite de sponsors ({maxSponsors}) para este torneo.
          Contacta al administrador de la plataforma para aumentarlo.
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
          <svg
            className="animate-spin text-blue-600"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M12 2a10 10 0 0 1 10 10" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          Cargando sponsors...
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs text-red-600">
            {getSponsorErrorMessage(error)}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-xs font-medium text-red-700 underline hover:opacity-80"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && sponsors.length === 0 && (
        <EmptyState
          icon={Star}
          title="No hay sponsors registrados"
          description={`Este torneo admite hasta ${maxSponsors} sponsor${maxSponsors === 1 ? "" : "s"}.`}
          action={
            !limitReached ? (
              <Button type="button" onClick={handleOpenCreate}>
                <Plus size={16} />
                Agregar primer sponsor
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Sponsor List */}
      {!isLoading && !isError && sponsors.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {sponsors.map((sponsor) => (
            <SponsorItem
              key={sponsor.id}
              sponsor={sponsor}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteSponsor}
              isDeleting={deleteSponsor.isPending}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <SponsorFormModal
          onClose={handleCloseModal}
          onSubmit={handleSubmitForm}
          sponsor={editingSponsor}
          isSubmitting={createSponsor.isPending || updateSponsor.isPending}
          errorMessage={modalError}
        />
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Handshake size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Sponsors</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    limitReached
                      ? "bg-red-100 text-red-600"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {sponsors.length} / {maxSponsors}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {limitReached
                  ? "Límite alcanzado"
                  : `Puedes agregar ${availableSlots} sponsor${availableSlots === 1 ? "" : "s"} más`}
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleOpenCreate}
            disabled={limitReached}
            title={limitReached ? "Límite de sponsors alcanzado" : undefined}
          >
            <Plus size={16} />
            Nuevo sponsor
          </Button>
        </div>

        {content}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Sponsors"
        description="Gestiona los patrocinadores y marcas oficiales asociadas a tu torneo."
        actions={
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                limitReached
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {sponsors.length} / {maxSponsors} sponsors
            </span>
            <Button
              type="button"
              onClick={handleOpenCreate}
              disabled={limitReached}
              title={limitReached ? "Límite de sponsors alcanzado" : undefined}
            >
              <Plus size={16} />
              Nuevo sponsor
            </Button>
          </div>
        }
      />

      <Card className="p-6">{content}</Card>
    </div>
  );
}
