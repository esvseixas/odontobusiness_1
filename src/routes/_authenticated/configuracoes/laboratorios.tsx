import { createFileRoute } from "@tanstack/react-router";
import { LaboratoriosPage } from "@/components/configuracoes/extras";
export const Route = createFileRoute("/_authenticated/configuracoes/laboratorios")({
  head: () => ({
    meta: [
      { title: "Laboratórios | OdontoGestor" },
      { name: "description", content: "Laboratórios de prótese parceiros." },
      { property: "og:title", content: "Laboratórios | OdontoGestor" },
      { property: "og:description", content: "Laboratórios de prótese parceiros." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LaboratoriosPage,
});
