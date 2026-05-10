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

export function SlidePreview({
  bloco,
  tema,
  cor,
  rotuloDia,
  rotuloCor,
  variant = "card",
}: Props) {
  const corHex = corMap[cor];
  const style = {
    "--slide-bg": tema.paleta.fundo,
    "--slide-bg2": tema.paleta.fundoSecundario,
    "--slide-fg": tema.paleta.texto,
    "--slide-realce": tema.paleta.realce,
    "--slide-cor": corHex,
    fontFamily: tema.fonteCorpo,
  } as React.CSSProperties;

  const titFamily = { fontFamily: tema.fonteTitulo };

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
