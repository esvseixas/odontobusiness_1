import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FlaskConical, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { mensagemErro } from "@/lib/erros";
import { brl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { qtd, useBaseEstoque, usePodeGerirEstoque } from "./comum";

/** Ficha técnica: insumos padrão consumidos por execução do procedimento. */
export function FichaTecnicaBotao({ procedimentoId, nome }: { procedimentoId: string; nome: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setAberto(true)} aria-label={`Ficha técnica de ${nome}`}>
        <FlaskConical className="mr-1 h-4 w-4" /> Insumos
      </Button>
      {aberto && <FichaTecnica procedimentoId={procedimentoId} nome={nome} onFechar={() => setAberto(false)} />}
    </>
  );
}

function FichaTecnica({ procedimentoId, nome, onFechar }: { procedimentoId: string; nome: string; onFechar: () => void }) {
  const { data: sessao } = useSessao();
  const qc = useQueryClient();
  const gerir = usePodeGerirEstoque();
  const base = useBaseEstoque();
  const [novo, setNovo] = useState({ item: "", quantidade: "1" });
  const q = useQuery({
    queryKey: ["ficha", procedimentoId],
    queryFn: async () => (await supabase.from("procedimento_insumos").select("*,estoque_itens(nome,unidade_medida,custo_medio)").eq("procedimento_id", procedimentoId)).data ?? [],
  });
  const exec = useMutation({
    mutationFn: async (f: () => PromiseLike<{ error: unknown }>) => { const { error } = await f(); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ficha", procedimentoId] }); setNovo({ item: "", quantidade: "1" }); },
    onError: (e) => toast.error(mensagemErro(e)),
  });
  const custo = (q.data ?? []).reduce((t, r) => t + Number(r.quantidade) * Number(r.estoque_itens?.custo_medio ?? 0), 0);
  return (
    <Dialog open onOpenChange={(o) => !o && onFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ficha técnica · {nome}</DialogTitle>
          <DialogDescription>Quantidades padrão por execução. Na hora do atendimento elas vêm pré-preenchidas e podem ser ajustadas.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {q.data?.map((r) => (
            <div key={r.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
              <span className="flex-1">{r.estoque_itens?.nome}</span>
              {gerir ? (
                <Input className="w-24" type="number" step="0.001" defaultValue={String(r.quantidade)} aria-label={`Quantidade de ${r.estoque_itens?.nome}`}
                  onBlur={(e) => Number(e.target.value) > 0 && Number(e.target.value) !== Number(r.quantidade) && exec.mutate(() => supabase.from("procedimento_insumos").update({ quantidade: Number(e.target.value) }).eq("id", r.id))} />
              ) : <span>{qtd(r.quantidade)}</span>}
              <span className="w-10 text-xs text-muted-foreground">{r.estoque_itens?.unidade_medida}</span>
              {gerir && <Button size="icon" variant="ghost" aria-label="Remover insumo" onClick={() => exec.mutate(() => supabase.from("procedimento_insumos").delete().eq("id", r.id))}><Trash2 className="h-4 w-4" /></Button>}
            </div>
          ))}
          {!q.data?.length && <p className="text-sm text-muted-foreground">Nenhum insumo cadastrado.</p>}
          <p className="text-right text-sm">Custo estimado pelo custo médio: <strong>{brl(custo)}</strong></p>
        </div>
        {gerir && (
          <div className="flex gap-2">
            <Select value={novo.item} onValueChange={(v) => setNovo({ ...novo, item: v })}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Adicionar item" /></SelectTrigger>
              <SelectContent>{base.data?.itens.filter((i) => i.ativo && !q.data?.some((r) => r.item_id === i.id)).map((i) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Input className="w-24" type="number" step="0.001" value={novo.quantidade} onChange={(e) => setNovo({ ...novo, quantidade: e.target.value })} aria-label="Quantidade" />
            <Button disabled={!novo.item || !(Number(novo.quantidade) > 0)} onClick={() => exec.mutate(() => supabase.from("procedimento_insumos").insert({
              clinica_id: sessao!.clinicaId!, procedimento_id: procedimentoId, item_id: novo.item, quantidade: Number(novo.quantidade),
            }))}>Adicionar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
