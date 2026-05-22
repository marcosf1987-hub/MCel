/**
 * Genera icon-192.png y icon-512.png desde public/icon.svg
 * Ejecutar: node scripts/generate-pwa-icons.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = join(root, "public", "icon.svg");

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Instalá sharp: npm install -D sharp");
    process.exit(1);
  }

  const svg = readFileSync(svgPath);
  for (const size of [192, 512]) {
    const out = join(root, "public", `icon-${size}.png`);
    await sharp(svg).resize(size, size).png().toFile(out);
    console.log("OK", out);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
