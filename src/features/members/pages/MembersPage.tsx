import { useState } from "react";
import { Navigate } from "react-router-dom";
import { UserPlus, UsersRound } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { ConfirmBox } from "../../../shared/components/ui/ConfirmBox";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { useMyTournament } from "../../tournaments";
import { InviteMember } from "../components/InviteMember";
import { useMembers, useRemoveMember } from "../hooks";
import { getMemberErrorMessage } from "../utils/errors";

export function MembersPage() {
  const { tournament, isLoading: loadingTournament } = useMyTournament();
  const { members, isLoading, error } = useMembers(tournament?.id);
  const removeMember = useRemoveMember(tournament?.id ?? "");

  const [inviting, setInviting] = useState(false);
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

  // El dueño primero, después por nombre.
  const sorted = [...members].sort(
    (a, b) =>
      Number(b.roleName === "OWNER") - Number(a.roleName === "OWNER") ||
      a.displayName.localeCompare(b.displayName, "es"),
  );

  function handleRemove(memberId: string) {
    setConfirmId(null);
    setActionError(null);
    removeMember.mutate(memberId, {
      onError: (err) => setActionError(getMemberErrorMessage(err)),
    });
  }

  return (
    <div>
      <PageHeader
        title="Miembros"
        description="Personas con acceso de administración a tu torneo."
        actions={
          <Button type="button" onClick={() => setInviting((v) => !v)}>
            <UserPlus size={16} />
            {inviting ? "Cerrar" : "Invitar"}
          </Button>
        }
      />

      {inviting && (
        <InviteMember
          tournamentId={tournament.id}
          onDone={() => setInviting(false)}
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
                className="h-14 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{getMemberErrorMessage(error)}</p>
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="Aún no hay miembros"
            description="Invita a alguien para que te ayude a administrar el torneo."
          />
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {sorted.map((member) => {
              const isOwner = member.roleName === "OWNER";
              const removing =
                removeMember.isPending && removeMember.variables === member.id;
              return (
                <li key={member.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                        {member.displayName.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {member.displayName}
                        </p>
                        <span
                          className={`mt-0.5 inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            isOwner
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isOwner ? "Dueño" : "Admin"}
                        </span>
                      </div>
                    </div>

                    {!isOwner && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setConfirmId(member.id)}
                        disabled={removing}
                        className="shrink-0 text-red-600"
                      >
                        {removing ? "Quitando…" : "Quitar"}
                      </Button>
                    )}
                  </div>

                  {confirmId === member.id && (
                    <div className="mt-3">
                      <ConfirmBox
                        message={`¿Quitar a ${member.displayName} del torneo? Perderá el acceso de administración.`}
                        confirmLabel="Sí, quitar"
                        onConfirm={() => handleRemove(member.id)}
                        onCancel={() => setConfirmId(null)}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
