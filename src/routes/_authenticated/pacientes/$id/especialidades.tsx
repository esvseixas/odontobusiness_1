import { createFileRoute } from "@tanstack/react-router";
import { Prontuario } from "@/components/prontuario";

export const Route = createFileRoute("/_authenticated/pacientes/$id/especialidades")({
  head: () => ({
    meta: [
      { title: "Especialidades do paciente | OdontoGestor" },
      { name: "description", content: "Periograma, ortodontia, implantes e ordens de laboratório do paciente." },
      { property: "og:title", content: "Especialidades do paciente | OdontoGestor" },
      { property: "og:description", content: "Periograma, ortodontia, implantes e laboratório." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EspecialidadesPage,
});

function EspecialidadesPage() {
  const { id } = Route.useParams();
  return <Prontuario id={id} secao="especialidades" />;
}
