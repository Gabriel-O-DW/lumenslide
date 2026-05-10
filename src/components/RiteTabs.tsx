import "./RiteTabs.css";

export type RiteKey =
  | "iniciais"
  | "palavra"
  | "eucaristica"
  | "finais";

interface Props {
  ativo: RiteKey;
  onChange: (k: RiteKey) => void;
}

const tabs: { key: RiteKey; label: string }[] = [
  { key: "iniciais", label: "Ritos Iniciais" },
  { key: "palavra", label: "Liturgia da Palavra" },
  { key: "eucaristica", label: "Liturgia Eucarística" },
  { key: "finais", label: "Ritos Finais" },
];

export function RiteTabs({ ativo, onChange }: Props) {
  return (
    <nav className="rite-tabs" aria-label="Etapas da Missa">
      {tabs.map((t, i) => (
        <div key={t.key} className="rite-tabs__item">
          <button
            type="button"
            className={
              "rite-tabs__btn" + (ativo === t.key ? " rite-tabs__btn--on" : "")
            }
            onClick={() => onChange(t.key)}
            aria-current={ativo === t.key ? "page" : undefined}
          >
            <span className="rite-tabs__num">{i + 1}</span>
            <span>{t.label}</span>
          </button>
          {i < tabs.length - 1 && <span className="rite-tabs__arrow">→</span>}
        </div>
      ))}
    </nav>
  );
}
