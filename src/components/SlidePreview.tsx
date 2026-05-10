import type { Tema } from "../types/tema";
import type { BlocoSlide } from "../data/blocosLiturgicos";
import type { CorLiturgicaSlug } from "../types/liturgia";
import "./SlidePreview.css";

interface Props {
  bloco: BlocoSlide;
  tema: Tema;
  cor: CorLiturgicaSlug;
  rotuloDia: string;
  rotuloCor: string;
  /** Lista de leituras só é usada na capa (slide de abertura). */
  leituras?: Array<{ rotulo: string; valor: string }>;
  variant?: "card" | "thumb";
}

/**
 * Sanitização básica do HTML do bloco antes de injetar no preview.
 * Remove scripts/eventos. Para um sanitizador completo, usar DOMPurify quando
 * o backend chegar — por enquanto isso já é suficiente para HTML do editor.
 */
function sanitizar(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+=("[^"]*"|'[^']*'|\S+)/gi, "")
    .replace(/javascript:/gi, "");
}

/**
 * Converte marcação legada `**texto**` em <strong> para retrocompatibilidade
 * com slides criados antes do editor HTML.
 */
function legadoParaHtml(texto: string): string {
  if (texto.includes("<")) return texto; // já parece HTML
  const escapado = texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const comResposta = escapado.replace(
    /\*\*([^*]+)\*\*/g,
    '<span class="rta-resposta">$1</span>',
  );
  return comResposta
    .split(/\n/)
    .map((l) => (l.trim() ? `<p>${l}</p>` : "<br/>"))
    .join("");
}

function htmlDoBloco(texto: string): string {
  return sanitizar(legadoParaHtml(texto));
}

const corMap: Record<CorLiturgicaSlug, string> = {
  vermelha: "#b8252b",
  branca: "#f0eadf",
  roxa: "#6d2a8a",
  verde: "#2f7a3c",
  rosa: "#d97aa3",
  dourada: "#d4a437",
};

function corBanner(tema: Tema, bloco: BlocoSlide): string {
  if (tema.estiloBanner === "ribbon-blue") {
    return tema.paleta.bannerBlue ?? tema.paleta.realce;
  }
  if (
    bloco.tipo === "ordinario" &&
    (bloco.id === "credo" || bloco.titulo.toLowerCase().includes("profiss"))
  ) {
    return tema.paleta.bannerBlue ?? "#1f6fb8";
  }
  return tema.paleta.bannerGold ?? tema.paleta.realce;
}

function ehCapa(bloco: BlocoSlide) {
  return bloco.id === "abertura" || /sauda/i.test(bloco.titulo);
}
function ehEvangelho(bloco: BlocoSlide) {
  return bloco.id === "evangelho" || /evangelho/i.test(bloco.titulo);
}

export function SlidePreview({
  bloco,
  tema,
  cor,
  rotuloDia,
  rotuloCor,
  leituras,
  variant = "card",
}: Props) {
  const corHex = corMap[cor];
  const usaBanner =
    tema.estiloBanner === "ribbon-gold" || tema.estiloBanner === "ribbon-blue";
  const corBannerHex = corBanner(tema, bloco);
  const evangelho = ehEvangelho(bloco);
  const capa = ehCapa(bloco);

  const style = {
    "--slide-bg": tema.paleta.fundo,
    "--slide-bg2": tema.paleta.fundoSecundario,
    "--slide-fg": tema.paleta.texto,
    "--slide-realce": tema.paleta.realce,
    "--slide-cor": corHex,
    "--slide-banner": corBannerHex,
    "--slide-destaque-capa": tema.paleta.destaqueCapa ?? tema.paleta.realce,
    fontFamily: tema.fonteCorpo,
  } as React.CSSProperties;

  const titFamily = { fontFamily: tema.fonteTitulo };

  if (capa && usaBanner) {
    return (
      <div
        className={`slide-preview slide-preview--${variant} slide-preview--capa`}
        style={style}
      >
        <div className="slide-preview__frame">
          <div className="slide-preview__capa-faixa" />
          <div className="slide-preview__bg" />
          <div className="slide-preview__content slide-preview__content--capa">
            <h3 className="slide-preview__capa-titulo" style={titFamily}>
              {rotuloDia || bloco.titulo}
            </h3>
            {leituras && leituras.length > 0 && variant === "card" && (
              <ul className="slide-preview__capa-leituras">
                {leituras.map((l, i) => (
                  <li key={i}>
                    <span className="slide-preview__capa-rotulo">
                      {l.rotulo}:
                    </span>{" "}
                    <span>{l.valor}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {tema.rodape && (
            <div className="slide-preview__rodape-paroquia" style={titFamily}>
              {tema.rodape}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (evangelho && usaBanner && variant === "card") {
    return (
      <div
        className={`slide-preview slide-preview--${variant} slide-preview--evangelho`}
        style={style}
      >
        <div className="slide-preview__frame">
          <div className="slide-preview__evangelho-bg" />
          <div className="slide-preview__content slide-preview__content--evangelho">
            <span
              className="slide-preview__evangelho-titulo"
              style={titFamily}
            >
              Evangelho
            </span>
            {bloco.citacao && (
              <span
                className="slide-preview__evangelho-citacao"
                style={titFamily}
              >
                {bloco.citacao}
              </span>
            )}
          </div>
          <div className="slide-preview__rodape-cor" style={titFamily}>
            {rotuloCor && (
              <span className="slide-preview__cor-badge">{rotuloCor}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (usaBanner) {
    return (
      <div
        className={`slide-preview slide-preview--${variant} slide-preview--secao`}
        style={style}
      >
        <div className="slide-preview__frame">
          <div className="slide-preview__bg" />
          <header className="slide-preview__ribbon" style={titFamily}>
            <span className="slide-preview__ribbon-icon" aria-hidden>
              ✦
            </span>
            <span className="slide-preview__ribbon-text">
              {bloco.titulo.toUpperCase()}
              {bloco.citacao ? ` — ${bloco.citacao}` : ""}
            </span>
          </header>
          <div className="slide-preview__content slide-preview__content--secao">
            <div
              className="slide-preview__corpo"
              dangerouslySetInnerHTML={{ __html: htmlDoBloco(bloco.texto) }}
            />
          </div>
          {tema.rodape && (
            <div className="slide-preview__rodape-paroquia" style={titFamily}>
              {tema.rodape}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`slide-preview slide-preview--${variant}`} style={style}>
      <div className="slide-preview__frame" data-tema={tema.id}>
        <div className="slide-preview__bg" />
        <div className="slide-preview__faixa" />
        <div className="slide-preview__cross" aria-hidden>
          ✝
        </div>

        <div className="slide-preview__content">
          {bloco.tipo === "leitura" && bloco.citacao && (
            <span className="slide-preview__citacao" style={titFamily}>
              {bloco.citacao}
            </span>
          )}
          <h3 className="slide-preview__titulo" style={titFamily}>
            {bloco.titulo}
          </h3>
          {variant === "card" && (
            <div
              className="slide-preview__corpo"
              dangerouslySetInnerHTML={{ __html: htmlDoBloco(bloco.texto) }}
            />
          )}
        </div>

        <div className="slide-preview__rodape" style={titFamily}>
          <span>{rotuloDia}</span>
          {rotuloCor && (
            <span className="slide-preview__cor-badge">{rotuloCor}</span>
          )}
        </div>
      </div>
    </div>
  );
}
