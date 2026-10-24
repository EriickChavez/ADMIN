import { Link } from "react-router-dom";
import {
  Activity,
  CalendarDays,
  Check,
  Clock,
  Globe,
  Layers,
  Plus,
  Settings,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../auth";
import { useCategories, type Category } from "../categories";
import { useMyTournament, type Tournament } from "../tournaments";
import { ButtonLink } from "../../shared/components/ui/Button";
import { Card } from "../../shared/components/ui/Card";
import { EmptyState } from "../../shared/components/ui/EmptyState";
import { PageHeader } from "../../shared/components/ui/PageHeader";

const parseDate = (date: string) => new Date(`${date}T00:00:00`);

const formatDate = (date: string | null) =>
  date
    ? parseDate(date).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Sin definir";

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const getDurationDays = (t: Tournament): number | null => {
  if (!t.startDate || !t.endDate) return null;
  const ms = parseDate(t.endDate).getTime() - parseDate(t.startDate).getTime();
  return Math.round(ms / 86_400_000) + 1;
};

const getStatus = (t: Tournament) => {
  if (!t.startDate || !t.endDate) {
    return { label: "Sin fechas", className: "bg-slate-100 text-slate-600" };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (today < parseDate(t.startDate)) {
    return { label: "Próximo", className: "bg-blue-50 text-blue-700" };
  }
  if (today > parseDate(t.endDate)) {
    return { label: "Finalizado", className: "bg-slate-100 text-slate-600" };
  }
  return { label: "En curso", className: "bg-emerald-50 text-emerald-700" };
};

const ageRange = ({ minAge, maxAge }: Category) => {
  if (minAge != null && maxAge != null) return `${minAge}–${maxAge} años`;
  if (maxAge != null) return `Hasta ${maxAge} años`;
  if (minAge != null) return `Desde ${minAge} años`;
  return "Sin rango de edad";
};

function StatCard({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex min-w-0 items-center gap-4 p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <div className="mt-0.5 text-xl font-bold text-slate-900">
          {children}
        </div>
      </div>
    </Card>
  );
}

interface Step {
  title: string;
  description: string;
  done: boolean;
  to: string;
}

function Checklist({ steps }: { steps: Step[] }) {
  const doneCount = steps.filter((s) => s.done).length;
  const currentIndex = steps.findIndex((s) => !s.done);
  const percent = Math.round((doneCount / steps.length) * 100);

  return (
    <Card className="min-w-0 p-6">
      <h2 className="text-sm font-semibold text-slate-900">Primeros pasos</h2>
      <p className="mt-1 text-xs text-slate-500">
        {doneCount} de {steps.length} completados
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ol className="mt-5 space-y-4">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                step.done
                  ? "bg-emerald-100 text-emerald-600"
                  : i === currentIndex
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {step.done ? <Check size={14} /> : i + 1}
            </span>
            <div className="min-w-0">
              <p
                className={`text-sm font-medium ${
                  step.done ? "text-slate-400 line-through" : "text-slate-900"
                }`}
              >
                {step.title}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {step.description}
              </p>
              {i === currentIndex && (
                <Link
                  to={step.to}
                  className="mt-1.5 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Continuar →
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-64 max-w-full animate-pulse rounded-lg bg-slate-200/70" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-slate-200/70"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-slate-200/70" />
    </div>
  );
}

export function HomePage() {
  const { user } = useAuth();
  const { tournament, isLoading } = useMyTournament();
  const { categories, isLoading: loadingCategories } = useCategories(
    tournament?.id,
  );

  if (isLoading) return <HomeSkeleton />;

  const firstName = user?.displayName.split(" ")[0] ?? "";
  const status = tournament ? getStatus(tournament) : null;
  const duration = tournament ? getDurationDays(tournament) : null;

  const steps: Step[] = [
    {
      title: "Crea tu torneo",
      description: "Define nombre, fechas y zona horaria.",
      done: !!tournament,
      to: "/tournament",
    },
    {
      title: "Crea tus categorías",
      description: "Por ejemplo Sub-14 o Sub-18.",
      done: categories.length > 0,
      to: "/categories/new",
    },
    {
      title: "Programa el calendario",
      description: "Agenda los partidos de cada categoría.",
      done: false,
      to: "/calendar",
    },
  ];

  return (
    <div className="min-w-0">
      <PageHeader
        title={`Hola, ${firstName}`}
        description={
          tournament
            ? "Este es el resumen de tu torneo."
            : "Empieza creando tu torneo."
        }
      />

      {tournament && status && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Layers} label="Categorías">
            {loadingCategories ? "—" : categories.length}
          </StatCard>
          <StatCard icon={Clock} label="Duración">
            {duration ? `${duration} ${duration === 1 ? "día" : "días"}` : "—"}
          </StatCard>
          <StatCard icon={Activity} label="Estado">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-sm font-semibold ${status.className}`}
            >
              {status.label}
            </span>
          </StatCard>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {tournament ? (
            <>
              <Card>
                <div className="flex items-start gap-4 p-6">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
                    {getInitials(tournament.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold text-slate-900">
                      {tournament.name}
                    </h2>
                    {tournament.subtitle && (
                      <p className="truncate text-sm text-slate-500">
                        {tournament.subtitle}
                      </p>
                    )}
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {tournament.slug}
                    </p>
                  </div>
                  <ButtonLink
                    to="/tournament"
                    variant="secondary"
                    className="shrink-0"
                  >
                    <Settings size={16} />
                    Editar
                  </ButtonLink>
                </div>

                {tournament.description && (
                  <p className="px-6 pb-5 text-sm leading-relaxed text-slate-600">
                    {tournament.description}
                  </p>
                )}

                <dl className="grid grid-cols-1 gap-5 border-t border-slate-100 p-6 sm:grid-cols-3">
                  <div className="min-w-0">
                    <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <CalendarDays size={14} /> Inicio
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">
                      {formatDate(tournament.startDate)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <CalendarDays size={14} /> Fin
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">
                      {formatDate(tournament.endDate)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Globe size={14} /> Zona horaria
                    </dt>
                    <dd className="mt-1 truncate text-sm font-semibold text-slate-900">
                      {tournament.timezone}
                    </dd>
                  </div>
                </dl>
              </Card>

              <Card>
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Categorías
                  </h2>
                  {categories.length > 0 && (
                    <Link
                      to="/categories/new"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Nueva categoría
                    </Link>
                  )}
                </div>

                {loadingCategories ? (
                  <div className="space-y-2 p-6">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-10 animate-pulse rounded-lg bg-slate-100"
                      />
                    ))}
                  </div>
                ) : categories.length === 0 ? (
                  <EmptyState
                    icon={Layers}
                    title="Aún no tienes categorías"
                    description="Crea la primera para organizar equipos y partidos."
                    action={
                      <ButtonLink to="/categories/new">
                        <Plus size={16} />
                        Crear categoría
                      </ButtonLink>
                    }
                  />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {categories.map((c) => (
                      <li key={c.id}>
                        <Link
                          to={`/categories/${c.id}`}
                          className="flex items-center justify-between gap-3 px-6 py-3 transition-colors hover:bg-slate-50"
                        >
                          <span className="truncate text-sm font-medium text-slate-900">
                            {c.title}
                          </span>
                          <span className="shrink-0 text-xs text-slate-500">
                            {ageRange(c)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </>
          ) : (
            <Card>
              <EmptyState
                icon={Trophy}
                title="Aún no tienes un torneo"
                description="Créalo en un minuto: solo necesitas un nombre. Después podrás agregar categorías, equipos y partidos."
                action={
                  <ButtonLink to="/tournament">
                    <Plus size={16} />
                    Crear torneo
                  </ButtonLink>
                }
              />
            </Card>
          )}
        </div>

        <Checklist steps={steps} />
      </div>
    </div>
  );
}
