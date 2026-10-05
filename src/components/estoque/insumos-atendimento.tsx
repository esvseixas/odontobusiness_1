import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dataCurta, diaISO, qtd, useBaseEstoque } from "./comum";

export type InsumoLinha = { item_id: string; quantidade: string; lote_id: string; dente: string };

/** Lista editável de insumos usados, pré-preenchida pela ficha técnica do procedimento. */
export function InsumosAtendimento({ procedimentoId, onChange }: { procedimentoId: string | null; onChange: (linhas: InsumoLinha[], exigeLote: boolean) => void }) {
  const base = useBaseEstoque();
  const ficha = useQuery({
    queryKey: ["ficha-atendimento", procedimentoId],
    queryFn: async () => {
      if (!procedimentoId) return { exige: false, linhas: [] as InsumoLinha[] };
      const [p, f] = await Promise.all([
        supabase.from("procedimentos").select("exige_lote_aplicado").eq("id", procedimentoId).maybeSingle(),
        supabase.from("procedimento_insumos").select("item_id,quantidade").eq("procedimento_id", procedimentoId),
      ]);
      return { exige: !!p.data?.exige_lote_aplicado, linhas: (f.data ?? []).map((r) => ({ item_id: r.item_id, quantidade: String(r.quantidade), lote_id: "", dente: "" })) };
    },
  });
  const [linhas, setLinhas] = useState<InsumoLinha[]>([]);
  useEffect(() => { if (ficha.data) setLinhas(ficha.data.linhas); }, [ficha.data]);
  const exige = ficha.data?.exige ?? false;
  useEffect(() => { onChange(linhas, exige); }, [linhas, exige, onChange]);

  const ids = linhas.map((l) => l.item_id).filter(Boolean);
  const lotes = useQuery({
    enabled: ids.length > 0,
    queryKey: ["lotes-atendimento", ids.join(",")],
    queryFn: async () => (await supabase.from("estoque_lotes").select("id,item_id,numero_lote,validade,quantidade").in("item_id", ids).gt("quantidade", 0)
      .or(`validade.is.null,validade.gte.${diaISO()}`).order("validade", { ascending: true, nullsFirst: false })).data ?? [],
  });
  const set = (k: number, p: Partial<InsumoLinha>) => setLinhas(linhas.map((l, j) => (j === k ? { ...l, ...p } : l)));

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Insumos usados</p>
      {exige && <p className="text-xs text-destructive">Este procedimento exige informar o lote aplicado (fica registrado no prontuário).</p>}
      {linhas.map((l, k) => {
        const it = base.data?.itens.find((i) => i.id === l.item_id);
        const ls = (lotes.data ?? []).filter((x) => x.item_id === l.item_id);
        return (
          <div key={k} className="grid gap-1 rounded-md border p-2 sm:grid-cols-[1fr_80px_1fr_60px_32px]">
            <Select value={l.item_id} onValueChange={(v) => set(k, { item_id: v, lote_id: "" })}>
              <SelectTrigger aria-label="Item"><SelectValue placeholder="Item" /></SelectTrigger>
              <SelectContent>{base.data?.itens.filter((i) => i.ativo).map((i) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" step="0.001" min={0} aria-label={`Quantidade ${it?.unidade_medida ?? ""}`} value={l.quantidade} onChange={(e) => set(k, { quantidade: e.target.value })} />
            <Select value={l.lote_id || "fefo"} onValueChange={(v) => set(k, { lote_id: v === "fefo" ? "" : v })}>
              <SelectTrigger aria-label="Lote"><SelectValue /></SelectTrigger>
              <SelectContent>
                {!exige && <SelectItem value="fefo">Automático (vence primeiro)</SelectItem>}
                {exige && <SelectItem value="fefo" disabled>Escolha o lote</SelectItem>}
                {ls.map((x) => <SelectItem key={x.id} value={x.id}>Lote {x.numero_lote ?? "s/n"} · {dataCurta(x.validade)} · {qtd(x.quantidade)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Dente" aria-label="Dente" value={l.dente} onChange={(e) => set(k, { dente: e.target.value })} />
            <Button size="icon" variant="ghost" aria-label="Remover insumo" onClick={() => setLinhas(linhas.filter((_, j) => j !== k))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        );
      })}
      {!linhas.length && <p className="text-xs text-muted-foreground">Sem insumos na ficha técnica deste procedimento.</p>}
      <Button size="sm" variant="outline" onClick={() => setLinhas([...linhas, { item_id: "", quantidade: "1", lote_id: "", dente: "" }])}><Plus className="mr-1 h-4 w-4" /> Adicionar insumo</Button>
    </div>
  );
}
