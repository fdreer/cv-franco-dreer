// El `postinstall` de puppeteer descarga Chrome (~250MB) salvo que se le
// diga que no lo haga. `.npmrc` (puppeteer-skip-download=true) NO alcanza
// para puppeteer ^23: npm lo pasa a los scripts como la variable
// npm_config_puppeteer_skip_download, pero el instalador de puppeteer solo
// lee PUPPETEER_SKIP_DOWNLOAD o este archivo (vía cosmiconfig). Esto es lo
// que efectivamente corta la descarga en `npm install` — y por lo tanto lo
// que evita que Cloudflare Pages falle el build por un Chrome que nunca usa.
module.exports = {
  skipDownload: true,
};
