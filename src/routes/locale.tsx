import { LOCALE_COOKIE, resolveLocale } from '../i18n/locales'

export async function action({ request }: { request: Request }) {
  const formData = await request.formData()
  const locale = resolveLocale(String(formData.get('locale') ?? ''))
  const referer = request.headers.get('referer') || '/'
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return new Response(null, {
    status: 303,
    headers: {
      Location: referer,
      'Set-Cookie': `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${365 * 86400}; SameSite=Lax${secure}`,
    },
  })
}

export async function loader() {
  return new Response(null, { status: 302, headers: { Location: '/' } })
}
