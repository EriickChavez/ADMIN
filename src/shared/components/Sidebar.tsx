import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ChevronDown, LifeBuoy, LogOut, X, type LucideIcon } from "lucide-react";

export interface SidebarChild {
  to: string;
  label: string;
  icon?: LucideIcon;
}

export interface SidebarItem {
  to: string;
  label: string;
  icon: LucideIcon;
  children?: SidebarChild[];
}

export interface SidebarSection {
  title?: string;
  items: SidebarItem[];
  hint?: string;
}

interface SidebarUser {
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

interface SidebarProps {
  appName: string;
  sections: SidebarSection[];
  loading?: boolean;
  user: SidebarUser | null;
  onLogout: () => void;
  open: boolean;
  onClose: () => void;
}

const parentClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
      : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
  }`;

const childClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
    isActive
      ? "bg-white font-medium text-slate-900 shadow-sm ring-1 ring-slate-200"
      : "text-slate-500 hover:bg-slate-200/60 hover:text-slate-900"
  }`;

function NavItem({ item, onNavigate }: { item: SidebarItem; onNavigate: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const Icon = item.icon;
  const hasChildren = !!item.children?.length;

  return (
    <div>
      <div className="flex items-center gap-1">
        <NavLink
          to={item.to}
          end={hasChildren || item.to === "/"}
          onClick={onNavigate}
          className={parentClass}
        >
          <Icon size={18} className="shrink-0 text-slate-500" />
          <span className="truncate">{item.label}</span>
        </NavLink>

        {hasChildren && (
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? "Contraer" : "Expandir"}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700"
          >
            <ChevronDown
              size={16}
              className={`transition-transform ${expanded ? "" : "-rotate-90"}`}
            />
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="ml-[21px] mt-1 space-y-0.5 border-l border-slate-200 pl-3">
          {item.children!.map(({ to, label, icon: ChildIcon }) => (
            <NavLink key={to} to={to} onClick={onNavigate} className={childClass}>
              {ChildIcon && <ChildIcon size={14} className="shrink-0" />}
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  appName,
  sections,
  loading,
  user,
  onLogout,
  open,
  onClose,
}: SidebarProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onBreakpoint = (e: MediaQueryListEvent) => {
      if (e.matches) onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpoint);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-slate-50 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4">
          <Link to="/" onClick={onClose} className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <LifeBuoy size={20} />
            </span>
            <span className="text-base font-bold text-slate-900">{appName}</span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-200/60 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto p-3">
          {loading ? (
            <div className="space-y-2 pt-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-200/70" />
              ))}
            </div>
          ) : (
            sections.map((section, i) => (
              <div key={section.title ?? i}>
                {section.title && (
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {section.title}
                  </p>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavItem key={item.to} item={item} onNavigate={onClose} />
                  ))}
                </div>
                {section.hint && (
                  <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs leading-relaxed text-blue-700">
                    {section.hint}
                  </p>
                )}
              </div>
            ))
          )}
        </nav>

        {user && (
          <div className="flex shrink-0 items-center gap-3 border-t border-slate-200 p-3">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{user.displayName}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-900"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
