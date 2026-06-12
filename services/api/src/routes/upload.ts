import { Hono } from "hono"
import { authMiddleware } from "../middleware/auth"
import { uploadImage, uploadAvatar, deleteImage } from "../lib/storage"

export const uploadRoutes = new Hono()
uploadRoutes.use("*", authMiddleware)

const MAX_SIZE = 5 * 1024 * 1024  // 5MB
const ALLOWED  = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

// رفع صورة منتج واحدة
uploadRoutes.post("/image", async (c) => {
  const formData = await c.req.formData()
  const file     = formData.get("file") as File | null

  if (!file) return c.json({ success: false, message: "لا توجد صورة" }, 400)
  if (!ALLOWED.includes(file.type)) {
    return c.json({ success: false, message: "نوع الملف غير مدعوم (JPEG/PNG/WebP فقط)" }, 400)
  }
  if (file.size > MAX_SIZE) {
    return c.json({ success: false, message: "حجم الصورة يجب أن يكون أقل من 5MB" }, 400)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const url    = await uploadImage(buffer, file.name, file.type)

  return c.json({ success: true, data: { url } })
})

// رفع عدة صور (حتى 10)
uploadRoutes.post("/images", async (c) => {
  const formData = await c.req.formData()
  const files    = formData.getAll("files") as File[]

  if (!files.length) return c.json({ success: false, message: "لا توجد صور" }, 400)
  if (files.length > 10) return c.json({ success: false, message: "أقصى عدد 10 صور" }, 400)

  const urls: string[] = []
  for (const file of files) {
    if (!ALLOWED.includes(file.type) || file.size > MAX_SIZE) continue
    const buffer = Buffer.from(await file.arrayBuffer())
    const url    = await uploadImage(buffer, file.name, file.type)
    urls.push(url)
  }

  return c.json({ success: true, data: { urls } })
})

// حذف صورة
uploadRoutes.delete("/image", async (c) => {
  const { url } = await c.req.json()
  if (!url) return c.json({ success: false, message: "URL مطلوب" }, 400)
  await deleteImage(url)
  return c.json({ success: true })
})

// رفع avatar المستخدم
uploadRoutes.post("/avatar", async (c) => {
  const userId   = c.get("userId")
  const formData = await c.req.formData()
  const file     = formData.get("file") as File | null

  if (!file) return c.json({ success: false, message: "لا توجد صورة" }, 400)
  if (!ALLOWED.includes(file.type)) return c.json({ success: false, message: "نوع غير مدعوم" }, 400)

  const buffer = Buffer.from(await file.arrayBuffer())
  const url    = await uploadAvatar(buffer, userId)

  return c.json({ success: true, data: { url } })
})
