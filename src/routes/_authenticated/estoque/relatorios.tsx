import { createFileRoute } from "@tanstack/react-router";
import { RelatoriosEstoque } from "@/components/estoque/operacoes";
export const Route = createFileRoute("/_authenticated/estoque/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios de estoque | OdontoGestor" },
      { name: "description", content: "Consumo, custo de material por procedimento, posição valorizada e rastreio de lote." },
      { property: "og:title", content: "Relatórios de estoque | OdontoGestor" },
      { property: "og:description", content: "Consumo, custo de material por procedimento, posição valorizada e rastreio de lote." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RelatoriosEstoque,
});
