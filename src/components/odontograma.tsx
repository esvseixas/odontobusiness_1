import { cn } from "@/lib/utils";

export const FDI_PERMANENTE = {
  supDireito: ["18", "17", "16", "15", "14", "13", "12", "11"],
  supEsquerdo: ["21", "22", "23", "24", "25", "26", "27", "28"],
  infEsquerdo: ["31", "32", "33", "34", "35", "36", "37", "38"],
  infDireito: ["48", "47", "46", "45", "44", "43", "42", "41"],
};

export const FDI_DECIDUA = {
  supDireito: ["55", "54", "53", "52", "51"],
  supEsquerdo: ["61", "62", "63", "64", "65"],
  infEsquerdo: ["71", "72", "73", "74", "75"],
  infDireito: ["85", "84", "83", "82", "81"],
};

export const FACES = [
  { valor: "oclusal", rotulo: "Oclusal/Incisal" },
  { valor: "vestibular", rotulo: "Vestibular" },
  { valor: "lingual", rotulo: "Lingual/Palatina" },
  { valor: "mesial", rotulo: "Mesial" },
  { valor: "distal", rotulo: "Distal" },
];

export const CONDICOES = [
  "Cárie",
  "Restauração existente",
  "Restauração a fazer",
  "Fratura",
  "Ausente",
  "Implante",
  "Prótese/coroa",
  "Endodontia",
  "Periodontia",
  "Extração indicada",
  "Hígido",
];

export const COR_STATUS: Record<string, string> = {
  planejado: "bg-amber-400",
  em_execucao: "bg-sky-500",
  concluido: "bg-emerald-500",
  existente: "bg-slate-400",
};

export type Marcacao = {
  id: string;
  dente: string;
  face: string | null;
  condicao: string;
  status: string;
  ativo: boolean;
};

function Dente({
  numero,
  marcacoes,
  onClick,
}: {
  numero: string;
  marcacoes: Marcacao[];
  onClick: (dente: string) => void;
}) {
  const doDente = marcacoes.filter((m) => m.dente === numero && m.ativo);
  const principal = doDente[0];
  return (
    <button
      type="button"
      onClick={() => onClick(numero)}
      title={doDente.map((m) => `${m.condicao}${m.face ? ` (${m.face})` : ""}`).join(", ")}
      className={cn(
        "flex h-14 w-10 flex-col items-center justify-between rounded-md border bg-card p-1 text-[10px] transition-all hover:border-primary hover:shadow-sm",
        doDente.length > 0 && "border-primary/60",
      )}
    >
      <span className="font-semibold text-foreground">{numero}</span>
      <span
        className={cn(
          "h-6 w-6 rounded-sm border",
          principal ? COR_STATUS[principal.status] ?? "bg-slate-300" : "bg-muted",
        )}
      />
      <span className="text-muted-foreground">{doDente.length || ""}</span>
    </button>
  );
}

export function Odontograma({
  marcacoes,
  onSelecionarDente,
  decidua = false,
}: {
  marcacoes: Marcacao[];
  onSelecionarDente: (dente: string) => void;
  decidua?: boolean;
}) {
  const mapa = decidua ? FDI_DECIDUA : FDI_PERMANENTE;
  const linha = (dentes: string[]) => (
    <div className="flex gap-1">
      {dentes.map((d) => (
        <Dente key={d} numero={d} marcacoes={marcacoes} onClick={onSelecionarDente} />
      ))}
    </div>
  );

  return (
    <div className="space-y-4 overflow-x-auto">
      <div className="flex justify-center gap-6">
        {linha(mapa.supDireito)}
        {linha(mapa.supEsquerdo)}
      </div>
      <div className="flex justify-center gap-6">
        {linha(mapa.infDireito)}
        {linha(mapa.infEsquerdo)}
      </div>
      <div className="flex flex-wrap justify-center gap-4 pt-2 text-xs text-muted-foreground">
        {Object.entries(COR_STATUS).map(([k, cor]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={cn("h-3 w-3 rounded-sm", cor)} /> {k.replace("_", " ")}
          </span>
        ))}
      </div>
    </div>
  );
}
