import { requireUser } from "@/lib/auth";
import { ListingForm } from "@/components/ListingForm";

export const metadata = { title: "Post an ad" };

export default async function Sell() {
  await requireUser("/sell");
  return (
    <div className="wrap"><div className="form-wrap">
      <ListingForm />
      <aside style={{ display: "grid", gap: 14 }}>
        <div className="free-badge"><h3>Free. Really.</h3><p style={{ margin: 0 }}>No listing fee, no commission, no premium tier for sellers. ReKit is paid for by local sports businesses who advertise here, and every ad is labelled.</p></div>
        <div className="panel"><strong>Tips for a quick sale</strong>
          <ul className="tips"><li>Put the brand and size in the title.</li><li>Mention any wear honestly. Buyers trust it.</li><li>Check what similar items are listed for.</li></ul></div>
      </aside>
    </div></div>
  );
}
