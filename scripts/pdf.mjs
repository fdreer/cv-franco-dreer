#!/usr/bin/env node
/**
 * pdf.mjs — Levanta `astro dev`, imprime /cv-print con Puppeteer y escribe
 * public/cv.pdf. Los márgenes los pone el @page de src/pages/cv-print.astro.
 *
 * Uso: npm run pdf
 * Output: public/cv.pdf  (se commitea — Cloudflare nunca corre Puppeteer)
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { spawn } from "node:child_process";
import puppeteer from "puppeteer";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const ASTRO = path.join(ROOT, "node_modules", "astro", "astro.js");
const OUT = path.join(ROOT, "public", "cv.pdf");
const PORT = Number(process.env.PORT) || 4321;
const TARGET = `http://localhost:${PORT}/cv-print`;

async function waitForServer(target, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(target)).ok) return;
    } catch {
      // el server todavía no levantó; reintentar
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`el dev server no respondió en ${target} tras ${timeoutMs / 1000}s`);
}

const dev = spawn(process.execPath, [ASTRO, "dev", "--port", String(PORT)], {
  cwd: ROOT,
  stdio: ["ignore", "ignore", "inherit"],
});

let browser;
try {
  await waitForServer(TARGET);
  browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.goto(TARGET, { waitUntil: "networkidle0" });
  await page.evaluateHandle("document.fonts.ready");
  await page.pdf({
    path: OUT,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
  });
  const sizeKb = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log(`built public/cv.pdf (${sizeKb}kb)`);
} finally {
  await browser?.close();
  dev.kill();
}

process.exit(0);
