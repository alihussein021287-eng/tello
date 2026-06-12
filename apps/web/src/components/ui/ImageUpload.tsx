"use client"
import { useState, useRef } from "react"
import Image from "next/image"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"
import { api } from "@/lib/api"
import toast from "react-hot-toast"

interface ImageUploadProps {
  value:    string[]
  onChange: (urls: string[]) => void
  max?:     number
  label?:   string
}

export function ImageUpload({ value = [], onChange, max = 5, label = "صور المنتج" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    if (value.length + files.length > max) {
      return toast.error(`أقصى عدد ${max} صور`)
    }

    setUploading(true)
    try {
      const form = new FormData()
      Array.from(files).forEach(f => form.append("files", f))

      const res  = await api.post("/api/upload/images", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      const urls = res.data.data.urls as string[]
      onChange([...value, ...urls])
      toast.success(`تم رفع ${urls.length} صورة`)
    } catch {
      toast.error("فشل رفع الصور")
    } finally {
      setUploading(false)
    }
  }

  const remove = (url: string) => {
    onChange(value.filter(u => u !== url))
    // حذف من MinIO في الخلفية
    api.delete("/api/upload/image", { data: { url } }).catch(() => {})
  }

  return (
    <div>
      {label && <label className="text-sm font-medium block mb-2">{label}</label>}

      <div className="flex flex-wrap gap-3">
        {/* صور موجودة */}
        {value.map((url, i) => (
          <div key={url} className="relative w-24 h-24 rounded-xl overflow-hidden border border-[var(--border)] group">
            <Image src={url} alt={`صورة ${i + 1}`} fill className="object-cover" />
            <button
              onClick={() => remove(url)}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
            >
              <X className="w-3 h-3" />
            </button>
            {i === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-0.5">
                رئيسية
              </span>
            )}
          </div>
        ))}

        {/* زر الرفع */}
        {value.length < max && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-24 h-24 border-2 border-dashed border-[var(--border)] hover:border-primary-400 rounded-xl flex flex-col items-center justify-center gap-1 text-[var(--text-muted)] hover:text-primary-500 transition-colors disabled:opacity-50"
          >
            {uploading
              ? <Loader2 className="w-6 h-6 animate-spin" />
              : <>
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">رفع صورة</span>
                </>
            }
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      <p className="text-xs text-[var(--text-muted)] mt-1.5">
        JPEG / PNG / WebP — حتى 5MB للصورة — أقصى {max} صور
      </p>
    </div>
  )
}

// مكون رفع صورة واحدة (للـ avatar والشعار)
interface SingleImageUploadProps {
  value?:    string
  onChange:  (url: string) => void
  label?:    string
  isAvatar?: boolean
}

export function SingleImageUpload({ value, onChange, label = "الصورة", isAvatar }: SingleImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)

      const endpoint = isAvatar ? "/api/upload/avatar" : "/api/upload/image"
      const res = await api.post(endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      onChange(isAvatar ? res.data.data.url : res.data.data.url)
      toast.success("تم رفع الصورة")
    } catch {
      toast.error("فشل رفع الصورة")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {label && <label className="text-sm font-medium block mb-2">{label}</label>}

      <div
        onClick={() => inputRef.current?.click()}
        className="relative w-28 h-28 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-primary-400 cursor-pointer overflow-hidden flex items-center justify-center bg-[var(--bg-soft)] transition-colors group"
      >
        {value ? (
          <>
            <Image src={value} alt="صورة" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="w-6 h-6 text-white" />
            </div>
          </>
        ) : uploading ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-[var(--text-muted)]">
            <ImageIcon className="w-6 h-6" />
            <span className="text-xs">رفع</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0] || null)}
      />
    </div>
  )
}
