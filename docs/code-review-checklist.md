# قائمة تدقيق جودة الكود — Al Maali Clinics

> مبنية على Senior Next.js Review Checklist، مكيّفة لمشروع Vite + React + Supabase.

---

## 1. هيكل المشروع ✅

- [x] تقسيم المجلدات واضح — `components/`, `lib/`, `assets/`
- [x] المكونات مفصولة بشكل مناسب (10 ملفات مكونات)
- [x] الثوابت والـ helpers منفصلة (`data.ts`, `types.ts`, `supabase.ts`)
- [x] منطق API مفصول عن UI (`supabase.ts`)

## 2. جودة الكود

- [x] أسماء متغيرات ودوال ذات معنى
- [x] `console.error` فقط في الإنتاج (تم إزالة `console.warn` في بعض الأماكن)
- [ ] **إزالة** `console.warn` من `supabase.ts` (أسطر 85, 167, 238) — يمكن تحويلها لـ `console.error`
- [x] تنسيق متسق
- [x] TypeScript مستخدم بشكل صحيح

## 3. المكونات

- [ ] **`AdminDashboard.tsx` كبير جدًا** (1613 سطر) — يستحق التقسيم لمكونات أصغر
- [ ] **`Blog.tsx` كبير** (569 سطر) — يحتوي 3 Views مختلفة في ملف واحد
- [ ] **`Gallery.tsx`** (329 سطر) — على حافة الحد
- [x] Props واضحة ومكتوبة
- [ ] بعض المكونات تفتقر `keyboard-focus` (Services cards, Blog articles)

## 4. Routing

- [x] التوجيه يعمل عبر `hash` — مناسب للموقع بدون backend
- [x] 404 page غير موجودة (لازم يضاف)
- [x] لا يوجد حماية للمسارات (admin فقط عبر كلمة سر)

## 5. إدارة الحالة

- [x] State محلي في الغالب — مناسب
- [ ] `App.tsx` يحمل state كثير (عناوين، أطباء، صور، مقالات، لغة)
- [x] لا إعادة render غير ضرورية

## 6. API & Data Fetching

- [x] استدعاءات Supabase منظمة في `supabase.ts`
- [ ] **Loading states مفقودة** في Gallery, Team — لا Skeleton/spinner أثناء تحميل البيانات
- [x] Error handling موجود لكن عبر `console.warn` وليس للمستخدم
- [x] `anon key` مكشوف في `.env` — هذا متوقع من Supabase (مصمم كذا)

## 7. الأمان ✅ (مطبقة من القائمة السابقة)

- [x] SHA-256 hash لرمز الدخول بدل النص الصريح
- [x] RLS policies مصححة في SQL schema
- [x] `.env` في `.gitignore` ✅

## 8. الأداء

- [x] الصور المحلية مستوردة بشكل صحيح (تم الإصلاح)
- [x] Lazy loading موجود (Vite builds)
- [ ] لا يوجد `React.lazy()` أو `Suspense` للمكونات الكبيرة

## 9. واجهة المستخدم

- [x] تصميم متجاوب (mobile, tablet, desktop)
- [x] ألوان وتنسيقات متسقة
- [x] حالات فارغة موجودة (Blog, Gallery, AdminDashboard)
- [ ] رسائل الخطأ غير واضحة دائمًا — معظمها في `console.warn` فقط

## 10. الوصولية (Accessibility)

- [x] جميع الصور لها `alt` text (تم إصلاح 3 صور)
- [ ] عناصر تفاعلية بدون `role="button"` (Services cards، Blog articles)
- [ ] التركيز (focus) غير مرئي في بعض الأزرار
- [ ] لا ARIA tags متقدمة (مثل `aria-current`)

## 11. النماذج (Forms)

- [x] Validation موجود (`required`)
- [ ] **لا `minLength`/`maxLength`** على الحقول
- [ ] **صورة بدون validation** — لا تحقق من الحجم أو النوع فعليًا
- [x] Submit button يعرض حالة التحميل ✅
- [ ] زر الإرسال يمنع الإرسال المتكرر — حاليًا `isSaving` يمنع النقر فقط

## 12. البيئة والنشر

- [x] `.env.example` موجود ✅
- [x] `.env` في `.gitignore` ✅
- [x] `npm run build` يشتغل
- [x] `npm run dev` يشتغل

## 13. الاختبارات

- [ ] لا يوجد اختبارات آلية (unit/integration)
- [ ] الاختبارات اليدوية تغطي: تدفق المستخدمين، الفورم، التجاوب

---

## الملفات المعدلة في هذه المراجعة

| الملف | التعديل |
|-------|---------|
| `src/components/AdminDashboard.tsx` | SHA-256 بدل النص الصريح، إزالة dead code (235 سطر)، إزالة `Key` import، إضافة alt texts |
| `src/lib/supabase.ts` | تحديث RLS policies |
| `src/data.ts` | إصلاح مسارات الصور (import), تصحيح `interactiveInteractive` → `interactive` |
| `src/components/Footer.tsx` | إصلاح رابط `contact` → `footer` |
| `src/components/Header.tsx` | إزالة `Calendar` import غير مستخدم |
| `src/components/Blog.tsx` | إزالة 4 imports غير مستخدمة، إزالة `filteredBlogs` المكرر |
| `src/components/Services.tsx` | إزالة `Service` type import غير مستخدم |
| `src/components/Gallery.tsx` | إصلاح `NodeJS.Timeout` → `ReturnType<typeof setInterval>` |
| `docs/security-checklist.md` | ملف جديد — قائمة أمنية عربي |
| `docs/code-review-checklist.md` | ملف جديد — هذه القائمة |
