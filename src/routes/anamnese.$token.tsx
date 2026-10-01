import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { CamposAnamnese, type Pergunta, type Respostas } from "@/components/paciente/anamnese";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/anamnese/$token")({
  head: () => ({
    meta: [
      { title: "Ficha de saúde antes da consulta | OdontoGestor" },
      { name: "description", content: "Preencha sua anamnese com segurança antes do atendimento." },
      { property: "og:title", content: "Ficha de saúde antes da consulta | OdontoGestor" },
      { property: "og:description", content: "Preencha sua anamnese com segurança antes do atendimento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: AnamnesePublica,
});

function AnamnesePublica() {
  const { token } = Route.useParams();
  const [respostas, setRespostas] = useState<Respostas>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const link = useQuery({
    queryKey: ["anamnese-link", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ver_anamnese_link", { p_token: token });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  async function enviar() {
    setEnviando(true);
    const { error } = await supabase.rpc("enviar_anamnese_link", { p_token: token, p_respostas: respostas });
    setEnviando(false);
    if (error) return toast.error(error.message);
    setEnviado(true);
  }

  const l = link.data;
  return (
    <div className="min-h-screen bg-secondary px-4 py-8">
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{l ? `${l.clinica_nome} — ficha de saúde` : "Ficha de saúde"}</CardTitle>
          <CardDescription>
            {link.isLoading
              ? "Carregando…"
              : !l
                ? "Link não encontrado."
                : enviado
                  ? "Obrigado! Suas respostas foram enviadas à clínica."
                  : !l.valido
                    ? "Este link expirou ou já foi utilizado."
                    : `Olá, ${l.paciente_nome}. Responda com atenção; suas respostas são confidenciais.`}
          </CardDescription>
        </CardHeader>
        {l?.valido && !enviado ? (
          <CardContent className="space-y-6">
            <CamposAnamnese perguntas={l.perguntas as unknown as Pergunta[]} respostas={respostas} onChange={setRespostas} />
            <Button className="w-full" onClick={enviar} disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar respostas"}
            </Button>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
