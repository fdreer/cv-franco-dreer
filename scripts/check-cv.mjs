#!/usr/bin/env node
/**
 * check-cv.mjs — valida la forma de src/data/cv.json antes de publicar o de
 * generar el PDF. Sin framework: node:assert y listo.
 *
 * Uso: npm run check
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const cv = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", "cv.json"), "utf8"));

const str = (v, name) =>
  assert.ok(typeof v === "string" && v.trim() !== "", `${name}: falta o está vacío`);

for (const k of ["nombre", "eyebrow", "titulo", "ubicacion", "email", "idiomas", "perfil"]) {
  str(cv[k], k);
}
for (const k of ["linkedin", "github", "cv_pdf"]) {
  str(cv.links?.[k], `links.${k}`);
}

assert.ok(cv.experiencia?.length, "experiencia: vacía");
cv.experiencia.forEach((e, i) => {
  str(e.rol, `experiencia[${i}].rol`);
  str(e.empresa, `experiencia[${i}].empresa`);
  str(e.periodo, `experiencia[${i}].periodo`);
  assert.ok(e.bullets?.length, `experiencia[${i}].bullets: vacío`);
  e.bullets.forEach((b, j) => str(b, `experiencia[${i}].bullets[${j}]`));
});

for (const seccion of ["formacion", "cursos"]) {
  assert.ok(cv[seccion]?.length, `${seccion}: vacío`);
  cv[seccion].forEach((f, i) => {
    str(f.titulo, `${seccion}[${i}].titulo`);
    str(f.institucion, `${seccion}[${i}].institucion`);
    str(f.periodo, `${seccion}[${i}].periodo`);
  });
}

// Insignia.astro las resuelve con import.meta.glob: si el path no existe, rompe el build.
const insignias = cv.cursos.flatMap((c) => c.insignias ?? []);
insignias.forEach((ins, i) => {
  str(ins.titulo, `insignia[${i}].titulo`);
  str(ins.href, `insignia[${i}].href`);
  assert.ok(fs.existsSync(path.join(ROOT, ins.src)), `insignia[${i}].src no existe: ${ins.src}`);
});

assert.ok(cv.competencias?.length, "competencias: vacío");
cv.competencias.forEach((c, i) => str(c, `competencias[${i}]`));

// Los logos de empresas/instituciones viven en el logoMap de cada sección
// .astro, indexado por el string exacto de empresa/institucion de cv.json.
// Si no coincide, el logo cae en silencio al fallback (una letra en un
// cuadrito) — nada rompe, así que esto es un warning, no un error: hay
// entradas (ej. AprenderAnalytics.com) sin logo a propósito.
function logoMapKeys(relPath) {
  const src = fs.readFileSync(path.join(ROOT, relPath), "utf8");
  const match = src.match(/logoMap[^=]*=\s*{([^}]*)}/);
  if (!match) return new Set();
  return new Set([...match[1].matchAll(/['"]([^'"]+)['"]\s*:/g)].map((m) => m[1]));
}

function warnMissingLogos(entries, field, relPath) {
  const keys = logoMapKeys(relPath);
  const missing = [...new Set(entries.map((e) => e[field]))].filter((v) => !keys.has(v));
  if (missing.length) {
    console.warn(
      `aviso: sin logo en ${relPath} para ${missing.map((v) => `"${v}"`).join(", ")}`
    );
  }
}

warnMissingLogos(cv.experiencia, "empresa", path.join("src", "sections", "Experience.astro"));
warnMissingLogos(cv.formacion, "institucion", path.join("src", "sections", "Formation.astro"));
warnMissingLogos(cv.cursos, "institucion", path.join("src", "sections", "Courses.astro"));

console.log(
  `cv.json OK — ${cv.experiencia.length} experiencias, ${cv.formacion.length} formaciones, ` +
    `${cv.cursos.length} cursos (${insignias.length} insignias), ${cv.competencias.length} competencias`
);
