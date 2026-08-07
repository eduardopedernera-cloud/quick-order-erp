import { Link, Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChartBar as BarChart3, Boxes, ChevronLeft, LogOut, Menu, Moon, Search, Settings, ShoppingBag, Sun, Truck, Users, Wallet, Warehouse } from "lucide-react";

import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { usePerfil } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/panel")({
  component: PanelLayout,
});

const nav = [
  { to: "/panel", label: "Dashboard", icon: BarChart3, exact: true },
  { to: "/panel/productos", label: "Productos", icon: Boxes, exact: false },
  { to: "/panel/pedidos", label: "Pedidos", icon: ShoppingBag, exact: false },
  { to: "/panel/clientes", label: "Clientes", icon: Users, exact: false },
  { to: "/panel/cuentas", label: "Cuentas", icon: Wallet, exact: false },
  { to: "/panel/proveedores", label: "Proveedores", icon: Truck, exact: false },
  { to: "/panel/compras", label: "Compras", icon: Warehouse, exact: false },
] as const;

function PanelLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: perfil } = usePerfil();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  async function salir() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebarWidth = collapsed ? "w-[72px]" : "w-64";

  return (
    <div className="min-h-screen bg-background pb-20 md:flex md:pb-0">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "relative hidden shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-300 md:block",
          sidebarWidth,
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          {collapsed ? (
            <span className="text-lg font-extrabold tracking-tight text-primary">m.</span>
          ) : (
            <span className="text-lg font-extrabold tracking-tight">
              mayorista<span className="text-primary">.</span>
            </span>
          )}
        </div>

        <nav className="mt-4 space-y-1 px-3">
          {nav.map(({ to, label, icon: Icon, exact }) => {
            const activo = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-0",
                  activo
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60",
                )}
                title={collapsed ? label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 px-3">
          <Link
            to="/panel/cuentas"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60",
              collapsed && "justify-center px-0",
            )}
            title={collapsed ? "Configuración" : undefined}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Configuración</span>}
          </Link>
        </div>

        <div className="mt-8 border-t border-sidebar-border p-4">
          {!collapsed && (
            <>
              <p className="truncate text-sm font-semibold">{perfil?.perfil?.nombre ?? "Usuario"}</p>
              <p className="text-xs text-muted-foreground">{perfil?.roles?.join(", ") || "sin rol"}</p>
            </>
          )}
          <button
            onClick={salir}
            className={cn(
              "mt-3 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-destructive",
              collapsed && "justify-center",
            )}
            title={collapsed ? "Salir" : undefined}
          >
            <LogOut className="h-4 w-4" /> {!collapsed && "Salir"}
          </button>
        </div>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute bottom-4 left-4 hidden h-8 w-8 items-center justify-center rounded-lg border border-sidebar-border text-muted-foreground transition-colors hover:bg-sidebar-accent md:flex"
          title={collapsed ? "Expandir" : "Contraer"}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>

      {/* Mobile sidebar (sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
          <div className="flex h-16 items-center border-b border-sidebar-border px-5">
            <span className="text-lg font-extrabold tracking-tight">
              mayorista<span className="text-primary">.</span>
            </span>
          </div>
          <nav className="mt-4 space-y-1 px-3" onClick={() => setMobileOpen(false)}>
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
          <div className="mt-6 px-3">
            <Link
              to="/panel/cuentas"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60"
              onClick={() => setMobileOpen(false)}
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span>Configuración</span>
            </Link>
          </div>
          <div className="mt-8 border-t border-sidebar-border p-4">
            <p className="truncate text-sm font-semibold">{perfil?.perfil?.nombre ?? "Usuario"}</p>
            <p className="text-xs text-muted-foreground">{perfil?.roles?.join(", ") || "sin rol"}</p>
            <button
              onClick={salir}
              className="mt-3 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-destructive"
            >
              <LogOut className="h-4 w-4" /> Salir
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar pedidos, clientes, productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} title="Cambiar tema">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Mobile horizontal nav pills */}
        <div className="flex gap-2 overflow-x-auto border-b border-border px-4 py-2.5 md:hidden">
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
