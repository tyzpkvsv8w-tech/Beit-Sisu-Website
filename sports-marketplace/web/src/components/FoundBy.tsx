import { fmt, getI18n } from "@/i18n";
import type { discoveryStats } from "@/lib/discovery";

type Data = Awaited<ReturnType<typeof discoveryStats>>;

/**
 * Seller-only: the searches that showed the ad (times shown, and how many led to a view),
 * and where views came from. Values are labelled directly; the two-tone bars have a legend.
 */
export async function FoundBy({ data }: { data: Data }) {
  const { m } = await getI18n();
  const t = m.found;
  const maxShown = Math.max(1, ...data.terms.map((r) => Math.max(r.impressions, r.views)));
  const maxSource = Math.max(1, ...data.sources.map((s) => s.views));
  return (
    <div className="panel found-by" data-testid="found-by">
      <div className="found-head"><strong>{t.title}</strong><span className="note">{t.period}</span></div>

      <section aria-labelledby="found-searches">
        <h3 id="found-searches" className="found-sub">{t.searches}</h3>
        {data.terms.length ? (
          <>
            <ul className="found-legend" aria-hidden="true">
              <li><i className="sw shown" />{t.shown}</li><li><i className="sw viewed" />{t.viewed}</li>
            </ul>
            <ol className="found-list" data-testid="found-terms">
              {data.terms.map((r) => (
                <li key={r.term}>
                  <div className="found-row">
                    <bdi className="term" dir="auto">{r.term}</bdi>
                    <span className="num">{fmt(r.views === 1 ? t.row1 : t.row, { shown: r.impressions, views: r.views })}</span>
                  </div>
                  <div className="track" aria-hidden="true">
                    <span className="fill shown" style={{ width: `${(Math.max(r.impressions, r.views) / maxShown) * 100}%` }} />
                    <span className="fill viewed" style={{ width: `${(r.views / maxShown) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
            {data.moreTerms > 0 && <p className="note" style={{ margin: 0 }}>{fmt(t.more, { n: data.moreTerms })}</p>}
          </>
        ) : <p className="note" style={{ margin: 0 }}>{t.noSearches}</p>}
      </section>

      <section aria-labelledby="found-sources">
        <h3 id="found-sources" className="found-sub">{t.sources}</h3>
        {data.sources.length ? (
          <ol className="found-list" data-testid="found-sources">
            {data.sources.map((s) => (
              <li key={s.source}>
                <div className="found-row"><span className="term">{t.source[s.source]}</span><span className="num">{s.views}</span></div>
                <div className="track" aria-hidden="true"><span className="fill viewed" style={{ width: `${(s.views / maxSource) * 100}%` }} /></div>
              </li>
            ))}
          </ol>
        ) : <p className="note" style={{ margin: 0 }}>{t.noViews}</p>}
      </section>

      <p className="hint" style={{ margin: 0 }}>{t.privacy}</p>
    </div>
  );
}
