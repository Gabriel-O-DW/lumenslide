export type TemaId =
  | "paroquial-classico"
  | "golden-baroque"
  | "dark-mode-sacro"
  | "minimalist-white"
  | "digital-light"
  | "byzantine-gold"
  | "sacro-classico";

export type EstiloBanner = "ribbon-gold" | "ribbon-blue" | "minimal" | "none";

export interface Tema {
  id: TemaId;
  nome: string;
  estilo: "claro" | "escuro" | "barroco";
  paleta: {
    fundo: string;
    fundoSecundario: string;
    texto: string;
    realce: string;
    destaqueCapa?: string;
    bannerGold?: string;
    bannerBlue?: string;
  };
  fonteTitulo: string;
  fonteCorpo: string;
  estiloBanner: EstiloBanner;
  rodape?: string;
}
