export type MomentoMissa =
  | "entrada"
  | "ato-penitencial"
  | "gloria"
  | "salmo"
  | "aclamacao"
  | "ofertorio"
  | "santo"
  | "comunhao"
  | "final"
  | "outro";

export interface Musica {
  id: string;
  titulo: string;
  autor?: string;
  momento: MomentoMissa;
  tom?: string;
  duracaoSegundos?: number;
  refrao?: string;
  estrofes: string[];
}
