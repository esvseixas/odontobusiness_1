import { createFileRoute } from "@tanstack/react-router";
import { InventarioEstoque } from "@/components/estoque/operacoes";
export const Route = createFileRoute("/_authenticated/estoque/inventario")({
  head: () => ({
    meta: [
      { title: "Inventário | OdontoGestor" },
      { name: "description", content: "Contagem de estoque por lote com ajuste na finalização." },
      { property: "og:title", content: "Inventário | OdontoGestor" },
      { property: "og:description", content: "Contagem de estoque por lote com ajuste na finalização." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InventarioEstoque,
});
