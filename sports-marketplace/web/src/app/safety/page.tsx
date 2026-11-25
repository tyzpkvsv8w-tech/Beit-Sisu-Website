import { getI18n } from "@/i18n";

export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.common.safetyTips };
}

export default async function Safety() {
  const { m } = await getI18n();
  return (
    <div className="wrap section" style={{ maxWidth: 760 }}><div className="panel">
      <h1 style={{ fontSize: 40, textTransform: "uppercase" }}>{m.safety.title}</h1>
      <ul className="tips" style={{ fontSize: 15, color: "var(--fg)" }}>{m.safety.items.map((x) => <li key={x}>{x}</li>)}</ul>
    </div></div>
  );
}
