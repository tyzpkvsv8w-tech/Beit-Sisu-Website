import { redirect } from "next/navigation";
import { getUser, safeNext } from "@/lib/auth";
import { SignupForm } from "@/components/AuthForms";

export const metadata = { title: "Create an account" };

export default async function Signup({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getUser()) redirect(next);
  return <div className="wrap auth"><SignupForm next={next} /></div>;
}
