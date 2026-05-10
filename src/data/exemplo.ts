import type { Slide } from "../types/slide";

/**
 * Celebração de exemplo, usada para o MVP.
 * Os textos são placeholders genéricos — não substituem o lecionário/missal.
 */
export const celebracaoExemplo: Slide[] = [
  {
    id: "abertura",
    tipo: "generico",
    titulo: "Bem-vindos à Santa Missa",
    conteudo: "Em nome do Pai e do Filho e do Espírito Santo. Amém.",
    cor: "verde",
  },
  {
    id: "ato-penitencial",
    tipo: "ordinario",
    parte: "ato-penitencial",
    titulo: "Ato Penitencial",
    texto:
      "Senhor, tende piedade de nós.\nCristo, tende piedade de nós.\nSenhor, tende piedade de nós.",
    cor: "verde",
  },
  {
    id: "primeira-leitura",
    tipo: "leitura",
    titulo: "Primeira Leitura",
    citacao: "(insira a citação do dia)",
    texto:
      "Texto da primeira leitura aqui.\nEste é um placeholder — o LumenSlide preencherá automaticamente a partir do lecionário do dia.",
    cor: "verde",
  },
  {
    id: "salmo",
    tipo: "salmo",
    titulo: "Salmo Responsorial",
    refrao: "(refrão do salmo do dia)",
    estrofes: [
      "Primeira estrofe do salmo do dia.",
      "Segunda estrofe do salmo do dia.",
    ],
    cor: "verde",
  },
  {
    id: "evangelho",
    tipo: "leitura",
    titulo: "Evangelho",
    citacao: "(insira a citação do dia)",
    texto:
      "Proclamação do Evangelho.\nEste é um placeholder — o LumenSlide preencherá automaticamente a partir do lecionário do dia.",
    cor: "verde",
  },
  {
    id: "canto-comunhao",
    tipo: "canto",
    titulo: "Canto de Comunhão",
    refrao: "Refrão do canto / antífona da comunhão.",
    estrofes: [
      "1. Primeira estrofe do canto de comunhão.",
      "2. Segunda estrofe do canto de comunhão.",
    ],
    cor: "verde",
  },
  {
    id: "encerramento",
    tipo: "generico",
    titulo: "Ide em paz",
    conteudo: "Glorificai ao Senhor com vossa vida. Graças a Deus.",
    cor: "verde",
  },
];
