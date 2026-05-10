import type { ViewKey } from "../types/nav";
import "./Sidebar.css";

interface Props {
  active: ViewKey;
  onChange: (k: ViewKey) => void;
}

const items: { key: ViewKey; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "▦" },
  { key: "calendario", label: "Calendário", icon: "▤" },
  { key: "editor", label: "Editor", icon: "✎" },
  { key: "musicas", label: "Músicas", icon: "♪" },
  { key: "exportar", label: "Exportar", icon: "⇪" },
  { key: "ajuda", label: "Ajuda", icon: "?" },
];

export function Sidebar({ active, onChange }: Props) {
  return (
    <aside className="sidebar" aria-label="Navegação principal">
      <div className="sidebar__brand">
        <div className="sidebar__logo" aria-hidden>
          ✦
        </div>
        <div className="sidebar__brand-text">
          <strong>LumenSlide</strong>
          <small>v0.2 · MVP</small>
        </div>
      </div>

      <nav>
        <ul>
          {items.map((it) => (
            <li key={it.key}>
              <button
                type="button"
                className={
                  "sidebar__item" +
                  (active === it.key ? " sidebar__item--active" : "")
                }
                onClick={() => onChange(it.key)}
                aria-current={active === it.key ? "page" : undefined}
              >
                <span className="sidebar__icon">{it.icon}</span>
                <span className="sidebar__label">{it.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar__footer">
        <button className="sidebar__item">
          <span className="sidebar__icon">◐</span>
          <span className="sidebar__label">Perfil</span>
        </button>
      </div>
    </aside>
  );
}
