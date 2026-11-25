"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { createListing, updateListing } from "@/app/actions/listings";
import type { FormState } from "@/app/actions/auth";
import { CONDITIONS, MAX_PHOTOS, SPORTS, market } from "@/lib/constants";
import { photoUrl } from "@/lib/format";
import { fmt } from "@/i18n/fmt";
import { useI18n } from "@/i18n/client";

type Existing = {
  id: string; title: string; sport: string; condition: string; price: number; negotiable: boolean;
  brand: string | null; size: string | null; city: string; area: string | null; description: string;
  photos: { id: string; key: string }[];
};

/** Shrinks a photo in the browser before upload: faster on mobile data, cheaper to store. */
async function compress(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const max = 1600;
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * k);
    canvas.height = Math.round(bmp.height * k);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    return blob ?? file;
  } catch {
    return file;
  }
}

type NewPhoto = { id: string; blob: Blob; url: string };

export function ListingForm({ existing }: { existing?: Existing }) {
  const { m } = useI18n();
  const t = m.sell;
  const [state, formAction] = useActionState<FormState, FormData>(existing ? updateListing : createListing, undefined);
  const [pending, start] = useTransition();
  const [keep, setKeep] = useState<string[]>(existing?.photos.map((p) => p.id) ?? []);
  const [photos, setPhotos] = useState<NewPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const errRef = useRef<HTMLDivElement>(null);
  const total = keep.length + photos.length;

  useEffect(() => { if (state?.error) errRef.current?.scrollIntoView({ block: "center" }); }, [state]);
  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  async function addFiles(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    const room = MAX_PHOTOS - total;
    const picked = [...files].filter((f) => f.type.startsWith("image/")).slice(0, room);
    const out: NewPhoto[] = [];
    for (const f of picked) {
      const blob = await compress(f);
      out.push({ id: crypto.randomUUID(), blob, url: URL.createObjectURL(blob) });
    }
    setPhotos((p) => [...p, ...out]);
    setBusy(false);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.delete("picker");
    fd.delete("photos");
    photos.forEach((p, i) => fd.append("photos", p.blob, `photo-${i}.jpg`));
    start(() => formAction(fd));
  }

  const v = existing;
  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <div><div className="eyebrow">{v ? t.eyebrowEdit : t.eyebrowNew}</div><h1 style={{ fontSize: 40, textTransform: "uppercase" }}>{v ? t.titleEdit : t.titleNew}</h1></div>
      {v && <input type="hidden" name="id" value={v.id} />}

      <h2>{t.what}</h2>
      <div className="field"><label htmlFor="title">{t.title}</label>
        <input id="title" name="title" maxLength={80} defaultValue={v?.title} placeholder={t.titlePh} dir="auto" required /></div>
      <div className="row2">
        <div className="field"><label htmlFor="sport">{t.sport}</label>
          <select id="sport" name="sport" defaultValue={v?.sport ?? ""} required>
            <option value="" disabled>{t.chooseSport}</option>
            {SPORTS.map((s) => <option key={s.id} value={s.id}>{m.sports[s.id]}</option>)}
          </select></div>
        <div className="field"><label htmlFor="condition">{t.condition}</label>
          <select id="condition" name="condition" defaultValue={v?.condition ?? "Good"}>
            {CONDITIONS.map((c) => <option key={c} value={c}>{m.conditions[c]}</option>)}
          </select></div>
      </div>
      <div className="row2">
        <div className="field"><label htmlFor="brand">{t.brand}</label><input id="brand" name="brand" maxLength={80} defaultValue={v?.brand ?? ""} placeholder={m.common.optional} dir="auto" /></div>
        <div className="field"><label htmlFor="size">{t.size}</label><input id="size" name="size" maxLength={80} defaultValue={v?.size ?? ""} placeholder={t.sizePh} dir="auto" /></div>
      </div>
      <div className="field"><label htmlFor="description">{t.description}</label>
        <textarea id="description" name="description" maxLength={2000} defaultValue={v?.description} placeholder={t.descriptionPh} dir="auto" /></div>

      <div className="field"><span className="lbl">{fmt(t.photos, { n: total, max: MAX_PHOTOS })}</span>
        <div className="photos">
          {v?.photos.filter((p) => keep.includes(p.id)).map((p) => (
            <div className="slot" key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl(p.key)} alt="" />
              <input type="hidden" name="keepPhoto" value={p.id} />
              <button type="button" onClick={() => setKeep((k) => k.filter((x) => x !== p.id))} aria-label={m.common.removePhoto}>×</button>
            </div>
          ))}
          {photos.map((p) => (
            <div className="slot" key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" />
              <button type="button" onClick={() => setPhotos((ps) => ps.filter((x) => x.id !== p.id))} aria-label={m.common.removePhoto}>×</button>
            </div>
          ))}
          {total < MAX_PHOTOS && (
            <label className="slot" htmlFor="picker">{busy ? t.adding : t.addPhotos}
              <input id="picker" name="picker" type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple
                onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            </label>
          )}
        </div>
        <span className="hint">{t.photosHint}</span></div>

      <h2>{t.priceLocation}</h2>
      <div className="row2">
        <div className="field"><label htmlFor="price">{fmt(t.price, { currency: market().currency })}</label>
          <input id="price" name="price" type="number" min={0} step={1} inputMode="numeric" defaultValue={v?.price} placeholder="0" required /></div>
        <div className="field"><label htmlFor="city">{t.city}</label>
          <select id="city" name="city" defaultValue={v?.city ?? market().cities[0]}>
            {market().cities.map((c) => <option key={c} value={c}>{m.cities[c]}</option>)}
          </select></div>
      </div>
      <div className="field"><label htmlFor="area">{t.area}</label><input id="area" name="area" maxLength={80} defaultValue={v?.area ?? ""} placeholder={t.areaPh} dir="auto" /></div>
      <label className="check"><input type="checkbox" name="negotiable" id="negotiable" defaultChecked={v?.negotiable ?? true} /> {t.negotiable}</label>

      <div ref={errRef}>{state?.error && <div className="err" role="alert">{state.error}</div>}</div>
      <button className="btn btn-primary btn-block" type="submit" disabled={pending || busy} style={{ paddingBlock: 14, fontSize: 16 }}>
        {pending ? t.saving : v ? t.save : t.publish}
      </button>
    </form>
  );
}
