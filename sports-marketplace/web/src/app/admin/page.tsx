import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { en } from "@/i18n/en";
import { COMPANY } from "@/legal/company";

// The admin page is an internal tool, kept in English.
import { timeAgo } from "@/lib/format";
import { markEnquiryHandled, resolveReport, toggleCampaign } from "@/app/actions/admin";
import { reviewCampaign } from "@/app/actions/ads";
import { aed } from "@/lib/pricing";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function Admin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  await requireAdmin();
  const [reports, enquiries, campaigns, stats] = await Promise.all([
    db.report.findMany({ where: { resolved: false }, orderBy: { createdAt: "desc" }, include: { listing: { select: { id: true, title: true, status: true } }, reporter: { select: { name: true } } } }),
    db.adEnquiry.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    db.adCampaign.findMany({ where: { status: { notIn: ["IN_REVIEW", "PENDING_PAYMENT", "CANCELLED"] } }, orderBy: { endsAt: "desc" } }),
    Promise.all([db.user.count(), db.listing.count({ where: { status: "ACTIVE" } }), db.message.count(), db.listing.count({ where: { status: "SOLD" } })]),
  ]);
  const [users, live, messages, sold] = stats;
  const [queue, revenue] = await Promise.all([
    db.adCampaign.findMany({ where: { status: "IN_REVIEW" }, orderBy: { startsAt: "asc" }, include: { owner: { select: { name: true, email: true, phone: true } }, orders: { where: { status: "PAID" } } } }),
    db.order.aggregate({ where: { status: "PAID" }, _sum: { total: true } }),
  ]);
  return (
    <div className="wrap section" style={{ display: "grid", gap: 24 }}>
      <div className="toolbar"><div><h1>Admin</h1></div></div>
      {COMPANY.draft && (
        <div className="legal-draft" role="note">
          Reminder: the Terms of Use and Privacy Policy are still drafts waiting for legal review.
          See LAUNCH-CHECKLIST.md. This goes away when <code>draft</code> is set to false in src/legal/company.ts.
        </div>
      )}
      <div className="adv-stats">
        <div className="stat"><b>{users}</b><span>members</span></div>
        <div className="stat"><b>{live}</b><span>live ads</span></div>
        <div className="stat"><b>{sold}</b><span>marked sold</span></div>
        <div className="stat"><b>{messages}</b><span>messages sent</span></div>
        <div className="stat"><b>{aed(revenue._sum.total ?? 0)}</b><span>ad revenue (incl. VAT)</span></div>
      </div>

      {saved && <div className="banner-ok">Campaign saved.</div>}
      <section>
        <div className="section-head"><h2>Ads waiting for review ({queue.length})</h2><span className="note">Paid online. Rejecting refunds the advertiser in full.</span></div>
        {queue.length ? (
          <div className="review-list">
            {queue.map((c) => (
              <div key={c.id} className="panel">
                <div className="s note">{c.placement.replace("_", " ").toLowerCase()}{c.sport ? ` · ${en.sports[c.sport]}` : ""} · {c.startsAt.toLocaleDateString("en-GB", { timeZone: "Asia/Dubai" })} – {new Date(c.endsAt.getTime() - 1).toLocaleDateString("en-GB", { timeZone: "Asia/Dubai" })} · paid {aed(c.orders[0]?.total ?? 0)}</div>
                <div className="ad ad-leader"><span className="ad-label">Preview</span><div className="brand" dir="auto">{c.advertiser}</div><div className="msg" dir="auto"><strong>{c.headline}</strong>{c.body}</div><span className="btn btn-primary">{c.ctaLabel}</span></div>
                <div className="note">Link: <a href={c.ctaUrl} target="_blank" rel="noopener noreferrer nofollow">{c.ctaUrl}</a> · Booked by {c.owner?.name} {c.owner?.email ?? c.owner?.phone ?? ""}</div>
                <div className="review-actions">
                  {/* Separate forms, so a click can never be read as the other decision. */}
                  <form action={reviewCampaign}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="decision" value="approve" />
                    <button className="btn btn-primary btn-sm" type="submit">Approve</button>
                  </form>
                  <form action={reviewCampaign} className="review-reject">
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="decision" value="reject" />
                    <input name="note" placeholder="Reason for rejecting (sent to the advertiser)" aria-label="Rejection reason" />
                    <button className="btn btn-sm btn-danger" type="submit">Reject and refund</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="note">Nothing waiting.</p>}
      </section>

      <section>
        <div className="section-head"><h2>Reported ads ({reports.length})</h2></div>
        {reports.length ? (
          <div className="table-wrap"><table className="data">
            <thead><tr><th>Ad</th><th>Reason</th><th>By</th><th>When</th><th></th></tr></thead>
            <tbody>{reports.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/listing/${r.listing.id}`}>{r.listing.title}</Link></td>
                <td>{r.reason}{r.details && <div className="note">{r.details}</div>}</td>
                <td>{r.reporter.name}</td><td>{timeAgo(r.createdAt)}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <form action={resolveReport} style={{ display: "inline" }}><input type="hidden" name="id" value={r.id} /><button className="btn btn-ghost btn-sm">Dismiss</button></form>{" "}
                  <form action={resolveReport} style={{ display: "inline" }}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="remove" value="1" /><button className="btn btn-sm btn-danger">Remove ad</button></form>
                </td>
              </tr>))}</tbody>
          </table></div>
        ) : <p className="note">No open reports.</p>}
      </section>

      <section>
        <div className="section-head"><h2>Ad campaigns</h2><span className="note">Paid online so far: {aed(revenue._sum.total ?? 0)}</span><a className="btn btn-primary btn-sm" href="/admin/campaigns/new">+ New campaign</a></div>
        <div className="table-wrap"><table className="data">
          <thead><tr><th>Advertiser</th><th>Placement</th><th>Targeting</th><th>Runs</th><th className="num">Views</th><th className="num">Clicks</th><th className="num">CTR</th><th></th></tr></thead>
          <tbody>{campaigns.map((c) => (
            <tr key={c.id}>
              <td><a href={`/admin/campaigns/${c.id}`}><strong>{c.advertiser}</strong></a><div className="note">{c.headline}{c.status !== "APPROVED" && ` · ${c.status.toLowerCase()}`}</div></td>
              <td>{c.placement.replace("_", " ").toLowerCase()}</td>
              <td>{[c.sport && en.sports[c.sport], c.city].filter(Boolean).join(", ") || "All"}</td>
              <td style={{ whiteSpace: "nowrap" }}>{c.startsAt.toLocaleDateString("en-GB")} – {c.endsAt.toLocaleDateString("en-GB")}</td>
              <td className="num">{c.impressions}</td><td className="num">{c.clicks}</td>
              <td className="num">{c.impressions ? ((c.clicks / c.impressions) * 100).toFixed(1) + "%" : "–"}</td>
              <td><form action={toggleCampaign}><input type="hidden" name="id" value={c.id} /><button className="btn btn-ghost btn-sm">{c.active ? "Pause" : "Resume"}</button></form></td>
            </tr>))}</tbody>
        </table></div>
      </section>

      <section>
        <div className="section-head"><h2>Advertiser enquiries</h2></div>
        {enquiries.length ? (
          <div className="table-wrap"><table className="data">
            <thead><tr><th>Business</th><th>Contact</th><th>Sport / budget</th><th>Message</th><th>When</th><th></th></tr></thead>
            <tbody>{enquiries.map((e) => (
              <tr key={e.id} style={{ opacity: e.handled ? 0.55 : 1 }}>
                <td><strong>{e.business}</strong></td><td>{e.name}<div className="note">{e.email}</div></td>
                <td>{(e.sport && en.sports[e.sport]) || e.sport || "Several"}<div className="note">{e.budget}</div></td><td>{e.message}</td><td>{timeAgo(e.createdAt)}</td>
                <td>{!e.handled && <form action={markEnquiryHandled}><input type="hidden" name="id" value={e.id} /><button className="btn btn-ghost btn-sm">Mark handled</button></form>}</td>
              </tr>))}</tbody>
          </table></div>
        ) : <p className="note">No enquiries yet.</p>}
      </section>
    </div>
  );
}
