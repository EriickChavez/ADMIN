import { useMemo, useState } from "react";
import { Save, Search } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import type { Team } from "../../teams/types";
import { useSyncPhaseTeams } from "../hooks";
import type { Phase, PhaseGroup, PhaseTeam } from "../types";
import { getPhaseErrorMessage } from "../utils/errors";

interface PhaseTeamsPanelProps {
  phase: Phase;
  groups: PhaseGroup[];
  teams: Team[];
  assignments: PhaseTeam[];
}

// Valor del selector: "" = sin asignar, id de grupo, o "in" (fases sin grupos).
const IN_PHASE = "in";

// Para buscar sin distinguir mayúsculas ni acentos ("mexico" encuentra "México").
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export function PhaseTeamsPanel({
  phase,
  groups,
  teams,
  assignments,
}: PhaseTeamsPanelProps) {
  const syncTeams = useSyncPhaseTeams(phase.id);
  const isGroupPhase = phase.type === "group";

  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");

  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [teams],
  );

  // Solo afecta lo que se ve; contadores y guardado usan la lista completa.
  const visibleTeams = useMemo(() => {
    const query = normalize(search);
    if (!query) return sortedTeams;
    return sortedTeams.filter(
      (t) =>
        normalize(t.name).includes(query) ||
        normalize(t.abbreviation).includes(query),
    );
  }, [sortedTeams, search]);

  // Lo guardado en el servidor, como { teamId: valor del selector }.
  const savedValues = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of assignments) {
      map[a.teamId] = isGroupPhase ? (a.phaseGroupId ?? "") : IN_PHASE;
    }
    return map;
  }, [assignments, isGroupPhase]);

  // Un grupo borrado deja su id huérfano: se trata como "sin asignar".
  const validGroupIds = useMemo(
    () => new Set(groups.map((g) => g.id)),
    [groups],
  );

  const valueOf = (teamId: string): string => {
    const value = overrides[teamId] ?? savedValues[teamId] ?? "";
    if (isGroupPhase && value && !validGroupIds.has(value)) return "";
    return value;
  };

  const counts: Record<string, number> = {};
  let assigned = 0;
  for (const team of sortedTeams) {
    const value = valueOf(team.id);
    if (!value) continue;
    counts[value] = (counts[value] ?? 0) + 1;
    assigned += 1;
  }
  const isDirty = Object.keys(overrides).length > 0;

  function handleChange(teamId: string, value: string) {
    setSaved(false);
    setOverrides((prev) => {
      const next = { ...prev };
      // Si vuelve al valor guardado, deja de contar como cambio.
      if (value === (savedValues[teamId] ?? "")) delete next[teamId];
      else next[teamId] = value;
      return next;
    });
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    // La API reemplaza toda la lista: se mandan todos los equipos asignados,
    // estén o no visibles con el filtro actual.
    const payload = sortedTeams
      .filter((t) => valueOf(t.id) !== "")
      .map((t) => ({
        teamId: t.id,
        phaseGroupId: isGroupPhase ? valueOf(t.id) : null,
      }));
    syncTeams.mutate(payload, {
      onSuccess: () => {
        setOverrides({});
        setSaved(true);
      },
      onError: (err) => setError(getPhaseErrorMessage(err)),
    });
  }

  if (isGroupPhase && groups.length === 0) {
    return (
      <Card className="border-dashed p-6 text-center text-sm text-slate-500">
        Crea al menos un grupo para poder asignar equipos.
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Equipos</h2>
          <p className="mt-1 text-sm text-slate-500">
            {assigned} de {sortedTeams.length} equipos en la fase
            {sortedTeams.length - assigned > 0 &&
              ` · ${sortedTeams.length - assigned} sin asignar`}
          </p>
        </div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || syncTeams.isPending}
        >
          <Save size={16} />
          {syncTeams.isPending ? "Guardando…" : "Guardar asignación"}
        </Button>
      </div>

      {isGroupPhase && (
        <div className="mb-4 flex flex-wrap gap-2">
          {groups.map((group) => (
            <span
              key={group.id}
              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
            >
              {group.name}: {counts[group.id] ?? 0}
            </span>
          ))}
        </div>
      )}

      <div className="relative mb-3">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar equipo"
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <ul className="max-h-[32rem] divide-y divide-slate-100 overflow-auto rounded-lg border border-slate-200">
        {visibleTeams.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-500">
            Ningún equipo coincide con la búsqueda.
          </li>
        )}
        {visibleTeams.map((team) => (
          <li
            key={team.id}
            className="flex items-center justify-between gap-3 px-4 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {team.name}
              </p>
              <p className="text-xs text-slate-500">{team.abbreviation}</p>
            </div>
            <select
              value={valueOf(team.id)}
              onChange={(e) => handleChange(team.id, e.target.value)}
              className={`w-44 shrink-0 rounded-lg border bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                overrides[team.id] !== undefined
                  ? "border-blue-400"
                  : "border-slate-300"
              }`}
            >
              <option value="">Sin asignar</option>
              {isGroupPhase ? (
                groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))
              ) : (
                <option value={IN_PHASE}>En la fase</option>
              )}
            </select>
          </li>
        ))}
      </ul>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Asignación guardada.
        </p>
      )}
    </Card>
  );
}
