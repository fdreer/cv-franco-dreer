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
