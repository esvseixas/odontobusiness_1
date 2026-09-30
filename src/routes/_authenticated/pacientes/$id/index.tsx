import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/pacientes/$id/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/pacientes/$id/odontograma", params: { id: params.id }, replace: true });
  },
});
