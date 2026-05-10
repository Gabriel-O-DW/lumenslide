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
 * Converte texto em parágrafos com destaque de respostas da assembleia.
 * Usa marcação `**...**` para chamar respostas.
 */
function renderizar(texto: string) {
  const linhas = texto.split("\n");
  return linhas.map((linha, i) => {
    if (!linha.trim()) return <br key={i} />;
    const partes = linha.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="slide-preview__p">
        {partes.map((p, j) => {
          if (p.startsWith("**") && p.endsWith("**")) {
            return (
              <span key={j} className="slide-preview__resposta">
                {p.slice(2, -2)}
              </span>
            );
          }
          return <span key={j}>{p}</span>;
        })}
      </p>
    );
  });
}

const corMap: Record<CorLiturgicaSlug, string> = {
  vermelha: "#b8252b",
  branca: "#f0eadf",
  roxa: "#6d2a8a",
  verde: "#2f7a3c",
  rosa: "#d97aa3",
  dourada: "#d4a437",
};

/**
 * Decide qual cor de banner usar para um bloco.
 * Por padrão, blocos de "ordinario" (Profissão de Fé etc.) usam o azul; demais
 * blocos do tema clássico usam o dourado. Pode ser ajustado por bloco.
 */
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
  const usaBanner = tema.estiloBanner === "ribbon-gold" || tema.estiloBanner === "ribbon-blue";
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

  /* --------------------- Layout: Capa (primeiro slide) --------------------- */
  if (capa && usaBanner) {
    return (
      <div className={`slide-preview slide-preview--${variant} slide-preview--capa`} style={style}>
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

  /* ---------------- Layout: Evangelho (full-bleed photo) ---------------- */
  if (evangelho && usaBanner && variant === "card") {
    return (
      <div className={`slide-preview slide-preview--${variant} slide-preview--evangelho`} style={style}>
        <div className="slide-preview__frame">
          <div className="slide-preview__evangelho-bg" />
          <div className="slide-preview__content slide-preview__content--evangelho">
            <span className="slide-preview__evangelho-titulo" style={titFamily}>
              Evangelho
            </span>
            {bloco.citacao && (
              <span className="slide-preview__evangelho-citacao" style={titFamily}>
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

  /* ----------------- Layout: Seção com banner (clássico) ----------------- */
  if (usaBanner) {
    return (
      <div className={`slide-preview slide-preview--${variant} slide-preview--secao`} style={style}>
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
            <div className="slide-preview__corpo">
              {renderizar(bloco.texto)}
            </div>
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

  /* --------------- Layout: temas modernos (sem ribbon) --------------- */
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
            <div className="slide-preview__corpo">
              {renderizar(bloco.texto)}
            </div>
          )}
        </div>

        <div className="slide-preview__rodape" style={titFamily}>
          <span>{rotuloDia}</span>
          {rotuloCor && <span className="slide-preview__cor-badge">{rotuloCor}</span>}
        </div>
      </div>
    </div>
  );
}
