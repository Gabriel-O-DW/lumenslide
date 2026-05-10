import { useEffect, useRef, useState } from "react";
import { useAuth } from "../state/AuthState";
import type { ViewKey } from "../types/nav";
import "./TopBar.css";

interface Props {
  view: ViewKey;
}

const titulos: Record<ViewKey, string> = {
  dashboard: "Painel e Configuração do Dia",
  calendario: "Calendário Litúrgico",
  "novo-slide": "Novo Slide — Criar Celebração",
  editor: "Editor de Apresentação",
  musicas: "Músicas e Design do PowerPoint",
  exportar: "Exportação e Composição Final",
  ajuda: "Ajuda",
};

export function TopBar({ view }: Props) {
  const { usuario, logout } = useAuth();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!aberto) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [aberto]);

  return (
    <header className="topbar">
      <div className="topbar__title">
        <h1>{titulos[view]}</h1>
      </div>

      <div className="topbar__center">
        <input type="search" placeholder="Buscar..." aria-label="Buscar" className="topbar__search" />
      </div>

      <div className="topbar__right">
        <button className="topbar__icon-btn" aria-label="Tema">◐</button>
        <button className="topbar__icon-btn" aria-label="Notificações">
          <span className="bell">◔<span className="badge">9+</span></span>
        </button>

        <div className="topbar__user-wrap" ref={ref}>
          <button
            type="button"
            className="topbar__user"
            onClick={() => setAberto((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={aberto}
          >
            <div className="avatar">{usuario?.iniciais ?? "?"}</div>
            <span className="topbar__user-name">{usuario?.nome ?? "Convidado"}</span>
            <span className="caret">▾</span>
          </button>
          {aberto && (
            <div className="topbar__menu" role="menu">
              <div className="topbar__menu-head">
                <strong>{usuario?.nome}</strong>
                <small>{usuario?.email}</small>
                {usuario?.paroquia && (
                  <small className="topbar__menu-paroquia">{usuario.paroquia}</small>
                )}
              </div>
              <button type="button" className="topbar__menu-item" disabled><span>◐</span> Meu perfil</button>
              <button type="button" className="topbar__menu-item" disabled><span>⚙</span> Configurações</button>
              <button type="button" className="topbar__menu-item" disabled><span>+</span> Convidar membro</button>
              <div className="topbar__menu-sep" />
              <button
                type="button"
                className="topbar__menu-item topbar__menu-item--danger"
                onClick={() => { setAberto(false); logout(); }}
              >
                <span>↩</span> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
