"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFavorite } from "@/app/actions/social";
import { useI18n } from "@/i18n/client";

const Heart = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2} aria-hidden="true">
    <path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.4 5 7 5c2 0 3.3 1 5 3 1.7-2 3-3 5-3 3.6 0 5.8 3.6 4.5 6.8C19.5 16.4 12 21 12 21z" />
  </svg>
);

export function FavButton({ listingId, initial, variant = "icon" }: { listingId: string; initial: boolean; variant?: "icon" | "button" }) {
  const { m } = useI18n();
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    start(async () => {
      const res = await toggleFavorite(listingId);
      if ("login" in res) router.push(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
      else setSaved(res.saved);
    });
  }

  if (variant === "button") {
    return (
      <button type="button" className="btn btn-ghost" onClick={onClick} disabled={pending} aria-pressed={saved}>
        {saved ? m.listing.saved : m.listing.save}
      </button>
    );
  }
  return (
    <button type="button" className={`fav${saved ? " on" : ""}`} onClick={onClick} disabled={pending}
      aria-pressed={saved} aria-label={saved ? m.card.unsave : m.card.save}>
      <Heart filled={saved} />
    </button>
  );
}
