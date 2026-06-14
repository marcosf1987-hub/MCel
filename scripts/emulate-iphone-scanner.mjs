/**
 * Emula iPhone (viewport + UA) contra fixture local del scanner.
 * Limitación: NO es Safari iOS real; sirve para validar flujo y arranque con cámara falsa.
 *
 * Uso: node scripts/emulate-iphone-scanner.mjs
 */
import { chromium, webkit, devices } from "playwright";
import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServer } from "node:http";

const LOG = join(process.cwd(), "debug-8de89c.log");
const FIXTURE = join(process.cwd(), "scripts/scanner-ios-fixture.html");

function log(hypothesisId, message, data = {}) {
  const line = JSON.stringify({
    sessionId: "8de89c",
    runId: "emulated-iphone",
    hypothesisId,
    location: "scripts/emulate-iphone-scanner.mjs",
    message,
    data,
    timestamp: Date.now(),
  });
  appendFileSync(LOG, `${line}\n`);
  console.log(`[${hypothesisId}] ${message}`, JSON.stringify(data));
}

function startFixtureServer() {
  const html = readFileSync(FIXTURE, "utf8");
  return new Promise((resolve) => {
    const server = createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    });
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, url: `http://127.0.0.1:${port}/` });
    });
  });
}

async function runBrowser(name, browserType, deviceName, url) {
  const device = devices[deviceName];
  log("EMU", `starting ${name}`, { device: deviceName, url });

  const browser = await browserType.launch({
    headless: true,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  });

  const context = await browser.newContext({
    ...device,
    locale: "es-AR",
  });

  if (name.startsWith("chromium")) {
    await context.grantPermissions(["camera"], { origin: new URL(url).origin });
  }

  const page = await context.newPage();
  const consoleLogs = [];

  page.on("console", (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.getByRole("button", { name: /Escanear código/i }).click();
    await page.waitForTimeout(5000);

    const statusText = await page.locator("#status").innerText();
    const debugText = await page.locator("#debug").innerText();
    const videoCount = await page.locator("video").count();

    log("H1", "fixture status after 5s", {
      browser: name,
      statusText,
      hasActivating: /Activando/i.test(statusText),
      hasReady: /Apuntá/i.test(statusText),
      hasDecoded: /DECODED/i.test(statusText),
      hasError: /ERROR/i.test(statusText),
    });
    log("H2", "fixture dom", {
      browser: name,
      videoCount,
      debugTail: debugText.split("\n").slice(-12).join(" | "),
    });
    log("H3", "fixture console", {
      browser: name,
      lines: consoleLogs.slice(-12),
    });

    await page.screenshot({
      path: join(process.cwd(), `scanner-emulation-${name}.png`),
      fullPage: true,
    });
  } catch (err) {
    log("EMU", "run failed", {
      browser: name,
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    await browser.close();
  }
}

try {
  appendFileSync(LOG, "");
} catch {
  /* ignore */
}

const { server, url } = await startFixtureServer();
log("EMU", "fixture server ready", { url, fixture: pathToFileURL(FIXTURE).href });

try {
  await runBrowser("chromium-iphone14", chromium, "iPhone 14 Pro", url);
  await runBrowser("webkit-iphone14", webkit, "iPhone 14 Pro", url);
} finally {
  server.close();
}

console.log("\nListo. Ver debug-8de89c.log y scanner-emulation-*.png");
