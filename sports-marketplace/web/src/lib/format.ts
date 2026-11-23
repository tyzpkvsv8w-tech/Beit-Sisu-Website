import { market } from "./constants";

export function money(amount: number, marketCode?: string) {
  return `${market(marketCode).currency} ${amount.toLocaleString("en-AE")}`;
}

export function timeAgo(date: Date) {
  const ms = Date.now() - date.getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 30) return `${d} days ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function memberSince(date: Date) {
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export function photoUrl(key: string) {
  return `/uploads/${key}`;
}
