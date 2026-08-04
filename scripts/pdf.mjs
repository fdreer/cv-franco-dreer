#!/usr/bin/env node
/**
 * pdf.mjs — Levanta `astro dev`, imprime /cv-print con Puppeteer y escribe
 * public/cv.pdf. Los márgenes los pone el @page de src/pages/cv-print.astro.
 *
 * Uso: npm run pdf
 * Output: public/cv.pdf  (se commitea — Cloudflare nunca corre Puppeteer)
 */
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import url from "node:url";
import { spawn } from "node:child_process";
import puppeteer from "puppeteer";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const ASTRO = path.join(ROOT, "node_modules", "astro", "astro.js");
const OUT = path.join(ROOT, "public", "cv.pdf");
const PORT = Number(process.env.PORT) || 4321;
const TARGET = `http://localhost:${PORT}/cv-print`;

// Verifica que el puerto esté libre intentando bindearlo nosotros mismos.
// Sin esto, si ya hay algo escuchando ahí (p.ej. un `npm run dev` en otra
// terminal), waitForServer se conforma con que ESE server responda .ok y
// terminamos pisando public/cv.pdf con contenido ajeno, sin ningún error.
function ensurePortFree(port) {
  return new Promise((resolve, reject) => {
    const tester = net.createServer();
    tester.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        reject(new Error(
          `el puerto ${port} está ocupado — cerrá el \`npm run dev\` que tengas abierto, o corré \`PORT=4322 npm run pdf\``
        ));
      } else {
        reject(err);
      }
    });
    tester.once("listening", () => {
      tester.close(resolve);
    });
    tester.listen(port);
  });
}

async function waitForServer(target, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    let res;
    try {
      res = await fetch(target);
    } catch {
      // el server todavía no levantó (error de red); reintentar
      await new Promise((r) => setTimeout(r, 300));
      continue;
    }
    if (res.ok) return;
    // El server ya respondió, pero con error: no es un problema de arranque
    // (seguir reintentando 60s solo escondería el status real).
    throw new Error(`el dev server respondió ${res.status} ${res.statusText} en ${target}`);
  }
  throw new Error(`el dev server no respondió en ${target} tras ${timeoutMs / 1000}s`);
}

try {
  await ensurePortFree(PORT);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

let dev;
let browser;

// Si nos matan por señal (Ctrl+C, kill), el `finally` de abajo no llega a
// correr: el `astro dev` hijo (y el Chromium de Puppeteer) quedarían vivos
// reteniendo el puerto, disparando justo el escenario que ensurePortFree
// intenta evitar en la próxima corrida.
function onSignal(signal) {
  return async () => {
    console.error(`\nseñal ${signal} recibida, terminando...`);
    try {
      await browser?.close();
    } catch {
      // no importa si ya estaba cerrado
    }
    dev?.kill();
    process.exit(1);
  };
}
process.on("SIGINT", onSignal("SIGINT"));
process.on("SIGTERM", onSignal("SIGTERM"));

dev = spawn(process.execPath, [ASTRO, "dev", "--port", String(PORT)], {
  cwd: ROOT,
  stdio: ["ignore", "ignore", "inherit"],
});

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
