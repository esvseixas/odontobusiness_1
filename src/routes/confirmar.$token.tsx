import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { dataBR, horaBR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/confirmar/$token")({
  head: () => ({
    meta: [
      { title: "Confirmar consulta | OdontoGestor" },
      { name: "description", content: "Confirme ou cancele sua consulta odontológica." },
      { property: "og:title", content: "Confirmar consulta | OdontoGestor" },
      { property: "og:description", content: "Confirme ou cancele sua consulta odontológica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: Confirmar,
});

type Info = { clinica: string; paciente: string; inicio: string; profissional: string | null; procedimento: string | null; status: string };

function Confirmar() {
  const { token } = Route.useParams();
  const [resposta, setResposta] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["confirmar", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ver_confirmacao", { p_token: token });
      if (error) throw error;
      return data as unknown as Info | null;
    },
  });
  async function responder(ok: boolean) {
    const { data, error } = await supabase.rpc("responder_confirmacao", { p_token: token, p_confirmar: ok });
    if (error) return toast.error(error.message);
    setResposta(data as string);
  }
  const d = q.data;
  const status = resposta ?? d?.status;
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sua consulta</CardTitle>
          <CardDescription>{d?.clinica ?? (q.isLoading ? "Carregando…" : "Link não encontrado")}</CardDescription>
        </CardHeader>
        {d && (
          <CardContent className="space-y-4 text-sm">
            <p>Olá, {d.paciente}! Consulta em <strong>{dataBR(d.inicio)} às {horaBR(d.inicio)}</strong>
              {d.profissional ? ` com ${d.profissional}` : ""}{d.procedimento ? ` · ${d.procedimento}` : ""}.</p>
            {status === "confirmado" && <p className="font-medium text-primary">Consulta confirmada. Até lá!</p>}
            {status === "cancelado" && <p className="font-medium text-destructive">Consulta cancelada. Entre em contato para remarcar.</p>}
            {status === "agendado" && (
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => responder(true)}>Confirmar presença</Button>
                <Button className="flex-1" variant="outline" onClick={() => responder(false)}>Cancelar</Button>
              </div>
            )}
            {status === "confirmado" && !resposta && (
              <Button variant="outline" className="w-full" onClick={() => responder(false)}>Preciso cancelar</Button>
            )}
          </CardContent>
        )}
      </Card>
    </main>
  );
}
