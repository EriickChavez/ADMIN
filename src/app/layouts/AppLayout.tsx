import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import { CalendarDays, Layers, Menu, Plus, Settings } from "lucide-react";
import { useAuth } from "../../features/auth";
import { useCategories } from "../../features/categories";
import { useMyTournament } from "../../features/tournaments";
import { Sidebar, type SidebarSection } from "../../shared/components/Sidebar";

const APP_NAME = "Nova";

export function AppLayout() {
  const { user, logout } = useAuth();
  const { tournament, isLoading } = useMyTournament();
  const { categories, isLoading: loadingCategories } = useCategories(
    tournament?.id,
  );
  const [open, setOpen] = useState(false);
  const closeSidebar = useCallback(() => setOpen(false), []);

  const sections: SidebarSection[] = tournament
    ? [
        {
          title: "Torneo",
          items: [
            { to: "/tournament", label: "Tu torneo", icon: Settings },
            {
              to: "/categories",
              label: "Categorías",
              icon: Layers,
              children: loadingCategories
                ? []
                : categories.map((c) => ({
                    to: `/categories/${c.id}`,
                    label: c.title,
                  })),
            },
            { to: "/calendar", label: "Calendario", icon: CalendarDays },
          ],
        },
      ]
    : [
        {
          title: "Torneo",
          items: [{ to: "/tournament", label: "Crear torneo", icon: Plus }],
          hint: "Crea tu torneo para desbloquear categorías y calendario.",
        },
      ];

  return (
    <div className="min-h-dvh bg-white">
      <Sidebar
        appName={APP_NAME}
        sections={sections}
        loading={isLoading}
        user={user}
        onLogout={() => logout()}
        open={open}
        onClose={closeSidebar}
      />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex min-h-14 items-center gap-2 border-b border-slate-200 bg-white px-4 pt-[env(safe-area-inset-top)] lg:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-slate-900">{APP_NAME}</span>
        </header>

        <main className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
