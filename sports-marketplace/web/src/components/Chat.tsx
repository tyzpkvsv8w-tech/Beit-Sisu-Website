"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { sendMessage } from "@/app/actions/social";

type Msg = { id: string; body: string; mine: boolean; at: string };

export function Chat({ conversationId, initial, quickReplies }: { conversationId: string; initial: Msg[]; quickReplies: string[] }) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const box = useRef<HTMLDivElement>(null);
  const last = useRef(initial.at(-1)?.at ?? "");

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages${last.current ? `?after=${encodeURIComponent(last.current)}` : ""}`, { cache: "no-store" });
      if (!res.ok) return;
      const data: { messages: Msg[] } = await res.json();
      if (data.messages.length) {
        last.current = data.messages.at(-1)!.at;
        setMsgs((cur) => {
          const seen = new Set(cur.map((m) => m.id));
          return [...cur, ...data.messages.filter((m) => !seen.has(m.id))];
        });
      }
    } catch {
      /* offline: try again on the next tick */
    }
  }, [conversationId]);

  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") poll(); }, 4000);
    return () => clearInterval(t);
  }, [poll]);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [msgs.length]);

  function send(body: string) {
    if (!body.trim()) return;
    setError("");
    start(async () => {
      const res = await sendMessage(conversationId, body);
      if (res.error) { setError(res.error); return; }
      setText("");
      await poll();
    });
  }

  return (
    <>
      <div className="msgs" ref={box} aria-live="polite">
        <div className="msg sys">Keep the chat here so there&apos;s a record. Pay in person, never by deposit.</div>
        {msgs.map((m) => (
          <div key={m.id} className={`msg ${m.mine ? "me" : "them"}`}>
            {m.body}
            <time dateTime={m.at}>{new Date(m.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</time>
          </div>
        ))}
      </div>
      <div>
        {msgs.length === 0 && (
          <div className="quick">
            {quickReplies.map((q) => <button key={q} type="button" onClick={() => send(q)} disabled={pending}>{q}</button>)}
          </div>
        )}
        {error && <div className="err" style={{ padding: "8px 16px 0" }}>{error}</div>}
        <form className="compose" onSubmit={(e) => { e.preventDefault(); send(text); }}>
          <input id="chatIn" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" aria-label="Message" autoComplete="off" maxLength={2000} />
          <button className="btn btn-primary" type="submit" disabled={pending || !text.trim()}>Send</button>
        </form>
      </div>
    </>
  );
}
