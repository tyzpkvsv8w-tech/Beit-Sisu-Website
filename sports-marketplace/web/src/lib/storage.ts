import "server-only";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { MAX_PHOTO_BYTES } from "./constants";

// Local-disk storage for development. In production replace these three
// functions with an object store (S3, Cloudflare R2, Supabase Storage).
const dir = () => path.resolve(process.env.UPLOAD_DIR || "./uploads");

const TYPES: { ext: string; mime: string; magic: (b: Buffer) => boolean }[] = [
  { ext: "jpg", mime: "image/jpeg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", mime: "image/png", magic: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: "webp", mime: "image/webp", magic: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
];

export const KEY_PATTERN = /^[a-f0-9]{32}\.(jpg|png|webp)$/;

/** Validates by file contents, not by the name or type the browser claims. */
export async function savePhoto(file: File): Promise<string> {
  if (file.size === 0) throw new Error("Empty file");
  if (file.size > MAX_PHOTO_BYTES) throw new Error("Each photo must be under 5 MB");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = TYPES.find((t) => t.magic(buf));
  if (!type) throw new Error("Photos must be JPG, PNG or WebP");
  const key = `${randomBytes(16).toString("hex")}.${type.ext}`;
  await mkdir(dir(), { recursive: true });
  await writeFile(path.join(dir(), key), buf);
  return key;
}

export async function readPhoto(key: string) {
  if (!KEY_PATTERN.test(key)) return null;
  try {
    const data = await readFile(path.join(dir(), key));
    const ext = key.split(".").pop();
    const mime = TYPES.find((t) => t.ext === ext)!.mime;
    return { data, mime };
  } catch {
    return null;
  }
}

export async function deletePhoto(key: string) {
  if (!KEY_PATTERN.test(key)) return;
  await unlink(path.join(dir(), key)).catch(() => {});
}
