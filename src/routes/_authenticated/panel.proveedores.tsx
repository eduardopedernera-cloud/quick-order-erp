import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/panel/proveedores")({
  head: () => ({
    meta: [
      { title: "Proveedores · Panel Mayorista" },
      { name: "description", content: "Alta y gestión de proveedores de la distribuidora." },
      { property: "og:title", content: "Proveedores · Panel Mayorista" },
      { property: "og:description", content: "Datos de contacto y fiscales de tus proveedores." },
    ],
  }),
  component: ProveedoresPage,
});

function ProveedoresPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(false);

  const { data: proveedores = [] } = useQuery({
    queryKey: ["proveedores"],
    queryFn: async () => (await supabase.from("proveedores").select("*").order("nombre")).data ?? [],
  });

  const crear = useMutation({
    mutationFn: async (v: Record<string, string>) => {
      const { error } = await supabase.from("proveedores").insert({
        nombre: v["nombre"] ?? "",
        razon_social: v["razon_social"] || null,
        cuit: v["cuit"] || null,
        contacto: v["contacto"] || null,
        telefono: v["telefono"] || null,
        email: v["email"] || null,
        direccion: v["direccion"] || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Proveedor creado");
      setForm(false);
      qc.invalidateQueries({ queryKey: ["proveedores"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h1 className="truncate text-2xl font-extrabold tracking-tight">Proveedores</h1>
        <Button className="shrink-0 gap-2 rounded-full" onClick={() => setForm((v) => !v)}>
          <Plus className="h-4 w-4" /> Nuevo
        </Button>
      </header>

      {form && (
        <form
          className="mt-5 grid gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            crear.mutate(Object.fromEntries(fd) as Record<string, string>);
          }}
        >
          {[
            ["nombre", "Nombre", true],
            ["razon_social", "Razón social", false],
            ["cuit", "CUIT", false],
            ["contacto", "Contacto", false],
            ["telefono", "Teléfono", false],
            ["email", "Email", false],
            ["direccion", "Dirección", false],
          ].map(([name, label, req]) => (
            <div key={String(name)} className="space-y-1.5">
              <Label htmlFor={String(name)}>{label as string}</Label>
              <Input id={String(name)} name={String(name)} required={Boolean(req)} />
            </div>
          ))}
          <div className="sm:col-span-2">
            <Button type="submit" className="rounded-full" disabled={crear.isPending}>
              Guardar proveedor
            </Button>
          </div>
        </form>
      )}

      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {proveedores.map((p) => (
          <li key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p className="truncate text-sm font-bold">{p.nombre}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {p.contacto || "Sin contacto"} · {p.telefono || "sin teléfono"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{p.email || p.cuit || "—"}</p>
          </li>
        ))}
        {!proveedores.length && (
          <li className="py-10 text-center text-sm text-muted-foreground sm:col-span-2">
            Todavía no cargaste proveedores.
          </li>
        )}
      </ul>
    </div>
  );
}
