import { useMemo, useState } from "react";
import "./Calendario.css";

interface Props {
  valor: string; // ISO yyyy-mm-dd
  onChange: (iso: string) => void;
}

const NOMES_MES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const DIAS_SEM = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function isoOf(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function Calendario({ valor, onChange }: Props) {
  const inicial = useMemo(() => {
    const [a, m] = valor.split("-").map((x) => parseInt(x, 10));
    return new Date(a, m - 1, 1);
  }, [valor]);

  const [cursor, setCursor] = useState(inicial);

  const dias = useMemo(() => {
    const ano = cursor.getFullYear();
    const mes = cursor.getMonth();
    const primeiro = new Date(ano, mes, 1);
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    const inicioSemana = primeiro.getDay();
    const cells: { date: Date | null; iso?: string }[] = [];
    for (let i = 0; i < inicioSemana; i++) cells.push({ date: null });
    for (let d = 1; d <= totalDias; d++) {
      const dt = new Date(ano, mes, d);
      cells.push({ date: dt, iso: isoOf(dt) });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null });
    return cells;
  }, [cursor]);

  const mover = (delta: number) => {
    const c = new Date(cursor);
    c.setMonth(c.getMonth() + delta);
    setCursor(c);
  };

  return (
    <div className="cal">
      <div className="cal__header">
        <button className="ghost cal__nav" onClick={() => mover(-1)} aria-label="Mês anterior">
          ◂
        </button>
        <strong>
          {NOMES_MES[cursor.getMonth()]} {cursor.getFullYear()}
        </strong>
        <button className="ghost cal__nav" onClick={() => mover(1)} aria-label="Próximo mês">
          ▸
        </button>
      </div>

      <div className="cal__grid cal__weekdays">
        {DIAS_SEM.map((d) => (
          <div key={d} className="cal__weekday">
            {d}
          </div>
        ))}
      </div>

      <div className="cal__grid">
        {dias.map((c, i) => {
          if (!c.date) return <div key={`x${i}`} className="cal__cell cal__cell--empty" />;
          const ativo = c.iso === valor;
          const hoje = c.iso === isoOf(new Date());
          return (
            <button
              key={c.iso}
              type="button"
              className={
                "cal__cell" +
                (ativo ? " cal__cell--active" : "") +
                (hoje ? " cal__cell--today" : "")
              }
              onClick={() => c.iso && onChange(c.iso)}
              aria-pressed={ativo}
            >
              {c.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
