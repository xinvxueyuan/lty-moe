import { listAllTags } from '../db/client.server'

export async function loader() {
  const tags = await listAllTags()
  return Response.json({ tags })
}
