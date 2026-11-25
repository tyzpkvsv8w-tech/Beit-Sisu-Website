// Apple universal links: rekit.ae links open in the iPhone app when it's installed.
// Served at /.well-known/apple-app-site-association (see next.config.ts).
// Set APPLE_TEAM_ID (developer.apple.com > Membership) and IOS_BUNDLE_ID.
export function GET() {
  const team = process.env.APPLE_TEAM_ID;
  const bundle = process.env.IOS_BUNDLE_ID || "ae.rekit.app";
  const appIDs = team && /^[A-Z0-9]{10}$/.test(team) ? [`${team}.${bundle}`] : [];
  return Response.json({
    applinks: {
      details: appIDs.length ? [{
        appIDs,
        components: [
          { "/": "/go/*", exclude: true, comment: "Ad clicks go to the advertiser's site" },
          { "/": "/api/*", exclude: true },
          { "/": "/*" },
        ],
      }] : [],
    },
  }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
