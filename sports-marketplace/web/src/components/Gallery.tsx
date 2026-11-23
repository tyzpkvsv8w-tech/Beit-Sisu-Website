"use client";

import { useState } from "react";
import { sportOf } from "@/lib/constants";
import { photoUrl } from "@/lib/format";

const tint = (sport: string, pct: number) => `color-mix(in srgb, ${sportOf(sport).color} ${pct}%, var(--surface))`;

export function Gallery({ sport, title, keys }: { sport: string; title: string; keys: string[] }) {
  const [i, setI] = useState(0);
  return (
    <>
      <div className="main" style={{ background: tint(sport, 35) }}>
        {keys.length ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl(keys[i])} alt={`${title}, photo ${i + 1} of ${keys.length}`} />
        ) : (
          <span className="em" aria-hidden="true">{sportOf(sport).em}</span>
        )}
      </div>
      {keys.length > 1 && (
        <div className="strip">
          {keys.map((k, n) => (
            <button key={k} type="button" className={n === i ? "on" : ""} onClick={() => setI(n)} aria-label={`Show photo ${n + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl(k)} alt="" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
