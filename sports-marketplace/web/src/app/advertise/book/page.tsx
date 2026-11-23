import { requireUser } from "@/lib/auth";
import { bookedRanges } from "@/lib/campaigns";
import { uaeDate } from "@/lib/pricing";
import { COMPANY } from "@/legal/company";
import { getI18n } from "@/i18n";
import { BookingForm } from "@/components/BookingForm";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.book.metaTitle };
}

export default async function Book() {
  await requireUser("/advertise/book");
  const { m } = await getI18n();
  return (
    <div className="wrap section" style={{ display: "grid", gap: 18 }}>
      <div>
        <div className="eyebrow">{m.book.eyebrow}</div>
        <h1 style={{ fontSize: 44, textTransform: "uppercase" }}>{m.book.title}</h1>
        <p style={{ maxWidth: "62ch", margin: "6px 0 0" }}>{m.book.intro}</p>
      </div>
      <BookingForm booked={await bookedRanges()} minDate={uaeDate(new Date(), 1)} vatRate={COMPANY.vatRate} />
    </div>
  );
}
