import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import cloudflare from '@astrojs/cloudflare'
import db from '@astrojs/db'

// https://astro.build/config
export default defineConfig({
	build: {
		inlineStylesheets: 'always'
	},
	compressHTML: true,
	integrations: [react(), db()],
	output: 'server',
	adapter: cloudflare()
})
