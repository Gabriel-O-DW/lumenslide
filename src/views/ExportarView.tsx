import { useState } from "react";
import { useAppState } from "../state/AppState";
import { SlidePreview } from "../components/SlidePreview";
import { blocosIniciaisDoRito } from "../data/blocosLiturgicos";
import "./ExportarView.css";

const blocos = blocosIniciaisDoRito();

export function ExportarView() {
  const {
    composicao,
    alternarComposicao,
    temaAtivo,
    liturgia,
    musicasSelecionadas,
    musicas,
  } = useAppState();
  const [exportando, setExportando] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const cantosCount = musicas.filter((m) =>
    musicasSelecionadas.includes(m.id),
  ).length;
  const leiturasCount =
    blocos.filter((b) => b.tipo === "leitura" || b.tipo === "salmo").length;
  const ritosCount = blocos.filter((b) => b.tipo === "ordinario").length;
  const slidesTotal =
    (composicao.leituras ? leiturasCount : 0) +
    (composicao.canticos ? cantosCount : 0) +
    (composicao.ritos ? ritosCount : 0) +
    (composicao.cantos ? cantosCount : 0);

  const slidesParaPreview = blocos.filter((b) => {
    if (b.tipo === "leitura" || b.tipo === "salmo") return composicao.leituras;
    if (b.tipo === "ordinario") return composicao.ritos;
    if (b.tipo === "canto") return composicao.cantos || composicao.canticos;
    return true;
  });

  const exportar = (formato: "pptx" | "pdf") => {
    setExportando(true);
    setFeedback(null);
    // Mock — em backend real, dispara renderização server-side.
    setTimeout(() => {
      setExportando(false);
      setFeedback(
        `Geração ${formato.toUpperCase()} simulada com ${slidesTotal} slides. (frontend de teste — sem backend ainda.)`,
      );
    }, 900);
  };

  return (
    <div className="exportar-view">
      <section className="card exportar-view__composicao">
        <div className="card-header">
          <h2 className="card-title">Composição da Apresentação</h2>
          <span className="chip">{slidesTotal} slides</span>
        </div>
        <div className="card-body">
          <ul className="composicao">
            <ItemComposicao
              ativo={composicao.leituras}
              onToggle={() => alternarComposicao("leituras")}
              rotulo="Leituras"
              count={leiturasCount}
            />
            <ItemComposicao
              ativo={composicao.canticos}
              onToggle={() => alternarComposicao("canticos")}
              rotulo="Cânticos"
              count={cantosCount}
            />
            <ItemComposicao
              ativo={composicao.ritos}
              onToggle={() => alternarComposicao("ritos")}
              rotulo="Ritos"
              count={ritosCount}
            />
            <ItemComposicao
              ativo={composicao.cantos}
              onToggle={() => alternarComposicao("cantos")}
              rotulo="Cantos da Assembleia"
              count={cantosCount}
            />
            <ItemComposicao
              ativo={composicao.respostasDestaque}
              onToggle={() => alternarComposicao("respostasDestaque")}
              rotulo="Respostas em destaque"
              count={10}
            />
          </ul>
        </div>

        <div className="card-header">
          <h2 className="card-title">Opções de Exportação</h2>
        </div>
        <div className="card-body">
          <div className="exportar-view__opcoes">
            <div className="opcoes__row">
              <label>Formato</label>
              <select defaultValue="pptx">
                <option value="pptx">Microsoft PowerPoint (.pptx)</option>
                <option value="pdf">PDF</option>
                <option value="png">Imagens PNG</option>
              </select>
            </div>
            <div className="opcoes__row">
              <label>Formatação</label>
              <select defaultValue="inter">
                <option value="inter">Arial / Inter</option>
                <option value="garamond">Garamond / Serifada</option>
              </select>
            </div>
            <div className="opcoes__row">
              <label>Respostas em destaque</label>
              <select defaultValue="cyan">
                <option value="cyan">Realce ciano</option>
                <option value="gold">Realce dourado</option>
                <option value="bold">Apenas negrito</option>
              </select>
            </div>
          </div>

          <div className="exportar-view__cta">
            <button
              className="primary"
              disabled={exportando || slidesTotal === 0}
              onClick={() => exportar("pptx")}
            >
              {exportando ? "Gerando…" : "EXPORTAR APRESENTAÇÃO FINAL"}
            </button>
            <button
              className="ghost"
              disabled={exportando || slidesTotal === 0}
              onClick={() => exportar("pdf")}
            >
              Exportar PDF
            </button>
          </div>
          {feedback && <p className="exportar-view__feedback">{feedback}</p>}
        </div>
      </section>

      <section className="card exportar-view__preview">
        <div className="card-header">
          <h2 className="card-title">Pré-visualização Final</h2>
          <span className="chip chip--gold">{slidesParaPreview.length} slides</span>
        </div>
        <div className="card-body">
          <div className="thumbs">
            {slidesParaPreview.map((b, i) => (
              <div key={b.id} className="thumb">
                <SlidePreview
                  bloco={b}
                  tema={temaAtivo}
                  cor={liturgia?.cor ?? "verde"}
                  rotuloDia={liturgia?.diaLiturgico ?? b.titulo}
                  rotuloCor={liturgia?.corRotulo ?? ""}
                  variant="thumb"
                />
                <span className="thumb__num">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ItemComposicao({
  ativo,
  onToggle,
  rotulo,
  count,
}: {
  ativo: boolean;
  onToggle: () => void;
  rotulo: string;
  count: number;
}) {
  return (
    <li className={"composicao__item" + (ativo ? " on" : "")}>
      <label>
        <input type="checkbox" checked={ativo} onChange={onToggle} />
        <span>{rotulo}</span>
      </label>
      <span className="composicao__count">{count}</span>
    </li>
  );
}
