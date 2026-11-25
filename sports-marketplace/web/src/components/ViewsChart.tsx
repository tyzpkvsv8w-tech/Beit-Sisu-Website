"use client";

import { useState } from "react";
import { fmt } from "@/i18n/fmt";
import { useI18n } from "@/i18n/client";

type Day = { date: string; views: number };

// Single series, so one colour (the accent) and no legend: the heading names it.
// Thin bars with rounded tops on a recessive baseline, 2px gaps, a hover/focus tooltip,
// and a hidden table so the numbers are available without the chart.
export function ViewsChart({ series }: { series: Day[] }) {
  const { m, locale } = useI18n();
  const t = m.stats;
  const [active, setActive] = useState<number | null>(null);
  const W = 280, H = 96, TOP = 16, BOTTOM = 16, GAP = 2;
  const n = series.length;
  const bw = (W - GAP * (n - 1)) / n;
  const max = Math.max(1, ...series.map((d) => d.views));
  const plotH = H - TOP - BOTTOM;
  const loc = locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB";
  const label = (d: Day) => new Date(`${d.date}T00:00:00Z`).toLocaleDateString(loc, { day: "numeric", month: "short", timeZone: "UTC" });
  const tip = (d: Day) => fmt(d.views === 1 ? t.tooltip1 : t.tooltip, { date: label(d), n: d.views });
  // Bars run left to right (oldest first) in both languages, like a timeline.
  const x = (i: number) => i * (bw + GAP);
  const bar = (i: number, v: number) => {
    const h = Math.max(v > 0 ? 3 : 0, (v / max) * plotH);
    const r = Math.min(4, bw / 2, h);
    const x0 = x(i), y0 = H - BOTTOM - h, x1 = x0 + bw, yb = H - BOTTOM;
    return `M${x0},${yb} V${y0 + r} Q${x0},${y0} ${x0 + r},${y0} H${x1 - r} Q${x1},${y0} ${x1},${y0 + r} V${yb} Z`;
  };
  const shown = active ?? n - 1;

  return (
    <figure className="views-chart" aria-label={t.chart}>
      <figcaption className="views-chart-head">
        <span className="lbl">{t.chart}</span>
        <span className="views-tip" aria-live="polite" data-testid="views-tip">{tip(series[shown])}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.chart}>
        <text x={0} y={10} className="axis">{max}</text>
        <line x1={0} x2={W} y1={TOP} y2={TOP} className="grid" />
        <line x1={0} x2={W} y1={H - BOTTOM} y2={H - BOTTOM} className="base" />
        {series.map((d, i) => (
          <g key={d.date}>
            {d.views > 0 && <path d={bar(i, d.views)} className={`bar${i === shown ? " on" : ""}`} />}
            <rect x={x(i) - GAP / 2} y={0} width={bw + GAP} height={H} fill="transparent" tabIndex={0} aria-label={tip(d)}
              onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}
              onTouchStart={() => setActive(i)} />
          </g>
        ))}
        <text x={0} y={H - 3} className="axis">{label(series[0])}</text>
        <text x={W} y={H - 3} className="axis" textAnchor="end">{label(series[n - 1])}</text>
      </svg>
      <table className="sr-only">
        <caption>{t.chart}</caption>
        <tbody>{series.map((d) => <tr key={d.date}><th scope="row">{label(d)}</th><td>{d.views}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
