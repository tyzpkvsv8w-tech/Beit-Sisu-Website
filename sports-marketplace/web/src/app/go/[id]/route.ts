import { db } from "@/lib/db";

// Ad click-through: counts the click, then sends the visitor to the advertiser.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ad = await db.adCampaign.findUnique({ where: { id } });
  if (!ad || !/^https?:\/\//.test(ad.ctaUrl)) return Response.redirect(new URL("/advertise", req.url), 302);
  await db.adCampaign.update({ where: { id }, data: { clicks: { increment: 1 } } });
  return Response.redirect(ad.ctaUrl, 302);
}
