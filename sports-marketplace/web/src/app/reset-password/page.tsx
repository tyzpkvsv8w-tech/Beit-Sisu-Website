import Link from "next/link";
import { getI18n } from "@/i18n";
import { peekEmailToken } from "@/lib/tokens";
import { ResetPasswordForm } from "@/components/EmailForms";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.password.resetTitle };
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const { m } = await getI18n();
  // Checked again (and used up) when the form is submitted.
  const valid = await peekEmailToken(token, "reset");
  return (
    <div className="wrap auth">
      {valid ? <ResetPasswordForm token={token} /> : (
        <div className="form-card">
          <h1>{m.password.resetTitle}</h1>
          <p className="err" style={{ margin: 0 }}>{m.password.invalid}</p>
          <Link className="btn btn-primary" href="/forgot-password">{m.password.requestNew}</Link>
        </div>
      )}
    </div>
  );
}
