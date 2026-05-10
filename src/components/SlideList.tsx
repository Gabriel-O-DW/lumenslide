import type { Slide } from "../types/slide";
import "./SlideList.css";

interface Props {
  slides: Slide[];
  indiceAtivo: number;
  onSelecionar: (i: number) => void;
}

const rotuloTipo: Record<Slide["tipo"], string> = {
  generico: "Slide",
  leitura: "Leitura",
  salmo: "Salmo",
  canto: "Canto",
  ordinario: "Ordinário",
};

export function SlideList({ slides, indiceAtivo, onSelecionar }: Props) {
  return (
    <nav className="slide-list" aria-label="Lista de slides">
      <h2 className="slide-list__heading">Celebração</h2>
      <ol>
        {slides.map((slide, i) => (
          <li key={slide.id}>
            <button
              type="button"
              className={
                "slide-list__item" +
                (i === indiceAtivo ? " slide-list__item--active" : "")
              }
              onClick={() => onSelecionar(i)}
            >
              <span className="slide-list__num">{i + 1}</span>
              <span className="slide-list__body">
                <span className="slide-list__tipo">
                  {rotuloTipo[slide.tipo]}
                </span>
                <span className="slide-list__titulo">{slide.titulo}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
