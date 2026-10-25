import { useMemo, useState } from "react";
import { CalendarDays, Check, Clock3, MapPin, Pencil, Search, X } from "lucide-react";
import { useMyTournament } from "../../tournaments";
import { useCategories } from "../../categories";
import { usePhases, usePhaseGroups } from "../../phases/hooks";
import { useTeams } from "../../teams";
import { useAllMatches, useUpdateMatch } from "../hooks";
import type { Match, MatchStatus } from "../types";
import { MATCH_STATUS_LABELS } from "../types";
import { datetimeLocalToIso, isoToDatetimeLocal } from "../utils/datetime";
import { getMatchErrorMessage } from "../utils/errors";
import { Card } from "../../../shared/components/ui/Card";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { Pagination } from "../../../shared/components/Pagination";

const PAGE_SIZE = 20;
const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const statusTone: Record<MatchStatus, string> = {
  scheduled: "bg-blue-50 text-blue-700", in_progress: "bg-amber-50 text-amber-700",
  finished: "bg-emerald-50 text-emerald-700", cancelled: "bg-rose-50 text-rose-700",
  postponed: "bg-orange-50 text-orange-700",
};
const formatDate = (iso: string) => new Intl.DateTimeFormat("es-MX", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
const formatTime = (iso: string) => new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export function CalendarsPage() {
  const { tournament, isLoading: loadingTournament } = useMyTournament();
  const { categories, isLoading: loadingCategories } = useCategories(tournament?.id);
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState("");
  const [phaseId, setPhaseId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Match | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editVenue, setEditVenue] = useState("");
  const [editStatus, setEditStatus] = useState<MatchStatus>("scheduled");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const { phases, isLoading: loadingPhases } = usePhases(tournament?.id, categoryId || undefined);
  const { groups, isLoading: loadingGroups } = usePhaseGroups(phaseId || undefined);
  const { teams, isLoading: loadingTeams } = useTeams(tournament?.id, { page: 1, limit: 100, ...(categoryId ? { categoryId } : {}) });
  const query = useAllMatches(tournament?.id, { ...(categoryId ? { categoryId } : {}), ...(phaseId ? { phaseId } : {}), ...(status ? { status: status as MatchStatus } : {}) });
  const updateMatch = useUpdateMatch(tournament?.id ?? "");

  const teamNames = useMemo(() => new Map(teams.map((team) => [team.id, team.name])), [teams]);
  const categoryNames = useMemo(() => new Map(categories.map((item) => [item.id, item.title])), [categories]);
  const phaseNames = useMemo(() => new Map(phases.map((item) => [item.id, item.name])), [phases]);
  const groupNames = useMemo(() => new Map(groups.map((item) => [item.id, item.name])), [groups]);
  const matches = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-MX");
    return query.matches.filter((match) => {
      const date = new Date(match.scheduledAt);
      if (fromDate && date < new Date(`${fromDate}T00:00:00`)) return false;
      if (toDate && date > new Date(`${toDate}T23:59:59.999`)) return false;
      if (groupId && match.phaseGroupId !== groupId) return false;
      if (!term) return true;
      return [match.homeTeam?.name, match.awayTeam?.name, teamNames.get(match.homeTeamId), teamNames.get(match.awayTeamId), match.venue, categoryNames.get(match.categoryId)]
        .filter(Boolean).join(" ").toLocaleLowerCase("es-MX").includes(term);
    });
  }, [query.matches, fromDate, toDate, groupId, search, teamNames, categoryNames]);

  function startEditing(match: Match) {
    setEditing(match); setEditDate(isoToDatetimeLocal(match.scheduledAt)); setEditVenue(match.venue ?? "");
    setEditStatus(match.status); setSaveError(""); setSaveSuccess("");
  }
  async function saveEditing() {
    if (!editing || !editDate) { setSaveError("Selecciona una fecha y hora válidas."); return; }
    setSaveError("");
    try {
      await updateMatch.mutateAsync({ id: editing.id, input: { scheduledAt: datetimeLocalToIso(editDate), venue: editVenue.trim() || null, status: editStatus } });
      setEditing(null); setSaveSuccess("Los cambios del partido se guardaron correctamente.");
    } catch (error) { setSaveError(getMatchErrorMessage(error)); }
  }

  if (loadingTournament) return <div className="h-72 animate-pulse rounded-xl bg-slate-200/70" />;
  if (!tournament) return <div><PageHeader title="Calendarios" description="Administra fechas, horarios y sedes de los partidos." /><Card className="p-8 text-center"><CalendarDays size={32} className="mx-auto text-slate-300" /><h2 className="mt-3 font-semibold text-slate-900">Primero crea tu torneo</h2><p className="mt-1 text-sm text-slate-500">Cuando tengas un torneo, aquí aparecerán sus partidos.</p></Card></div>;

  const loading = loadingCategories || query.isLoading || loadingTeams;
  const totalMatches = matches.length;
  const totalPages = Math.max(1, Math.ceil(totalMatches / PAGE_SIZE));
  const visibleMatches = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = Boolean(categoryId || phaseId || groupId || status || fromDate || toDate || search);
  const scheduledCount = matches.filter((match) => match.status === "scheduled" || match.status === "postponed").length;
  const finishedCount = matches.filter((match) => match.status === "finished").length;
  return <div>
    <PageHeader title="Calendarios" description={`Programa y consulta los partidos de ${tournament.name}.`} />
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card className="flex items-center gap-3 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><CalendarDays size={20} /></span><div><p className="text-xs font-medium text-slate-500">Partidos encontrados</p><p className="text-2xl font-bold text-slate-900">{totalMatches}</p></div></Card>
      <Card className="flex items-center gap-3 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Clock3 size={20} /></span><div><p className="text-xs font-medium text-slate-500">Por jugar</p><p className="text-2xl font-bold text-slate-900">{scheduledCount}</p></div></Card>
      <Card className="flex items-center gap-3 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Check size={20} /></span><div><p className="text-xs font-medium text-slate-500">Finalizados</p><p className="text-2xl font-bold text-slate-900">{finishedCount}</p></div></Card>
    </div>
    <Card className="mb-5 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2"><Search size={17} className="text-slate-400" /><h2 className="text-sm font-semibold text-slate-800">Filtrar partidos</h2></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium text-slate-600">Categoría<select className={inputClass} value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPhaseId(""); setGroupId(""); setPage(1); }}><option value="">Todas las categorías</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Fase<select className={inputClass} value={phaseId} disabled={!categoryId || loadingPhases} onChange={(e) => { setPhaseId(e.target.value); setGroupId(""); setPage(1); }}><option value="">Todas las fases</option>{phases.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Grupo<select className={inputClass} value={groupId} disabled={!phaseId || loadingGroups} onChange={(e) => { setGroupId(e.target.value); setPage(1); }}><option value="">Todos los grupos</option>{groups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Estado<select className={inputClass} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">Todos los estados</option>{Object.entries(MATCH_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Desde<input className={inputClass} type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} /></label>
        <label className="text-xs font-medium text-slate-600">Hasta<input className={inputClass} type="date" min={fromDate || undefined} value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} /></label>
        <label className="text-xs font-medium text-slate-600 sm:col-span-2">Buscar equipo o sede<input className={inputClass} placeholder="Ej. Tigres, Cancha principal…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label>
      </div>
      {hasFilters && <button type="button" onClick={() => { setCategoryId(""); setPhaseId(""); setGroupId(""); setStatus(""); setFromDate(""); setToDate(""); setSearch(""); setPage(1); }} className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700">Limpiar filtros</button>}
    </Card>
    {saveSuccess && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{saveSuccess}</div>}
    {query.isError && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">No se pudieron cargar los partidos. Intenta recargar la página.</div>}
    
    <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-slate-800">Partidos</h2><span className="text-xs text-slate-500">{totalMatches} partido{totalMatches === 1 ? "" : "s"} en total</span></div>
    {loading ? <div className="space-y-3">{[0, 1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-slate-200/70" />)}</div> : matches.length === 0 ? <Card className="px-6 py-12 text-center"><CalendarDays size={30} className="mx-auto text-slate-300" /><h3 className="mt-3 font-semibold text-slate-900">No hay partidos para mostrar</h3><p className="mt-1 text-sm text-slate-500">Prueba otros filtros o genera los partidos desde la sección de fases.</p></Card> : <div className="space-y-3">
      {visibleMatches.map((match) => {
        const home = match.homeTeam?.name ?? teamNames.get(match.homeTeamId) ?? "Equipo local";
        const away = match.awayTeam?.name ?? teamNames.get(match.awayTeamId) ?? "Equipo visitante";
        const categoryName = match.category?.title ?? categoryNames.get(match.categoryId) ?? "Categoría";
        const phaseName = match.phaseId ? phaseNames.get(match.phaseId) : undefined;
        const groupName = match.phaseGroupId ? groupNames.get(match.phaseGroupId) : undefined;
        return <Card key={match.id} className="overflow-hidden"><div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="w-full shrink-0 sm:w-36"><p className="text-sm font-semibold capitalize text-slate-800">{formatDate(match.scheduledAt)}</p><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><Clock3 size={14} />{formatTime(match.scheduledAt)}</p><p className="mt-2 text-xs text-slate-400">{categoryName}</p></div>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2">{phaseName && <span className="text-xs text-slate-500">{phaseName}</span>}{groupName && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{groupName}</span>}{match.round != null && <span className="text-xs text-slate-400">Jornada/Ronda {match.round}</span>}</div><div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3"><p className="truncate text-sm font-semibold text-slate-900">{home}</p><div className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold tabular-nums text-slate-800">{match.homeScore == null || match.awayScore == null ? "VS" : `${match.homeScore} - ${match.awayScore}`}</div><p className="truncate text-right text-sm font-semibold text-slate-900">{away}</p></div><div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><MapPin size={13} />{match.venue || "Sede por definir"}</span><span className={`rounded-full px-2 py-1 font-medium ${statusTone[match.status]}`}>{MATCH_STATUS_LABELS[match.status]}</span></div></div>
          <button type="button" onClick={() => startEditing(match)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"><Pencil size={15} />Editar</button>
        </div>
        {editing?.id === match.id && <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-slate-900">Editar programación</h3><p className="mt-0.5 text-xs text-slate-500">{home} vs {away}</p></div><button type="button" onClick={() => { setEditing(null); setSaveError(""); }} aria-label="Cerrar edición" className="rounded-lg p-2 text-slate-500 hover:bg-slate-200"><X size={17} /></button></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><label className="text-xs font-medium text-slate-600">Fecha y hora<input className={inputClass} type="datetime-local" value={editDate} onChange={(e) => setEditDate(e.target.value)} /></label><label className="text-xs font-medium text-slate-600">Sede<input className={inputClass} value={editVenue} onChange={(e) => setEditVenue(e.target.value)} placeholder="Nombre de la cancha" maxLength={180} /></label><label className="text-xs font-medium text-slate-600">Estado<select className={inputClass} value={editStatus} onChange={(e) => setEditStatus(e.target.value as MatchStatus)} disabled={match.status === "finished" || match.status === "in_progress"}><option value="scheduled">Programado</option><option value="postponed">Pospuesto</option><option value="cancelled">Cancelado</option>{match.status === "finished" && <option value="finished">Finalizado</option>}{match.status === "in_progress" && <option value="in_progress">En curso</option>}</select></label></div>{saveError && <p role="alert" className="mt-3 text-sm text-rose-700">{saveError}</p>}<div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200">Cancelar</button><button type="button" disabled={updateMatch.isPending} onClick={saveEditing} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{updateMatch.isPending ? "Guardando…" : <><Check size={15} />Guardar cambios</>}</button></div></div>}
        </Card>;
      })}
    </div>}
    {!loading && <Card className="mt-4 overflow-hidden">
      <Pagination
        page={page}
        limit={PAGE_SIZE}
        totalPages={totalPages}
        total={totalMatches}
        onPageChange={setPage}
        disabled={query.isFetching}
      />
    </Card>}
  </div>;
}
