import { createFileRoute } from "@tanstack/react-router";
import { UnidadesPage } from "@/components/configuracoes/paginas";
export const Route = createFileRoute("/_authenticated/configuracoes/unidades")({
  head: () => ({
    meta: [
      { title: "Unidades | OdontoGestor" },
      { name: "description", content: "Gerenciamento das unidades da clínica." },
      { property: "og:title", content: "Unidades | OdontoGestor" },
      { property: "og:description", content: "Gerenciamento das unidades da clínica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UnidadesPage,
});
