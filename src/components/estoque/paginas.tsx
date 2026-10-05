import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeftRight, Download, Pencil, Plus, SlidersHorizontal } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { mensagemErro } from "@/lib/erros";
import { brl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PainelAlertasEstoque } from "./alertas";
import { TIPO_MOV, baixarCSV, dataCurta, diaISO, qtd, useBaseEstoque, usePodeGerirEstoque } from "./comum";

const POR_PAGINA = 20;

export function Paginacao({ pagina, total, porPagina = POR_PAGINA, onPagina }: { pagina: number; total: number; porPagina?: number; onPagina: (p: number) => void }) {
  const ult = Math.max(Math.ceil(total / porPagina) - 1, 0);
  return (
    <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
      <span>{total} registro(s)</span>
      <span className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={pagina === 0} onClick={() => onPagina(pagina - 1)}>Anterior</Button>
        Página {pagina + 1} de {ult + 1}
        <Button size="sm" variant="outline" disabled={pagina >= ult} onClick={() => onPagina(pagina + 1)}>Próxima</Button>
      </span>
    </div>
  );
}

function useInvalidarEstoque() {
  const qc = useQueryClient();
  return () => ["estoque", "estoque-base", "estoque-alertas", "estoque-lotes", "estoque-itens", "estoque-mov"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

/* ---------------- Visão geral ---------------- */
export function VisaoGeralEstoque() {
  const { data: sessao } = useSessao();
  const q = useQuery({
    enabled: !!sessao?.clinicaId,
    queryKey: ["estoque", "resumo"],
    queryFn: async () => {
      const [s, m] = await Promise.all([
        supabase.from("estoque_saldo_itens").select("valor,saldo,ativo"),
        supabase.from("estoque_movimentacoes").select("custo_total,tipo_mov").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()).in("tipo_mov", ["saida_uso", "perda", "vencido"]),
      ]);
      const itens = (s.data ?? []).filter((x) => x.ativo);
      return {
        itens: itens.length,
        valor: itens.reduce((t, x) => t + Number(x.valor), 0),
        consumo30: (m.data ?? []).filter((x) => x.tipo_mov === "saida_uso").reduce((t, x) => t + Number(x.custo_total), 0),
        perdas30: (m.data ?? []).filter((x) => x.tipo_mov !== "saida_uso").reduce((t, x) => t + Number(x.custo_total), 0),
      };
    },
  });
  const k = [
    ["Itens ativos", String(q.data?.itens ?? 0)],
    ["Estoque valorizado", brl(q.data?.valor)],
    ["Consumo em atendimentos (30 dias)", brl(q.data?.consumo30)],
    ["Perdas e vencidos (30 dias)", brl(q.data?.perdas30)],
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {k.map(([r, v]) => (
          <Card key={r}><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{r}</p><p className="mt-1 text-2xl font-semibold">{v}</p></CardContent></Card>
        ))}
      </div>
      <PainelAlertasEstoque />
    </div>
  );
}

/* ---------------- Itens ---------------- */
type ItemForm = {
  id?: string; nome: string; categoria: string; codigo_barras: string; unidade_medida: string; unidade_compra: string; fator_conversao: string;
  estoque_minimo: string; controla_lote: boolean; controla_validade: boolean; registro_anvisa: string; fornecedor_id: string; ativo: boolean;
};
const itemVazio: ItemForm = { nome: "", categoria: "", codigo_barras: "", unidade_medida: "un", unidade_compra: "", fator_conversao: "1", estoque_minimo: "0", controla_lote: true, controla_validade: true, registro_anvisa: "", fornecedor_id: "", ativo: true };

export function ItensEstoque() {
  const { data: sessao } = useSessao();
  const gerir = usePodeGerirEstoque();
  const base = useBaseEstoque();
  const invalidar = useInvalidarEstoque();
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(0);
  const [form, setForm] = useState<ItemForm | null>(null);
  const q = useQuery({
    enabled: !!sessao?.clinicaId,
    queryKey: ["estoque-itens", busca, pagina],
    queryFn: async () => {
      let r = supabase.from("estoque_saldo_itens").select("*", { count: "exact" }).order("nome").range(pagina * POR_PAGINA, pagina * POR_PAGINA + POR_PAGINA - 1);
      const t = busca.trim().replace(/[%,()]/g, "");
      if (t) r = r.or(`nome.ilike.%${t}%,categoria.ilike.%${t}%`);
      const { data, count, error } = await r;
      if (error) throw error;
      return { rows: data ?? [], total: count ?? 0 };
    },
  });
  const salvar = useMutation({
    mutationFn: async (f: ItemForm) => {
      const v = {
        nome: f.nome.trim(), categoria: f.categoria || null, codigo_barras: f.codigo_barras || null, unidade_medida: f.unidade_medida || "un",
        unidade_compra: f.unidade_compra || null, fator_conversao: Number(f.fator_conversao) || 1, estoque_minimo: Number(f.estoque_minimo) || 0,
        controla_lote: f.controla_lote, controla_validade: f.controla_validade, registro_anvisa: f.registro_anvisa || null,
        fornecedor_id: f.fornecedor_id || null, ativo: f.ativo,
      };
      const { error } = f.id
        ? await supabase.from("estoque_itens").update(v).eq("id", f.id)
        : await supabase.from("estoque_itens").insert({ ...v, clinica_id: sessao!.clinicaId! });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Item salvo."); setForm(null); invalidar(); },
    onError: (e) => toast.error(mensagemErro(e)),
  });
  const abrir = (id: string) => {
    const i = base.data?.itens.find((x) => x.id === id);
    if (!i) return;
    setForm({
      id: i.id, nome: i.nome, categoria: i.categoria ?? "", codigo_barras: i.codigo_barras ?? "", unidade_medida: i.unidade_medida ?? "un",
      unidade_compra: i.unidade_compra ?? "", fator_conversao: String(i.fator_conversao), estoque_minimo: String(i.estoque_minimo),
      controla_lote: i.controla_lote, controla_validade: i.controla_validade, registro_anvisa: i.registro_anvisa ?? "", fornecedor_id: i.fornecedor_id ?? "", ativo: i.ativo,
    });
  };
  const campo = (k: keyof ItemForm, rot: string, extra?: Record<string, unknown>) => (
    <div className="space-y-1"><Label htmlFor={`it-${k}`}>{rot}</Label>
      <Input id={`it-${k}`} value={String(form![k] ?? "")} onChange={(e) => setForm({ ...form!, [k]: e.target.value })} {...extra} /></div>
  );
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Itens de estoque</CardTitle>
        <div className="flex gap-2">
          <Input className="w-56" placeholder="Buscar por nome ou categoria" value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(0); }} aria-label="Buscar item" />
          {gerir && <Button onClick={() => setForm({ ...itemVazio })}><Plus className="mr-1 h-4 w-4" /> Novo item</Button>}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Item</TableHead><TableHead>Categoria</TableHead><TableHead className="text-right">Saldo</TableHead>
            <TableHead className="text-right">Mínimo</TableHead><TableHead className="text-right">Custo médio</TableHead><TableHead className="text-right">Valor</TableHead>
            <TableHead>Próx. validade</TableHead><TableHead />
          </TableRow></TableHeader>
          <TableBody>
            {q.data?.rows.map((i) => (
              <TableRow key={i.item_id} className={i.ativo ? "" : "opacity-50"}>
                <TableCell className="font-medium">{i.nome}</TableCell>
                <TableCell>{i.categoria ?? "—"}</TableCell>
                <TableCell className={`text-right ${Number(i.saldo) < Number(i.estoque_minimo) ? "font-semibold text-destructive" : ""}`}>{qtd(i.saldo)} {i.unidade_medida}</TableCell>
                <TableCell className="text-right">{qtd(i.estoque_minimo)}</TableCell>
                <TableCell className="text-right">{brl(Number(i.custo_medio))}</TableCell>
                <TableCell className="text-right">{brl(Number(i.valor))}</TableCell>
                <TableCell>{dataCurta(i.proxima_validade)}</TableCell>
                <TableCell>{gerir && <Button size="icon" variant="ghost" aria-label={`Editar ${i.nome}`} onClick={() => abrir(i.item_id!)}><Pencil className="h-4 w-4" /></Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Paginacao pagina={pagina} total={q.data?.total ?? 0} onPagina={setPagina} />
      </CardContent>
      {form && (
        <Dialog open onOpenChange={(o) => !o && setForm(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader><DialogTitle>{form.id ? "Editar item" : "Novo item"}</DialogTitle></DialogHeader>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">{campo("nome", "Nome")}</div>
              {campo("categoria", "Categoria")}
              {campo("codigo_barras", "Código de barras")}
              {campo("registro_anvisa", "Registro ANVISA")}
              <div className="space-y-1"><Label>Fornecedor padrão</Label>
                <Select value={form.fornecedor_id} onValueChange={(v) => setForm({ ...form, fornecedor_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>{base.data?.fornecedores.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome_fantasia ?? f.razao_social}</SelectItem>)}</SelectContent>
                </Select></div>
              {campo("unidade_medida", "Unidade de consumo (ex.: un, ml)")}
              {campo("unidade_compra", "Unidade de compra (ex.: caixa)")}
              {campo("fator_conversao", "1 unid. de compra = ? de consumo", { type: "number", step: "0.001", min: "0.001" })}
              {campo("estoque_minimo", "Estoque mínimo (consumo)", { type: "number", step: "0.001" })}
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.controla_lote} onCheckedChange={(v) => setForm({ ...form, controla_lote: !!v })} /> Controla lote</label>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.controla_validade} onCheckedChange={(v) => setForm({ ...form, controla_validade: !!v })} /> Controla validade</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} /> Ativo</label>
            </div>
            <p className="text-xs text-muted-foreground">O saldo é calculado pelos lotes. Para entrada de mercadoria use Lotes ou Compras.</p>
            <Button disabled={!form.nome || salvar.isPending} onClick={() => salvar.mutate(form)}>Salvar item</Button>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

/* ---------------- Lotes ---------------- */
export function LotesEstoque() {
  const { data: sessao } = useSessao();
  const gerir = usePodeGerirEstoque();
  const base = useBaseEstoque();
  const invalidar = useInvalidarEstoque();
  const [filtro, setFiltro] = useState({ item: "todos", unidade: "todas", zerados: false });
  const [pagina, setPagina] = useState(0);
  const [entrada, setEntrada] = useState<null | Record<string, string>>(null);
  const [mov, setMov] = useState<null | { lote: Lote; tipo: string; quantidade: string; motivo: string }>(null);
  const [transf, setTransf] = useState<null | { lote: Lote; unidade: string; quantidade: string }>(null);

  const q = useQuery({
    enabled: !!sessao?.clinicaId,
    queryKey: ["estoque-lotes", filtro, pagina],
    queryFn: async () => {
      let r = supabase.from("estoque_lotes").select("*,estoque_itens(nome,unidade_medida),unidades(nome),fornecedores(razao_social,nome_fantasia)", { count: "exact" })
        .order("validade", { ascending: true, nullsFirst: false }).range(pagina * POR_PAGINA, pagina * POR_PAGINA + POR_PAGINA - 1);
      if (filtro.item !== "todos") r = r.eq("item_id", filtro.item);
      if (filtro.unidade !== "todas") r = r.eq("unidade_id", filtro.unidade);
      if (!filtro.zerados) r = r.gt("quantidade", 0);
      const { data, count, error } = await r;
      if (error) throw error;
      return { rows: data ?? [], total: count ?? 0 };
    },
  });
  type Lote = NonNullable<typeof q.data>["rows"][number];

  const exec = useMutation({
    mutationFn: async (f: () => PromiseLike<{ error: unknown }>) => { const { error } = await f(); if (error) throw error; },
    onSuccess: () => { toast.success("Estoque atualizado."); setEntrada(null); setMov(null); setTransf(null); invalidar(); },
    onError: (e) => toast.error(mensagemErro(e)),
  });
  const hoje = diaISO();
  const itemSel = base.data?.itens.find((i) => i.id === entrada?.item);

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Lotes</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filtro.item} onValueChange={(v) => { setFiltro({ ...filtro, item: v }); setPagina(0); }}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todos">Todos os itens</SelectItem>{base.data?.itens.map((i) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filtro.unidade} onValueChange={(v) => { setFiltro({ ...filtro, unidade: v }); setPagina(0); }}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todas">Todas as unidades</SelectItem>{base.data?.unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}</SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-xs"><Checkbox checked={filtro.zerados} onCheckedChange={(v) => setFiltro({ ...filtro, zerados: !!v })} /> Mostrar zerados</label>
          {gerir && <Button onClick={() => setEntrada({ item: "", unidade: sessao?.profile?.unidade_id ?? "", lote: "", validade: "", quantidade: "", custo: "", fornecedor: "", nota: "" })}><Plus className="mr-1 h-4 w-4" /> Entrada</Button>}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Item</TableHead><TableHead>Lote</TableHead><TableHead>Validade</TableHead><TableHead>Unidade</TableHead>
            <TableHead className="text-right">Saldo</TableHead><TableHead className="text-right">Custo unit.</TableHead><TableHead>Fornecedor / NF</TableHead><TableHead />
          </TableRow></TableHeader>
          <TableBody>
            {q.data?.rows.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.estoque_itens?.nome}</TableCell>
                <TableCell>{l.numero_lote ?? "s/n"}</TableCell>
                <TableCell>{l.validade ? <Badge variant={l.validade < hoje ? "destructive" : "outline"}>{dataCurta(l.validade)}</Badge> : "—"}</TableCell>
                <TableCell>{l.unidades?.nome ?? "—"}</TableCell>
                <TableCell className="text-right">{qtd(l.quantidade)} {l.estoque_itens?.unidade_medida}</TableCell>
                <TableCell className="text-right">{brl(Number(l.custo_unitario))}</TableCell>
                <TableCell className="text-xs">{l.fornecedores?.nome_fantasia ?? l.fornecedores?.razao_social ?? "—"}{l.nota_fiscal ? ` · NF ${l.nota_fiscal}` : ""}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {gerir && (
                    <>
                      <Button size="icon" variant="ghost" aria-label="Ajustar lote" onClick={() => setMov({ lote: l, tipo: "ajuste", quantidade: "", motivo: "" })}><SlidersHorizontal className="h-4 w-4" /></Button>
                      {base.data && base.data.unidades.length > 1 && Number(l.quantidade) > 0 && (
                        <Button size="icon" variant="ghost" aria-label="Transferir lote" onClick={() => setTransf({ lote: l, unidade: "", quantidade: String(l.quantidade) })}><ArrowLeftRight className="h-4 w-4" /></Button>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Paginacao pagina={pagina} total={q.data?.total ?? 0} onPagina={setPagina} />
      </CardContent>

      {entrada && (
        <Dialog open onOpenChange={(o) => !o && setEntrada(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Entrada de estoque</DialogTitle></DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2"><Label>Item</Label>
                <Select value={entrada.item} onValueChange={(v) => setEntrada({ ...entrada, item: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{base.data?.itens.filter((i) => i.ativo).map((i) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-1"><Label>Unidade</Label>
                <Select value={entrada.unidade} onValueChange={(v) => setEntrada({ ...entrada, unidade: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{base.data?.unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-1"><Label>Fornecedor</Label>
                <Select value={entrada.fornecedor} onValueChange={(v) => setEntrada({ ...entrada, fornecedor: v })}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>{base.data?.fornecedores.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome_fantasia ?? f.razao_social}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-1"><Label htmlFor="en-lote">Nº do lote{itemSel?.controla_lote ? " *" : ""}</Label><Input id="en-lote" value={entrada.lote} onChange={(e) => setEntrada({ ...entrada, lote: e.target.value })} /></div>
              <div className="space-y-1"><Label htmlFor="en-val">Validade{itemSel?.controla_validade ? " *" : ""}</Label><Input id="en-val" type="date" value={entrada.validade} onChange={(e) => setEntrada({ ...entrada, validade: e.target.value })} /></div>
              <div className="space-y-1"><Label htmlFor="en-q">Quantidade ({itemSel?.unidade_medida ?? "consumo"})</Label><Input id="en-q" type="number" step="0.001" value={entrada.quantidade} onChange={(e) => setEntrada({ ...entrada, quantidade: e.target.value })} /></div>
              <div className="space-y-1"><Label htmlFor="en-c">Custo unitário (R$)</Label><Input id="en-c" type="number" step="0.0001" value={entrada.custo} onChange={(e) => setEntrada({ ...entrada, custo: e.target.value })} /></div>
              <div className="space-y-1 sm:col-span-2"><Label htmlFor="en-nf">Nota fiscal</Label><Input id="en-nf" value={entrada.nota} onChange={(e) => setEntrada({ ...entrada, nota: e.target.value })} /></div>
            </div>
            <Button disabled={!entrada.item || !entrada.quantidade || exec.isPending} onClick={() => exec.mutate(() => supabase.rpc("registrar_entrada_estoque", {
              p_item: entrada.item, p_unidade: (entrada.unidade || null) as never, p_lote: entrada.lote, p_validade: (entrada.validade || null) as never,
              p_quantidade: Number(entrada.quantidade), p_custo_unitario: Number(entrada.custo) || 0, p_fornecedor: (entrada.fornecedor || null) as never, p_nota: entrada.nota,
            }))}>Registrar entrada</Button>
          </DialogContent>
        </Dialog>
      )}

      {mov && (
        <Dialog open onOpenChange={(o) => !o && setMov(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Movimentar lote {mov.lote.numero_lote ?? "s/n"} · {mov.lote.estoque_itens?.nome}</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Saldo atual: {qtd(mov.lote.quantidade)} {mov.lote.estoque_itens?.unidade_medida}. Movimentações não podem ser editadas depois.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1"><Label>Tipo</Label>
                <Select value={mov.tipo} onValueChange={(v) => setMov({ ...mov, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["ajuste", "perda", "vencido", "devolucao", "saida_uso"].map((t) => <SelectItem key={t} value={t}>{TIPO_MOV[t]}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-1"><Label htmlFor="mv-q">{mov.tipo === "ajuste" ? "Quantidade (+ entra, − sai)" : "Quantidade"}</Label>
                <Input id="mv-q" type="number" step="0.001" value={mov.quantidade} onChange={(e) => setMov({ ...mov, quantidade: e.target.value })} /></div>
              <div className="space-y-1 sm:col-span-2"><Label htmlFor="mv-m">Motivo</Label><Input id="mv-m" value={mov.motivo} onChange={(e) => setMov({ ...mov, motivo: e.target.value })} /></div>
            </div>
            <Button disabled={!Number(mov.quantidade) || mov.motivo.trim().length < 3 || exec.isPending} onClick={() => exec.mutate(() => supabase.rpc("registrar_movimento_estoque", {
              p_lote: mov.lote.id, p_tipo: mov.tipo, p_quantidade: Number(mov.quantidade), p_motivo: mov.motivo,
            }))}>Registrar</Button>
          </DialogContent>
        </Dialog>
      )}

      {transf && (
        <Dialog open onOpenChange={(o) => !o && setTransf(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Transferir entre unidades</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">{transf.lote.estoque_itens?.nome} · lote {transf.lote.numero_lote ?? "s/n"} · de {transf.lote.unidades?.nome ?? "sem unidade"}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1"><Label>Unidade de destino</Label>
                <Select value={transf.unidade} onValueChange={(v) => setTransf({ ...transf, unidade: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{base.data?.unidades.filter((u) => u.id !== transf.lote.unidade_id).map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-1"><Label htmlFor="tr-q">Quantidade</Label><Input id="tr-q" type="number" step="0.001" value={transf.quantidade} onChange={(e) => setTransf({ ...transf, quantidade: e.target.value })} /></div>
            </div>
            <Button disabled={!transf.unidade || !Number(transf.quantidade) || exec.isPending} onClick={() => exec.mutate(() => supabase.rpc("transferir_estoque", {
              p_lote: transf.lote.id, p_unidade_destino: transf.unidade, p_quantidade: Number(transf.quantidade),
            }))}>Transferir</Button>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

/* ---------------- Movimentações ---------------- */
export function MovimentacoesEstoque() {
  const { data: sessao } = useSessao();
  const base = useBaseEstoque();
  const [f, setF] = useState({ item: "todos", tipo: "todos", de: diaISO(new Date(Date.now() - 30 * 86400000)), ate: diaISO() });
  const [pagina, setPagina] = useState(0);
  const consulta = (ini: number, fim: number) => {
    let r = supabase.from("estoque_movimentacoes")
      .select("*,estoque_itens(nome,unidade_medida),estoque_lotes(numero_lote,validade),unidades(nome),pacientes(nome),procedimentos(nome),profissionais(nome)", { count: "exact" })
      .gte("created_at", f.de + "T00:00:00").lte("created_at", f.ate + "T23:59:59").order("created_at", { ascending: false }).range(ini, fim);
    if (f.item !== "todos") r = r.eq("item_id", f.item);
    if (f.tipo !== "todos") r = r.eq("tipo_mov", f.tipo as never);
    return r;
  };
  const q = useQuery({
    enabled: !!sessao?.clinicaId,
    queryKey: ["estoque-mov", f, pagina],
    queryFn: async () => {
      const { data, count, error } = await consulta(pagina * 30, pagina * 30 + 29);
      if (error) throw error;
      return { rows: data ?? [], total: count ?? 0 };
    },
  });
  async function exportar() {
    const { data } = await consulta(0, 4999);
    baixarCSV("movimentacoes-estoque", [
      ["data", "tipo", "item", "lote", "validade", "quantidade", "custo_unitario", "custo_total", "unidade", "paciente", "procedimento", "profissional", "motivo"],
      ...(data ?? []).map((m) => [new Date(m.created_at).toLocaleString("pt-BR"), TIPO_MOV[m.tipo_mov ?? ""] ?? m.tipo, m.estoque_itens?.nome, m.estoque_lotes?.numero_lote,
        m.estoque_lotes?.validade, String(m.delta ?? m.quantidade).replace(".", ","), String(m.custo_unitario).replace(".", ","), String(m.custo_total).replace(".", ","),
        m.unidades?.nome, m.pacientes?.nome, m.procedimentos?.nome, m.profissionais?.nome, m.motivo]),
    ]);
  }
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Movimentações</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={f.item} onValueChange={(v) => { setF({ ...f, item: v }); setPagina(0); }}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todos">Todos os itens</SelectItem>{base.data?.itens.map((i) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={f.tipo} onValueChange={(v) => { setF({ ...f, tipo: v }); setPagina(0); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todos">Todos os tipos</SelectItem>{Object.entries(TIPO_MOV).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="date" className="w-36" value={f.de} onChange={(e) => setF({ ...f, de: e.target.value })} aria-label="De" />
          <Input type="date" className="w-36" value={f.ate} onChange={(e) => setF({ ...f, ate: e.target.value })} aria-label="Até" />
          <Button variant="outline" onClick={exportar}><Download className="mr-1 h-4 w-4" /> CSV</Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Item / lote</TableHead><TableHead className="text-right">Qtd.</TableHead>
            <TableHead className="text-right">Custo</TableHead><TableHead>Origem</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {q.data?.rows.map((m) => {
              const d = Number(m.delta ?? (m.tipo === "entrada" ? m.quantidade : -m.quantidade));
              return (
                <TableRow key={m.id}>
                  <TableCell className="whitespace-nowrap text-xs">{new Date(m.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</TableCell>
                  <TableCell><Badge variant="outline">{TIPO_MOV[m.tipo_mov ?? ""] ?? m.tipo}</Badge></TableCell>
                  <TableCell>{m.estoque_itens?.nome}<span className="text-xs text-muted-foreground">{m.estoque_lotes ? ` · lote ${m.estoque_lotes.numero_lote ?? "s/n"}` : ""}</span></TableCell>
                  <TableCell className={`text-right font-medium ${d < 0 ? "text-destructive" : "text-primary"}`}>{d > 0 ? "+" : ""}{qtd(d)}</TableCell>
                  <TableCell className="text-right">{brl(Number(m.custo_total))}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {[m.pacientes?.nome, m.procedimentos?.nome, m.profissionais?.nome, m.unidades?.nome].filter(Boolean).join(" · ")}{m.motivo ? ` — ${m.motivo}` : ""}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Paginacao pagina={pagina} total={q.data?.total ?? 0} porPagina={30} onPagina={setPagina} />
      </CardContent>
    </Card>
  );
}

/* ---------------- Fornecedores ---------------- */
const fornVazio = { razao_social: "", nome_fantasia: "", cnpj: "", contato: "", telefone: "", email: "", prazo_entrega_dias: "7", condicoes_pagamento: "" };
export function FornecedoresEstoque() {
  const { data: sessao } = useSessao();
  const gerir = usePodeGerirEstoque();
  const base = useBaseEstoque();
  const invalidar = useInvalidarEstoque();
  const [form, setForm] = useState<null | (typeof fornVazio & { id?: string })>(null);
  const salvar = useMutation({
    mutationFn: async (f: typeof fornVazio & { id?: string }) => {
      const v = { razao_social: f.razao_social.trim(), nome_fantasia: f.nome_fantasia || null, cnpj: f.cnpj || null, contato: f.contato || null, telefone: f.telefone || null,
        email: f.email || null, prazo_entrega_dias: Number(f.prazo_entrega_dias) || 0, condicoes_pagamento: f.condicoes_pagamento || null };
      const { error } = f.id ? await supabase.from("fornecedores").update(v).eq("id", f.id) : await supabase.from("fornecedores").insert({ ...v, clinica_id: sessao!.clinicaId! });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Fornecedor salvo."); setForm(null); invalidar(); },
    onError: (e) => toast.error(mensagemErro(e)),
  });
  const ativar = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => { const { error } = await supabase.from("fornecedores").update({ ativo }).eq("id", id); if (error) throw error; },
    onSuccess: invalidar, onError: (e) => toast.error(mensagemErro(e)),
  });
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Fornecedores</CardTitle>
        {gerir && <Button onClick={() => setForm({ ...fornVazio })}><Plus className="mr-1 h-4 w-4" /> Novo fornecedor</Button>}
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Fornecedor</TableHead><TableHead>CNPJ</TableHead><TableHead>Contato</TableHead><TableHead>Prazo</TableHead><TableHead>Pagamento</TableHead><TableHead>Ativo</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {base.data?.fornecedores.map((f) => (
              <TableRow key={f.id} className={f.ativo ? "" : "opacity-50"}>
                <TableCell><p className="font-medium">{f.nome_fantasia ?? f.razao_social}</p>{f.nome_fantasia && <p className="text-xs text-muted-foreground">{f.razao_social}</p>}</TableCell>
                <TableCell>{f.cnpj ?? "—"}</TableCell>
                <TableCell className="text-xs">{[f.contato, f.telefone, f.email].filter(Boolean).join(" · ") || "—"}</TableCell>
                <TableCell>{f.prazo_entrega_dias} dias</TableCell>
                <TableCell className="text-xs">{f.condicoes_pagamento ?? "—"}</TableCell>
                <TableCell><Switch checked={f.ativo} disabled={!gerir} aria-label={`${f.razao_social} ativo`} onCheckedChange={(v) => ativar.mutate({ id: f.id, ativo: v })} /></TableCell>
                <TableCell>{gerir && <Button size="icon" variant="ghost" aria-label="Editar fornecedor" onClick={() => setForm({
                  id: f.id, razao_social: f.razao_social, nome_fantasia: f.nome_fantasia ?? "", cnpj: f.cnpj ?? "", contato: f.contato ?? "", telefone: f.telefone ?? "",
                  email: f.email ?? "", prazo_entrega_dias: String(f.prazo_entrega_dias), condicoes_pagamento: f.condicoes_pagamento ?? "",
                })}><Pencil className="h-4 w-4" /></Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!base.data?.fornecedores.length && <p className="py-6 text-center text-sm text-muted-foreground">Nenhum fornecedor cadastrado.</p>}
      </CardContent>
      {form && (
        <Dialog open onOpenChange={(o) => !o && setForm(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{form.id ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle></DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              {([["razao_social", "Razão social"], ["nome_fantasia", "Nome fantasia"], ["cnpj", "CNPJ"], ["contato", "Contato"], ["telefone", "Telefone"], ["email", "E-mail"],
                ["prazo_entrega_dias", "Prazo de entrega (dias)"], ["condicoes_pagamento", "Condições de pagamento"]] as const).map(([k, r]) => (
                <div key={k} className="space-y-1"><Label htmlFor={`fo-${k}`}>{r}</Label>
                  <Input id={`fo-${k}`} type={k === "prazo_entrega_dias" ? "number" : "text"} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>
              ))}
            </div>
            <Button disabled={!form.razao_social || salvar.isPending} onClick={() => salvar.mutate(form)}>Salvar</Button>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
