export function validateEmail(email: string): string | null {
  const value = email.trim().toLowerCase()
  if (!value || value.length > 120) return '邮箱不能为空且不能超过 120 个字符。'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '请输入有效邮箱。'
  return null
}

export function validateHandle(handle: string): string | null {
  const value = handle.replace(/^@/, '').trim()
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(value)) {
    return '主页 ID 需 3–32 位，仅字母数字、下划线、点、短横线。'
  }
  return null
}

export function validatePassword(password: string): string | null {
  if (password.length < 8 || password.length > 72) {
    return '密码长度需在 8–72 个字符之间。'
  }
  return null
}

export function validateDisplayName(name: string): string | null {
  const value = name.replace(/\s+/g, ' ').trim()
  if (!value || value.length > 40) return '显示名称不能为空且不能超过 40 个字符。'
  return null
}
