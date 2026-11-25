"use client";

import { useRef } from "react";
import { blockFromChat } from "@/app/actions/blocks";
import { fmt } from "@/i18n/fmt";
import { useI18n } from "@/i18n/client";

/** Block (and optionally report) the other person, with a confirmation step. */
export function BlockButton({ conversationId, name }: { conversationId: string; name: string }) {
  const { m } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="linkbtn block-btn" onClick={() => ref.current?.showModal()}>{m.block.button}</button>
      <dialog ref={ref} className="sheet">
        <form action={blockFromChat} className="block-sheet">
          <h2 style={{ fontSize: 22, margin: 0 }}>{fmt(m.block.title, { name })}</h2>
          <p style={{ margin: 0 }}>{m.block.text}</p>
          <input type="hidden" name="conversationId" value={conversationId} />
          <label className="check"><input type="checkbox" name="report" id="blockReport" /> {m.block.report}</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-danger" type="submit">{m.block.confirm}</button>
            <button className="btn btn-ghost" type="button" onClick={() => ref.current?.close()}>{m.common.cancel}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
