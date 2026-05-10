import { useId } from "react";
import type { BlocoSlide } from "../data/blocosLiturgicos";
import "./TextoRitoEditor.css";

interface Props {
  bloco: BlocoSlide;
  onChange: (patch: Partial<BlocoSlide>) => void;
}

/**
 * Editor estilo PowerPoint:
 * - Títulos / citação / corpo
 * - Marcação inline `**...**` é tratada como "resposta da assembleia"
 *   (renderizada destacada na pré-visualização)
 * - Ações rápidas para inserir respostas litúrgicas comuns
 */
export function TextoRitoEditor({ bloco, onChange }: Props) {
  const idTitulo = useId();
  const idCitacao = useId();
  const idTexto = useId();

  const inserirNoFinal = (sufixo: string) => {
    onChange({
      texto: bloco.texto.replace(/\s+$/, "") + (bloco.texto.trim() ? "\n" : "") + sufixo,
    });
  };

  return (
    <div className="rito-editor">
      <div className="rito-editor__row">
        <label htmlFor={idTitulo}>Título do slide</label>
        <input
          id={idTitulo}
          value={bloco.titulo}
          onChange={(e) => onChange({ titulo: e.target.value })}
        />
      </div>

      {bloco.tipo === "leitura" || bloco.tipo === "salmo" ? (
        <div className="rito-editor__row">
          <label htmlFor={idCitacao}>Citação / referência</label>
          <input
            id={idCitacao}
            value={bloco.citacao ?? ""}
            placeholder="ex.: Is 55,1-3"
            onChange={(e) => onChange({ citacao: e.target.value })}
          />
        </div>
      ) : null}

      <div className="rito-editor__row">
        <div className="rito-editor__toolbar">
          <span className="rito-editor__hint">
            Use <code>**texto**</code> para destacar respostas da assembleia.
          </span>
          <button
            type="button"
            className="ghost"
            onClick={() => inserirNoFinal("**Amém.**")}
          >
            + Amém
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() =>
              inserirNoFinal("**Graças a Deus.**")
            }
          >
            + Graças a Deus
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() =>
              inserirNoFinal("**Glória a vós, Senhor.**")
            }
          >
            + Glória a vós
          </button>
        </div>
        <label htmlFor={idTexto}>Conteúdo do slide</label>
        <textarea
          id={idTexto}
          rows={10}
          value={bloco.texto}
          onChange={(e) => onChange({ texto: e.target.value })}
        />
      </div>
    </div>
  );
}
