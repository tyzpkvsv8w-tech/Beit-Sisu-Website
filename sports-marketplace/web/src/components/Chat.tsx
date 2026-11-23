"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { sendMessage } from "@/app/actions/social";
import { useI18n } from "@/i18n/client";

type Msg = { id: string; body: string; mine: boolean; at: string };

export function Chat({ conversationId, initial, quickReplies }: { conversationId: string; initial: Msg[]; quickReplies: string[] }) {
  const { m, locale } = useI18n();
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
          const seen = new Set(cur.map((x) => x.id));
          return [...cur, ...data.messages.filter((x) => !seen.has(x.id))];
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
        <div className="msg sys">{m.chat.note}</div>
        {msgs.map((msg) => (
          <div key={msg.id} className={`msg ${msg.mine ? "me" : "them"}`} dir="auto">
            {msg.body}
            <time dateTime={msg.at}>{new Date(msg.at).toLocaleTimeString(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { hour: "2-digit", minute: "2-digit" })}</time>
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
          <input id="chatIn" value={text} onChange={(e) => setText(e.target.value)} placeholder={m.chat.placeholder} aria-label={m.chat.message} dir="auto" autoComplete="off" maxLength={2000} />
          <button className="btn btn-primary" type="submit" disabled={pending || !text.trim()}>{m.chat.send}</button>
        </form>
      </div>
    </>
  );
}
