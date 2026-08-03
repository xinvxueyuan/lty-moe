import { Link, useLoaderData } from 'react-router'
import { getDb, promisifyGet, promisifyRun } from '../db/client.server'
import { consumeEmailToken } from '../db/email-tokens.server'
import { setEmailVerified } from '../db/users.server'
import { writeAuditLog } from '../lib/logger.server'

export async function loader({ request }: { request: Request }) {
  const token = new URL(request.url).searchParams.get('token') || ''
  if (!token) return { ok: false, message: '缺少验证令牌。' }
  const db = await getDb()
  const userId = await consumeEmailToken(db, promisifyGet, promisifyRun, token, 'verify-email')
  if (!userId) return { ok: false, message: '验证链接无效或已过期。' }
  await setEmailVerified(db, promisifyRun, userId)
  await writeAuditLog(db, promisifyRun, {
    category: 'auth',
    message: 'email_verified',
    userId,
  })
  return { ok: true, message: '邮箱已验证。' }
}

export default function VerifyEmailPage() {
  const data = useLoaderData<{ ok: boolean; message: string }>()
  return (
    <section className="archive-container page-shell auth-page">
      <div className="auth-card">
        <p className="eyebrow">EMAIL VERIFY</p>
        <h1>{data.ok ? '验证成功' : '验证失败'}</h1>
        <p className={data.ok ? 'form-success' : 'muted-copy'}>{data.message}</p>
        <p className="auth-switch">
          <Link to="/account">前往用户中心</Link> · <Link to="/login">登录</Link>
        </p>
      </div>
    </section>
  )
}
