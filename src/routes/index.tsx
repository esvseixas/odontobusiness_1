import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Stethoscope,
  Wallet,
  ShieldCheck,
  Activity,
  Building2,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OdontoGestor | Gestão completa para clínicas odontológicas" },
      {
        name: "description",
        content:
          "Agenda, prontuário com odontograma, orçamentos e financeiro em uma só plataforma para clínicas e redes odontológicas.",
      },
      { property: "og:title", content: "OdontoGestor | Gestão para clínicas odontológicas" },
      {
        property: "og:description",
        content: "Agenda, odontograma, orçamentos e financeiro para clínicas e redes odontológicas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const RECURSOS = [
  { icon: CalendarDays, titulo: "Agenda inteligente", texto: "Agenda por profissional e cadeira, status de atendimento e controle de faltas." },
  { icon: Activity, titulo: "Odontograma clínico", texto: "Marcação por dente e face, plano de tratamento versionado e evolução imutável." },
  { icon: Wallet, titulo: "Financeiro completo", texto: "Contas a receber e pagar, fluxo de caixa, comissões e DRE simplificado." },
  { icon: Building2, titulo: "Multiunidade", texto: "Rede de clínicas com dados isolados, permissões por unidade e visão consolidada." },
  { icon: ShieldCheck, titulo: "LGPD e auditoria", texto: "Consentimento do paciente, trilha de auditoria e prontuário sem exclusão." },
  { icon: Stethoscope, titulo: "Pronto para usar", texto: "Cadastro self-service: crie a clínica e comece a atender no mesmo dia." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">OdontoGestor</span>
          </div>
          <Button asChild>
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <span className="inline-flex rounded-full border border-primary/30 bg-accent/40 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary">
          Plataforma multiclínica
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
          A gestão da sua clínica odontológica, do agendamento ao caixa
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Agenda, prontuário com odontograma interativo, orçamentos versionados e financeiro
          integrado — com isolamento total de dados entre clínicas.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/auth">
              Criar minha clínica <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/auth">Já tenho conta</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="grid gap-4 md:grid-cols-3">
          {RECURSOS.map((r) => {
            const Icon = r.icon;
            return (
              <Card key={r.titulo}>
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{r.titulo}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{r.texto}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        OdontoGestor — gestão para clínicas e redes odontológicas.
      </footer>
    </div>
  );
}
