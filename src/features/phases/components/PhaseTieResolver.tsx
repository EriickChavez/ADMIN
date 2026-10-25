import { useState } from "react";
import { Button } from "../../../shared/components/ui/Button";

interface TieTeam {
  teamId: string;
  name: string;
}

interface PhaseTieResolverProps {
  title: string;
  affectsQualification: boolean;
  teams: TieTeam[];
  /** Posiciones de la tabla que ocupan estos equipos, de menor a mayor. */
  positions: number[];
  isSaving: boolean;
  onSave: (assignment: Map<string, number>) => void;
}

export function PhaseTieResolver({
  title,
  affectsQualification,
  teams,
  positions,
  isSaving,
  onSave,
}: PhaseTieResolverProps) {
  const [choice, setChoice] = useState<Record<string, string>>({});

  const chosen = teams.map((team) => choice[team.teamId] ?? "");
  const allChosen = chosen.every((value) => value !== "");
  const allDistinct = new Set(chosen).size === chosen.length;
  const isValid = allChosen && allDistinct;

  const isDuplicate = (value: string) =>
    value !== "" && chosen.filter((c) => c === value).length > 1;

  function handleSave() {
    onSave(
      new Map(teams.map((team) => [team.teamId, Number(choice[team.teamId])])),
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        {affectsQualification && (
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
            Afecta la clasificación
          </span>
        )}
      </div>

      <div className="space-y-2">
        {teams.map((team) => {
          const value = choice[team.teamId] ?? "";
          return (
            <div
              key={team.teamId}
              className="flex items-center justify-between gap-3"
            >
              <span className="min-w-0 truncate text-sm text-slate-700">
                {team.name}
              </span>
              <select
                value={value}
                onChange={(e) =>
                  setChoice((prev) => ({
                    ...prev,
                    [team.teamId]: e.target.value,
                  }))
                }
                className={`w-36 shrink-0 rounded-lg border bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 ${
                  isDuplicate(value)
                    ? "border-red-300"
                    : "border-slate-300 focus:border-blue-500"
                }`}
              >
                <option value="">Posición…</option>
                {positions.map((position) => (
                  <option key={position} value={position}>
                    {position}º lugar
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {allChosen && !allDistinct && (
        <p className="mt-2 text-xs text-red-600">
          Cada equipo debe tener una posición distinta.
        </p>
      )}

      <Button
        type="button"
        className="mt-3"
        onClick={handleSave}
        disabled={!isValid || isSaving}
      >
        {isSaving ? "Guardando…" : "Guardar desempate"}
      </Button>
    </div>
  );
}
