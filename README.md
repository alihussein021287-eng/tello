# 🏺 Tello — منصة التسوق الإلكتروني

> مستوحى من مدينة Tello السومرية العراقية القديمة

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile** | React Native + Expo SDK 52 |
| **Web** | Next.js 15 (App Router) |
| **Admin** | Next.js 15 |
| **API** | Bun + Hono |
| **AI** | Claude (Anthropic API) + Agentic Tools |
| **Database** | PostgreSQL + Prisma |
| **Cache** | Redis |
| **Storage** | MinIO |
| **Deploy** | Docker Compose + Nginx + VPS |

## هيكل المشروع

```
tello/
├── apps/
│   ├── web/      → fshsmart.com
│   ├── admin/    → admin.fshsmart.com
│   └── mobile/   → iOS + Android
├── services/
│   ├── api/      → api.fshsmart.com (Bun + Hono)
│   └── ai/       → AI Service (Claude)
├── packages/
│   ├── db/       → Prisma schema
│   └── types/    → Shared TypeScript types
└── infra/nginx/  → Nginx + SSL config
```

## Subdomains

| Domain | Service |
|--------|---------|
| `fshsmart.com` | موقع العملاء |
| `api.fshsmart.com` | REST API |
| `admin.fshsmart.com` | داشبورد الأدمن |
| `storage.fshsmart.com` | صور + ملفات (MinIO) |

## AI Features (Claude)

- 🔍 **Smart Search** — بحث يفهم اللهجة العراقية
- 💬 **Shopping Assistant** — chatbot مع streaming
- 🎯 **Recommendations** — توصيات شخصية
- 📊 **Admin Insights** — تحليل مبيعات تلقائي
- ✍️ **Product Description** — كتابة وصف بالعربي/الإنجليزي
- 🚨 **Anomaly Detection** — كشف طلبات مشبوهة

## بدء التشغيل على VPS

```bash
# 1. إعداد VPS
bash setup-vps.sh

# 2. تعديل المتغيرات
nano .env

# 3. تشغيل الكل
docker compose up -d

# 4. تهيئة DB
docker compose exec api bun run db:push
```

## بدء التطوير محلياً

```bash
# تثبيت
bun install

# تشغيل الكل
bun dev

# أو كل service بمفرده
cd services/api && bun dev      # :4000
cd services/ai  && bun dev      # :4001
cd apps/web     && bun dev      # :3000
cd apps/admin   && bun dev      # :3001
cd apps/mobile  && bun start    # Expo
```

## Mobile Build

```bash
cd apps/mobile

# تطوير
npx expo start

# Build للـ Android (APK)
eas build --platform android --profile preview

# Build للـ iOS
eas build --platform ios
```
