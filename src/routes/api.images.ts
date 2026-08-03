import { requireUser } from '../lib/auth.server'
import { saveUploadFile, validateImageFile } from '../lib/save-upload.server'

export async function loader() {
  return Response.json(
    { error: 'Method not allowed', allow: 'POST' },
    { status: 405, headers: { Allow: 'POST' } },
  )
}

export async function action({ request }: { request: Request }) {
  await requireUser(request)
  if (request.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405, headers: { Allow: 'POST' } },
    )
  }

  const formData = await request.formData()
  const { file, errors } = validateImageFile(formData.get('image') ?? formData.get('file'))
  if (errors.length || !file) {
    return Response.json({ errors }, { status: 400 })
  }

  const saved = await saveUploadFile(file, 'img')
  return Response.json(saved, { status: 201 })
}
