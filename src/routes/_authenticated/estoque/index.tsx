import { createFileRoute } from "@tanstack/react-router";
import { VisaoGeralEstoque } from "@/components/estoque/paginas";
export const Route = createFileRoute("/_authenticated/estoque/")({
  head: () => ({
    meta: [
      { title: "Visão geral do estoque | OdontoGestor" },
      { name: "description", content: "Indicadores e alertas de mínimo e validade do estoque." },
      { property: "og:title", content: "Visão geral do estoque | OdontoGestor" },
      { property: "og:description", content: "Indicadores e alertas de mínimo e validade do estoque." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VisaoGeralEstoque,
});
