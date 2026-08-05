import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Ingresar · Mayorista" },
      { name: "description", content: "Accedé al panel de gestión y a la app de pedidos." },
      { property: "og:title", content: "Ingresar · Mayorista" },
      { property: "og:description", content: "Acceso para vendedores, administradores y clientes." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/pedidos", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    try {
      if (modo === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/pedidos", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { nombre } },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/pedidos", replace: true });
        else toast.success("Revisá tu correo para confirmar la cuenta.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos completar la operación");
    } finally {
      setCargando(false);
    }
  }

  async function conGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("No pudimos iniciar sesión con Google");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/pedidos", replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-extrabold tracking-tight">
          {modo === "login" ? "Ingresar" : "Crear cuenta"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Panel de gestión y toma de pedidos de la distribuidora.
        </p>

        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          {modo === "registro" && (
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Juan Pérez"
                required
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vos@distribuidora.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={cargando}>
            {cargando ? "Un momento…" : modo === "login" ? "Ingresar" : "Crear cuenta"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> o <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full rounded-full" onClick={conGoogle}>
          Continuar con Google
        </Button>

        <button
          type="button"
          onClick={() => setModo(modo === "login" ? "registro" : "login")}
          className="mt-6 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {modo === "login" ? "No tengo cuenta, quiero registrarme" : "Ya tengo cuenta, ingresar"}
        </button>
      </div>
    </main>
  );
}
