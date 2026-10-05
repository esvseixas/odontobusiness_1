import { createFileRoute } from "@tanstack/react-router";
import { ComprasEstoque } from "@/components/estoque/operacoes";
export const Route = createFileRoute("/_authenticated/estoque/compras")({
  head: () => ({
    meta: [
      { title: "Compras | OdontoGestor" },
      { name: "description", content: "Pedidos de compra, recebimento com lotes e sugestão automática." },
      { property: "og:title", content: "Compras | OdontoGestor" },
      { property: "og:description", content: "Pedidos de compra, recebimento com lotes e sugestão automática." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ComprasEstoque,
});
