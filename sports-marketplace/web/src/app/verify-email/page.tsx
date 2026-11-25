import Link from "next/link";
import { fmt, getI18n } from "@/i18n";
import { confirmEmail } from "@/app/actions/email";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.verify.title };
}

export default async function VerifyEmail({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const { m } = await getI18n();
  const result = await confirmEmail(token);
  return (
    <div className="wrap auth">
      <div className="form-card">
        <h1>{result.ok ? m.verify.title : m.verify.failTitle}</h1>
        <p style={{ margin: 0 }} className={result.ok ? "ok" : "err"}>
          {result.ok ? fmt(m.verify.ok, { email: result.email }) : result.reason === "taken" ? m.verify.taken : m.verify.fail}
        </p>
        <Link className="btn btn-primary" href="/account">{m.verify.toAccount}</Link>
      </div>
    </div>
  );
}
