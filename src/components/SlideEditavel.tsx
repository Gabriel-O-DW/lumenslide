import { CanvasLivre, type ElementoCanvas } from "./CanvasLivre";
import { SlidePreview } from "./SlidePreview";
import type { BlocoSlide } from "../data/blocosLiturgicos";
import type { Tema } from "../types/tema";
import type { CorLiturgicaSlug } from "../types/liturgia";
import "./SlideEditavel.css";

interface Props {
  bloco: BlocoSlide;
  tema: Tema;
  cor: CorLiturgicaSlug;
  rotuloDia: string;
  rotuloCor: string;
  leituras?: Array<{ rotulo: string; valor: string }>;
  livre: ElementoCanvas[];
  onChangeLivre: (els: ElementoCanvas[]) => void;
  /** Esconde toolbar do canvas livre. */
  semToolbar?: boolean;
}

export function SlideEditavel(props: Props) {
  const {
    bloco,
    tema,
    cor,
    rotuloDia,
    rotuloCor,
    leituras,
    livre,
    onChangeLivre,
    semToolbar,
  } = props;

  return (
    <div className="slide-editavel">
      <CanvasLivre
        elementos={livre}
        onChange={onChangeLivre}
        overlay
        semToolbar={semToolbar}
        fundo={
          <SlidePreview
            bloco={bloco}
            tema={tema}
            cor={cor}
            rotuloDia={rotuloDia}
            rotuloCor={rotuloCor}
            leituras={leituras}
          />
        }
      />
    </div>
  );
}
