import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileClock,
  LockKeyhole,
  Network,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

import heroImage from "@/assets/odontogestor-clinica-hero.jpg";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OdontoGestor | Gestão completa para clínicas odontológicas" },
      { name: "description", content: "Agenda, prontuário e odontograma, financeiro, estoque, documentos e gestão multiunidade em uma plataforma odontológica completa." },
      { property: "og:title", content: "OdontoGestor | Sua clínica organizada do atendimento à gestão" },
      { property: "og:description", content: "Centralize a operação da clínica, acompanhe resultados e entregue uma jornada mais organizada aos pacientes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const MODULOS = [
  { icon: CalendarCheck2, titulo: "Agenda que organiza a operação", texto: "Visões por dia, semana e mês, horários por profissional, salas, recorrências, confirmações e bloqueio de conflitos." },
  { icon: Stethoscope, titulo: "Prontuário realmente odontológico", texto: "Odontograma anatômico por dente, anamnese versionada, imagens, documentos, evolução e especialidades no mesmo histórico." },
  { icon: WalletCards, titulo: "Financeiro ligado ao tratamento", texto: "Orçamentos com aceite, parcelas, fluxo de caixa, contas a pagar e receber, comissões e DRE básico sem planilhas paralelas." },
  { icon: Boxes, titulo: "Estoque rastreável", texto: "Lotes, validade, custo médio, inventário e baixa FEFO no atendimento, com rastreio do material aplicado no paciente." },
  { icon: Building2, titulo: "Multiunidade com controle", texto: "Permissões por função, unidades isoladas e uma estrutura preparada para consolidar clínicas, equipes e resultados." },
  { icon: ShieldCheck, titulo: "Segurança por princípio", texto: "Dados separados por clínica, consentimentos LGPD, trilha de auditoria e registros clínicos preservados por histórico." },
];

const PLANOS = [
  { nome: "Solo", publico: "Consultório individual", mensal: "119,90", anual: "99,90", itens: ["1 profissional de saúde", "Até 2 usuários de apoio", "Agenda e prontuário completo", "Odontograma e orçamentos", "Financeiro essencial"] },
  { nome: "Clínica", publico: "Uma clínica com equipe", mensal: "269,90", anual: "229,90", destaque: true, itens: ["Até 5 profissionais", "Usuários administrativos ilimitados", "Financeiro, comissões e DRE", "Estoque integrado por lote", "Documentos e especialidades"] },
  { nome: "Rede", publico: "Operação multiclínica", mensal: "499,90", anual: "Sob medida", sufixo: "por unidade", itens: ["Múltiplas unidades", "Profissionais ilimitados", "Visão gerencial consolidada", "Permissões por unidade", "Atendimento prioritário"] },
];

function Logo() {
  return <span className="flex items-center gap-2 font-display text-lg font-semibold"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground"><Stethoscope className="h-5 w-5" /></span>OdontoGestor</span>;
}

function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground md:flex" aria-label="Navegação principal">
            <a href="#plataforma" className="hover:text-primary">Plataforma</a><a href="#beneficios" className="hover:text-primary">Benefícios</a><a href="#seguranca" className="hover:text-primary">Segurança</a><a href="#planos" className="hover:text-primary">Planos</a>
          </nav>
          <Button asChild><Link to="/auth">Entrar <ArrowRight /></Link></Button>
        </div>
      </header>

      <main>
        <section className="relative min-h-[720px] border-b bg-foreground text-background">
          <img src={heroImage} alt="Dentista gerenciando a agenda e os indicadores da clínica" className="absolute inset-0 h-full w-full object-cover object-center opacity-55" width={1920} height={1080} fetchPriority="high" />
          <div className="absolute inset-0 bg-foreground/55" />
          <div className="relative mx-auto flex min-h-[720px] max-w-7xl items-end px-5 pb-16 pt-28 lg:px-8 lg:pb-20">
            <div className="max-w-4xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-background/30 bg-background/10 px-4 py-2 text-xs font-bold uppercase text-background backdrop-blur"><Sparkles className="h-4 w-4 text-accent" /> Plataforma completa para odontologia</span>
              <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[1.08] sm:text-6xl lg:text-7xl">A clínica inteira trabalhando no mesmo ritmo.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-background/80">Do primeiro agendamento ao fechamento financeiro, o OdontoGestor conecta atendimento, equipe, estoque e gestão para você decidir com mais segurança e operar com menos retrabalho.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Button size="lg" className="h-12 px-6" asChild><Link to="/auth">Testar grátis por 14 dias <ArrowRight /></Link></Button><Button size="lg" variant="outline" className="h-12 border-background/40 bg-background/10 px-6 text-background hover:bg-background hover:text-foreground" asChild><a href="#plataforma">Conhecer a plataforma</a></Button></div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-background/75"><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> Sem cartão de crédito</span><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> Configuração self-service</span><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> Dados isolados por clínica</span></div>
            </div>
          </div>
        </section>

        <section id="beneficios" className="border-b bg-card">
          <div className="mx-auto grid max-w-7xl divide-y px-5 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8">
            {[{ n: "01", t: "Menos tarefas desconectadas", d: "Agenda, prontuário, orçamento e caixa compartilham o mesmo fluxo." }, { n: "02", t: "Mais previsibilidade", d: "Acompanhe pendências, vencimentos, estoque e compromissos em tempo de agir." }, { n: "03", t: "Mais segurança operacional", d: "Papéis, histórico e auditoria ajudam a manter cada ação no lugar certo." }].map((item) => <div key={item.n} className="py-8 md:px-8 first:pl-0"><p className="text-xs font-bold text-primary">{item.n}</p><h2 className="mt-3 text-xl font-semibold">{item.t}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.d}</p></div>)}
          </div>
        </section>

        <section id="plataforma" className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"><div><p className="text-xs font-bold uppercase text-primary">Uma base para crescer</p><h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">Cada área da clínica conectada à próxima decisão.</h2></div><p className="max-w-2xl text-lg leading-8 text-muted-foreground">Em vez de apenas digitalizar tarefas, a plataforma organiza a sequência real do trabalho: atrair, agendar, atender, aprovar, receber e acompanhar.</p></div>
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{MODULOS.map(({ icon: Icon, titulo, texto }, index) => <article key={titulo} className={cn("group rounded-md border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg", index === 1 && "lg:row-span-2 lg:flex lg:flex-col lg:justify-between lg:bg-primary lg:text-primary-foreground")}><span className={cn("flex h-11 w-11 items-center justify-center rounded-md bg-accent text-accent-foreground", index === 1 && "bg-primary-foreground/15 text-primary-foreground")}><Icon className="h-5 w-5" /></span><div className={cn(index === 1 && "mt-20")}><h3 className="mt-6 text-xl font-semibold">{titulo}</h3><p className={cn("mt-3 text-sm leading-6 text-muted-foreground", index === 1 && "text-primary-foreground/75")}>{texto}</p></div></article>)}</div>
          </div>
        </section>

        <section className="bg-foreground py-20 text-background lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-2 lg:px-8">
            <div><p className="text-xs font-bold uppercase text-accent">Da cadeira ao caixa</p><h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">Um atendimento bem registrado protege a clínica e melhora a gestão.</h2><p className="mt-5 max-w-xl leading-7 text-background/70">O histórico clínico, os itens aprovados, os materiais consumidos e a cobrança permanecem ligados. A equipe trabalha com contexto; a gestão acompanha a operação sem depender de memória ou planilhas.</p></div>
            <ol className="space-y-1">{[{ i: CalendarCheck2, t: "Agenda", d: "Horários sem conflito e alertas clínicos visíveis." }, { i: ClipboardCheck, t: "Atendimento", d: "Anamnese, odontograma e evolução versionada." }, { i: PackageCheck, t: "Consumo", d: "Baixa automática por lote e validade." }, { i: TrendingUp, t: "Resultado", d: "Cobrança, fluxo de caixa e indicadores atualizados." }].map(({ i: Icon, t, d }, index) => <li key={t} className="flex gap-5 border-b border-background/15 py-5"><span className="text-sm text-accent">0{index + 1}</span><Icon className="mt-0.5 h-5 w-5 text-background/60" /><div><h3 className="font-display font-semibold">{t}</h3><p className="mt-1 text-sm text-background/60">{d}</p></div></li>)}</ol>
          </div>
        </section>

        <section id="seguranca" className="py-20 lg:py-28"><div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[1.1fr_0.9fr] lg:px-8"><div><p className="text-xs font-bold uppercase text-primary">Confiança clínica</p><h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Informação disponível para quem precisa. Protegida de quem não precisa.</h2><p className="mt-5 max-w-2xl leading-7 text-muted-foreground">Permissões por função e clínica, arquivos privados, consentimentos por finalidade e uma trilha imutável de alterações sustentam uma operação responsável.</p><div className="mt-10 grid gap-6 sm:grid-cols-2">{[{ i: LockKeyhole, t: "Acesso por função", d: "Cada perfil enxerga somente as áreas adequadas ao seu trabalho." }, { i: FileClock, t: "Histórico preservado", d: "Registros clínicos são retificados e versionados, nunca simplesmente apagados." }, { i: ShieldCheck, t: "Auditoria contínua", d: "Alterações sensíveis ficam associadas ao usuário e ao momento da ação." }, { i: Network, t: "Isolamento multiempresa", d: "Os dados de cada clínica permanecem separados desde a base." }].map(({ i: Icon, t, d }) => <div key={t} className="flex gap-4"><Icon className="mt-1 h-5 w-5 shrink-0 text-primary" /><div><h3 className="font-display font-semibold">{t}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{d}</p></div></div>)}</div></div><div className="border-l-4 border-accent bg-secondary p-8 lg:p-10"><p className="text-xs font-bold uppercase text-primary">Para redes</p><h3 className="mt-4 text-2xl font-semibold">Uma visão gerencial sem perder o controle de cada unidade.</h3><p className="mt-4 leading-7 text-muted-foreground">Estruture equipes, agendas, estoques e permissões por unidade. A base multiempresa prepara a rede para crescer de forma organizada.</p><div className="mt-8 space-y-3">{["Cadastros e acessos por unidade", "Indicadores operacionais consolidados", "Padronização de processos e documentos", "Rastreabilidade em toda a rede"].map((item) => <p key={item} className="flex items-center gap-3 text-sm font-medium"><Check className="h-4 w-4 text-primary" /> {item}</p>)}</div></div></div></section>

        <section id="planos" className="border-y bg-secondary py-20 lg:py-28"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase text-primary">Planos sugeridos</p><h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Comece com 14 dias gratuitos.</h2><p className="mt-4 text-muted-foreground">Sem cartão de crédito. Escolha a estrutura que acompanha o momento da sua operação.</p></div><div className="mt-12 grid gap-5 lg:grid-cols-3">{PLANOS.map((plano) => <article key={plano.nome} className={cn("relative rounded-md border bg-card p-7", plano.destaque && "border-primary shadow-xl")}>
          {plano.destaque ? <span className="absolute right-5 top-5 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">Mais escolhido</span> : null}<p className="text-sm font-semibold text-primary">{plano.publico}</p><h3 className="mt-2 text-2xl font-semibold">{plano.nome}</h3><div className="mt-7"><span className="text-sm text-muted-foreground">a partir de</span><p><span className="text-lg font-semibold">R$</span> <span className="font-display text-4xl font-semibold">{plano.mensal}</span> <span className="text-sm text-muted-foreground">/mês {plano.sufixo}</span></p>{plano.anual !== "Sob medida" ? <p className="mt-2 text-xs text-muted-foreground">R$ {plano.anual}/mês no plano anual</p> : <p className="mt-2 text-xs text-muted-foreground">Condições anuais personalizadas</p>}</div><Button className="mt-7 w-full" variant={plano.destaque ? "default" : "outline"} asChild><Link to="/auth">Iniciar teste gratuito</Link></Button><div className="mt-7 space-y-3">{plano.itens.map((item) => <p key={item} className="flex gap-3 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {item}</p>)}</div></article>)}</div><p className="mt-6 text-center text-xs text-muted-foreground">Valores de lançamento sugeridos e sujeitos à definição comercial. Cobrança automática ainda não está ativa.</p></div></section>

        <section className="bg-primary py-20 text-primary-foreground"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 lg:flex-row lg:items-end lg:px-8"><div><p className="text-xs font-bold uppercase text-primary-foreground/70">Pronto para organizar a operação?</p><h2 className="mt-4 max-w-3xl text-3xl font-semibold sm:text-4xl">Experimente o fluxo completo da sua clínica antes de escolher um plano.</h2></div><Button size="lg" variant="secondary" className="h-12 shrink-0" asChild><Link to="/auth">Testar grátis por 14 dias <ArrowRight /></Link></Button></div></section>
      </main>

      <footer className="bg-foreground py-12 text-background"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 md:flex-row md:items-center lg:px-8"><div><Logo /><p className="mt-3 max-w-sm text-sm text-background/60">Tecnologia brasileira para uma odontologia mais organizada, segura e sustentável.</p></div><div className="flex flex-wrap gap-6 text-sm text-background/65"><a href="#plataforma" className="hover:text-background">Plataforma</a><a href="#seguranca" className="hover:text-background">Segurança</a><a href="#planos" className="hover:text-background">Planos</a><Link to="/auth" className="hover:text-background">Entrar</Link></div></div></footer>
    </div>
  );
}