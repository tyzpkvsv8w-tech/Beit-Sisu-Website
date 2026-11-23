import type { CapacitorConfig } from "@capacitor/cli";

// The iPhone app shows the live site (server.url) inside a native shell, and adds what a website
// can't do on iPhone: Apple push notifications and the native share sheet.
// Change "rekit.ae" everywhere below if your domain is different.
const config: CapacitorConfig = {
  appId: "ae.rekit.app",
  appName: "ReKit",
  webDir: "www", // only used if the site can't be reached at all (offline page)
  server: {
    url: "https://rekit.ae",
    // Pages on these hosts open inside the app; any other link opens in Safari.
    allowNavigation: ["rekit.ae", "www.rekit.ae"],
    errorPath: "offline.html",
  },
  // Lets the site recognise the app (to hide the install tip and keep ad payments website-only).
  appendUserAgent: "ReKitApp-iOS/1.0",
  ios: {
    contentInset: "never",
    backgroundColor: "#0f1a2b",
    scheme: "ReKit",
  },
  plugins: {
    PushNotifications: { presentationOptions: ["badge", "sound", "alert"] },
    SplashScreen: { launchShowDuration: 600, backgroundColor: "#0f1a2b", showSpinner: false },
  },
};

export default config;
