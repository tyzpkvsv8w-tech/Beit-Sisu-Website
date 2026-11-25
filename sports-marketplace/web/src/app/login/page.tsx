import { redirect } from "next/navigation";
import { getUser, safeNext } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { PhoneAuth } from "@/components/AuthForms";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.auth.login };
}

// Phone number is the main way in: one flow for logging in and signing up.
export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getUser()) redirect(next);
  return <div className="wrap auth"><PhoneAuth next={next} /></div>;
}
