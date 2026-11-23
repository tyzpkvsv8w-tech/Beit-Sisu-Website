import Link from "next/link";
import { getUser } from "@/lib/auth";
import { COMPANY } from "@/legal/company";
import { fmt, getI18n } from "@/i18n";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.deletePage.title };
}

// Public page explaining account deletion. Google Play asks for this link in the Data safety form.
export default async function DeleteAccountInfo() {
  const [{ m }, user] = await Promise.all([getI18n(), getUser()]);
  const t = m.deletePage;
  return (
    <div className="wrap section legal">
      <header className="legal-head">
        <h1>{t.title}</h1>
        <p>{t.intro}</p>
      </header>
      <ol className="legal-sections">
        <li id="how"><h2>{t.howTitle}</h2><ul>{t.steps.map((x) => <li key={x}>{x}</li>)}</ul>
          <Link className="btn btn-primary" style={{ justifySelf: "start" }} href={user ? "/account#delete" : "/login?next=/account"}>{t.goAccount}</Link></li>
        <li id="deleted"><h2>{t.deletedTitle}</h2><ul>{t.deleted.map((x) => <li key={x}>{x}</li>)}</ul></li>
        <li id="kept"><h2>{t.keptTitle}</h2><p>{t.kept}</p></li>
        <li id="no-access"><h2>{t.noAccessTitle}</h2><p>{fmt(t.noAccess, { email: COMPANY.privacyEmail })}</p></li>
      </ol>
    </div>
  );
}
