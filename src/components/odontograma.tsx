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

type TipoDente = "incisivo-central" | "incisivo-lateral" | "canino" | "pre-molar" | "molar";

function tipoDoDente(numero: string): TipoDente {
  const posicao = Number(numero.at(-1));
  if (posicao === 1) return "incisivo-central";
  if (posicao === 2) return "incisivo-lateral";
  if (posicao === 3) return "canino";
  if (posicao === 4 || posicao === 5) return "pre-molar";
  return "molar";
}

const FORMAS: Record<TipoDente, string> = {
  "incisivo-central": "M18 5C13 5 10 8 10 14c0 6 3 11 4 17 1 7 2 16 6 16s5-9 6-16c1-6 4-11 4-17 0-6-3-9-8-9Z",
  "incisivo-lateral": "M19 5c-5 0-8 3-8 9 0 6 3 11 4 17 1 7 2 16 5 16s4-9 5-16c1-6 4-11 4-17 0-6-3-9-8-9Z",
  canino: "M20 4c-3 4-10 4-10 11 0 6 3 11 5 17 1 5 2 15 5 15s4-10 5-15c2-6 5-11 5-17 0-7-7-7-10-11Z",
  "pre-molar": "M12 7c3-3 13-3 16 0 4 4 3 12 1 18-2 6-3 16-9 16s-7-10-9-16c-2-6-3-14 1-18Z",
  molar: "M9 7c4-4 7-1 11-3 4-2 8-1 11 3 4 5 1 13-1 19-2 6-4 15-10 15s-8-9-10-15c-2-6-5-14 0-19Z",
};

function ImagemDente({ numero, marcado }: { numero: string; marcado: boolean }) {
  const tipo = tipoDoDente(numero);
  const inferior = Number(numero[0]) === 3 || Number(numero[0]) === 4 || Number(numero[0]) === 7 || Number(numero[0]) === 8;
  return (
    <svg
      viewBox="0 0 40 52"
      aria-hidden="true"
      className={cn("h-12 w-9 drop-shadow-sm transition-transform group-hover:scale-105", inferior && "rotate-180")}
    >
      <path
        d={FORMAS[tipo]}
        className={cn(
          "fill-card stroke-muted-foreground/70 stroke-[1.25]",
          marcado && "fill-primary/10 stroke-primary",
        )}
      />
      {tipo === "molar" ? (
        <>
          <path d="M12 14c3 3 5 3 8 0 3 3 5 3 8 0" className="fill-none stroke-muted-foreground/50 stroke-[1.1]" />
          <path d="M20 14v11" className="fill-none stroke-muted-foreground/35 stroke-[1]" />
        </>
      ) : null}
      {tipo === "pre-molar" ? (
        <path d="M14 14c4 3 8 3 12 0M20 13v10" className="fill-none stroke-muted-foreground/45 stroke-[1]" />
      ) : null}
      {tipo === "canino" ? <path d="M13 15c5 2 9 2 14 0" className="fill-none stroke-muted-foreground/45 stroke-[1]" /> : null}
      {tipo.startsWith("incisivo") ? <path d="M13 15h14" className="fill-none stroke-muted-foreground/40 stroke-[1]" /> : null}
    </svg>
  );
}

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
        "group relative flex h-[78px] w-12 shrink-0 flex-col items-center justify-between rounded-md border bg-card px-1 py-1.5 text-[10px] transition-all hover:border-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        doDente.length > 0 && "border-primary/60",
      )}
    >
      <ImagemDente numero={numero} marcado={doDente.length > 0} />
      <span className="font-semibold text-foreground">{numero}</span>
      {principal ? (
        <span
          className={cn(
            "absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-card",
            COR_STATUS[principal.status] ?? "bg-muted-foreground",
          )}
        />
      ) : null}
      {doDente.length > 1 ? (
        <span className="absolute left-1 top-1 rounded-full bg-primary px-1 text-[8px] font-semibold text-primary-foreground">
          {doDente.length}
        </span>
      ) : null}
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
    <div className="space-y-4 overflow-x-auto pb-2">
      <div className="flex min-w-max justify-center gap-5 px-2">
        {linha(mapa.supDireito)}
        {linha(mapa.supEsquerdo)}
      </div>
      <div className="flex min-w-max justify-center gap-5 px-2">
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
