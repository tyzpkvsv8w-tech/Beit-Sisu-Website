import { redirect } from "next/navigation";
import { getUser, safeNext } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { SignupForm } from "@/components/AuthForms";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.auth.createAccount };
}

export default async function Signup({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getUser()) redirect(next);
  return <div className="wrap auth"><SignupForm next={next} /></div>;
}
