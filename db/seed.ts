import { db, Likes } from 'astro:db'

export default async function seed() {
	await db.insert(Likes).values({ id: 'cv-franco', number: 0 })
}

// npx astro db execute db/seed.ts --remote
