import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Home, Menu, Trophy } from "lucide-react";
import { useAuth } from "../../features/auth";
import { Sidebar, type SidebarItem } from "../../shared/components/Sidebar";

const items: SidebarItem[] = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/tournaments", label: "Torneos", icon: Trophy },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        items={items}
        user={user}
        onLogout={() => logout()}
        open={open}
        onClose={() => setOpen(false)}
      />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-slate-200 bg-white px-4 lg:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-indigo-600">Mi App</span>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
