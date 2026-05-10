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
  /** Chamada antes do texto (ex.: "Leitura dos Atos dos Apóstolos:") */
  chamada?: string;
  chamadaResposta?: string;
  /** Rodapé da leitura (ex.: "Palavra do Senhor") */
  rodape?: string;
  rodapeResposta?: string;
}

export interface SalmoNormalizado {
  titulo: string;
  referencia?: string;
  refrao: string;
  texto: string;
}

export interface LiturgiaDiaria {
  data: string;
  diaLiturgico?: string;
  cor: CorLiturgicaSlug;
  corRotulo: string;
  primeiraLeitura?: LeituraNormalizada;
  salmo?: SalmoNormalizado;
  segundaLeitura?: LeituraNormalizada;
  evangelho?: LeituraNormalizada;
  fonte?: string;
}
