export type TemaId =
  | "golden-baroque"
  | "dark-mode-sacro"
  | "minimalist-white"
  | "digital-light"
  | "byzantine-gold"
  | "sacro-classico";

export interface Tema {
  id: TemaId;
  nome: string;
  estilo: "claro" | "escuro" | "barroco";
  paleta: {
    fundo: string;
    fundoSecundario: string;
    texto: string;
    realce: string;
  };
  fonteTitulo: string;
  fonteCorpo: string;
}
