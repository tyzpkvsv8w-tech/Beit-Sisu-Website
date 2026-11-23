import "server-only";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { MAX_PHOTO_BYTES } from "./constants";
import { supabaseStorage } from "./supabase";

// STORAGE_DRIVER=local keeps photos on disk (development).
// STORAGE_DRIVER=supabase puts them in a public Supabase Storage bucket.
const driver = () => (process.env.STORAGE_DRIVER === "supabase" ? "supabase" : "local");
const dir = () => path.resolve(process.env.UPLOAD_DIR || "./uploads");
const bucket = () => process.env.SUPABASE_BUCKET || "listing-photos";

const TYPES: { ext: string; mime: string; magic: (b: Buffer) => boolean }[] = [
  { ext: "jpg", mime: "image/jpeg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", mime: "image/png", magic: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: "webp", mime: "image/webp", magic: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
];

export const KEY_PATTERN = /^[a-f0-9]{32}\.(jpg|png|webp)$/;

export class PhotoError extends Error {
  constructor(public reason: "empty" | "tooBig" | "badType") {
    super(reason);
  }
}

/** Validates by file contents, not by the name or type the browser claims. */
export async function savePhoto(file: File): Promise<string> {
  if (file.size === 0) throw new PhotoError("empty");
  if (file.size > MAX_PHOTO_BYTES) throw new PhotoError("tooBig");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = TYPES.find((t) => t.magic(buf));
  if (!type) throw new PhotoError("badType");
  const key = `${randomBytes(16).toString("hex")}.${type.ext}`;
  if (driver() === "supabase") {
    await supabaseStorage.upload(bucket(), key, buf, type.mime);
  } else {
    await mkdir(dir(), { recursive: true });
    await writeFile(path.join(dir(), key), buf);
  }
  return key;
}

/** Local driver only: Supabase serves photos straight from its CDN. */
export async function readPhoto(key: string) {
  if (driver() !== "local" || !KEY_PATTERN.test(key)) return null;
  try {
    const data = await readFile(path.join(dir(), key));
    const ext = key.split(".").pop();
    return { data, mime: TYPES.find((t) => t.ext === ext)!.mime };
  } catch {
    return null;
  }
}

export async function deletePhotos(keys: string[]) {
  const valid = keys.filter((k) => KEY_PATTERN.test(k));
  if (driver() === "supabase") {
    await supabaseStorage.remove(bucket(), valid).catch((e) => console.error("Photo delete failed", e));
  } else {
    await Promise.all(valid.map((k) => unlink(path.join(dir(), k)).catch(() => {})));
  }
}
