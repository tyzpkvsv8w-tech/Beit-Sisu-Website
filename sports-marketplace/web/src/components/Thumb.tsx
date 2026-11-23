import { sportOf } from "@/lib/constants";
import { photoUrl } from "@/lib/format";

export function tint(sport: string, pct: number) {
  return `color-mix(in srgb, ${sportOf(sport).color} ${pct}%, var(--surface))`;
}

/** Listing photo, or a sport-coloured tile when the seller added no photos. */
export function Thumb({ sport, photoKey, alt, count }: { sport: string; photoKey?: string; alt: string; count?: number }) {
  return (
    <div className="thumb" style={{ background: tint(sport, 55) }}>
      {photoKey ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl(photoKey)} alt={alt} loading="lazy" />
      ) : (
        <span className="em" aria-hidden="true">{sportOf(sport).em}</span>
      )}
      {count && count > 1 ? <span className="ph">{count} photos</span> : null}
    </div>
  );
}
