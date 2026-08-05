import { Link, Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, Boxes, LogOut, ShoppingBag, Users, Wallet } from "lucide-react";

import { BottomNav } from "@/components/bottom-nav";
import { usePerfil } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/panel")({
  component: PanelLayout,
});

const nav = [
  { to: "/panel", label: "Resumen", icon: BarChart3, exact: true },
  { to: "/panel/clientes", label: "Clientes", icon: Users },
  { to: "/panel/productos", label: "Productos", icon: Boxes },
  { to: "/panel/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/panel/cuentas", label: "Cuentas corrientes", icon: Wallet },
] as const;

function PanelLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: perfil } = usePerfil();

  async function salir() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:flex md:pb-0">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar p-5 md:block">
        <span className="text-lg font-extrabold tracking-tight">
          mayorista<span className="text-primary">.</span>
        </span>
        <nav className="mt-8 space-y-1">
          {nav.map(({ to, label, icon: Icon, exact }) => {
            const activo = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  activo
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 border-t border-sidebar-border pt-4">
          <p className="truncate text-sm font-semibold">{perfil?.perfil?.nombre ?? "Usuario"}</p>
          <p className="text-xs text-muted-foreground">{perfil?.roles?.join(", ") || "sin rol"}</p>
          <button
            onClick={salir}
            className="mt-3 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Salir
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex gap-2 overflow-x-auto border-b border-border px-4 py-3 md:hidden">
          {nav.map(({ to, label, exact }) => {
            const activo = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium",
                  activo
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>
        <Outlet />
      </div>

      <BottomNav />
    </div>
  );
}
