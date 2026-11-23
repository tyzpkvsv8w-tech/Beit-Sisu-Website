"use client";

import { useState } from "react";
import { setListingStatus } from "@/app/actions/listings";

/** Delete needs a second tap, so an ad isn't lost by accident. */
export function ConfirmDelete({ id }: { id: string }) {
  const [ask, setAsk] = useState(false);
  if (!ask) return <button className="btn btn-ghost btn-sm" type="button" onClick={() => setAsk(true)}>Delete</button>;
  return (
    <form action={setListingStatus} style={{ display: "flex", gap: 6 }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value="REMOVED" />
      <button className="btn btn-sm" style={{ background: "var(--danger)", color: "#fff" }} type="submit">Yes, delete</button>
      <button className="btn btn-ghost btn-sm" type="button" onClick={() => setAsk(false)}>Keep</button>
    </form>
  );
}
