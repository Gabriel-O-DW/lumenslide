import type { ViewKey } from "../types/nav";
import "./TopBar.css";

interface Props {
  view: ViewKey;
}

const titulos: Record<ViewKey, string> = {
  dashboard: "Painel e Configuração do Dia",
  calendario: "Calendário Litúrgico",
  editor: "Editor de Apresentação",
  musicas: "Músicas e Design do PowerPoint",
  exportar: "Exportação e Composição Final",
  ajuda: "Ajuda",
};

export function TopBar({ view }: Props) {
  return (
    <header className="topbar">
      <div className="topbar__title">
        <h1>{titulos[view]}</h1>
      </div>

      <div className="topbar__center">
        <input
          type="search"
          placeholder="Buscar..."
          aria-label="Buscar"
          className="topbar__search"
        />
      </div>

      <div className="topbar__right">
        <button className="topbar__icon-btn" aria-label="Tema">
          ◐
        </button>
        <button className="topbar__icon-btn" aria-label="Notificações">
          <span className="bell">
            ◔
            <span className="badge">9+</span>
          </span>
        </button>
        <div className="topbar__user">
          <div className="avatar">MR</div>
          <span>Acsonovitia</span>
          <span className="caret">▾</span>
        </div>
      </div>
    </header>
  );
}
