import { createFileRoute } from "@tanstack/react-router";
import { ModelosDocumentosPage } from "@/components/configuracoes/extras";
export const Route = createFileRoute("/_authenticated/configuracoes/modelos")({
  head: () => ({
    meta: [
      { title: "Modelos de documentos | OdontoGestor" },
      { name: "description", content: "Atestados, receituários, termos e contratos com variáveis." },
      { property: "og:title", content: "Modelos de documentos | OdontoGestor" },
      { property: "og:description", content: "Atestados, receituários, termos e contratos com variáveis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ModelosDocumentosPage,
});
