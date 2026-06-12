"use client"
import { useState } from "react"
import { Topbar } from "@/components/layout/Topbar"
import { Save, Store, Percent, Bell, Shield, Globe } from "lucide-react"
import toast from "react-hot-toast"

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName:         "Tello",
    siteNameAr:       "تيلو",
    commissionRate:   "10",
    minOrderFreeShip: "50000",
    shippingBaghdad:  "5000",
    shippingProvince: "8000",
    whatsapp:         "9647xxxxxxxx",
    supportEmail:     "support@fshsmart.com",
    maintenanceMode:  false,
    allowNewVendors:  true,
  })

  const save = () => {
    // يُحفظ في Redis/DB لاحقاً
    localStorage.setItem("tello_settings", JSON.stringify(settings))
    toast.success("تم حفظ الإعدادات")
  }

  const SECTIONS = [
    {
      icon: <Store className="w-4 h-4" />,
      title: "إعدادات المتجر",
      fields: [
        { key: "siteName",   label: "اسم المتجر (EN)",    type: "text" },
        { key: "siteNameAr", label: "اسم المتجر (AR)",    type: "text" },
        { key: "supportEmail", label: "بريد الدعم",       type: "email" },
        { key: "whatsapp",   label: "رقم واتساب الدعم",   type: "text" },
      ],
    },
    {
      icon: <Percent className="w-4 h-4" />,
      title: "العمولات والتوصيل",
      fields: [
        { key: "commissionRate",   label: "نسبة العمولة %",        type: "number" },
        { key: "minOrderFreeShip", label: "حد الشحن المجاني (د.ع)", type: "number" },
        { key: "shippingBaghdad",  label: "توصيل بغداد (د.ع)",      type: "number" },
        { key: "shippingProvince", label: "توصيل المحافظات (د.ع)",   type: "number" },
      ],
    },
  ]

  return (
    <>
      <Topbar title="إعدادات المنصة" />
      <div className="p-6 max-w-2xl space-y-5">

        {SECTIONS.map(({ icon, title, fields }) => (
          <div key={title} className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/20 text-primary-500 rounded-lg flex items-center justify-center">
                {icon}
              </div>
              <h3 className="font-semibold text-sm">{title}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {fields.map(({ key, label, type }) => (
                <div key={key}>
                  <label className="text-xs font-medium block mb-1 text-[var(--text-muted)]">{label}</label>
                  <input
                    type={type}
                    value={(settings as any)[key]}
                    onChange={e => setSettings(s => ({...s, [key]: e.target.value}))}
                    className="input text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Toggles */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/20 text-primary-500 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm">الإعدادات العامة</h3>
          </div>
          <div className="space-y-3">
            {[
              { key: "allowNewVendors", label: "السماح بتسجيل بائعين جدد", desc: "عند التعطيل لن تظهر صفحة التسجيل" },
              { key: "maintenanceMode", label: "وضع الصيانة", desc: "يعرض صفحة صيانة للزوار" },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                </div>
                <div
                  onClick={() => setSettings(s => ({...s, [key]: !(s as any)[key]}))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${(settings as any)[key] ? "bg-primary-500" : "bg-[var(--border)]"}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${(settings as any)[key] ? "end-0.5" : "start-0.5"}`} />
                </div>
              </label>
            ))}
          </div>
        </div>

        <button onClick={save} className="btn-primary w-full flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          حفظ الإعدادات
        </button>
      </div>
    </>
  )
}
