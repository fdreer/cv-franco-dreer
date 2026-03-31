import type { APIRoute } from 'astro'

const KEY = 'cv-franco-views'

export const GET: APIRoute = async ({ locals }) => {
    const kv = locals.runtime.env.LIKES_KV
    const value = await kv.get(KEY)
    const views = value ? parseInt(value) : 0
    return new Response(JSON.stringify({ views }))
}

export const POST: APIRoute = async ({ locals }) => {
    const kv = locals.runtime.env.LIKES_KV
    const value = await kv.get(KEY)
    const newViews = (value ? parseInt(value) : 0) + 1
    await kv.put(KEY, String(newViews))
    return new Response(JSON.stringify({ newViews }))
}
