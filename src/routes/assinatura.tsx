import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, LogIn, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/assinatura")({
  head: () => ({
    meta: [
      { title: "Situação da assinatura | OdontoGestor" },
      { name: "description", content: "Consulte a situação de acesso da sua clínica ao OdontoGestor." },
      { property: "og:title", content: "Situação da assinatura | OdontoGestor" },
      { property: "og:description", content: "Consulte a situação de acesso da sua clínica ao OdontoGestor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssinaturaPage,
});

function AssinaturaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-5 py-12">
      <section className="w-full max-w-xl rounded-md border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-destructive/10 text-destructive"><ShieldAlert className="h-6 w-6" /></span>
        <h1 className="mt-6 text-2xl font-semibold">Acesso temporariamente indisponível</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">O período de teste terminou ou a assinatura precisa ser regularizada. Entre em contato com o atendimento comercial para reativar a clínica.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild><a href="mailto:contato@odontogestor.com.br"><CreditCard /> Falar com o comercial</a></Button>
          <Button variant="outline" asChild><Link to="/auth"><LogIn /> Voltar ao acesso</Link></Button>
        </div>
      </section>
    </main>
  );
}