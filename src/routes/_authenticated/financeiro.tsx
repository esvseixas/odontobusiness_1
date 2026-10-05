import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brl, dataBR, isoDia } from "@/lib/format";
import { mensagemErro } from "@/lib/erros";
import { CancelarComMotivo } from "@/components/cancelar-dialog";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro | OdontoGestor" },
      { name: "description", content: "Contas a receber e a pagar, fluxo de caixa, comissões e DRE simplificado." },
      { property: "og:title", content: "Financeiro | OdontoGestor" },
      { property: "og:description", content: "Contas a receber e a pagar, fluxo de caixa e DRE simplificado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Financeiro,
});

function Financeiro() {
  const { data: sessao } = useSessao();
  const clinicaId = sessao?.clinicaId;
  const queryClient = useQueryClient();
  const hoje = new Date();
  const [mes, setMes] = useState(isoDia(hoje).slice(0, 7));
  const [abrirDespesa, setAbrirDespesa] = useState(false);
  const [abrirReceita, setAbrirReceita] = useState(false);

  const inicio = `${mes}-01`;
  const fim = isoDia(new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0));

  const [despesa, setDespesa] = useState({ descricao: "", fornecedor: "", valor: "", vencimento: isoDia(hoje), conta_id: "" });
  const [receita, setReceita] = useState({ descricao: "", valor: "", vencimento: isoDia(hoje), forma: "PIX", paciente_id: "" });

  const dados = useQuery({
    enabled: !!clinicaId,
    queryKey: ["financeiro", clinicaId, mes],
    queryFn: async () => {
      const [receber, pagar, contas, pacientes, comissoes] = await Promise.all([
        supabase.from("financeiro_recebimentos").select("*,pacientes(nome)").gte("vencimento", inicio).lte("vencimento", fim).order("vencimento"),
        supabase.from("financeiro_pagamentos").select("*,plano_contas(nome)").gte("vencimento", inicio).lte("vencimento", fim).order("vencimento"),
        supabase.from("plano_contas").select("*").order("nome"),
        supabase.from("pacientes").select("id,nome").eq("ativo", true).order("nome"),
        supabase.from("financeiro_recebimentos").select("valor,status,profissionais(nome,comissao_percentual)").gte("vencimento", inicio).lte("vencimento", fim),
      ]);
      return {
        receber: receber.data ?? [],
        pagar: pagar.data ?? [],
        contas: contas.data ?? [],
        pacientes: pacientes.data ?? [],
        comissoes: comissoes.data ?? [],
      };
    },
  });

  const total = (rows: { valor: number; status: string }[] | undefined, status?: string) =>
    (rows ?? []).filter((r) => r.status !== "cancelado" && (!status || r.status === status)).reduce((s, r) => s + Number(r.valor), 0);

  const receitaRecebida = total(dados.data?.receber as never, "pago");
  const despesaPaga = total(dados.data?.pagar as never, "pago");
  const receitaPrevista = total(dados.data?.receber as never);
  const despesaPrevista = total(dados.data?.pagar as never);

  const comissoesPorProf = new Map<string, number>();
  for (const r of dados.data?.comissoes ?? []) {
    const p = (r as { profissionais?: { nome: string; comissao_percentual: number } }).profissionais;
    if (!p || r.status !== "pago") continue;
    comissoesPorProf.set(p.nome, (comissoesPorProf.get(p.nome) ?? 0) + Number(r.valor) * Number(p.comissao_percentual) / 100);
  }

  const quitar = useMutation({
    mutationFn: async ({ tabela, id }: { tabela: "financeiro_recebimentos" | "financeiro_pagamentos"; id: string }) => {
      const { error } = await supabase.from(tabela).update({ status: "pago", pago_em: isoDia(new Date()) }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lançamento quitado.");
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
    },
  });

  const cancelar = useMutation({
    mutationFn: async ({ tipo, id, motivo }: { tipo: "receber" | "pagar"; id: string; motivo: string; fechar: () => void }) => {
      const { error } = await supabase.rpc("cancelar_lancamento", { p_tipo: tipo, p_id: id, p_motivo: motivo });
      if (error) throw error;
    },
    onSuccess: (_, v) => { v.fechar(); toast.success("Lançamento cancelado."); queryClient.invalidateQueries({ queryKey: ["financeiro"] }); },
    onError: (e) => toast.error(mensagemErro(e)),
  });
  const podeCancelar = sessao?.tem("owner", "admin", "financeiro") ?? false;

  const criarDespesa = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("financeiro_pagamentos").insert({
        clinica_id: clinicaId!,
        descricao: despesa.descricao,
        fornecedor: despesa.fornecedor || null,
        valor: Number(despesa.valor),
        vencimento: despesa.vencimento,
        conta_id: despesa.conta_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setAbrirDespesa(false);
      setDespesa({ descricao: "", fornecedor: "", valor: "", vencimento: isoDia(hoje), conta_id: "" });
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
      toast.success("Conta a pagar registrada.");
    },
  });

  const criarReceita = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("financeiro_recebimentos").insert({
        clinica_id: clinicaId!,
        descricao: receita.descricao,
        valor: Number(receita.valor),
        vencimento: receita.vencimento,
        forma_pagamento: receita.forma,
        paciente_id: receita.paciente_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setAbrirReceita(false);
      setReceita({ descricao: "", valor: "", vencimento: isoDia(hoje), forma: "PIX", paciente_id: "" });
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
      toast.success("Conta a receber registrada.");
    },
  });

  function exportarCSV() {
    const linhas = [
      ["tipo", "descricao", "valor", "vencimento", "status"],
      ...(dados.data?.receber ?? []).map((r) => ["receita", r.descricao, r.valor, r.vencimento, r.status]),
      ...(dados.data?.pagar ?? []).map((r) => ["despesa", r.descricao, r.valor, r.vencimento, r.status]),
    ];
    const csv = linhas.map((l) => l.join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro-${mes}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <PageHeader
        titulo="Financeiro"
        descricao="Contas a receber e a pagar, fluxo de caixa, comissões e DRE."
        acao={
          <div className="flex flex-wrap gap-2">
            <Input type="month" className="w-40" value={mes} onChange={(e) => setMes(e.target.value)} />
            <Button variant="outline" onClick={exportarCSV}>Exportar CSV</Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: "Recebido no mês", v: brl(receitaRecebida) },
          { l: "Pago no mês", v: brl(despesaPaga) },
          { l: "Saldo realizado", v: brl(receitaRecebida - despesaPaga) },
          { l: "Saldo projetado", v: brl(receitaPrevista - despesaPrevista) },
        ].map((k) => (
          <Card key={k.l}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{k.l}</p>
              <p className="mt-1 text-2xl font-semibold">{k.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="receber" className="mt-6">
        <TabsList>
          <TabsTrigger value="receber">A receber</TabsTrigger>
          <TabsTrigger value="pagar">A pagar</TabsTrigger>
          <TabsTrigger value="dre">DRE e comissões</TabsTrigger>
        </TabsList>

        <TabsContent value="receber">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Contas a receber</CardTitle>
              <Dialog open={abrirReceita} onOpenChange={setAbrirReceita}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Lançar recebimento</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nova conta a receber</DialogTitle></DialogHeader>
                  <div className="grid gap-4">
                    <div className="space-y-2"><Label>Descrição</Label>
                      <Input value={receita.descricao} onChange={(e) => setReceita({ ...receita, descricao: e.target.value })} /></div>
                    <div className="space-y-2">
                      <Label>Paciente</Label>
                      <Select value={receita.paciente_id} onValueChange={(v) => setReceita({ ...receita, paciente_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                        <SelectContent>
                          {dados.data?.pacientes.map((p) => (<SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Valor</Label>
                      <Input type="number" step="0.01" value={receita.valor} onChange={(e) => setReceita({ ...receita, valor: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Vencimento</Label>
                      <Input type="date" value={receita.vencimento} onChange={(e) => setReceita({ ...receita, vencimento: e.target.value })} /></div>
                    <div className="space-y-2">
                      <Label>Forma de pagamento</Label>
                      <Select value={receita.forma} onValueChange={(v) => setReceita({ ...receita, forma: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Dinheiro", "PIX", "Cartão de crédito", "Cartão de débito", "Boleto", "Convênio"].map((f) => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={() => criarReceita.mutate()}>Salvar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-2">
              {(dados.data?.receber ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Nenhum lançamento neste mês.</p>
              ) : (
                dados.data?.receber.map((r) => {
                  const atrasado = r.status === "atrasado" || (r.status === "pendente" && r.vencimento < isoDia(hoje));
                  return (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">
                          {r.descricao}
                          {r.total_parcelas > 1 ? ` (${r.parcela}/${r.total_parcelas})` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.pacientes?.nome ?? "—"} · venc. {dataBR(r.vencimento)} · {r.forma_pagamento ?? "—"}
                        </p>
                        {r.status === "cancelado" && <p className="text-xs text-destructive">Cancelado: {r.cancelado_motivo}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{brl(Number(r.valor))}</span>
                        <Badge variant={r.status === "pago" ? "default" : atrasado ? "destructive" : r.status === "cancelado" ? "outline" : "secondary"}>
                          {atrasado ? "atrasado" : r.status}
                        </Badge>
                        {(r.status === "pendente" || r.status === "atrasado") && (
                          <Button size="sm" variant="outline" onClick={() => quitar.mutate({ tabela: "financeiro_recebimentos", id: r.id })}>
                            Receber
                          </Button>
                        )}
                        {podeCancelar && (r.status === "pendente" || r.status === "atrasado") && (
                          <CancelarComMotivo titulo="Cancelar recebimento" descricao={`${r.descricao} · ${brl(Number(r.valor))}`}
                            pendente={cancelar.isPending} onConfirmar={(motivo, fechar) => cancelar.mutate({ tipo: "receber", id: r.id, motivo, fechar })} />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagar">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Contas a pagar</CardTitle>
              <Dialog open={abrirDespesa} onOpenChange={setAbrirDespesa}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Nova despesa</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nova conta a pagar</DialogTitle></DialogHeader>
                  <div className="grid gap-4">
                    <div className="space-y-2"><Label>Descrição</Label>
                      <Input value={despesa.descricao} onChange={(e) => setDespesa({ ...despesa, descricao: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Fornecedor</Label>
                      <Input value={despesa.fornecedor} onChange={(e) => setDespesa({ ...despesa, fornecedor: e.target.value })} /></div>
                    <div className="space-y-2">
                      <Label>Categoria (plano de contas)</Label>
                      <Select value={despesa.conta_id} onValueChange={(v) => setDespesa({ ...despesa, conta_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {dados.data?.contas.filter((c) => c.tipo === "despesa").map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Valor</Label>
                      <Input type="number" step="0.01" value={despesa.valor} onChange={(e) => setDespesa({ ...despesa, valor: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Vencimento</Label>
                      <Input type="date" value={despesa.vencimento} onChange={(e) => setDespesa({ ...despesa, vencimento: e.target.value })} /></div>
                    <Button onClick={() => criarDespesa.mutate()}>Salvar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-2">
              {(dados.data?.pagar ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma despesa neste mês.</p>
              ) : (
                dados.data?.pagar.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{r.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.fornecedor ?? "—"} · {r.plano_contas?.nome ?? "sem categoria"} · venc. {dataBR(r.vencimento)}
                      </p>
                      {r.status === "cancelado" && <p className="text-xs text-destructive">Cancelado: {r.cancelado_motivo}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{brl(Number(r.valor))}</span>
                      <Badge variant={r.status === "pago" ? "default" : r.status === "cancelado" ? "outline" : "secondary"}>{r.status}</Badge>
                      {(r.status === "pendente" || r.status === "atrasado") && (
                        <Button size="sm" variant="outline" onClick={() => quitar.mutate({ tabela: "financeiro_pagamentos", id: r.id })}>
                          Pagar
                        </Button>
                      )}
                      {podeCancelar && (r.status === "pendente" || r.status === "atrasado") && (
                        <CancelarComMotivo titulo="Cancelar conta a pagar" descricao={`${r.descricao} · ${brl(Number(r.valor))}`}
                          pendente={cancelar.isPending} onConfirmar={(motivo, fechar) => cancelar.mutate({ tipo: "pagar", id: r.id, motivo, fechar })} />
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dre">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">DRE simplificado — {mes}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Linha rotulo="Receita bruta recebida" valor={receitaRecebida} />
                <Linha rotulo="Despesas operacionais pagas" valor={-despesaPaga} />
                <div className="border-t pt-2">
                  <Linha rotulo="Resultado líquido" valor={receitaRecebida - despesaPaga} forte />
                </div>
                <p className="pt-2 text-xs text-muted-foreground">
                  Regime tributário informado: {sessao?.clinica?.regime_tributario ?? "não informado"}.
                  Valores informativos, sem cálculo fiscal automático.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Comissões apuradas</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {comissoesPorProf.size === 0 ? (
                  <p className="text-muted-foreground">Nenhuma comissão apurada no período.</p>
                ) : (
                  [...comissoesPorProf.entries()].map(([nome, valor]) => (
                    <Linha key={nome} rotulo={nome} valor={valor} />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Linha({ rotulo, valor, forte }: { rotulo: string; valor: number; forte?: boolean }) {
  return (
    <div className={`flex justify-between ${forte ? "font-semibold" : ""}`}>
      <span>{rotulo}</span>
      <span className={valor < 0 ? "text-destructive" : ""}>{brl(valor)}</span>
    </div>
  );
}
