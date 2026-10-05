import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, PackageCheck, Plus, Send, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { mensagemErro } from "@/lib/erros";
import { brl } from "@/lib/format";
import { CancelarComMotivo } from "@/components/cancelar-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { baixarCSV, dataCurta, diaISO, qtd, somarDias, useBaseEstoque, usePodeGerirEstoque } from "./comum";

const STATUS_PEDIDO: Record<string, string> = {
  rascunho: "Rascunho", enviado: "Enviado", recebido_parcial: "Recebido parcial", recebido: "Recebido", cancelado: "Cancelado",
};

function useInval() {
  const qc = useQueryClient();
  return () => ["estoque", "estoque-base", "estoque-alertas", "estoque-lotes", "estoque-itens", "estoque-mov", "compras", "sugestao", "inventarios"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

/* ---------------- Compras ---------------- */
type Linha = { item_id: string; quantidade: string; custo_unitario: string };

export function ComprasEstoque() {
  const { data: sessao } = useSessao();
  const gerir = usePodeGerirEstoque();
  const base = useBaseEstoque();
  const inval = useInval();
  const [novo, setNovo] = useState<null | { fornecedor: string; unidade: string; previsao: string; obs: string; linhas: Linha[] }>(null);
  const [receber, setReceber] = useState<null | { pedido: Pedido; nota: string; vencimento: string; linhas: Record<string, { quantidade: string; lote: string; validade: string; custo: string }> }>(null);

  const pedidos = useQuery({
    enabled: !!sessao?.clinicaId,
    queryKey: ["compras"],
    queryFn: async () => (await supabase.from("pedidos_compra").select("*,fornecedores(razao_social,nome_fantasia),unidades(nome),pedido_compra_itens(*,estoque_itens(nome,unidade_compra,unidade_medida,fator_conversao))")
      .order("created_at", { ascending: false }).limit(50)).data ?? [],
  });
  type Pedido = NonNullable<typeof pedidos.data>[number];
  const sugestao = useQuery({
    enabled: !!sessao?.clinicaId,
    queryKey: ["sugestao"],
    queryFn: async () => { const { data, error } = await supabase.rpc("sugestao_compra"); if (error) throw error; return data ?? []; },
  });

  const exec = useMutation({
    mutationFn: async (f: () => PromiseLike<{ error: unknown }>) => { const { error } = await f(); if (error) throw error; },
    onSuccess: () => { toast.success("Compras atualizadas."); setNovo(null); setReceber(null); inval(); },
    onError: (e) => toast.error(mensagemErro(e)),
  });
  const itemDe = (id: string) => base.data?.itens.find((i) => i.id === id);

  const usarSugestao = () => {
    const s = sugestao.data ?? [];
    const forn = s.find((x) => x.fornecedor_id)?.fornecedor_id ?? "";
    setNovo({
      fornecedor: forn, unidade: sessao?.profile?.unidade_id ?? "", previsao: "", obs: "Gerado pela sugestão automática",
      linhas: s.filter((x) => !forn || x.fornecedor_id === forn || !x.fornecedor_id).map((x) => {
        const fator = Number(itemDe(x.item_id)?.fator_conversao ?? 1);
        return { item_id: x.item_id, quantidade: String(Math.max(Math.ceil(Number(x.sugerido) / fator), 1)), custo_unitario: String(Number(x.custo_medio) * fator) };
      }),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">Sugestão automática de compra ({sugestao.data?.length ?? 0})</CardTitle>
          {gerir && (sugestao.data?.length ?? 0) > 0 && <Button size="sm" variant="outline" onClick={usarSugestao}>Criar pedido com a sugestão</Button>}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {sugestao.data?.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Saldo válido</TableHead><TableHead className="text-right">Mínimo</TableHead>
                <TableHead className="text-right">Consumo/dia (90d)</TableHead><TableHead>Fornecedor · prazo</TableHead><TableHead className="text-right">Sugerido</TableHead></TableRow></TableHeader>
              <TableBody>
                {sugestao.data.map((s) => (
                  <TableRow key={s.item_id}>
                    <TableCell className="font-medium">{s.nome}</TableCell>
                    <TableCell className="text-right">{qtd(s.saldo)} {s.unidade_medida}</TableCell>
                    <TableCell className="text-right">{qtd(s.estoque_minimo)}</TableCell>
                    <TableCell className="text-right">{qtd(s.consumo_diario)}</TableCell>
                    <TableCell className="text-xs">{s.fornecedor ?? "sem fornecedor padrão"} · {s.prazo_dias} dias</TableCell>
                    <TableCell className="text-right font-semibold">{qtd(s.sugerido)} {s.unidade_medida}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-sm text-muted-foreground">Nenhum item precisa de reposição agora.</p>}
          <p className="pt-2 text-xs text-muted-foreground">Cálculo: mínimo + consumo médio diário × (prazo do fornecedor + 30 dias) − saldo válido.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Pedidos de compra</CardTitle>
          {gerir && <Button onClick={() => setNovo({ fornecedor: "", unidade: sessao?.profile?.unidade_id ?? "", previsao: "", obs: "", linhas: [{ item_id: "", quantidade: "1", custo_unitario: "" }] })}><Plus className="mr-1 h-4 w-4" /> Novo pedido</Button>}
        </CardHeader>
        <CardContent className="space-y-3">
          {!pedidos.data?.length && <p className="text-sm text-muted-foreground">Nenhum pedido.</p>}
          {pedidos.data?.map((p) => {
            const total = p.pedido_compra_itens.reduce((t, i) => t + Number(i.quantidade) * Number(i.custo_unitario), 0);
            return (
              <div key={p.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">Pedido #{p.numero} · {p.fornecedores?.nome_fantasia ?? p.fornecedores?.razao_social}</p>
                    <p className="text-xs text-muted-foreground">{dataCurta(p.created_at)}{p.unidades ? ` · ${p.unidades.nome}` : ""}{p.previsao_entrega ? ` · previsão ${dataCurta(p.previsao_entrega)}` : ""} · {brl(total)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={p.status === "cancelado" ? "destructive" : p.status === "recebido" ? "default" : "secondary"}>{STATUS_PEDIDO[p.status]}</Badge>
                    {gerir && p.status === "rascunho" && <Button size="sm" variant="outline" onClick={() => exec.mutate(() => supabase.rpc("atualizar_status_pedido", { p_pedido: p.id, p_status: "enviado" }))}><Send className="mr-1 h-4 w-4" /> Marcar enviado</Button>}
                    {gerir && ["rascunho", "enviado", "recebido_parcial"].includes(p.status) && (
                      <Button size="sm" onClick={() => setReceber({
                        pedido: p, nota: "", vencimento: somarDias(30),
                        linhas: Object.fromEntries(p.pedido_compra_itens.map((i) => [i.id, { quantidade: String(Number(i.quantidade) - Number(i.quantidade_recebida)), lote: "", validade: "", custo: String(i.custo_unitario) }])),
                      })}><PackageCheck className="mr-1 h-4 w-4" /> Receber</Button>
                    )}
                    {gerir && ["rascunho", "enviado"].includes(p.status) && (
                      <CancelarComMotivo titulo={`Cancelar pedido #${p.numero}`} descricao="O pedido será mantido no histórico como cancelado." pendente={exec.isPending}
                        onConfirmar={(motivo) => exec.mutate(() => supabase.rpc("atualizar_status_pedido", { p_pedido: p.id, p_status: "cancelado", p_motivo: motivo }))} />
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.pedido_compra_itens.map((i) => (
                    <p key={i.id}>{i.estoque_itens?.nome}: {qtd(i.quantidade_recebida)}/{qtd(i.quantidade)} {i.estoque_itens?.unidade_compra ?? i.estoque_itens?.unidade_medida} × {brl(Number(i.custo_unitario))}</p>
                  ))}
                  {p.cancelado_motivo && <p className="text-destructive">Motivo do cancelamento: {p.cancelado_motivo}</p>}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {novo && (
        <Dialog open onOpenChange={(o) => !o && setNovo(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader><DialogTitle>Novo pedido de compra</DialogTitle></DialogHeader>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1"><Label>Fornecedor</Label>
                <Select value={novo.fornecedor} onValueChange={(v) => setNovo({ ...novo, fornecedor: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{base.data?.fornecedores.filter((f) => f.ativo).map((f) => <SelectItem key={f.id} value={f.id}>{f.nome_fantasia ?? f.razao_social}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-1"><Label>Unidade de entrega</Label>
                <Select value={novo.unidade} onValueChange={(v) => setNovo({ ...novo, unidade: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{base.data?.unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-1"><Label htmlFor="pc-prev">Previsão de entrega</Label><Input id="pc-prev" type="date" value={novo.previsao} onChange={(e) => setNovo({ ...novo, previsao: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Quantidade e custo na unidade de compra do item (ex.: caixa).</p>
              {novo.linhas.map((l, k) => {
                const it = itemDe(l.item_id);
                return (
                  <div key={k} className="grid grid-cols-[1fr_90px_110px_36px] items-end gap-2">
                    <Select value={l.item_id} onValueChange={(v) => setNovo({ ...novo, linhas: novo.linhas.map((x, j) => (j === k ? { ...x, item_id: v, custo_unitario: x.custo_unitario || String(Number(itemDe(v)?.custo_medio ?? 0) * Number(itemDe(v)?.fator_conversao ?? 1)) } : x)) })}>
                      <SelectTrigger aria-label="Item"><SelectValue placeholder="Item" /></SelectTrigger>
                      <SelectContent>{base.data?.itens.filter((i) => i.ativo).map((i) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" step="0.001" aria-label={`Quantidade (${it?.unidade_compra ?? it?.unidade_medida ?? ""})`} value={l.quantidade} onChange={(e) => setNovo({ ...novo, linhas: novo.linhas.map((x, j) => (j === k ? { ...x, quantidade: e.target.value } : x)) })} />
                    <Input type="number" step="0.01" aria-label="Custo unitário" placeholder="R$" value={l.custo_unitario} onChange={(e) => setNovo({ ...novo, linhas: novo.linhas.map((x, j) => (j === k ? { ...x, custo_unitario: e.target.value } : x)) })} />
                    <Button size="icon" variant="ghost" aria-label="Remover linha" onClick={() => setNovo({ ...novo, linhas: novo.linhas.filter((_, j) => j !== k) })}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                );
              })}
              <Button size="sm" variant="outline" onClick={() => setNovo({ ...novo, linhas: [...novo.linhas, { item_id: "", quantidade: "1", custo_unitario: "" }] })}>Adicionar item</Button>
            </div>
            <Textarea placeholder="Observações" value={novo.obs} onChange={(e) => setNovo({ ...novo, obs: e.target.value })} aria-label="Observações" />
            <p className="text-right text-sm font-semibold">Total {brl(novo.linhas.reduce((t, l) => t + Number(l.quantidade || 0) * Number(l.custo_unitario || 0), 0))}</p>
            <Button disabled={!novo.fornecedor || !novo.linhas.some((l) => l.item_id) || exec.isPending} onClick={() => exec.mutate(() => supabase.rpc("criar_pedido_compra", {
              p_fornecedor: novo.fornecedor, p_unidade: (novo.unidade || null) as never, p_previsao: (novo.previsao || null) as never, p_observacao: novo.obs,
              p_itens: novo.linhas.filter((l) => l.item_id).map((l) => ({ item_id: l.item_id, quantidade: Number(l.quantidade), custo_unitario: Number(l.custo_unitario) || 0 })),
            }))}>Salvar pedido (rascunho)</Button>
          </DialogContent>
        </Dialog>
      )}

      {receber && (
        <Dialog open onOpenChange={(o) => !o && setReceber(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader><DialogTitle>Receber pedido #{receber.pedido.numero}</DialogTitle></DialogHeader>
            <p className="text-xs text-muted-foreground">Os lotes entram no estoque e a conta a pagar é criada para o fornecedor, tudo de uma vez. Deixe 0 nos itens que não chegaram.</p>
            <div className="space-y-2">
              {receber.pedido.pedido_compra_itens.filter((i) => Number(i.quantidade_recebida) < Number(i.quantidade)).map((i) => {
                const l = receber.linhas[i.id];
                const set = (p: Partial<typeof l>) => setReceber({ ...receber, linhas: { ...receber.linhas, [i.id]: { ...l, ...p } } });
                return (
                  <div key={i.id} className="grid gap-2 rounded-md border p-2 sm:grid-cols-5">
                    <p className="text-sm font-medium sm:col-span-5">{i.estoque_itens?.nome} <span className="text-xs text-muted-foreground">(1 {i.estoque_itens?.unidade_compra ?? "un. compra"} = {qtd(i.estoque_itens?.fator_conversao)} {i.estoque_itens?.unidade_medida})</span></p>
                    <Input type="number" step="0.001" aria-label="Quantidade recebida" value={l.quantidade} onChange={(e) => set({ quantidade: e.target.value })} />
                    <Input placeholder="Nº lote" aria-label="Número do lote" value={l.lote} onChange={(e) => set({ lote: e.target.value })} />
                    <Input type="date" aria-label="Validade" value={l.validade} onChange={(e) => set({ validade: e.target.value })} />
                    <Input type="number" step="0.01" aria-label="Custo unitário" value={l.custo} onChange={(e) => set({ custo: e.target.value })} />
                    <span className="self-center text-right text-sm">{brl(Number(l.quantidade || 0) * Number(l.custo || 0))}</span>
                  </div>
                );
              })}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1"><Label htmlFor="rc-nf">Nota fiscal</Label><Input id="rc-nf" value={receber.nota} onChange={(e) => setReceber({ ...receber, nota: e.target.value })} /></div>
              <div className="space-y-1"><Label htmlFor="rc-v">Vencimento da conta a pagar</Label><Input id="rc-v" type="date" value={receber.vencimento} onChange={(e) => setReceber({ ...receber, vencimento: e.target.value })} /></div>
            </div>
            <Button disabled={exec.isPending} onClick={() => exec.mutate(() => supabase.rpc("receber_pedido", {
              p_pedido: receber.pedido.id, p_nota: receber.nota, p_vencimento: receber.vencimento || (null as never),
              p_itens: Object.entries(receber.linhas).filter(([, l]) => Number(l.quantidade) > 0).map(([id, l]) => ({
                pedido_item_id: id, quantidade: Number(l.quantidade), numero_lote: l.lote, validade: l.validade || null, custo_unitario: Number(l.custo) || 0,
              })),
            }))}>Confirmar recebimento</Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* ---------------- Inventário ---------------- */
export function InventarioEstoque() {
  const { data: sessao } = useSessao();
  const gerir = usePodeGerirEstoque();
  const base = useBaseEstoque();
  const inval = useInval();
  const [unidade, setUnidade] = useState("todas");
  const [sel, setSel] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const invs = useQuery({
    enabled: !!sessao?.clinicaId,
    queryKey: ["inventarios"],
    queryFn: async () => (await supabase.from("inventarios").select("*,unidades(nome)").order("created_at", { ascending: false }).limit(20)).data ?? [],
  });
  const atual = sel ?? invs.data?.find((i) => i.status === "aberto")?.id ?? null;
  const itens = useQuery({
    enabled: !!atual,
    queryKey: ["inventarios", "itens", atual],
    queryFn: async () => (await supabase.from("inventario_itens").select("*,estoque_itens(nome,unidade_medida),estoque_lotes(numero_lote,validade)").eq("inventario_id", atual!).order("item_id")).data ?? [],
  });
  const inv = invs.data?.find((i) => i.id === atual);
  const exec = useMutation({
    mutationFn: async (f: () => PromiseLike<{ data?: unknown; error: unknown }>) => { const { data, error } = await f(); if (error) throw error; return data; },
    onSuccess: () => inval(),
    onError: (e) => toast.error(mensagemErro(e)),
  });
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">Inventários</CardTitle>
          {gerir && (
            <div className="flex gap-2">
              <Select value={unidade} onValueChange={setUnidade}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todas">Todas as unidades</SelectItem>{base.data?.unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}</SelectContent>
              </Select>
              <Button onClick={() => exec.mutate(() => supabase.rpc("abrir_inventario", { p_unidade: (unidade === "todas" ? null : unidade) as never }), { onSuccess: (id) => { setSel(id as string); toast.success("Inventário aberto com o saldo atual de cada lote."); } })}>Abrir inventário</Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {invs.data?.map((i) => (
            <Button key={i.id} size="sm" variant={i.id === atual ? "default" : "outline"} onClick={() => setSel(i.id)}>
              {dataCurta(i.created_at)} · {i.unidades?.nome ?? "Todas"} · {i.status}
            </Button>
          ))}
          {!invs.data?.length && <p className="text-sm text-muted-foreground">Nenhum inventário realizado.</p>}
        </CardContent>
      </Card>
      {inv && (
        <Card>
          <CardHeader><CardTitle className="text-base">Contagem — {inv.unidades?.nome ?? "todas as unidades"} ({inv.status})</CardTitle></CardHeader>
          <CardContent className="space-y-3 overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Lote</TableHead><TableHead className="text-right">Sistema</TableHead><TableHead className="w-32">Contado</TableHead><TableHead className="text-right">Diferença</TableHead></TableRow></TableHeader>
              <TableBody>
                {itens.data?.map((ii) => (
                  <TableRow key={ii.id}>
                    <TableCell>{ii.estoque_itens?.nome}</TableCell>
                    <TableCell className="text-xs">{ii.estoque_lotes?.numero_lote ?? "s/n"} · {dataCurta(ii.estoque_lotes?.validade)}</TableCell>
                    <TableCell className="text-right">{qtd(ii.quantidade_sistema)} {ii.estoque_itens?.unidade_medida}</TableCell>
                    <TableCell>
                      {inv.status === "aberto" && gerir ? (
                        <Input type="number" step="0.001" min={0} aria-label={`Contagem ${ii.estoque_itens?.nome}`} defaultValue={ii.quantidade_contada ?? ""}
                          onBlur={(e) => { const v = e.target.value; if (v !== String(ii.quantidade_contada ?? "")) exec.mutate(() => supabase.rpc("registrar_contagem", { p_inventario_item: ii.id, p_quantidade: (v === "" ? null : Number(v)) as never })); }} />
                      ) : qtd(ii.quantidade_contada)}
                    </TableCell>
                    <TableCell className={`text-right ${Number(ii.diferenca) < 0 ? "text-destructive" : Number(ii.diferenca) > 0 ? "text-primary" : ""}`}>{ii.quantidade_contada === null ? "—" : qtd(ii.diferenca)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {inv.status === "aberto" && gerir && (
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 space-y-1"><Label htmlFor="inv-m">Motivo dos ajustes</Label><Input id="inv-m" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: inventário mensal" /></div>
                <Button disabled={motivo.trim().length < 3 || exec.isPending} onClick={() => exec.mutate(() => supabase.rpc("finalizar_inventario", { p_inventario: inv.id, p_motivo: motivo }), { onSuccess: (n) => { toast.success(`Inventário finalizado: ${n} ajuste(s) aplicado(s).`); setMotivo(""); } })}>Finalizar e aplicar ajustes</Button>
              </div>
            )}
            {inv.motivo && <p className="text-xs text-muted-foreground">Motivo: {inv.motivo}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ---------------- Relatórios ---------------- */
export function RelatoriosEstoque() {
  return (
    <Tabs defaultValue="consumo">
      <TabsList className="mb-4 flex h-auto flex-wrap">
        <TabsTrigger value="consumo">Consumo</TabsTrigger>
        <TabsTrigger value="custo">Custo por procedimento</TabsTrigger>
        <TabsTrigger value="posicao">Posição valorizada</TabsTrigger>
        <TabsTrigger value="rastreio">Rastreio de lote</TabsTrigger>
      </TabsList>
      <TabsContent value="consumo"><RelConsumo /></TabsContent>
      <TabsContent value="custo"><RelCusto /></TabsContent>
      <TabsContent value="posicao"><RelPosicao /></TabsContent>
      <TabsContent value="rastreio"><RelRastreio /></TabsContent>
    </Tabs>
  );
}

function Periodo({ de, ate, onChange }: { de: string; ate: string; onChange: (de: string, ate: string) => void }) {
  return (
    <>
      <Input type="date" className="w-36" value={de} onChange={(e) => onChange(e.target.value, ate)} aria-label="De" />
      <Input type="date" className="w-36" value={ate} onChange={(e) => onChange(de, e.target.value)} aria-label="Até" />
    </>
  );
}

function RelConsumo() {
  const [de, setDe] = useState(diaISO(new Date(Date.now() - 30 * 86400000)));
  const [ate, setAte] = useState(diaISO());
  const [por, setPor] = useState<"procedimento" | "profissional" | "unidade" | "item">("procedimento");
  const q = useQuery({
    queryKey: ["estoque-mov", "rel-consumo", de, ate],
    queryFn: async () => (await supabase.from("estoque_movimentacoes").select("delta,custo_total,item_id,estoque_itens(nome,unidade_medida),procedimentos(nome),profissionais(nome),unidades(nome)")
      .eq("tipo_mov", "saida_uso").gte("created_at", de + "T00:00:00").lte("created_at", ate + "T23:59:59").limit(5000)).data ?? [],
  });
  const linhas = useMemo(() => {
    const m = new Map<string, { chave: string; qtd: number; custo: number; n: number }>();
    for (const r of q.data ?? []) {
      const chave = por === "procedimento" ? r.procedimentos?.nome ?? "Sem procedimento" : por === "profissional" ? r.profissionais?.nome ?? "Sem profissional"
        : por === "unidade" ? r.unidades?.nome ?? "Sem unidade" : `${r.estoque_itens?.nome} (${r.estoque_itens?.unidade_medida})`;
      const x = m.get(chave) ?? { chave, qtd: 0, custo: 0, n: 0 };
      x.qtd += -Number(r.delta); x.custo += Number(r.custo_total); x.n++;
      m.set(chave, x);
    }
    return [...m.values()].sort((a, b) => b.custo - a.custo);
  }, [q.data, por]);
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Consumo em atendimentos</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Select value={por} onValueChange={(v) => setPor(v as typeof por)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="procedimento">Por procedimento</SelectItem><SelectItem value="profissional">Por profissional</SelectItem><SelectItem value="unidade">Por unidade</SelectItem><SelectItem value="item">Por item</SelectItem></SelectContent>
          </Select>
          <Periodo de={de} ate={ate} onChange={(a, b) => { setDe(a); setAte(b); }} />
          <Button variant="outline" onClick={() => baixarCSV(`consumo-por-${por}`, [[por, "movimentos", ...(por === "item" ? ["quantidade"] : []), "custo"], ...linhas.map((l) => [l.chave, l.n, ...(por === "item" ? [String(l.qtd).replace(".", ",")] : []), l.custo.toFixed(2).replace(".", ",")])])}><Download className="mr-1 h-4 w-4" /> CSV</Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead className="capitalize">{por}</TableHead><TableHead className="text-right">Movimentos</TableHead>{por === "item" && <TableHead className="text-right">Quantidade</TableHead>}<TableHead className="text-right">Custo</TableHead></TableRow></TableHeader>
          <TableBody>
            {linhas.map((l) => (
              <TableRow key={l.chave}><TableCell>{l.chave}</TableCell><TableCell className="text-right">{l.n}</TableCell>{por === "item" && <TableCell className="text-right">{qtd(l.qtd)}</TableCell>}<TableCell className="text-right">{brl(l.custo)}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
        {!linhas.length && <p className="py-6 text-center text-sm text-muted-foreground">Sem consumo no período.</p>}
      </CardContent>
    </Card>
  );
}

function RelCusto() {
  const [de, setDe] = useState(diaISO(new Date(Date.now() - 90 * 86400000)));
  const [ate, setAte] = useState(diaISO());
  const q = useQuery({
    queryKey: ["estoque-mov", "rel-custo", de, ate],
    queryFn: async () => { const { data, error } = await supabase.rpc("relatorio_custo_procedimentos", { p_inicio: de, p_fim: ate }); if (error) throw error; return data ?? []; },
  });
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Custo real de material por procedimento</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Periodo de={de} ate={ate} onChange={(a, b) => { setDe(a); setAte(b); }} />
          <Button variant="outline" onClick={() => baixarCSV("custo-material-procedimento", [["procedimento", "atendimentos", "custo_total", "custo_medio_real", "custo_estimado", "valor_cobrado"],
            ...(q.data ?? []).map((r) => [r.procedimento, r.atendimentos, r.custo_total, r.custo_medio, r.custo_estimado, r.valor].map((v) => String(v ?? "").replace(".", ",")))])}><Download className="mr-1 h-4 w-4" /> CSV</Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Procedimento</TableHead><TableHead className="text-right">Atendimentos</TableHead><TableHead className="text-right">Custo médio real</TableHead><TableHead className="text-right">Custo estimado</TableHead><TableHead className="text-right">Diferença</TableHead><TableHead className="text-right">Valor cobrado</TableHead></TableRow></TableHeader>
          <TableBody>
            {q.data?.map((r) => {
              const dif = Number(r.custo_medio) - Number(r.custo_estimado);
              return (
                <TableRow key={r.procedimento_id}>
                  <TableCell>{r.procedimento}</TableCell><TableCell className="text-right">{r.atendimentos}</TableCell>
                  <TableCell className="text-right">{brl(Number(r.custo_medio))}</TableCell><TableCell className="text-right">{brl(Number(r.custo_estimado))}</TableCell>
                  <TableCell className={`text-right ${dif > 0 ? "text-destructive" : "text-primary"}`}>{brl(dif)}</TableCell><TableCell className="text-right">{brl(Number(r.valor))}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {!q.data?.length && <p className="py-6 text-center text-sm text-muted-foreground">Sem atendimentos com baixa de insumos no período.</p>}
      </CardContent>
    </Card>
  );
}

function RelPosicao() {
  const base = useBaseEstoque();
  const q = useQuery({
    queryKey: ["estoque", "posicao"],
    queryFn: async () => (await supabase.from("estoque_saldos").select("*").gt("saldo", 0)).data ?? [],
  });
  const nome = (id: string | null, lista: { id: string; nome: string }[] | undefined) => lista?.find((x) => x.id === id)?.nome ?? "—";
  const total = (q.data ?? []).reduce((t, r) => t + Number(r.valor), 0);
  const linhas = (q.data ?? []).map((r) => ({ item: nome(r.item_id, base.data?.itens), unidade: nome(r.unidade_id, base.data?.unidades), saldo: Number(r.saldo), valor: Number(r.valor), validade: r.proxima_validade }))
    .sort((a, b) => a.item.localeCompare(b.item));
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Posição de estoque valorizada · {brl(total)}</CardTitle>
        <Button variant="outline" onClick={() => baixarCSV("posicao-estoque", [["item", "unidade", "saldo", "valor", "proxima_validade"], ...linhas.map((l) => [l.item, l.unidade, String(l.saldo).replace(".", ","), l.valor.toFixed(2).replace(".", ","), l.validade])])}><Download className="mr-1 h-4 w-4" /> CSV</Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Unidade</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Próx. validade</TableHead></TableRow></TableHeader>
          <TableBody>{linhas.map((l, k) => <TableRow key={k}><TableCell>{l.item}</TableCell><TableCell>{l.unidade}</TableCell><TableCell className="text-right">{qtd(l.saldo)}</TableCell><TableCell className="text-right">{brl(l.valor)}</TableCell><TableCell>{dataCurta(l.validade)}</TableCell></TableRow>)}</TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RelRastreio() {
  const [busca, setBusca] = useState("");
  const [lote, setLote] = useState<string | null>(null);
  const lotes = useQuery({
    enabled: busca.trim().length >= 2,
    queryKey: ["estoque-lotes", "busca", busca],
    queryFn: async () => (await supabase.from("estoque_lotes").select("id,numero_lote,validade,estoque_itens(nome)").ilike("numero_lote", `%${busca.trim().replace(/[%,]/g, "")}%`).limit(20)).data ?? [],
  });
  const aplic = useQuery({
    enabled: !!lote,
    queryKey: ["rastreio", lote],
    queryFn: async () => (await supabase.from("paciente_lotes_aplicados").select("*,pacientes(nome,telefone),procedimentos(nome),profissionais(nome),estoque_itens(nome)").eq("lote_id", lote!).order("aplicado_em", { ascending: false })).data ?? [],
  });
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Em quais pacientes este lote foi aplicado?</CardTitle>
        {aplic.data?.length ? <Button variant="outline" onClick={() => baixarCSV("rastreio-lote", [["data", "paciente", "telefone", "item", "procedimento", "profissional", "dente", "quantidade"],
          ...aplic.data!.map((a) => [new Date(a.aplicado_em).toLocaleString("pt-BR"), a.pacientes?.nome, a.pacientes?.telefone, a.estoque_itens?.nome, a.procedimentos?.nome, a.profissionais?.nome, a.dente, String(a.quantidade).replace(".", ",")])])}><Download className="mr-1 h-4 w-4" /> CSV</Button> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Digite o número do lote" value={busca} onChange={(e) => { setBusca(e.target.value); setLote(null); }} aria-label="Número do lote" className="max-w-sm" />
        <div className="flex flex-wrap gap-2">
          {lotes.data?.map((l) => <Button key={l.id} size="sm" variant={lote === l.id ? "default" : "outline"} onClick={() => setLote(l.id)}>{l.estoque_itens?.nome} · {l.numero_lote} · {dataCurta(l.validade)}</Button>)}
        </div>
        {lote && (aplic.data?.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Paciente</TableHead><TableHead>Procedimento</TableHead><TableHead>Profissional</TableHead><TableHead>Dente</TableHead><TableHead className="text-right">Qtd.</TableHead></TableRow></TableHeader>
            <TableBody>{aplic.data.map((a) => <TableRow key={a.id}><TableCell>{dataCurta(a.aplicado_em)}</TableCell><TableCell>{a.pacientes?.nome}</TableCell><TableCell>{a.procedimentos?.nome ?? "—"}</TableCell><TableCell>{a.profissionais?.nome ?? "—"}</TableCell><TableCell>{a.dente ?? "—"}</TableCell><TableCell className="text-right">{qtd(a.quantidade)}</TableCell></TableRow>)}</TableBody>
          </Table>
        ) : <p className="text-sm text-muted-foreground">Nenhuma aplicação registrada para este lote.</p>)}
      </CardContent>
    </Card>
  );
}
