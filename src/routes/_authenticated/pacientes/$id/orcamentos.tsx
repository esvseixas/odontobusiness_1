import { createFileRoute } from "@tanstack/react-router";
import { Prontuario } from "@/components/prontuario";

export const Route = createFileRoute("/_authenticated/pacientes/$id/orcamentos")({
  head: () => ({
    meta: [
      { title: "Orçamentos do paciente | OdontoGestor" },
      { name: "description", content: "Planos de tratamento, versões e aprovação de orçamentos." },
      { property: "og:title", content: "Orçamentos do paciente | OdontoGestor" },
      { property: "og:description", content: "Planos de tratamento, versões e aprovação de orçamentos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrçamentosPage,
});

function OrçamentosPage() {
  const { id } = Route.useParams();
  return <Prontuario id={id} secao="orcamentos" />;
}
