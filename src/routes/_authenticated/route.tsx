import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const { data: acesso, error: acessoError } = await supabase.rpc("verificar_acesso_clinica");
    if (acessoError) throw acessoError;
    const situacao = acesso as { liberado?: boolean; status?: string } | null;
    if (!situacao?.liberado) throw redirect({ to: "/assinatura" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
