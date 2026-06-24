"use client";

import type { DailyBucket } from "@/lib/admin/analytics-server";

type ChartSeries = {
  label: string;
  color: string;
  buckets: DailyBucket[];
};

const W = 640;
const H = 220;
const PAD = { top: 16, right: 12, bottom: 36, left: 36 };

function formatShortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function AnalyticsLineChart({ series }: { series: ChartSeries[] }) {
  if (!series.length || !series[0]?.buckets.length) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
        Sin datos en este período.
      </p>
    );
  }

  const labels = series[0].buckets.map((b) => b.date);
  const maxY = Math.max(
    1,
    ...series.flatMap((s) => s.buckets.map((b) => b.count))
  );

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const xAt = (i: number) =>
    PAD.left + (labels.length <= 1 ? innerW / 2 : (i / (labels.length - 1)) * innerW);

  const yAt = (v: number) => PAD.top + innerH - (v / maxY) * innerH;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: PAD.top + innerH * (1 - f),
    label: Math.round(maxY * f),
  }));

  const tickStep = labels.length <= 7 ? 1 : labels.length <= 31 ? 5 : 14;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="min-w-[320px] w-full"
        role="img"
        aria-label="Gráfico de evolución temporal"
      >
        {gridLines.map(({ y, label }) => (
          <g key={label}>
            <line
              x1={PAD.left}
              y1={y}
              x2={W - PAD.right}
              y2={y}
              stroke="var(--color-border)"
              strokeDasharray="4 4"
            />
            <text
              x={PAD.left - 6}
              y={y + 4}
              textAnchor="end"
              className="fill-[var(--color-muted-foreground)] text-[10px]"
            >
              {label}
            </text>
          </g>
        ))}

        {labels.map((date, i) =>
          i % tickStep === 0 || i === labels.length - 1 ? (
            <text
              key={date}
              x={xAt(i)}
              y={H - 8}
              textAnchor="middle"
              className="fill-[var(--color-muted-foreground)] text-[10px]"
            >
              {formatShortDate(date)}
            </text>
          ) : null
        )}

        {series.map((s) => {
          const points = s.buckets.map((b, i) => `${xAt(i)},${yAt(b.count)}`).join(" ");
          return (
            <g key={s.label}>
              <polyline
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                points={points}
              />
              {s.buckets.map((b, i) => (
                <circle
                  key={`${s.label}-${b.date}`}
                  cx={xAt(i)}
                  cy={yAt(b.count)}
                  r={3}
                  fill={s.color}
                />
              ))}
            </g>
          );
        })}
      </svg>

      <ul className="mt-3 flex flex-wrap gap-4 text-xs">
        {series.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-[var(--color-muted-foreground)]">{s.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
