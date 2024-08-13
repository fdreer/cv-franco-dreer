import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import db from '@astrojs/db'

export default defineConfig({
    output: 'hybrid',
    adapter: cloudflare(),
    integrations: [db()]
})
