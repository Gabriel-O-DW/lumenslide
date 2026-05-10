import type { Slide } from "../types/slide";
import "./SlideRender.css";

interface Props {
  slide: Slide;
}

export function SlideRender({ slide }: Props) {
  switch (slide.tipo) {
    case "generico":
      return (
        <article className="slide slide--generico">
          <h2 className="slide__titulo">{slide.titulo}</h2>
          {slide.conteudo && (
            <p className="slide__conteudo">{slide.conteudo}</p>
          )}
        </article>
      );

    case "leitura":
      return (
        <article className="slide slide--leitura">
          <header className="slide__header">
            <h2 className="slide__titulo">{slide.titulo}</h2>
            <span className="slide__citacao">{slide.citacao}</span>
          </header>
          <div className="slide__texto">
            {slide.texto.split("\n").map((linha, i) => (
              <p key={i}>{linha}</p>
            ))}
          </div>
        </article>
      );

    case "salmo":
      return (
        <article className="slide slide--salmo">
          <h2 className="slide__titulo">{slide.titulo}</h2>
          <p className="slide__refrao">℟ {slide.refrao}</p>
          <ol className="slide__estrofes">
            {slide.estrofes.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ol>
        </article>
      );

    case "canto":
      return (
        <article className="slide slide--canto">
          <h2 className="slide__titulo">♪ {slide.titulo}</h2>
          {slide.refrao && (
            <p className="slide__refrao">{slide.refrao}</p>
          )}
          <div className="slide__estrofes">
            {slide.estrofes.map((e, i) => (
              <p key={i}>{e}</p>
            ))}
          </div>
        </article>
      );

    case "ordinario":
      return (
        <article className="slide slide--ordinario">
          <h2 className="slide__titulo">{slide.titulo}</h2>
          <div className="slide__texto">
            {slide.texto.split("\n").map((linha, i) => (
              <p key={i}>{linha}</p>
            ))}
          </div>
        </article>
      );
  }
}
