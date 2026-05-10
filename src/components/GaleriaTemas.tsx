import { useAppState } from "../state/AppState";
import "./GaleriaTemas.css";

export function GaleriaTemas() {
  const { temas, temaAtivo, setTemaAtivo, paroquia, setParoquia } =
    useAppState();

  return (
    <div className="galeria-temas">
      <div className="galeria-temas__grid">
        {temas.map((t) => {
          const ativo = t.id === temaAtivo.id;
          return (
            <button
              key={t.id}
              type="button"
              className={"tema-card" + (ativo ? " tema-card--on" : "")}
              onClick={() => setTemaAtivo(t)}
              aria-pressed={ativo}
              style={{
                background: `linear-gradient(135deg, ${t.paleta.fundo}, ${t.paleta.fundoSecundario})`,
                color: t.paleta.texto,
              }}
            >
              <div
                className="tema-card__cross"
                style={{ color: t.paleta.realce }}
              >
                ✝
              </div>
              <div
                className="tema-card__nome"
                style={{ fontFamily: t.fonteTitulo }}
              >
                {t.nome}
              </div>
              <div className="tema-card__rotulo">
                <span
                  className="tema-card__dot"
                  style={{ background: t.paleta.realce }}
                />
                {t.estilo}
                {t.id === "paroquial-classico" && (
                  <span className="tema-card__badge">Padrão</span>
                )}
              </div>
              {ativo && <span className="tema-card__check">✓</span>}
            </button>
          );
        })}
      </div>

      <div className="galeria-temas__opcoes">
        <h4 className="section-eyebrow">Opções de design</h4>
        <div className="opcoes__row">
          <label>Nome da paróquia (rodapé)</label>
          <input
            type="text"
            value={paroquia}
            onChange={(e) => setParoquia(e.target.value)}
            placeholder="ex.: Paróquia Nossa Senhora Rainha dos Apóstolos"
          />
        </div>
        <div className="opcoes__row">
          <label>Modo</label>
          <select defaultValue="auto">
            <option value="auto">Automatizado pela cor litúrgica</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <div className="opcoes__row">
          <label>Elemento de fundo</label>
          <select defaultValue="vitral">
            <option>Vitral</option>
            <option>Cruz</option>
            <option>Manuscrito</option>
            <option>Sem ornamento</option>
          </select>
        </div>
        <div className="opcoes__row">
          <label>Tipografia</label>
          <select defaultValue={temaAtivo.fonteTitulo}>
            <option value="Inter, sans-serif">Inter (sans-serif)</option>
            <option value="Cinzel, serif">Cinzel (decorativa)</option>
            <option value="Garamond, serif">Garamond (clássica)</option>
            <option value="'Lato', sans-serif">Lato (paroquial)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
