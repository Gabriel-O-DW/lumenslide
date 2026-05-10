import { useAppState } from "../state/AppState";
import "./CardDia.css";

function formatarData(iso: string): { dia: string; mes: string; ano: string } {
  const [a, m, d] = iso.split("-").map((x) => parseInt(x, 10));
  const date = new Date(a, m - 1, d);
  const meses = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return {
    dia: date.getDate().toString(),
    mes: meses[date.getMonth()],
    ano: date.getFullYear().toString(),
  };
}

export function CardDia() {
  const { liturgia, carregando, erro, dataSelecionada, recarregar } = useAppState();
  const dt = formatarData(dataSelecionada);

  return (
    <div className={`card-dia cor-${liturgia?.cor ?? "verde"}`}>
      <div className="card-dia__head">
        <div className="card-dia__date" aria-label="Data selecionada">
          <span className="card-dia__date-month">{dt.mes}</span>
          <span className="card-dia__date-day">{dt.dia}</span>
          <span className="card-dia__date-year">{dt.ano}</span>
        </div>

        <div className="card-dia__title">
          <h3>
            {carregando
              ? "Carregando liturgia…"
              : liturgia?.diaLiturgico ?? "Selecione uma data"}
          </h3>
          <span className="card-dia__color" aria-label="Cor litúrgica">
            <span className="dot" />
            {liturgia?.corRotulo ?? "—"}
          </span>
        </div>

        <div className="card-dia__actions">
          <button className="ghost" onClick={recarregar} aria-label="Recarregar">
            ↻
          </button>
        </div>
      </div>

      {erro && (
        <div className="card-dia__erro" role="alert">
          ⚠ {erro}{" "}
          <button className="ghost" onClick={recarregar}>
            Tentar novamente
          </button>
        </div>
      )}

      <div className="card-dia__leituras">
        <ItemLeitura
          rotulo="Leitura I"
          texto={liturgia?.primeiraLeitura?.referencia ?? liturgia?.primeiraLeitura?.titulo ?? "—"}
        />
        <ItemLeitura
          rotulo="Salmo"
          texto={liturgia?.salmo?.referencia ?? liturgia?.salmo?.titulo ?? "—"}
        />
        <ItemLeitura
          rotulo="Leitura II"
          texto={liturgia?.segundaLeitura?.referencia ?? liturgia?.segundaLeitura?.titulo ?? "—"}
        />
        <ItemLeitura
          rotulo="Evangelho"
          texto={liturgia?.evangelho?.referencia ?? liturgia?.evangelho?.titulo ?? "—"}
          destaque
        />
      </div>

      <div className="card-dia__fonte">
        Fonte:{" "}
        <a
          href="https://api-liturgia-diaria.vercel.app/"
          target="_blank"
          rel="noreferrer"
        >
          api-liturgia-diaria.vercel.app
        </a>
      </div>
    </div>
  );
}

function ItemLeitura({
  rotulo,
  texto,
  destaque,
}: {
  rotulo: string;
  texto: string;
  destaque?: boolean;
}) {
  return (
    <div className={"leitura-item" + (destaque ? " leitura-item--gold" : "")}>
      <span className="leitura-item__label">{rotulo}</span>
      <span className="leitura-item__valor">{texto}</span>
    </div>
  );
}
