import { createFileRoute } from "@tanstack/react-router";
import { FornecedoresEstoque } from "@/components/estoque/paginas";
export const Route = createFileRoute("/_authenticated/estoque/fornecedores")({
  head: () => ({
    meta: [
      { title: "Fornecedores | OdontoGestor" },
      { name: "description", content: "Cadastro de fornecedores, prazos e condições de pagamento." },
      { property: "og:title", content: "Fornecedores | OdontoGestor" },
      { property: "og:description", content: "Cadastro de fornecedores, prazos e condições de pagamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FornecedoresEstoque,
});
