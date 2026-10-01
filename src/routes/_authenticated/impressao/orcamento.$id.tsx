import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { brl, dataBR } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/impressao/orcamento/$id")({
  head: () => ({
    meta: [
      { title: "Imprimir orçamento | OdontoGestor" },
      { name: "description", content: "Versão para impressão ou PDF do plano de tratamento." },
      { property: "og:title", content: "Imprimir orçamento | OdontoGestor" },
      { property: "og:description", content: "Versão para impressão ou PDF do plano de tratamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Impressao,
});

function Impressao() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["impressao-orc", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamentos")
        .select("*,orcamento_itens(*),pacientes(nome,cpf),profissionais(nome,cro),clinicas(nome,cnpj,telefone,endereco),orcamento_aceites(nome,canal,created_at,assinatura_base64)")
        .eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const o = q.data;
  if (!o) return <p className="p-8 text-sm text-muted-foreground">Carregando…</p>;
  const itens = o.status === "pendente" ? o.orcamento_itens : o.orcamento_itens.filter((i) => i.aprovado);
  const bruto = itens.reduce((s, i) => s + i.quantidade * Number(i.valor_unitario), 0);
  const aceite = o.orcamento_aceites[0];

  return (
    <main className="mx-auto max-w-3xl bg-background p-8 text-sm text-foreground">
      <div className="mb-6 flex justify-end gap-2 print:hidden">
        <Button onClick={() => window.print()}>Imprimir ou salvar em PDF</Button>
      </div>
      <header className="border-b pb-4">
        <h1 className="text-xl font-semibold">{o.clinicas?.nome}</h1>
        <p className="text-muted-foreground">
          {[o.clinicas?.cnpj && `CNPJ ${o.clinicas.cnpj}`, o.clinicas?.telefone, o.clinicas?.endereco].filter(Boolean).join(" · ")}
        </p>
      </header>
      <section className="my-4 space-y-1">
        <h2 className="text-lg font-semibold">Plano de tratamento — versão {o.versao}</h2>
        <p>Paciente: {o.pacientes?.nome}{o.pacientes?.cpf ? ` · CPF ${o.pacientes.cpf}` : ""}</p>
        {o.profissionais && <p>Profissional: {o.profissionais.nome}{o.profissionais.cro ? ` · CRO ${o.profissionais.cro}` : ""}</p>}
        <p>Emitido em {dataBR(o.created_at)}{o.validade ? ` · válido até ${dataBR(o.validade)}` : ""}</p>
      </section>
      <table className="w-full border-collapse">
        <thead><tr className="border-b text-left"><th className="py-2">Procedimento</th><th className="w-16 text-right">Qtd</th><th className="w-28 text-right">Valor</th></tr></thead>
        <tbody>
          {itens.map((i) => (
            <tr key={i.id} className="border-b">
              <td className="py-1">{i.descricao}</td>
              <td className="text-right">{i.quantidade}</td>
              <td className="text-right tabular-nums">{brl(i.quantidade * Number(i.valor_unitario))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 text-right">
        <p>Subtotal {brl(bruto)}</p>
        {Number(o.desconto) > 0 && <p>Desconto {brl(Number(o.desconto))}</p>}
        <p className="text-lg font-semibold">Total {brl(bruto - Number(o.desconto))}</p>
      </div>
      <footer className="mt-16 grid grid-cols-2 gap-8 text-center">
        <div>
          {aceite ? <img src={aceite.assinatura_base64} alt="Assinatura do paciente" className="mx-auto h-16" /> : <div className="h-16" />}
          <p className="border-t pt-1">{aceite ? `${aceite.nome} · ${dataBR(aceite.created_at)}` : "Paciente / responsável"}</p>
        </div>
        <div><div className="h-16" /><p className="border-t pt-1">{o.profissionais?.nome ?? "Profissional responsável"}</p></div>
      </footer>
    </main>
  );
}
