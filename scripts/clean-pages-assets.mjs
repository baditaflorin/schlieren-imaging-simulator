import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "docs");

const generatedEntries = [
  "404.html",
  "assets",
  "favicon.svg",
  "icons.svg",
  "index.html",
  "manifest.webmanifest",
  "registerSW.js",
  "sw.js",
  "sw.js.map",
];

for (const entry of generatedEntries) {
  const target = join(outDir, entry);
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
  }
}

if (existsSync(outDir)) {
  for (const entry of readdirSync(outDir)) {
    if (entry.startsWith("workbox-")) {
      rmSync(join(outDir, entry), { recursive: true, force: true });
    }
  }
}
