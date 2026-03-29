import type { APIRoute } from 'astro'

const KEY = 'cv-franco'

export const GET: APIRoute = async ({ locals }) => {
    const kv = locals.runtime.env.LIKES_KV
    const value = await kv.get(KEY)
    const likes = value ? parseInt(value) : 0
    return new Response(JSON.stringify({ likes }))
}

export const POST: APIRoute = async ({ locals }) => {
    const kv = locals.runtime.env.LIKES_KV
    const value = await kv.get(KEY)
    const newLikes = (value ? parseInt(value) : 0) + 1
    await kv.put(KEY, String(newLikes))
    return new Response(JSON.stringify({ newLikes }))
}

export const PATCH: APIRoute = async ({ locals }) => {
    const kv = locals.runtime.env.LIKES_KV
    const value = await kv.get(KEY)
    const newLikes = Math.max(0, (value ? parseInt(value) : 0) - 1)
    await kv.put(KEY, String(newLikes))
    return new Response(JSON.stringify({ newLikes }))
}
