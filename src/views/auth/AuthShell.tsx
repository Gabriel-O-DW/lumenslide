import type { ReactNode } from "react";
import "./AuthShell.css";

interface Props {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  rodape?: ReactNode;
}

export function AuthShell({ titulo, subtitulo, children, rodape }: Props) {
  return (
    <div className="auth-shell">
      <aside className="auth-shell__brand">
        <div className="auth-shell__brand-inner">
          <div className="auth-shell__logo">✦</div>
          <h1 className="auth-shell__brand-title">LumenSlide</h1>
          <p className="auth-shell__brand-tagline">
            Slides litúrgicos para a Santa Missa, com a luz de Cristo no centro.
          </p>
          <ul className="auth-shell__features">
            <li>
              <span className="auth-shell__bullet">✓</span>
              Liturgia diária preenchida automaticamente
            </li>
            <li>
              <span className="auth-shell__bullet">✓</span>
              Banco de cantos por momento da Missa
            </li>
            <li>
              <span className="auth-shell__bullet">✓</span>
              Exportação direta para PowerPoint e PDF
            </li>
            <li>
              <span className="auth-shell__bullet">✓</span>
              Multi-paróquia com convite por e-mail
            </li>
          </ul>
          <blockquote className="auth-shell__quote">
            “Eu sou a luz do mundo; quem me segue não andará nas trevas.”
            <cite>— Jo 8,12</cite>
          </blockquote>
        </div>
      </aside>

      <main className="auth-shell__main">
        <div className="auth-shell__card">
          <header className="auth-shell__head">
            <h2>{titulo}</h2>
            {subtitulo && <p>{subtitulo}</p>}
          </header>
          {children}
          {rodape && <footer className="auth-shell__foot">{rodape}</footer>}
        </div>
      </main>
    </div>
  );
}
