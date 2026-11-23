import { getI18n } from "@/i18n";
import { verifySignature } from "@/lib/app";
import { unsubscribe } from "@/app/actions/email";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.unsub.title };
}

// Asks for a click rather than unsubscribing on page load, because some email
// security scanners open every link in an email.
export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ u?: string; s?: string; done?: string; invalid?: string }> }) {
  const sp = await searchParams;
  const { m } = await getI18n();
  const valid = !!sp.u && !!sp.s && verifySignature(`unsub:${sp.u}`, sp.s);
  return (
    <div className="wrap auth">
      <div className="form-card">
        <h1>{m.unsub.title}</h1>
        {sp.done ? <p className="ok" style={{ margin: 0 }}>{m.unsub.done}</p>
          : sp.invalid || !valid ? <p className="err" style={{ margin: 0 }}>{m.unsub.invalid}</p>
          : (
            <form action={unsubscribe} style={{ display: "grid", gap: 14 }}>
              <p style={{ margin: 0 }}>{m.unsub.text}</p>
              <input type="hidden" name="u" value={sp.u} />
              <input type="hidden" name="s" value={sp.s} />
              <button className="btn btn-primary" type="submit">{m.unsub.button}</button>
            </form>
          )}
      </div>
    </div>
  );
}
