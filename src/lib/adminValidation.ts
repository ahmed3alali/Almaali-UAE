import type { BlogPost, Doctor, GalleryItem, Service, Testimonial, VisionImages } from '../types';

export type FieldErrors = Record<string, string>;

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function validateLogin(email: string, password: string, isRtl: boolean): FieldErrors {
  const e: FieldErrors = {};
  if (!email.trim()) e.email = isRtl ? 'البريد مطلوب' : 'Email is required';
  else if (!emailOk(email)) e.email = isRtl ? 'بريد غير صالح' : 'Enter a valid email';
  if (!password) e.password = isRtl ? 'كلمة المرور مطلوبة' : 'Password is required';
  else if (password.length < 6) e.password = isRtl ? '٦ أحرف على الأقل' : 'At least 6 characters';
  return e;
}

export function validateBlog(b: Partial<BlogPost>, isRtl: boolean): FieldErrors {
  const e: FieldErrors = {};
  if (!b.title?.ar?.trim()) e['title.ar'] = isRtl ? 'العنوان بالعربية مطلوب' : 'Arabic title required';
  if (!b.title?.en?.trim()) e['title.en'] = isRtl ? 'العنوان بالإنجليزية مطلوب' : 'English title required';
  if (!b.content?.ar?.trim() || (b.content?.ar?.trim().length || 0) < 40) {
    e['content.ar'] = isRtl ? 'المحتوى بالعربية قصير جداً (٤٠ حرفاً على الأقل)' : 'Arabic content too short (min 40 chars)';
  }
  if (!b.content?.en?.trim() || (b.content?.en?.trim().length || 0) < 40) {
    e['content.en'] = isRtl ? 'المحتوى بالإنجليزية قصير جداً (٤٠ حرفاً على الأقل)' : 'English content too short (min 40 chars)';
  }
  if (!b.category?.ar?.trim()) e['category.ar'] = isRtl ? 'التصنيف بالعربية مطلوب' : 'Arabic category required';
  if (!b.category?.en?.trim()) e['category.en'] = isRtl ? 'التصنيف بالإنجليزية مطلوب' : 'English category required';
  if (!b.image?.trim()) e.image = isRtl ? 'صورة المقال مطلوبة' : 'Cover image is required';
  return e;
}

export function validateGallery(
  g: Partial<GalleryItem>,
  isRtl: boolean,
  categoryIds?: string[]
): FieldErrors {
  const e: FieldErrors = {};
  if (!g.title?.ar?.trim()) e['title.ar'] = isRtl ? 'العنوان بالعربية مطلوب' : 'Arabic title required';
  if (!g.title?.en?.trim()) e['title.en'] = isRtl ? 'العنوان بالإنجليزية مطلوب' : 'English title required';
  if (!g.category?.trim()) {
    e.category = isRtl ? 'اختر تصنيفاً' : 'Choose a category';
  } else if (categoryIds && categoryIds.length > 0 && !categoryIds.includes(g.category)) {
    e.category = isRtl ? 'تصنيف غير صالح' : 'Invalid category';
  }
  if (!g.image?.trim()) e.image = isRtl ? 'الصورة مطلوبة' : 'Image is required';
  return e;
}

export function validateGalleryCategory(
  c: Partial<{ id: string; label: { ar?: string; en?: string } }>,
  isRtl: boolean
): FieldErrors {
  const e: FieldErrors = {};
  if (!c.label?.ar?.trim()) e['label.ar'] = isRtl ? 'الاسم بالعربية مطلوب' : 'Arabic label required';
  if (!c.label?.en?.trim()) e['label.en'] = isRtl ? 'الاسم بالإنجليزية مطلوب' : 'English label required';
  return e;
}

export function validateDoctor(d: Partial<Doctor>, isRtl: boolean): FieldErrors {
  const e: FieldErrors = {};
  if (!d.name?.ar?.trim()) e['name.ar'] = isRtl ? 'الاسم بالعربية مطلوب' : 'Arabic name required';
  if (!d.name?.en?.trim()) e['name.en'] = isRtl ? 'الاسم بالإنجليزية مطلوب' : 'English name required';
  if (!d.image?.trim()) e.image = isRtl ? 'صورة الطبيب مطلوبة' : 'Doctor photo is required';
  return e;
}

export function validateService(s: Partial<Service>, isRtl: boolean): FieldErrors {
  const e: FieldErrors = {};
  if (!s.title?.ar?.trim()) e['title.ar'] = isRtl ? 'العنوان بالعربية مطلوب' : 'Arabic title required';
  if (!s.title?.en?.trim()) e['title.en'] = isRtl ? 'العنوان بالإنجليزية مطلوب' : 'English title required';
  if (!s.description?.ar?.trim()) e['description.ar'] = isRtl ? 'الوصف بالعربية مطلوب' : 'Arabic description required';
  if (!s.description?.en?.trim()) e['description.en'] = isRtl ? 'الوصف بالإنجليزية مطلوب' : 'English description required';
  if (!s.image?.trim()) e.image = isRtl ? 'صورة الخدمة مطلوبة' : 'Service image is required';
  return e;
}

export function validateTestimonial(t: Partial<Testimonial>, isRtl: boolean): FieldErrors {
  const e: FieldErrors = {};
  if (!t.name?.ar?.trim()) e['name.ar'] = isRtl ? 'الاسم بالعربية مطلوب' : 'Arabic name required';
  if (!t.name?.en?.trim()) e['name.en'] = isRtl ? 'الاسم بالإنجليزية مطلوب' : 'English name required';
  if (!t.comment?.ar?.trim()) e['comment.ar'] = isRtl ? 'التعليق بالعربية مطلوب' : 'Arabic comment required';
  if (!t.comment?.en?.trim()) e['comment.en'] = isRtl ? 'التعليق بالإنجليزية مطلوب' : 'English comment required';
  const rating = Number(t.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    e.rating = isRtl ? 'التقييم من ١ إلى ٥' : 'Rating must be 1–5';
  }
  return e;
}

export function validateVisionImages(v: Partial<VisionImages>, isRtl: boolean): FieldErrors {
  const e: FieldErrors = {};
  if (!v.imagePrimary?.trim()) {
    e.imagePrimary = isRtl ? 'الصورة الرئيسية مطلوبة' : 'Primary image is required';
  }
  if (!v.imageSecondary?.trim()) {
    e.imageSecondary = isRtl ? 'الصورة الثانوية مطلوبة' : 'Secondary image is required';
  }
  return e;
}

export function hasErrors(e: FieldErrors) {
  return Object.keys(e).length > 0;
}

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export function validateImageFile(file: File, isRtl: boolean): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return isRtl ? 'نوع الملف غير مدعوم (PNG / JPG / WEBP)' : 'Unsupported file type (PNG / JPG / WEBP)';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return isRtl ? 'حجم الصورة يتجاوز 2 ميجابايت' : 'Image exceeds 2MB limit';
  }
  return null;
}
