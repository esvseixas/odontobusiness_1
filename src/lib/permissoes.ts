import type { Papel } from "@/hooks/useSessao";

const GESTAO: Papel[] = ["owner", "admin"];
const CLINICO: Papel[] = ["owner", "admin", "dentista", "esteticista", "auxiliar", "recepcao"];

/** Papéis com acesso a cada área (prefixo do endereço). Áreas ausentes são livres para a equipe. */
export const ACESSO: Array<{ prefixo: string; papeis: Papel[] }> = [
  { prefixo: "/financeiro", papeis: ["owner", "admin", "financeiro"] },
  { prefixo: "/estoque", papeis: ["owner", "admin", "estoque", "auxiliar", "dentista", "esteticista", "recepcao"] },
  { prefixo: "/configuracoes/estoque", papeis: ["owner", "admin", "estoque", "auxiliar", "dentista", "esteticista", "recepcao"] },
  { prefixo: "/configuracoes/tabelas-preco", papeis: ["owner", "admin", "financeiro"] },
  { prefixo: "/configuracoes/plano-contas", papeis: ["owner", "admin", "financeiro"] },
  { prefixo: "/configuracoes/agenda", papeis: ["owner", "admin", "recepcao"] },
  { prefixo: "/configuracoes/modelos", papeis: ["owner", "admin", "dentista"] },
  { prefixo: "/configuracoes/laboratorios", papeis: ["owner", "admin", "dentista", "financeiro"] },
  { prefixo: "/configuracoes", papeis: GESTAO },
  { prefixo: "/pacientes", papeis: CLINICO },
  { prefixo: "/agenda", papeis: [...CLINICO, "marketing"] },
];

export function podeAcessar(caminho: string, papeis: Papel[]): boolean {
  const regra = ACESSO.find((r) => caminho === r.prefixo || caminho.startsWith(r.prefixo + "/"));
  if (!regra) return true;
  return papeis.some((p) => regra.papeis.includes(p));
}

export const NOME_PAPEL: Record<Papel, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  dentista: "Dentista",
  esteticista: "Esteticista",
  auxiliar: "Auxiliar",
  recepcao: "Recepção",
  financeiro: "Financeiro",
  estoque: "Estoque",
  marketing: "Marketing",
};
