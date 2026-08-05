import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fecha, money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/panel/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos · Panel Mayorista" },
      { name: "description", content: "Seguimiento y cambio de estado de los pedidos." },
      { property: "og:title", content: "Pedidos · Panel Mayorista" },
      { property: "og:description", content: "Preparación y entrega de pedidos mayoristas." },
    ],
  }),
  component: PedidosPanel,
});

const estados = ["pendiente", "preparacion", "entregado", "cancelado"] as const;

function PedidosPanel() {
  const qc = useQueryClient();
  const [filtro, setFiltro] = useState<string>("todos");

  const { data: pedidos = [] } = useQuery({
    queryKey: ["panel-pedidos"],
    queryFn: async () =>
      (
        await supabase
          .from("pedidos")
          .select("*, clientes(nombre), pedido_items(id, cantidad, precio_unitario, productos(nombre))")
          .order("created_at", { ascending: false })
          .limit(100)
      ).data ?? [],
  });

  const cambiar = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: (typeof estados)[number] }) => {
      const { error } = await supabase.from("pedidos").update({ estado }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["panel-pedidos"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const lista = filtro === "todos" ? pedidos : pedidos.filter((p) => p.estado === filtro);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
      <h1 className="text-2xl font-extrabold tracking-tight">Pedidos</h1>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {["todos", ...estados].map((e) => (
          <button
            key={e}
            onClick={() => setFiltro(e)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium capitalize ${
              filtro === e
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {lista.map((p) => (
          <li key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  #{p.numero} · {p.clientes?.nombre}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{fecha(p.created_at)}</p>
              </div>
              <p className="shrink-0 text-base font-extrabold">{money(p.total)}</p>
            </div>

            <ul className="mt-3 space-y-1 border-t border-border pt-3">
              {p.pedido_items?.map((i) => (
                <li key={i.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-xs">
                  <span className="truncate text-muted-foreground">
                    {i.cantidad} × {i.productos?.nombre}
                  </span>
                  <span className="shrink-0 font-semibold">
                    {money(Number(i.cantidad) * Number(i.precio_unitario))}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap gap-2">
              {estados.map((e) => (
                <Button
                  key={e}
                  size="sm"
                  variant={p.estado === e ? "default" : "outline"}
                  className="rounded-full capitalize"
                  onClick={() => cambiar.mutate({ id: p.id, estado: e })}
                >
                  {e}
                </Button>
              ))}
            </div>
          </li>
        ))}
        {!lista.length && (
          <li className="py-16 text-center text-sm text-muted-foreground">Sin pedidos.</li>
        )}
      </ul>
    </div>
  );
}
