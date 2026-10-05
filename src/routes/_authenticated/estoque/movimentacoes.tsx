import { createFileRoute } from "@tanstack/react-router";
import { MovimentacoesEstoque } from "@/components/estoque/paginas";
export const Route = createFileRoute("/_authenticated/estoque/movimentacoes")({
  head: () => ({
    meta: [
      { title: "Movimentações de estoque | OdontoGestor" },
      { name: "description", content: "Histórico imutável de movimentações com exportação CSV." },
      { property: "og:title", content: "Movimentações de estoque | OdontoGestor" },
      { property: "og:description", content: "Histórico imutável de movimentações com exportação CSV." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MovimentacoesEstoque,
});
