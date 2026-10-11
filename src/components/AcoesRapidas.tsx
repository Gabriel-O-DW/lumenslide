import type { ViewKey } from "../types/nav";
import "./AcoesRapidas.css";

interface Props {
  onNavigate: (v: ViewKey) => void;
}

export function AcoesRapidas({ onNavigate }: Props) {
  return (
    <div className="acoes">
      <button className="primary acoes__btn" onClick={() => onNavigate("editor")}>
        <span className="acoes__icon">✦</span>
        <div>
          <strong>Criar Nova Apresentação</strong>
          <small>Monta a partir da liturgia do dia</small>
        </div>
      </button>

      <button className="acoes__btn" onClick={() => onNavigate("musicas")}>
        <span className="acoes__icon">♪</span>
        <div>
          <strong>Adicionar Cantos</strong>
          <small>Banco de cantos litúrgicos</small>
        </div>
      </button>

      <button className="acoes__btn" onClick={() => onNavigate("editor")}>
        <span className="acoes__icon">⇪</span>
        <div>
          <strong>Exportar PowerPoint</strong>
          <small>Abra a missa no editor e baixe o .pptx</small>
        </div>
      </button>
    </div>
  );
}
