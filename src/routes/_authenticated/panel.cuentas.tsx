import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { fecha, money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/panel/cuentas")({
  head: () => ({
    meta: [
      { title: "Cuentas corrientes · Panel Mayorista" },
      { name: "description", content: "Saldos, cobros y movimientos de cuenta corriente." },
      { property: "og:title", content: "Cuentas corrientes · Panel Mayorista" },
      { property: "og:description", content: "Registrá pagos y seguí la deuda de cada cliente." },
    ],
  }),
  component: CuentasPage,
});

function CuentasPage() {
  const qc = useQueryClient();
  const [clienteId, setClienteId] = useState<string>("");

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => (await supabase.from("clientes").select("*").order("nombre")).data ?? [],
  });

  const { data: movimientos = [] } = useQuery({
    queryKey: ["movimientos", clienteId],
    enabled: !!clienteId,
    queryFn: async () =>
      (
        await supabase
          .from("movimientos_cc")
          .select("*")
          .eq("cliente_id", clienteId)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const registrar = useMutation({
    mutationFn: async ({
      tipo,
      monto,
      concepto,
    }: {
      tipo: "debe" | "haber";
      monto: number;
      concepto: string;
    }) => {
      const { error } = await supabase.from("movimientos_cc").insert({
        cliente_id: clienteId,
        tipo,
        monto,
        concepto: concepto || (tipo === "haber" ? "Pago recibido" : "Cargo manual"),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Movimiento registrado");
      qc.invalidateQueries({ queryKey: ["movimientos", clienteId] });
      qc.invalidateQueries({ queryKey: ["clientes"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const cliente = clientes.find((c) => c.id === clienteId);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
      <h1 className="text-2xl font-extrabold tracking-tight">Cuentas corrientes</h1>

      <div className="mt-4 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <ul className="space-y-2">
          {clientes.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setClienteId(c.id)}
                className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-3.5 text-left ${
                  clienteId === c.id ? "border-primary bg-accent" : "border-border bg-card"
                }`}
              >
                <span className="truncate text-sm font-semibold">{c.nombre}</span>
                <span
                  className={`shrink-0 text-sm font-extrabold ${Number(c.saldo) > 0 ? "text-destructive" : "text-success"}`}
                >
                  {money(c.saldo)}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          {!cliente && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Elegí un cliente para ver sus movimientos.
            </p>
          )}
          {cliente && (
            <>
              <h2 className="truncate text-base font-bold">{cliente.nombre}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Saldo actual <span className="font-bold text-foreground">{money(cliente.saldo)}</span>
              </p>

              <form
                className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  registrar.mutate({
                    tipo: fd.get("tipo") === "debe" ? "debe" : "haber",
                    monto: Number(fd.get("monto")),
                    concepto: String(fd.get("concepto") ?? ""),
                  });
                  e.currentTarget.reset();
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="tipo">Tipo</Label>
                  <select
                    id="tipo"
                    name="tipo"
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    <option value="haber">Pago / cobranza</option>
                    <option value="debe">Cargo manual</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="monto">Monto</Label>
                  <Input id="monto" name="monto" type="number" step="any" required />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="concepto">Concepto</Label>
                  <Input id="concepto" name="concepto" placeholder="Efectivo, transferencia…" />
                </div>
                <Button type="submit" className="self-end rounded-full" disabled={registrar.isPending}>
                  Registrar
                </Button>
              </form>

              <ul className="mt-5 divide-y divide-border border-t border-border">
                {movimientos.map((m) => (
                  <li key={m.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold capitalize">
                        {m.tipo === "haber" ? "Pago" : "Cargo"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {fecha(m.created_at)} {m.concepto ? `· ${m.concepto}` : ""}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-bold ${m.tipo === "haber" ? "text-success" : "text-destructive"}`}
                    >
                      {m.tipo === "haber" ? "−" : "+"}
                      {money(m.monto)}
                    </span>
                  </li>
                ))}
                {!movimientos.length && (
                  <li className="py-8 text-center text-sm text-muted-foreground">Sin movimientos.</li>
                )}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
