# Unificación de `cv-franco-dreer` + `generador-cv`

**Fecha:** 2026-08-04
**Proyecto destino:** `C:\Users\franc\DEV\cv-franco-dreer`
**Estado:** aprobado, pendiente de plan de implementación

---

## Problema

El CV vive hoy en dos proyectos independientes y cada cambio hay que hacerlo dos veces:

| | `cv-franco-dreer` | `generador-cv` |
|---|---|---|
| Stack | Astro 4 SSR → Cloudflare Pages | Node scripts + HTML/CSS/JS vanilla |
| Datos | `public/data/*.json` (4 archivos) + `src/data.ts` + perfil hardcodeado en `ProfessionalProfile.astro` | `data/cv_data.yaml` (1 archivo) |
| Render | Componentes `.astro` | `src/template.html` + `scripts/build.mjs` |
| PDF | `public/cv.pdf` estático, reemplazado a mano | `scripts/pdf.mjs` (Puppeteer → A4) |
| Backend | `/api/likes`, `/api/views` sobre Cloudflare KV | — |

La duplicación ya produjo desincronización real:

| Dato | `generador-cv` (YAML) | `cv-franco-dreer` (JSON) |
|---|---|---|
| BIMEG desde | Dic 2025 | Octubre 2025 |
| Gallo & Dreer hasta | Nov 2025 | Diciembre 2025 |
| Santiago Saenz | 2023 – 2024 (pasantía) | Enero 2024 – Junio 2024 |
| Contador Público desde | Feb 2018 | Marzo 2018 |
| Subtítulo | "Analista de Negocio y Operaciones · Contador Público \| Datos y Automatización" | "Contador Público con perfil TI" |
| Perfil | versión propia | versión propia (levemente distinta) |

Y cada proyecto tiene contenido que el otro no: el PDF tiene **competencias** e **idiomas**; la web tiene **logos de empresas, insignias Tango, likes y views**.

## Objetivo

Un solo repo (`cv-franco-dreer`) donde un cambio de contenido se hace **una vez** y se refleja en la web y en el PDF. Se conserva toda la lógica de front y back de `cv-franco-dreer`, se incorpora la generación de PDF de `generador-cv`, y el lenguaje visual de `generador-cv` pasa a ser el de todo el proyecto.

## Decisiones tomadas

| Decisión | Resuelto |
|---|---|
| Alcance visual | El PDF mantiene el diseño de `generador-cv` **y** la web se rediseña con esa paleta |
| Formato de la fuente única | Un solo **JSON** |
| Motor de PDF | Ruta Astro `/cv-print` impresa por Puppeteer |
| Resolución de conflictos de contenido | **Gana el YAML** de `generador-cv` |
| Secciones nuevas en la web | Competencias (chips) e Idiomas. "Sobre mí" queda apagada |
| Likes y views | Se mantienen intactos |
| Look de la web | Papel continuo (se van las cards y las sombras) |
| Skill `cv-franco` | **Descartada** — ya no se usa |
| Carpeta `DEV/generador-cv` | Queda intacta; Franco la borra cuando valide el PDF |

---

## Arquitectura

### 1. Fuente única — `src/data/cv.json`

Un archivo, importado en build por la web y por la página de impresión. Claves en español, consistentes con el YAML que gana y con el idioma del CV.

```jsonc
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
  "perfil": "…",
  "experiencia": [
    { "rol": "…", "empresa": "…", "periodo": "…", "bullets": ["…"] }
  ],
  "formacion": [
    { "titulo": "…", "institucion": "…", "periodo": "…" }
  ],
  "cursos": [
    {
      "titulo": "…", "institucion": "…", "periodo": "…",
      "insignias": [{ "titulo": "…", "src": "/src/assets/tango_insignia/….png", "href": "…" }]
    }
  ],
  "competencias": ["Power BI", "SQL", "…"]
}
```

**Ubicación:** `src/data/`, no `public/data/`. Las secciones actuales ya lo importan (no hacen `fetch`), y desde `src/` el bundler lo inlinea — necesario porque el sitio corre SSR en un Worker de Cloudflare, sin acceso a disco en runtime.

**Los logos NO entran al JSON.** `<Image>` de Astro exige imports estáticos, así que los `logoMap` siguen viviendo dentro de cada `.astro`, indexados por el string de `empresa` / `institucion`. Las insignias Tango sí van en el JSON: `Insignia.astro` las resuelve por `import.meta.glob`, que acepta la ruta como dato.

**`periodo` es un string único** (`"Dic 2025 – Presente"`), no `{ startDate, endDate }`. Es como lo tiene el YAML y como se renderiza en los dos lados.

#### Contenido consolidado (YAML como base)

- **Experiencia:** BIMEG `Dic 2025 – Presente` · Gallo & Dreer `Ago 2024 – Nov 2025` · Santiago Saenz `2023 – 2024`, con el rol "Auxiliar Contable (pasantía)".
- **Formación:** Licenciatura `Mar 2026 – Presente` · Contador Público `Feb 2018 – Jun 2024` · Certified Tech Developer `Feb 2022 – Sep 2023`.
- **Cursos:** en el orden del YAML — Tango Gestión, Curso de Inglés B1, Business Analytics. El curso se llama **"Tango Gestión"** (no "Tango Software") y es el que lleva las 7 insignias que hoy están en `my-courses.json`.
- **Competencias:** las 8 del YAML.
- **Perfil y título:** las versiones del YAML.

### 2. PDF — `/cv-print` + `npm run pdf`

**`src/pages/cv-print.astro`** es `generador-cv/src/template.html` portado a Astro, leyendo `cv.json`. Conserva el diseño tal cual:

- Geist + Geist Mono desde Google Fonts
- Fondo `#fafaf8`, tinta `#0d1117`, acento `#1f5d4c`
- Grilla `120px | 1fr` (etiqueta mono en versalitas | contenido)
- `@page { size: A4; margin: 14mm }` y `break-inside: avoid` en secciones e items

**`scripts/pdf.mjs`** levanta `astro dev`, espera al puerto, Puppeteer navega a `http://localhost:4321/cv-print`, espera `networkidle0` + `document.fonts.ready`, imprime con `{ format: 'A4', printBackground: true, preferCSSPageSize: true }` a `public/cv.pdf`, y mata el server.

El PDF **se commitea**. Cloudflare nunca ejecuta Puppeteer: el build de deploy no cambia. `puppeteer` entra como `devDependency`.

Con esto desaparecen `build.mjs`, `dev.mjs` y `template.html`: el live-reload lo da `astro dev` y el CV se previsualiza en `localhost:4321/cv-print`.

### 3. Rediseño de la web — papel continuo

El cambio está concentrado en dos archivos:

- **`src/layouts/Layout.astro`** — se reemplazan los tokens (`--bg-page: #edf2f7`, `--color-accent: #0284c7`, Segoe UI) por la paleta del CV (crema, verde, Geist) y se carga Geist desde Google Fonts. Los estilos globales de Notyf se conservan.
- **`src/components/ui/Container.astro`** — hoy es el único que aplica `background`, `box-shadow` y `border-radius` a cada sección. Se quita todo eso: columna única centrada sobre crema, secciones separadas por reglas de 1px, `h2` en mono mayúscula con tracking (como los `.section-label` del CV).

Y ajustes menores por sección:

- `GeneralInfo.astro` — datos desde `cv.json`, se suma **Idiomas** al bloque de contacto.
- `ProfessionalProfile.astro` — el perfil deja de estar hardcodeado y sale de `cv.json`.
- `Experience.astro` / `Formation.astro` / `Courses.astro` — apuntan a `cv.json` y a las claves nuevas (`rol`/`empresa`/`periodo`, `titulo`/`institucion`/`periodo`, `insignias`). Se conservan `logoMap`, `<Image>` e `Insignia`.
- **`src/sections/Skills.astro` (nuevo)** — chips de competencias, mismo tratamiento que `.chip` del CV.
- `src/pages/index.astro` — se suma `<Skills />` al final.
- `src/data.ts` — queda solo con `URL_PRODUCTION`; nombre y links salen de `cv.json`.
- `src/types.d.ts` — se reemplazan `Course` y `Formation` por los tipos del schema nuevo.

### 4. Fuera de alcance

Intactos: `src/pages/api/likes.ts`, `src/pages/api/views.ts`, el binding `LIKES_KV`, `astro.config.mjs`, el adapter de Cloudflare y `wrangler`.

Intacta también `C:\Users\franc\DEV\generador-cv` — no se toca nada fuera de `cv-franco-dreer`.

**Código muerto detectado — se señala, no se borra:**

1. `src/sections/AboutMe.astro` + `public/data/about-me.json` — la sección no está en `index.astro`.
2. `src/sections/Likes.astro` — tampoco está en `index.astro` (el like activo es `LikeButton` dentro de `GeneralInfo`).
3. Entrada `'Nexo Consultora'` en el `logoMap` de `Experience.astro`, sin experiencia que la use.

Nota: `about-me.json` es uno de los `public/data/*.json` que el paso 5 elimina. Si Franco quiere reactivar "Sobre mí" más adelante, su contenido debe migrar a `cv.json` como sección `sobre_mi`. Se le confirma antes de borrarlo.

---

## Riesgo conocido

Puppeteer imprimiendo contra `astro dev` con el adapter de Cloudflare no está verificado. Si falla, el fallback es construir el HTML y imprimir el archivo resultante en vez del dev server — mismo output, script algo más largo. Se resuelve en el paso 3 y no bloquea nada anterior.

---

## Plan de pasos y verificación

| # | Paso | Verificación |
|---|---|---|
| 1 | Crear `src/data/cv.json` consolidado | JSON válido; 3 experiencias, 3 formaciones, 3 cursos (7 insignias en Tango Gestión), 8 competencias; fechas = las del YAML |
| 2 | Portar `src/pages/cv-print.astro` | `npm run dev` → `/cv-print` visualmente idéntico a `generador-cv/dist/cv.html` |
| 3 | `scripts/pdf.mjs` + script `pdf` en `package.json` | `npm run pdf` genera `public/cv.pdf`: A4, 1 página, equivalente a `generador-cv/dist/cv.pdf` |
| 4 | Rediseño web: Layout, Container, secciones, `Skills.astro`, idiomas | `npm run dev` → home sin errores de consola, todas las secciones con datos de `cv.json` |
| 5 | Borrar `public/data/*.json`, limpiar `src/data.ts` y `src/types.d.ts` | `npm run build` compila sin imports rotos |
| 6 | Actualizar `CLAUDE.md` | Refleja comandos y estructura reales (hoy dice Astro DB en vez de KV, y lista AboutMe/Likes en `index.astro`) |

## Criterio de éxito

Editar un dato en `src/data/cv.json`, correr `npm run dev` y verlo en la web, correr `npm run pdf` y verlo en el PDF. Un solo lugar, dos salidas.
