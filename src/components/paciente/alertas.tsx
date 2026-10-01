import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

/** Alertas da anamnese mais recente de cada paciente. */
export function useAlertasPacientes(pacienteIds: string[]) {
  const ids = [...new Set(pacienteIds.filter(Boolean))].sort();
  return useQuery({
    enabled: ids.length > 0,
    queryKey: ["alertas-clinicos", ids],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anamneses")
        .select("paciente_id,alertas,created_at")
        .in("paciente_id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const mapa: Record<string, string[]> = {};
      for (const a of data ?? []) if (!(a.paciente_id in mapa)) mapa[a.paciente_id] = a.alertas ?? [];
      return mapa;
    },
  });
}

export function AlertasClinicos({ pacienteId }: { pacienteId: string }) {
  const alertas = useAlertasPacientes([pacienteId]).data?.[pacienteId] ?? [];
  if (!alertas.length) return null;
  return (
    <div
      role="alert"
      className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm"
    >
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <span className="font-medium text-destructive">Alertas clínicos:</span>
      {alertas.map((a) => (
        <Badge key={a} variant="destructive">
          {a}
        </Badge>
      ))}
    </div>
  );
}

export function AlertaIcone({ alertas }: { alertas?: string[] }) {
  if (!alertas?.length) return null;
  return (
    <span title={`Alertas: ${alertas.join(", ")}`} aria-label={`Alertas clínicos: ${alertas.join(", ")}`}>
      <AlertTriangle className="inline h-3.5 w-3.5 text-destructive" />
    </span>
  );
}
