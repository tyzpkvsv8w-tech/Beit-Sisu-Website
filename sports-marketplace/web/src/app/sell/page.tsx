import { requireUser } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { ListingForm } from "@/components/ListingForm";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.sell.titleNew };
}

export default async function Sell() {
  await requireUser("/sell");
  const { m } = await getI18n();
  return (
    <div className="wrap"><div className="form-wrap">
      <ListingForm />
      <aside style={{ display: "grid", gap: 14 }}>
        <div className="free-badge"><h3>{m.sell.freeTitle}</h3><p style={{ margin: 0 }}>{m.sell.freeText}</p></div>
        <div className="panel"><strong>{m.sell.tipsTitle}</strong>
          <ul className="tips">{m.sell.tips.map((x) => <li key={x}>{x}</li>)}</ul></div>
      </aside>
    </div></div>
  );
}
