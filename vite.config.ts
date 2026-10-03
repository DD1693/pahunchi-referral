// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";
import { resolve } from "node:path";

/**
 * Generates /sw.js (Workbox generateSW, same engine as vite-plugin-pwa) after the
 * CLIENT environment build. vite-plugin-pwa skips SW generation under TanStack
 * Start's multi-environment build, so we call workbox-build directly.
 */
function pahunchiServiceWorker(): Plugin {
  let done = false;
  return {
    name: "pahunchi-generate-sw",
    apply: "build",
    closeBundle: {
      sequential: true,
      order: "post",
      async handler() {
        const env = this.environment;
        if (done || !env || env.name !== "client") return;
        done = true;
        const outDir = resolve(env.config.root, env.config.build.outDir);
        const { generateSW } = await import("workbox-build");
        const result = await generateSW({
          globDirectory: outDir,
          globPatterns: ["**/*.{js,css,ico,png,svg,webmanifest,woff2}"],
          globIgnores: ["sw.js", "workbox-*.js"],
          // public/ files may be copied after this hook runs, so list them explicitly.
          additionalManifestEntries: [
            "/manifest.webmanifest",
            "/favicon.ico",
            "/icon-192.png",
            "/icon-512.png",
            "/apple-touch-icon.png",
          ].map((url) => ({ url, revision: String(Date.now()) })),
          swDest: resolve(outDir, "sw.js"),
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          clientsClaim: true,
          skipWaiting: true,
          cleanupOutdatedCaches: true,
          inlineWorkboxRuntime: true,
          mode: "production",
          runtimeCaching: [
            {
              urlPattern: ({ request, url }) =>
                request.mode === "navigate" && !url.pathname.startsWith("/~oauth"),
              handler: "NetworkFirst",
              options: {
                cacheName: "pahunchi-pages",
                networkTimeoutSeconds: 4,
                matchOptions: { ignoreSearch: true },
                plugins: [
                  {
                    handlerDidError: async () =>
                      (await caches.match("/", { cacheName: "pahunchi-pages" })) ||
                      Response.error(),
                  },
                ],
              },
            },
          ],
        });
        console.log(`[pahunchi-sw] precached ${result.count} files`);
      },
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [pahunchiServiceWorker()],
  },
});
