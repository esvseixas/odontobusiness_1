import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { dataBR, horaBR, isoDia } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/agendar/$clinica")({
  head: () => ({
    meta: [
      { title: "Agende sua consulta online | OdontoGestor" },
      { name: "description", content: "Escolha o serviço, o profissional e um horário livre para sua consulta odontológica." },
      { property: "og:title", content: "Agende sua consulta online | OdontoGestor" },
      { property: "og:description", content: "Escolha serviço, profissional e horário livre." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: AgendarOnline,
});

type Info = { nome: string; telefone: string | null; procedimentos: { id: string; nome: string; duracao: number }[]; profissionais: { id: string; nome: string; especialidade: string | null }[] };

function AgendarOnline() {
  const { clinica } = Route.useParams();
  const [proc, setProc] = useState("");
  const [prof, setProf] = useState("");
  const [dia, setDia] = useState(() => isoDia(new Date(Date.now() + 86400000)));
  const [hora, setHora] = useState<string | null>(null);
  const [dados, setDados] = useState({ nome: "", telefone: "", email: "" });
  const [ok, setOk] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const info = useQuery({
    queryKey: ["agendar-info", clinica],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("agenda_publica_info", { p_clinica: clinica });
      if (error) throw error;
      return data as unknown as Info | null;
    },
  });
  const livres = useQuery({
    enabled: !!proc && !!prof && !!dia,
    queryKey: ["livres", clinica, proc, prof, dia],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("horarios_livres", { p_clinica: clinica, p_profissional: prof, p_procedimento: proc, p_dia: dia });
      if (error) throw error;
      return (data ?? []) as unknown as string[];
    },
  });

  async function agendar() {
    if (!hora) return;
    setEnviando(true);
    const { error } = await supabase.rpc("agendar_online", {
      p_clinica: clinica, p_profissional: prof, p_procedimento: proc, p_inicio: hora,
      p_nome: dados.nome, p_telefone: dados.telefone, p_email: dados.email || (null as never),
    });
    setEnviando(false);
    if (error) { toast.error(error.message); livres.refetch(); return; }
    setOk(hora);
  }

  const i = info.data;
  return (
    <main className="mx-auto min-h-screen max-w-2xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>{i?.nome ?? "Agendamento online"}</CardTitle>
          <CardDescription>{info.isLoading ? "Carregando…" : i ? "Escolha o serviço, o profissional e um horário livre." : "Agendamento online indisponível para esta clínica."}</CardDescription>
        </CardHeader>
        {i && (
          <CardContent className="space-y-4">
            {ok ? (
              <p className="text-sm">Pronto! Sua consulta foi agendada para <strong>{dataBR(ok)} às {horaBR(ok)}</strong>. A clínica entrará em contato para confirmar.{i.telefone ? ` Dúvidas: ${i.telefone}.` : ""}</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1"><Label>Serviço</Label>
                    <Select value={proc} onValueChange={(v) => { setProc(v); setHora(null); }}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{i.procedimentos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                    </Select></div>
                  <div className="space-y-1"><Label>Profissional</Label>
                    <Select value={prof} onValueChange={(v) => { setProf(v); setHora(null); }}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{i.profissionais.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}{p.especialidade ? ` · ${p.especialidade}` : ""}</SelectItem>)}</SelectContent>
                    </Select></div>
                  <div className="space-y-1"><Label htmlFor="dia">Data</Label>
                    <Input id="dia" type="date" min={isoDia(new Date())} value={dia} onChange={(e) => { setDia(e.target.value); setHora(null); }} /></div>
                </div>
                {proc && prof && (
                  <div className="space-y-2">
                    <Label>Horários livres</Label>
                    {livres.isLoading ? <p className="text-sm text-muted-foreground">Buscando…</p>
                      : (livres.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Nenhum horário livre neste dia. Tente outra data.</p>
                      : <div className="flex flex-wrap gap-2">{livres.data!.map((h) => (
                        <Button key={h} size="sm" variant={hora === h ? "default" : "outline"} onClick={() => setHora(h)}>{horaBR(h)}</Button>
                      ))}</div>}
                  </div>
                )}
                {hora && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1"><Label htmlFor="nome">Nome completo</Label><Input id="nome" value={dados.nome} onChange={(e) => setDados({ ...dados, nome: e.target.value })} /></div>
                    <div className="space-y-1"><Label htmlFor="tel">Celular com DDD</Label><Input id="tel" inputMode="tel" value={dados.telefone} onChange={(e) => setDados({ ...dados, telefone: e.target.value })} /></div>
                    <div className="space-y-1"><Label htmlFor="email">E-mail (opcional)</Label><Input id="email" type="email" value={dados.email} onChange={(e) => setDados({ ...dados, email: e.target.value })} /></div>
                    <Button className="sm:col-span-3" disabled={!dados.nome || !dados.telefone || enviando} onClick={agendar}>
                      Confirmar agendamento para {dataBR(hora)} às {horaBR(hora)}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>
    </main>
  );
}
