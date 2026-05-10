import type { Musica } from "../types/musica";

/**
 * Banco de músicas mock.
 * Letras intencionalmente genéricas / de domínio público — substitua pelos
 * cantos da sua paróquia ou de fontes com permissão explícita de uso.
 */
export const musicasMock: Musica[] = [
  {
    id: "canto-entrada-1",
    titulo: "Canto de Entrada — Vinhamos Todos",
    autor: "Trad.",
    momento: "entrada",
    tom: "G",
    duracaoSegundos: 245,
    refrao:
      "Vinhamos todos com alegria à casa do Senhor; / louvor cantemos ao nosso Deus.",
    estrofes: [
      "1. Alegrai-vos, povos santos, / abri portas ao Senhor: / vem chegando o Rei da Glória, / vem chegando o Salvador.",
      "2. Lança a treva sua sombra, / mas a luz brilhará: / nossa fé nos faz testemunhas / da Palavra que nos guiará.",
    ],
  },
  {
    id: "gloria-melodia-sagrada",
    titulo: "Glória — Melodia Sagrada",
    autor: "Tradicional adaptado",
    momento: "gloria",
    tom: "C",
    duracaoSegundos: 190,
    refrao:
      "Glória a Deus nas alturas / e paz na terra / aos homens por Ele amados.",
    estrofes: [
      "Senhor Deus, Rei dos céus, / Deus Pai todo-poderoso: / nós vos louvamos, / nós vos bendizemos.",
      "Senhor Jesus Cristo, / Filho Unigênito, / Senhor Deus, Cordeiro de Deus, / Filho de Deus Pai.",
    ],
  },
  {
    id: "salmo-responsorial-padrao",
    titulo: "Salmo Responsorial",
    momento: "salmo",
    duracaoSegundos: 130,
    refrao: "(insira o refrão do salmo do dia)",
    estrofes: [
      "Estrofe 1 — substitua pelo texto do dia.",
      "Estrofe 2 — substitua pelo texto do dia.",
    ],
  },
  {
    id: "aclamacao-evangelho",
    titulo: "Aclamação ao Evangelho",
    momento: "aclamacao",
    duracaoSegundos: 75,
    refrao: "Aleluia, aleluia, aleluia!",
    estrofes: [
      "(insira o versículo da aclamação do dia)",
    ],
  },
  {
    id: "ofertorio-da-natureza",
    titulo: "Ofertório — Da Natureza Tudo Vem",
    momento: "ofertorio",
    duracaoSegundos: 215,
    refrao:
      "Da natureza tudo vem como um sinal de amor; / por Vossa graça, ó Senhor, recebei o que sou.",
    estrofes: [
      "1. O pão que ofertamos, fruto da terra: / fruto também do trabalho do homem.",
      "2. O vinho que ofertamos, fruto da videira: / fruto também do trabalho do homem.",
    ],
  },
  {
    id: "santo-classico",
    titulo: "Santo — Clássico",
    momento: "santo",
    duracaoSegundos: 160,
    refrao:
      "Santo, Santo, Santo, / Senhor Deus do universo!",
    estrofes: [
      "O céu e a terra proclamam a vossa glória.",
      "Hosana nas alturas! / Bendito o que vem em nome do Senhor.",
    ],
  },
  {
    id: "comunhao-pao-da-vida",
    titulo: "Comunhão — Pão da Vida",
    momento: "comunhao",
    duracaoSegundos: 240,
    refrao: "Eu sou o Pão da Vida; / quem vier a Mim não terá mais fome.",
    estrofes: [
      "1. Vinde a Mim todos vós que estais cansados / e Eu vos darei descanso.",
      "2. Aquele que comer deste pão / viverá eternamente.",
    ],
  },
  {
    id: "canto-final-ide-em-paz",
    titulo: "Canto Final — Ide em Paz",
    momento: "final",
    duracaoSegundos: 180,
    refrao: "Ide em paz, glorificai ao Senhor com vossa vida.",
    estrofes: [
      "1. Que a paz que recebemos seja luz no caminho.",
      "2. Que o pão partilhado nos faça testemunhas.",
    ],
  },
];
