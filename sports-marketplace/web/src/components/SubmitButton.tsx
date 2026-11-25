"use client";

export function SubmitButton({ children, pending, pendingText, className = "btn btn-primary" }: { children: React.ReactNode; pending: boolean; pendingText?: string; className?: string }) {
  return (
    <button className={className} type="submit" disabled={pending} aria-busy={pending}>
      {pending ? pendingText ?? "Working…" : children}
    </button>
  );
}
