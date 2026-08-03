import { getDb, promisifyRun } from '../db/client.server'
import {
  clearSessionCookieHeader,
  destroySession,
  parseCookies,
  SESSION_COOKIE,
} from '../lib/session.server'

export async function action({ request }: { request: Request }) {
  const cookies = parseCookies(request.headers.get('Cookie'))
  const db = await getDb()
  await destroySession(db, promisifyRun, cookies[SESSION_COOKIE])
  return new Response(null, {
    status: 303,
    headers: {
      Location: '/',
      'Set-Cookie': clearSessionCookieHeader(),
    },
  })
}

export async function loader() {
  return new Response(null, { status: 302, headers: { Location: '/' } })
}
