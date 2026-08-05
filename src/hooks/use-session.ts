import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type Rol = "admin" | "vendedor" | "cliente";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setCargando(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargando(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, cargando, userId: session?.user.id ?? null };
}

export function usePerfil() {
  const { userId } = useSession();

  return useQuery({
    queryKey: ["perfil", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [{ data: perfil }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId!).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId!),
      ]);
      const lista = (roles ?? []).map((r) => r.role as Rol);
      return {
        perfil,
        roles: lista,
        esStaff: lista.includes("admin") || lista.includes("vendedor"),
        esAdmin: lista.includes("admin"),
      };
    },
  });
}
