import { column, defineDb, defineTable } from 'astro:db'

const Likes = defineTable({
	columns: {
		id: column.text(),
		number: column.number()
	}
})

export default defineDb({
	tables: { Likes }
})
