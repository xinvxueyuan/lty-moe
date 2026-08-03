export type EmailTemplateId = 'verify-email' | 'reset-password' | 'welcome'

type Rendered = { subject: string; text: string; html: string }

function layout(title: string, bodyHtml: string, bodyText: string): Rendered {
  return {
    subject: title,
    text: bodyText,
    html: `<!doctype html>
<html><body style="font-family:system-ui,sans-serif;background:#0e141a;color:#f0f4f1;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#17212a;border:1px solid #2a3942;border-radius:16px;padding:28px">
    <p style="color:#71e2e8;letter-spacing:.08em;font-size:12px">LTY-MOE / 天依档案</p>
    <h1 style="font-size:22px;margin:8px 0 16px">${title}</h1>
    ${bodyHtml}
    <p style="color:#68777e;font-size:12px;margin-top:28px">若非你本人操作，请忽略本邮件。</p>
  </div>
</body></html>`,
  }
}

export function renderEmailTemplate(id: EmailTemplateId, vars: Record<string, string>): Rendered {
  if (id === 'verify-email') {
    return layout(
      '验证你的邮箱 / Verify your email',
      `<p>你好 ${vars.name || ''}，</p><p>请点击下方链接完成邮箱验证：</p>
       <p><a href="${vars.url}" style="color:#71e2e8">${vars.url}</a></p>`,
      `验证邮箱：${vars.url}`,
    )
  }
  if (id === 'reset-password') {
    return layout(
      '重置密码 / Reset password',
      `<p>你好 ${vars.name || ''}，</p><p>请在一小时内使用以下链接重置密码：</p>
       <p><a href="${vars.url}" style="color:#ff77ad">${vars.url}</a></p>`,
      `重置密码：${vars.url}`,
    )
  }
  return layout(
    '欢迎来到天依档案 / Welcome',
    `<p>你好 ${vars.name || ''}，欢迎加入档案。</p>
     <p><a href="${vars.url}" style="color:#71e2e8">打开仪表盘</a></p>`,
    `欢迎加入：${vars.url}`,
  )
}
