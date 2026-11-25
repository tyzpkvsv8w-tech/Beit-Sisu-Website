import { COMPANY, type Block, type LegalDoc } from "@/legal/company";
import { fmt, getI18n } from "@/i18n";

/** Fills company details in, and highlights any [blank] still to be completed. */
function Text({ s }: { s: string }) {
  return (
    <>
      {s.split(/(\[[^\]]+\])/).map((part, i) =>
        /^\[.*\]$/.test(part) ? <mark key={i} className="blank">{part}</mark> : part,
      )}
    </>
  );
}

export async function LegalPage({ doc }: { doc: { en: LegalDoc; ar: LegalDoc } }) {
  const { m, locale } = await getI18n();
  const d = doc[locale];
  const c = COMPANY[locale];
  const vars = {
    ...c,
    email: COMPANY.email,
    privacyEmail: COMPANY.privacyEmail,
    liabilityCap: COMPANY.liabilityCap.toLocaleString("en-AE"),
    trn: COMPANY.trn,
    prevailing: m.legal.languageNames[COMPANY.prevailing],
  };
  const f = (s: string) => fmt(s, vars);
  const updated = new Date(COMPANY.updated + "T00:00:00").toLocaleDateString(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  const block = (b: Block, i: number) => {
    if (typeof b === "string") return <p key={i}><Text s={f(b)} /></p>;
    if ("list" in b) return <ul key={i}>{b.list.map((x, j) => <li key={j}><Text s={f(x)} /></li>)}</ul>;
    return (
      <div key={i} className="table-wrap"><table className="data legal-table"><tbody>
        {b.rows.map(([k, v], j) => <tr key={j}><th scope="row"><Text s={f(k)} /></th><td><Text s={f(v)} /></td></tr>)}
      </tbody></table></div>
    );
  };

  return (
    <div className="wrap section legal">
      <header className="legal-head">
        <h1>{d.title}</h1>
        <p className="note">{fmt(m.legal.updated, { date: updated })}</p>
        {COMPANY.draft && <div className="legal-draft" role="note">{m.legal.draft}</div>}
        {d.intro.map((p, i) => <p key={i}><Text s={f(p)} /></p>)}
      </header>
      <nav className="legal-toc" aria-label={m.legal.contents}>
        <strong>{m.legal.contents}</strong>
        <ol>{d.sections.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.h}</a></li>)}</ol>
      </nav>
      <ol className="legal-sections">
        {d.sections.map((s) => (
          <li key={s.id} id={s.id}>
            <h2>{s.h}</h2>
            {s.blocks.map(block)}
          </li>
        ))}
      </ol>
    </div>
  );
}
