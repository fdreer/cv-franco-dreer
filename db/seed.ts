import { db, Donators, Donations, Likes, eq } from 'astro:db'

export default async function seed() {
	await db.insert(Likes).values({ id: 'cv-franco', number: 0 })

	// await db.insert(Donators).values({
	// 	id: 'este es el id',
	// 	name: 'Franco',
	// 	email: 'francodreer@gmail.com'
	// })
	// await db
	// 	.insert(Donations)
	// 	.values({ paymentId: 123, payerId: 'este es el id', total: 1000 })
}

// npx astro db execute db/seed.ts --remote
