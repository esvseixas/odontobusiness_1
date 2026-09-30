import { createFileRoute } from "@tanstack/react-router";
import { PlanoContasPage } from "@/components/configuracoes/paginas";
export const Route = createFileRoute("/_authenticated/configuracoes/plano-contas")({
  head: () => ({
    meta: [
      { title: "Plano de contas | OdontoGestor" },
      { name: "description", content: "Categorias financeiras e centros de custo." },
      { property: "og:title", content: "Plano de contas | OdontoGestor" },
      { property: "og:description", content: "Categorias financeiras e centros de custo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlanoContasPage,
});
