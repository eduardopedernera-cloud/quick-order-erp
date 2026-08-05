import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { BottomNav } from "@/components/bottom-nav";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { fecha, money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/mis-pedidos")({
  head: () => ({
    meta: [
      { title: "Mis pedidos · Mayorista" },
      { name: "description", content: "Historial de pedidos cargados y su estado." },
      { property: "og:title", content: "Mis pedidos · Mayorista" },
      { property: "og:description", content: "Seguimiento de pedidos de la distribuidora." },
    ],
  }),
  component: MisPedidos,
});

const tono: Record<string, string> = {
  pendiente: "bg-warning/15 text-warning-foreground",
  preparacion: "bg-accent text-accent-foreground",
  entregado: "bg-success/15 text-success",
  cancelado: "bg-destructive/10 text-destructive",
  borrador: "bg-muted text-muted-foreground",
};

function MisPedidos() {
  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["mis-pedidos"],
    queryFn: async () =>
      (
        await supabase
          .from("pedidos")
          .select("id, numero, estado, total, created_at, clientes(nombre), pedido_items(id)")
          .order("created_at", { ascending: false })
          .limit(50)
      ).data ?? [],
  });

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="border-b border-border px-4 pb-4 pt-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-xl font-extrabold tracking-tight">Pedidos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Últimos pedidos cargados.</p>
        </div>
      </header>

      <section className="mx-auto max-w-3xl space-y-2 px-4 py-4">
        {isLoading && <p className="py-12 text-center text-sm text-muted-foreground">Cargando…</p>}
        {!isLoading && !pedidos.length && (
          <p className="py-16 text-center text-sm text-muted-foreground">Todavía no hay pedidos.</p>
        )}
        {pedidos.map((p) => (
          <article
            key={p.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                #{p.numero} · {p.clientes?.nombre ?? "Cliente"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {fecha(p.created_at)} · {p.pedido_items?.length ?? 0} ítems
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-base font-extrabold">{money(p.total)}</p>
              <Badge className={`mt-1 border-0 ${tono[p.estado] ?? "bg-muted"}`}>{p.estado}</Badge>
            </div>
          </article>
        ))}
      </section>

      <BottomNav />
    </main>
  );
}
