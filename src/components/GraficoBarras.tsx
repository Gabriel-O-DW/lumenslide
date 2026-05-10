import "./GraficoBarras.css";

interface Props {
  data: number[];
  labels: string[];
}

export function GraficoBarras({ data, labels }: Props) {
  const max = Math.max(...data, 1);
  const w = 560;
  const h = 180;
  const pad = { left: 28, right: 8, top: 8, bottom: 24 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  const barGap = 6;
  const barW = (innerW - barGap * (data.length - 1)) / data.length;

  const ticks = 4;
  const tickValues = Array.from({ length: ticks + 1 }, (_, i) =>
    Math.round((max * i) / ticks),
  );

  return (
    <div className="grafico">
      <svg viewBox={`0 0 ${w} ${h}`} className="grafico__svg" role="img">
        {/* grid */}
        {tickValues.map((tv, i) => {
          const y = pad.top + innerH - (innerH * i) / ticks;
          return (
            <g key={i}>
              <line
                x1={pad.left}
                x2={w - pad.right}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
              />
              <text
                x={pad.left - 6}
                y={y + 3}
                textAnchor="end"
                fill="#6a7a9c"
                fontSize="9"
              >
                {tv}
              </text>
            </g>
          );
        })}
        {/* bars */}
        {data.map((v, i) => {
          const x = pad.left + i * (barW + barGap);
          const barH = (v / max) * innerH;
          const y = pad.top + innerH - barH;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={3}
                fill="url(#g-bar)"
              />
              <text
                x={x + barW / 2}
                y={h - 8}
                textAnchor="middle"
                fill="#6a7a9c"
                fontSize="9"
              >
                {labels[i]}
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="g-bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6ee7e7" stopOpacity="1" />
            <stop offset="100%" stopColor="#1ea8a8" stopOpacity="0.85" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
