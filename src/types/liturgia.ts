/**
 * Tipos normalizados da liturgia diária.
 * A API original (api-liturgia-diaria.vercel.app) pode mudar de schema, então
 * aplicamos um normalizador defensivo em src/services/liturgia.ts.
 */
export type CorLiturgicaSlug =
  | "branca"
  | "verde"
  | "roxa"
  | "vermelha"
  | "rosa"
  | "dourada";

export interface LeituraNormalizada {
  titulo: string;
  referencia?: string;
  texto: string;
}

export interface SalmoNormalizado {
  titulo: string;
  referencia?: string;
  refrao: string;
  texto: string;
}

export interface LiturgiaDiaria {
  data: string; // ISO yyyy-mm-dd
  diaLiturgico?: string; // ex.: "Solenidade de Cristo Rei"
  cor: CorLiturgicaSlug;
  corRotulo: string; // ex.: "Vermelho"
  primeiraLeitura?: LeituraNormalizada;
  salmo?: SalmoNormalizado;
  segundaLeitura?: LeituraNormalizada;
  evangelho?: LeituraNormalizada;
  fonte?: string;
}
