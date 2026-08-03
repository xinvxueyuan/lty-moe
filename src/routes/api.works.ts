import { listWorks } from '../db/client.server'

export async function loader() {
  const works = await listWorks()
  return Response.json({ works })
}
