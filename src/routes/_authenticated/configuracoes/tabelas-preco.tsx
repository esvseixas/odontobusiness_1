import { createFileRoute } from "@tanstack/react-router";
import { TabelasPrecoPage } from "@/components/configuracoes/paginas";
export const Route = createFileRoute("/_authenticated/configuracoes/tabelas-preco")({
  head: () => ({
    meta: [
      { title: "Tabelas de preço | OdontoGestor" },
      { name: "description", content: "Preços particulares, por convênio e por plano interno." },
      { property: "og:title", content: "Tabelas de preço | OdontoGestor" },
      { property: "og:description", content: "Preços particulares, por convênio e por plano interno." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TabelasPrecoPage,
});
