import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { PhoneAuth } from "@/components/AuthForms";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.auth.addPhoneTitle };
}

export default async function AddPhone() {
  const user = await requireUser("/account/phone");
  if (user.phone) redirect("/account");
  return <div className="wrap auth"><PhoneAuth next="/account" attach /></div>;
}
