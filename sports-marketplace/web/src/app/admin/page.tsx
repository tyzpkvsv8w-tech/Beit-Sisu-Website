import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sportOf } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { markEnquiryHandled, resolveReport, toggleCampaign } from "@/app/actions/admin";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function Admin() {
  await requireAdmin();
  const [reports, enquiries, campaigns, stats] = await Promise.all([
    db.report.findMany({ where: { resolved: false }, orderBy: { createdAt: "desc" }, include: { listing: { select: { id: true, title: true, status: true } }, reporter: { select: { name: true } } } }),
    db.adEnquiry.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    db.adCampaign.findMany({ orderBy: { endsAt: "desc" } }),
    Promise.all([db.user.count(), db.listing.count({ where: { status: "ACTIVE" } }), db.message.count(), db.listing.count({ where: { status: "SOLD" } })]),
  ]);
  const [users, live, messages, sold] = stats;
  return (
    <div className="wrap section" style={{ display: "grid", gap: 24 }}>
      <div className="toolbar"><div><h1>Admin</h1></div></div>
      <div className="adv-stats">
        <div className="stat"><b>{users}</b><span>members</span></div>
        <div className="stat"><b>{live}</b><span>live ads</span></div>
        <div className="stat"><b>{sold}</b><span>marked sold</span></div>
        <div className="stat"><b>{messages}</b><span>messages sent</span></div>
      </div>

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
                  <form action={resolveReport} style={{ display: "inline" }}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="remove" value="1" /><button className="btn btn-sm" style={{ background: "var(--danger)", color: "#fff" }}>Remove ad</button></form>
                </td>
              </tr>))}</tbody>
          </table></div>
        ) : <p className="note">No open reports.</p>}
      </section>

      <section>
        <div className="section-head"><h2>Ad campaigns</h2></div>
        <div className="table-wrap"><table className="data">
          <thead><tr><th>Advertiser</th><th>Placement</th><th>Targeting</th><th>Runs</th><th className="num">Views</th><th className="num">Clicks</th><th className="num">CTR</th><th></th></tr></thead>
          <tbody>{campaigns.map((c) => (
            <tr key={c.id}>
              <td><strong>{c.advertiser}</strong><div className="note">{c.headline}</div></td>
              <td>{c.placement.replace("_", " ").toLowerCase()}</td>
              <td>{[c.sport && sportOf(c.sport).name, c.city].filter(Boolean).join(", ") || "All"}</td>
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
                <td>{e.sport || "Several"}<div className="note">{e.budget}</div></td><td>{e.message}</td><td>{timeAgo(e.createdAt)}</td>
                <td>{!e.handled && <form action={markEnquiryHandled}><input type="hidden" name="id" value={e.id} /><button className="btn btn-ghost btn-sm">Mark handled</button></form>}</td>
              </tr>))}</tbody>
          </table></div>
        ) : <p className="note">No enquiries yet.</p>}
      </section>
    </div>
  );
}
