import type { APIRoute } from 'astro'
import { Likes, db, eq } from 'astro:db'

export const GET: APIRoute = async () => {
	const [likes] = await db
		.select({
			number: Likes.number
		})
		.from(Likes)
		.where(eq(Likes.id, 'cv-franco'))

	return new Response(JSON.stringify({ likes: likes.number }))
}

export const POST: APIRoute = async () => {
	const [likes] = await db
		.select({
			id: Likes.id,
			number: Likes.number
		})
		.from(Likes)
		.where(eq(Likes.id, 'cv-franco'))

	const newLikes = await db
		.update(Likes)
		.set({
			number: likes.number + 1
		})
		.where(eq(Likes.id, 'cv-franco'))
		.returning({ updateLikes: Likes.number })

	return new Response(JSON.stringify({ newLikes: newLikes[0].updateLikes }))
}

export const PATCH: APIRoute = async () => {
	const [likes] = await db
		.select({
			id: Likes.id,
			number: Likes.number
		})
		.from(Likes)
		.where(eq(Likes.id, 'cv-franco'))

	const newLikes = await db
		.update(Likes)
		.set({
			number: likes.number - 1
		})
		.where(eq(Likes.id, 'cv-franco'))
		.returning({ updateLikes: Likes.number })

	return new Response(JSON.stringify({ newLikes: newLikes[0].updateLikes }))
}
