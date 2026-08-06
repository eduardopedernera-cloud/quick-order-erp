import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Boxes, CircleAlert, ShoppingBag, Wallet } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { fecha, money, num } from "@/lib/format";

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

function Resumen() {
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

  const pedidos = data?.pedidos ?? [];
  const hoy = new Date().toDateString();
  const ventasHoy = pedidos
    .filter((p) => new Date(p.created_at).toDateString() === hoy && p.estado !== "cancelado")
    .reduce((a, p) => a + Number(p.total), 0);
  const pendientes = pedidos.filter((p) => p.estado === "pendiente").length;
  const deuda = (data?.clientes ?? []).reduce((a, c) => a + Math.max(Number(c.saldo), 0), 0);
  const criticos = (data?.productos ?? []).filter((p) => Number(p.stock) <= Number(p.stock_minimo));
  const excedidos = (data?.clientes ?? []).filter(
    (c) => Number(c.limite_credito) > 0 && Number(c.saldo) > Number(c.limite_credito),
  );

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


      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-base font-bold">Últimos pedidos</h2>
          <ul className="mt-3 divide-y divide-border">
            {pedidos.slice(0, 8).map((p) => (
              <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    #{p.numero} · {p.clientes?.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">{fecha(p.created_at)}</p>
                </div>
                <span className="shrink-0 text-sm font-bold">{money(p.total)}</span>
              </li>
            ))}
            {!pedidos.length && <li className="py-6 text-sm text-muted-foreground">Sin pedidos aún.</li>}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-base font-bold">Reponer stock</h2>
          <ul className="mt-3 divide-y divide-border">
            {criticos.slice(0, 8).map((p) => (
              <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2.5">
                <p className="truncate text-sm font-semibold">{p.nombre}</p>
                <span className="shrink-0 text-sm font-bold text-destructive">
                  {num(p.stock)} / {num(p.stock_minimo)}
                </span>
              </li>
            ))}
            {!criticos.length && (
              <li className="py-6 text-sm text-muted-foreground">Todo el stock está en nivel.</li>
            )}
          </ul>
        </section>
      </div>
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
