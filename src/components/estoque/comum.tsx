import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";

export const TIPO_MOV: Record<string, string> = {
  entrada: "Entrada",
  saida_uso: "Uso",
  ajuste: "Ajuste",
  perda: "Perda",
  vencido: "Vencido",
  transferencia: "Transferência",
  devolucao: "Devolução",
};

export const qtd = (v: number | string | null | undefined) =>
  Number(v ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 3 });

export const diaISO = (d = new Date()) => d.toISOString().slice(0, 10);
export const somarDias = (n: number) => diaISO(new Date(Date.now() + n * 86400000));
export const dataCurta = (d: string | null | undefined) => (d ? new Date(d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString("pt-BR") : "—");

/** owner/admin/estoque gerenciam; demais papéis com acesso só leem. */
export function usePodeGerirEstoque() {
  const { data: sessao } = useSessao();
  return sessao?.tem("owner", "admin", "estoque") ?? false;
}

export function useBaseEstoque() {
  const { data: sessao } = useSessao();
  return useQuery({
    enabled: !!sessao?.clinicaId,
    queryKey: ["estoque-base", sessao?.clinicaId],
    queryFn: async () => {
      const [i, u, f] = await Promise.all([
        supabase.from("estoque_itens").select("*").order("nome"),
        supabase.from("unidades").select("id,nome").eq("ativo", true).order("nome"),
        supabase.from("fornecedores").select("*").order("razao_social"),
      ]);
      return { itens: i.data ?? [], unidades: u.data ?? [], fornecedores: f.data ?? [] };
    },
  });
}

export function baixarCSV(nome: string, linhas: (string | number | null | undefined)[][]) {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = "\uFEFF" + linhas.map((l) => l.map(esc).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nome}-${diaISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
