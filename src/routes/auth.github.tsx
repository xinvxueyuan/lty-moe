import { createHash, randomBytes } from 'node:crypto'

const STATE_COOKIE = 'lty_oauth_state'

export async function loader({ request }: { request: Request }) {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return new Response(
      'GitHub OAuth 未配置。请设置 GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET / APP_URL。',
      { status: 503 },
    )
  }
  const url = new URL(request.url)
  const next = url.searchParams.get('next') || '/dashboard'
  const state = randomBytes(16).toString('base64url')
  const statePayload = `${state}.${Buffer.from(next).toString('base64url')}`
  const redirectUri = `${process.env.APP_URL || url.origin}/auth/github/callback`
  const authorize = new URL('https://github.com/login/oauth/authorize')
  authorize.searchParams.set('client_id', clientId)
  authorize.searchParams.set('redirect_uri', redirectUri)
  authorize.searchParams.set('scope', 'read:user user:email')
  authorize.searchParams.set('state', statePayload)

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      'Set-Cookie': `${STATE_COOKIE}=${encodeURIComponent(statePayload)}; Path=/; Max-Age=600; HttpOnly; SameSite=Lax${secure}`,
    },
  })
}

export function hashState(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export { STATE_COOKIE }
