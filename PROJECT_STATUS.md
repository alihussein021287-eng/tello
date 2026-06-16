# 📋 Tello — حالة المشروع (مرجع كامل)

> آخر تحديث: 2026-06-13 | منصة تجارة إلكترونية multi-vendor عراقية

## 🌐 معلومات أساسية
- **الموقع:** fshsmart.com | **API:** api.fshsmart.com | **الأدمن:** admin.fshsmart.com
- **التخزين:** storage.fshsmart.com (MinIO) | **n8n:** n8n.fshsmart.com
- **المسار:** /opt/tello | **GitHub:** github.com/alihussein021287-eng/tello

## 🏗️ التقنيات
- **Backend:** Bun + Hono + Prisma + PostgreSQL + Redis (services/api)
- **AI:** خدمة منفصلة (services/ai) — Claude + OpenAI GPT Image، بورت 4001
- **Frontend:** Next.js 15 (apps/web) + لوحة أدمن (apps/admin)
- **Mobile:** React Native + Expo (apps/mobile + apps/vendor-mobile)
- **Infra:** Docker Compose + Nginx + Let's Encrypt SSL

## 🔑 أوامر مهمة
- DB: `docker compose exec -T postgres psql -U tello -d tello_db`
- بناء خدمة: `docker compose up -d --build [api|web|admin|ai]`
- Prisma push: حاوية node مؤقتة على tello_tello-network
- MinIO: المستخدم tello_minio / tello_minio_pass

## ✅ المنجز (محدّث)

### نظام الإشعارات (Redis+SSE) — مكتمل ومُختبَر
- جرس لكل الأطراف: الزبون (جرس الموقع)، البائع (جرس الداشبورد)، الأدمن (جرس اللوحة)
- أحداث: طلب جديد، تغيير حالة، بائع جديد، منتج جديد
- ضغط الإشعار = تنقّل سلس + تعليم مقروء
- ملفات: services/api/src/routes/notifications.ts، NotificationBell.tsx، Topbar.tsx

### موافقة المنتجات — مكتمل ومُختبَر
- حقل Product.status (PENDING/APPROVED/REJECTED)
- منتج البائع → PENDING (مخفي) + إشعار الأدمن
- الموقع يعرض APPROVED فقط
- صفحة الأدمن: تبويبات + أزرار موافقة/رفض

### إدارة البائع — مكتمل
- البائع يغيّر حالة طلبه (CONFIRMED/PREPARING/SHIPPING) + إشعار الزبون
- استيراد بالجملة عبر CSV (POST /api/vendor/products/bulk)

### الذكاء الاصطناعي (5 ميزات) — مكتمل ومُختبَر
1. مراجعة منتج ذكية (POST /api/ai/admin/review-product) — توصية للأدمن
2. توليد منتج كامل (POST /api/ai/admin/generate-product) — اسم→كل التفاصيل
3. مساعد أدمن تفاعلي (POST /api/ai/admin/ask) — يقرأ بيانات المتجر
4. تحسين/ترجمة الوصف (POST /api/ai/admin/improve-description)
5. توليد صور المنتجات (POST /api/ai/admin/generate-image) — Claude + GPT Image → MinIO
- كلها بفورم البائع + لوحة الأدمن

### إصلاحات مهمة
- تطابق بيانات MinIO (رفع الصور كان معطّلاً تماماً)
- زيادة client_max_body_size لـ api.fshsmart.com (Nginx) → 20M
- timeout axios للطلبات الـ AI → 60-120 ثانية

### سابقاً
- تنظيف الموقع (مكررات، صور، تخفيضات، إحصائيات)
- واتساب تأكيد الطلب (n8n + Twilio)

## ⚠️ أمان — مطلوب تغييره (انكشف بالمحادثات)
- [ ] Twilio Auth Token
- [ ] كلمة سر الأدمن (admin@fshsmart.com)
- [ ] x-internal-key
- [ ] مراقبة رصيد OpenAI (~$0.04/صورة)

## 🔮 أفكار مستقبلية (لم تُنفّذ)
- تقرير أرباح دقيق للبائع (مبيعات/عمولة/صافي)
- تنبيه مخزون منخفض (إشعار للبائع)
- صفحة متجر البائع العامة (/store/[vendorId])
- موافقة/رفض البائعين الجدد (مثل المنتجات)
- نظام سحب الأرباح (payout)
- ربط API مباشر للبائعين (المرحلة 2 من الاستيراد)
- إصلاح APK الموبايل (blue screen — expo-build-properties)

## 📝 ملاحظات
- كل العمل الفعلي على VPS (مو بيئة Claude)
- اللغة: عربي عراقي
- بعد كل تعديل: rebuild الخدمة المعنية

---

# 🏨 منصة الحجوزات (Booking) — جديد (2026-06-14)

## القرار المعماري
- **monorepo** على نفس السيرفر/الدومين/قاعدة البيانات (مشترك مع Tello)
- جداول بـ prefix منفصلة (Property/Booking) — لا تتعارض مع Tello (Product/Order)
- نفس User يخدم الاثنين (زبون متجر = زبون حجوزات)

## نموذج البيانات (مطبّق ✓)
- **PropertyType:** HOTEL/CHALET/APARTMENT/HOUSE/FARM/HALL (نوع واحد يخدم الكل)
- **PropertyStatus:** PENDING/APPROVED/REJECTED/INACTIVE
- **BookingStatus:** PENDING/CONFIRMED/CHECKED_IN/COMPLETED/CANCELLED
- **Models:** PropertyOwner، Property، Booking، PropertyReview
- مربوطة بـ User (propertyOwner/bookings/propertyReviews)

## API (مبني ومُختبَر ✓) — بنفس خدمة api الموجودة
- **/api/properties** (عام): قائمة + بحث/فلترة (type/city/price/guests) + تفاصيل + التحقق من التوفّر
- **/api/property-owner** (ownerOnly): تسجيل + إضافة/تعديل/حذف عقار (PENDING) + حجوزاته + تغيير حالة
- **/api/bookings** (مصادق): إنشاء حجز (مع منع التعارض) + حجوزاتي + تفاصيل + إلغاء
- ملفات: services/api/src/routes/{properties,property-owner,bookings}.ts
- مسجّلة بـ index.ts

## مُختبَر بنجاح ✓
- تسجيل مالك + إضافة شاليه + موافقة + ظهور بالقائمة
- حجز (حساب الليالي والسعر تلقائي) + **منع التعارض (الحجز المزدوج مرفوض)**

## الواجهة (Frontend) — مكتملة ومُختبَرة بصرياً ✓ (2026-06-16)
5 صفحات احترافية بمسار /booking داخل apps/web (بنفس ستايل Tello):
- /booking — تصفّح العقارات (Hero + بحث + فلاتر نوع + شبكة بطاقات + skeleton)
- /booking/[id] — تفاصيل + حجز (معرض صور + مواصفات + مرافق + صندوق حجز ثابت مع حساب تلقائي)
- /booking/my-bookings — حجوزات الزبون (حالات ملوّنة + إلغاء)
- /booking/owner — لوحة المالك (تسجيل + قائمة عقارات + فورم إضافة شامل مع رفع صور + توليد صورة AI)
- /booking/owner/bookings — حجوزات المالك (تأكيد/رفض/تسجيل دخول/إنهاء حسب الحالة)
- رابط "🏨 الحجوزات" مضاف للهيدر الرئيسي (Header.tsx)
- توليد صور العقارات يعيد استخدام /api/ai/admin/generate-image + /api/upload/base64

## الناقص (الخطوات الجاية)
- [ ] صفحة موافقة العقارات بلوحة الأدمن (الحين عبر SQL: UPDATE "Property" SET status='APPROVED')
- [ ] subdomain: booking.fshsmart.com (Nginx + SSL) — اختياري
- [ ] إشعارات الحجز (نعيد استخدام نظام Tello)
- [ ] دفع/عربون
- [ ] المراحل التالية: سيارات، قاعات، دليل سياحي

## ملاحظة
- العقار التجريبي "شاليه فاخر على البحيرة" (CHALET، بغداد/الحبانية) موجود APPROVED للعرض

## ✅ اختبار شامل نهائي (2026-06-16)
دورة الحجز الكاملة مُختبَرة وتعمل:
- المالك يضيف عقار → الأدمن يوافق → يظهر للزبائن → الزبون يحجز (منع تعارض) → المالك يؤكّد/يرفض → الزبون يتابع
- العزل صحيح: كل مالك يرى حجوزات عقاراته فقط
- ملاحظة: admin مالك "شاليه فاخر على البحيرة"؛ ali.hussein مالك "شاليه فاخر" + هو من عمل الحجوزات الـ3 (كزبون) على عقار admin

## 🔍⭐ تطوير صفحة الحجوزات (2026-06-16) — مُختبَر بصرياً ✓
- API: ترتيب (sort: newest/price_asc/price_desc) + فلتر سعر/أشخاص
- endpoints التقييمات: GET /properties/:id/reviews، POST /bookings/:id/review (بشرط COMPLETED/CHECKED_IN)
- التصفّح: شريط ترتيب + فلتر سعر (من/إلى) + عدد النتائج + مسح الفلاتر
- التفاصيل: قسم التقييمات (متوسط + قائمة نجوم)
- حجوزاتي: زر "⭐ قيّم إقامتك" + نافذة تقييم (نجوم + تعليق)
