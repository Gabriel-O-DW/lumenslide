/**
 * Cores litúrgicas oficiais.
 * Usadas para destacar visualmente os slides conforme o tempo / festa.
 */
export type CorLiturgica =
  | "branco"
  | "verde"
  | "roxo"
  | "vermelho"
  | "rosa"
  | "dourado";

/**
 * Tipos de slides litúrgicos suportados pelo LumenSlide.
 * Cada tipo tem um layout próprio em `SlideViewer`.
 */
export type Slide =
  | SlideGenerico
  | SlideLeitura
  | SlideSalmo
  | SlideCanto
  | SlideOrdinario;

interface SlideBase {
  id: string;
  cor?: CorLiturgica;
}

export interface SlideGenerico extends SlideBase {
  tipo: "generico";
  titulo: string;
  conteudo?: string;
}

export interface SlideLeitura extends SlideBase {
  tipo: "leitura";
  titulo: string; // ex.: "Primeira Leitura"
  citacao: string; // ex.: "Is 55,1-3"
  texto: string;
}

export interface SlideSalmo extends SlideBase {
  tipo: "salmo";
  titulo: string; // ex.: "Salmo Responsorial"
  refrao: string;
  estrofes: string[];
}

export interface SlideCanto extends SlideBase {
  tipo: "canto";
  titulo: string;
  refrao?: string;
  estrofes: string[];
}

export interface SlideOrdinario extends SlideBase {
  tipo: "ordinario";
  parte:
    | "ato-penitencial"
    | "gloria"
    | "credo"
    | "santo"
    | "cordeiro";
  titulo: string;
  texto: string;
}
