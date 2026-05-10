import type { Tema } from "../types/tema";

/**
 * Temas disponíveis para os slides.
 * O primeiro item é o tema **padrão** ao abrir uma celebração nova.
 *
 * "Paroquial Clássico" é inspirado no padrão usado por paróquias brasileiras
 * (faixa dourada/bronze para seções, faixa azul para a Profissão de Fé,
 * fundo creme com texto escuro grande, capa com data em azul litúrgico e
 * rodapé com o nome da paróquia).
 */
export const temasDisponiveis: Tema[] = [
  {
    id: "paroquial-classico",
    nome: "Paroquial Clássico",
    estilo: "claro",
    paleta: {
      fundo: "#fdfaf3",
      fundoSecundario: "#f5ecd9",
      texto: "#262626",
      realce: "#9b8053",
      destaqueCapa: "#0070c0",
      bannerGold: "#9b8053",
      bannerBlue: "#1f6fb8",
    },
    fonteTitulo: "'Lato', 'Helvetica Neue', Arial, sans-serif",
    fonteCorpo: "'Lato', 'Helvetica Neue', Arial, sans-serif",
    estiloBanner: "ribbon-gold",
    rodape: "Paróquia Nossa Senhora Rainha dos Apóstolos",
  },
  {
    id: "golden-baroque",
    nome: "Golden Baroque",
    estilo: "barroco",
    paleta: {
      fundo: "#2a1a08",
      fundoSecundario: "#3d260c",
      texto: "#fff5e1",
      realce: "#d4a437",
      destaqueCapa: "#ffd87a",
    },
    fonteTitulo: "Cinzel, serif",
    fonteCorpo: "Garamond, serif",
    estiloBanner: "minimal",
  },
  {
    id: "dark-mode-sacro",
    nome: "Dark Mode Sacro",
    estilo: "escuro",
    paleta: {
      fundo: "#0d0a06",
      fundoSecundario: "#1a1510",
      texto: "#f4ece0",
      realce: "#c98b2b",
      destaqueCapa: "#f4d089",
    },
    fonteTitulo: "Inter, sans-serif",
    fonteCorpo: "Inter, sans-serif",
    estiloBanner: "minimal",
  },
  {
    id: "minimalist-white",
    nome: "Minimalist White",
    estilo: "claro",
    paleta: {
      fundo: "#fafafa",
      fundoSecundario: "#ffffff",
      texto: "#1a1a1a",
      realce: "#8a5a14",
      destaqueCapa: "#0070c0",
    },
    fonteTitulo: "Inter, sans-serif",
    fonteCorpo: "Inter, sans-serif",
    estiloBanner: "none",
  },
  {
    id: "digital-light",
    nome: "Digital Light",
    estilo: "escuro",
    paleta: {
      fundo: "#0a1428",
      fundoSecundario: "#0f1f3d",
      texto: "#e8eefc",
      realce: "#34d4d4",
      destaqueCapa: "#34d4d4",
    },
    fonteTitulo: "Inter, sans-serif",
    fonteCorpo: "Inter, sans-serif",
    estiloBanner: "minimal",
  },
  {
    id: "byzantine-gold",
    nome: "Byzantine Gold",
    estilo: "barroco",
    paleta: {
      fundo: "#1c0e0e",
      fundoSecundario: "#2a1414",
      texto: "#fff2d6",
      realce: "#e6b94f",
      destaqueCapa: "#ffd87a",
    },
    fonteTitulo: "Cinzel, serif",
    fonteCorpo: "Garamond, serif",
    estiloBanner: "minimal",
  },
  {
    id: "sacro-classico",
    nome: "Sacro Clássico",
    estilo: "claro",
    paleta: {
      fundo: "#fff8ef",
      fundoSecundario: "#fdeeda",
      texto: "#2a1a08",
      realce: "#a4262c",
      destaqueCapa: "#a4262c",
    },
    fonteTitulo: "Garamond, serif",
    fonteCorpo: "Garamond, serif",
    estiloBanner: "minimal",
  },
];
