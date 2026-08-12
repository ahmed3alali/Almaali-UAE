import type { BlogPost, Doctor, GalleryItem } from '../types';

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
  if (!b.excerpt?.ar?.trim()) e['excerpt.ar'] = isRtl ? 'النبذة بالعربية مطلوبة' : 'Arabic excerpt required';
  if (!b.excerpt?.en?.trim()) e['excerpt.en'] = isRtl ? 'النبذة بالإنجليزية مطلوبة' : 'English excerpt required';
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

export function validateGallery(g: Partial<GalleryItem>, isRtl: boolean): FieldErrors {
  const e: FieldErrors = {};
  if (!g.title?.ar?.trim()) e['title.ar'] = isRtl ? 'العنوان بالعربية مطلوب' : 'Arabic title required';
  if (!g.title?.en?.trim()) e['title.en'] = isRtl ? 'العنوان بالإنجليزية مطلوب' : 'English title required';
  if (!g.category || !['clinic', 'cases'].includes(g.category)) {
    e.category = isRtl ? 'اختر تصنيفاً صالحاً' : 'Choose a valid category';
  }
  if (!g.image?.trim()) e.image = isRtl ? 'الصورة مطلوبة' : 'Image is required';
  return e;
}

export function validateDoctor(d: Partial<Doctor>, isRtl: boolean): FieldErrors {
  const e: FieldErrors = {};
  if (!d.name?.ar?.trim()) e['name.ar'] = isRtl ? 'الاسم بالعربية مطلوب' : 'Arabic name required';
  if (!d.name?.en?.trim()) e['name.en'] = isRtl ? 'الاسم بالإنجليزية مطلوب' : 'English name required';
  if (!d.role?.ar?.trim()) e['role.ar'] = isRtl ? 'التخصص بالعربية مطلوب' : 'Arabic role required';
  if (!d.role?.en?.trim()) e['role.en'] = isRtl ? 'التخصص بالإنجليزية مطلوب' : 'English role required';
  if (!d.bio?.ar?.trim() || (d.bio?.ar?.trim().length || 0) < 20) {
    e['bio.ar'] = isRtl ? 'السيرة بالعربية قصيرة جداً' : 'Arabic bio too short';
  }
  if (!d.bio?.en?.trim() || (d.bio?.en?.trim().length || 0) < 20) {
    e['bio.en'] = isRtl ? 'السيرة بالإنجليزية قصيرة جداً' : 'English bio too short';
  }
  if (!d.education?.ar?.trim()) e['education.ar'] = isRtl ? 'التعليم بالعربية مطلوب' : 'Arabic education required';
  if (!d.education?.en?.trim()) e['education.en'] = isRtl ? 'التعليم بالإنجليزية مطلوب' : 'English education required';
  if (!d.image?.trim()) e.image = isRtl ? 'صورة الطبيب مطلوبة' : 'Doctor photo is required';
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
