import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import db from '@astrojs/db'

// https://astro.build/config
export default defineConfig({
	build: {
		inlineStylesheets: 'always'
	},
	compressHTML: true,
	integrations: [db()],
	output: 'server',
	adapter: cloudflare()
})
