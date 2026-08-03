import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { logger } from './logger.server'
import { renderEmailTemplate, type EmailTemplateId } from '../email/templates'

export type SendMailInput = {
  to: string
  template: EmailTemplateId
  vars: Record<string, string>
}

export async function sendMail(input: SendMailInput): Promise<void> {
  const rendered = renderEmailTemplate(input.template, input.vars)
  const payload = {
    to: input.to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    at: new Date().toISOString(),
  }

  // Dev / default: persist to disk for inspection
  const dir = process.env.MAIL_DIR || join(process.cwd(), 'logs', 'mail')
  mkdirSync(dir, { recursive: true })
  const file = join(dir, `${Date.now()}-${input.template}.json`)
  writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8')
  logger.info('mail', `email queued: ${input.template}`, { to: input.to, file })

  const webhook = process.env.MAIL_WEBHOOK_URL
  if (webhook) {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.MAIL_WEBHOOK_TOKEN
          ? { authorization: `Bearer ${process.env.MAIL_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      logger.error('mail', 'webhook failed', { status: response.status })
      throw new Error(`Mail webhook failed: ${response.status}`)
    }
  }
}

export function appBaseUrl(request?: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '')
  if (request) {
    const url = new URL(request.url)
    return `${url.protocol}//${url.host}`
  }
  return 'http://127.0.0.1:3000'
}
