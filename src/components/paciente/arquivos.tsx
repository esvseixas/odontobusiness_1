import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dataBR, isoDia } from "@/lib/format";

export const TIPOS_ARQUIVO = [
  { valor: "radiografia", rotulo: "Radiografia" },
  { valor: "tomografia", rotulo: "Tomografia" },
  { valor: "foto_intraoral", rotulo: "Foto intraoral" },
  { valor: "foto_facial", rotulo: "Foto facial" },
  { valor: "documento", rotulo: "Documento" },
  { valor: "termo_assinado", rotulo: "Termo assinado" },
  { valor: "assinatura", rotulo: "Assinatura" },
] as const;
const ROTULO = Object.fromEntries(TIPOS_ARQUIVO.map((t) => [t.valor, t.rotulo])) as Record<string, string>;

export function ArquivosPaciente({ pacienteId }: { pacienteId: string }) {
  const { data: sessao } = useSessao();
  const clinicaId = sessao?.clinicaId;
  const clinico = sessao?.tem("owner", "admin", "dentista", "esteticista", "auxiliar") ?? false;
  const queryClient = useQueryClient();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [form, setForm] = useState({ tipo: clinico ? "radiografia" : "documento", dente: "", regiao: "", data_exame: isoDia(new Date()), descricao: "" });
  const [filtro, setFiltro] = useState("todos");

  const lista = useQuery({
    enabled: !!clinicaId,
    queryKey: ["arquivos", pacienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paciente_arquivos")
        .select("*")
        .eq("paciente_id", pacienteId)
        .eq("ativo", true)
        .order("data_exame", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const enviar = useMutation({
    mutationFn: async () => {
      if (!arquivo) throw new Error("Escolha um arquivo.");
      if (arquivo.size > 25 * 1024 * 1024) throw new Error("Arquivo maior que 25 MB.");
      const ext = arquivo.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
      const caminho = `${clinicaId}/${pacienteId}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("prontuario").upload(caminho, arquivo, { contentType: arquivo.type });
      if (up.error) throw up.error;
      const { error } = await supabase.from("paciente_arquivos").insert({
        clinica_id: clinicaId!,
        paciente_id: pacienteId,
        tipo: form.tipo,
        dente: form.dente || null,
        regiao: form.regiao || null,
        data_exame: form.data_exame,
        descricao: form.descricao || null,
        storage_path: caminho,
        nome_arquivo: arquivo.name,
        mime: arquivo.type,
        tamanho: arquivo.size,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Arquivo anexado ao prontuário.");
      setArquivo(null);
      setForm({ ...form, dente: "", regiao: "", descricao: "" });
      queryClient.invalidateQueries({ queryKey: ["arquivos", pacienteId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const inativar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("paciente_arquivos").update({ ativo: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Arquivo arquivado (permanece guardado no histórico).");
      queryClient.invalidateQueries({ queryKey: ["arquivos", pacienteId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function abrir(caminho: string) {
    const { data, error } = await supabase.storage.from("prontuario").createSignedUrl(caminho, 300);
    if (error || !data) return toast.error("Não foi possível abrir o arquivo.");
    window.open(data.signedUrl, "_blank", "noopener");
  }

  const itens = (lista.data ?? []).filter((a) => filtro === "todos" || a.tipo === filtro);
  const tiposPermitidos = clinico ? TIPOS_ARQUIVO : TIPOS_ARQUIVO.filter((t) => ["documento", "termo_assinado", "assinatura"].includes(t.valor));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anexar arquivo ou imagem</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="arq-arquivo">Arquivo (imagem, PDF ou DICOM até 25 MB)</Label>
            <Input id="arq-arquivo" type="file" accept="image/*,application/pdf,.dcm" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="arq-tipo">Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
              <SelectTrigger id="arq-tipo"><SelectValue /></SelectTrigger>
              <SelectContent>
                {tiposPermitidos.map((t) => <SelectItem key={t.valor} value={t.valor}>{t.rotulo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="arq-dente">Dente</Label>
            <Input id="arq-dente" placeholder="ex.: 36" value={form.dente} onChange={(e) => setForm({ ...form, dente: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="arq-regiao">Região</Label>
            <Input id="arq-regiao" placeholder="ex.: arcada inferior" value={form.regiao} onChange={(e) => setForm({ ...form, regiao: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="arq-data">Data</Label>
            <Input id="arq-data" type="date" value={form.data_exame} onChange={(e) => setForm({ ...form, data_exame: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="arq-desc">Descrição</Label>
            <Input id="arq-desc" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </div>
          <Button className="sm:col-span-2 lg:col-span-3" onClick={() => enviar.mutate()} disabled={!arquivo || enviar.isPending}>
            <Upload className="mr-2 h-4 w-4" /> {enviar.isPending ? "Enviando…" : "Anexar ao prontuário"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Arquivos do paciente</CardTitle>
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="w-48" aria-label="Filtrar por tipo"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {TIPOS_ARQUIVO.map((t) => <SelectItem key={t.valor} value={t.valor}>{t.rotulo}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {itens.length === 0 ? <p className="text-muted-foreground">Nenhum arquivo anexado.</p> : null}
          {itens.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{a.descricao || a.nome_arquivo}</p>
                <div className="text-xs text-muted-foreground">
                  <Badge variant="secondary" className="mr-1">{ROTULO[a.tipo] ?? a.tipo}</Badge>
                  {dataBR(a.data_exame)}
                  {a.dente ? ` · dente ${a.dente}` : ""}
                  {a.regiao ? ` · ${a.regiao}` : ""}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => abrir(a.storage_path)}>
                  <Download className="mr-1 h-4 w-4" /> Abrir
                </Button>
                {clinico ? (
                  <Button size="sm" variant="ghost" onClick={() => inativar.mutate(a.id)}>
                    Arquivar
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
