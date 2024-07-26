import { column, defineDb, defineTable } from 'astro:db'

const Likes = defineTable({
    columns: {
        id: column.text(),
        number: column.number()
    }
})

const Donators = defineTable({
    columns: {
        id: column.text({ primaryKey: true }),
        name: column.text({ optional: true }),
        email: column.text({ optional: true })
    }
})

const Donations = defineTable({
    columns: {
        id: column.number({ primaryKey: true, unique: true }),
        payerId: column.text({ references: () => Donators.columns.id }),
        total: column.number()
    }
})

export default defineDb({
    tables: { Likes }
})
