import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "docs");
const indexPath = join(outDir, "index.html");
const fallbackPath = join(outDir, "404.html");

if (!existsSync(indexPath)) {
  throw new Error("Expected docs/index.html after Vite build.");
}

copyFileSync(indexPath, fallbackPath);
