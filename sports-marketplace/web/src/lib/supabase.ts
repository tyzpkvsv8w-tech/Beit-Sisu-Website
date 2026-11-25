import "server-only";

// Minimal Supabase REST client: we only need Auth (SMS codes) and Storage,
// so plain fetch keeps the dependency list short.

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const anon = process.env.SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) throw new Error("Supabase is not configured: set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY");
  return { url, anon, service };
}

export class SupabaseError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function call(path: string, init: RequestInit & { key: "anon" | "service" }) {
  const { url, anon, service } = config();
  const key = init.key === "service" ? service : anon;
  const res = await fetch(url + path, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...(init.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const code = body.error_code ?? body.code ?? body.error ?? String(res.status);
    throw new SupabaseError(res.status, String(code), body.msg ?? body.message ?? body.error_description ?? `Supabase request failed (${res.status})`);
  }
  return res;
}

export const supabaseAuth = {
  /** Texts a one-time code to the phone (Supabase Auth > Providers > Phone must be enabled). */
  async sendOtp(phone: string) {
    await call("/auth/v1/otp", { key: "anon", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
  },
  /** True when the code is right. Supabase also creates its own auth user, which we don't use. */
  async verifyOtp(phone: string, token: string) {
    try {
      await call("/auth/v1/verify", { key: "anon", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "sms", phone, token }) });
      return true;
    } catch (e) {
      if (e instanceof SupabaseError && e.status >= 400 && e.status < 500) return false;
      throw e;
    }
  },
};

export const supabaseStorage = {
  async upload(bucket: string, key: string, data: Buffer, contentType: string) {
    await call(`/storage/v1/object/${bucket}/${key}`, {
      key: "service",
      method: "POST",
      headers: { "Content-Type": contentType, "Cache-Control": "max-age=31536000", "x-upsert": "false" },
      body: new Uint8Array(data),
    });
  },
  async remove(bucket: string, keys: string[]) {
    if (!keys.length) return;
    await call(`/storage/v1/object/${bucket}`, {
      key: "service",
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: keys }),
    });
  },
};
