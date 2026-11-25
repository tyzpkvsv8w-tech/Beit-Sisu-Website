import { redirect } from "next/navigation";
import { getUser, safeNext } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { LoginForm } from "@/components/AuthForms";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.auth.login };
}

export default async function EmailLogin({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getUser()) redirect(next);
  return <div className="wrap auth"><LoginForm next={next} /></div>;
}
