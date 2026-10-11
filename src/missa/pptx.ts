import { FONTES } from "./tema";
import { LARGURA, ALTURA, MARGEM_TEXTO, RECUO_MARCADOR, layoutDoSlide, paragrafos, type Caixa } from "./layout";
import { imagemComoDataUrl } from "./imagens";
import type { CorTema, Slide } from "./tipos";

/** Gera e baixa o .pptx com as mesmas caixas usadas na prévia */
export async function exportarPptx(
  slides: Slide[],
  cor: CorTema,
  paroquiaId: string,
  nomeArquivo: string,
  aoProgredir?: (feito: number, total: number) => void,
): Promise<void> {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "LUMEN_16x9", width: LARGURA, height: ALTURA });
  pptx.layout = "LUMEN_16x9";
  pptx.title = nomeArquivo;

  const layouts = slides.map((s) => layoutDoSlide(s, cor, paroquiaId));

  // Baixa cada imagem uma única vez
  const caminhos = [...new Set(layouts.flat().flatMap((c) => (c.tipo === "imagem" ? [c.caminho] : [])))];
  const dados = new Map<string, ImagemCarregada>();
  let feito = 0;
  const total = caminhos.length + slides.length;
  await Promise.all(
    caminhos.map(async (c) => {
      try {
        const data = await imagemComoDataUrl(c);
        dados.set(c, { data, ...(await dimensoes(data)) });
      } finally {
        aoProgredir?.(++feito, total);
      }
    }),
  );

  for (const caixas of layouts) {
    const s = pptx.addSlide();
    s.background = { color: "FFFFFF" };
    for (const c of caixas) desenhar(s, c, dados);
    aoProgredir?.(++feito, total);
  }

  await pptx.writeFile({ fileName: `${nomeArquivo}.pptx` });
}

interface ImagemCarregada {
  data: string;
  largura: number;
  altura: number;
}

function dimensoes(dataUrl: string): Promise<{ largura: number; altura: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ largura: img.naturalWidth, altura: img.naturalHeight });
    img.onerror = () => reject(new Error("Imagem inválida"));
    img.src = dataUrl;
  });
}

type SlidePptx = ReturnType<InstanceType<typeof import("pptxgenjs").default>["addSlide"]>;

function desenhar(s: SlidePptx, c: Caixa, dados: Map<string, ImagemCarregada>) {
  const pos = { x: c.x, y: c.y, w: c.w, h: c.h };
  switch (c.tipo) {
    case "retangulo":
      s.addShape("rect", { ...pos, fill: { color: c.cor }, line: { color: c.cor, width: 0 } });
      return;
    case "imagem": {
      const img = dados.get(c.caminho);
      if (!img) return;
      const proporcao = img.altura / img.largura;
      if (c.ajuste === "esticar") {
        s.addImage({ data: img.data, ...pos });
      } else if (c.ajuste === "cobrir") {
        // Tamanho com a proporção original; o pptxgenjs recorta para a caixa
        s.addImage({ data: img.data, x: c.x, y: c.y, w: c.w, h: c.w * proporcao, sizing: { type: "cover", w: c.w, h: c.h } });
      } else {
        // Encaixa centralizado dentro da caixa, sem distorcer
        const w = Math.min(c.w, c.h / proporcao);
        const h = w * proporcao;
        s.addImage({ data: img.data, x: c.x + (c.w - w) / 2, y: c.y + (c.h - h) / 2, w, h });
      }
      return;
    }
    case "texto": {
      if (!c.texto.trim()) return;
      const pars = paragrafos(c.trechos);
      const runs = pars.flatMap((par, ip) => {
        const ultimoPar = ip === pars.length - 1;
        const itens = par.length ? par : [{ t: "", b: c.negrito, i: c.italico }];
        return itens.map((tr, it) => ({
          text: tr.t,
          options: {
            bold: tr.b,
            italic: tr.i,
            breakLine: it === itens.length - 1 && !ultimoPar,
            ...(c.marcadores ? { bullet: { code: "006F", indent: RECUO_MARCADOR * 72 } } : {}),
          },
        }));
      });
      s.addText(runs, {
        ...pos,
        fontFace: FONTES[c.fonte].pptx,
        fontSize: c.tamanho,
        color: c.cor,
        align: c.alinhamento,
        valign: c.vertical,
        margin: MARGEM_TEXTO * 72,
        lineSpacingMultiple: c.entrelinha,
        fit: "none",
      });
    }
  }
}
