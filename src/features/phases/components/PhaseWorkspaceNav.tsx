import { NavLink } from "react-router-dom";
import {
  CalendarDays,
  ClipboardList,
  Pencil,
  Settings2,
  Trophy,
} from "lucide-react";
import type { Phase } from "../types";

interface PhaseWorkspaceNavProps {
  phase: Phase;
  current: "overview" | "structure" | "fixtures" | "results" | "edit";
}

const base =
  "inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors";
const active = "bg-slate-900 text-white shadow-sm";
const inactive = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

export function PhaseWorkspaceNav({ phase, current }: PhaseWorkspaceNavProps) {
  const items = [
    {
      id: "overview",
      label: "Resumen",
      to: `/phases/${phase.id}`,
      icon: Trophy,
      show: true,
    },
    {
      id: "structure",
      label: phase.type === "group" ? "Grupos y equipos" : "Equipos",
      to: `/phases/${phase.id}/structure`,
      icon: Settings2,
      show: phase.type !== "knockout",
    },
    {
      id: "fixtures",
      label: "Calendario",
      to: `/phases/${phase.id}/fixtures`,
      icon: CalendarDays,
      show: phase.type === "group",
    },
    {
      id: "results",
      label: "Resultados",
      to: `/phases/${phase.id}/results`,
      icon: ClipboardList,
      show: phase.type !== "knockout",
    },
    {
      id: "edit",
      label: "Configuración",
      to: `/phases/${phase.id}/edit`,
      icon: Pencil,
      show: true,
    },
  ].filter((item) => item.show);

  return (
    <nav
      aria-label="Navegación de la fase"
      className="mb-6 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
    >
      <div className="flex gap-1 overflow-x-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = item.id === current;
          return (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.id === "overview"}
              aria-current={selected ? "page" : undefined}
              className={`${base} shrink-0 ${selected ? active : inactive}`}
            >
              <Icon size={16} aria-hidden="true" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
