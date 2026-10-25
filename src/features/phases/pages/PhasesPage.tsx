import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, CalendarDays, CheckCircle2, CircleDashed, Clock3, GitBranch, Plus, Search, Trophy, Users } from "lucide-react";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { ButtonLink } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { useCategories } from "../../categories";
import { useMyTournament } from "../../tournaments";
import { usePhases } from "../hooks";
import { PHASE_STATUS_LABELS, PHASE_TYPE_LABELS, type Phase, type PhaseStatus, type PhaseType } from "../types";

const statusStyles: Record<PhaseStatus, string> = {
  upcoming: "bg-sky-50 text-sky-700 ring-sky-600/15",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  finished: "bg-slate-100 text-slate-600 ring-slate-500/15",
};
const typeIcon: Record<PhaseType, typeof GitBranch> = { group: Users, league: Trophy, knockout: GitBranch };
const dateLabel = (phase: Phase) => {
  if (!phase.startDate && !phase.endDate) return "Fechas sin definir";
  const format = (date: string | null) => date ? new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date.slice(0, 10)}T00:00:00Z`)) : "Por definir";
  return `${format(phase.startDate)} – ${format(phase.endDate)}`;
};

function Metric({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof GitBranch; tone: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={19} /></span>
    <div><p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p><p className="text-xs font-medium text-slate-500">{label}</p></div>
  </div>;
}

export function PhasesPage() {
  const { tournament, isLoading: loadingTournament } = useMyTournament();
  const { categories, isLoading: loadingCategories } = useCategories(tournament?.id);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedCategoryId = searchParams.get("categoryId") ?? "";
  const [categoryId, setCategoryId] = useState(requestedCategoryId);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PhaseStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | PhaseType>("all");

  useEffect(() => {
    if (!categories.length) return;

    const requestedCategoryExists = categories.some(
      (category) => category.id === requestedCategoryId,
    );
    const currentCategoryExists = categories.some(
      (category) => category.id === categoryId,
    );

    if (requestedCategoryExists && requestedCategoryId !== categoryId) {
      setCategoryId(requestedCategoryId);
      return;
    }

    if (!currentCategoryExists) {
      const fallbackCategoryId = categories[0].id;
      setCategoryId(fallbackCategoryId);
      setSearchParams({ categoryId: fallbackCategoryId }, { replace: true });
    }
  }, [categories, categoryId, requestedCategoryId, setSearchParams]);

  function handleCategoryChange(nextCategoryId: string) {
    setCategoryId(nextCategoryId);
    setSearchParams({ categoryId: nextCategoryId });
  }

  const { phases, isLoading, isError } = usePhases(tournament?.id, categoryId || undefined);
  const filteredPhases = useMemo(() => phases.filter((phase) => {
    const matchesSearch = phase.name.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"));
    return matchesSearch && (statusFilter === "all" || phase.status === statusFilter) && (typeFilter === "all" || phase.type === typeFilter);
  }), [phases, query, statusFilter, typeFilter]);

  if (loadingTournament || (tournament && loadingCategories)) return <div className="space-y-5"><div className="h-10 w-56 animate-pulse rounded-lg bg-slate-200" /><div className="grid gap-3 sm:grid-cols-3"><div className="h-20 animate-pulse rounded-xl bg-slate-200" /><div className="h-20 animate-pulse rounded-xl bg-slate-200" /><div className="h-20 animate-pulse rounded-xl bg-slate-200" /></div><div className="h-64 animate-pulse rounded-2xl bg-slate-200" /></div>;

  if (!tournament) return <div><PageHeader title="Fases" description="Organiza el formato y el avance de la competencia." /><Card className="p-6"><EmptyState icon={GitBranch} title="Primero crea tu torneo" description="Cuando tengas un torneo podrás organizar sus fases y categorías." action={<ButtonLink to="/tournament">Crear torneo</ButtonLink>} /></Card></div>;

  if (categories.length === 0) return <div><PageHeader title="Fases" description="Organiza el formato y el avance de la competencia." /><Card className="p-6"><EmptyState icon={GitBranch} title="Necesitas una categoría" description="Las fases se configuran dentro de una categoría. Crea una para continuar." action={<ButtonLink to="/categories/new"><Plus size={16}/>Crear categoría</ButtonLink>} /></Card></div>;

  const activeCount = phases.filter((phase) => phase.status === "active").length;
  const upcomingCount = phases.filter((phase) => phase.status === "upcoming").length;
  const finishedCount = phases.filter((phase) => phase.status === "finished").length;

  return <div className="space-y-6">
    <PageHeader title="Fases de competencia" description="Administra la estructura, los equipos y el calendario de cada etapa." actions={<ButtonLink to={`/phases/new?categoryId=${categoryId}`}><Plus size={16}/>Nueva fase</ButtonLink>} />

    <Card className="overflow-hidden border-0 bg-slate-900 text-white shadow-sm">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10"><Trophy size={23}/></div><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Centro de competencia</p><h2 className="mt-1 text-xl font-bold">{tournament.name}</h2><p className="mt-1 text-sm text-slate-300">Selecciona una categoría para administrar sus etapas.</p></div></div>
        <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-slate-300 sm:min-w-64"><span>Categoría seleccionada</span><select value={categoryId} onChange={(event) => handleCategoryChange(event.target.value)} className="min-h-11 rounded-xl border border-white/15 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-400">{categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}</select></label>
      </div>
    </Card>

    <div className="grid gap-3 sm:grid-cols-3">
      <Metric label="En curso" value={activeCount} icon={Clock3} tone="bg-emerald-50 text-emerald-700" />
      <Metric label="Próximas" value={upcomingCount} icon={CircleDashed} tone="bg-sky-50 text-sky-700" />
      <Metric label="Finalizadas" value={finishedCount} icon={CheckCircle2} tone="bg-slate-100 text-slate-600" />
    </div>

    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-bold text-slate-900">Etapas de la categoría</h2><p className="mt-1 text-sm text-slate-500">{phases.length} {phases.length === 1 ? "fase configurada" : "fases configuradas"} · ordenadas por secuencia de competencia</p></div>
        <div className="grid gap-2 sm:grid-cols-3"><label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><span className="sr-only">Buscar fase</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar fase…" className="min-h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label><select aria-label="Filtrar por estado" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"><option value="all">Todos los estados</option><option value="upcoming">Próximas</option><option value="active">En curso</option><option value="finished">Finalizadas</option></select><select aria-label="Filtrar por formato" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"><option value="all">Todos los formatos</option><option value="group">Fase de grupos</option><option value="league">Liga</option><option value="knockout">Eliminatoria</option></select></div>
      </div>

      {isLoading ? <div className="space-y-3">{[0,1,2].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-200/70" />)}</div> : isError ? <Card className="border-red-200 p-6 text-sm text-red-700">No se pudieron cargar las fases. Intenta actualizar la página.</Card> : phases.length === 0 ? <Card className="p-6"><EmptyState icon={GitBranch} title="Todavía no hay fases" description="Crea la primera etapa y define si será fase de grupos, liga o eliminación directa." action={<ButtonLink to={`/phases/new?categoryId=${categoryId}`}><Plus size={16}/>Crear primera fase</ButtonLink>} /></Card> : filteredPhases.length === 0 ? <Card className="p-8 text-center"><Search size={24} className="mx-auto text-slate-300"/><h3 className="mt-3 text-sm font-bold text-slate-900">No encontramos fases</h3><p className="mt-1 text-sm text-slate-500">Prueba con otro nombre o cambia los filtros.</p><button type="button" onClick={() => { setQuery(""); setStatusFilter("all"); setTypeFilter("all"); }} className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-800">Limpiar filtros</button></Card> : <div className="grid gap-3 xl:grid-cols-2">{filteredPhases.map((phase, index) => {
        const Icon = typeIcon[phase.type];
        return <Card key={phase.id} className="group overflow-hidden transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"><div className="p-5"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-blue-50 group-hover:text-blue-700"><Icon size={21}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fase {String(phase.sortOrder || index + 1).padStart(2, "0")}</span><span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[phase.status]}`}>{PHASE_STATUS_LABELS[phase.status]}</span></div><h3 className="mt-1 truncate text-base font-bold text-slate-900">{phase.name}</h3><p className="mt-1 text-sm text-slate-500">{PHASE_TYPE_LABELS[phase.type]}</p></div></div><div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-xs font-medium text-slate-500"><CalendarDays size={15}/>{dateLabel(phase)}</p><Link to={`/phases/${phase.id}`} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">Administrar fase<ArrowRight size={15}/></Link></div></div></Card>;
      })}</div>}
    </section>
  </div>;
}
