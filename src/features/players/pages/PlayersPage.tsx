import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, UserRound } from "lucide-react";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { Button, ButtonLink } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { useCategories } from "../../categories";
import { useTeams } from "../../teams";
import { useMyTournament } from "../../tournaments";
import { usePlayers } from "../hooks";

const PAGE_SIZE = 20;

export function PlayersPage() {
  const { tournament, isLoading: loadingTournament } = useMyTournament();
  const { categories, isLoading: loadingCategories } = useCategories(
    tournament?.id,
  );
  const { teams, isLoading: loadingTeams } = useTeams(tournament?.id, {
    limit: 100,
  });
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState("");
  const [teamId, setTeamId] = useState("");

  const filteredTeams = useMemo(
    () =>
      categoryId ? teams.filter((t) => t.categoryId === categoryId) : teams,
    [teams, categoryId],
  );

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(categoryId ? { categoryId } : {}),
      ...(teamId ? { teamId } : {}),
    }),
    [page, categoryId, teamId],
  );

  const { players, pagination, isLoading } = usePlayers(tournament?.id, query);

  const teamMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of teams) map.set(t.id, t.name);
    return map;
  }, [teams]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.id, c.title);
    return map;
  }, [categories]);

  const loading =
    loadingTournament ||
    (tournament && (isLoading || loadingCategories || loadingTeams));

  if (loading) {
    return (
      <div>
        <div className="mb-8 space-y-2">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200/70" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded-lg bg-slate-200/70" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-slate-200/70"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div>
        <PageHeader title="Jugadores" description="" />
        <Card className="flex flex-col items-center px-6 py-12 text-center">
          <UserRound size={28} className="text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-900">
            Primero crea tu torneo
          </p>
          <Link
            to="/tournament"
            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Crear torneo →
          </Link>
        </Card>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div>
        <PageHeader
          title="Jugadores"
          description="Los jugadores pertenecen a un equipo."
        />
        <Card>
          <EmptyState
            icon={UserRound}
            title="Necesitas al menos un equipo"
            description="Crea un equipo antes de registrar jugadores."
            action={
              <ButtonLink to="/teams/new">
                <Plus size={16} />
                Crear equipo
              </ButtonLink>
            }
          />
        </Card>
      </div>
    );
  }

  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Jugadores"
          description="Administra la plantilla de cada equipo."
        />
        <ButtonLink to="/players/new" className="shrink-0 self-start">
          <Plus size={16} />
          Nuevo jugador
        </ButtonLink>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setTeamId("");
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <select
          value={teamId}
          onChange={(e) => {
            setTeamId(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Todos los equipos</option>
          {filteredTeams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400">
          {total} {total === 1 ? "jugador" : "jugadores"}
        </span>
      </div>

      {players.length === 0 ? (
        <Card>
          <EmptyState
            icon={UserRound}
            title="No hay jugadores"
            description="Registra el primer jugador del torneo."
            action={
              <ButtonLink to="/players/new">
                <Plus size={16} />
                Nuevo jugador
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {players.map((player) => (
              <li key={player.id}>
                <Link
                  to={`/players/${player.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50 sm:px-6"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                    {player.number != null ? player.number : "—"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {player.firstName} {player.lastName}
                      {player.isCaptain && (
                        <span className="ml-2 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                          C
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {teamMap.get(player.teamId) ?? "Equipo"}
                      {" · "}
                      {categoryMap.get(player.categoryId) ?? "Categoría"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 sm:px-6">
              <p className="text-xs text-slate-500">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="!px-2.5"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="!px-2.5"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
