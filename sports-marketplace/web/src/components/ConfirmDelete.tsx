"use client";

import { useState } from "react";
import { setListingStatus } from "@/app/actions/listings";
import { useI18n } from "@/i18n/client";

/** Delete needs a second tap, so an ad isn't lost by accident. */
export function ConfirmDelete({ id }: { id: string }) {
  const { m } = useI18n();
  const [ask, setAsk] = useState(false);
  if (!ask) return <button className="btn btn-ghost btn-sm" type="button" onClick={() => setAsk(true)}>{m.account.delete}</button>;
  return (
    <form action={setListingStatus} style={{ display: "flex", gap: 6 }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value="REMOVED" />
      <button className="btn btn-sm btn-danger" type="submit">{m.account.yesDelete}</button>
      <button className="btn btn-ghost btn-sm" type="button" onClick={() => setAsk(false)}>{m.account.keep}</button>
    </form>
  );
}
