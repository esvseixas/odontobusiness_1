import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Link2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { dataBR } from "@/lib/format";

export type Pergunta = {
  id: string;
  texto: string;
  tipo: "texto" | "sim_nao" | "numero" | "opcoes";
  opcoes?: string[];
  alerta?: string;
};
export type Respostas = Record<string, string>;

export function CamposAnamnese({
  perguntas,
  respostas,
  onChange,
}: {
  perguntas: Pergunta[];
  respostas: Respostas;
  onChange: (r: Respostas) => void;
}) {
  return (
    <div className="space-y-4">
      {perguntas.map((q) => {
        const id = `anamnese-${q.id}`;
        const valor = respostas[q.id] ?? "";
        const set = (v: string) => onChange({ ...respostas, [q.id]: v });
        return (
          <div key={q.id} className="space-y-1.5">
            <Label htmlFor={id}>
              {q.texto}
              {q.alerta ? <span className="ml-1 text-xs text-destructive">(alerta)</span> : null}
            </Label>
            {q.tipo === "sim_nao" ? (
              <div className="flex gap-2" id={id} role="radiogroup" aria-label={q.texto}>
                {["sim", "não"].map((op) => (
                  <Button
                    key={op}
                    type="button"
                    size="sm"
                    role="radio"
                    aria-checked={valor === op}
                    variant={valor === op ? "default" : "outline"}
                    onClick={() => set(op)}
                  >
                    {op === "sim" ? "Sim" : "Não"}
                  </Button>
                ))}
              </div>
            ) : q.tipo === "opcoes" ? (
              <Select value={valor} onValueChange={set}>
                <SelectTrigger id={id}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(q.opcoes ?? []).map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : q.tipo === "numero" ? (
              <Input id={id} type="number" value={valor} onChange={(e) => set(e.target.value)} />
            ) : (
              <Textarea id={id} rows={2} maxLength={1000} value={valor} onChange={(e) => set(e.target.value)} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function AnamnesePaciente({ pacienteId }: { pacienteId: string }) {
  const { data: sessao } = useSessao();
  const clinicaId = sessao?.clinicaId;
  const podeEditar = sessao?.tem("owner", "admin", "dentista", "esteticista", "auxiliar") ?? false;
  const queryClient = useQueryClient();
  const [modeloId, setModeloId] = useState("");
  const [respostas, setRespostas] = useState<Respostas>({});
  const [editando, setEditando] = useState(false);

  const dados = useQuery({
    enabled: !!clinicaId,
    queryKey: ["anamneses", pacienteId],
    queryFn: async () => {
      const [m, a] = await Promise.all([
        supabase.from("anamnese_modelos").select("*").eq("ativo", true).order("nome"),
        supabase.from("anamneses").select("*").eq("paciente_id", pacienteId).order("versao", { ascending: false }),
      ]);
      if (m.error) throw m.error;
      if (a.error) throw a.error;
      return { modelos: m.data, anamneses: a.data };
    },
  });
  const modelos = dados.data?.modelos ?? [];
  const historico = dados.data?.anamneses ?? [];
  const atual = historico[0];
  const modelo = modelos.find((m) => m.id === modeloId);

  function iniciar() {
    const base = atual?.modelo_id && modelos.some((m) => m.id === atual.modelo_id) ? atual.modelo_id : modelos[0]?.id;
    setModeloId(base ?? "");
    setRespostas(atual && atual.modelo_id === base ? (atual.respostas as Respostas) : {});
    setEditando(true);
  }

  const salvar = useMutation({
    mutationFn: async () => {
      if (!modelo) throw new Error("Escolha um modelo de anamnese.");
      const { error } = await supabase.from("anamneses").insert({
        clinica_id: clinicaId!,
        paciente_id: pacienteId,
        modelo_id: modelo.id,
        modelo_nome: modelo.nome,
        perguntas: modelo.perguntas,
        respostas,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nova versão da anamnese registrada.");
      setEditando(false);
      queryClient.invalidateQueries({ queryKey: ["anamneses", pacienteId] });
      queryClient.invalidateQueries({ queryKey: ["alertas-clinicos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const gerarLink = useMutation({
    mutationFn: async () => {
      const mid = modeloId || modelos[0]?.id;
      if (!mid) throw new Error("Nenhum modelo disponível.");
      const { data, error } = await supabase
        .from("anamnese_links")
        .insert({ clinica_id: clinicaId!, paciente_id: pacienteId, modelo_id: mid })
        .select("token")
        .single();
      if (error) throw error;
      return data.token;
    },
    onSuccess: async (token) => {
      const url = `${window.location.origin}/anamnese/${token}`;
      await navigator.clipboard.writeText(url).catch(() => undefined);
      toast.success("Link copiado. Envie ao paciente (válido por 7 dias).");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="mt-4">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">Anamnese {atual ? `— versão ${atual.versao}` : ""}</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => gerarLink.mutate()} disabled={gerarLink.isPending}>
            <Link2 className="mr-1 h-4 w-4" /> Link para o paciente
          </Button>
          {podeEditar && !editando ? (
            <Button size="sm" onClick={iniciar}>
              {atual ? "Atualizar anamnese" : "Preencher anamnese"}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {editando ? (
          <>
            <div className="max-w-xs space-y-1.5">
              <Label htmlFor="anamnese-modelo">Modelo</Label>
              <Select
                value={modeloId}
                onValueChange={(v) => {
                  setModeloId(v);
                  setRespostas({});
                }}
              >
                <SelectTrigger id="anamnese-modelo">
                  <SelectValue placeholder="Escolha" />
                </SelectTrigger>
                <SelectContent>
                  {modelos.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {modelo ? (
              <CamposAnamnese
                perguntas={modelo.perguntas as unknown as Pergunta[]}
                respostas={respostas}
                onChange={setRespostas}
              />
            ) : null}
            <div className="flex gap-2">
              <Button onClick={() => salvar.mutate()} disabled={salvar.isPending || !modelo}>
                Salvar nova versão
              </Button>
              <Button variant="ghost" onClick={() => setEditando(false)}>
                Cancelar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              As versões anteriores ficam preservadas no histórico; nada é apagado.
            </p>
          </>
        ) : atual ? (
          <>
            <p className="text-muted-foreground">
              {atual.modelo_nome} · {dataBR(atual.created_at)} · {atual.origem === "link" ? "preenchida pelo paciente" : "registrada pela equipe"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(atual.perguntas as unknown as Pergunta[]).map((q) => (
                <div key={q.id}>
                  <p className="font-medium">{q.texto}</p>
                  <p className="text-muted-foreground">{(atual.respostas as Respostas)[q.id] || "—"}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">Anamnese não preenchida.</p>
        )}
        {historico.length > 1 ? (
          <div className="border-t pt-3">
            <p className="mb-2 font-medium">Versões anteriores</p>
            <ul className="space-y-1 text-muted-foreground">
              {historico.slice(1).map((h) => (
                <li key={h.id}>
                  v{h.versao} · {h.modelo_nome} · {dataBR(h.created_at)}
                  {h.alertas?.map((a) => (
                    <Badge key={a} variant="outline" className="ml-1">
                      {a}
                    </Badge>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
