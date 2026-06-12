import * as Minio from "minio"

const client = new Minio.Client({
  endPoint:  process.env.MINIO_ENDPOINT || "localhost",
  port:      Number(process.env.MINIO_PORT) || 9000,
  useSSL:    process.env.MINIO_SSL === "true",
  accessKey: process.env.MINIO_USER || "tello_admin",
  secretKey: process.env.MINIO_PASSWORD || "",
})

const BUCKET = "tello-products"
const PUBLIC_URL = process.env.MINIO_PUBLIC_URL || `https://storage.fshsmart.com`

// تأكد الـ bucket موجود
export async function ensureBucket() {
  const exists = await client.bucketExists(BUCKET)
  if (!exists) {
    await client.makeBucket(BUCKET)
    // اجعله public للقراءة
    await client.setBucketPolicy(BUCKET, JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${BUCKET}/*`],
      }],
    }))
  }
}

// رفع صورة
export async function uploadImage(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<string> {
  await ensureBucket()

  const ext  = filename.split(".").pop() || "jpg"
  const key  = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  await client.putObject(BUCKET, key, buffer, buffer.length, {
    "Content-Type": mimetype,
    "Cache-Control": "public, max-age=31536000",
  })

  return `${PUBLIC_URL}/${BUCKET}/${key}`
}

// حذف صورة
export async function deleteImage(url: string) {
  try {
    const key = url.replace(`${PUBLIC_URL}/${BUCKET}/`, "")
    await client.removeObject(BUCKET, key)
  } catch { /* ignore */ }
}

// رفع صورة avatar
export async function uploadAvatar(buffer: Buffer, userId: string): Promise<string> {
  await ensureBucket()
  const key = `avatars/${userId}.jpg`
  await client.putObject(BUCKET, key, buffer, buffer.length, { "Content-Type": "image/jpeg" })
  return `${PUBLIC_URL}/${BUCKET}/${key}`
}
