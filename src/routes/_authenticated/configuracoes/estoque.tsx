import { createFileRoute } from "@tanstack/react-router";
import { EstoquePage } from "@/components/configuracoes/paginas";
export const Route = createFileRoute("/_authenticated/configuracoes/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque e lotes | OdontoGestor" },
      { name: "description", content: "Produtos, lotes, quantidades e validades do estoque." },
      { property: "og:title", content: "Estoque e lotes | OdontoGestor" },
      {
        property: "og:description",
        content: "Produtos, lotes, quantidades e validades do estoque.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EstoquePage,
});
