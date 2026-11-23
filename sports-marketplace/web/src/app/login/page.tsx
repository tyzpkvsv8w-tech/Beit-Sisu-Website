import { redirect } from "next/navigation";
import { getUser, safeNext } from "@/lib/auth";
import { LoginForm } from "@/components/AuthForms";

export const metadata = { title: "Log in" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getUser()) redirect(next);
  return <div className="wrap auth"><LoginForm next={next} /></div>;
}
