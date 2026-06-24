import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./navItems";

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <img src="/favicon.svg" alt="Milo" className="size-9 rounded-xl" />
        <span className="text-lg font-bold tracking-tight text-text">Milo</span>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-surface-2 text-text"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text",
              )
            }
          >
            <item.icon className="size-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
