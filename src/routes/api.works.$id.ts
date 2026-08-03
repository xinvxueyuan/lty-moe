import { getWorkById } from '../db/client.server'

export async function loader({ params }: { params: { id: string } }) {
  const work = await getWorkById(params.id)
  if (!work) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  return Response.json({ work })
}
