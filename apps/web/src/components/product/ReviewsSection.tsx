"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Star, ThumbsUp, MessageCircle, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store"
import { useTranslations } from "next-intl"
import toast from "react-hot-toast"

interface ReviewsSectionProps {
  productId: string
  orderId?:  string  // لو الزبون اشترى
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              s <= (hover || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-[var(--border)]"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export function ReviewsSection({ productId, orderId }: ReviewsSectionProps) {
  const { isLoggedIn } = useAuthStore()
  const qc = useQueryClient()
  const [rating,  setRating]  = useState(5)
  const [comment, setComment] = useState("")
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading, fetchNextPage, hasNextPage } = useQuery({
    queryKey: ["reviews", productId],
    queryFn:  () => api.get(`/api/reviews/product/${productId}`).then(r => r.data),
  })

  const submitMut = useMutation({
    mutationFn: () => api.post("/api/reviews", { productId, orderId, rating, comment }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", productId] })
      toast.success("شكراً على تقييمك! ⭐")
      setShowForm(false)
      setComment("")
      setRating(5)
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "حدث خطأ"),
  })

  const reviews      = data?.data         || []
  const avgRating    = data?.avgRating    || 0
  const total        = data?.total        || 0
  const distribution = data?.distribution || []

  return (
    <div className="space-y-6">

      {/* Summary */}
      <div className="card p-6">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary-500" />
          التقييمات ({total})
        </h2>

        {total > 0 && (
          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            {/* Average */}
            <div className="text-center">
              <p className="text-5xl font-bold text-[var(--text)]">{avgRating.toFixed(1)}</p>
              <StarRating value={Math.round(avgRating)} />
              <p className="text-xs text-[var(--text-muted)] mt-1">{total} تقييم</p>
            </div>

            {/* Distribution */}
            <div className="flex-1 space-y-1.5">
              {distribution.map(({ star, count }: any) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-end text-[var(--text-muted)]">{star}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                  <div className="flex-1 h-2 bg-[var(--bg-soft)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: total ? `${(count / total) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="w-6 text-[var(--text-muted)]">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Write Review Button */}
        {isLoggedIn() && orderId && !showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Star className="w-4 h-4" />
            اكتب تقييمك
          </button>
        )}

        {/* Review Form */}
        {showForm && (
          <div className="border border-[var(--border)] rounded-xl p-4 space-y-3 mt-2">
            <p className="font-semibold text-sm">تقييمك للمنتج</p>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1.5">تقييمك</p>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1.5">تعليقك (اختياري)</p>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="input min-h-[80px] resize-none text-sm"
                placeholder="شاركنا رأيك بالمنتج..."
                maxLength={500}
              />
              <p className="text-xs text-[var(--text-muted)] text-end mt-0.5">{comment.length}/500</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1 border border-[var(--border)] text-sm">إلغاء</button>
              <button
                onClick={() => submitMut.mutate()}
                disabled={submitMut.isPending}
                className="btn-primary flex-1 text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitMut.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                نشر التقييم
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({length: 3}).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--border)] rounded-full" />
                <div className="h-3 bg-[var(--border)] rounded w-24" />
              </div>
              <div className="h-3 bg-[var(--border)] rounded w-full" />
              <div className="h-3 bg-[var(--border)] rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {reviews.map((r: any) => (
          <div key={r.id} className="card p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 text-xs font-bold">
                    {r.user?.name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{r.user?.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(r.createdAt).toLocaleDateString("ar-IQ")}
                  </p>
                </div>
              </div>
              <StarRating value={r.rating} />
            </div>
            {r.comment && (
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{r.comment}</p>
            )}
          </div>
        ))}

        {!isLoading && reviews.length === 0 && (
          <div className="text-center py-10 text-[var(--text-muted)]">
            <Star className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">لا توجد تقييمات بعد — كن أول من يقيّم!</p>
          </div>
        )}
      </div>
    </div>
  )
}
