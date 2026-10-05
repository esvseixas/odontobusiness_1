import { createFileRoute } from "@tanstack/react-router";
import { ItensEstoque } from "@/components/estoque/paginas";
export const Route = createFileRoute("/_authenticated/estoque/itens")({
  head: () => ({
    meta: [
      { title: "Itens de estoque | OdontoGestor" },
      { name: "description", content: "Cadastro de materiais com unidade de compra, conversão e custo médio." },
      { property: "og:title", content: "Itens de estoque | OdontoGestor" },
      { property: "og:description", content: "Cadastro de materiais com unidade de compra, conversão e custo médio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ItensEstoque,
});
