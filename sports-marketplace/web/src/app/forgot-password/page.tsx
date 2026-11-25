import { getI18n } from "@/i18n";
import { ForgotPasswordForm } from "@/components/EmailForms";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.password.forgotTitle };
}

export default function ForgotPassword() {
  return <div className="wrap auth"><ForgotPasswordForm /></div>;
}
