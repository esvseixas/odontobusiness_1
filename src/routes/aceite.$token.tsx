import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AssinaturaPad } from "@/components/paciente/assinatura";
import { brl, dataBR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/aceite/$token")({
  head: () => ({
    meta: [
      { title: "Aceite do plano de tratamento | OdontoGestor" },
      { name: "description", content: "Revise e assine o seu plano de tratamento odontológico." },
      { property: "og:title", content: "Aceite do plano de tratamento | OdontoGestor" },
      { property: "og:description", content: "Revise e assine o seu plano de tratamento odontológico." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: AceitePublico,
});

type Dados = {
  clinica: string; paciente: string; versao: number; validade: string | null; desconto: number;
  aceito: boolean; valido: boolean; itens: { descricao: string; quantidade: number; valor: number }[];
};

function AceitePublico() {
  const { token } = Route.useParams();
  const [nome, setNome] = useState("");
  const [doc, setDoc] = useState("");
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const q = useQuery({
    queryKey: ["aceite", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ver_orcamento_aceite", { p_token: token });
      if (error) throw error;
      return data as unknown as Dados | null;
    },
  });
  const d = q.data;
  const bruto = (d?.itens ?? []).reduce((s, i) => s + i.quantidade * Number(i.valor), 0);

  async function enviar() {
    setEnviando(true);
    const { error } = await supabase.rpc("aceitar_orcamento_link", {
      p_token: token, p_nome: nome, p_documento: doc, p_assinatura: assinatura ?? "",
    });
    setEnviando(false);
    if (error) return toast.error(error.message);
    setEnviado(true);
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Plano de tratamento</CardTitle>
          <CardDescription>{d ? `${d.clinica} · Olá, ${d.paciente}` : "Carregando…"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {q.isLoading ? null : !d ? (
            <p className="text-sm text-muted-foreground">Link não encontrado.</p>
          ) : enviado || d.aceito ? (
            <p className="text-sm">Obrigado! Seu aceite foi registrado. A clínica já foi informada.</p>
          ) : !d.valido ? (
            <p className="text-sm text-muted-foreground">Este link expirou. Peça um novo à clínica.</p>
          ) : (
            <>
              <div className="divide-y rounded-md border text-sm">
                {d.itens.map((i, k) => (
                  <div key={k} className="flex justify-between gap-2 p-2">
                    <span>{i.descricao}{i.quantidade > 1 ? ` × ${i.quantidade}` : ""}</span>
                    <span className="tabular-nums">{brl(i.quantidade * Number(i.valor))}</span>
                  </div>
                ))}
              </div>
              <div className="text-right text-sm">
                {Number(d.desconto) > 0 && <p className="text-muted-foreground">Desconto {brl(Number(d.desconto))}</p>}
                <p className="text-lg font-semibold">Total {brl(bruto - Number(d.desconto))}</p>
                {d.validade && <p className="text-xs text-muted-foreground">Válido até {dataBR(d.validade)}</p>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1"><Label htmlFor="nome">Seu nome completo</Label><Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} /></div>
                <div className="space-y-1"><Label htmlFor="doc">CPF (opcional)</Label><Input id="doc" value={doc} onChange={(e) => setDoc(e.target.value)} /></div>
              </div>
              <Label>Assinatura</Label>
              <AssinaturaPad onChange={setAssinatura} />
              <Button className="w-full" disabled={!nome || !assinatura || enviando} onClick={enviar}>
                Aceito o plano de tratamento
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
