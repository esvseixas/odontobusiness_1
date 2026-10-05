import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Bot, Check, FileText, Plus, ShieldCheck, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { AlertasClinicos } from "@/components/paciente/alertas";
import { AnamnesePaciente } from "@/components/paciente/anamnese";
import { ArquivosPaciente } from "@/components/paciente/arquivos";
import { PacienteDados } from "@/components/paciente/dados";
import { DocumentosPaciente } from "@/components/paciente/documentos";
import { Especialidades } from "@/components/paciente/especialidades";
import { PlanoTratamento } from "@/components/paciente/plano-tratamento";
import { mensagemErro } from "@/lib/erros";
import { useSessao } from "@/hooks/useSessao";
import { AppShell } from "@/components/app-shell";
import { Odontograma, FACES, CONDICOES, type Marcacao } from "@/components/odontograma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { brl, dataBR, horaBR, isoDia } from "@/lib/format";
import { gerarResumoClinico } from "@/lib/resumo-clinico.functions";

const SECOES = [
  { valor: "odontograma", rotulo: "Odontograma" },
  { valor: "orcamentos", rotulo: "Orçamentos" },
  { valor: "evolucao", rotulo: "Evolução clínica" },
  { valor: "especialidades", rotulo: "Especialidades" },
  { valor: "documentos", rotulo: "Documentos" },
  { valor: "historico", rotulo: "Histórico" },
  { valor: "arquivos", rotulo: "Arquivos e imagens" },
  { valor: "dados", rotulo: "Dados e anamnese" },
] as const;

export type SecaoProntuario = (typeof SECOES)[number]["valor"];

export function Prontuario({ id, secao }: { id: string; secao: SecaoProntuario }) {
  const { data: sessao } = useSessao();
  const clinicaId = sessao?.clinicaId;
  const queryClient = useQueryClient();

  const [decidua, setDecidua] = useState(false);
  const [denteSel, setDenteSel] = useState<string | null>(null);
  const [marca, setMarca] = useState({ face: "oclusal", condicao: "Cárie", procedimento_id: "", status: "planejado", observacao: "" });
  const [evolucao, setEvolucao] = useState("");
  const [anotacoesResumo, setAnotacoesResumo] = useState("");
  const [resumoGerado, setResumoGerado] = useState("");
  const gerarResumo = useServerFn(gerarResumoClinico);

  const dados = useQuery({
    enabled: !!clinicaId,
    queryKey: ["prontuario", id],
    queryFn: async () => {
      const [paciente, marcacoes, orcamentos, evolucoes, documentos, procedimentos, agendamentos, recebimentos] =
        await Promise.all([
          supabase.from("pacientes").select("*,convenios(nome)").eq("id", id).maybeSingle(),
          supabase.from("odontograma_marcacoes").select("*").eq("paciente_id", id).order("created_at"),
          supabase.from("orcamentos").select("*,orcamento_itens(*)").eq("paciente_id", id).order("versao", { ascending: false }),
          supabase.from("evolucoes_clinicas").select("*").eq("paciente_id", id).order("created_at", { ascending: false }),
          supabase.from("documentos_emitidos").select("*").eq("paciente_id", id).order("created_at", { ascending: false }),
          supabase.from("procedimentos").select("*").eq("ativo", true).order("nome"),
          supabase.from("agendamentos").select("*,profissionais(nome),procedimentos(nome)").eq("paciente_id", id).order("inicio", { ascending: false }),
          supabase.from("financeiro_recebimentos").select("*").eq("paciente_id", id).order("vencimento"),
        ]);
      return {
        paciente: paciente.data,
        marcacoes: (marcacoes.data ?? []) as Marcacao[],
        orcamentos: orcamentos.data ?? [],
        evolucoes: evolucoes.data ?? [],
        documentos: documentos.data ?? [],
        procedimentos: procedimentos.data ?? [],
        agendamentos: agendamentos.data ?? [],
        recebimentos: recebimentos.data ?? [],
      };
    },
  });

  const p = dados.data?.paciente;
  const secaoAtual = SECOES.find((item) => item.valor === secao) ?? SECOES[0];

  const addMarcacao = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("odontograma_marcacoes").insert({
        clinica_id: clinicaId!,
        paciente_id: id,
        dente: denteSel!,
        face: marca.face,
        condicao: marca.condicao,
        procedimento_id: marca.procedimento_id || null,
        status: marca.status,
        observacao: marca.observacao || null,
        created_by: sessao?.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marcação registrada no odontograma.");
      setDenteSel(null);
      setMarca({ face: "oclusal", condicao: "Cárie", procedimento_id: "", status: "planejado", observacao: "" });
      queryClient.invalidateQueries({ queryKey: ["prontuario", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const gerarOrcamento = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("gerar_orcamento", { p_paciente: id, p_validade_dias: 30 });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Orçamento gerado a partir do odontograma.");
      queryClient.invalidateQueries({ queryKey: ["prontuario", id] });
      queryClient.invalidateQueries({ queryKey: ["planos", id] });
    },
    onError: (e: Error) => toast.error(mensagemErro(e)),
  });

  const addEvolucao = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("evolucoes_clinicas").insert({
        clinica_id: clinicaId!,
        paciente_id: id,
        autor_id: sessao?.user.id,
        autor_nome: sessao?.profile?.nome ?? sessao?.user.email,
        texto: evolucao,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setEvolucao("");
      toast.success("Evolução registrada (registro imutável).");
      queryClient.invalidateQueries({ queryKey: ["prontuario", id] });
    },
  });

  const resumirAtendimento = useMutation({
    mutationFn: async () => {
      const resultado = await gerarResumo({
        data: { pacienteId: id, anotacoes: anotacoesResumo.trim() },
      });
      return resultado.resumo;
    },
    onSuccess: (resumo) => {
      setResumoGerado(resumo);
      toast.success("Resumo preparado para revisão.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const registrarResumo = useMutation({
    mutationFn: async () => {
      const texto = resumoGerado.trim();
      if (!texto) throw new Error("Revise o resumo antes de registrar.");
      if (!clinicaId) throw new Error("Clínica não encontrada.");
      const { error } = await supabase.from("evolucoes_clinicas").insert({
        clinica_id: clinicaId,
        paciente_id: id,
        autor_id: sessao?.user.id,
        autor_nome: sessao?.profile?.nome ?? sessao?.user.email,
        texto: `[Resumo assistido por IA — revisado pelo profissional]\n${texto}`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setAnotacoesResumo("");
      setResumoGerado("");
      toast.success("Resumo revisado registrado na evolução clínica.");
      queryClient.invalidateQueries({ queryKey: ["prontuario", id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!p) {
    return (
      <AppShell>
        <p className="text-muted-foreground">Carregando prontuário…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Breadcrumb className="mb-4 min-w-0">
        <BreadcrumbList className="flex-nowrap overflow-hidden">
          <BreadcrumbItem className="min-w-0 shrink">
            <BreadcrumbLink asChild>
              <Link to="/dashboard" className="block max-w-28 truncate sm:max-w-44" title={sessao?.clinica?.nome ?? "Clínica"}>
                {sessao?.clinica?.nome ?? "Clínica"}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="shrink-0">
            <BreadcrumbLink asChild><Link to="/pacientes">Pacientes</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0 shrink">
            <BreadcrumbLink asChild>
              <Link to="/pacientes/$id/dados" params={{ id }} className="block max-w-28 truncate sm:max-w-48" title={p.nome}>
                {p.nome}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0 shrink">
            <BreadcrumbPage className="block max-w-32 truncate sm:max-w-none">{secaoAtual.rotulo}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{p.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {p.telefone ?? "sem telefone"} · nasc. {dataBR(p.data_nascimento)} · {p.convenios?.nome ?? "Particular"}
          </p>
        </div>
        <div className="flex gap-2">
          {p.consentimento_lgpd ? (
            <Badge className="gap-1"><ShieldCheck className="h-3 w-3" /> LGPD assinada</Badge>
          ) : (
            <Badge variant="outline">LGPD pendente</Badge>
          )}
          {p.elegibilidade_pendente ? <Badge variant="destructive">convênio pendente</Badge> : null}
        </div>
      </div>

      <AlertasClinicos pacienteId={id} />

      <Tabs value={secao}>
        <div className="min-w-0">

        <TabsContent value="odontograma">
          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">
                Odontograma — dentição {decidua ? "decídua" : "permanente"}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setDecidua((v) => !v)}>
                  Ver {decidua ? "permanente" : "decídua"}
                </Button>
                <Button size="sm" onClick={() => gerarOrcamento.mutate()} disabled={gerarOrcamento.isPending}>
                  Gerar orçamento do plano
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Odontograma
                marcacoes={dados.data?.marcacoes ?? []}
                decidua={decidua}
                onSelecionarDente={(d) => setDenteSel(d)}
              />
              <div className="mt-6 space-y-2">
                <p className="text-sm font-medium">Marcações registradas</p>
                {(dados.data?.marcacoes ?? []).filter((m) => m.ativo).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Clique em um dente para registrar condições e procedimentos.</p>
                ) : (
                  dados.data?.marcacoes.filter((m) => m.ativo).map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <span>Dente {m.dente} · {m.condicao} {m.face ? `(${m.face})` : ""}</span>
                      <Badge variant="secondary">{m.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orcamentos">
          <PlanoTratamento pacienteId={id} />
        </TabsContent>

        <TabsContent value="evolucao">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Bot className="h-4 w-4 text-primary" /> Resumo do atendimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="anotacoes-resumo">Anotações do profissional</Label>
                <Textarea
                  id="anotacoes-resumo"
                  rows={4}
                  maxLength={5000}
                  placeholder="Registre achados, procedimentos realizados, conduta e orientações relevantes…"
                  value={anotacoesResumo}
                  onChange={(event) => setAnotacoesResumo(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  O resumo considera estas anotações, anamnese, odontograma, evoluções e atendimentos recentes.
                </p>
              </div>
              <Button
                variant="outline"
                disabled={anotacoesResumo.trim().length < 10 || resumirAtendimento.isPending}
                onClick={() => resumirAtendimento.mutate()}
              >
                <Sparkles className="h-4 w-4" />
                {resumirAtendimento.isPending ? "Preparando resumo…" : "Gerar resumo com IA"}
              </Button>

              {resumoGerado ? (
                <div className="space-y-3 border-t pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="resumo-gerado">Resumo para revisão</Label>
                    <Textarea id="resumo-gerado" rows={8} value={resumoGerado} onChange={(event) => setResumoGerado(event.target.value)} />
                  </div>
                  <Alert>
                    <ShieldCheck className="h-4 w-4" />
                    <AlertTitle>Revisão profissional obrigatória</AlertTitle>
                    <AlertDescription>Confirme e ajuste o texto. Ele só será incluído no prontuário após o registro abaixo.</AlertDescription>
                  </Alert>
                  <Button disabled={!resumoGerado.trim() || registrarResumo.isPending} onClick={() => registrarResumo.mutate()}>
                    <Check className="h-4 w-4" />
                    {registrarResumo.isPending ? "Registrando…" : "Revisar e registrar no prontuário"}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Nova evolução clínica</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={4}
                placeholder="Descreva o atendimento realizado…"
                value={evolucao}
                onChange={(e) => setEvolucao(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Registros clínicos não podem ser excluídos. Correções devem ser feitas com um novo registro de retificação.
              </p>
              <Button disabled={!evolucao.trim() || addEvolucao.isPending} onClick={() => addEvolucao.mutate()}>
                <Plus className="mr-2 h-4 w-4" /> Registrar evolução
              </Button>
            </CardContent>
          </Card>
          <div className="mt-4 space-y-2">
            {dados.data?.evolucoes.map((e) => (
              <Card key={e.id}>
                <CardContent className="pt-6">
                  <p className="text-sm whitespace-pre-wrap">{e.texto}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {e.autor_nome ?? "—"} · {dataBR(e.created_at)} {horaBR(e.created_at)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documentos">
          <DocumentosPaciente paciente={p} />
        </TabsContent>

        <TabsContent value="especialidades">
          <Especialidades pacienteId={id} />
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader><CardTitle className="text-base">Linha do tempo</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {dados.data?.agendamentos.map((a) => (
                <div key={a.id} className="flex justify-between rounded-md border p-2">
                  <span>{dataBR(a.inicio)} {horaBR(a.inicio)} · {a.procedimentos?.nome ?? "Consulta"} · {a.profissionais?.nome ?? "—"}</span>
                  <Badge variant="secondary">{a.status}</Badge>
                </div>
              ))}
              {dados.data?.recebimentos.map((r) => (
                <div key={r.id} className="flex justify-between rounded-md border p-2">
                  <span>{dataBR(r.vencimento)} · {r.descricao} ({r.parcela}/{r.total_parcelas})</span>
                  <span>{brl(Number(r.valor))} · {r.status}</span>
                </div>
              ))}
              {(dados.data?.agendamentos.length ?? 0) + (dados.data?.recebimentos.length ?? 0) === 0 && (
                <p className="text-muted-foreground">Sem histórico ainda.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arquivos">
          <ArquivosPaciente pacienteId={id} />
        </TabsContent>

        <TabsContent value="dados">
          <PacienteDados paciente={p} />
          <AnamnesePaciente pacienteId={id} />
        </TabsContent>
        </div>
      </Tabs>

      <Dialog open={!!denteSel} onOpenChange={(v) => !v && setDenteSel(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Dente {denteSel}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Face</Label>
              <Select value={marca.face} onValueChange={(v) => setMarca({ ...marca, face: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FACES.map((f) => (<SelectItem key={f.valor} value={f.valor}>{f.rotulo}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Condição</Label>
              <Select value={marca.condicao} onValueChange={(v) => setMarca({ ...marca, condicao: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDICOES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Procedimento planejado</Label>
              <Select value={marca.procedimento_id} onValueChange={(v) => setMarca({ ...marca, procedimento_id: v })}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {dados.data?.procedimentos.map((pr) => (
                    <SelectItem key={pr.id} value={pr.id}>{pr.nome} — {brl(Number(pr.valor))}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Situação</Label>
              <Select value={marca.status} onValueChange={(v) => setMarca({ ...marca, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="existente">Condição existente</SelectItem>
                  <SelectItem value="planejado">Planejado</SelectItem>
                  <SelectItem value="em_execucao">Em execução</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Input value={marca.observacao} onChange={(e) => setMarca({ ...marca, observacao: e.target.value })} />
            </div>
            <Button onClick={() => addMarcacao.mutate()} disabled={addMarcacao.isPending}>Salvar marcação</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p>{valor || "—"}</p>
    </div>
  );
}
