import Link from "next/link";
import { COMPANY } from "@/legal/company";
import { fmt, getI18n } from "@/i18n";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.help.title };
}

// Support page with contact details. The App Store asks for a support URL, and its rules for
// apps with user content require published contact information.
export default async function Help() {
  const { m } = await getI18n();
  const t = m.help;
  return (
    <div className="wrap section legal">
      <header className="legal-head"><h1>{t.title}</h1><p>{t.intro}</p></header>
      <ol className="legal-sections">
        <li id="contact"><h2>{t.contactTitle}</h2><p dir="auto">{fmt(t.contact, { email: COMPANY.email })}</p></li>
        <li id="report"><h2>{t.reportTitle}</h2><ul>{t.report.map((x) => <li key={x}>{x}</li>)}</ul></li>
        <li id="more"><h2>{t.links}</h2><ul>
          <li><Link href="/safety">{t.safety}</Link></li><li><Link href="/delete-account">{t.account}</Link></li>
          <li><Link href="/terms">{t.terms}</Link></li><li><Link href="/privacy">{t.privacy}</Link></li><li><Link href="/advertise">{t.advertise}</Link></li>
        </ul></li>
      </ol>
    </div>
  );
}
