import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_platform-admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw redirect({ to: "/auth" });

    const { data: platformAdmin, error: adminError } = await supabase.rpc("is_platform_admin", {});
    if (adminError || !platformAdmin) throw redirect({ to: "/dashboard" });
    return { user: userData.user };
  },
  component: () => <Outlet />,
});