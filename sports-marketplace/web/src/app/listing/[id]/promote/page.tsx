import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { COMPANY } from "@/legal/company";
import { fmt, getI18n } from "@/i18n";
import { PromoteForm } from "@/components/PromoteForm";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.promote.title };
}

export default async function Promote({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireUser(`/listing/${id}/promote`);
  const { m, locale } = await getI18n();
  const [listing, user] = await Promise.all([db.listing.findUnique({ where: { id } }), db.user.findUniqueOrThrow({ where: { id: me.id } })]);
  if (!listing || listing.sellerId !== me.id || listing.status === "REMOVED") notFound();
  const until = listing.sponsoredUntil && listing.sponsoredUntil > new Date() ? listing.sponsoredUntil : null;
  return (
    <div className="wrap auth">
      <div className="form-card">
        <div className="eyebrow" dir="auto">{listing.title}</div>
        <h1>{m.promote.title}</h1>
        <p style={{ margin: 0 }}>{m.promote.text}</p>
        {until && <div className="banner-ok">{fmt(m.promote.until, { date: until.toLocaleDateString(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { day: "numeric", month: "long", timeZone: "Asia/Dubai" }) })}. {m.promote.extend}</div>}
        {!user.isBusiness ? (
          <><p className="err" style={{ margin: 0 }}>{m.promote.onlyBusiness}</p><Link className="btn btn-ghost" href="/account">{m.common.account}</Link></>
        ) : listing.status !== "ACTIVE" ? (
          <p className="err" style={{ margin: 0 }}>{m.errors.listingNotActive}</p>
        ) : <PromoteForm listingId={listing.id} vatRate={COMPANY.vatRate} />}
      </div>
    </div>
  );
}
