import { createFileRoute } from "@tanstack/react-router";
import { EquipePage } from "@/components/configuracoes/paginas";
export const Route = createFileRoute("/_authenticated/configuracoes/equipe")({
  head: () => ({
    meta: [
      { title: "Equipe | OdontoGestor" },
      { name: "description", content: "Gestão dos profissionais e usuários da clínica." },
      { property: "og:title", content: "Equipe | OdontoGestor" },
      { property: "og:description", content: "Gestão dos profissionais e usuários da clínica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EquipePage,
});
