import { listWorks } from '../db/client.server'

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url)
  const category = url.searchParams.get('category') ?? undefined
  const tag = url.searchParams.get('tag') ?? undefined
  const works = await listWorks({
    category: category || undefined,
    tag: tag || undefined,
  })
  return Response.json({ works })
}
