import { createFileRoute } from "@tanstack/react-router";
import { Prontuario } from "@/components/prontuario";

export const Route = createFileRoute("/_authenticated/pacientes/$id/odontograma")({
  head: () => ({
    meta: [
      { title: "Odontograma do paciente | OdontoGestor" },
      { name: "description", content: "Odontograma visual e histórico clínico do paciente." },
      { property: "og:title", content: "Odontograma do paciente | OdontoGestor" },
      { property: "og:description", content: "Odontograma visual e histórico clínico do paciente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OdontogramaPage,
});

function OdontogramaPage() {
  const { id } = Route.useParams();
  return <Prontuario id={id} secao="odontograma" />;
}
