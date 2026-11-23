export const metadata = { title: "Safety tips" };

export default function Safety() {
  return (
    <div className="wrap section" style={{ maxWidth: 760 }}><div className="panel">
      <h1 style={{ fontSize: 40, textTransform: "uppercase" }}>Buying & selling safely</h1>
      <ul className="tips" style={{ fontSize: 15, color: "var(--fg)" }}>
        <li>Meet in a busy public place: a mall, a café, or the car park of your sports club.</li>
        <li>Inspect the item. Spin bike wheels, check racket frames for cracks, try boots on.</li>
        <li>Pay in person, in cash or by instant transfer once you have the item in your hands.</li>
        <li>Be wary of prices that look too good, or sellers who only want a courier and a deposit.</li>
        <li>Keep the conversation in ReKit chat so there is a record if something goes wrong.</li>
        <li>Report suspicious ads with the &quot;Report this ad&quot; link on the listing page.</li>
      </ul>
    </div></div>
  );
}
