import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque | OdontoGestor" },
      { name: "description", content: "Itens, lotes, movimentações, compras, fornecedores, inventário e relatórios de estoque." },
      { property: "og:title", content: "Estoque | OdontoGestor" },
      { property: "og:description", content: "Estoque integrado ao atendimento, com lotes, validades e compras." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EstoqueLayout,
});

const TITULOS: Record<string, [string, string]> = {
  estoque: ["Estoque", "Visão geral, alertas de mínimo e de validade."],
  itens: ["Itens", "Cadastro de materiais, unidades, conversão e custo médio."],
  lotes: ["Lotes", "Entradas, saldos por lote, ajustes e transferências."],
  movimentacoes: ["Movimentações", "Histórico imutável de entradas e saídas."],
  compras: ["Compras", "Pedidos, recebimento e sugestão automática."],
  fornecedores: ["Fornecedores", "Cadastro de fornecedores e prazos."],
  inventario: ["Inventário", "Contagem por lote e ajustes."],
  relatorios: ["Relatórios", "Consumo, custo por procedimento, posição e rastreio."],
};

function EstoqueLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const slug = pathname.split("/").filter(Boolean).at(-1) ?? "estoque";
  const [titulo, descricao] = TITULOS[slug] ?? TITULOS.estoque;
  return (
    <AppShell>
      <PageHeader titulo={titulo} descricao={descricao} />
      <Outlet />
    </AppShell>
  );
}
