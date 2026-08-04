# Unificación CV — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que `cv-franco-dreer` sea el único proyecto del CV: un solo `src/data/cv.json` alimenta la web y una página `/cv-print` que Puppeteer convierte en `public/cv.pdf`, con el lenguaje visual de `generador-cv` aplicado a todo.

**Architecture:** Un JSON en `src/data/` importado en build por las secciones Astro y por una página standalone `/cv-print` que replica el layout A4 de `generador-cv/src/template.html`. Un script Node levanta `astro dev`, imprime esa ruta con Puppeteer y escribe el PDF en `public/`, que se commitea — Cloudflare nunca ejecuta Puppeteer. La paleta del CV se aplica vía los tokens de `Layout.astro`, conservando los nombres de variables existentes para que el diff en las secciones sea mínimo.

**Tech Stack:** Astro 4 (SSR, adapter Cloudflare), Cloudflare KV, Puppeteer 23, Node 20+, `node:assert` para el único check.

## Global Constraints

- Proyecto destino: `C:\Users\franc\DEV\cv-franco-dreer`. **No se toca nada fuera de este directorio** — `C:\Users\franc\DEV\generador-cv` queda intacta.
- Spec de referencia: `docs/superpowers/specs/2026-08-04-unificacion-cv-design.md`.
- Fuente única: `src/data/cv.json`. Claves **en español**. Ningún otro archivo puede contener texto del CV hardcodeado.
- Ante conflicto de contenido entre `generador-cv/data/cv_data.yaml` y `public/data/*.json`: **gana el YAML**.
- Paleta obligatoria (de `generador-cv/src/template.html`): fondo hoja `#fafaf8`, fondo página `#e9e6e0`, tinta `#0d1117`, tinta suave `#3a4049`, cuerpo `#2a3038`, muted `#8a909a`, regla `#e0e0dd`, regla suave `#ececea`, acento `#1f5d4c`, acento suave `#3a7a68`.
- Tipografías: `Geist` (sans) y `Geist Mono` (mono), desde Google Fonts.
- Formato del PDF: A4, márgenes `14mm`, `printBackground: true`, `preferCSSPageSize: true`.
- No se toca: `src/pages/api/likes.ts`, `src/pages/api/views.ts`, el binding `LIKES_KV`, `astro.config.mjs`, `wrangler`.
- No se borra código muerto preexistente salvo donde el plan lo indique explícitamente: `src/sections/AboutMe.astro`, `src/sections/Likes.astro` y la entrada `'Nexo Consultora'` del `logoMap` quedan como están.
- El proyecto **no tiene framework de tests** y no se agrega ninguno. La verificación es: `npm run check` (asserts sobre los datos), `npm run build` (compila) e inspección visual en `npm run dev`.
- Indentación: 4 espacios en `.astro` / `.ts` (como el resto del repo), 2 espacios en `scripts/*.mjs` (como en `generador-cv`).

## Preflight (una sola vez, antes de la Task 1)

`public/cv.pdf` está modificado sin commitear y la **Task 3 lo va a pisar**. Y el trabajo va sobre `master`.

```bash
git add public/cv.pdf && git commit -m "chore: pdf del cv actual antes de unificar"
```

```bash
git checkout -b unificacion-cv
```

Si Franco prefiere trabajar directo sobre `master`, saltear el segundo comando.

---

## Estructura de archivos

**Se crean**

| Archivo | Responsabilidad |
|---|---|
| `src/data/cv.json` | Fuente única de todo el contenido del CV |
| `scripts/check-cv.mjs` | Valida la forma de `cv.json` (único check del repo) |
| `scripts/pdf.mjs` | `astro dev` + Puppeteer → `public/cv.pdf` |
| `src/pages/cv-print.astro` | Layout A4 del CV, standalone (no usa `Layout.astro`) |
| `src/sections/Skills.astro` | Chips de competencias en la web |

**Se modifican**

| Archivo | Cambio |
|---|---|
| `package.json` | scripts `check` y `pdf`, devDependency `puppeteer` |
| `src/types.d.ts` | tipos del schema nuevo; se quitan `Course` y `Formation` |
| `src/layouts/Layout.astro` | tokens de color/tipografía, Geist, fondo papel |
| `src/components/ui/Container.astro` | de cards con sombra a papel continuo |
| `src/sections/GeneralInfo.astro` | datos desde `cv.json`, suma Idiomas |
| `src/sections/ProfessionalProfile.astro` | perfil desde `cv.json` |
| `src/sections/Experience.astro` | `cv.json`, claves `rol`/`empresa`/`periodo` |
| `src/sections/Formation.astro` | `cv.json`, claves `titulo`/`institucion`/`periodo` |
| `src/sections/Courses.astro` | `cv.json`, claves nuevas + `insignias` |
| `src/pages/index.astro` | suma `<Skills />` |
| `src/data.ts` | queda solo `URL_PRODUCTION` |
| `CLAUDE.md` | estructura y comandos reales (**está en `.gitignore`: no se commitea**) |
| `README.md` | se crea si no existe |

**Se borran**

`public/data/my-experience.json`, `public/data/my-formation.json`, `public/data/my-courses.json`, `public/data/about-me.json` (Task 8, previa confirmación de Franco sobre este último).

---

### Task 1: Fuente única `cv.json` + su check

**Files:**
- Create: `src/data/cv.json`
- Create: `scripts/check-cv.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: el objeto `cv` con las claves `nombre`, `eyebrow`, `titulo`, `ubicacion`, `email`, `idiomas`, `links{linkedin,github,cv_pdf}`, `perfil`, `experiencia[{rol,empresa,periodo,bullets[]}]`, `formacion[{titulo,institucion,periodo}]`, `cursos[{titulo,institucion,periodo,insignias?[{titulo,src,href}]}]`, `competencias[]`. Todas las tasks siguientes consumen exactamente estos nombres.
- Produces: el comando `npm run check`.

- [ ] **Step 1: Instalar dependencias del proyecto**

El repo no tiene `node_modules`.

Run: `npm install`
Expected: termina sin errores y `ls node_modules/astro/astro.js` existe (ese path lo usa `scripts/pdf.mjs` en la Task 3). Si `node_modules/astro/astro.js` **no** existiera, anotarlo y resolver el binario real con `node -e "console.log(require.resolve('astro/package.json'))"` antes de la Task 3.

- [ ] **Step 2: Crear `src/data/cv.json`**

Contenido consolidado: el YAML de `generador-cv` gana en todo conflicto; las insignias vienen de `public/data/my-courses.json` y se enganchan al curso "Tango Gestión"; los links vienen de `src/data.ts`.

```json
{
    "nombre": "Franco Dreer",
    "eyebrow": "Currículum",
    "titulo": "Analista de Negocio y Operaciones · Contador Público | Datos y Automatización",
    "ubicacion": "Salta, Argentina",
    "email": "francodreer@gmail.com",
    "idiomas": "ES – EN B1",
    "links": {
        "linkedin": "https://www.linkedin.com/in/francodreer",
        "github": "https://github.com/fdreer",
        "cv_pdf": "/cv.pdf"
    },
    "perfil": "Analista de negocio y operaciones, Contador Público. Uso IA para automatizar el trabajo manual, desarrollo herramientas que integran sistemas y reemplazan tareas repetitivas. Monitoreo costos, avance y performance del negocio en dashboards, detecto desvíos y sobrecostos, y traduzco los datos en recomendaciones concretas para la dirección.",
    "experiencia": [
        {
            "rol": "Responsable de Administración y Transformación Digital",
            "empresa": "BIMEG Constructora S.R.L.",
            "periodo": "Dic 2025 – Presente",
            "bullets": [
                "Rediseño y automatización de procesos con IA, mediante integraciones y desarrollos propios.",
                "Gestión de procesos operativos y administrativos.",
                "Elaboración de reportes financieros automatizados y análisis de datos para la dirección.",
                "Contabilidad general y liquidación de impuestos de la empresa.",
                "Parametrización y administración del ERP, y capacitación a los usuarios finales."
            ]
        },
        {
            "rol": "Contador Público y Consultor funcional ERP – Tango Gestión",
            "empresa": "Gallo & Dreer Contadores",
            "periodo": "Ago 2024 – Nov 2025",
            "bullets": [
                "Implementación y parametrización de Tango Gestión y capacitación a los usuarios finales.",
                "Automatización de tareas administrativas mediante desarrollos a medida e integraciones.",
                "Asesoramiento a clientes en el aprovechamiento de su información para la gestión.",
                "Contabilidad y liquidación impositiva de una cartera de clientes."
            ]
        },
        {
            "rol": "Auxiliar Contable (pasantía)",
            "empresa": "Santiago Saenz S.A.",
            "periodo": "2023 – 2024",
            "bullets": [
                "Conciliaciones de cuentas y soporte operativo al área de administración y finanzas.",
                "Registración y control de comprobantes de facturación."
            ]
        }
    ],
    "formacion": [
        {
            "titulo": "Licenciatura en Administración de Empresas",
            "institucion": "Universidad Católica de Salta",
            "periodo": "Mar 2026 – Presente"
        },
        {
            "titulo": "Contador Público",
            "institucion": "Universidad Católica de Salta",
            "periodo": "Feb 2018 – Jun 2024"
        },
        {
            "titulo": "Certified Tech Developer",
            "institucion": "Digital House",
            "periodo": "Feb 2022 – Sep 2023"
        }
    ],
    "cursos": [
        {
            "titulo": "Tango Gestión",
            "institucion": "Tango University",
            "periodo": "Feb 2024 – Jul 2024",
            "insignias": [
                {
                    "titulo": "Tango Inicial",
                    "src": "/src/assets/tango_insignia/Tango_Inicial.png",
                    "href": "https://tangouniversity.axoft.com/badges/badge.php?hash=91f2483e21d45c1266176d2b6e4d6cdb7be62ccd"
                },
                {
                    "titulo": "Tango Operador",
                    "src": "/src/assets/tango_insignia/Tango_Operador.png",
                    "href": "https://tangouniversity.axoft.com/badges/badge.php?hash=ba016d1c04842cbf2824e311e8e500d72b38b906"
                },
                {
                    "titulo": "Tango Operador Avanzado",
                    "src": "/src/assets/tango_insignia/Tango_Operador_Avanzado.png",
                    "href": "https://tangouniversity.axoft.com/badges/badge.php?hash=32fa5ea47c72f72500dedb8b58372ebcde4d69bb"
                },
                {
                    "titulo": "Tango Operador Contable",
                    "src": "/src/assets/tango_insignia/Tango_Operador_Contable.png",
                    "href": "https://tangouniversity.axoft.com/badges/badge.php?hash=1a51c394a8806d92e53ccaadfe149ba746cfb8a9"
                },
                {
                    "titulo": "Técnico Tango",
                    "src": "/src/assets/tango_insignia/Tecnico_Tango.png",
                    "href": "https://tangouniversity.axoft.com/badges/badge.php?hash=4cc1da77160afe161f53a59bde97901edae4ce1e"
                },
                {
                    "titulo": "Técnico Tango Avanzado",
                    "src": "/src/assets/tango_insignia/Tecnico_Tango_Avanzado.png",
                    "href": "https://tangouniversity.axoft.com/badges/badge.php?hash=437873f6d91c1bd7a10d0c986a97d0ea87b4cfe3"
                },
                {
                    "titulo": "Tango Consultor",
                    "src": "/src/assets/tango_insignia/Tango_Consultor.png",
                    "href": "https://tangouniversity.axoft.com/badges/badge.php?hash=ace64ba2d78ed1014e6c78ddcd278085e6f40d90"
                }
            ]
        },
        {
            "titulo": "Curso de Inglés B1",
            "institucion": "Universidad Católica de Salta",
            "periodo": "Feb 2020 – Dic 2020"
        },
        {
            "titulo": "Business Analytics",
            "institucion": "AprenderAnalytics.com",
            "periodo": "Feb 2025 – Mayo 2025"
        }
    ],
    "competencias": [
        "Power BI",
        "SQL",
        "Excel",
        "Odoo",
        "Tango Gestión",
        "Automatización con IA",
        "Implementación de ERP",
        "Análisis de datos"
    ]
}
```

- [ ] **Step 3: Escribir el check**

Crear `scripts/check-cv.mjs`. Sin framework: `node:assert`. Además de la forma, verifica que cada `insignias[].src` exista en disco, porque `Insignia.astro` tira un error de build si la ruta no matchea su `import.meta.glob`.

```js
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

console.log(
  `cv.json OK — ${cv.experiencia.length} experiencias, ${cv.formacion.length} formaciones, ` +
    `${cv.cursos.length} cursos (${insignias.length} insignias), ${cv.competencias.length} competencias`
);
```

- [ ] **Step 4: Registrar el script en `package.json`**

En el bloque `"scripts"`, después de `"astro": "astro"`, agregar:

```json
        "check": "node scripts/check-cv.mjs"
```

(acordarse de la coma en la línea anterior)

- [ ] **Step 5: Correr el check y verificar que pasa**

Run: `npm run check`
Expected: `cv.json OK — 3 experiencias, 3 formaciones, 3 cursos (7 insignias), 8 competencias`

- [ ] **Step 6: Verificar que el check realmente detecta un error**

Un check que nunca falla no sirve. Romperlo a propósito y confirmar que grita.

Run: en `src/data/cv.json`, cambiar temporalmente `"periodo": "2023 – 2024"` (Santiago Saenz) por `"periodo": ""` y correr `npm run check`
Expected: falla con `AssertionError [ERR_ASSERTION]: experiencia[2].periodo: falta o está vacío`

Después **deshacer el cambio** y volver a correr `npm run check` → tiene que volver a dar OK.

- [ ] **Step 7: Commit**

```bash
git add src/data/cv.json scripts/check-cv.mjs package.json package-lock.json
git commit -m "feat: fuente unica de datos del cv en src/data/cv.json"
```

---

### Task 2: Tipos + página de impresión `/cv-print`

**Files:**
- Modify: `src/types.d.ts` (se **agregan** tipos; `Course` y `Formation` se dejan por ahora — todavía los usan `Courses.astro` y `Formation.astro`)
- Create: `src/pages/cv-print.astro`

**Interfaces:**
- Consumes: `src/data/cv.json` de la Task 1.
- Produces: los tipos globales `CvExperiencia`, `CvFormacion`, `CvInsignia`, `CvCurso`, `CvData`. Las tasks 5–7 los usan para tipar sus `.map()`.
- Produces: la ruta `/cv-print`, que la Task 3 imprime.

- [ ] **Step 1: Agregar los tipos del schema nuevo**

Al final de `src/types.d.ts`, dejando `Course` y `Formation` intactos:

```ts
type CvExperiencia = {
    rol: string
    empresa: string
    periodo: string
    bullets: string[]
}

type CvFormacion = {
    titulo: string
    institucion: string
    periodo: string
}

type CvInsignia = {
    titulo: string
    src: string
    href: string
}

type CvCurso = CvFormacion & {
    insignias?: CvInsignia[]
}

type CvData = {
    nombre: string
    eyebrow: string
    titulo: string
    ubicacion: string
    email: string
    idiomas: string
    links: { linkedin: string; github: string; cv_pdf: string }
    perfil: string
    experiencia: CvExperiencia[]
    formacion: CvFormacion[]
    cursos: CvCurso[]
    competencias: string[]
}
```

- [ ] **Step 2: Crear `src/pages/cv-print.astro`**

Es el port de `generador-cv/src/template.html`: mismo CSS, pero renderizado en el servidor en vez de por JS en el cliente. Página **standalone** — no usa `Layout.astro`, así los estilos del sitio no la contaminan. El CSS va `is:global` para que las reglas queden byte a byte iguales al original.

La foto se sirve con `<img src={foto.src}>` (no `<Image>`): evita el endpoint `/_image` de Astro en medio del render de Puppeteer.

```astro
---
import cvData from '@/data/cv.json'
import foto from '@/assets/img/foto.jpeg'

const cv = cvData as CvData
---

<!doctype html>
<html lang="es">
    <head>
        <meta charset="utf-8" />
        <title>CV — {cv.nombre}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
            href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap"
            rel="stylesheet"
        />
    </head>
    <body>
        <article class="cv">
            <header class="header">
                <div>
                    <div class="eyebrow">{cv.eyebrow}</div>
                    <h1>{cv.nombre}</h1>
                    <div class="role">{cv.titulo}</div>
                </div>
                <div class="photo">
                    <img src={foto.src} alt={cv.nombre} />
                </div>
            </header>
            <div class="rule-double"></div>

            <div class="meta">
                <div><span class="key">LOC</span>{cv.ubicacion}</div>
                <div><span class="key">MAIL</span>{cv.email}</div>
                <div class="right"><span class="key">Idiomas</span>{cv.idiomas}</div>
            </div>

            <section class="section">
                <div class="row">
                    <div class="section-label">Perfil</div>
                    <div><p class="perfil">{cv.perfil}</p></div>
                </div>
            </section>

            <section class="section">
                <div class="row">
                    <div class="section-label">Experiencia</div>
                    <div>
                        {
                            cv.experiencia.map(e => (
                                <div class="exp-item">
                                    <div class="exp-head">
                                        <div class="exp-rol">{e.rol}</div>
                                        <div class="exp-periodo">{e.periodo}</div>
                                    </div>
                                    <div class="exp-empresa">{e.empresa}</div>
                                    <ul class="exp-bullets">
                                        {e.bullets.map(b => <li>{b}</li>)}
                                    </ul>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </section>

            <section class="section">
                <div class="row">
                    <div class="section-label">Formación</div>
                    <div>
                        <div class="form-grid">
                            <div class="form-col">
                                {
                                    cv.formacion.map(f => (
                                        <div class="form-item">
                                            <div class="titulo">{f.titulo}</div>
                                            <div class="institucion">{f.institucion}</div>
                                            <div class="periodo">{f.periodo}</div>
                                        </div>
                                    ))
                                }
                            </div>
                            <div>
                                <div class="section-label cursos-label">Cursos</div>
                                <div class="form-col">
                                    {
                                        cv.cursos.map(c => (
                                            <div class="form-item">
                                                <div class="titulo">{c.titulo}</div>
                                                <div class="institucion">{c.institucion}</div>
                                                <div class="periodo">{c.periodo}</div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="section">
                <div class="row">
                    <div class="section-label">Competencias</div>
                    <div>
                        <div class="chips">
                            {cv.competencias.map(c => <span class="chip">{c}</span>)}
                        </div>
                    </div>
                </div>
            </section>
        </article>

        <style is:global>
            :root {
                --bg: #fafaf8;
                --ink: #0d1117;
                --ink-soft: #3a4049;
                --body: #2a3038;
                --muted: #8a909a;
                --rule: #e0e0dd;
                --rule-soft: #ececea;
                --accent: #1f5d4c;
                --accent-soft: #3a7a68;
                --font-sans: 'Geist', 'Helvetica Neue', sans-serif;
                --font-mono: 'Geist Mono', ui-monospace, monospace;

                --page-w: 794px;
                --page-pad-x: 56px;
                --page-pad-top: 52px;
                --page-pad-bottom: 44px;
            }
            *,
            *::before,
            *::after {
                box-sizing: border-box;
            }
            html,
            body {
                margin: 0;
                padding: 0;
            }
            body {
                background: #e9e6e0;
                min-height: 100vh;
                font-family: var(--font-sans);
                color: var(--ink);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 28px;
                padding: 40px 20px;
            }

            .cv {
                width: var(--page-w);
                min-height: 1123px;
                background: var(--bg);
                padding: var(--page-pad-top) var(--page-pad-x) var(--page-pad-bottom);
                box-shadow:
                    0 2px 24px rgba(0, 0, 0, 0.06),
                    0 0 0 1px rgba(0, 0, 0, 0.04);
            }

            /* ─── Header ───────────────────────────────────────────── */
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                gap: 24px;
                padding-bottom: 20px;
            }
            .eyebrow {
                font-family: var(--font-mono);
                font-size: 10px;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                color: var(--accent);
                font-weight: 600;
            }
            .header h1 {
                margin: 12px 0 8px;
                font-weight: 700;
                font-size: 48px;
                letter-spacing: -0.03em;
                line-height: 0.98;
                color: var(--ink);
            }
            .header .role {
                font-size: 15px;
                color: var(--ink-soft);
                font-weight: 500;
                letter-spacing: -0.005em;
            }
            .header .photo {
                width: 96px;
                height: 96px;
                border-radius: 50%;
                overflow: hidden;
                flex-shrink: 0;
                box-shadow: 0 0 0 1px var(--rule);
            }
            .header .photo img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }

            .rule-double {
                display: flex;
                flex-direction: column;
                gap: 3px;
                margin-bottom: 18px;
            }
            .rule-double::before {
                content: '';
                height: 1px;
                background: var(--ink);
            }
            .rule-double::after {
                content: '';
                height: 1px;
                background: var(--rule);
            }

            /* ─── Meta row ─────────────────────────────────────────── */
            .meta {
                display: flex;
                gap: 28px;
                flex-wrap: wrap;
                padding-bottom: 22px;
                margin-bottom: 28px;
                font-family: var(--font-mono);
                font-size: 10.5px;
                color: var(--ink-soft);
                border-bottom: 1px solid var(--rule-soft);
            }
            .meta .key {
                color: var(--muted);
                margin-right: 8px;
                font-weight: 600;
            }
            .meta .right {
                margin-left: auto;
            }

            /* ─── Section (label | content) ───────────────────────── */
            .section {
                margin-bottom: 28px;
            }
            .section:last-child {
                margin-bottom: 0;
            }
            .section .row {
                display: grid;
                grid-template-columns: 120px 1fr;
                gap: 22px;
                align-items: start;
            }
            .section-label {
                font-family: var(--font-mono);
                font-size: 11px;
                letter-spacing: 0.16em;
                text-transform: uppercase;
                color: var(--ink);
                font-weight: 700;
                padding-top: 6px;
            }

            .perfil {
                margin: 0;
                font-size: 13px;
                line-height: 1.6;
                color: var(--body);
                max-width: 580px;
                text-wrap: pretty;
                font-weight: 400;
            }

            /* ─── Experiencia ─────────────────────────────────────── */
            .exp-item {
                padding-bottom: 16px;
                margin-bottom: 16px;
                border-bottom: 1px solid var(--rule-soft);
                break-inside: avoid;
            }
            .exp-item:last-child {
                padding-bottom: 0;
                margin-bottom: 0;
                border-bottom: none;
            }
            .exp-head {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                gap: 12px;
            }
            .exp-rol {
                font-size: 15px;
                font-weight: 700;
                letter-spacing: -0.015em;
                color: var(--ink);
                line-height: 1.25;
            }
            .exp-periodo {
                font-family: var(--font-mono);
                font-size: 10.5px;
                color: var(--muted);
                white-space: nowrap;
                letter-spacing: 0.02em;
                font-weight: 500;
            }
            .exp-empresa {
                font-size: 13px;
                color: var(--accent);
                font-weight: 600;
                margin: 4px 0 10px;
                letter-spacing: -0.005em;
            }
            .exp-bullets {
                margin: 0;
                padding: 0;
                list-style: none;
            }
            .exp-bullets li {
                font-size: 12px;
                line-height: 1.55;
                color: var(--body);
                padding-left: 18px;
                position: relative;
                margin-bottom: 4px;
                text-wrap: pretty;
            }
            .exp-bullets li::before {
                content: '–';
                position: absolute;
                left: 0;
                top: 0;
                color: var(--accent-soft);
                font-family: var(--font-mono);
                font-size: 12px;
                line-height: 1.55;
                font-weight: 500;
            }

            /* ─── Formación + Cursos ──────────────────────────────── */
            .form-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
            }
            .form-col {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .form-item {
                break-inside: avoid;
            }
            .form-item .titulo {
                font-size: 13px;
                font-weight: 700;
                line-height: 1.3;
                letter-spacing: -0.012em;
                color: var(--ink);
            }
            .form-item .institucion {
                font-size: 11.5px;
                color: var(--ink-soft);
                margin-top: 1px;
            }
            .form-item .periodo {
                font-family: var(--font-mono);
                font-size: 10px;
                color: var(--muted);
                margin-top: 4px;
                letter-spacing: 0.02em;
                font-weight: 500;
            }
            .cursos-label {
                margin-bottom: 12px;
                padding-top: 0;
            }

            /* ─── Competencias ────────────────────────────────────── */
            .chips {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            .chip {
                font-size: 11.5px;
                padding: 6px 12px;
                font-weight: 500;
                border: 1px solid var(--rule);
                border-radius: 999px;
                color: var(--ink);
                background: #fff;
                letter-spacing: -0.005em;
            }

            /* ─── Print ───────────────────────────────────────────── */
            @page {
                size: A4;
                margin: 14mm 14mm;
            }
            @media print {
                body {
                    background: white;
                    padding: 0;
                    gap: 0;
                }
                .cv {
                    box-shadow: none;
                    width: 100%;
                    min-height: 0;
                    padding: 0;
                    background: white;
                }
                .section,
                .exp-item,
                .form-item {
                    break-inside: avoid;
                }
                .header {
                    break-after: avoid;
                }
            }
        </style>
    </body>
</html>
```

- [ ] **Step 3: Levantar el dev server**

Run: `npm run dev`
Expected: arranca en `http://localhost:4321` sin errores en la consola.

- [ ] **Step 4: Comparar `/cv-print` contra el original**

Abrir en el browser, uno al lado del otro:
- `http://localhost:4321/cv-print`
- `file:///C:/Users/franc/DEV/generador-cv/dist/cv.html`

Expected: idénticos salvo por los datos que cambiaron a propósito (ninguno — el `cv.json` salió del mismo YAML). Verificar específicamente: eyebrow "CURRÍCULUM" en verde y mono, h1 a 48px, foto redonda a la derecha, doble regla, fila meta con Idiomas alineado a la derecha, las 4 secciones con su etiqueta en la columna de 120px, los 8 chips.

Frenar el server con Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add src/types.d.ts src/pages/cv-print.astro
git commit -m "feat: pagina /cv-print con el layout A4 del cv"
```

---

### Task 3: Generación del PDF

**Files:**
- Create: `scripts/pdf.mjs`
- Modify: `package.json`
- Modify (output): `public/cv.pdf`

**Interfaces:**
- Consumes: la ruta `/cv-print` de la Task 2.
- Produces: el comando `npm run pdf` y el archivo `public/cv.pdf`, que es lo que sirve el botón "Descargar CV".

- [ ] **Step 1: Instalar Puppeteer**

Run: `npm install -D puppeteer@^23.5.0`
Expected: instala sin bajar Chromium de nuevo (ya está en el caché global de `~/.cache/puppeteer` por `generador-cv`). Si igual lo baja, dejarlo terminar — son ~150 MB una sola vez.

- [ ] **Step 2: Escribir `scripts/pdf.mjs`**

```js
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
```

- [ ] **Step 3: Registrar el script**

En `"scripts"` de `package.json`, junto al `"check"` de la Task 1:

```json
        "pdf": "node scripts/pdf.mjs"
```

- [ ] **Step 4: Generar el PDF**

Run: `npm run pdf`
Expected: `built public/cv.pdf (XXXkb)` y el proceso termina solo (no queda un `astro dev` colgado — verificar con `Get-Process node` en PowerShell si hay dudas).

**Si falla acá** — el riesgo conocido del spec. Fallback: en vez de `astro dev`, correr `npx astro build` y apuntar Puppeteer al HTML resultante con `url.pathToFileURL(...)`, igual que hacía `generador-cv/scripts/pdf.mjs`. Anotarlo y seguir.

- [ ] **Step 5: Verificar el PDF**

Abrir `public/cv.pdf` y compararlo con `C:\Users\franc\DEV\generador-cv\dist\cv.pdf`.

Expected: A4, **1 sola página**, fondo crema, foto visible, tipografía Geist (no una fallback tipo Arial — si las letras se ven distintas, las fuentes no cargaron y hay que subir el timeout de `networkidle0`), los 8 chips completos sin cortarse.

- [ ] **Step 6: Commit**

```bash
git add scripts/pdf.mjs package.json package-lock.json public/cv.pdf
git commit -m "feat: npm run pdf genera public/cv.pdf con puppeteer"
```

---

### Task 4: Paleta y papel continuo

**Files:**
- Modify: `src/layouts/Layout.astro`
- Modify: `src/components/ui/Container.astro`

**Interfaces:**
- Produces: los tokens CSS globales que consumen todas las secciones. **Se conservan los nombres de variables existentes** (`--color-primary`, `--color-accent`, etc.) y se agregan `--font-sans` y `--font-mono`; así las tasks 5–7 no tienen que tocar declaraciones de color.

- [ ] **Step 1: Cargar Geist y cambiar los tokens en `Layout.astro`**

En el `<head>`, justo después del `<SEO ... />`:

```astro
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
            href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap"
            rel="stylesheet"
        />
```

Dentro de `<style is:global>`, reemplazar el bloque `:root { ... }` completo (desde `--bg-page:` hasta el cierre de `font-family`) por:

```css
            :root {
                --bg-page: #e9e6e0;
                --bg-card: #fafaf8;
                --background-color: var(--bg-page);
                --color-primary: #0d1117;
                --color-accent: #1f5d4c;
                --color-accent-light: #eaf1ee;
                --color-text: #2a3038;
                --color-muted: #8a909a;
                --color-border: #e0e0dd;
                --color-border-soft: #ececea;
                --shadow-card: 0 2px 24px rgba(0, 0, 0, 0.06),
                    0 0 0 1px rgba(0, 0, 0, 0.04);
                --radius-card: 0;
                --font-sans: 'Geist', 'Helvetica Neue', system-ui, sans-serif;
                --font-mono: 'Geist Mono', ui-monospace, monospace;

                background-color: var(--bg-page);
                color: var(--color-text);
                font-family: var(--font-sans);
            }
```

Y reemplazar la regla `html { font-family: system-ui, sans-serif; ... }` por:

```css
            html {
                font-family: var(--font-sans);
                scroll-behavior: smooth;
            }
```

Reemplazar la regla `main { ... }` y su media query por (esto es lo que convierte `main` en la hoja de papel):

```css
            main {
                flex-grow: 1;
                width: 100%;
                max-width: 820px;
                margin: 2.5rem auto;
                padding: 3rem 3.5rem;
                background: var(--bg-card);
                box-shadow: var(--shadow-card);
            }
            @media (width <= 700px) {
                main {
                    margin: 0;
                    padding: 1.5rem 1.25rem;
                    box-shadow: none;
                }
            }
```

- [ ] **Step 2: Convertir `Container.astro` de card a sección de papel**

Reemplazar el bloque `<style>` completo por:

```astro
<style>
	.container {
		section {
			max-width: 700px;
			margin: 0 auto;
			padding: 1.75rem 0;

			h2 {
				font-family: var(--font-mono);
				font-size: 0.7rem;
				letter-spacing: 0.16em;
				text-transform: uppercase;
				font-weight: 700;
				color: var(--color-primary);
				margin-bottom: 1.25rem;
			}

			h3 {
				font-size: 1rem;
				font-weight: 600;
				color: var(--color-primary);
			}
		}

		.data {
			border-top: 1px solid var(--color-border-soft);
		}
	}
</style>
```

Se van `background`, `border-radius`, `box-shadow`, `margin-bottom` y el `border-left` verde del `h2`. Las secciones con clase `data` (todas menos `GeneralInfo`) quedan separadas por una regla fina, igual que en el CV.

- [ ] **Step 3: Ver el resultado**

Run: `npm run dev` y abrir `http://localhost:4321`
Expected: fondo beige, hoja crema centrada, tipografía Geist, títulos de sección en mono mayúscula, sin cards ni sombras internas. **Los datos siguen siendo los viejos** (`public/data/*.json`) — eso se arregla en las tasks 5–7.

Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Layout.astro src/components/ui/Container.astro
git commit -m "style: paleta del cv y layout de papel continuo"
```

---

### Task 5: Cabecera y perfil desde `cv.json`

**Files:**
- Modify: `src/sections/GeneralInfo.astro`
- Modify: `src/sections/ProfessionalProfile.astro`
- Modify: `src/data.ts`
- Modify: `src/components/SEO.astro`
- Modify: `src/components/buttons/CvButton.astro`, `GitHubButton.astro`, `LinkedInButton.astro`, `MailButton.astro`

**Interfaces:**
- Consumes: `cv.nombre`, `cv.titulo`, `cv.ubicacion`, `cv.email`, `cv.idiomas`, `cv.links`, `cv.perfil` (Task 1) y el tipo `CvData` (Task 2).
- Produces: `DATA` reducido a `{ URL_PRODUCTION }`.

**Todos los consumidores de `DATA.ME` / `DATA.LINKS` se migran en esta task.** Son 8 archivos (verificado con `grep -rn "DATA\." src/`): `Layout.astro`, `index.astro`, `GeneralInfo.astro`, `SEO.astro` y los 4 botones de `src/components/buttons/`.

Los 4 botones (`CvButton`, `GitHubButton`, `LinkedInButton`, `MailButton`) **no los importa nadie** — son código muerto preexistente. Según los Global Constraints no se borran: solo se les repunta el import para que no queden referenciando un export que ya no existe.

- [ ] **Step 1: Reducir `src/data.ts`**

Reemplazar el archivo completo por:

```ts
const DATA = {
    URL_PRODUCTION: 'https://cv-franco-dreer.pages.dev/'
}

export default DATA
```

- [ ] **Step 2: Actualizar los usos de `DATA.ME` en `Layout.astro` e `index.astro`**

En `src/layouts/Layout.astro`, en el frontmatter, agregar el import y usar `cv.nombre`:

```astro
import cvData from '@/data/cv.json'

const cv = cvData as CvData
const {title} = Astro.props
```

y en el `<SEO />`:

```astro
            description=`Esta es la web oficial del currículum vitae de ${cv.nombre}`
```

En `src/pages/index.astro`, cambiar el import de `DATA` por el de `cv.json` y el título:

```astro
import cvData from '@/data/cv.json'

const cv = cvData as CvData
```

```astro
<Layout title=`Cv de ${cv.nombre}`>
```

- [ ] **Step 3: Reescribir el frontmatter y el markup de `GeneralInfo.astro`**

Frontmatter — reemplazar el import de `DATA` por el de `cv.json` (el resto de imports queda igual):

```astro
---
import Container from '@/components/ui/Container.astro'
import MapPin from '@/icons/MapPin.astro'
import Mail from '@/icons/Mail.astro'
import LinkedIn from '@/icons/LinkedIn.astro'
import GitHub from '@/icons/GitHub.astro'
import Cv from '@/icons/Cv.astro'
import { Image } from 'astro:assets'
import myPhoto from '@/assets/img/foto.jpeg'
import LikeButton from '@/components/buttons/LikeButton.astro'
import ViewsCounter from '@/components/ViewsCounter.astro'
import cvData from '@/data/cv.json'

const cv = cvData as CvData
---
```

Markup — reemplazar el `<article class="me">` completo por (cambia `DATA.*` por `cv.*` y agrega la línea de Idiomas):

```astro
        <article class="me">
            <h1>{cv.nombre}</h1>
            <h3>{cv.titulo}</h3>
            <div class="meta">
                <span class="meta-item">
                    <MapPin />
                    {cv.ubicacion}
                </span>
                <a href={`mailto:${cv.email}`} class="meta-item meta-link">
                    <Mail />
                    {cv.email}
                </a>
                <span class="meta-item">
                    <span class="meta-key">Idiomas</span>
                    {cv.idiomas}
                </span>
            </div>
            <footer>
                <a href={cv.links.linkedin} target="_blank" class="link-btn link-btn--linkedin" title="LinkedIn">
                    <LinkedIn /> LinkedIn
                </a>
                <a href={cv.links.github} target="_blank" class="link-btn link-btn--github" title="GitHub">
                    <GitHub /> GitHub
                </a>
                <a href={cv.links.cv_pdf} target="_blank" class="link-btn link-btn--cv" title="Descargar CV">
                    <Cv /> Descargar CV
                </a>
            </footer>
        </article>
```

Y en el `<Image>` de la foto: `alt=` `Foto 4x4 de ${cv.nombre}` `.

- [ ] **Step 4: Ajustar estilos de `GeneralInfo.astro`**

En el `<style>`, reemplazar la regla `section { border-top: 4px solid var(--color-accent); }` por la doble regla del CV:

```css
    section {
        border-top: 1px solid var(--color-primary);
        border-bottom: 1px solid var(--color-border);
    }
```

Y agregar, después de `.meta-item`:

```css
    .meta-key {
        font-family: var(--font-mono);
        font-size: 0.7rem;
        letter-spacing: 0.06em;
        color: var(--color-muted);
        font-weight: 600;
    }
```

- [ ] **Step 5: Perfil desde `cv.json`**

Reemplazar `src/sections/ProfessionalProfile.astro` completo por:

```astro
---
import Container from '@/components/ui/Container.astro'
import cvData from '@/data/cv.json'

const cv = cvData as CvData
---

<Container>
    <section class="data">
        <h2>Perfil profesional</h2>
        <p>{cv.perfil}</p>
    </section>
</Container>

<style>
    p {
        font-size: 1rem;
        color: var(--color-text);
        line-height: 1.7;
    }
</style>
```

- [ ] **Step 6: Migrar `SEO.astro`**

En el frontmatter de `src/components/SEO.astro`, reemplazar el import de `DATA` por:

```astro
import cvData from '@/data/cv.json'

const cv = cvData as CvData
```

y en la línea 50:

```astro
<meta name="og:site_name" content=`Cv de ${cv.nombre}` />
```

- [ ] **Step 7: Migrar los 4 botones muertos**

No los importa nadie, pero quedarían apuntando a un export inexistente. En cada uno, reemplazar `import DATA from '@/data'` por:

```astro
import cvData from '@/data/cv.json'

const cv = cvData as CvData
```

y las referencias:

- `CvButton.astro` → `href=`${cv.links.cv_pdf}`` y `title=`Descargar Cv de ${cv.nombre}``
- `GitHubButton.astro` → `href=`${cv.links.github}`` y `title=`Visitar perfil de ${cv.nombre} en GitHub``
- `LinkedInButton.astro` → `href=`${cv.links.linkedin}`` y `title=`Visitar perfil de ${cv.nombre} en LinkedIn``
- `MailButton.astro` → `navigator.clipboard.writeText(`${cv.email}`)`

- [ ] **Step 8: Verificar que no quedan referencias a `DATA.ME` ni `DATA.LINKS`**

Run: `grep -rn "DATA\.ME\|DATA\.LINKS" src/`
Expected: sin resultados. La única referencia a `DATA` que debe quedar es `DATA.URL_PRODUCTION` en `Layout.astro`.

- [ ] **Step 9: Verificar en el browser**

Run: `npm run dev` y abrir `http://localhost:4321`
Expected: el h3 dice "Analista de Negocio y Operaciones · Contador Público | Datos y Automatización" (el título del YAML, no "Contador Público con perfil TI"), aparece la línea "Idiomas ES – EN B1", y el perfil es el del `cv.json`. Los botones de LinkedIn, GitHub y Descargar CV siguen funcionando. Sin errores en la consola.

Ctrl+C.

- [ ] **Step 10: Commit**

```bash
git add src/data.ts src/layouts/Layout.astro src/pages/index.astro src/sections/GeneralInfo.astro src/sections/ProfessionalProfile.astro src/components/SEO.astro src/components/buttons
git commit -m "refactor: cabecera y perfil desde cv.json"
```

---

### Task 6: Experiencia, formación y cursos desde `cv.json`

**Files:**
- Modify: `src/sections/Experience.astro`
- Modify: `src/sections/Formation.astro`
- Modify: `src/sections/Courses.astro`

**Interfaces:**
- Consumes: `cv.experiencia`, `cv.formacion`, `cv.cursos` (Task 1) y los tipos `CvExperiencia`, `CvFormacion`, `CvCurso` (Task 2).
- Los `logoMap` **siguen dentro de cada `.astro`**: `<Image>` exige imports estáticos. Se indexan por el string exacto de `empresa` / `institucion` del `cv.json`.

- [ ] **Step 1: `Experience.astro` — frontmatter y markup**

Frontmatter: cambiar el import de datos y dejar el `logoMap` como está (la entrada `'Nexo Consultora'` queda: es código muerto preexistente y no se toca).

```astro
---
import Container from '@/components/ui/Container.astro'
import { Image } from 'astro:assets'
import cvData from '@/data/cv.json'
import bimeg from '@/assets/img/bimeg.jpg'
import nexo from '@/assets/img/nexo.png'
import gdContadores from '@/assets/img/gd contadores.jpg'
import saenz from '@/assets/img/saenz.jpg'

const cv = cvData as CvData

const logoMap: Record<string, ImageMetadata> = {
    'BIMEG Constructora S.R.L.': bimeg,
    'Nexo Consultora': nexo,
    'Gallo & Dreer Contadores': gdContadores,
    'Santiago Saenz S.A.': saenz
}
---
```

Markup: reemplazar el `<ul>` completo por (cambian `title`→`rol`, `business`→`empresa`, `timeFrame`→`periodo`, `description`→`bullets`):

```astro
        <ul>
            {
                cv.experiencia.map(({ rol, empresa, periodo, bullets }) => (
                    <li>
                        <div class="company-icon">
                            {logoMap[empresa] ? (
                                <Image
                                    src={logoMap[empresa]}
                                    alt={empresa}
                                    width={46}
                                    height={46}
                                    class="logo-img"
                                />
                            ) : (
                                empresa[0]
                            )}
                        </div>
                        <div class="details">
                            <h3 class="job-title">{rol}</h3>
                            <span class="company">{empresa}</span>
                            <span class="date">{periodo}</span>
                            <ul class="desc">
                                {bullets.map(b => (
                                    <li>{b}</li>
                                ))}
                            </ul>
                        </div>
                    </li>
                ))
            }
        </ul>
```

Estilos: en `.date`, cambiar el color y la tipografía para que hable el mismo idioma que el CV:

```css
    .date {
        font-family: var(--font-mono);
        font-size: 0.72rem;
        color: var(--color-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-weight: 500;
        margin-top: 2px;
    }
```

Y en `.company`, para que la empresa quede en verde como en el CV:

```css
    .company {
        font-size: 0.9rem;
        color: var(--color-accent);
        font-weight: 600;
    }
```

- [ ] **Step 2: `Formation.astro`**

Frontmatter: reemplazar `import myFormation from '../../public/data/my-formation.json'` por:

```astro
import cvData from '@/data/cv.json'

const cv = cvData as CvData
```

(el `logoMap` con `ucasal` y `digitalHouse` queda igual)

Markup: reemplazar el `<ul>` completo por:

```astro
		<ul>
			{
				cv.formacion.map(({ titulo, institucion, periodo }) => (
					<li>
						<div class="institution-icon">
							{logoMap[institucion]
								? <Image src={logoMap[institucion]} alt={institucion} width={46} height={46} class="logo-img" />
								: institucion[0]
							}
						</div>
						<div class="details">
							<h3 class="degree-title">{titulo}</h3>
							<span class="institution">{institucion}</span>
							<span class="date">{periodo}</span>
						</div>
					</li>
				))
			}
		</ul>
```

Se cae el `{description && <p class="desc">{description}</p>}`: ningún item de `formacion` tiene descripción en el schema nuevo. La regla `.desc` del `<style>` queda huérfana — **borrarla también**, es basura que generan estos cambios (no es código muerto preexistente).

Estilos: mismo ajuste de `.date` que en el Step 1:

```css
	.date {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-weight: 500;
		margin-top: 2px;
	}
```

- [ ] **Step 3: `Courses.astro`**

Frontmatter: reemplazar `import myCourses from '../../public/data/my-courses.json'` por:

```astro
import cvData from '@/data/cv.json'

const cv = cvData as CvData
```

(el `logoMap` con `ucasal` y `tango` queda igual)

Markup: reemplazar el `<ul>` completo por (`images`→`insignias`, `src`→`imagePath`, `title`→`altText` en el componente `Insignia`, que **no cambia**):

```astro
		<ul>
			{
				cv.cursos.map(({ titulo, institucion, periodo, insignias }) => (
					<li>
						<div class="institution-icon">
							{logoMap[institucion]
								? <Image src={logoMap[institucion]} alt={institucion} width={46} height={46} class="logo-img" />
								: institucion[0]
							}
						</div>
						<div class="details">
							<h3 class="course-title">{titulo}</h3>
							<span class="institution">{institucion}</span>
							<span class="date">{periodo}</span>
							{insignias && insignias.length > 0 && (
								<div class="container-insignias">
									{insignias.map(({ titulo, src, href }) => (
										<Insignia imagePath={src} href={href} altText={titulo} />
									))}
								</div>
							)}
						</div>
					</li>
				))
			}
		</ul>
```

Estilos: mismo ajuste de `.date` que en los steps anteriores.

- [ ] **Step 4: Verificar**

Run: `npm run dev` y abrir `http://localhost:4321`
Expected:
- BIMEG dice **"Dic 2025 – Presente"** (no "Octubre 2025 – Actualidad"), Gallo & Dreer **"Ago 2024 – Nov 2025"**, Saenz **"2023 – 2024"** con el rol "Auxiliar Contable (pasantía)".
- Los 4 logos de empresas y los 2 de instituciones siguen apareciendo.
- Cursos en el orden del YAML: **Tango Gestión** (con las 7 insignias), Curso de Inglés B1, Business Analytics.
- Contador Público dice "Feb 2018 – Jun 2024".
- Sin errores en la consola. Si aparece `"..." does not exist in glob`, un `src` de insignia está mal → correr `npm run check`.

Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add src/sections/Experience.astro src/sections/Formation.astro src/sections/Courses.astro
git commit -m "refactor: experiencia, formacion y cursos desde cv.json"
```

---

### Task 7: Sección Competencias

**Files:**
- Create: `src/sections/Skills.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `cv.competencias` (Task 1), `Container.astro` (Task 4).

- [ ] **Step 1: Crear `src/sections/Skills.astro`**

Los chips replican `.chip` de `cv-print.astro`, pero en `rem` para que escale con la web.

```astro
---
import Container from '@/components/ui/Container.astro'
import cvData from '@/data/cv.json'

const cv = cvData as CvData
---

<Container>
    <section class="data">
        <h2>Competencias</h2>
        <div class="chips">
            {cv.competencias.map(c => <span class="chip">{c}</span>)}
        </div>
    </section>
</Container>

<style>
    .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .chip {
        font-size: 0.85rem;
        padding: 6px 12px;
        font-weight: 500;
        border: 1px solid var(--color-border);
        border-radius: 999px;
        color: var(--color-primary);
        background: #fff;
        letter-spacing: -0.005em;
    }
</style>
```

- [ ] **Step 2: Sumarla al index**

En `src/pages/index.astro`, agregar el import junto a los otros:

```astro
import Skills from '@/sections/Skills.astro'
```

y el componente al final de `<Layout>`, después de `<Courses />`:

```astro
    <Skills />
```

- [ ] **Step 3: Verificar**

Run: `npm run dev` y abrir `http://localhost:4321`
Expected: al final de la página aparece "COMPETENCIAS" con 8 chips: Power BI, SQL, Excel, Odoo, Tango Gestión, Automatización con IA, Implementación de ERP, Análisis de datos.

Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/sections/Skills.astro src/pages/index.astro
git commit -m "feat: seccion de competencias en la web"
```

---

### Task 8: Limpieza

**Files:**
- Delete: `public/data/my-experience.json`, `public/data/my-formation.json`, `public/data/my-courses.json`, `public/data/about-me.json`
- Modify: `src/types.d.ts`

**Interfaces:**
- Nada consume ya `public/data/*.json` ni los tipos `Course` / `Formation` después de las tasks 5–7.

- [ ] **Step 1: Borrar `about-me.json` (decisión por defecto, sin bloquear)**

Es el único de los cuatro cuyo contenido no migró a `cv.json`: la sección "Sobre mí" quedó apagada por decisión de Franco y `AboutMe.astro` no está en `index.astro`.

**Se borra.** El texto queda recuperable en el historial de git (`git show HEAD:public/data/about-me.json`). Anotar en el reporte final que si quiere reactivar "Sobre mí", el contenido tiene que migrar a `cv.json` como `sobre_mi` — es una pregunta para el cierre, no un bloqueo.

- [ ] **Step 2: Verificar que ya nadie importa los JSON viejos**

Run: `grep -rn "public/data" src/`
Expected: sin resultados. Si aparece algo, esa sección quedó sin migrar — volver a la Task 5 o 6.

- [ ] **Step 3: Borrar los JSON viejos**

```bash
git rm public/data/my-experience.json public/data/my-formation.json public/data/my-courses.json public/data/about-me.json
```

Los cuatro se borran. `git rm` los deja recuperables desde el historial.

- [ ] **Step 4: Sacar los tipos muertos**

En `src/types.d.ts`, borrar los bloques `type Course = {...}` y `type Formation = {...}`. Quedan solo los `Cv*` de la Task 2.

- [ ] **Step 5: Verificar que compila**

Run: `npm run build`
Expected: build exitoso, sin errores de import ni de tipos. Si `AboutMe.astro` rompe por importar `about-me.json` — es código muerto que no está en `index.astro`, así que **borrarlo también** (`git rm src/sections/AboutMe.astro`) y anotarlo en el reporte final.

- [ ] **Step 6: Chequear los datos una vez más**

Run: `npm run check`
Expected: `cv.json OK — 3 experiencias, 3 formaciones, 3 cursos (7 insignias), 8 competencias`

- [ ] **Step 7: Commit**

```bash
git add -A src/types.d.ts public/data src/sections
git commit -m "chore: borrar los json viejos y los tipos que reemplazan"
```

---

### Task 9: Documentación

**Files:**
- Modify: `CLAUDE.md` (**está en `.gitignore` — se actualiza pero no entra al commit**)
- Create: `README.md`

- [ ] **Step 1: Reescribir `CLAUDE.md`**

Hoy está desactualizado en tres puntos: dice que los likes usan Astro DB (es Cloudflare KV), lista `AboutMe` y `Likes` en `index.astro` (no están), y dice que los JSON se fetchean del cliente (se importan en build).

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server en http://localhost:4321
npm run check    # Valida src/data/cv.json (correr antes de generar el PDF)
npm run pdf      # Levanta astro dev + Puppeteer → public/cv.pdf
npm run build    # Build de producción
npm run preview  # Preview del build
```

## Arquitectura

CV/portfolio de una sola página de Franco Dreer. **Astro 4** en modo SSR, desplegado en **Cloudflare Pages** vía `@astrojs/cloudflare`.

### Fuente única de datos

Todo el contenido del CV vive en **`src/data/cv.json`**. Es el único lugar donde se edita texto. Lo importan en build las secciones de `/src/sections/` y la página `/cv-print`.

`src/data.ts` solo tiene `URL_PRODUCTION`. Los tipos del schema están en `src/types.d.ts` (`CvData` y sus partes).

Dos cosas **no** viven en el JSON, porque `<Image>` de Astro necesita imports estáticos: los logos de empresas e instituciones están en los `logoMap` de `Experience.astro`, `Formation.astro` y `Courses.astro`, indexados por el string de `empresa`/`institucion`. Las insignias Tango sí van en el JSON porque `Insignia.astro` las resuelve con `import.meta.glob`.

### Páginas

- `src/pages/index.astro` — la web. Compone: `GeneralInfo` → `ProfessionalProfile` → `Experience` → `Formation` → `Courses` → `Skills`.
- `src/pages/cv-print.astro` — layout A4 del CV, standalone (no usa `Layout.astro`). Es lo que se imprime a PDF.

`src/layouts/Layout.astro` envuelve solo `index.astro`: tokens CSS globales, SEO y estilos de Notyf.

### PDF

`npm run pdf` corre `scripts/pdf.mjs`: levanta `astro dev`, Puppeteer imprime `/cv-print` en A4 y escribe `public/cv.pdf`. **El PDF se commitea** — Cloudflare nunca ejecuta Puppeteer.

Después de tocar `cv.json`, correr `npm run check` y después `npm run pdf`.

### Likes y visitas

`src/pages/api/likes.ts` y `src/pages/api/views.ts` (GET/POST/PATCH) persisten en **Cloudflare KV** vía el binding `LIKES_KV` (`locals.runtime.env`). `LikeButton.astro` y `ViewsCounter.astro` manejan el estado en el cliente; `src/lib/local-storage.ts` evita likes duplicados y `src/lib/toast.ts` envuelve Notyf.

### Alias de TypeScript

`@/*` → `./src/*` (en `tsconfig.json`).

### Assets

- Foto: `src/assets/img/foto.jpeg`
- Logos: `src/assets/img/`
- Insignias Tango: `src/assets/tango_insignia/`

### Código muerto conocido

`src/sections/Likes.astro` existe pero no está en `index.astro` (el like activo es `LikeButton` dentro de `GeneralInfo`). El `logoMap` de `Experience.astro` tiene una entrada `'Nexo Consultora'` sin experiencia asociada.
```

- [ ] **Step 2: Crear `README.md`**

```markdown
# CV — Franco Dreer

Web del CV en `https://cv-franco-dreer.pages.dev`, con generación del PDF desde el mismo contenido.

## Editar el CV

Todo el contenido está en **`src/data/cv.json`**. Un solo archivo, un solo cambio.

```bash
npm run check    # valida el JSON
npm run dev      # ver la web en localhost:4321 y el CV en localhost:4321/cv-print
npm run pdf      # regenerar public/cv.pdf
```

Después de correr `npm run pdf`, commitear `public/cv.pdf`: es el archivo que descarga la gente desde el botón "Descargar CV".

## Deploy

Push a `master` → Cloudflare Pages. El build de producción no ejecuta Puppeteer; el PDF va commiteado en el repo.
```

- [ ] **Step 3: Commit**

`CLAUDE.md` está gitignoreado, así que solo entra el README.

```bash
git add README.md
git commit -m "docs: readme del proyecto unificado"
```

---

### Verificación final (después de la Task 9)

- [ ] **Prueba de fuego: un cambio, dos salidas**

1. En `src/data/cv.json`, cambiar `"ubicacion"` a `"Salta Capital, Argentina"`.
2. Run: `npm run check` → OK
3. Run: `npm run dev` → la web muestra "Salta Capital, Argentina"
4. Run: `npm run pdf` → abrir `public/cv.pdf`, la fila meta dice "Salta Capital, Argentina"
5. Revertir el cambio, correr `npm run pdf` de nuevo y commitear.

Ese es el criterio de éxito del spec: un lugar, dos salidas.

- [ ] **Avisarle a Franco que puede borrar `C:\Users\franc\DEV\generador-cv`**

Solo después de que confirme que el PDF nuevo le sirve. El plan no toca esa carpeta.
