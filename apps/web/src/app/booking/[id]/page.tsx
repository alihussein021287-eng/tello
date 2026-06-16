"use client"
import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import toast from "react-hot-toast"
import { MapPin, Users, Star, BedDouble, Bath, Building2, Check, ArrowRight, Calendar } from "lucide-react"

const TYPE_AR: Record<string, string> = {
  HOTEL: "فندق", CHALET: "شاليه", APARTMENT: "شقة", HOUSE: "بيت", FARM: "مزرعة", HALL: "قاعة",
}

export default function PropertyDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [activeImg, setActiveImg] = useState(0)
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guests, setGuests] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: () => api.get(`/api/properties/${id}`).then(r => r.data),
  })
  const { data: reviewsData } = useQuery({
    queryKey: ["property-reviews", id],
    queryFn: () => api.get(`/api/properties/${id}/reviews`).then(r => r.data),
  })
  const p = data?.data
  const reviews = reviewsData?.data || []

  // حساب الليالي والسعر
  const nights = checkIn && checkOut
    ? Math.max(0, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0
  const total = nights * (p?.pricePerNight || 0)

  const bookMut = useMutation({
    mutationFn: () => api.post("/api/bookings", { propertyId: id, checkIn, checkOut, guests }).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إنشاء الحجز بنجاح! بانتظار تأكيد المالك")
      router.push("/booking/my-bookings")
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "تعذّر الحجز"),
  })

  const handleBook = () => {
    if (!checkIn || !checkOut) return toast.error("اختر تاريخ الدخول والخروج")
    if (nights < 1) return toast.error("تاريخ الخروج يجب أن يكون بعد الدخول")
    // تحقق من توكن الدخول
    const token = typeof window !== "undefined" ? localStorage.getItem("tello_token") : null
    if (!token) { toast.error("سجّل دخولك أولاً"); router.push("/auth/login"); return }
    bookMut.mutate()
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-[var(--text-muted)]">جاري التحميل...</div>
  if (!p) return <div className="min-h-screen flex items-center justify-center text-[var(--text-muted)]">العقار غير موجود</div>

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-4">
          <ArrowRight className="w-4 h-4" /> رجوع
        </button>

        {/* معرض الصور */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
          <div className="lg:col-span-2 aspect-[16/10] bg-[var(--bg-soft)] rounded-2xl overflow-hidden">
            {p.images?.[activeImg]
              ? <img src={p.images[activeImg]} alt={p.titleAr} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-16 h-16 text-[var(--text-muted)] opacity-30" /></div>
            }
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-2 gap-3">
            {(p.images || []).slice(0, 4).map((img: string, i: number) => (
              <button key={i} onClick={() => setActiveImg(i)} className={`aspect-square rounded-xl overflow-hidden border-2 ${activeImg === i ? "border-primary-500" : "border-transparent"}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* التفاصيل */}
          <div className="lg:col-span-2">
            <span className="inline-block bg-primary-500/10 text-primary-600 text-xs px-3 py-1 rounded-full mb-2">{TYPE_AR[p.type]}</span>
            <h1 className="text-2xl font-bold text-[var(--text)] mb-2">{p.titleAr}</h1>
            <div className="flex items-center gap-4 text-sm text-[var(--text-muted)] mb-4">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {p.city}{p.area ? ` — ${p.area}` : ""}</span>
              {p.reviewCount > 0 && (
                <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {p.avgRating.toFixed(1)} ({p.reviewCount} تقييم)</span>
              )}
            </div>

            {/* المواصفات */}
            <div className="flex gap-4 p-4 bg-[var(--bg-soft)] rounded-xl mb-4">
              <div className="flex items-center gap-2 text-sm"><Users className="w-5 h-5 text-primary-500" /> {p.maxGuests} أشخاص</div>
              <div className="flex items-center gap-2 text-sm"><BedDouble className="w-5 h-5 text-primary-500" /> {p.bedrooms} غرف</div>
              <div className="flex items-center gap-2 text-sm"><Bath className="w-5 h-5 text-primary-500" /> {p.bathrooms} حمام</div>
            </div>

            <h2 className="font-bold text-[var(--text)] mb-2">الوصف</h2>
            <p className="text-[var(--text-muted)] leading-relaxed mb-4">{p.descriptionAr || "لا يوجد وصف"}</p>

            {p.amenities?.length > 0 && (
              <>
                <h2 className="font-bold text-[var(--text)] mb-2">المرافق</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {p.amenities.map((a: string, i: number) => (
                    <span key={i} className="flex items-center gap-1 text-sm bg-[var(--bg-soft)] px-3 py-1.5 rounded-lg">
                      <Check className="w-4 h-4 text-green-500" /> {a}
                    </span>
                  ))}


                </div>
              </>
            )}

            {/* التقييمات */}
            <div className="pt-4 border-t border-[var(--border)] mt-4">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-bold text-[var(--text)]">التقييمات</h2>
                {p.reviewCount > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{p.avgRating.toFixed(1)}</span>
                    <span className="text-[var(--text-muted)]">({p.reviewCount} تقييم)</span>
                  </div>
                )}
              </div>
              {reviews.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">لا توجد تقييمات بعد — كن أول من يقيّم بعد إقامتك!</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="bg-[var(--bg-soft)] rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{r.user?.name || "زائر"}</span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-[var(--border)]"}`} />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-[var(--text-muted)]">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* صندوق الحجز */}
          <div className="lg:col-span-1">
            <div className="card p-5 sticky top-6">
              <div className="text-2xl font-bold text-primary-500 mb-1">
                {p.pricePerNight?.toLocaleString()} <span className="text-sm font-normal text-[var(--text-muted)]">د.ع / ليلة</span>
              </div>
              <div className="space-y-3 mt-4">
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1 mb-1"><Calendar className="w-3.5 h-3.5" /> تاريخ الدخول</label>
                  <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1 mb-1"><Calendar className="w-3.5 h-3.5" /> تاريخ الخروج</label>
                  <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1 mb-1"><Users className="w-3.5 h-3.5" /> عدد الأشخاص</label>
                  <input type="number" min={1} max={p.maxGuests} value={guests} onChange={e => setGuests(Number(e.target.value))} className="input" />
                </div>
              </div>

              {nights > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-1 text-sm">
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <span>{p.pricePerNight?.toLocaleString()} × {nights} ليالي</span>
                    <span>{total.toLocaleString()} د.ع</span>
                  </div>
                  <div className="flex justify-between font-bold text-[var(--text)] text-base pt-1">
                    <span>المجموع</span>
                    <span className="text-primary-500">{total.toLocaleString()} د.ع</span>
                  </div>
                </div>
              )}

              <button onClick={handleBook} disabled={bookMut.isPending} className="btn-primary w-full mt-4 py-3 disabled:opacity-50">
                {bookMut.isPending ? "جاري الحجز..." : "احجز الآن"}
              </button>
              <p className="text-xs text-[var(--text-muted)] text-center mt-2">لن يتم خصم أي مبلغ الآن</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
