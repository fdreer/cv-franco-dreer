import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ params }) => {
	const { id } = params
	return new Response(
		JSON.stringify({ dataTest: 'This is the test number ' + id })
	)
}

export const POST: APIRoute = async () => {
	return new Response(
		JSON.stringify({ response: 'Esta es una llamada al metodo POST' })
	)
}
