import { createFileRoute } from "@tanstack/react-router";
import { Prontuario } from "@/components/prontuario";

export const Route = createFileRoute("/_authenticated/pacientes/$id/documentos")({
  head: () => ({
    meta: [
      { title: "Documentos do paciente | OdontoGestor" },
      { name: "description", content: "Emissão e histórico de documentos clínicos do paciente." },
      { property: "og:title", content: "Documentos do paciente | OdontoGestor" },
      { property: "og:description", content: "Emissão e histórico de documentos clínicos do paciente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DocumentosPage,
});

function DocumentosPage() {
  const { id } = Route.useParams();
  return <Prontuario id={id} secao="documentos" />;
}
