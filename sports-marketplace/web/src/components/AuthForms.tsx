"use client";

import Link from "next/link";
import { login, signup } from "@/app/actions/auth";
import { market } from "@/lib/constants";
import { SubmitButton } from "./SubmitButton";
import { useFormAction } from "./useFormAction";

export function LoginForm({ next }: { next: string }) {
  const { state, onSubmit, pending } = useFormAction(login);
  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <div><div className="eyebrow">Welcome back</div><h1>Log in</h1></div>
      <input type="hidden" name="next" value={next} />
      <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
      {state?.error && <div className="err" role="alert">{state.error}</div>}
      <SubmitButton pending={pending} className="btn btn-primary btn-block" pendingText="Logging in…">Log in</SubmitButton>
      <div className="alt">New to ReKit? <Link href={`/signup?next=${encodeURIComponent(next)}`}>Create a free account</Link></div>
    </form>
  );
}

export function SignupForm({ next }: { next: string }) {
  const { state, onSubmit, pending } = useFormAction(signup);
  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <div><div className="eyebrow">Free forever</div><h1>Create account</h1></div>
      <input type="hidden" name="next" value={next} />
      <div className="field"><label htmlFor="name">Name shown to buyers</label><input id="name" name="name" autoComplete="name" placeholder="e.g. Sam R." required /></div>
      <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="new-password" required /><span className="hint">At least 8 characters.</span></div>
      <div className="field"><label htmlFor="city">Emirate / city</label>
        <select id="city" name="city" required defaultValue="">
          <option value="" disabled>Choose…</option>
          {market().cities.map((c) => <option key={c}>{c}</option>)}
        </select></div>
      <label className="check"><input type="checkbox" name="terms" id="terms" /> I agree to the terms of use and privacy policy</label>
      {state?.error && <div className="err" role="alert">{state.error}</div>}
      <SubmitButton pending={pending} className="btn btn-primary btn-block" pendingText="Creating account…">Create account</SubmitButton>
      <div className="alt">Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`}>Log in</Link></div>
    </form>
  );
}
