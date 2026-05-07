import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as {
  version: string;
};

function git(command: string, fallback: string) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return fallback;
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: "/schlieren-imaging-simulator/",
  build: {
    outDir: "docs",
    emptyOutDir: false,
    sourcemap: false,
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_COMMIT__: JSON.stringify(git("git rev-parse --short HEAD", "dev")),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __REPO_URL__: JSON.stringify(
      "https://github.com/baditaflorin/schlieren-imaging-simulator",
    ),
    __PAYPAL_URL__: JSON.stringify(
      "https://www.paypal.com/paypalme/florinbadita",
    ),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Schlieren Imaging Simulator",
        short_name: "Schlieren",
        description:
          "Visualize heat, sound, and gas density gradients in the browser with WebGPU and Three.js.",
        theme_color: "#0c1116",
        background_color: "#0c1116",
        display: "standalone",
        start_url: "/schlieren-imaging-simulator/",
        scope: "/schlieren-imaging-simulator/",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/schlieren-imaging-simulator/index.html",
        globPatterns: ["**/*.{js,css,html,svg,png,wasm,json}"],
      },
    }),
  ],
});
