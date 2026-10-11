import { IMAGENS_TEMA, caminhoTema } from "./tema";
import { estrofesDaLetra, parseAvisos, parseBalancete } from "./parsers";
import { numeroDoSalmo, referenciaPorExtenso } from "./referencias";
import type {
  ContextoMissa,
  EstadoMissa,
  MomentoMusica,
  Slide,
  TextosParoquia,
} from "./tipos";

/* ------------------------------------------------------------------ */
/*  Seções do roteiro (ordem do modelo da paróquia)                    */
/* ------------------------------------------------------------------ */

export interface Secao {
  id: string;
  rotulo: string;
  slides: Slide[];
  /** Insere uma tela em branco depois desta seção */
  brancoDepois: boolean;
}

export const ROTULOS_MUSICA: Record<MomentoMusica, { rotulo: string; titulo: string }> = {
  abertura: { rotulo: "Canto de abertura", titulo: "CANTO DE ABERTURA" },
  "ato-penitencial": { rotulo: "Ato penitencial", titulo: "ATO PENITENCIAL" },
  gloria: { rotulo: "Hino de louvor", titulo: "HINO DE LOUVOR" },
  aclamacao: { rotulo: "Aclamação", titulo: "ACLAMAÇÃO" },
  ofertorio: { rotulo: "Ofertório", titulo: "OFERTÓRIO" },
  santo: { rotulo: "Santo", titulo: "SANTO" },
  cordeiro: { rotulo: "Cordeiro", titulo: "CORDEIRO" },
  comunhao: { rotulo: "Canto de comunhão", titulo: "CANTO DE COMUNHÃO" },
};

const DIAS_SEMANA = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];

function diaDaSemana(dataIso: string): number {
  const [a, m, d] = dataIso.split("-").map(Number);
  return new Date(a, m - 1, d).getDay();
}

/** "19:00" + "2026-10-11" → "19H00 DOMINGO 11-10" (padrão dos arquivos da paróquia) */
export function nomeDaMissa(dataIso: string, horario: string): string {
  const [, m, d] = dataIso.split("-");
  const [hh, mm] = horario.split(":");
  return `${hh}H${mm} ${DIAS_SEMANA[diaDaSemana(dataIso)]} ${d}-${m}`;
}

/* ------------------------------------------------------------------ */
/*  Textos da paróquia                                                 */
/* ------------------------------------------------------------------ */

function slidesDoTexto(textos: TextosParoquia, chave: string): string[] {
  const s = textos[chave]?.conteudo?.slides;
  return Array.isArray(s) ? s.map(String) : [];
}

function tituloDoTexto(textos: TextosParoquia, chave: string, padrao: string): string {
  return textos[chave]?.titulo ?? padrao;
}

export function oracoesEucaristicas(textos: TextosParoquia): string[] {
  return Object.keys(textos)
    .filter((k) => k.startsWith("oe-"))
    .map((k) => k.slice(3))
    .sort();
}

export function opcoesMisterioFe(textos: TextosParoquia): string[] {
  const o = textos["misterio-fe"]?.conteudo?.opcoes;
  return Array.isArray(o) ? o.map(String) : [];
}

const AVISO_SEM_TEXTO = "(cadastre este texto em Textos da paróquia)";

/* ------------------------------------------------------------------ */
/*  Estado inicial                                                     */
/* ------------------------------------------------------------------ */

export function estadoInicial(
  dataIso: string,
  diaLiturgico: string,
  textos: TextosParoquia,
  comMusica: boolean,
): EstadoMissa {
  const domingo = diaDaSemana(dataIso) === 0;
  const solene = /solenidade/i.test(diaLiturgico);
  const festa = solene || /\bfesta\b/i.test(diaLiturgico);
  const penitencial = /advento|quaresma/i.test(diaLiturgico) && !festa;
  const oes = oracoesEucaristicas(textos);
  const oePadrao = domingo || solene ? "III" : "II";

  return {
    versao: 1,
    comMusica,
    gloria: (domingo && !penitencial) || festa,
    creio: domingo || solene ? "curto" : "nenhum",
    oracaoEucaristica: oes.includes(oePadrao) ? oePadrao : (oes[0] ?? ""),
    misterioFe: 0,
    respostaPreces: String(textos.preces?.conteudo?.resposta_padrao ?? "Senhor, escutai a nossa oração!"),
    aclamacaoVerso: "",
    musicas: {},
    avisosTexto: "",
    balanceteTexto: "",
    imagensEvangelho: null,
    liturgia: {},
    ordemSecoes: [],
    secoesDesligadas: [],
    extras: [],
    ocultos: [],
    edicoes: {},
  };
}

/* ------------------------------------------------------------------ */
/*  Geração                                                            */
/* ------------------------------------------------------------------ */

export function gerarSecoes(ctx: ContextoMissa, e: EstadoMissa): Secao[] {
  const tema = (rel: string) => caminhoTema(ctx.paroquiaId, rel);
  const lit = {
    dia: e.liturgia.diaLiturgico ?? ctx.diaLiturgico,
    l1: e.liturgia.leitura1 ?? ctx.leitura1,
    salmo: e.liturgia.salmo ?? ctx.salmo,
    refrao: e.liturgia.salmoRefrao ?? ctx.salmoRefrao,
    l2: e.liturgia.leitura2 ?? ctx.leitura2,
    ev: e.liturgia.evangelho ?? ctx.evangelho,
  };
  const secoes: Secao[] = [];
  const add = (id: string, rotulo: string, slides: Slide[], brancoDepois = true) => {
    if (slides.length) secoes.push({ id, rotulo, slides, brancoDepois });
  };

  const musica = (momento: MomentoMusica, letraPadrao = "") => {
    const m = e.musicas[momento];
    const estrofes = estrofesDaLetra(m?.letra || letraPadrao);
    const { rotulo, titulo } = ROTULOS_MUSICA[momento];
    const slides: Slide[] = (estrofes.length ? estrofes : [""]).map((texto, i) => ({
      id: `${momento}-${i + 1}`,
      secao: momento,
      tipo: "faixa-texto",
      titulo,
      faixa: "liturgica",
      texto,
      fonte: 48,
    }));
    add(momento, rotulo, slides);
  };

  // Capa
  const refsCapa = [
    lit.l1 && `1º Leitura: ${referenciaPorExtenso(lit.l1)}`,
    lit.salmo && `Salmo: ${numeroDoSalmo(lit.salmo)}`,
    lit.l2 && `2º Leitura: ${referenciaPorExtenso(lit.l2)}`,
    lit.ev && `Evangelho: ${referenciaPorExtenso(lit.ev)}`,
  ].filter(Boolean);
  add(
    "capa",
    "Capa",
    [
      {
        id: "capa",
        secao: "capa",
        tipo: "capa",
        titulo: lit.dia,
        texto: refsCapa.join("\n"),
        rodape: nomeDaMissa(ctx.data, ctx.horario).replace(/^(\S+) /, "$1 · "),
        imagem: tema(IMAGENS_TEMA.capa(ctx.cor)),
      },
    ],
    false,
  );

  add(
    "oracao-preparacao",
    "Oração de preparação",
    slidesDoTexto(ctx.textos, "oracao-preparacao").map((texto, i) => ({
      id: `oracao-preparacao-${i + 1}`,
      secao: "oracao-preparacao",
      tipo: "faixa-texto",
      titulo: tituloDoTexto(ctx.textos, "oracao-preparacao", "ORAÇÃO DE PREPARAÇÃO PARA A MISSA"),
      faixa: "fixa",
      icone: true,
      texto,
      fonte: 35,
    })),
    false,
  );

  add("lgpd", "Comunicado LGPD", [
    { id: "lgpd", secao: "lgpd", tipo: "imagem", imagem: tema(IMAGENS_TEMA.lgpd) },
  ]);

  if (e.comMusica) {
    musica("abertura");
    musica("ato-penitencial");
    if (e.gloria) musica("gloria");
  }

  const capaLeitura = (id: string, titulo: string, ref?: string) =>
    ref &&
    add(id, titulo, [
      {
        id,
        secao: id,
        tipo: "leitura-capa",
        titulo,
        texto: referenciaPorExtenso(ref),
        imagem: tema(IMAGENS_TEMA.leituraFundo),
      },
    ]);

  capaLeitura("leitura1", "1º Leitura", lit.l1);

  if (lit.refrao || lit.salmo) {
    add("salmo", "Salmo responsorial", [
      {
        id: "salmo",
        secao: "salmo",
        tipo: "faixa-texto",
        titulo: `SALMO RESPONSORIAL ${numeroDoSalmo(lit.salmo)}`.trim(),
        faixa: "liturgica",
        texto: lit.refrao ?? "",
        italico: true,
        fonte: 54,
      },
    ]);
  }

  capaLeitura("leitura2", "2º Leitura", lit.l2);

  if (e.comMusica) {
    musica(
      "aclamacao",
      ["Aleluia, aleluia, aleluia, aleluia!", e.aclamacaoVerso].filter(Boolean).join("\n"),
    );
  }

  // Evangelho: capa + imagens do tema do Evangelho, sem branco entre elas
  if (lit.ev) {
    add(
      "evangelho",
      "Evangelho",
      [
        {
          id: "evangelho",
          secao: "evangelho",
          tipo: "leitura-capa",
          titulo: "Evangelho",
          texto: referenciaPorExtenso(lit.ev),
          imagem: tema(IMAGENS_TEMA.leituraFundo),
        },
      ],
      false,
    );
    const imagens = e.imagensEvangelho ?? ctx.imagensEvangelhoPadrao;
    add(
      "evangelho-imagens",
      "Imagem do Evangelho",
      imagens.map((imagem, i) => ({
        id: `evangelho-imagem-${i + 1}`,
        secao: "evangelho-imagens",
        tipo: "imagem",
        imagem,
      })),
    );
    // Sem imagem cadastrada: o branco vem logo após a capa do Evangelho
    if (!imagens.length) secoes[secoes.length - 1].brancoDepois = true;
  }

  if (e.creio !== "nenhum") {
    const chave = e.creio === "longo" ? "creio-longo" : "creio-curto";
    const textos = slidesDoTexto(ctx.textos, chave);
    add(
      "creio",
      "Profissão de fé",
      (textos.length ? textos : [AVISO_SEM_TEXTO]).map((texto, i) => ({
        id: `creio-${i + 1}`,
        secao: "creio",
        tipo: "faixa-texto",
        titulo: tituloDoTexto(ctx.textos, chave, "PROFISSÃO DE FÉ"),
        faixa: "fixa",
        icone: true,
        texto,
        fonte: 54,
      })),
    );
  }

  add("preces", "Oração da comunidade", [
    {
      id: "preces",
      secao: "preces",
      tipo: "faixa-texto",
      titulo: tituloDoTexto(ctx.textos, "preces", "ORAÇÃO DA COMUNIDADE"),
      faixa: "fixa",
      icone: true,
      texto: `R: ${e.respostaPreces}`,
      italico: true,
      fonte: 54,
    },
  ]);

  if (e.comMusica) musica("ofertorio");

  add(
    "liturgia-eucaristica",
    "Liturgia eucarística",
    slidesDoTexto(ctx.textos, "liturgia-eucaristica").map((texto, i) => ({
      id: `liturgia-eucaristica-${i + 1}`,
      secao: "liturgia-eucaristica",
      tipo: "faixa-texto",
      titulo: tituloDoTexto(ctx.textos, "liturgia-eucaristica", "LITURGIA EUCARÍSTICA"),
      faixa: "fixa",
      texto,
      italico: true,
      fonte: 54,
    })),
  );

  const oe = ctx.textos[`oe-${e.oracaoEucaristica}`];
  if (oe) {
    add("oe-titulo", "Oração eucarística", [
      { id: "oe-titulo", secao: "oe-titulo", tipo: "faixa-central", titulo: oe.titulo, faixa: "liturgica" },
    ]);
  }

  if (e.comMusica) musica("santo");

  if (oe) {
    const misterio = opcoesMisterioFe(ctx.textos)[e.misterioFe] ?? "";
    const aclamacoes = Array.isArray(oe.conteudo.aclamacoes) ? oe.conteudo.aclamacoes.map(String) : [];
    aclamacoes.forEach((a, i) => {
      const id = `oe-aclamacao-${i + 1}`;
      add(id, i === 0 ? "Aclamações da OE" : `Aclamação ${i + 1}`, [
        {
          id,
          secao: id,
          tipo: "texto-central",
          texto: a.replace("{misterio}", misterio),
          italico: true,
          fonte: 54,
        },
      ]);
    });
  }

  add(
    "doxologia",
    "Doxologia do Pai-nosso",
    slidesDoTexto(ctx.textos, "doxologia").map((texto, i) => ({
      id: `doxologia-${i + 1}`,
      secao: "doxologia",
      tipo: "texto-central",
      texto,
      italico: true,
      fonte: 54,
    })),
  );

  if (e.comMusica) {
    musica("cordeiro");
    musica("comunhao");
  }

  add(
    "apos-comungar",
    "Oração após comungar",
    slidesDoTexto(ctx.textos, "apos-comungar").map((texto, i) => ({
      id: `apos-comungar-${i + 1}`,
      secao: "apos-comungar",
      tipo: "faixa-texto",
      titulo: tituloDoTexto(ctx.textos, "apos-comungar", "ORAÇÃO APÓS COMUNGAR"),
      faixa: "fixa",
      icone: true,
      texto,
      fonte: 46,
    })),
  );

  const balancete = parseBalancete(e.balanceteTexto, ctx.data);
  if (balancete) {
    add(
      "balancete",
      "Prestação de contas",
      [
        {
          id: "balancete",
          secao: "balancete",
          tipo: "balancete",
          titulo: balancete.titulo,
          texto: balancete.linhas.join("\n"),
          imagem: tema(IMAGENS_TEMA.balanceteIcone),
          fonte: 33,
        },
      ],
      false,
    );
  }

  const avisos = parseAvisos(e.avisosTexto);
  add(
    "avisos",
    "Avisos",
    avisos.map((a, i) => ({
      id: `aviso-${i + 1}`,
      secao: "avisos",
      tipo: "aviso",
      titulo: a.titulo,
      texto: a.texto,
      imagem: tema(IMAGENS_TEMA.avisosFundo),
      fonte: 41,
    })),
  );

  add(
    "final",
    "Encerramento",
    [{ id: "final", secao: "final", tipo: "final", imagem: tema(IMAGENS_TEMA.logo), texto: ctx.instagram ?? "" }],
    false,
  );

  return secoes;
}

/** Ordem final das seções, considerando as telas extras e a ordem personalizada */
export function organizarSecoes(secoes: Secao[], e: EstadoMissa): Secao[] {
  const base = [...secoes];
  for (const extra of e.extras) {
    const idx = base.findIndex((s) => s.id === extra.depoisDe);
    const slide: Slide =
      extra.tipo === "imagem"
        ? { id: extra.id, secao: extra.id, tipo: "imagem", imagem: extra.imagem }
        : extra.tipo === "branco"
          ? { id: extra.id, secao: extra.id, tipo: "branco" }
          : {
              id: extra.id,
              secao: extra.id,
              tipo: "faixa-texto",
              titulo: extra.titulo ?? "",
              texto: extra.texto ?? "",
              faixa: "liturgica",
              fonte: 48,
            };
    base.splice(idx >= 0 ? idx + 1 : base.length, 0, {
      id: extra.id,
      rotulo: extra.tipo === "imagem" ? "Imagem extra" : extra.tipo === "branco" ? "Tela em branco" : "Texto extra",
      slides: [slide],
      brancoDepois: extra.tipo !== "branco",
    });
  }
  return e.ordemSecoes.length ? aplicarOrdem(base, e.ordemSecoes) : base;
}

/**
 * Reordena pela lista salva. Seções que não estão na lista (ex.: uma música ligada
 * depois) ficam logo após a seção que as precede no modelo.
 */
function aplicarOrdem(base: Secao[], ordem: string[]): Secao[] {
  const pos = new Map(ordem.map((id, i) => [id, i]));
  const out = base.filter((s) => pos.has(s.id)).sort((a, b) => pos.get(a.id)! - pos.get(b.id)!);
  let anterior: string | null = null;
  for (const s of base) {
    if (!pos.has(s.id)) {
      const idx = anterior ? out.findIndex((x) => x.id === anterior) : -1;
      out.splice(idx + 1, 0, s);
    }
    anterior = s.id;
  }
  return out;
}

/** Slides finais: seções ligadas, brancos entre blocos, edições e ocultos aplicados */
export function montarSlides(secoes: Secao[], e: EstadoMissa): Slide[] {
  const ativos = secoes.filter((s) => !e.secoesDesligadas.includes(s.id));
  const out: Slide[] = [];
  ativos.forEach((s, i) => {
    out.push(...s.slides);
    const ultima = i === ativos.length - 1;
    if (s.brancoDepois && !ultima) {
      out.push({ id: `${s.id}-branco`, secao: s.id, tipo: "branco" });
    }
  });
  // Nunca dois brancos seguidos (ex.: seção desligada entre dois brancos)
  const semDuplicados = out.filter((s, i) => !(s.tipo === "branco" && out[i - 1]?.tipo === "branco"));
  return semDuplicados
    .filter((s) => !e.ocultos.includes(s.id))
    .map((s) => (e.edicoes[s.id] ? { ...s, ...e.edicoes[s.id] } : s));
}
