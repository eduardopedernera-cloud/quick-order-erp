import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, ShoppingCart, ClipboardList, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { to: "/pedidos", label: "Catálogo", icon: ShoppingCart },
  { to: "/mis-pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/panel", label: "Panel", icon: LayoutGrid },
  { to: "/panel/clientes", label: "Clientes", icon: Users },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {items.map(({ to, label, icon: Icon }) => {
          const activo = pathname === to || (to !== "/panel" && pathname.startsWith(to));
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  activo ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={activo ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
