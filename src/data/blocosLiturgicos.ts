import type { RiteKey } from "../components/RiteTabs";

export type TipoBloco =
  | "generico"
  | "leitura"
  | "salmo"
  | "ordinario"
  | "canto";

export interface BlocoSlide {
  id: string;
  rito: RiteKey;
  tipo: TipoBloco;
  titulo: string;
  citacao?: string;
  texto: string;
}

/**
 * Estrutura padrão de um Missa dominical.
 * Os textos do Ordinário (Glória, Credo, Santo, Cordeiro de Deus etc.) estão
 * resumidos para evitar reprodução de textos com restrição autoral —
 * substitua pela edição litúrgica que sua paróquia utiliza.
 */
export function blocosIniciaisDoRito(): BlocoSlide[] {
  return [
    // Ritos Iniciais
    {
      id: "abertura",
      rito: "iniciais",
      tipo: "generico",
      titulo: "Saudação Inicial",
      texto:
        "Em nome do Pai e do Filho e do Espírito Santo. **Amém.**\n\n" +
        "A graça de Nosso Senhor Jesus Cristo, o amor do Pai e a comunhão do Espírito Santo estejam convosco. **Bendito seja Deus que nos reuniu no amor de Cristo.**",
    },
    {
      id: "ato-penitencial",
      rito: "iniciais",
      tipo: "ordinario",
      titulo: "Ato Penitencial",
      texto:
        "Senhor, tende piedade de nós. **Senhor, tende piedade de nós.**\n" +
        "Cristo, tende piedade de nós. **Cristo, tende piedade de nós.**\n" +
        "Senhor, tende piedade de nós. **Senhor, tende piedade de nós.**",
    },
    {
      id: "gloria",
      rito: "iniciais",
      tipo: "ordinario",
      titulo: "Glória",
      texto:
        "(Texto do Glória — substitua pelo do Missal Romano oficialmente em uso na sua paróquia.)",
    },

    // Liturgia da Palavra
    {
      id: "leitura1",
      rito: "palavra",
      tipo: "leitura",
      titulo: "Primeira Leitura",
      citacao: "(referência do dia)",
      texto: "Texto da primeira leitura — preencha automaticamente pela API selecionando uma data no Dashboard.",
    },
    {
      id: "salmo",
      rito: "palavra",
      tipo: "salmo",
      titulo: "Salmo Responsorial",
      citacao: "(referência do dia)",
      texto:
        "R. (refrão do salmo do dia)\n\n" +
        "Estrofe 1 — preencha automaticamente pela API.\n" +
        "Estrofe 2 — preencha automaticamente pela API.",
    },
    {
      id: "leitura2",
      rito: "palavra",
      tipo: "leitura",
      titulo: "Segunda Leitura",
      citacao: "(referência do dia)",
      texto: "Texto da segunda leitura — preencha automaticamente pela API.",
    },
    {
      id: "evangelho",
      rito: "palavra",
      tipo: "leitura",
      titulo: "Evangelho",
      citacao: "(referência do dia)",
      texto: "Proclamação do Evangelho — preencha automaticamente pela API.",
    },
    {
      id: "credo",
      rito: "palavra",
      tipo: "ordinario",
      titulo: "Profissão de Fé",
      texto:
        "(Texto do Credo Niceno-Constantinopolitano ou Apostólico — substitua pelo Missal oficialmente em uso.)",
    },

    // Liturgia Eucarística
    {
      id: "ofertorio",
      rito: "eucaristica",
      tipo: "canto",
      titulo: "Ofertório",
      texto:
        "Bendito sejais, Senhor Deus do universo, pelo pão que recebemos de vossa bondade. **Bendito seja Deus para sempre.**",
    },
    {
      id: "oracao-eucaristica-ii",
      rito: "eucaristica",
      tipo: "ordinario",
      titulo: "Oração Eucarística II",
      texto:
        "Na verdade, ó Pai, vós sois santo e fonte de toda santidade.\n" +
        "Santificai estas oferendas, derramando sobre elas o vosso Espírito, **a fim de que se tornem para nós o Corpo e ✝ o Sangue de Jesus Cristo, vosso Filho e Senhor nosso.**",
    },
    {
      id: "santo",
      rito: "eucaristica",
      tipo: "ordinario",
      titulo: "Santo",
      texto:
        "**Santo, Santo, Santo, Senhor Deus do Universo!**\n" +
        "**O céu e a terra proclamam a vossa glória. Hosana nas alturas!**",
    },
    {
      id: "pai-nosso",
      rito: "eucaristica",
      tipo: "ordinario",
      titulo: "Pai-Nosso",
      texto:
        "**Pai nosso que estais nos céus, santificado seja o vosso nome…**",
    },
    {
      id: "comunhao",
      rito: "eucaristica",
      tipo: "canto",
      titulo: "Comunhão",
      texto: "Canto de Comunhão — adicione o canto desejado pela tela Músicas.",
    },

    // Ritos Finais
    {
      id: "avisos",
      rito: "finais",
      tipo: "generico",
      titulo: "Avisos da Comunidade",
      texto: "Espaço para avisos paroquiais.",
    },
    {
      id: "bencao-final",
      rito: "finais",
      tipo: "ordinario",
      titulo: "Bênção Final",
      texto:
        "O Senhor esteja convosco. **Ele está no meio de nós.**\n" +
        "Abençoe-vos Deus todo-poderoso, Pai e Filho e Espírito Santo. **Amém.**",
    },
    {
      id: "ide-em-paz",
      rito: "finais",
      tipo: "generico",
      titulo: "Ide em Paz",
      texto: "Ide em paz, e o Senhor vos acompanhe. **Graças a Deus.**",
    },
  ];
}
