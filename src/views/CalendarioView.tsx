import { useAppState } from "../state/AppState";
import { Calendario } from "../components/Calendario";
import { CardDia } from "../components/CardDia";

export function CalendarioView() {
  const { dataSelecionada, setDataSelecionada } = useAppState();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(320px, 420px) 1fr",
        gap: "1.1rem",
      }}
    >
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Selecione a data</h2>
          <span className="chip">Liturgia diária</span>
        </div>
        <div className="card-body">
          <Calendario
            valor={dataSelecionada}
            onChange={setDataSelecionada}
          />
        </div>
      </section>

      <section className="card">
        <CardDia />
      </section>
    </div>
  );
}
