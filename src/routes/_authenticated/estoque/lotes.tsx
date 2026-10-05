import { createFileRoute } from "@tanstack/react-router";
import { LotesEstoque } from "@/components/estoque/paginas";
export const Route = createFileRoute("/_authenticated/estoque/lotes")({
  head: () => ({
    meta: [
      { title: "Lotes de estoque | OdontoGestor" },
      { name: "description", content: "Saldos por lote, entradas, ajustes e transferências entre unidades." },
      { property: "og:title", content: "Lotes de estoque | OdontoGestor" },
      { property: "og:description", content: "Saldos por lote, entradas, ajustes e transferências entre unidades." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LotesEstoque,
});
