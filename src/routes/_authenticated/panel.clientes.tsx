import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/panel/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes · Panel Mayorista" },
      { name: "description", content: "Alta y gestión de clientes de la distribuidora." },
      { property: "og:title", content: "Clientes · Panel Mayorista" },
      { property: "og:description", content: "Datos, límite de crédito y saldo de cada cliente." },
    ],
  }),
  component: ClientesPage,
});

const campos = [
  { name: "nombre", label: "Nombre comercial", required: true },
  { name: "razon_social", label: "Razón social" },
  { name: "cuit", label: "CUIT" },
  { name: "telefono", label: "Teléfono" },
  { name: "email", label: "Email" },
  { name: "direccion", label: "Dirección" },
  { name: "localidad", label: "Localidad" },
  { name: "limite_credito", label: "Límite de crédito", type: "number" },
] as const;

function ClientesPage() {
  const qc = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () =>
      (await supabase.from("clientes").select("*").order("nombre")).data ?? [],
  });

  const crear = useMutation({
    mutationFn: async (form: Record<string, string>) => {
      const { error } = await supabase.from("clientes").insert({
        nombre: form.nombre,
        razon_social: form.razon_social || null,
        cuit: form.cuit || null,
        telefono: form.telefono || null,
        email: form.email || null,
        direccion: form.direccion || null,
        localidad: form.localidad || null,
        limite_credito: Number(form.limite_credito || 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente creado");
      setAbierto(false);
      qc.invalidateQueries({ queryKey: ["clientes"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo crear"),
  });

  const filtrados = clientes.filter((c) =>
    `${c.nombre} ${c.razon_social ?? ""} ${c.localidad ?? ""}`
      .toLowerCase()
      .includes(busqueda.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h1 className="truncate text-2xl font-extrabold tracking-tight">Clientes</h1>
        <Dialog open={abierto} onOpenChange={setAbierto}>
          <DialogTrigger asChild>
            <Button className="shrink-0 rounded-full">
              <Plus className="mr-1 h-4 w-4" /> Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo cliente</DialogTitle>
            </DialogHeader>
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                crear.mutate(Object.fromEntries(fd) as Record<string, string>);
              }}
            >
              {campos.map((c) => (
                <div key={c.name} className="space-y-1.5">
                  <Label htmlFor={c.name}>{c.label}</Label>
                  <Input
                    id={c.name}
                    name={c.name}
                    type={"type" in c ? c.type : "text"}
                    required={"required" in c ? c.required : false}
                  />
                </div>
              ))}
              <Button
                type="submit"
                className="mt-2 w-full rounded-full sm:col-span-2"
                disabled={crear.isPending}
              >
                Guardar cliente
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <Input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar cliente"
        className="mt-4 h-11 rounded-full"
      />

      <ul className="mt-4 space-y-2">
        {filtrados.map((c) => (
          <li
            key={c.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{c.nombre}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {[c.localidad, c.telefono, c.cuit].filter(Boolean).join(" · ") || "Sin datos"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={`text-sm font-extrabold ${Number(c.saldo) > 0 ? "text-destructive" : "text-success"}`}
              >
                {money(c.saldo)}
              </p>
              <p className="text-xs text-muted-foreground">límite {money(c.limite_credito)}</p>
            </div>
          </li>
        ))}
        {!filtrados.length && (
          <li className="py-16 text-center text-sm text-muted-foreground">Sin clientes.</li>
        )}
      </ul>
    </div>
  );
}
