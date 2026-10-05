import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { dataBR } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/impressao/documento/$id")({
  head: () => ({
    meta: [
      { title: "Imprimir documento | OdontoGestor" },
      { name: "description", content: "Documento clínico com cabeçalho da clínica pronto para impressão ou PDF." },
      { property: "og:title", content: "Imprimir documento | OdontoGestor" },
      { property: "og:description", content: "Documento clínico pronto para impressão ou PDF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImpressaoDocumento,
});

function ImpressaoDocumento() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["impressao-doc", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos_emitidos")
        .select("*,clinicas(nome,cnpj,telefone,endereco),profissionais(nome,cro),pacientes(nome)")
        .eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const d = q.data;
  if (!d) return <p className="p-8 text-sm text-muted-foreground">Carregando…</p>;
  return (
    <main className="mx-auto max-w-3xl bg-background p-8 text-sm text-foreground">
      <div className="mb-6 flex justify-end print:hidden">
        <Button onClick={() => window.print()}>Imprimir ou salvar em PDF</Button>
      </div>
      <header className="border-b pb-4 text-center">
        <h1 className="text-xl font-semibold">{d.clinicas?.nome}</h1>
        <p className="text-muted-foreground">
          {[d.clinicas?.cnpj && `CNPJ ${d.clinicas.cnpj}`, d.clinicas?.telefone, d.clinicas?.endereco].filter(Boolean).join(" · ")}
        </p>
      </header>
      <h2 className="my-6 text-center text-lg font-semibold uppercase tracking-wide">{d.titulo}</h2>
      <div className="min-h-64 whitespace-pre-wrap leading-relaxed">{d.conteudo}</div>
      <footer className="mt-20 text-center">
        <div className="mx-auto w-72 border-t pt-1">
          <p>{d.profissionais?.nome ?? "Profissional responsável"}</p>
          {d.profissionais?.cro && <p className="text-muted-foreground">CRO {d.profissionais.cro}</p>}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">Emitido em {dataBR(d.created_at)} · Paciente: {d.pacientes?.nome}</p>
      </footer>
    </main>
  );
}
