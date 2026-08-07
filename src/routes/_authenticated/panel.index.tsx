import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { TriangleAlert as AlertTriangle, Boxes, CircleAlert, Eye, MoveHorizontal as MoreHorizontal, Package, Pencil, Search, ShoppingBag, Trash2, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { fecha, money, num } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/panel/")({
  head: () => ({
    meta: [
      { title: "Resumen · Panel Mayorista" },
      { name: "description", content: "Ventas, pedidos pendientes, deuda y stock crítico." },
      { property: "og:title", content: "Resumen · Panel Mayorista" },
      { property: "og:description", content: "Indicadores clave de la distribuidora." },
    ],
  }),
  component: Resumen,
});

const estados = ["pendiente", "preparacion", "entregado", "cancelado"] as const;
type Estado = (typeof estados)[number];

const estadoVariant: Record<Estado, "default" | "secondary" | "destructive" | "outline"> = {
  pendiente: "outline",
  preparacion: "default",
  entregado: "secondary",
  cancelado: "destructive",
};

function Resumen() {
  const qc = useQueryClient();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Estado | "todos">("todos");

  const { data } = useQuery({
    queryKey: ["panel-resumen"],
    queryFn: async () => {
      const [pedidos, clientes, productos] = await Promise.all([
        supabase
          .from("pedidos")
          .select("id, numero, total, estado, created_at, clientes(nombre)")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("clientes").select("id, nombre, saldo, limite_credito"),
        supabase.from("productos").select("id, nombre, stock, stock_minimo").eq("activo", true),
      ]);
      return {
        pedidos: pedidos.data ?? [],
        clientes: clientes.data ?? [],
        productos: productos.data ?? [],
      };
    },
  });

  const cambiar = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: Estado }) => {
      const { error } = await supabase.from("pedidos").update({ estado }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["panel-resumen"] });
      qc.invalidateQueries({ queryKey: ["panel-pedidos"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const pedidos = data?.pedidos ?? [];
  const clientes = data?.clientes ?? [];
  const productos = data?.productos ?? [];

  const hoy = new Date().toDateString();
  const ventasHoy = pedidos
    .filter((p) => new Date(p.created_at).toDateString() === hoy && p.estado !== "cancelado")
    .reduce((a, p) => a + Number(p.total), 0);
  const pendientes = pedidos.filter((p) => p.estado === "pendiente").length;
  const deuda = clientes.reduce((a, c) => a + Math.max(Number(c.saldo), 0), 0);
  const criticos = productos.filter((p) => Number(p.stock) <= Number(p.stock_minimo));
  const excedidos = clientes.filter(
    (c) => Number(c.limite_credito) > 0 && Number(c.saldo) > Number(c.limite_credito),
  );

  const pedidosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return pedidos.filter((p) => {
      if (filtro !== "todos" && p.estado !== filtro) return false;
      if (!q) return true;
      const cliente = (p.clientes?.nombre ?? "").toLowerCase();
      const numero = String(p.numero ?? "").toLowerCase();
      return cliente.includes(q) || numero.includes(q);
    });
  }, [pedidos, busqueda, filtro]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
      <h1 className="text-2xl font-extrabold tracking-tight">Resumen</h1>
      <p className="mt-1 text-sm text-muted-foreground">Cómo viene el día en la distribuidora.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi icon={ShoppingBag} label="Ventas de hoy" valor={money(ventasHoy)} />
        <Kpi icon={Boxes} label="Pedidos pendientes" valor={num(pendientes)} />
        <Kpi icon={Wallet} label="Deuda en calle" valor={money(deuda)} />
        <Kpi icon={AlertTriangle} label="Stock crítico" valor={num(criticos.length)} />
        <Kpi icon={CircleAlert} label="Cuentas excedidas" valor={num(excedidos.length)} />
        <Kpi
          icon={Wallet}
          label="Deuda excedida"
          valor={money(excedidos.reduce((a, c) => a + Number(c.saldo), 0))}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { to: "/pedidos", label: "Tomar pedido" } as const,
          { to: "/panel/compras", label: "Nueva compra" } as const,
          { to: "/panel/cuentas", label: "Registrar cobro" } as const,
          { to: "/panel/productos", label: "Productos" } as const,
        ].map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold shadow-soft transition-colors hover:bg-accent"
          >
            {a.label}
          </Link>
        ))}
      </div>

      {/* Interactive orders table */}
      <section className="mt-8 rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold">Pedidos</h2>
            <p className="text-xs text-muted-foreground">Buscá y filtrá por estado.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Buscar # o cliente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:w-56"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto">
              {(["todos", ...estados] as const).map((e) => (
                <button
                  key={e}
                  onClick={() => setFiltro(e)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                    filtro === e
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-accent",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="w-32">Fecha</TableHead>
                <TableHead className="w-28">Estado</TableHead>
                <TableHead className="w-32 text-right">Total</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidosFiltrados.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-semibold">#{p.numero}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {p.clientes?.nombre ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{fecha(p.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant={estadoVariant[p.estado as Estado]} className="capitalize">
                      {p.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">{money(p.total)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => toast.info(`Pedido #${p.numero}`)}>
                          <Eye className="h-4 w-4" /> Ver detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => toast.info(`Editar #${p.numero}`)}>
                          <Pencil className="h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs">Cambiar estado</DropdownMenuLabel>
                        {estados.map((e) => (
                          <DropdownMenuItem
                            key={e}
                            disabled={p.estado === e}
                            onSelect={() => cambiar.mutate({ id: p.id, estado: e })}
                            className="capitalize"
                          >
                            <Package className="h-4 w-4" /> {e}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => toast.warning("Función no disponible en el demo")}
                        >
                          <Trash2 className="h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!pedidosFiltrados.length && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No hay pedidos que coincidan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card list */}
        <ul className="divide-y divide-border md:hidden">
          {pedidosFiltrados.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  #{p.numero} · {p.clientes?.nombre ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">{fecha(p.created_at)}</p>
                <Badge variant={estadoVariant[p.estado as Estado]} className="mt-1.5 capitalize">
                  {p.estado}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{money(p.total)}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => toast.info(`Pedido #${p.numero}`)}>
                      <Eye className="h-4 w-4" /> Ver detalle
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs">Cambiar estado</DropdownMenuLabel>
                    {estados.map((e) => (
                      <DropdownMenuItem
                        key={e}
                        disabled={p.estado === e}
                        onSelect={() => cambiar.mutate({ id: p.id, estado: e })}
                        className="capitalize"
                      >
                        <Package className="h-4 w-4" /> {e}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
          {!pedidosFiltrados.length && (
            <li className="py-10 text-center text-sm text-muted-foreground">
              No hay pedidos que coincidan.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  valor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-2xl font-extrabold">{valor}</p>
    </div>
  );
}
