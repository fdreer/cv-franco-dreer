import { db, Likes } from 'astro:db'

export default async function seed() {
	await db.insert(Likes).values({ id: 'cv-franco', number: 7 })
}
