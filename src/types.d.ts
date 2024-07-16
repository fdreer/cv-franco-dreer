type Course = {
    title: string
    institution: string
    timeFrame?: {
        startDate: string
        endDate: string
    }
    images?: {
        title: string
        src: string
        href?: string
    }[]
}

type Formation = {
    title: string
    institution: string
    timeFrame?: {
        startDate: string
        endDate: string
    }
    description?: string
}
