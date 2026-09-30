import { createFileRoute } from "@tanstack/react-router";
import { ClinicaPage } from "@/components/configuracoes/paginas";
export const Route = createFileRoute("/_authenticated/configuracoes/clinica")({
  head: () => ({
    meta: [
      { title: "Clínica | OdontoGestor" },
      { name: "description", content: "Dados cadastrais e fiscais da clínica." },
      { property: "og:title", content: "Clínica | OdontoGestor" },
      { property: "og:description", content: "Dados cadastrais e fiscais da clínica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClinicaPage,
});
