// Digital Asset Links: proves to Android that the Google Play app and this website belong
// together, so the app opens the site full screen without a browser address bar.
// Served at /.well-known/assetlinks.json (see next.config.ts).
// Set ANDROID_PACKAGE_NAME and ANDROID_CERT_SHA256 (from Play Console > App integrity >
// App signing; comma-separated if there's more than one, e.g. upload key and Play's key).
export function GET() {
  const pkg = process.env.ANDROID_PACKAGE_NAME || "ae.rekit.app";
  const prints = (process.env.ANDROID_CERT_SHA256 || "").split(",").map((s) => s.trim().toUpperCase()).filter((s) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(s));
  const body = prints.length
    ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: pkg, sha256_cert_fingerprints: prints } }]
    : [];
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
