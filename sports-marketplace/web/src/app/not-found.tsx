import Link from "next/link";
import { getI18n } from "@/i18n";

export default async function NotFound() {
  const { m } = await getI18n();
  return (
    <div className="wrap section">
      <div className="empty"><h3>{m.notFound.title}</h3><p>{m.notFound.text}</p><Link className="btn btn-primary" href="/browse">{m.notFound.cta}</Link></div>
    </div>
  );
}
