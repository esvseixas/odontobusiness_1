import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NOME_PAPEL } from "@/lib/permissoes";
import type { Papel } from "@/hooks/useSessao";

export const Route = createFileRoute("/convite/$token")({
  head: () => ({
    meta: [
      { title: "Convite para a equipe | OdontoGestor" },
      { name: "description", content: "Aceite o convite para fazer parte da equipe da clínica no OdontoGestor." },
      { property: "og:title", content: "Convite para a equipe | OdontoGestor" },
      { property: "og:description", content: "Aceite o convite para fazer parte da equipe da clínica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: ConvitePage,
});

function ConvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [aceitando, setAceitando] = useState(false);
  const [logado, setLogado] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLogado(!!data.user));
  }, []);

  const convite = useQuery({
    queryKey: ["convite", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ver_convite", { p_token: token });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  function entrar() {
    sessionStorage.setItem("convite_pendente", token);
    navigate({ to: "/auth" });
  }

  async function aceitar() {
    setAceitando(true);
    const { error } = await supabase.rpc("aceitar_convite", { p_token: token });
    setAceitando(false);
    if (error) return toast.error(error.message);
    sessionStorage.removeItem("convite_pendente");
    await queryClient.invalidateQueries();
    toast.success("Bem-vindo à equipe!");
    navigate({ to: "/dashboard" });
  }

  const c = convite.data;
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Convite para a equipe</CardTitle>
          <CardDescription>
            {convite.isLoading
              ? "Carregando convite…"
              : c
                ? `Você foi convidado para ${c.clinica_nome} como ${NOME_PAPEL[c.papel as Papel] ?? c.papel}.`
                : "Convite não encontrado."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {c && !c.valido ? (
            <p className="text-sm text-destructive">Este convite expirou, foi revogado ou já foi usado.</p>
          ) : null}
          {c?.valido ? (
            <>
              <p className="text-sm text-muted-foreground">
                Use a conta do e-mail <strong>{c.email}</strong>.
              </p>
              {logado ? (
                <Button className="w-full" onClick={aceitar} disabled={aceitando}>
                  {aceitando ? "Aceitando…" : "Aceitar convite"}
                </Button>
              ) : (
                <Button className="w-full" onClick={entrar}>
                  Entrar ou criar conta para aceitar
                </Button>
              )}
            </>
          ) : null}
          <Link to="/" className="block text-center text-sm text-muted-foreground underline">
            Voltar ao início
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
