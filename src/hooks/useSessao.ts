import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Papel = "owner" | "dentista" | "recepcao" | "financeiro";

export function useSessao() {
  return useQuery({
    queryKey: ["sessao"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      let clinica = null;
      if (profile?.clinica_id) {
        const { data } = await supabase
          .from("clinicas")
          .select("*")
          .eq("id", profile.clinica_id)
          .maybeSingle();
        clinica = data;
      }

      const papeis = (roles ?? []).map((r) => r.role as Papel);
      return {
        user,
        profile,
        clinica,
        papeis,
        clinicaId: profile?.clinica_id ?? null,
        tem: (...p: Papel[]) => papeis.some((x) => p.includes(x)),
      };
    },
  });
}
