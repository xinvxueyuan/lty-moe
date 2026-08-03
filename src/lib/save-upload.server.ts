import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

export const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'] as const
export const maxImageBytes = 10 * 1024 * 1024

export type SavedUpload = {
  url: string
  filename: string
  size: number
  contentType: string
}

export function resolveImageExtension(
  fileName: string,
): (typeof imageExtensions)[number] | undefined {
  return imageExtensions.find((ext) => fileName.toLowerCase().endsWith(ext))
}

export function getUploadsDir(): string {
  return process.env.UPLOADS_DIR || resolve(process.cwd(), 'uploads')
}

export async function saveUploadFile(file: File, prefix = 'img'): Promise<SavedUpload> {
  const extension = resolveImageExtension(file.name) ?? '.png'
  const uploadsDir = getUploadsDir()
  mkdirSync(uploadsDir, { recursive: true })
  const filename = `${prefix}-${Date.now().toString(36)}${extension}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(join(uploadsDir, filename), buffer)
  return {
    url: `/uploads/${filename}`,
    filename,
    size: buffer.byteLength,
    contentType: file.type || `image/${extension.slice(1)}`,
  }
}

export function validateImageFile(file: unknown): { file?: File; errors: string[] } {
  const errors: string[] = []
  const hasFile = file instanceof File && file.size > 0
  if (!hasFile) {
    errors.push('请选择一张图片。')
    return { errors }
  }
  const extension = resolveImageExtension(file.name)
  if (!extension) errors.push('图片格式必须是 PNG、JPG、WebP、GIF 或 AVIF。')
  if (file.size > maxImageBytes) errors.push('图片大小不能超过 10MB。')
  if (errors.length) return { errors }
  return { file, errors }
}
