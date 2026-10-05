import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CalendarClock, PackageX } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { mensagemErro } from "@/lib/erros";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dataCurta, diaISO, qtd, somarDias, usePodeGerirEstoque } from "./comum";

export function useAlertasEstoque() {
  const { data: sessao } = useSessao();
  return useQuery({
    enabled: !!sessao?.clinicaId,
    queryKey: ["estoque-alertas", sessao?.clinicaId],
    queryFn: async () => {
      const [s, l] = await Promise.all([
        supabase.from("estoque_saldo_itens").select("*").eq("ativo", true),
        supabase.from("estoque_lotes").select("id,numero_lote,quantidade,validade,item_id,estoque_itens(nome,unidade_medida),unidades(nome)")
          .gt("quantidade", 0).not("validade", "is", null).lte("validade", somarDias(90)).order("validade"),
      ]);
      const hoje = diaISO();
      const lotes = l.data ?? [];
      return {
        abaixo: (s.data ?? []).filter((i) => Number(i.saldo) < Number(i.estoque_minimo)),
        vencidos: lotes.filter((x) => x.validade! < hoje),
        v30: lotes.filter((x) => x.validade! >= hoje && x.validade! <= somarDias(30)),
        v60: lotes.filter((x) => x.validade! > somarDias(30) && x.validade! <= somarDias(60)),
        v90: lotes.filter((x) => x.validade! > somarDias(60)),
      };
    },
  });
}

/** Resumo compacto para o painel. */
export function ResumoAlertasEstoque() {
  const a = useAlertasEstoque();
  if (!a.data) return null;
  const { abaixo, vencidos, v30 } = a.data;
  if (!abaixo.length && !vencidos.length && !v30.length) return null;
  return (
    <Card className="mt-6 border-destructive/40">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-destructive" /> Alertas de estoque</CardTitle>
        <Button asChild size="sm" variant="outline"><Link to="/estoque">Ver estoque</Link></Button>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 text-sm">
        <Badge variant={abaixo.length ? "destructive" : "secondary"}>{abaixo.length} abaixo do mínimo</Badge>
        <Badge variant={vencidos.length ? "destructive" : "secondary"}>{vencidos.length} lotes vencidos</Badge>
        <Badge variant="secondary">{v30.length} vencem em 30 dias</Badge>
      </CardContent>
    </Card>
  );
}

export function PainelAlertasEstoque() {
  const a = useAlertasEstoque();
  const qc = useQueryClient();
  const gerir = usePodeGerirEstoque();
  const baixar = useMutation({
    mutationFn: async (l: { id: string; quantidade: number }) => {
      const { error } = await supabase.rpc("registrar_movimento_estoque", { p_lote: l.id, p_tipo: "vencido", p_quantidade: Number(l.quantidade), p_motivo: "Baixa de lote vencido" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Lote baixado como vencido."); qc.invalidateQueries({ queryKey: ["estoque-alertas"] }); qc.invalidateQueries({ queryKey: ["estoque"] }); },
    onError: (e) => toast.error(mensagemErro(e)),
  });
  const d = a.data;
  type L = NonNullable<typeof d>["vencidos"][number];
  const linha = (l: L, acao?: boolean) => (
    <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm">
      <span>{l.estoque_itens?.nome} · lote {l.numero_lote ?? "s/n"} · {qtd(l.quantidade)} {l.estoque_itens?.unidade_medida}{l.unidades ? ` · ${l.unidades.nome}` : ""}</span>
      <span className="flex items-center gap-2">
        <Badge variant={acao ? "destructive" : "outline"}>{dataCurta(l.validade)}</Badge>
        {acao && gerir && <Button size="sm" variant="outline" disabled={baixar.isPending} onClick={() => baixar.mutate(l)}>Baixar como vencido</Button>}
      </span>
    </div>
  );
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><PackageX className="h-4 w-4 text-destructive" /> Abaixo do mínimo ({d?.abaixo.length ?? 0})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {d?.abaixo.length ? d.abaixo.map((i) => (
            <div key={i.item_id} className="flex justify-between rounded-md border p-2 text-sm">
              <span>{i.nome}</span><span className="text-destructive">{qtd(i.saldo)} / mín. {qtd(i.estoque_minimo)} {i.unidade_medida}</span>
            </div>
          )) : <p className="text-sm text-muted-foreground">Nenhum item abaixo do mínimo.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarClock className="h-4 w-4 text-primary" /> Validades</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs font-semibold text-destructive">Vencidos ({d?.vencidos.length ?? 0})</p>
          {d?.vencidos.map((l) => linha(l, true))}
          <p className="text-xs font-semibold">Vencem em até 30 dias ({d?.v30.length ?? 0})</p>
          {d?.v30.map((l) => linha(l))}
          <p className="text-xs font-semibold text-muted-foreground">31 a 60 dias ({d?.v60.length ?? 0}) · 61 a 90 dias ({d?.v90.length ?? 0})</p>
          {[...(d?.v60 ?? []), ...(d?.v90 ?? [])].map((l) => linha(l))}
        </CardContent>
      </Card>
    </div>
  );
}
