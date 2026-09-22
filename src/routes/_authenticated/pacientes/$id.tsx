import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, FileText, Plus, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { AppShell } from "@/components/app-shell";
import { Odontograma, FACES, CONDICOES, type Marcacao } from "@/components/odontograma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brl, dataBR, horaBR, isoDia } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/pacientes/$id")({
  head: () => ({
    meta: [
      { title: "Prontuário do paciente | OdontoGestor" },
      { name: "description", content: "Prontuário com odontograma interativo, orçamentos, evolução clínica e documentos." },
      { property: "og:title", content: "Prontuário do paciente | OdontoGestor" },
      { property: "og:description", content: "Odontograma interativo, orçamentos, evolução clínica e documentos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Prontuario,
});

function Prontuario() {
  const { id } = Route.useParams();
  const { data: sessao } = useSessao();
  const clinicaId = sessao?.clinicaId;
  const queryClient = useQueryClient();

  const [decidua, setDecidua] = useState(false);
  const [denteSel, setDenteSel] = useState<string | null>(null);
  const [marca, setMarca] = useState({ face: "oclusal", condicao: "Cárie", procedimento_id: "", status: "planejado", observacao: "" });
  const [evolucao, setEvolucao] = useState("");
  const [doc, setDoc] = useState({ tipo: "atestado", titulo: "", conteudo: "" });

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
      const planejadas = (dados.data?.marcacoes ?? []).filter(
        (m) => m.ativo && m.status === "planejado" && (m as unknown as { procedimento_id: string | null }).procedimento_id && !(m as unknown as { orcamento_id: string | null }).orcamento_id,
      );
      if (planejadas.length === 0) throw new Error("Marque procedimentos planejados no odontograma primeiro.");

      const versao = (dados.data?.orcamentos?.[0]?.versao ?? 0) + 1;
      const itens = planejadas.map((m) => {
        const raw = m as unknown as { procedimento_id: string };
        const proc = dados.data!.procedimentos.find((x) => x.id === raw.procedimento_id)!;
        return {
          procedimento_id: proc.id,
          descricao: `${proc.nome} — dente ${m.dente}`,
          dente: m.dente,
          faces: m.face ? [m.face] : null,
          quantidade: 1,
          valor_unitario: Number(proc.valor),
        };
      });
      const totalValor = itens.reduce((s, i) => s + i.valor_unitario, 0);

      const { data: orc, error } = await supabase
        .from("orcamentos")
        .insert({ clinica_id: clinicaId!, paciente_id: id, versao, valor_total: totalValor, created_by: sessao?.user.id })
        .select().single();
      if (error || !orc) throw error;

      await supabase.from("orcamento_itens").insert(itens.map((i) => ({ ...i, clinica_id: clinicaId!, orcamento_id: orc.id })));
      await supabase.from("odontograma_marcacoes").update({ orcamento_id: orc.id })
        .in("id", planejadas.map((m) => m.id));
    },
    onSuccess: () => {
      toast.success("Orçamento gerado a partir do odontograma.");
      queryClient.invalidateQueries({ queryKey: ["prontuario", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const aprovar = useMutation({
    mutationFn: async ({ orcamentoId, parcelas }: { orcamentoId: string; parcelas: number }) => {
      const orc = dados.data?.orcamentos.find((o) => o.id === orcamentoId);
      if (!orc) throw new Error("Orçamento não encontrado");
      const valorTotal = Number(orc.valor_total) - Number(orc.desconto);
      const valorParcela = Math.round((valorTotal / parcelas) * 100) / 100;

      const lancamentos = Array.from({ length: parcelas }, (_, i) => {
        const venc = new Date();
        venc.setMonth(venc.getMonth() + i);
        return {
          clinica_id: clinicaId!,
          paciente_id: id,
          orcamento_id: orcamentoId,
          descricao: `Orçamento v${orc.versao} — tratamento odontológico`,
          parcela: i + 1,
          total_parcelas: parcelas,
          valor: valorParcela,
          vencimento: isoDia(venc),
          forma_pagamento: "A definir",
        };
      });
      await supabase.from("financeiro_recebimentos").insert(lancamentos);
      await supabase.from("orcamentos").update({ status: "aprovado" }).eq("id", orcamentoId);
      await supabase.from("auditoria_logs").insert({
        clinica_id: clinicaId!, usuario_id: sessao?.user.id, usuario_nome: sessao?.profile?.nome,
        acao: "aprovou orçamento e gerou parcelas", tabela: "orcamentos", registro_id: orcamentoId,
      });
    },
    onSuccess: () => {
      toast.success("Orçamento aprovado e parcelas geradas no financeiro.");
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
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

  const emitirDoc = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("documentos_emitidos").insert({
        clinica_id: clinicaId!,
        paciente_id: id,
        tipo: doc.tipo,
        titulo: doc.titulo,
        conteudo: doc.conteudo,
        autor_id: sessao?.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDoc({ tipo: "atestado", titulo: "", conteudo: "" });
      toast.success("Documento emitido e registrado no histórico.");
      queryClient.invalidateQueries({ queryKey: ["prontuario", id] });
    },
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
      <Link to="/pacientes" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar para pacientes
      </Link>

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

      <Tabs defaultValue="odontograma">
        <TabsList className="flex-wrap">
          <TabsTrigger value="odontograma">Odontograma</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução clínica</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="dados">Dados e anamnese</TabsTrigger>
        </TabsList>

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
          <div className="space-y-4">
            {(dados.data?.orcamentos ?? []).length === 0 ? (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
                Nenhum orçamento. Gere um a partir do odontograma.
              </CardContent></Card>
            ) : (
              dados.data?.orcamentos.map((o) => (
                <Card key={o.id}>
                  <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">
                      Orçamento v{o.versao} · {brl(Number(o.valor_total))}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={o.status === "aprovado" ? "default" : "secondary"}>{o.status}</Badge>
                      {o.status === "pendente" && (
                        <AprovarOrcamento onAprovar={(parcelas) => aprovar.mutate({ orcamentoId: o.id, parcelas })} />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    {o.orcamento_itens.map((i) => (
                      <div key={i.id} className="flex justify-between border-b py-1 last:border-0">
                        <span>{i.descricao}</span>
                        <span>{brl(Number(i.valor_unitario))}</span>
                      </div>
                    ))}
                    <p className="pt-2 text-xs text-muted-foreground">Criado em {dataBR(o.created_at)}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="evolucao">
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
          <Card>
            <CardHeader><CardTitle className="text-base">Emitir documento</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={doc.tipo} onValueChange={(v) => setDoc({ ...doc, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="atestado">Atestado</SelectItem>
                      <SelectItem value="receituario">Receituário</SelectItem>
                      <SelectItem value="orientacao">Orientação pós-operatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={doc.titulo} onChange={(e) => setDoc({ ...doc, titulo: e.target.value })} />
                </div>
              </div>
              <Textarea
                rows={5}
                placeholder={`Atesto para os devidos fins que ${p.nome} esteve em atendimento odontológico nesta data…`}
                value={doc.conteudo}
                onChange={(e) => setDoc({ ...doc, conteudo: e.target.value })}
              />
              <Button disabled={!doc.titulo || !doc.conteudo} onClick={() => emitirDoc.mutate()}>
                <FileText className="mr-2 h-4 w-4" /> Emitir e registrar
              </Button>
            </CardContent>
          </Card>
          <div className="mt-4 space-y-2">
            {dados.data?.documentos.map((d) => (
              <Card key={d.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{d.titulo}</p>
                    <Badge variant="secondary">{d.tipo}</Badge>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{d.conteudo}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{dataBR(d.created_at)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
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

        <TabsContent value="dados">
          <Card>
            <CardHeader><CardTitle className="text-base">Dados cadastrais</CardTitle></CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <Info rotulo="CPF" valor={p.cpf} />
              <Info rotulo="E-mail" valor={p.email} />
              <Info rotulo="Endereço" valor={[p.endereco, p.cidade, p.estado].filter(Boolean).join(", ")} />
              <Info rotulo="Responsável financeiro" valor={p.responsavel_nome} />
              <Info rotulo="Carteirinha" valor={p.numero_carteirinha} />
              <Info rotulo="Consentimento LGPD" valor={p.consentimento_lgpd ? dataBR(p.consentimento_data) : "pendente"} />
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base">Anamnese</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {Object.entries((p.anamnese ?? {}) as Record<string, string>).length === 0 ? (
                <p className="text-muted-foreground">Anamnese não preenchida.</p>
              ) : (
                Object.entries((p.anamnese ?? {}) as Record<string, string>).map(([k, v]) => (
                  <div key={k}>
                    <p className="font-medium">{k}</p>
                    <p className="text-muted-foreground">{v || "—"}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
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

function AprovarOrcamento({ onAprovar }: { onAprovar: (parcelas: number) => void }) {
  const [aberto, setAberto] = useState(false);
  const [parcelas, setParcelas] = useState("1");
  return (
    <>
      <Button size="sm" onClick={() => setAberto(true)}>Aprovar</Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader><DialogTitle>Aprovar orçamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Número de parcelas</Label>
              <Input type="number" min={1} max={24} value={parcelas} onChange={(e) => setParcelas(e.target.value)} />
            </div>
            <p className="text-sm text-muted-foreground">
              As parcelas serão geradas automaticamente em contas a receber, com vencimento mensal.
            </p>
            <Button onClick={() => { onAprovar(Number(parcelas) || 1); setAberto(false); }}>
              Aprovar e gerar parcelas
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
