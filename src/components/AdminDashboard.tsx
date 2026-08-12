/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Lock,
  LayoutDashboard,
  BookOpen,
  Image as ImageIcon,
  Users,
  Trash2,
  Edit3,
  Plus,
  Save,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Mail,
  ShieldAlert,
  Eye,
  EyeOff,
  Search,
  Wifi,
  WifiOff,
  BarChart3,
  Sparkles,
  Star,
  ScanEye,
} from 'lucide-react';
import {
  Language,
  BlogPost,
  GalleryItem,
  GalleryCategory,
  Doctor,
  Service,
  Testimonial,
  VisionImages,
} from '../types';
import {
  isSupabaseConfigured,
  saveBlogPostToSupabase,
  deleteBlogPostFromSupabase,
  saveGalleryItemToSupabase,
  deleteGalleryItemFromSupabase,
  saveDoctorToSupabase,
  deleteDoctorFromSupabase,
  uploadBase64Image,
  signInAdmin,
  signOutAdmin,
  getAdminSession,
  onAuthStateChange,
  migrateBase64ImagesToStorage,
  fetchDoctorsFromSupabase,
  fetchGalleryItemsFromSupabase,
  fetchBlogPostsFromSupabase,
  ensureStorageBucket,
  saveGalleryCategoryToSupabase,
  deleteGalleryCategoryFromSupabase,
  saveServiceToSupabase,
  deleteServiceFromSupabase,
  saveTestimonialToSupabase,
  deleteTestimonialFromSupabase,
  saveVisionImagesToSupabase,
} from '../lib/supabase';
import {
  AdminField,
  AdminInput,
  AdminTextarea,
  AdminSelect,
  AdminDrawer,
  AdminConfirm,
  AdminToast,
  AdminDropzone,
} from './admin/AdminUI';
import {
  validateLogin,
  validateBlog,
  validateGallery,
  validateGalleryCategory,
  validateDoctor,
  validateService,
  validateTestimonial,
  validateVisionImages,
  hasErrors,
  type FieldErrors,
} from '../lib/adminValidation';
import { slugifyCategoryId } from '../lib/galleryCategories';
import { IMAGES } from '../lib/images';
import { cn } from '../lib/utils';

interface AdminDashboardProps {
  lang: Language;
  isOpen?: boolean;
  onClose: () => void;
  blogPosts: BlogPost[];
  setBlogPosts: React.Dispatch<React.SetStateAction<BlogPost[]>>;
  galleryItems: GalleryItem[];
  setGalleryItems: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
  galleryCategories: GalleryCategory[];
  setGalleryCategories: React.Dispatch<React.SetStateAction<GalleryCategory[]>>;
  doctors: Doctor[];
  setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  testimonials: Testimonial[];
  setTestimonials: React.Dispatch<React.SetStateAction<Testimonial[]>>;
  visionImages: VisionImages;
  setVisionImages: React.Dispatch<React.SetStateAction<VisionImages>>;
  /**
   * Commit latest content arrays to public site state + session cache.
   * Prefer this over remote refetch (list endpoints strip blog content).
   */
  onContentCommit?: (payload: {
    blogs?: BlogPost[];
    gallery?: GalleryItem[];
    doctors?: Doctor[];
    galleryCategories?: GalleryCategory[];
    services?: Service[];
    testimonials?: Testimonial[];
    visionImages?: VisionImages;
  }) => void;
}

type AdminTab = 'overview' | 'blogs' | 'gallery' | 'team' | 'services' | 'testimonials' | 'vision';
type ConfirmState = { message: string; onConfirm: () => void } | null;

const INACTIVITY_MS = 30 * 60 * 1000;

const btnPrimary =
  'inline-flex items-center justify-center gap-2 bg-ink px-5 py-2.5 text-[13px] font-medium text-bg-light transition hover:bg-bronze disabled:cursor-not-allowed disabled:opacity-55';
const btnGhost =
  'inline-flex items-center justify-center gap-2 border border-ink/15 bg-transparent px-4 py-2.5 text-[13px] font-medium text-ink transition hover:border-ink';
const btnIcon =
  'inline-flex h-8 w-8 items-center justify-center border border-ink/10 text-ink-soft transition hover:border-ink hover:text-ink';

function parseSpecialties(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

export default function AdminDashboard({
  lang,
  isOpen: _isOpen,
  onClose,
  blogPosts,
  setBlogPosts,
  galleryItems,
  setGalleryItems,
  galleryCategories,
  setGalleryCategories,
  doctors,
  setDoctors,
  services,
  setServices,
  testimonials,
  setTestimonials,
  visionImages,
  setVisionImages,
  onContentCommit,
}: AdminDashboardProps) {
  const isRtl = lang === 'ar';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginFieldErrors, setLoginFieldErrors] = useState<FieldErrors>({});
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [blogQuery, setBlogQuery] = useState('');
  const [galleryQuery, setGalleryQuery] = useState('');
  const [teamQuery, setTeamQuery] = useState('');
  const [servicesQuery, setServicesQuery] = useState('');
  const [testimonialsQuery, setTestimonialsQuery] = useState('');

  const [editingBlog, setEditingBlog] = useState<Partial<BlogPost> | null>(null);
  const [editingGallery, setEditingGallery] = useState<Partial<GalleryItem> | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<Partial<Doctor> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<GalleryCategory> | null>(null);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null);
  const [editingVision, setEditingVision] = useState<Partial<VisionImages> | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isMigratingImages, setIsMigratingImages] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>(null);

  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const didAutoMigrate = useRef(false);

  const clearToastTimers = () => {
    toastTimers.current.forEach(clearTimeout);
    toastTimers.current = [];
  };

  const showSuccess = useCallback((message: string) => {
    clearToastTimers();
    setActionSuccess(message);
    setActionError(null);
    toastTimers.current.push(setTimeout(() => setActionSuccess(null), 3000));
  }, []);

  const showError = useCallback((message: string) => {
    clearToastTimers();
    setActionError(message);
    setActionSuccess(null);
    toastTimers.current.push(setTimeout(() => setActionError(null), 5000));
  }, []);

  const clearSensitiveState = useCallback(() => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setLoginError(null);
    setLoginFieldErrors({});
    setEditingBlog(null);
    setEditingGallery(null);
    setEditingDoctor(null);
    setEditingCategory(null);
    setEditingService(null);
    setEditingTestimonial(null);
    setEditingVision(null);
    setFieldErrors({});
    setConfirmDialog(null);
  }, []);

  const closeDrawers = useCallback(() => {
    setEditingBlog(null);
    setEditingGallery(null);
    setEditingDoctor(null);
    setEditingCategory(null);
    setEditingService(null);
    setEditingTestimonial(null);
    setEditingVision(null);
    setFieldErrors({});
  }, []);

  const handleLogout = useCallback(
    async (options?: { close?: boolean; reason?: 'manual' | 'inactive' | 'session' }) => {
      await signOutAdmin();
      setIsAuthenticated(false);
      clearSensitiveState();
      if (options?.reason === 'inactive') {
        setLoginError(
          isRtl
            ? 'تم تسجيل الخروج تلقائياً بسبب عدم النشاط'
            : 'Signed out automatically due to inactivity'
        );
        toastTimers.current.push(setTimeout(() => setLoginError(null), 6000));
      }
      if (options?.close) onClose();
    },
    [clearSensitiveState, isRtl, onClose]
  );

  useEffect(() => {
    let mounted = true;

    getAdminSession().then((session) => {
      if (!mounted) return;
      setIsAuthenticated(!!session);
      setIsCheckingSession(false);
    });

    const unsubscribe = onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setIsAuthenticated(!!session);
      if (!session) clearSensitiveState();
    });

    return () => {
      mounted = false;
      unsubscribe();
      clearToastTimers();
    };
  }, [clearSensitiveState]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
      return;
    }

    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        handleLogout({ reason: 'inactive' });
      }, INACTIVITY_MS);
    };

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'wheel',
    ];

    resetTimer();
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));

    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [isAuthenticated, handleLogout]);

  const runImageMigration = useCallback(async () => {
    if (!isSupabaseConfigured || isMigratingImages) return;
    setIsMigratingImages(true);
    try {
      const bucket = await ensureStorageBucket();
      if (!bucket.ok) {
        console.warn('[Admin] Storage bucket:', bucket.message);
      }

      const result = await migrateBase64ImagesToStorage();
      if (result.migrated > 0) {
        const [docs, gal, blogs] = await Promise.all([
          fetchDoctorsFromSupabase(),
          fetchGalleryItemsFromSupabase(),
          fetchBlogPostsFromSupabase(),
        ]);
        // Merge remote into local — never drop a doctor that exists only locally mid-session
        const mergeById = <T extends { id: string }>(local: T[], remote: T[] | null): T[] => {
          if (!remote) return local;
          const map = new Map(local.map((item) => [item.id, item]));
          for (const item of remote) map.set(item.id, item);
          return Array.from(map.values());
        };
        if (docs) {
          setDoctors((prev) => {
            const next = mergeById(prev, docs);
            onContentCommit?.({ doctors: next });
            return next;
          });
        }
        if (gal) {
          setGalleryItems((prev) => {
            const next = mergeById(prev, gal);
            onContentCommit?.({ gallery: next });
            return next;
          });
        }
        if (blogs) {
          setBlogPosts((prev) => {
            const next = mergeById(prev, blogs);
            onContentCommit?.({ blogs: next });
            return next;
          });
        }
        showSuccess(
          isRtl
            ? `تم رفع ${result.migrated} صورة إلى التخزين — الموقع سيعرض الصور الحقيقية`
            : `Uploaded ${result.migrated} image(s) to Storage — the site will show real photos`
        );
      } else if (result.failed > 0) {
        showError(
          isRtl
            ? 'فشل رفع بعض الصور. أنشئ bucket باسم almaali-images في Supabase Storage (Public).'
            : 'Some uploads failed. Create a public Storage bucket named almaali-images in Supabase.'
        );
      } else if (!bucket.ok) {
        showError(
          isRtl
            ? `التخزين غير جاهز: ${bucket.message}`
            : `Storage not ready: ${bucket.message}`
        );
      } else {
        showSuccess(isRtl ? 'كل الصور محسّنة مسبقاً' : 'All images are already optimized');
      }
    } catch (err) {
      console.error(err);
      showError(isRtl ? 'تعذّرت هجرة الصور' : 'Image migration failed');
    } finally {
      setIsMigratingImages(false);
    }
  }, [
    isMigratingImages,
    isRtl,
    onContentCommit,
    setBlogPosts,
    setDoctors,
    setGalleryItems,
    showError,
    showSuccess,
  ]);

  // After login: move legacy base64 photos → Storage once (fixes stock placeholders for good)
  useEffect(() => {
    if (!isAuthenticated || !isSupabaseConfigured || didAutoMigrate.current) return;
    didAutoMigrate.current = true;
    void runImageMigration();
  }, [isAuthenticated, runImageMigration]);

  const openBlogDrawer = (post?: BlogPost) => {
    closeDrawers();
    setEditingBlog(post ? { ...post } : {});
  };

  const openGalleryDrawer = (item?: GalleryItem) => {
    closeDrawers();
    setEditingGallery(
      item
        ? { ...item }
        : { category: galleryCategories[0]?.id || 'clinic' }
    );
  };

  const openDoctorDrawer = (doctor?: Doctor) => {
    closeDrawers();
    setEditingDoctor(doctor ? { ...doctor } : {});
  };

  const openServiceDrawer = (service?: Service) => {
    closeDrawers();
    setEditingService(
      service
        ? { ...service }
        : {
            iconName: 'Gem',
            details: { ar: [], en: [] },
            duration: { ar: '', en: '' },
          }
    );
  };

  const openTestimonialDrawer = (item?: Testimonial) => {
    closeDrawers();
    setEditingTestimonial(
      item
        ? { ...item }
        : {
            rating: 5,
            treatment: { ar: '', en: '' },
            date: new Date().toISOString().slice(0, 10),
          }
    );
  };

  const openVisionEditor = () => {
    closeDrawers();
    setEditingVision({ ...visionImages });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateLogin(email, password, isRtl);
    setLoginFieldErrors(errors);
    if (hasErrors(errors)) return;

    if (!isSupabaseConfigured) {
      setLoginError(
        isRtl
          ? 'متغيرات بيئة Supabase غير مضبوطة'
          : 'Supabase environment variables are missing'
      );
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);
    const result = await signInAdmin(email, password);
    setIsLoggingIn(false);

    if (result.success) {
      setIsAuthenticated(true);
      setEmail('');
      setPassword('');
      setLoginFieldErrors({});
      return;
    }

    const messages: Record<string, { ar: string; en: string }> = {
      email_not_confirmed: {
        ar: 'البريد الإلكتروني غير مؤكد — يرجى تفعيل الحساب من لوحة Supabase',
        en: 'Email not confirmed — please confirm the user in Supabase Dashboard',
      },
      rate_limited: {
        ar: 'محاولات كثيرة — يرجى الانتظار قليلاً ثم إعادة المحاولة',
        en: 'Too many attempts — please wait a moment and try again',
      },
      missing_credentials: {
        ar: 'يرجى إدخال البريد الإلكتروني وكلمة المرور',
        en: 'Please enter email and password',
      },
      'Supabase not configured': {
        ar: 'متغيرات بيئة Supabase غير مضبوطة',
        en: 'Supabase environment variables are missing',
      },
      invalid_credentials: {
        ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        en: 'Invalid email or password',
      },
    };
    const mapped = messages[result.error || 'invalid_credentials'] || messages.invalid_credentials;
    setLoginError(isRtl ? mapped.ar : mapped.en);
  };

  // ─── Local-first content commits (frontend + session cache) ───
  const commitBlogs = (recipe: (prev: BlogPost[]) => BlogPost[]) => {
    let next: BlogPost[] = [];
    setBlogPosts((prev) => {
      next = recipe(prev);
      return next;
    });
    onContentCommit?.({ blogs: next });
  };

  const commitGallery = (recipe: (prev: GalleryItem[]) => GalleryItem[]) => {
    let next: GalleryItem[] = [];
    setGalleryItems((prev) => {
      next = recipe(prev);
      return next;
    });
    onContentCommit?.({ gallery: next });
  };

  const commitCategories = (recipe: (prev: GalleryCategory[]) => GalleryCategory[]) => {
    let next: GalleryCategory[] = [];
    setGalleryCategories((prev) => {
      next = recipe(prev);
      return next;
    });
    onContentCommit?.({ galleryCategories: next });
  };

  const commitDoctors = (recipe: (prev: Doctor[]) => Doctor[]) => {
    let next: Doctor[] = [];
    setDoctors((prev) => {
      next = recipe(prev);
      return next;
    });
    onContentCommit?.({ doctors: next });
  };

  const commitServices = (recipe: (prev: Service[]) => Service[]) => {
    let next: Service[] = [];
    setServices((prev) => {
      next = recipe(prev);
      return next;
    });
    onContentCommit?.({ services: next });
  };

  const commitTestimonials = (recipe: (prev: Testimonial[]) => Testimonial[]) => {
    let next: Testimonial[] = [];
    setTestimonials((prev) => {
      next = recipe(prev);
      return next;
    });
    onContentCommit?.({ testimonials: next });
  };

  const commitVision = (next: VisionImages) => {
    setVisionImages(next);
    onContentCommit?.({ visionImages: next });
  };

  // ─── Blog CRUD ───
  const saveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlog) return;

    const errors = validateBlog(editingBlog, isRtl);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setIsSaving(true);

    const validated: BlogPost = {
      id: editingBlog.id || `b-${Date.now()}`,
      title: {
        ar: editingBlog.title!.ar!.trim(),
        en: editingBlog.title!.en!.trim(),
      },
      excerpt: {
        ar: editingBlog.excerpt?.ar?.trim() || '',
        en: editingBlog.excerpt?.en?.trim() || '',
      },
      content: {
        ar: editingBlog.content!.ar!.trim(),
        en: editingBlog.content!.en!.trim(),
      },
      date: {
        ar:
          editingBlog.date?.ar?.trim() ||
          new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
        en:
          editingBlog.date?.en?.trim() ||
          new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      },
      readTime: {
        ar: editingBlog.readTime?.ar?.trim() || '٥ دقائق قراءة',
        en: editingBlog.readTime?.en?.trim() || '5 min read',
      },
      category: {
        ar: editingBlog.category!.ar!.trim(),
        en: editingBlog.category!.en!.trim(),
      },
      image: editingBlog.image!.trim(),
      author: {
        ar: editingBlog.author?.ar?.trim() || 'عيادات المعالي',
        en: editingBlog.author?.en?.trim() || 'Al Maali Clinics',
      },
    };

    if (isSupabaseConfigured && validated.image.startsWith('data:')) {
      const url = await uploadBase64Image(validated.image, 'blog', validated.id);
      if (url) validated.image = url;
    }

    try {
      let cloudOk = true;
      let toCommit = validated;
      if (isSupabaseConfigured) {
        const saved = await saveBlogPostToSupabase(validated);
        cloudOk = Boolean(saved);
        if (saved) toCommit = saved;
      }

      commitBlogs((prev) => {
        const exists = prev.some((b) => b.id === toCommit.id);
        if (exists) return prev.map((b) => (b.id === toCommit.id ? toCommit : b));
        return [toCommit, ...prev];
      });
      closeDrawers();

      if (!cloudOk) {
        showError(
          isRtl
            ? 'تم الحفظ على الموقع — مزامنة السحابة فشلت. تحقق من تسجيل الدخول وSupabase.'
            : 'Saved on site — cloud sync failed. Check login & Supabase.'
        );
      } else {
        showSuccess(isRtl ? 'تم حفظ المقال ونشره على الموقع' : 'Article saved and live on the site');
      }
    } catch (err) {
      console.error('Error saving blog:', err);
      showError(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBlog = (id: string) => {
    setConfirmDialog({
      message: isRtl ? 'هل تريد حذف هذا المقال نهائياً؟' : 'Delete this article permanently?',
      onConfirm: async () => {
        setIsSaving(true);
        try {
          let cloudOk = true;
          if (isSupabaseConfigured) {
            cloudOk = await deleteBlogPostFromSupabase(id);
          }
          commitBlogs((prev) => prev.filter((b) => b.id !== id));
          if (!cloudOk) {
            showError(
              isRtl
                ? 'تم الحذف من الموقع — مزامنة السحابة فشلت'
                : 'Removed on site — cloud sync failed'
            );
          } else {
            showSuccess(isRtl ? 'تم حذف المقال' : 'Article deleted');
          }
        } catch (err) {
          console.error('Error deleting blog:', err);
          showError(isRtl ? 'حدث خطأ أثناء الحذف' : 'Error occurred while deleting');
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  // ─── Gallery CRUD ───
  const saveGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGallery) return;

    const errors = validateGallery(
      editingGallery,
      isRtl,
      galleryCategories.map((c) => c.id)
    );
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setIsSaving(true);

    const validated: GalleryItem = {
      id: editingGallery.id || `g-${Date.now()}`,
      title: {
        ar: editingGallery.title!.ar!.trim(),
        en: editingGallery.title!.en!.trim(),
      },
      category: (editingGallery.category || galleryCategories[0]?.id || 'clinic').trim(),
      image: editingGallery.image!.trim(),
      description: {
        ar: editingGallery.description?.ar?.trim() || '',
        en: editingGallery.description?.en?.trim() || '',
      },
    };

    if (isSupabaseConfigured && validated.image.startsWith('data:')) {
      const url = await uploadBase64Image(validated.image, 'gallery', validated.id);
      if (url) validated.image = url;
    }

    try {
      let cloudOk = true;
      let toCommit = validated;
      if (isSupabaseConfigured) {
        const saved = await saveGalleryItemToSupabase(validated);
        cloudOk = Boolean(saved);
        if (saved) toCommit = saved;
      }

      commitGallery((prev) => {
        const exists = prev.some((g) => g.id === toCommit.id);
        if (exists) return prev.map((g) => (g.id === toCommit.id ? toCommit : g));
        return [...prev, toCommit];
      });
      closeDrawers();

      if (!cloudOk) {
        showError(
          isRtl
            ? 'تم الحفظ على الموقع — مزامنة السحابة فشلت. تحقق من تسجيل الدخول وSupabase.'
            : 'Saved on site — cloud sync failed. Check login & Supabase.'
        );
      } else {
        showSuccess(isRtl ? 'تم حفظ الصورة ونشرها على الموقع' : 'Image saved and live on the site');
      }
    } catch (err) {
      console.error('Error saving gallery:', err);
      showError(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteGallery = (id: string) => {
    setConfirmDialog({
      message: isRtl ? 'هل تريد حذف هذه الصورة من المعرض؟' : 'Delete this gallery image?',
      onConfirm: async () => {
        setIsSaving(true);
        try {
          let cloudOk = true;
          if (isSupabaseConfigured) {
            cloudOk = await deleteGalleryItemFromSupabase(id);
          }
          commitGallery((prev) => prev.filter((g) => g.id !== id));
          if (!cloudOk) {
            showError(
              isRtl
                ? 'تم الحذف من الموقع — مزامنة السحابة فشلت'
                : 'Removed on site — cloud sync failed'
            );
          } else {
            showSuccess(isRtl ? 'تم حذف الصورة' : 'Image deleted');
          }
        } catch (err) {
          console.error('Error deleting gallery:', err);
          showError(isRtl ? 'حدث خطأ أثناء الحذف' : 'Error occurred while deleting');
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  // ─── Gallery category CRUD ───
  const openCategoryEditor = (cat?: GalleryCategory) => {
    closeDrawers();
    setEditingCategory(cat ? { ...cat } : { id: '', label: { ar: '', en: '' } });
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const errors = validateGalleryCategory(editingCategory, isRtl);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    const label = {
      ar: editingCategory.label!.ar!.trim(),
      en: editingCategory.label!.en!.trim(),
    };
    const id =
      editingCategory.id?.trim() ||
      slugifyCategoryId(label.en || label.ar);

    if (galleryCategories.some((c) => c.id === id && c.id !== editingCategory.id)) {
      setFieldErrors({ id: isRtl ? 'المعرّف مستخدم مسبقاً' : 'ID already exists' });
      return;
    }

    const validated: GalleryCategory = { id, label };
    setIsSaving(true);
    try {
      let cloudOk = true;
      if (isSupabaseConfigured) {
        cloudOk = await saveGalleryCategoryToSupabase(
          validated,
          galleryCategories.findIndex((c) => c.id === id)
        );
      }

      const prevId = editingCategory.id?.trim();
      commitCategories((prev) => {
        const withoutOld =
          prevId && prevId !== id ? prev.filter((c) => c.id !== prevId) : prev;
        const exists = withoutOld.some((c) => c.id === id);
        if (exists) return withoutOld.map((c) => (c.id === id ? validated : c));
        return [...withoutOld, validated];
      });

      // If renamed id, remaps items using the old id
      if (prevId && prevId !== id) {
        commitGallery((prev) =>
          prev.map((item) => (item.category === prevId ? { ...item, category: id } : item))
        );
      }

      setEditingCategory(null);
      if (!cloudOk) {
        showError(
          isRtl
            ? 'تم الحفظ محلياً — شغّل supabase-gallery-categories.sql إن لزم'
            : 'Saved locally — run supabase-gallery-categories.sql if needed'
        );
      } else {
        showSuccess(isRtl ? 'تم حفظ التصنيف' : 'Category saved');
      }
    } catch (err) {
      console.error(err);
      showError(isRtl ? 'فشل حفظ التصنيف' : 'Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = (id: string) => {
    const inUse = galleryItems.some((g) => g.category === id);
    if (inUse) {
      showError(
        isRtl
          ? 'لا يمكن حذف تصنيف مستخدم في صور المعرض'
          : 'Cannot delete a category still used by gallery images'
      );
      return;
    }
    if (galleryCategories.length <= 1) {
      showError(isRtl ? 'يجب الإبقاء على تصنيف واحد على الأقل' : 'Keep at least one category');
      return;
    }

    setConfirmDialog({
      message: isRtl ? 'حذف هذا التصنيف؟' : 'Delete this category?',
      onConfirm: async () => {
        setIsSaving(true);
        try {
          if (isSupabaseConfigured) await deleteGalleryCategoryFromSupabase(id);
          commitCategories((prev) => prev.filter((c) => c.id !== id));
          showSuccess(isRtl ? 'تم حذف التصنيف' : 'Category deleted');
        } catch (err) {
          console.error(err);
          showError(isRtl ? 'فشل حذف التصنيف' : 'Failed to delete category');
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  // ─── Team CRUD ───
  const saveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    const specsAr = parseSpecialties(editingDoctor.specialties?.ar);
    const specsEn = parseSpecialties(editingDoctor.specialties?.en);

    const draft: Partial<Doctor> = {
      ...editingDoctor,
      specialties: { ar: specsAr, en: specsEn },
    };

    const errors = validateDoctor(draft, isRtl);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setIsSaving(true);

    const validated: Doctor = {
      id: editingDoctor.id || `dr-${Date.now()}`,
      name: {
        ar: editingDoctor.name!.ar!.trim(),
        en: editingDoctor.name!.en!.trim(),
      },
      role: {
        ar: editingDoctor.role?.ar?.trim() || '',
        en: editingDoctor.role?.en?.trim() || '',
      },
      bio: {
        ar: editingDoctor.bio?.ar?.trim() || '',
        en: editingDoctor.bio?.en?.trim() || '',
      },
      specialties: {
        ar: specsAr,
        en: specsEn,
      },
      education: {
        ar: editingDoctor.education?.ar?.trim() || '',
        en: editingDoctor.education?.en?.trim() || '',
      },
      image: editingDoctor.image!.trim(),
    };

    if (isSupabaseConfigured && validated.image.startsWith('data:')) {
      const url = await uploadBase64Image(validated.image, 'doctor', validated.id);
      if (url) validated.image = url;
    }

    try {
      let cloudOk = true;
      let toCommit = validated;
      if (isSupabaseConfigured) {
        const saved = await saveDoctorToSupabase(validated);
        cloudOk = Boolean(saved);
        if (saved) toCommit = saved;
      }

      commitDoctors((prev) => {
        const exists = prev.some((d) => d.id === toCommit.id);
        if (exists) return prev.map((d) => (d.id === toCommit.id ? toCommit : d));
        return [...prev, toCommit];
      });
      closeDrawers();

      if (!cloudOk) {
        showError(
          isRtl
            ? 'تم الحفظ على الموقع — مزامنة السحابة فشلت. سجّل الدخول مجدداً وتحقق من Supabase.'
            : 'Saved on site — cloud sync failed. Sign in again and check Supabase.'
        );
      } else {
        showSuccess(isRtl ? 'تم حفظ الطبيب ونشره على الموقع' : 'Doctor saved and live on the site');
      }
    } catch (err) {
      console.error('Error saving doctor:', err);
      showError(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDoctor = (id: string) => {
    setConfirmDialog({
      message: isRtl ? 'هل تريد استبعاد هذا الطبيب من الفريق؟' : 'Remove this doctor from the team?',
      onConfirm: async () => {
        setIsSaving(true);
        try {
          let cloudOk = true;
          if (isSupabaseConfigured) {
            cloudOk = await deleteDoctorFromSupabase(id);
          }
          commitDoctors((prev) => prev.filter((d) => d.id !== id));
          if (!cloudOk) {
            showError(
              isRtl
                ? 'تم الحذف من الموقع — مزامنة السحابة فشلت'
                : 'Removed on site — cloud sync failed'
            );
          } else {
            showSuccess(isRtl ? 'تم حذف الطبيب' : 'Doctor removed');
          }
        } catch (err) {
          console.error('Error deleting doctor:', err);
          showError(isRtl ? 'حدث خطأ أثناء الحذف' : 'Error occurred while deleting');
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  const parseDetails = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
    if (typeof value === 'string') {
      return value
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  };

  // ─── Services CRUD ───
  const saveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    const detailsAr = parseDetails(editingService.details?.ar);
    const detailsEn = parseDetails(editingService.details?.en);
    const draft: Partial<Service> = {
      ...editingService,
      details: { ar: detailsAr, en: detailsEn },
    };

    const errors = validateService(draft, isRtl);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setIsSaving(true);

    const validated: Service = {
      id: editingService.id || `svc-${Date.now()}`,
      iconName: editingService.iconName?.trim() || 'Gem',
      title: {
        ar: editingService.title!.ar!.trim(),
        en: editingService.title!.en!.trim(),
      },
      description: {
        ar: editingService.description!.ar!.trim(),
        en: editingService.description!.en!.trim(),
      },
      details: { ar: detailsAr, en: detailsEn },
      duration: {
        ar: editingService.duration?.ar?.trim() || '',
        en: editingService.duration?.en?.trim() || '',
      },
      image: editingService.image!.trim(),
    };

    if (isSupabaseConfigured && validated.image.startsWith('data:')) {
      const url = await uploadBase64Image(validated.image, 'services', validated.id);
      if (url) validated.image = url;
    }

    try {
      let cloudOk = true;
      let toCommit = validated;
      let sortOrder = 0;
      commitServices((prev) => {
        const exists = prev.some((s) => s.id === validated.id);
        sortOrder = exists
          ? Math.max(0, prev.findIndex((s) => s.id === validated.id))
          : prev.length;
        return prev;
      });

      if (isSupabaseConfigured) {
        const saved = await saveServiceToSupabase(validated, sortOrder);
        cloudOk = Boolean(saved);
        if (saved) toCommit = saved;
      }

      commitServices((prev) => {
        const exists = prev.some((s) => s.id === toCommit.id);
        if (exists) return prev.map((s) => (s.id === toCommit.id ? toCommit : s));
        return [...prev, toCommit];
      });
      closeDrawers();

      if (!cloudOk) {
        showError(
          isRtl
            ? 'تم الحفظ على الموقع — مزامنة السحابة فشلت. نفّذ ملف SQL للجداول الجديدة إن لزم.'
            : 'Saved on site — cloud sync failed. Run the new SQL migration if needed.'
        );
      } else {
        showSuccess(isRtl ? 'تم حفظ الخدمة' : 'Service saved');
      }
    } catch (err) {
      console.error('Error saving service:', err);
      showError(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteService = (id: string) => {
    setConfirmDialog({
      message: isRtl ? 'حذف هذه الخدمة؟' : 'Delete this service?',
      onConfirm: async () => {
        setIsSaving(true);
        try {
          let cloudOk = true;
          if (isSupabaseConfigured) cloudOk = await deleteServiceFromSupabase(id);
          commitServices((prev) => prev.filter((s) => s.id !== id));
          if (!cloudOk) {
            showError(
              isRtl ? 'تم الحذف من الموقع — مزامنة السحابة فشلت' : 'Removed on site — cloud sync failed'
            );
          } else {
            showSuccess(isRtl ? 'تم حذف الخدمة' : 'Service deleted');
          }
        } catch (err) {
          console.error('Error deleting service:', err);
          showError(isRtl ? 'حدث خطأ أثناء الحذف' : 'Error occurred while deleting');
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  // ─── Testimonials CRUD ───
  const saveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial) return;

    const errors = validateTestimonial(editingTestimonial, isRtl);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setIsSaving(true);

    const validated: Testimonial = {
      id: editingTestimonial.id || `t-${Date.now()}`,
      name: {
        ar: editingTestimonial.name!.ar!.trim(),
        en: editingTestimonial.name!.en!.trim(),
      },
      rating: Math.min(5, Math.max(1, Number(editingTestimonial.rating) || 5)),
      comment: {
        ar: editingTestimonial.comment!.ar!.trim(),
        en: editingTestimonial.comment!.en!.trim(),
      },
      treatment: {
        ar: editingTestimonial.treatment?.ar?.trim() || '',
        en: editingTestimonial.treatment?.en?.trim() || '',
      },
      date: editingTestimonial.date?.trim() || new Date().toISOString().slice(0, 10),
      image: editingTestimonial.image?.trim() || '',
    };

    if (isSupabaseConfigured && validated.image.startsWith('data:')) {
      const url = await uploadBase64Image(validated.image, 'testimonials', validated.id);
      if (url) validated.image = url;
    }

    try {
      let cloudOk = true;
      let toCommit = validated;
      let sortOrder = 0;
      commitTestimonials((prev) => {
        const exists = prev.some((t) => t.id === validated.id);
        sortOrder = exists
          ? Math.max(0, prev.findIndex((t) => t.id === validated.id))
          : prev.length;
        return prev;
      });

      if (isSupabaseConfigured) {
        const saved = await saveTestimonialToSupabase(validated, sortOrder);
        cloudOk = Boolean(saved);
        if (saved) toCommit = saved;
      }

      commitTestimonials((prev) => {
        const exists = prev.some((t) => t.id === toCommit.id);
        if (exists) return prev.map((t) => (t.id === toCommit.id ? toCommit : t));
        return [...prev, toCommit];
      });
      closeDrawers();

      if (!cloudOk) {
        showError(
          isRtl
            ? 'تم الحفظ على الموقع — مزامنة السحابة فشلت. نفّذ ملف SQL للجداول الجديدة إن لزم.'
            : 'Saved on site — cloud sync failed. Run the new SQL migration if needed.'
        );
      } else {
        showSuccess(isRtl ? 'تم حفظ التقييم' : 'Review saved');
      }
    } catch (err) {
      console.error('Error saving testimonial:', err);
      showError(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTestimonial = (id: string) => {
    setConfirmDialog({
      message: isRtl ? 'حذف هذا التقييم؟' : 'Delete this review?',
      onConfirm: async () => {
        setIsSaving(true);
        try {
          let cloudOk = true;
          if (isSupabaseConfigured) cloudOk = await deleteTestimonialFromSupabase(id);
          commitTestimonials((prev) => prev.filter((t) => t.id !== id));
          if (!cloudOk) {
            showError(
              isRtl ? 'تم الحذف من الموقع — مزامنة السحابة فشلت' : 'Removed on site — cloud sync failed'
            );
          } else {
            showSuccess(isRtl ? 'تم حذف التقييم' : 'Review deleted');
          }
        } catch (err) {
          console.error('Error deleting testimonial:', err);
          showError(isRtl ? 'حدث خطأ أثناء الحذف' : 'Error occurred while deleting');
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  // ─── Vision images ───
  const saveVision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVision) return;

    const errors = validateVisionImages(editingVision, isRtl);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setIsSaving(true);

    let validated: VisionImages = {
      imagePrimary: editingVision.imagePrimary!.trim(),
      imageSecondary: editingVision.imageSecondary!.trim(),
    };

    try {
      let cloudOk = true;
      if (isSupabaseConfigured) {
        if (validated.imagePrimary.startsWith('data:')) {
          const url = await uploadBase64Image(validated.imagePrimary, 'vision', 'primary');
          if (url) validated = { ...validated, imagePrimary: url };
        }
        if (validated.imageSecondary.startsWith('data:')) {
          const url = await uploadBase64Image(validated.imageSecondary, 'vision', 'secondary');
          if (url) validated = { ...validated, imageSecondary: url };
        }
        const saved = await saveVisionImagesToSupabase(validated);
        cloudOk = Boolean(saved);
        if (saved) validated = saved;
      }

      commitVision(validated);
      closeDrawers();

      if (!cloudOk) {
        showError(
          isRtl
            ? 'تم الحفظ على الموقع — مزامنة السحابة فشلت. نفّذ ملف SQL للجداول الجديدة إن لزم.'
            : 'Saved on site — cloud sync failed. Run the new SQL migration if needed.'
        );
      } else {
        showSuccess(isRtl ? 'تم حفظ صور الرؤية' : 'Vision images saved');
      }
    } catch (err) {
      console.error('Error saving vision images:', err);
      showError(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Filters & nav ───
  const filteredBlogs = useMemo(() => {
    const q = blogQuery.trim().toLowerCase();
    if (!q) return blogPosts;
    return blogPosts.filter(
      (p) =>
        p.title.ar.toLowerCase().includes(q) ||
        p.title.en.toLowerCase().includes(q) ||
        p.category.ar.toLowerCase().includes(q) ||
        p.category.en.toLowerCase().includes(q) ||
        p.author.ar.toLowerCase().includes(q) ||
        p.author.en.toLowerCase().includes(q)
    );
  }, [blogPosts, blogQuery]);

  const filteredGallery = useMemo(() => {
    const q = galleryQuery.trim().toLowerCase();
    if (!q) return galleryItems;
    return galleryItems.filter(
      (g) =>
        g.title.ar.toLowerCase().includes(q) ||
        g.title.en.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        (g.description?.ar || '').toLowerCase().includes(q) ||
        (g.description?.en || '').toLowerCase().includes(q)
    );
  }, [galleryItems, galleryQuery]);

  const filteredDoctors = useMemo(() => {
    const q = teamQuery.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter(
      (d) =>
        d.name.ar.toLowerCase().includes(q) ||
        d.name.en.toLowerCase().includes(q) ||
        d.role.ar.toLowerCase().includes(q) ||
        d.role.en.toLowerCase().includes(q) ||
        d.education.ar.toLowerCase().includes(q) ||
        d.education.en.toLowerCase().includes(q)
    );
  }, [doctors, teamQuery]);

  const filteredServices = useMemo(() => {
    const q = servicesQuery.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        s.title.ar.toLowerCase().includes(q) ||
        s.title.en.toLowerCase().includes(q) ||
        s.description.ar.toLowerCase().includes(q) ||
        s.description.en.toLowerCase().includes(q)
    );
  }, [services, servicesQuery]);

  const filteredTestimonials = useMemo(() => {
    const q = testimonialsQuery.trim().toLowerCase();
    if (!q) return testimonials;
    return testimonials.filter(
      (t) =>
        t.name.ar.toLowerCase().includes(q) ||
        t.name.en.toLowerCase().includes(q) ||
        t.comment.ar.toLowerCase().includes(q) ||
        t.comment.en.toLowerCase().includes(q) ||
        t.treatment.ar.toLowerCase().includes(q) ||
        t.treatment.en.toLowerCase().includes(q)
    );
  }, [testimonials, testimonialsQuery]);

  const navItems: { id: AdminTab; icon: React.ReactNode; label: string; count?: number }[] = [
    { id: 'overview', icon: <BarChart3 size={15} />, label: isRtl ? 'نظرة عامة' : 'Overview' },
    { id: 'blogs', icon: <BookOpen size={15} />, label: isRtl ? 'المدونة' : 'Blog', count: blogPosts.length },
    { id: 'gallery', icon: <ImageIcon size={15} />, label: isRtl ? 'المعرض' : 'Gallery', count: galleryItems.length },
    { id: 'team', icon: <Users size={15} />, label: isRtl ? 'الفريق' : 'Team', count: doctors.length },
    { id: 'services', icon: <Sparkles size={15} />, label: isRtl ? 'الخدمات' : 'Services', count: services.length },
    {
      id: 'testimonials',
      icon: <Star size={15} />,
      label: isRtl ? 'التقييمات' : 'Ratings',
      count: testimonials.length,
    },
    { id: 'vision', icon: <ScanEye size={15} />, label: isRtl ? 'رؤيتنا' : 'Vision' },
  ];

  const drawerFooter = (formId: string, onCancel: () => void, onSaveLabel: string) => (
    <div className="flex items-center justify-end gap-3">
      <button type="button" onClick={onCancel} className={btnGhost} disabled={isSaving}>
        {isRtl ? 'إلغاء' : 'Cancel'}
      </button>
      <button type="submit" form={formId} disabled={isSaving} className={btnPrimary}>
        <Save size={14} />
        {isSaving ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : onSaveLabel}
      </button>
    </div>
  );

  const sectionHeader = (
    title: string,
    subtitle: string,
    actionLabel: string,
    onAction: () => void,
    query: string,
    onQuery: (v: string) => void,
    searchPlaceholder: string
  ) => (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-ink tracking-tight">{title}</h2>
          <p className="mt-1 text-[13px] text-muted">{subtitle}</p>
        </div>
        <button type="button" onClick={onAction} className={btnPrimary}>
          <Plus size={14} />
          {actionLabel}
        </button>
      </div>
      <div className="relative max-w-sm">
        <Search
          size={14}
          className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted', isRtl ? 'right-3' : 'left-3')}
        />
        <AdminInput
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className={isRtl ? 'pr-9' : 'pl-9'}
        />
      </div>
    </div>
  );

  const emptyState = (icon: React.ReactNode, title: string, hint: string) => (
    <div className="flex flex-col items-center justify-center border border-dashed border-ink/15 bg-bg-warm/20 px-8 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center border border-ink/10 text-muted">
        {icon}
      </div>
      <p className="font-display text-lg text-ink">{title}</p>
      <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-muted">{hint}</p>
    </div>
  );

  // ─── LOGIN ───
  if (!isAuthenticated) {
    return (
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative flex min-h-screen flex-col overflow-hidden bg-bg-dark text-bg-light font-sans"
      >
        <AdminToast
          saving={null}
          success={null}
          error={loginError}
        />

        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(165deg, #1a1612 0%, #241e18 50%, #2c241c 100%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
            }}
          />
        </div>

        <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-3">
            <img src={IMAGES.logo} alt="Al Maali" className="h-8 w-auto opacity-90" />
            <span className="font-display text-lg tracking-wide text-bg-light">
              {isRtl ? 'المعالي' : 'Al Maali'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-[12px] text-gold-soft/70 transition hover:text-gold"
          >
            {isRtl ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            {isRtl ? 'العودة للموقع' : 'Back to Site'}
          </button>
        </header>

        <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16">
          {isCheckingSession ? (
            <div className="flex flex-col items-center gap-4 text-gold-soft/60">
              <div className="h-9 w-9 animate-spin border-2 border-gold border-t-transparent" />
              <p className="text-[12px] tracking-wide">
                {isRtl ? 'جاري التحقق من الجلسة...' : 'Checking session...'}
              </p>
            </div>
          ) : !isSupabaseConfigured ? (
            <div className="w-full max-w-md border border-gold/20 bg-bg-ink/80 p-10 text-center backdrop-blur-sm">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center border border-gold/30 text-gold">
                <ShieldAlert size={22} />
              </div>
              <h1 className="font-display text-2xl text-bg-light">
                {isRtl ? 'إعدادات Supabase ناقصة' : 'Supabase Not Configured'}
              </h1>
              <p className="mt-3 text-[13px] leading-relaxed text-gold-soft/70">
                {isRtl
                  ? 'يرجى إضافة VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY إلى ملف .env ثم إعادة تشغيل الخادم.'
                  : 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file, then restart the dev server.'}
              </p>
              <button type="button" onClick={onClose} className={cn(btnPrimary, 'mt-7 mx-auto')}>
                {isRtl ? 'العودة للموقع' : 'Return to Site'}
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleLogin}
              className="w-full max-w-md border border-gold/15 bg-bg-ink/70 p-9 md:p-10 backdrop-blur-sm"
              noValidate
            >
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center border border-gold/25 text-gold">
                  <Lock size={18} />
                </div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold/70">
                  {isRtl ? 'بوابة الإدارة' : 'Admin Portal'}
                </p>
                <h1 className="mt-2 font-display text-3xl tracking-tight text-bg-light">
                  {isRtl ? 'عيادات المعالي' : 'Al Maali Clinics'}
                </h1>
                <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-gold-soft/65">
                  {isRtl
                    ? 'أدخل بريدك الإلكتروني وكلمة المرور للدخول إلى لوحة التحكم.'
                    : 'Sign in with your credentials to manage clinic content.'}
                </p>
              </div>

              <div className="space-y-4 text-start">
                <AdminField label={isRtl ? 'البريد الإلكتروني' : 'Email'} error={loginFieldErrors.email}>
                  <div className="relative">
                    <Mail
                      size={14}
                      className={cn(
                        'pointer-events-none absolute top-1/2 -translate-y-1/2 text-gold/40',
                        isRtl ? 'right-3.5' : 'left-3.5'
                      )}
                    />
                    <AdminInput
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (loginFieldErrors.email) setLoginFieldErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      placeholder="admin@almaali.com"
                      autoComplete="email"
                      dir="ltr"
                      error={!!loginFieldErrors.email}
                      className={cn(
                        'border-gold/20 bg-bg-dark/50 text-bg-light placeholder:text-muted/50 focus:border-gold/40',
                        isRtl ? 'pr-10' : 'pl-10'
                      )}
                    />
                  </div>
                </AdminField>

                <AdminField label={isRtl ? 'كلمة المرور' : 'Password'} error={loginFieldErrors.password}>
                  <div className="relative">
                    <Lock
                      size={14}
                      className={cn(
                        'pointer-events-none absolute top-1/2 -translate-y-1/2 text-gold/40',
                        isRtl ? 'right-3.5' : 'left-3.5'
                      )}
                    />
                    <AdminInput
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (loginFieldErrors.password) setLoginFieldErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      dir="ltr"
                      error={!!loginFieldErrors.password}
                      className={cn(
                        'border-gold/20 bg-bg-dark/50 text-bg-light placeholder:text-muted/50 focus:border-gold/40',
                        isRtl ? 'pr-10 pl-10' : 'pl-10 pr-10'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className={cn(
                        'absolute top-1/2 -translate-y-1/2 text-gold/50 transition hover:text-gold',
                        isRtl ? 'left-3.5' : 'right-3.5'
                      )}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </AdminField>

                {loginError && (
                  <p className="text-center text-[12px] leading-relaxed text-red-300">{loginError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="mt-7 flex w-full items-center justify-center gap-2 bg-bronze py-3 text-[13px] font-semibold text-bg-dark transition hover:bg-gold disabled:opacity-60"
              >
                {isLoggingIn ? (
                  <>
                    <span className="h-4 w-4 animate-spin border-2 border-bg-dark border-t-transparent" />
                    {isRtl ? 'جاري التحقق...' : 'Signing in...'}
                  </>
                ) : (
                  isRtl ? 'دخول لوحة التحكم' : 'Sign In'
                )}
              </button>
            </form>
          )}
        </main>
      </div>
    );
  }

  // ─── DASHBOARD ───
  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="flex min-h-screen flex-col bg-bg-light text-ink font-sans selection:bg-bronze/25"
    >
      <AdminToast
        saving={isSaving ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : null}
        success={actionSuccess}
        error={actionError}
      />

      <AdminConfirm
        open={!!confirmDialog}
        title={isRtl ? 'تأكيد الحذف' : 'Confirm Deletion'}
        message={confirmDialog?.message || ''}
        confirmLabel={isRtl ? 'حذف' : 'Delete'}
        cancelLabel={isRtl ? 'إلغاء' : 'Cancel'}
        destructive
        onCancel={() => setConfirmDialog(null)}
        onConfirm={() => {
          const cb = confirmDialog?.onConfirm;
          setConfirmDialog(null);
          cb?.();
        }}
      />

      {/* Blog drawer */}
      <AdminDrawer
        open={!!editingBlog}
        onClose={closeDrawers}
        isRtl={isRtl}
        wide
        title={
          editingBlog?.id
            ? isRtl
              ? 'تعديل المقال'
              : 'Edit Article'
            : isRtl
              ? 'مقال جديد'
              : 'New Article'
        }
        subtitle={isRtl ? 'المحتوى يظهر فوراً على الموقع بعد الحفظ' : 'Published content appears on the site immediately'}
        footer={drawerFooter('admin-blog-form', closeDrawers, isRtl ? 'حفظ ونشر' : 'Save & Publish')}
      >
        {editingBlog && (
          <form id="admin-blog-form" onSubmit={saveBlog} className="grid grid-cols-1 gap-5 md:grid-cols-2" noValidate>
            <AdminField label={isRtl ? 'العنوان (عربي)' : 'Title (AR)'} error={fieldErrors['title.ar']}>
              <AdminInput
                value={editingBlog.title?.ar || ''}
                error={!!fieldErrors['title.ar']}
                onChange={(e) =>
                  setEditingBlog({
                    ...editingBlog,
                    title: { ar: e.target.value, en: editingBlog.title?.en || '' },
                  })
                }
              />
            </AdminField>
            <AdminField label={isRtl ? 'العنوان (إنجليزي)' : 'Title (EN)'} error={fieldErrors['title.en']}>
              <AdminInput
                value={editingBlog.title?.en || ''}
                error={!!fieldErrors['title.en']}
                onChange={(e) =>
                  setEditingBlog({
                    ...editingBlog,
                    title: { ar: editingBlog.title?.ar || '', en: e.target.value },
                  })
                }
              />
            </AdminField>
            <AdminField label={isRtl ? 'التصنيف (عربي)' : 'Category (AR)'} error={fieldErrors['category.ar']}>
              <AdminInput
                value={editingBlog.category?.ar || ''}
                error={!!fieldErrors['category.ar']}
                onChange={(e) =>
                  setEditingBlog({
                    ...editingBlog,
                    category: { ar: e.target.value, en: editingBlog.category?.en || '' },
                  })
                }
              />
            </AdminField>
            <AdminField label={isRtl ? 'التصنيف (إنجليزي)' : 'Category (EN)'} error={fieldErrors['category.en']}>
              <AdminInput
                value={editingBlog.category?.en || ''}
                error={!!fieldErrors['category.en']}
                onChange={(e) =>
                  setEditingBlog({
                    ...editingBlog,
                    category: { ar: editingBlog.category?.ar || '', en: e.target.value },
                  })
                }
              />
            </AdminField>
            <AdminField label={isRtl ? 'الكاتب (عربي)' : 'Author (AR)'} hint={isRtl ? 'اختياري' : 'Optional'}>
              <AdminInput
                value={editingBlog.author?.ar || ''}
                onChange={(e) =>
                  setEditingBlog({
                    ...editingBlog,
                    author: { ar: e.target.value, en: editingBlog.author?.en || '' },
                  })
                }
              />
            </AdminField>
            <AdminField label={isRtl ? 'الكاتب (إنجليزي)' : 'Author (EN)'} hint={isRtl ? 'اختياري' : 'Optional'}>
              <AdminInput
                value={editingBlog.author?.en || ''}
                onChange={(e) =>
                  setEditingBlog({
                    ...editingBlog,
                    author: { ar: editingBlog.author?.ar || '', en: e.target.value },
                  })
                }
              />
            </AdminField>
            <AdminField label={isRtl ? 'مدة القراءة (عربي)' : 'Read time (AR)'} hint={isRtl ? 'اختياري' : 'Optional'}>
              <AdminInput
                value={editingBlog.readTime?.ar || ''}
                onChange={(e) =>
                  setEditingBlog({
                    ...editingBlog,
                    readTime: { ar: e.target.value, en: editingBlog.readTime?.en || '' },
                  })
                }
              />
            </AdminField>
            <AdminField label={isRtl ? 'مدة القراءة (إنجليزي)' : 'Read time (EN)'} hint={isRtl ? 'اختياري' : 'Optional'}>
              <AdminInput
                value={editingBlog.readTime?.en || ''}
                onChange={(e) =>
                  setEditingBlog({
                    ...editingBlog,
                    readTime: { ar: editingBlog.readTime?.ar || '', en: e.target.value },
                  })
                }
              />
            </AdminField>

            <AdminDropzone
              image={editingBlog.image}
              onSet={(dataUrl) => {
                setEditingBlog({ ...editingBlog, image: dataUrl });
                if (fieldErrors.image) setFieldErrors((prev) => ({ ...prev, image: '' }));
              }}
              onClear={() => setEditingBlog({ ...editingBlog, image: '' })}
              label={isRtl ? 'صورة المقال' : 'Cover image'}
              error={fieldErrors.image}
              isRtl={isRtl}
            />

            <AdminField
              className="md:col-span-2"
              label={isRtl ? 'نبذة (عربي)' : 'Excerpt (AR)'}
              hint={isRtl ? 'اختياري' : 'Optional'}
            >
              <AdminTextarea
                rows={2}
                value={editingBlog.excerpt?.ar || ''}
                onChange={(e) =>
                  setEditingBlog({
                    ...editingBlog,
                    excerpt: { ar: e.target.value, en: editingBlog.excerpt?.en || '' },
                  })
                }
              />
            </AdminField>
            <AdminField
              className="md:col-span-2"
              label={isRtl ? 'نبذة (إنجليزي)' : 'Excerpt (EN)'}
              hint={isRtl ? 'اختياري' : 'Optional'}
            >
              <AdminTextarea
                rows={2}
                value={editingBlog.excerpt?.en || ''}
                onChange={(e) =>
                  setEditingBlog({
                    ...editingBlog,
                    excerpt: { ar: editingBlog.excerpt?.ar || '', en: e.target.value },
                  })
                }
              />
            </AdminField>
            <AdminField
              className="md:col-span-2"
              label={isRtl ? 'المحتوى الكامل (عربي)' : 'Full content (AR)'}
              error={fieldErrors['content.ar']}
            >
              <AdminTextarea
                rows={6}
                value={editingBlog.content?.ar || ''}
                error={!!fieldErrors['content.ar']}
                onChange={(e) =>
                  setEditingBlog({
                    ...editingBlog,
                    content: { ar: e.target.value, en: editingBlog.content?.en || '' },
                  })
                }
              />
            </AdminField>
            <AdminField
              className="md:col-span-2"
              label={isRtl ? 'المحتوى الكامل (إنجليزي)' : 'Full content (EN)'}
              error={fieldErrors['content.en']}
            >
              <AdminTextarea
                rows={6}
                value={editingBlog.content?.en || ''}
                error={!!fieldErrors['content.en']}
                onChange={(e) =>
                  setEditingBlog({
                    ...editingBlog,
                    content: { ar: editingBlog.content?.ar || '', en: e.target.value },
                  })
                }
              />
            </AdminField>
          </form>
        )}
      </AdminDrawer>

      {/* Gallery drawer */}
      <AdminDrawer
        open={!!editingGallery}
        onClose={closeDrawers}
        isRtl={isRtl}
        title={
          editingGallery?.id
            ? isRtl
              ? 'تعديل صورة المعرض'
              : 'Edit Gallery Item'
            : isRtl
              ? 'إضافة صورة'
              : 'Add Image'
        }
        subtitle={isRtl ? 'صور العيادة وحالات الابتسامة' : 'Clinic spaces and smile cases'}
        footer={drawerFooter('admin-gallery-form', closeDrawers, isRtl ? 'حفظ' : 'Save')}
      >
        {editingGallery && (
          <form id="admin-gallery-form" onSubmit={saveGallery} className="grid grid-cols-1 gap-5 md:grid-cols-2" noValidate>
            <AdminField label={isRtl ? 'العنوان (عربي)' : 'Title (AR)'} error={fieldErrors['title.ar']}>
              <AdminInput
                value={editingGallery.title?.ar || ''}
                error={!!fieldErrors['title.ar']}
                onChange={(e) =>
                  setEditingGallery({
                    ...editingGallery,
                    title: { ar: e.target.value, en: editingGallery.title?.en || '' },
                  })
                }
              />
            </AdminField>
            <AdminField label={isRtl ? 'العنوان (إنجليزي)' : 'Title (EN)'} error={fieldErrors['title.en']}>
              <AdminInput
                value={editingGallery.title?.en || ''}
                error={!!fieldErrors['title.en']}
                onChange={(e) =>
                  setEditingGallery({
                    ...editingGallery,
                    title: { ar: editingGallery.title?.ar || '', en: e.target.value },
                  })
                }
              />
            </AdminField>
            <AdminField className="md:col-span-2" label={isRtl ? 'التصنيف' : 'Category'} error={fieldErrors.category}>
              <AdminSelect
                value={editingGallery.category || galleryCategories[0]?.id || ''}
                error={!!fieldErrors.category}
                onChange={(e) =>
                  setEditingGallery({
                    ...editingGallery,
                    category: e.target.value,
                  })
                }
              >
                {galleryCategories.length === 0 ? (
                  <option value="">{isRtl ? 'أضف تصنيفاً أولاً' : 'Add a category first'}</option>
                ) : (
                  galleryCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label[lang]}
                    </option>
                  ))
                )}
              </AdminSelect>
            </AdminField>

            <AdminDropzone
              image={editingGallery.image}
              onSet={(dataUrl) => {
                setEditingGallery({ ...editingGallery, image: dataUrl });
                if (fieldErrors.image) setFieldErrors((prev) => ({ ...prev, image: '' }));
              }}
              onClear={() => setEditingGallery({ ...editingGallery, image: '' })}
              label={isRtl ? 'الصورة' : 'Image'}
              error={fieldErrors.image}
              isRtl={isRtl}
            />

            <AdminField label={isRtl ? 'الوصف (عربي)' : 'Description (AR)'} hint={isRtl ? 'اختياري' : 'Optional'}>
              <AdminTextarea
                rows={3}
                value={editingGallery.description?.ar || ''}
                onChange={(e) =>
                  setEditingGallery({
                    ...editingGallery,
                    description: { ar: e.target.value, en: editingGallery.description?.en || '' },
                  })
                }
              />
            </AdminField>
            <AdminField label={isRtl ? 'الوصف (إنجليزي)' : 'Description (EN)'} hint={isRtl ? 'اختياري' : 'Optional'}>
              <AdminTextarea
                rows={3}
                value={editingGallery.description?.en || ''}
                onChange={(e) =>
                  setEditingGallery({
                    ...editingGallery,
                    description: { ar: editingGallery.description?.ar || '', en: e.target.value },
                  })
                }
              />
            </AdminField>
          </form>
        )}
      </AdminDrawer>

      {/* Category drawer */}
      <AdminDrawer
        open={!!editingCategory}
        onClose={closeDrawers}
        isRtl={isRtl}
        title={
          editingCategory?.id
            ? isRtl
              ? 'تعديل التصنيف'
              : 'Edit category'
            : isRtl
              ? 'تصنيف جديد'
              : 'New category'
        }
        footer={drawerFooter(
          'category-form',
          closeDrawers,
          isRtl ? 'حفظ التصنيف' : 'Save category'
        )}
      >
        {editingCategory && (
          <form id="category-form" onSubmit={saveCategory} className="grid gap-5">
            <AdminField label={isRtl ? 'الاسم (عربي)' : 'Label (AR)'} error={fieldErrors['label.ar']}>
              <AdminInput
                value={editingCategory.label?.ar || ''}
                error={!!fieldErrors['label.ar']}
                onChange={(e) =>
                  setEditingCategory({
                    ...editingCategory,
                    label: { ar: e.target.value, en: editingCategory.label?.en || '' },
                  })
                }
              />
            </AdminField>
            <AdminField label={isRtl ? 'الاسم (إنجليزي)' : 'Label (EN)'} error={fieldErrors['label.en']}>
              <AdminInput
                value={editingCategory.label?.en || ''}
                error={!!fieldErrors['label.en']}
                onChange={(e) =>
                  setEditingCategory({
                    ...editingCategory,
                    label: { ar: editingCategory.label?.ar || '', en: e.target.value },
                  })
                }
              />
            </AdminField>
            {editingCategory.id ? (
              <p className="text-[12px] text-muted">
                {isRtl ? 'المعرّف:' : 'ID:'} <code className="text-ink">{editingCategory.id}</code>
              </p>
            ) : (
              <p className="text-[12px] text-muted">
                {isRtl
                  ? 'سيتم توليد المعرّف تلقائياً من الاسم الإنجليزي.'
                  : 'ID is auto-generated from the English label.'}
              </p>
            )}
          </form>
        )}
      </AdminDrawer>

      {/* Doctor drawer */}

      <AdminDrawer
        open={!!editingDoctor}
        onClose={closeDrawers}
        isRtl={isRtl}
        wide
        title={
          editingDoctor?.id
            ? isRtl
              ? 'تعديل الطبيب'
              : 'Edit Doctor'
            : isRtl
              ? 'إضافة طبيب'
              : 'Add Doctor'
        }
        subtitle={isRtl ? 'ملفات الفريق الطبي الاستشاري' : 'Consultant faculty profiles'}
        footer={drawerFooter('admin-doctor-form', closeDrawers, isRtl ? 'حفظ الملف' : 'Save Profile')}
      >
        {editingDoctor && (
          <form id="admin-doctor-form" onSubmit={saveDoctor} className="grid grid-cols-1 gap-5 md:grid-cols-2" noValidate>
            <AdminField label={isRtl ? 'الاسم (عربي)' : 'Name (AR)'} error={fieldErrors['name.ar']}>
              <AdminInput
                value={editingDoctor.name?.ar || ''}
                error={!!fieldErrors['name.ar']}
                onChange={(e) =>
                  setEditingDoctor({
                    ...editingDoctor,
                    name: { ar: e.target.value, en: editingDoctor.name?.en || '' },
                  })
                }
              />
            </AdminField>
            <AdminField label={isRtl ? 'الاسم (إنجليزي)' : 'Name (EN)'} error={fieldErrors['name.en']}>
              <AdminInput
                value={editingDoctor.name?.en || ''}
                error={!!fieldErrors['name.en']}
                onChange={(e) =>
                  setEditingDoctor({
                    ...editingDoctor,
                    name: { ar: editingDoctor.name?.ar || '', en: e.target.value },
                  })
                }
              />
            </AdminField>
            <AdminField
              label={isRtl ? 'التخصص (عربي)' : 'Role (AR)'}
              hint={isRtl ? 'اختياري' : 'Optional'}
            >
              <AdminInput
                value={editingDoctor.role?.ar || ''}
                onChange={(e) =>
                  setEditingDoctor({
                    ...editingDoctor,
                    role: { ar: e.target.value, en: editingDoctor.role?.en || '' },
                  })
                }
              />
            </AdminField>
            <AdminField
              label={isRtl ? 'التخصص (إنجليزي)' : 'Role (EN)'}
              hint={isRtl ? 'اختياري' : 'Optional'}
            >
              <AdminInput
                value={editingDoctor.role?.en || ''}
                onChange={(e) =>
                  setEditingDoctor({
                    ...editingDoctor,
                    role: { ar: editingDoctor.role?.ar || '', en: e.target.value },
                  })
                }
              />
            </AdminField>

            <AdminDropzone
              image={editingDoctor.image}
              onSet={(dataUrl) => {
                setEditingDoctor({ ...editingDoctor, image: dataUrl });
                if (fieldErrors.image) setFieldErrors((prev) => ({ ...prev, image: '' }));
              }}
              onClear={() => setEditingDoctor({ ...editingDoctor, image: '' })}
              label={isRtl ? 'صورة الطبيب' : 'Profile photo'}
              error={fieldErrors.image}
              isRtl={isRtl}
            />

            <AdminField
              label={isRtl ? 'الخبرات (عربي، مفصولة بفاصلة)' : 'Specialties (AR, comma-separated)'}
              hint={isRtl ? 'اختياري' : 'Optional'}
            >
              <AdminInput
                value={
                  Array.isArray(editingDoctor.specialties?.ar)
                    ? editingDoctor.specialties.ar.join(', ')
                    : String(editingDoctor.specialties?.ar || '')
                }
                onChange={(e) =>
                  setEditingDoctor({
                    ...editingDoctor,
                    specialties: {
                      ar: e.target.value as unknown as string[],
                      en: editingDoctor.specialties?.en || [],
                    },
                  })
                }
              />
            </AdminField>
            <AdminField
              label={isRtl ? 'الخبرات (إنجليزي، مفصولة بفاصلة)' : 'Specialties (EN, comma-separated)'}
              hint={isRtl ? 'اختياري' : 'Optional'}
            >
              <AdminInput
                value={
                  Array.isArray(editingDoctor.specialties?.en)
                    ? editingDoctor.specialties.en.join(', ')
                    : String(editingDoctor.specialties?.en || '')
                }
                onChange={(e) =>
                  setEditingDoctor({
                    ...editingDoctor,
                    specialties: {
                      ar: editingDoctor.specialties?.ar || [],
                      en: e.target.value as unknown as string[],
                    },
                  })
                }
              />
            </AdminField>

            <AdminField
              className="md:col-span-2"
              label={isRtl ? 'التعليم (عربي)' : 'Education (AR)'}
              hint={isRtl ? 'اختياري' : 'Optional'}
            >
              <AdminInput
                value={editingDoctor.education?.ar || ''}
                onChange={(e) =>
                  setEditingDoctor({
                    ...editingDoctor,
                    education: { ar: e.target.value, en: editingDoctor.education?.en || '' },
                  })
                }
              />
            </AdminField>
            <AdminField
              className="md:col-span-2"
              label={isRtl ? 'التعليم (إنجليزي)' : 'Education (EN)'}
              hint={isRtl ? 'اختياري' : 'Optional'}
            >
              <AdminInput
                value={editingDoctor.education?.en || ''}
                onChange={(e) =>
                  setEditingDoctor({
                    ...editingDoctor,
                    education: { ar: editingDoctor.education?.ar || '', en: e.target.value },
                  })
                }
              />
            </AdminField>
            <AdminField
              className="md:col-span-2"
              label={isRtl ? 'السيرة (عربي)' : 'Bio (AR)'}
              hint={isRtl ? 'اختياري' : 'Optional'}
            >
              <AdminTextarea
                rows={3}
                value={editingDoctor.bio?.ar || ''}
                onChange={(e) =>
                  setEditingDoctor({
                    ...editingDoctor,
                    bio: { ar: e.target.value, en: editingDoctor.bio?.en || '' },
                  })
                }
              />
            </AdminField>
            <AdminField
              className="md:col-span-2"
              label={isRtl ? 'السيرة (إنجليزي)' : 'Bio (EN)'}
              hint={isRtl ? 'اختياري' : 'Optional'}
            >
              <AdminTextarea
                rows={3}
                value={editingDoctor.bio?.en || ''}
                onChange={(e) =>
                  setEditingDoctor({
                    ...editingDoctor,
                    bio: { ar: editingDoctor.bio?.ar || '', en: e.target.value },
                  })
                }
              />
            </AdminField>
          </form>
        )}
      </AdminDrawer>

      {/* Service drawer */}
      <AdminDrawer
        open={!!editingService}
        onClose={closeDrawers}
        title={
          editingService?.id
            ? isRtl
              ? 'تعديل الخدمة'
              : 'Edit Service'
            : isRtl
              ? 'إضافة خدمة'
              : 'Add Service'
        }
        subtitle={isRtl ? 'تخصصات العيادة الظاهرة للزوار' : 'Clinic specialties shown on the site'}
        footer={drawerFooter('admin-service-form', closeDrawers, isRtl ? 'حفظ الخدمة' : 'Save Service')}
      >
        {editingService && (
          <form id="admin-service-form" onSubmit={saveService} className="grid grid-cols-1 gap-5 md:grid-cols-2" noValidate>
            <AdminField label={isRtl ? 'العنوان (عربي)' : 'Title (AR)'} error={fieldErrors['title.ar']}>
              <AdminInput
                value={editingService.title?.ar || ''}
                error={!!fieldErrors['title.ar']}
                onChange={(e) =>
                  setEditingService({
                    ...editingService,
                    title: { ar: e.target.value, en: editingService.title?.en || '' },
                  })
                }
              />
            </AdminField>
            <AdminField label={isRtl ? 'العنوان (إنجليزي)' : 'Title (EN)'} error={fieldErrors['title.en']}>
              <AdminInput
                value={editingService.title?.en || ''}
                error={!!fieldErrors['title.en']}
                onChange={(e) =>
                  setEditingService({
                    ...editingService,
                    title: { ar: editingService.title?.ar || '', en: e.target.value },
                  })
                }
              />
            </AdminField>
            <AdminField
              className="md:col-span-2"
              label={isRtl ? 'الوصف (عربي)' : 'Description (AR)'}
              error={fieldErrors['description.ar']}
            >
              <AdminTextarea
                rows={2}
                value={editingService.description?.ar || ''}
                error={!!fieldErrors['description.ar']}
                onChange={(e) =>
                  setEditingService({
                    ...editingService,
                    description: { ar: e.target.value, en: editingService.description?.en || '' },
                  })
                }
              />
            </AdminField>
            <AdminField
              className="md:col-span-2"
              label={isRtl ? 'الوصف (إنجليزي)' : 'Description (EN)'}
              error={fieldErrors['description.en']}
            >
              <AdminTextarea
                rows={2}
                value={editingService.description?.en || ''}
                error={!!fieldErrors['description.en']}
                onChange={(e) =>
                  setEditingService({
                    ...editingService,
                    description: { ar: editingService.description?.ar || '', en: e.target.value },
                  })
                }
              />
            </AdminField>
            <AdminDropzone
              image={editingService.image}
              onSet={(dataUrl) => {
                setEditingService({ ...editingService, image: dataUrl });
                if (fieldErrors.image) setFieldErrors((prev) => ({ ...prev, image: '' }));
              }}
              onClear={() => setEditingService({ ...editingService, image: '' })}
              label={isRtl ? 'صورة الخدمة' : 'Service image'}
              error={fieldErrors.image}
              isRtl={isRtl}
            />
            <AdminField label={isRtl ? 'المدة (عربي)' : 'Duration (AR)'} hint={isRtl ? 'اختياري' : 'Optional'}>
              <AdminInput
                value={editingService.duration?.ar || ''}
                onChange={(e) =>
                  setEditingService({
                    ...editingService,
                    duration: { ar: e.target.value, en: editingService.duration?.en || '' },
                  })
                }
              />
            </AdminField>
            <AdminField label={isRtl ? 'المدة (إنجليزي)' : 'Duration (EN)'} hint={isRtl ? 'اختياري' : 'Optional'}>
              <AdminInput
                value={editingService.duration?.en || ''}
                onChange={(e) =>
                  setEditingService({
                    ...editingService,
                    duration: { ar: editingService.duration?.ar || '', en: e.target.value },
                  })
                }
              />
            </AdminField>
            <AdminField
              className="md:col-span-2"
              label={isRtl ? 'التفاصيل (عربي، سطر لكل نقطة)' : 'Details (AR, one per line)'}
              hint={isRtl ? 'اختياري' : 'Optional'}
            >
              <AdminTextarea
                rows={4}
                value={
                  Array.isArray(editingService.details?.ar)
                    ? editingService.details.ar.join('\n')
                    : String(editingService.details?.ar || '')
                }
                onChange={(e) =>
                  setEditingService({
                    ...editingService,
                    details: {
                      ar: e.target.value as unknown as string[],
                      en: editingService.details?.en || [],
                    },
                  })
                }
              />
            </AdminField>
            <AdminField
              className="md:col-span-2"
              label={isRtl ? 'التفاصيل (إنجليزي، سطر لكل نقطة)' : 'Details (EN, one per line)'}
              hint={isRtl ? 'اختياري' : 'Optional'}
            >
              <AdminTextarea
                rows={4}
                value={
                  Array.isArray(editingService.details?.en)
                    ? editingService.details.en.join('\n')
                    : String(editingService.details?.en || '')
                }
                onChange={(e) =>
                  setEditingService({
                    ...editingService,
                    details: {
                      ar: editingService.details?.ar || [],
                      en: e.target.value as unknown as string[],
                    },
                  })
                }
              />
            </AdminField>
          </form>
        )}
      </AdminDrawer>

      {/* Testimonial drawer */}
      <AdminDrawer
        open={!!editingTestimonial}
        onClose={closeDrawers}
        title={
          editingTestimonial?.id
            ? isRtl
              ? 'تعديل التقييم'
              : 'Edit Review'
            : isRtl
              ? 'إضافة تقييم'
              : 'Add Review'
        }
        subtitle={isRtl ? 'آراء العملاء الظاهرة في الموقع' : 'Guest reviews shown on the site'}
        footer={drawerFooter('admin-testimonial-form', closeDrawers, isRtl ? 'حفظ التقييم' : 'Save Review')}
      >
        {editingTestimonial && (
          <form
            id="admin-testimonial-form"
            onSubmit={saveTestimonial}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
            noValidate
          >
            <AdminField label={isRtl ? 'الاسم (عربي)' : 'Name (AR)'} error={fieldErrors['name.ar']}>
              <AdminInput
                value={editingTestimonial.name?.ar || ''}
                error={!!fieldErrors['name.ar']}
                onChange={(e) =>
                  setEditingTestimonial({
                    ...editingTestimonial,
                    name: { ar: e.target.value, en: editingTestimonial.name?.en || '' },
                  })
                }
              />
            </AdminField>
            <AdminField label={isRtl ? 'الاسم (إنجليزي)' : 'Name (EN)'} error={fieldErrors['name.en']}>
              <AdminInput
                value={editingTestimonial.name?.en || ''}
                error={!!fieldErrors['name.en']}
                onChange={(e) =>
                  setEditingTestimonial({
                    ...editingTestimonial,
                    name: { ar: editingTestimonial.name?.ar || '', en: e.target.value },
                  })
                }
              />
            </AdminField>
            <AdminField label={isRtl ? 'التقييم (١–٥)' : 'Rating (1–5)'} error={fieldErrors.rating}>
              <AdminSelect
                value={String(editingTestimonial.rating || 5)}
                error={!!fieldErrors.rating}
                onChange={(e) =>
                  setEditingTestimonial({
                    ...editingTestimonial,
                    rating: Number(e.target.value),
                  })
                }
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField label={isRtl ? 'التاريخ' : 'Date'} hint={isRtl ? 'اختياري' : 'Optional'}>
              <AdminInput
                type="date"
                value={editingTestimonial.date || ''}
                onChange={(e) => setEditingTestimonial({ ...editingTestimonial, date: e.target.value })}
              />
            </AdminField>
            <AdminDropzone
              image={editingTestimonial.image}
              onSet={(dataUrl) => {
                setEditingTestimonial({ ...editingTestimonial, image: dataUrl });
                if (fieldErrors.image) setFieldErrors((prev) => ({ ...prev, image: '' }));
              }}
              onClear={() => setEditingTestimonial({ ...editingTestimonial, image: '' })}
              label={isRtl ? 'صورة العميل' : 'Guest photo'}
              error={fieldErrors.image}
              isRtl={isRtl}
            />
            <p className="-mt-2 text-[11px] text-muted md:col-span-2">
              {isRtl
                ? 'اختياري — إن لم تُرفع صورة يُعرض الحرف الأول من الاسم'
                : 'Optional — if empty, the first letter of the name is shown'}
            </p>
            <AdminField label={isRtl ? 'العلاج (عربي)' : 'Treatment (AR)'} hint={isRtl ? 'اختياري' : 'Optional'}>
              <AdminInput
                value={editingTestimonial.treatment?.ar || ''}
                onChange={(e) =>
                  setEditingTestimonial({
                    ...editingTestimonial,
                    treatment: { ar: e.target.value, en: editingTestimonial.treatment?.en || '' },
                  })
                }
              />
            </AdminField>
            <AdminField label={isRtl ? 'العلاج (إنجليزي)' : 'Treatment (EN)'} hint={isRtl ? 'اختياري' : 'Optional'}>
              <AdminInput
                value={editingTestimonial.treatment?.en || ''}
                onChange={(e) =>
                  setEditingTestimonial({
                    ...editingTestimonial,
                    treatment: { ar: editingTestimonial.treatment?.ar || '', en: e.target.value },
                  })
                }
              />
            </AdminField>
            <AdminField
              className="md:col-span-2"
              label={isRtl ? 'التعليق (عربي)' : 'Comment (AR)'}
              error={fieldErrors['comment.ar']}
            >
              <AdminTextarea
                rows={3}
                value={editingTestimonial.comment?.ar || ''}
                error={!!fieldErrors['comment.ar']}
                onChange={(e) =>
                  setEditingTestimonial({
                    ...editingTestimonial,
                    comment: { ar: e.target.value, en: editingTestimonial.comment?.en || '' },
                  })
                }
              />
            </AdminField>
            <AdminField
              className="md:col-span-2"
              label={isRtl ? 'التعليق (إنجليزي)' : 'Comment (EN)'}
              error={fieldErrors['comment.en']}
            >
              <AdminTextarea
                rows={3}
                value={editingTestimonial.comment?.en || ''}
                error={!!fieldErrors['comment.en']}
                onChange={(e) =>
                  setEditingTestimonial({
                    ...editingTestimonial,
                    comment: { ar: editingTestimonial.comment?.ar || '', en: e.target.value },
                  })
                }
              />
            </AdminField>
          </form>
        )}
      </AdminDrawer>

      {/* Vision images drawer */}
      <AdminDrawer
        open={!!editingVision}
        onClose={closeDrawers}
        title={isRtl ? 'صور رؤيتنا' : 'Vision Images'}
        subtitle={isRtl ? 'الصورتان بعد الهيرو مباشرة' : 'The two photos right after the hero'}
        footer={drawerFooter('admin-vision-form', closeDrawers, isRtl ? 'حفظ الصور' : 'Save Images')}
      >
        {editingVision && (
          <form id="admin-vision-form" onSubmit={saveVision} className="grid grid-cols-1 gap-5" noValidate>
            <AdminDropzone
              image={editingVision.imagePrimary}
              onSet={(dataUrl) => {
                setEditingVision({ ...editingVision, imagePrimary: dataUrl });
                if (fieldErrors.imagePrimary) setFieldErrors((prev) => ({ ...prev, imagePrimary: '' }));
              }}
              onClear={() => setEditingVision({ ...editingVision, imagePrimary: '' })}
              label={isRtl ? 'الصورة الرئيسية (كبيرة)' : 'Primary image (large)'}
              error={fieldErrors.imagePrimary}
              isRtl={isRtl}
            />
            <AdminDropzone
              image={editingVision.imageSecondary}
              onSet={(dataUrl) => {
                setEditingVision({ ...editingVision, imageSecondary: dataUrl });
                if (fieldErrors.imageSecondary) {
                  setFieldErrors((prev) => ({ ...prev, imageSecondary: '' }));
                }
              }}
              onClear={() => setEditingVision({ ...editingVision, imageSecondary: '' })}
              label={isRtl ? 'الصورة الثانوية' : 'Secondary image'}
              error={fieldErrors.imageSecondary}
              isRtl={isRtl}
            />
          </form>
        )}
      </AdminDrawer>

      {/* Shell header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-ink/10 bg-bg-dark px-5 py-3.5 text-bg-light md:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <img src={IMAGES.logo} alt="" className="h-7 w-auto shrink-0 opacity-90" />
          <div className="min-w-0">
            <h1 className="truncate font-display text-base tracking-wide md:text-lg">
              {isRtl ? 'لوحة إدارة المعالي' : 'Al Maali Admin'}
            </h1>
            <p className="text-[10px] uppercase tracking-[0.16em] text-gold/60">
              {isRtl ? 'إدارة المحتوى' : 'Content Studio'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              'hidden items-center gap-1.5 border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider sm:inline-flex',
              isSupabaseConfigured
                ? 'border-gold/25 text-gold/80'
                : 'border-red-400/30 text-red-300/90'
            )}
          >
            {isSupabaseConfigured ? <Wifi size={11} /> : <WifiOff size={11} />}
            {isSupabaseConfigured
              ? isRtl
                ? 'متصل'
                : 'Supabase connected'
              : isRtl
                ? 'محلي'
                : 'Offline · local'}
          </span>
          <button
            type="button"
            onClick={() => handleLogout({ close: true, reason: 'manual' })}
            className="inline-flex items-center gap-1.5 border border-red-400/25 px-3 py-1.5 text-[12px] text-red-300 transition hover:border-red-400/50 hover:bg-red-500/10"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">{isRtl ? 'خروج' : 'Logout'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 border border-gold/20 px-3 py-1.5 text-[12px] text-bg-light/85 transition hover:border-gold/40 hover:text-gold"
          >
            {isRtl ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            <span className="hidden sm:inline">{isRtl ? 'الموقع' : 'Site'}</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Sidebar / mobile tabs */}
        <aside className="flex shrink-0 flex-row gap-1 overflow-x-auto border-b border-ink/10 bg-bg-dark/95 p-2 md:w-56 md:flex-col md:overflow-x-visible md:border-b-0 md:border-e md:p-3">
          <p className="mb-2 mt-1 hidden px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-gold/45 md:block">
            {isRtl ? 'الأقسام' : 'Sections'}
          </p>
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                closeDrawers();
              }}
              className={cn(
                'flex flex-grow items-center gap-2.5 whitespace-nowrap px-3.5 py-2.5 text-[12px] font-medium transition md:flex-grow-0',
                activeTab === item.id
                  ? 'bg-bronze text-bg-light'
                  : 'text-bg-light/65 hover:bg-white/5 hover:text-bg-light'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
              {typeof item.count === 'number' && (
                <span
                  className={cn(
                    'ms-auto text-[10px] tabular-nums',
                    activeTab === item.id ? 'text-bg-light/80' : 'text-bg-light/40'
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </aside>

        <main className="relative flex-1 overflow-y-auto p-5 md:p-8">
          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="mx-auto max-w-4xl space-y-8">
              <div>
                <h2 className="font-display text-2xl tracking-tight text-ink">
                  {isRtl ? 'نظرة عامة' : 'Overview'}
                </h2>
                <p className="mt-1 text-[13px] text-muted">
                  {isRtl
                    ? 'ملخص المحتوى المنشور وإجراءات سريعة.'
                    : 'Published content summary and quick actions.'}
                </p>
              </div>

              <div className="border border-ink/10 bg-bg-warm/30 p-5">
                <p className="text-[12px] font-medium uppercase tracking-wider text-bronze">
                  {isRtl ? 'تحسين الصور' : 'Image optimization'}
                </p>
                <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
                  {isRtl
                    ? 'ارفع صور الأطباء والمعرض من قاعدة البيانات إلى التخزين السحابي حتى تظهر الصور الحقيقية بسرعة على الموقع.'
                    : 'Upload doctor & gallery photos from the database into cloud Storage so real portraits appear quickly on the public site.'}
                </p>
                <button
                  type="button"
                  disabled={isMigratingImages || !isSupabaseConfigured}
                  onClick={() => void runImageMigration()}
                  className={cn(btnPrimary, 'mt-4')}
                >
                  {isMigratingImages
                    ? isRtl
                      ? 'جاري الرفع…'
                      : 'Uploading…'
                    : isRtl
                      ? 'تحسين ونشر الصور الآن'
                      : 'Optimize & publish images now'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-px bg-ink/10 sm:grid-cols-3 lg:grid-cols-3">
                {[
                  {
                    label: isRtl ? 'مقالات' : 'Articles',
                    count: blogPosts.length,
                    icon: <BookOpen size={16} />,
                    tab: 'blogs' as AdminTab,
                  },
                  {
                    label: isRtl ? 'صور المعرض' : 'Gallery',
                    count: galleryItems.length,
                    icon: <ImageIcon size={16} />,
                    tab: 'gallery' as AdminTab,
                  },
                  {
                    label: isRtl ? 'أطباء' : 'Doctors',
                    count: doctors.length,
                    icon: <Users size={16} />,
                    tab: 'team' as AdminTab,
                  },
                  {
                    label: isRtl ? 'خدمات' : 'Services',
                    count: services.length,
                    icon: <Sparkles size={16} />,
                    tab: 'services' as AdminTab,
                  },
                  {
                    label: isRtl ? 'تقييمات' : 'Ratings',
                    count: testimonials.length,
                    icon: <Star size={16} />,
                    tab: 'testimonials' as AdminTab,
                  },
                  {
                    label: isRtl ? 'صور الرؤية' : 'Vision',
                    count: 2,
                    icon: <ScanEye size={16} />,
                    tab: 'vision' as AdminTab,
                  },
                ].map((stat) => (
                  <button
                    key={stat.tab}
                    type="button"
                    onClick={() => setActiveTab(stat.tab)}
                    className="flex flex-col gap-4 bg-bg-light p-6 text-start transition hover:bg-bg-warm/40"
                  >
                    <div className="flex items-center justify-between text-muted">
                      {stat.icon}
                      <LayoutDashboard size={14} className="opacity-30" />
                    </div>
                    <div>
                      <p className="font-display text-3xl tabular-nums text-ink">{stat.count}</p>
                      <p className="mt-1 text-[12px] text-muted">{stat.label}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-bronze">
                  {isRtl ? 'إجراءات سريعة' : 'Quick actions'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => openBlogDrawer()} className={btnGhost}>
                    <Plus size={13} />
                    {isRtl ? 'مقال جديد' : 'New article'}
                  </button>
                  <button type="button" onClick={() => openGalleryDrawer()} className={btnGhost}>
                    <Plus size={13} />
                    {isRtl ? 'صورة جديدة' : 'New image'}
                  </button>
                  <button type="button" onClick={() => openDoctorDrawer()} className={btnGhost}>
                    <Plus size={13} />
                    {isRtl ? 'طبيب جديد' : 'New doctor'}
                  </button>
                  <button type="button" onClick={() => openServiceDrawer()} className={btnGhost}>
                    <Plus size={13} />
                    {isRtl ? 'خدمة جديدة' : 'New service'}
                  </button>
                  <button type="button" onClick={() => openTestimonialDrawer()} className={btnGhost}>
                    <Plus size={13} />
                    {isRtl ? 'تقييم جديد' : 'New review'}
                  </button>
                  <button type="button" onClick={() => openVisionEditor()} className={btnGhost}>
                    <Edit3 size={13} />
                    {isRtl ? 'صور الرؤية' : 'Vision images'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Blog list */}
          {activeTab === 'blogs' && (
            <div className="mx-auto max-w-4xl space-y-6">
              {sectionHeader(
                isRtl ? 'المقالات الطبية' : 'Medical Articles',
                isRtl ? 'إدارة ونشر محتوى المدونة.' : 'Manage and publish blog content.',
                isRtl ? 'مقال جديد' : 'Compose',
                () => openBlogDrawer(),
                blogQuery,
                setBlogQuery,
                isRtl ? 'بحث في المقالات...' : 'Search articles...'
              )}

              {filteredBlogs.length === 0 ? (
                emptyState(
                  <BookOpen size={22} />,
                  blogQuery
                    ? isRtl
                      ? 'لا نتائج'
                      : 'No matches'
                    : isRtl
                      ? 'لا توجد مقالات'
                      : 'No articles yet',
                  blogQuery
                    ? isRtl
                      ? 'جرّب كلمات بحث أخرى.'
                      : 'Try a different search term.'
                    : isRtl
                      ? 'ابدأ بكتابة أول مقال طبي.'
                      : 'Compose your first clinical article.'
                )
              ) : (
                <div className="divide-y divide-ink/10 border border-ink/10 bg-white">
                  {filteredBlogs.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-bg-warm/30"
                    >
                      <img
                        src={post.image}
                        alt=""
                        className="h-14 w-14 shrink-0 object-cover bg-bg-warm"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-display text-[15px] text-ink">
                          {post.title[lang]}
                        </h3>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted">
                          <span className="text-bronze">{post.category[lang]}</span>
                          <span aria-hidden>·</span>
                          <span>{post.date[lang]}</span>
                          <span aria-hidden>·</span>
                          <span>{post.author[lang]}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openBlogDrawer(post)}
                          className={btnIcon}
                          title={isRtl ? 'تعديل' : 'Edit'}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBlog(post.id)}
                          className={cn(btnIcon, 'text-red-600 hover:border-red-300 hover:text-red-700')}
                          title={isRtl ? 'حذف' : 'Delete'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Gallery grid */}
          {activeTab === 'gallery' && (
            <div className="mx-auto max-w-5xl space-y-8">
              <div className="border border-ink/10 bg-bg-warm/25 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-medium uppercase tracking-wider text-bronze">
                      {isRtl ? 'تصنيفات المعرض' : 'Gallery categories'}
                    </p>
                    <p className="mt-1 text-[13px] text-muted">
                      {isRtl
                        ? 'أضف أو عدّل التصنيفات التي تظهر كفلاتر في الموقع.'
                        : 'Add or edit the filters shown on the public gallery.'}
                    </p>
                  </div>
                  <button type="button" className={btnGhost} onClick={() => openCategoryEditor()}>
                    <Plus size={14} />
                    {isRtl ? 'تصنيف جديد' : 'New category'}
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {galleryCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="inline-flex items-center gap-2 border border-ink/10 bg-bg-light px-3 py-2 text-[12px]"
                    >
                      <span className="font-medium text-ink">{cat.label[lang]}</span>
                      <span className="text-muted">/{cat.id}</span>
                      <button
                        type="button"
                        className={btnIcon}
                        onClick={() => openCategoryEditor(cat)}
                        title={isRtl ? 'تعديل' : 'Edit'}
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        type="button"
                        className={btnIcon}
                        onClick={() => deleteCategory(cat.id)}
                        title={isRtl ? 'حذف' : 'Delete'}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {sectionHeader(
                isRtl ? 'معرض الصور' : 'Gallery',
                isRtl ? 'صور العيادة وحالات الابتسامة.' : 'Clinic photography and smile cases.',
                isRtl ? 'إضافة صورة' : 'Add image',
                () => openGalleryDrawer(),
                galleryQuery,
                setGalleryQuery,
                isRtl ? 'بحث في المعرض...' : 'Search gallery...'
              )}

              {filteredGallery.length === 0 ? (
                emptyState(
                  <ImageIcon size={22} />,
                  galleryQuery
                    ? isRtl
                      ? 'لا نتائج'
                      : 'No matches'
                    : isRtl
                      ? 'لا توجد صور'
                      : 'No images yet',
                  galleryQuery
                    ? isRtl
                      ? 'جرّب كلمات بحث أخرى.'
                      : 'Try a different search term.'
                    : isRtl
                      ? 'أضف أول صورة للمعرض.'
                      : 'Add your first gallery image.'
                )
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {filteredGallery.map((item) => {
                    const cat = galleryCategories.find((c) => c.id === item.category);
                    return (
                      <div
                        key={item.id}
                        className="group relative overflow-hidden border border-ink/10 bg-white"
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-bg-warm">
                          <img
                            src={item.image}
                            alt={item.title[lang]}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="space-y-1 border-t border-ink/10 p-3">
                          <p className="truncate text-[13px] font-medium text-ink">{item.title[lang]}</p>
                          <p className="text-[10px] uppercase tracking-wider text-bronze">
                            {cat?.label[lang] || item.category}
                          </p>
                        </div>
                        <div className="absolute end-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => openGalleryDrawer(item)}
                            className="flex h-8 w-8 items-center justify-center border border-ink/10 bg-bg-light/95 text-ink shadow-sm"
                            title={isRtl ? 'تعديل' : 'Edit'}
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteGallery(item.id)}
                            className="flex h-8 w-8 items-center justify-center border border-red-200 bg-bg-light/95 text-red-600 shadow-sm"
                            title={isRtl ? 'حذف' : 'Delete'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Team cards */}
          {activeTab === 'team' && (
            <div className="mx-auto max-w-5xl space-y-6">
              {sectionHeader(
                isRtl ? 'الفريق الطبي' : 'Medical Team',
                isRtl ? 'ملفات الاستشاريين والشهادات.' : 'Consultant profiles and credentials.',
                isRtl ? 'إضافة طبيب' : 'Add doctor',
                () => openDoctorDrawer(),
                teamQuery,
                setTeamQuery,
                isRtl ? 'بحث في الفريق...' : 'Search team...'
              )}

              {filteredDoctors.length === 0 ? (
                emptyState(
                  <Users size={22} />,
                  teamQuery
                    ? isRtl
                      ? 'لا نتائج'
                      : 'No matches'
                    : isRtl
                      ? 'لا يوجد أطباء'
                      : 'No doctors yet',
                  teamQuery
                    ? isRtl
                      ? 'جرّب كلمات بحث أخرى.'
                      : 'Try a different search term.'
                    : isRtl
                      ? 'أضف أول استشاري إلى الفريق.'
                      : 'Add the first consultant to the team.'
                )
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="flex flex-col border border-ink/10 bg-white transition hover:border-ink/25"
                    >
                      <div className="aspect-[5/4] overflow-hidden bg-bg-warm">
                        <img
                          src={doctor.image}
                          alt={doctor.name[lang]}
                          className="h-full w-full object-cover object-top"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <div>
                          <h3 className="font-display text-lg text-ink">{doctor.name[lang]}</h3>
                          <p className="mt-0.5 text-[12px] text-bronze">{doctor.role[lang]}</p>
                        </div>
                        <p className="line-clamp-2 text-[12px] leading-relaxed text-muted">
                          {doctor.education[lang]}
                        </p>
                        <div className="mt-auto flex items-center gap-2 pt-3">
                          <button
                            type="button"
                            onClick={() => openDoctorDrawer(doctor)}
                            className={cn(btnGhost, 'flex-1 py-2 text-[12px]')}
                          >
                            <Edit3 size={13} />
                            {isRtl ? 'تعديل' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteDoctor(doctor.id)}
                            className={cn(btnIcon, 'text-red-600 hover:border-red-300')}
                            title={isRtl ? 'حذف' : 'Delete'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Services */}
          {activeTab === 'services' && (
            <div className="mx-auto max-w-5xl space-y-6">
              {sectionHeader(
                isRtl ? 'الخدمات والتخصصات' : 'Services & Specialties',
                isRtl ? 'إدارة بطاقات التخصصات بعد قسم الرؤية.' : 'Manage specialty cards after the vision section.',
                isRtl ? 'إضافة خدمة' : 'Add service',
                () => openServiceDrawer(),
                servicesQuery,
                setServicesQuery,
                isRtl ? 'بحث في الخدمات...' : 'Search services...'
              )}

              {filteredServices.length === 0 ? (
                emptyState(
                  <Sparkles size={22} />,
                  servicesQuery
                    ? isRtl
                      ? 'لا نتائج'
                      : 'No matches'
                    : isRtl
                      ? 'لا توجد خدمات'
                      : 'No services yet',
                  servicesQuery
                    ? isRtl
                      ? 'جرّب كلمات بحث أخرى.'
                      : 'Try a different search term.'
                    : isRtl
                      ? 'أضف أول تخصص للعيادة.'
                      : 'Add the first clinic specialty.'
                )
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {filteredServices.map((service) => (
                    <div
                      key={service.id}
                      className="flex flex-col border border-ink/10 bg-white transition hover:border-ink/25"
                    >
                      <div className="aspect-[16/10] overflow-hidden bg-bg-warm">
                        <img
                          src={service.image || IMAGES.placeholders.case}
                          alt={service.title[lang]}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <h3 className="font-display text-lg text-ink">{service.title[lang]}</h3>
                        <p className="line-clamp-2 text-[12px] leading-relaxed text-muted">
                          {service.description[lang]}
                        </p>
                        <div className="mt-auto flex items-center gap-2 pt-3">
                          <button
                            type="button"
                            onClick={() => openServiceDrawer(service)}
                            className={cn(btnGhost, 'flex-1 py-2 text-[12px]')}
                          >
                            <Edit3 size={13} />
                            {isRtl ? 'تعديل' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteService(service.id)}
                            className={cn(btnIcon, 'text-red-600 hover:border-red-300')}
                            title={isRtl ? 'حذف' : 'Delete'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Testimonials / ratings */}
          {activeTab === 'testimonials' && (
            <div className="mx-auto max-w-5xl space-y-6">
              {sectionHeader(
                isRtl ? 'تقييمات العملاء' : 'Customer Ratings',
                isRtl ? 'آراء الضيوف الظاهرة في الموقع.' : 'Guest reviews shown on the public site.',
                isRtl ? 'إضافة تقييم' : 'Add review',
                () => openTestimonialDrawer(),
                testimonialsQuery,
                setTestimonialsQuery,
                isRtl ? 'بحث في التقييمات...' : 'Search reviews...'
              )}

              {filteredTestimonials.length === 0 ? (
                emptyState(
                  <Star size={22} />,
                  testimonialsQuery
                    ? isRtl
                      ? 'لا نتائج'
                      : 'No matches'
                    : isRtl
                      ? 'لا توجد تقييمات'
                      : 'No reviews yet',
                  testimonialsQuery
                    ? isRtl
                      ? 'جرّب كلمات بحث أخرى.'
                      : 'Try a different search term.'
                    : isRtl
                      ? 'أضف أول تقييم عميل.'
                      : 'Add the first guest review.'
                )
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTestimonials.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col border border-ink/10 bg-white transition hover:border-ink/25"
                    >
                      <div className="aspect-[5/3] overflow-hidden bg-bg-warm">
                        {item.image?.trim() ? (
                          <img
                            src={item.image}
                            alt={item.name[lang]}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-bronze/15">
                            <span className="font-display text-5xl text-bronze">
                              {(item.name[lang] || item.name.en || item.name.ar || '?')
                                .trim()
                                .charAt(0)
                                .toLocaleUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <div className="flex gap-0.5 text-gold">
                          {Array.from({ length: item.rating }).map((_, i) => (
                            <Star key={i} size={12} fill="currentColor" />
                          ))}
                        </div>
                        <h3 className="font-display text-base text-ink">{item.name[lang]}</h3>
                        <p className="line-clamp-3 text-[12px] leading-relaxed text-muted">
                          {item.comment[lang]}
                        </p>
                        <div className="mt-auto flex items-center gap-2 pt-3">
                          <button
                            type="button"
                            onClick={() => openTestimonialDrawer(item)}
                            className={cn(btnGhost, 'flex-1 py-2 text-[12px]')}
                          >
                            <Edit3 size={13} />
                            {isRtl ? 'تعديل' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTestimonial(item.id)}
                            className={cn(btnIcon, 'text-red-600 hover:border-red-300')}
                            title={isRtl ? 'حذف' : 'Delete'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vision images */}
          {activeTab === 'vision' && (
            <div className="mx-auto max-w-4xl space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-display text-2xl tracking-tight text-ink">
                    {isRtl ? 'صور رؤيتنا' : 'Vision Images'}
                  </h2>
                  <p className="mt-1 text-[13px] text-muted">
                    {isRtl
                      ? 'الصورتان في قسم «رؤيتنا» مباشرة بعد الهيرو.'
                      : 'The two photos in the Our Vision section right after the hero.'}
                  </p>
                </div>
                <button type="button" onClick={() => openVisionEditor()} className={btnPrimary}>
                  <Edit3 size={14} />
                  {isRtl ? 'تعديل الصور' : 'Edit images'}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-12">
                <div className="overflow-hidden border border-ink/10 bg-white md:col-span-8">
                  <img
                    src={visionImages.imagePrimary || IMAGES.about}
                    alt=""
                    className="aspect-[16/10] w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <p className="border-t border-ink/10 px-4 py-3 text-[12px] text-muted">
                    {isRtl ? 'الصورة الرئيسية' : 'Primary image'}
                  </p>
                </div>
                <div className="overflow-hidden border border-ink/10 bg-white md:col-span-4">
                  <img
                    src={visionImages.imageSecondary || IMAGES.heroAlt}
                    alt=""
                    className="aspect-[4/5] w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <p className="border-t border-ink/10 px-4 py-3 text-[12px] text-muted">
                    {isRtl ? 'الصورة الثانوية' : 'Secondary image'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="flex flex-col items-center justify-between gap-2 border-t border-ink/10 bg-bg-warm/30 px-6 py-3 text-[11px] text-muted sm:flex-row">
        <span>
          {isRtl
            ? 'التعديلات تُحفظ بأمان وتظهر للزوار فوراً.'
            : 'Updates sync securely and appear for visitors immediately.'}
        </span>
        <span className="uppercase tracking-[0.14em] text-bronze/80">Masar Agency</span>
      </footer>
    </div>
  );
}
