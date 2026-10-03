// The ONLY service-worker registrar. Refuses in dev, iframes and Lovable preview hosts.
const SW_URL = "/sw.js";
const PAGES_CACHE = "pahunchi-pages";
const APP_PATHS = ["/", "/referrals", "/new", "/insights", "/referral", "/arrival", "/print", "/basic-phone", "/sync"];

function refused(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const h = window.location.hostname;
  if (h.startsWith("id-preview--") || h.startsWith("preview--")) return true;
  const blocked = ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"];
  if (blocked.some((b) => h === b || h.endsWith("." + b))) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterAppSW() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => [r.active, r.waiting, r.installing].some((w) => w?.scriptURL.endsWith(SW_URL)))
      .map((r) => r.unregister()),
  );
}

/** Store the app's page shells so a refresh works with no internet. */
async function warmPages() {
  if (!navigator.onLine || !("caches" in window)) return;
  const cache = await caches.open(PAGES_CACHE);
  await Promise.allSettled(
    APP_PATHS.map(async (p) => {
      const res = await fetch(p, { credentials: "same-origin", cache: "no-store" });
      if (res.ok) await cache.put(p, res);
    }),
  );
}

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (refused()) {
    await unregisterAppSW().catch(() => {});
    return;
  }
  try {
    await navigator.serviceWorker.register(SW_URL, { scope: "/" });
    await navigator.serviceWorker.ready;
    await warmPages();
    window.addEventListener("online", () => void warmPages());
  } catch (e) {
    console.warn("Service worker registration failed", e);
  }
}
