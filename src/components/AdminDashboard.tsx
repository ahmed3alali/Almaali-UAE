/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock, LayoutDashboard, BookOpen, Image as ImageIcon,
  Users, Trash2, Edit3, Plus, Save,
  ChevronRight, ChevronLeft, Check, Star, AlertCircle, FileText,
  LogOut, Mail, ShieldAlert
} from 'lucide-react';
import { Language, BlogPost, GalleryItem, Doctor } from '../types';
import {
  supabase,
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
} from '../lib/supabase';

interface AdminDashboardProps {
  lang: Language;
  isOpen?: boolean;
  onClose: () => void;
  blogPosts: BlogPost[];
  setBlogPosts: React.Dispatch<React.SetStateAction<BlogPost[]>>;
  galleryItems: GalleryItem[];
  setGalleryItems: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
  doctors: Doctor[];
  setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
  /** Called after any successful save so App can re-fetch from Supabase */
  onDataSaved?: () => Promise<void>;
}

type AdminTab = 'blogs' | 'gallery' | 'team';

const INACTIVITY_MS = 30 * 60 * 1000;

const fieldClass =
  'w-full border border-line bg-bg-light/60 rounded-xl px-3.5 py-2.5 text-xs text-ink font-sans placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-bronze/50 focus:border-bronze/40 transition-colors';
const labelClass =
  'text-[10px] font-sans uppercase tracking-[0.14em] text-bronze font-bold block';
const primaryBtnClass =
  'inline-flex items-center justify-center gap-1.5 bg-ink hover:bg-bronze text-bg-light px-5 py-2.5 rounded-full text-xs font-sans font-semibold shadow-soft transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';
const ghostBtnClass =
  'inline-flex items-center justify-center gap-1.5 bg-bg-warm/80 hover:bg-gold-soft/30 text-ink-soft px-4 py-2.5 rounded-full text-xs font-sans transition-colors cursor-pointer';
const cardClass =
  'bg-white/90 border border-line rounded-2xl shadow-soft backdrop-blur-sm';

export default function AdminDashboard({
  lang,
  isOpen: _isOpen,
  onClose,
  blogPosts,
  setBlogPosts,
  galleryItems,
  setGalleryItems,
  doctors,
  setDoctors,
  onDataSaved
}: AdminDashboardProps) {
  const isRtl = lang === 'ar';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('blogs');

  // CRUD State managers
  const [editingBlog, setEditingBlog] = useState<Partial<BlogPost> | null>(null);
  const [editingGallery, setEditingGallery] = useState<Partial<GalleryItem> | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<Partial<Doctor> | null>(null);

  // Success/Error notifications
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showConfirm = (message: string, onConfirm: () => void) => setConfirmDialog({ message, onConfirm });

  const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

  const clearSensitiveState = useCallback(() => {
    setEmail('');
    setPassword('');
    setLoginError(null);
    setEditingBlog(null);
    setEditingGallery(null);
    setEditingDoctor(null);
    setConfirmDialog(null);
  }, []);

  const handleLogout = useCallback(async (options?: { close?: boolean; reason?: 'manual' | 'inactive' | 'session' }) => {
    await signOutAdmin();
    setIsAuthenticated(false);
    clearSensitiveState();
    if (options?.reason === 'inactive') {
      setLoginError(
        isRtl
          ? 'تم تسجيل الخروج تلقائياً بسبب عدم النشاط'
          : 'Signed out automatically due to inactivity'
      );
      setTimeout(() => setLoginError(null), 6000);
    }
    if (options?.close) onClose();
  }, [clearSensitiveState, isRtl, onClose]);

  // Check session on mount + subscribe to auth state
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
      if (!session) {
        clearSensitiveState();
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [clearSensitiveState]);

  // Inactivity auto-logout (30 minutes)
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

  const readImageFile = (file: File, onSuccess: (dataUrl: string) => void) => {
    if (file.size > MAX_IMAGE_SIZE) {
      triggerErrorMessage(isRtl ? 'حجم الصورة يتجاوز 2 ميجابايت' : 'Image size exceeds 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) onSuccess(evt.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerSuccessMessage = (message: string) => {
    setActionSuccess(message);
    setActionError(null);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const triggerErrorMessage = (message: string) => {
    setActionError(message);
    setActionSuccess(null);
    setTimeout(() => setActionError(null), 5000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) {
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
    } else {
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
      setTimeout(() => setLoginError(null), 6000);
    }
  };

  // --- BLOG OPERATIONS ---
  const saveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlog) return;
    setIsSaving(true);

    const validated: BlogPost = {
      id: editingBlog.id || `b-${Date.now()}`,
      title: {
        ar: editingBlog.title?.ar || 'عنوان غير معنون',
        en: editingBlog.title?.en || 'Untitled Article'
      },
      excerpt: {
        ar: editingBlog.excerpt?.ar || 'نبذة مختصرة عن المقال للبطاقة التوضيحية.',
        en: editingBlog.excerpt?.en || 'Short summary excerpt for the preview card.'
      },
      content: {
        ar: editingBlog.content?.ar || 'محتوى المقال كاملاً...',
        en: editingBlog.content?.en || 'Full article content text...'
      },
      date: {
        ar: editingBlog.date?.ar || new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
        en: editingBlog.date?.en || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      },
      readTime: {
        ar: editingBlog.readTime?.ar || '٥ دقائق قراءة',
        en: editingBlog.readTime?.en || '5 min read'
      },
      category: {
        ar: editingBlog.category?.ar || 'ثقافة سنية',
        en: editingBlog.category?.en || 'Dental Care'
      },
      image: editingBlog.image || 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&w=800&q=80',
      author: {
        ar: editingBlog.author?.ar || 'عيادات المعالي',
        en: editingBlog.author?.en || 'Al Maali Clinics'
      }
    };

    if (isSupabaseConfigured && validated.image.startsWith('data:')) {
      const url = await uploadBase64Image(validated.image, 'blog', validated.id);
      if (url) validated.image = url;
    }

    try {
      if (isSupabaseConfigured) {
        const success = await saveBlogPostToSupabase(validated);
        if (!success) {
          triggerErrorMessage(isRtl ? 'فشل حفظ المقال في قاعدة البيانات' : 'Failed to save article to database');
          setIsSaving(false);
          return;
        }
      }

      setBlogPosts(prev => {
        const exists = prev.some(b => b.id === validated.id);
        if (exists) return prev.map(b => b.id === validated.id ? validated : b);
        return [validated, ...prev];
      });
      triggerSuccessMessage(isRtl ? 'تم حفظ المقال بنجاح' : 'Article saved successfully');
      setEditingBlog(null);
      if (onDataSaved) onDataSaved();
    } catch (err) {
      console.error('Error saving blog:', err);
      triggerErrorMessage(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBlog = (id: string) => {
    showConfirm(isRtl ? 'هل تريد حذف هذا المقال نهائياً؟' : 'Delete this article permanently?', async () => {
      setIsSaving(true);
      try {
        if (isSupabaseConfigured) {
          const success = await deleteBlogPostFromSupabase(id);
          if (!success) {
            triggerErrorMessage(isRtl ? 'فشل حذف المقال من قاعدة البيانات' : 'Failed to delete article from database');
            setIsSaving(false);
            return;
          }
        }
        setBlogPosts(prev => prev.filter(b => b.id !== id));
        triggerSuccessMessage(isRtl ? 'تم حذف المقال' : 'Article deleted');
        if (onDataSaved) onDataSaved();
      } catch (err) {
        console.error('Error deleting blog:', err);
        triggerErrorMessage(isRtl ? 'حدث خطأ أثناء الحذف' : 'Error occurred while deleting');
      } finally {
        setIsSaving(false);
      }
    });
  };

  // --- GALLERY OPERATIONS ---
  const saveGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGallery) return;
    setIsSaving(true);

    const validated: GalleryItem = {
      id: editingGallery.id || `g-${Date.now()}`,
      title: {
        ar: editingGallery.title?.ar || 'صورة من العيادة',
        en: editingGallery.title?.en || 'Clinic Showcase Image'
      },
      category: editingGallery.category || 'clinic',
      image: editingGallery.image || 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
      description: {
        ar: editingGallery.description?.ar || '',
        en: editingGallery.description?.en || ''
      }
    };

    if (isSupabaseConfigured && validated.image.startsWith('data:')) {
      const url = await uploadBase64Image(validated.image, 'gallery', validated.id);
      if (url) validated.image = url;
    }

    try {
      if (isSupabaseConfigured) {
        const success = await saveGalleryItemToSupabase(validated);
        if (!success) {
          triggerErrorMessage(isRtl ? 'فشل حفظ الصورة في قاعدة البيانات' : 'Failed to save image to database');
          setIsSaving(false);
          return;
        }
      }

      setGalleryItems(prev => {
        const exists = prev.some(g => g.id === validated.id);
        if (exists) return prev.map(g => g.id === validated.id ? validated : g);
        return [...prev, validated];
      });
      triggerSuccessMessage(isRtl ? 'تم حفظ الصورة بنجاح' : 'Image saved successfully');
      setEditingGallery(null);
      if (onDataSaved) onDataSaved();
    } catch (err) {
      console.error('Error saving gallery:', err);
      triggerErrorMessage(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteGallery = (id: string) => {
    showConfirm(isRtl ? 'هل تريد حذف هذه الصورة من المعرض؟' : 'Delete this gallery image?', async () => {
      setIsSaving(true);
      try {
        if (isSupabaseConfigured) {
          const success = await deleteGalleryItemFromSupabase(id);
          if (!success) {
            triggerErrorMessage(isRtl ? 'فشل حذف الصورة من قاعدة البيانات' : 'Failed to delete image from database');
            setIsSaving(false);
            return;
          }
        }
        setGalleryItems(prev => prev.filter(g => g.id !== id));
        triggerSuccessMessage(isRtl ? 'تم حذف الصورة' : 'Image deleted');
        if (onDataSaved) onDataSaved();
      } catch (err) {
        console.error('Error deleting gallery:', err);
        triggerErrorMessage(isRtl ? 'حدث خطأ أثناء الحذف' : 'Error occurred while deleting');
      } finally {
        setIsSaving(false);
      }
    });
  };

  // --- TEAM OPERATIONS ---
  const saveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    setIsSaving(true);

    // Convert comma strings back to array
    const specsAr = Array.isArray(editingDoctor.specialties?.ar)
      ? editingDoctor.specialties.ar
      : (editingDoctor.specialties?.ar as any || '').split(',').map((s: string) => s.trim()).filter(Boolean);

    const specsEn = Array.isArray(editingDoctor.specialties?.en)
      ? editingDoctor.specialties.en
      : (editingDoctor.specialties?.en as any || '').split(',').map((s: string) => s.trim()).filter(Boolean);

    const validated: Doctor = {
      id: editingDoctor.id || `dr-${Date.now()}`,
      name: {
        ar: editingDoctor.name?.ar || 'طبيب استشاري جديد',
        en: editingDoctor.name?.en || 'New Consultant Doctor'
      },
      role: {
        ar: editingDoctor.role?.ar || 'أخصائي طب الأسنان المجهري',
        en: editingDoctor.role?.en || 'Specialist in Microscope Dentistry'
      },
      bio: {
        ar: editingDoctor.bio?.ar || 'طبيب معتمد شغوف بتحقيق أعلى معايير الجودة الطبية والجمالية.',
        en: editingDoctor.bio?.en || 'Certified specialist dedicated to pristine medical & aesthetic care.'
      },
      specialties: {
        ar: specsAr.length ? specsAr : ['طب الأسنان التجميلي المطور'],
        en: specsEn.length ? specsEn : ['Advanced Cosmetic Dentistry']
      },
      education: {
        ar: editingDoctor.education?.ar || 'البورد والزمالة المتخصصة.',
        en: editingDoctor.education?.en || 'Board Certified Fellow.'
      },
      image: editingDoctor.image || 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=800&q=80'
    };

    if (isSupabaseConfigured && validated.image.startsWith('data:')) {
      const url = await uploadBase64Image(validated.image, 'doctor', validated.id);
      if (url) validated.image = url;
    }

    try {
      if (isSupabaseConfigured) {
        const success = await saveDoctorToSupabase(validated);
        if (!success) {
          triggerErrorMessage(isRtl ? 'فشل حفظ بيانات الطبيب في قاعدة البيانات' : 'Failed to save doctor to database');
          setIsSaving(false);
          return;
        }
      }

      setDoctors(prev => {
        const exists = prev.some(d => d.id === validated.id);
        if (exists) return prev.map(d => d.id === validated.id ? validated : d);
        return [...prev, validated];
      });
      triggerSuccessMessage(isRtl ? 'تم حفظ بيانات الطبيب بنجاح' : 'Doctor saved successfully');
      setEditingDoctor(null);
      if (onDataSaved) onDataSaved();
    } catch (err) {
      console.error('Error saving doctor:', err);
      triggerErrorMessage(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDoctor = (id: string) => {
    showConfirm(isRtl ? 'هل تريد استبعاد هذا الطبيب من الفريق؟' : 'Remove this doctor from the team?', async () => {
      setIsSaving(true);
      try {
        if (isSupabaseConfigured) {
          const success = await deleteDoctorFromSupabase(id);
          if (!success) {
            triggerErrorMessage(isRtl ? 'فشل حذف الطبيب من قاعدة البيانات' : 'Failed to delete doctor from database');
            setIsSaving(false);
            return;
          }
        }
        setDoctors(prev => prev.filter(d => d.id !== id));
        triggerSuccessMessage(isRtl ? 'تم حذف الطبيب' : 'Doctor removed');
        if (onDataSaved) onDataSaved();
      } catch (err) {
        console.error('Error deleting doctor:', err);
        triggerErrorMessage(isRtl ? 'حدث خطأ أثناء الحذف' : 'Error occurred while deleting');
      } finally {
        setIsSaving(false);
      }
    });
  };

  const renderImageDropzone = (
    image: string | undefined,
    onSet: (dataUrl: string) => void,
    onClear: () => void,
    label: string
  ) => (
    <div className="md:col-span-2 space-y-1.5">
      <label className={labelClass}>{label}</label>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) readImageFile(file, onSet);
        }}
        className="border border-dashed border-bronze/35 hover:border-bronze rounded-2xl p-6 text-center transition-all cursor-pointer bg-bg-light/70 relative group"
      >
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readImageFile(file, onSet);
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        {image ? (
          <div className="space-y-3 relative z-20">
            <img
              src={image}
              alt="Preview"
              className="mx-auto max-h-40 object-cover rounded-xl border border-line shadow-soft"
            />
            <div className="flex justify-center gap-2">
              <span className="text-[10px] text-forest font-semibold bg-gold-soft/25 px-2.5 py-0.5 rounded-md border border-gold/30">
                {isRtl ? '✓ تم اختيار الصورة' : '✓ Image Selected'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClear();
                }}
                className="text-[10px] text-red-700 hover:text-red-900 font-semibold bg-red-50 px-2.5 py-0.5 rounded-md border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
              >
                {isRtl ? 'إلغاء' : 'Clear'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 py-3">
            <ImageIcon className="mx-auto text-bronze/45 group-hover:text-bronze transition-colors" size={36} />
            <p className="text-xs text-ink-soft font-sans font-medium">
              {isRtl
                ? 'اسحب وأفلت ملف الصورة هنا، أو اضغط للتصفح من جهازك'
                : 'Drag & drop image file here, or click to browse'}
            </p>
            <p className="text-[10px] text-muted font-sans tracking-wide">
              PNG, JPG, WEBP, GIF (Max 2MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const emptyState = (icon: React.ReactNode, title: string, hint: string) => (
    <div className="p-14 text-center space-y-3">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-bg-warm/80 border border-line flex items-center justify-center text-bronze/50">
        {icon}
      </div>
      <p className="text-base font-display font-semibold text-ink">{title}</p>
      <p className="text-xs text-muted font-sans max-w-xs mx-auto leading-relaxed">{hint}</p>
    </div>
  );

  const navItems: { id: AdminTab; icon: React.ReactNode; label: string; count: number }[] = [
    { id: 'blogs', icon: <BookOpen size={16} />, label: isRtl ? 'مقالات المدونة' : 'Blog', count: blogPosts.length },
    { id: 'gallery', icon: <ImageIcon size={16} />, label: isRtl ? 'معرض الصور' : 'Gallery', count: galleryItems.length },
    { id: 'team', icon: <Users size={16} />, label: isRtl ? 'الفريق الطبي' : 'Team', count: doctors.length },
  ];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-bg-light flex flex-col text-ink selection:bg-bronze/30 selection:text-ink overflow-x-hidden font-sans"
    >
      <div className="relative w-full min-h-screen flex flex-col overflow-hidden">

        {/* Toast notifications */}
        <AnimatePresence>
          {isSaving && (
            <motion.div
              key="saving-toast"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-bg-dark text-bg-light px-6 py-3.5 rounded-2xl shadow-float border border-gold/25 flex items-center gap-3 min-w-[260px]"
            >
              <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">{isRtl ? 'جاري النشر...' : 'Publishing...'}</span>
            </motion.div>
          )}

          {actionSuccess && !isSaving && (
            <motion.div
              key="success-toast"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-white text-ink px-6 py-4 rounded-2xl shadow-float border border-forest/15 flex items-center gap-3 min-w-[280px]"
            >
              <div className="w-9 h-9 rounded-full bg-forest/10 flex items-center justify-center shrink-0">
                <Check size={18} className="text-forest" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold font-display">{isRtl ? 'تم بنجاح' : 'Success'}</span>
                <span className="text-xs text-muted">{actionSuccess}</span>
              </div>
            </motion.div>
          )}

          {actionError && (
            <motion.div
              key="error-toast"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-white text-ink px-6 py-4 rounded-2xl shadow-float border border-red-200 flex items-center gap-3 min-w-[280px]"
            >
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertCircle size={18} className="text-red-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold font-display">{isRtl ? 'خطأ' : 'Error'}</span>
                <span className="text-xs text-muted">{actionError}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirm delete modal */}
        <AnimatePresence>
          {confirmDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-bg-dark/50 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setConfirmDialog(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-bg-light rounded-3xl shadow-float border border-line p-7 w-full max-w-sm text-center space-y-5"
              >
                <div className="w-12 h-12 rounded-full bg-red-50 mx-auto flex items-center justify-center border border-red-100">
                  <Trash2 size={22} className="text-red-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-display font-semibold text-ink">
                    {isRtl ? 'تأكيد الحذف' : 'Confirm Deletion'}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed font-sans">
                    {confirmDialog.message}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    className={`${ghostBtnClass} flex-1`}
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      const cb = confirmDialog.onConfirm;
                      setConfirmDialog(null);
                      cb();
                    }}
                    className="flex-1 px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all cursor-pointer"
                  >
                    {isRtl ? 'حذف' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── LOGIN GATE ─── */}
        {!isAuthenticated ? (
          <div className="relative flex-grow flex flex-col min-h-screen">
            {/* Atmospheric backdrop */}
            <div className="absolute inset-0 bg-bg-dark">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    'radial-gradient(ellipse 80% 60% at 20% 20%, rgba(156,112,73,0.35), transparent 55%), radial-gradient(ellipse 70% 50% at 80% 80%, rgba(196,165,116,0.18), transparent 50%), linear-gradient(165deg, #1c1713 0%, #2a221b 45%, #3a2f26 100%)',
                }}
              />
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                }}
              />
            </div>

            <div className="relative z-10 flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full border border-gold/30 bg-bronze/20 flex items-center justify-center text-gold">
                  <LayoutDashboard size={16} />
                </div>
                <span className="font-display text-lg text-bg-light tracking-wide">
                  {isRtl ? 'المعالي' : 'Al Maali'}
                </span>
              </div>
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 text-xs text-gold-soft/80 hover:text-gold transition-colors cursor-pointer font-sans"
              >
                {isRtl ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                <span>{isRtl ? 'العودة للموقع' : 'Back to Site'}</span>
              </button>
            </div>

            <div className="relative z-10 flex-grow flex flex-col items-center justify-center px-6 pb-16">
              {isCheckingSession ? (
                <div className="flex flex-col items-center gap-5 text-gold-soft/70">
                  <div className="w-11 h-11 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-sans tracking-wide">
                    {isRtl ? 'جاري التحقق من الجلسة...' : 'Checking session...'}
                  </p>
                </div>
              ) : !isSupabaseConfigured ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-md w-full text-center space-y-6 bg-bg-ink/80 border border-gold/20 rounded-3xl p-10 shadow-float backdrop-blur-md"
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-bronze/20 border border-gold/30 flex items-center justify-center text-gold">
                    <ShieldAlert size={26} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-display font-semibold text-bg-light">
                      {isRtl ? 'إعدادات Supabase ناقصة' : 'Supabase Not Configured'}
                    </h2>
                    <p className="text-sm text-gold-soft/80 font-sans leading-relaxed">
                      {isRtl
                        ? 'يرجى إضافة VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY إلى ملف .env ثم إعادة تشغيل الخادم.'
                        : 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file, then restart the dev server.'}
                    </p>
                  </div>
                  <button onClick={onClose} className={primaryBtnClass}>
                    {isRtl ? 'العودة للموقع' : 'Return to Site'}
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  onSubmit={handleLogin}
                  className="max-w-md w-full space-y-8 bg-bg-ink/75 border border-gold/20 rounded-3xl p-9 md:p-11 shadow-float backdrop-blur-md"
                >
                  <div className="text-center space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-bronze/25 border border-gold/35 flex items-center justify-center text-gold shadow-soft">
                      <Lock size={24} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-gold font-sans">
                        {isRtl ? 'بوابة الإدارة' : 'Admin Portal'}
                      </p>
                      <h2 className="text-3xl font-display font-semibold text-bg-light tracking-tight">
                        {isRtl ? 'عيادات المعالي' : 'Al Maali Clinics'}
                      </h2>
                      <p className="text-sm text-gold-soft/75 font-sans leading-relaxed max-w-xs mx-auto">
                        {isRtl
                          ? 'أدخل بريدك الإلكتروني وكلمة المرور للدخول إلى لوحة التحكم.'
                          : 'Enter your admin email and password to access the dashboard.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 text-start">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-[0.16em] text-gold/80 font-sans font-bold block">
                        {isRtl ? 'البريد الإلكتروني' : 'Email'}
                      </label>
                      <div className="relative">
                        <Mail size={14} className={`absolute top-1/2 -translate-y-1/2 text-gold/50 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="admin@almaali.com"
                          autoComplete="email"
                          className={`w-full border ${loginError ? 'border-red-400/70 bg-red-950/20' : 'border-gold/25 bg-bg-dark/40'} rounded-xl py-3 text-sm text-bg-light placeholder:text-muted/60 focus:ring-1 focus:ring-gold/50 focus:outline-none font-sans ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                          required
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-[0.16em] text-gold/80 font-sans font-bold block">
                        {isRtl ? 'كلمة المرور' : 'Password'}
                      </label>
                      <div className="relative">
                        <Lock size={14} className={`absolute top-1/2 -translate-y-1/2 text-gold/50 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className={`w-full border ${loginError ? 'border-red-400/70 bg-red-950/20' : 'border-gold/25 bg-bg-dark/40'} rounded-xl py-3 text-sm text-bg-light placeholder:text-muted/60 focus:ring-1 focus:ring-gold/50 focus:outline-none font-sans ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                          required
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {loginError && (
                      <p className="text-xs text-red-300 text-center font-sans pt-1 leading-relaxed">
                        {loginError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full bg-bronze hover:bg-gold disabled:opacity-60 disabled:cursor-not-allowed text-bg-dark rounded-full py-3.5 font-sans font-bold text-sm shadow-soft transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isLoggingIn ? (
                      <>
                        <div className="w-4 h-4 border-2 border-bg-dark border-t-transparent rounded-full animate-spin" />
                        <span>{isRtl ? 'جاري التحقق...' : 'Signing in...'}</span>
                      </>
                    ) : (
                      <span>{isRtl ? 'دخول لوحة التحكم' : 'Sign In & Enter'}</span>
                    )}
                  </button>
                </motion.form>
              )}
            </div>
          </div>
        ) : (
          /* ─── DASHBOARD SHELL ─── */
          <div className="flex-grow flex flex-col min-h-screen bg-bg-light">
            <header className="bg-bg-dark text-bg-light px-5 md:px-7 py-4 flex items-center justify-between border-b border-gold/15 sticky top-0 z-40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-bronze/25 flex items-center justify-center text-gold border border-gold/30 shrink-0">
                  <LayoutDashboard size={17} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base md:text-xl font-display font-semibold tracking-wide truncate">
                    {isRtl ? 'لوحة إدارة المعالي' : 'Al Maali Admin'}
                  </h1>
                  <p className="text-[10px] font-sans text-gold/70 uppercase tracking-[0.18em]">
                    {isRtl ? 'إدارة المحتوى' : 'Content Studio'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleLogout({ close: true, reason: 'manual' })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-red-500/15 text-red-300 hover:text-red-200 transition-all cursor-pointer border border-red-400/25 text-xs font-sans font-medium"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">{isRtl ? 'تسجيل خروج' : 'Logout'}</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/8 text-bg-light/90 hover:text-gold transition-all cursor-pointer border border-gold/20 text-xs font-sans font-medium"
                >
                  {isRtl ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                  <span className="hidden sm:inline">{isRtl ? 'العودة للموقع' : 'Back to Site'}</span>
                </button>
              </div>
            </header>

            <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
              {/* Sidebar / top tabs */}
              <aside className="w-full md:w-60 bg-forest text-bg-light border-b md:border-b-0 md:border-e border-gold/10 p-3 md:p-4 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible shrink-0">
                <p className="hidden md:block text-[10px] uppercase tracking-[0.2em] text-gold/60 font-sans px-3 mb-2 mt-1">
                  {isRtl ? 'الأقسام' : 'Sections'}
                </p>
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (item.id === 'blogs') setEditingBlog(null);
                      if (item.id === 'gallery') setEditingGallery(null);
                      if (item.id === 'team') setEditingDoctor(null);
                    }}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-sans font-medium cursor-pointer transition-all flex-grow md:flex-grow-0 whitespace-nowrap ${
                      activeTab === item.id
                        ? 'bg-bronze text-bg-light shadow-soft'
                        : 'text-bg-light/70 hover:bg-white/8 hover:text-bg-light'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    <span className={`ms-auto text-[10px] px-1.5 py-0.5 rounded-md font-sans ${
                      activeTab === item.id ? 'bg-bg-dark/25' : 'bg-white/10'
                    }`}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </aside>

              <main className="flex-grow p-5 md:p-8 overflow-y-auto relative">
                {/* --- TAB: BLOG POSTS --- */}
                {activeTab === 'blogs' && (
                  <div className="space-y-6 max-w-4xl">
                    {editingBlog ? (
                      <form onSubmit={saveBlog} className={`${cardClass} p-6 md:p-8 space-y-6`}>
                        <div className="flex items-center justify-between border-b border-line pb-4">
                          <h3 className="text-xl font-display font-semibold text-ink">
                            {editingBlog.id
                              ? (isRtl ? 'تعديل المقال الطبي' : 'Edit Medical Article')
                              : (isRtl ? 'إضافة مقال جديد' : 'Compose New Article')}
                          </h3>
                          <button
                            type="button"
                            onClick={() => setEditingBlog(null)}
                            className="text-xs text-red-600 hover:underline cursor-pointer font-sans"
                          >
                            {isRtl ? 'إلغاء التعديل' : 'Cancel Edit'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                            <label className={labelClass}>العنوان بالعربية (Title AR)</label>
                            <input
                              type="text"
                              required
                              value={editingBlog.title?.ar || ''}
                              onChange={(e) => setEditingBlog({
                                ...editingBlog,
                                title: { ...editingBlog.title, ar: e.target.value, en: editingBlog.title?.en || '' }
                              })}
                              className={fieldClass}
                              placeholder="مثال: طب الأسنان المجهري التجميلي..."
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className={labelClass}>Title in English</label>
                            <input
                              type="text"
                              required
                              value={editingBlog.title?.en || ''}
                              onChange={(e) => setEditingBlog({
                                ...editingBlog,
                                title: { ...editingBlog.title, en: e.target.value, ar: editingBlog.title?.ar || '' }
                              })}
                              className={fieldClass}
                              placeholder="e.g., Microscope-Assisted Dentistry..."
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className={labelClass}>التصنيف بالعربية (Category AR)</label>
                            <input
                              type="text"
                              required
                              value={editingBlog.category?.ar || ''}
                              onChange={(e) => setEditingBlog({
                                ...editingBlog,
                                category: { ...editingBlog.category, ar: e.target.value, en: editingBlog.category?.en || '' }
                              })}
                              className={fieldClass}
                              placeholder="مثال: تكنولوجيا طبية"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className={labelClass}>Category in English</label>
                            <input
                              type="text"
                              required
                              value={editingBlog.category?.en || ''}
                              onChange={(e) => setEditingBlog({
                                ...editingBlog,
                                category: { ...editingBlog.category, en: e.target.value, ar: editingBlog.category?.ar || '' }
                              })}
                              className={fieldClass}
                              placeholder="e.g., Technology"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className={labelClass}>الكاتب بالعربية (Author AR)</label>
                            <input
                              type="text"
                              value={editingBlog.author?.ar || ''}
                              onChange={(e) => setEditingBlog({
                                ...editingBlog,
                                author: { ...editingBlog.author, ar: e.target.value, en: editingBlog.author?.en || '' }
                              })}
                              className={fieldClass}
                              placeholder="مثال: د. هبة المعالي"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className={labelClass}>Author in English</label>
                            <input
                              type="text"
                              value={editingBlog.author?.en || ''}
                              onChange={(e) => setEditingBlog({
                                ...editingBlog,
                                author: { ...editingBlog.author, en: e.target.value, ar: editingBlog.author?.ar || '' }
                              })}
                              className={fieldClass}
                              placeholder="e.g., Dr. Hiba Al Maali"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className={labelClass}>مدة القراءة بالعربية (Read Time AR)</label>
                            <input
                              type="text"
                              value={editingBlog.readTime?.ar || ''}
                              onChange={(e) => setEditingBlog({
                                ...editingBlog,
                                readTime: { ...editingBlog.readTime, ar: e.target.value, en: editingBlog.readTime?.en || '' }
                              })}
                              className={fieldClass}
                              placeholder="مثال: ٤ دقائق قراءة"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className={labelClass}>Read Time in English</label>
                            <input
                              type="text"
                              value={editingBlog.readTime?.en || ''}
                              onChange={(e) => setEditingBlog({
                                ...editingBlog,
                                readTime: { ...editingBlog.readTime, en: e.target.value, ar: editingBlog.readTime?.ar || '' }
                              })}
                              className={fieldClass}
                              placeholder="e.g., 4 min read"
                            />
                          </div>

                          {renderImageDropzone(
                            editingBlog.image,
                            (dataUrl) => setEditingBlog({ ...editingBlog, image: dataUrl }),
                            () => setEditingBlog({ ...editingBlog, image: '' }),
                            isRtl ? 'صورة المقال التوضيحية (من الجهاز)' : 'Article Thumbnail Image (Local File)'
                          )}

                          <div className="md:col-span-2 space-y-1.5">
                            <label className={labelClass}>نبذة مختصرة بالعربية (Excerpt AR)</label>
                            <textarea
                              rows={2}
                              required
                              value={editingBlog.excerpt?.ar || ''}
                              onChange={(e) => setEditingBlog({
                                ...editingBlog,
                                excerpt: { ...editingBlog.excerpt, ar: e.target.value, en: editingBlog.excerpt?.en || '' }
                              })}
                              className={fieldClass}
                              placeholder="ملخص قصير جداً يظهر في صفحة المدونات الرئيسية..."
                            />
                          </div>

                          <div className="md:col-span-2 space-y-1.5">
                            <label className={labelClass}>Excerpt in English</label>
                            <textarea
                              rows={2}
                              required
                              value={editingBlog.excerpt?.en || ''}
                              onChange={(e) => setEditingBlog({
                                ...editingBlog,
                                excerpt: { ...editingBlog.excerpt, en: e.target.value, ar: editingBlog.excerpt?.ar || '' }
                              })}
                              className={fieldClass}
                              placeholder="Brief abstract preview summary of the article..."
                            />
                          </div>

                          <div className="md:col-span-2 space-y-1.5">
                            <label className={labelClass}>نص المقال كاملاً بالعربية (Full Content AR)</label>
                            <textarea
                              rows={5}
                              required
                              value={editingBlog.content?.ar || ''}
                              onChange={(e) => setEditingBlog({
                                ...editingBlog,
                                content: { ...editingBlog.content, ar: e.target.value, en: editingBlog.content?.en || '' }
                              })}
                              className={`${fieldClass} leading-relaxed`}
                              placeholder="اكتب المحتوى الكامل للمقال هنا بالتفصيل وبشكل منسق..."
                            />
                          </div>

                          <div className="md:col-span-2 space-y-1.5">
                            <label className={labelClass}>Full Content in English</label>
                            <textarea
                              rows={5}
                              required
                              value={editingBlog.content?.en || ''}
                              onChange={(e) => setEditingBlog({
                                ...editingBlog,
                                content: { ...editingBlog.content, en: e.target.value, ar: editingBlog.content?.ar || '' }
                              })}
                              className={`${fieldClass} leading-relaxed`}
                              placeholder="Enter the complete English translation of the article..."
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-line">
                          <button type="button" onClick={() => setEditingBlog(null)} className={ghostBtnClass}>
                            {isRtl ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button type="submit" disabled={isSaving} className={primaryBtnClass}>
                            <Save size={13} />
                            <span>{isRtl ? 'حفظ المقال ونشره' : 'Save & Publish Article'}</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-5">
                        <div className="flex items-end justify-between gap-4 flex-wrap">
                          <div>
                            <h3 className="text-2xl font-display font-semibold text-ink">
                              {isRtl ? 'المقالات الطبية المنشورة' : 'Published Articles'}
                            </h3>
                            <p className="text-xs text-muted mt-1 font-sans">
                              {isRtl ? 'قم بإضافة مقالات أو تعديل المحتويات المنشورة حالياً.' : 'Add new posts or edit existing content.'}
                            </p>
                          </div>
                          <button onClick={() => setEditingBlog({})} className={primaryBtnClass}>
                            <Plus size={14} />
                            <span>{isRtl ? 'إضافة مقال جديد' : 'Compose Article'}</span>
                          </button>
                        </div>

                        <div className={`${cardClass} overflow-hidden`}>
                          {blogPosts.length === 0 ? (
                            emptyState(
                              <FileText size={28} />,
                              isRtl ? 'لا توجد مقالات مضافة' : 'No articles yet',
                              isRtl ? 'ابدأ بكتابة أول مقال طبي لعيادات المعالي.' : 'Compose your first clinical article for Al Maali.'
                            )
                          ) : (
                            <div className="divide-y divide-line">
                              {blogPosts.map((post) => (
                                <div key={post.id} className="p-4 flex items-center gap-4 hover:bg-bg-light/80 transition-colors">
                                  <img
                                    src={post.image}
                                    alt={post.title[lang]}
                                    className="w-14 h-14 rounded-xl object-cover bg-bg-warm shrink-0 border border-line"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="flex-grow min-w-0">
                                    <h4 className="text-sm font-display font-semibold truncate text-ink">
                                      {post.title[lang]}
                                    </h4>
                                    <p className="text-[11px] text-muted flex items-center gap-2 mt-1 font-sans flex-wrap">
                                      <span className="text-bronze">{post.category[lang]}</span>
                                      <span>·</span>
                                      <span>{post.date[lang]}</span>
                                      <span>·</span>
                                      <span>{post.author[lang]}</span>
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={() => setEditingBlog(post)}
                                      className="p-2 rounded-lg hover:bg-bg-warm text-ink-soft hover:text-bronze transition-colors cursor-pointer"
                                      title={isRtl ? 'تعديل' : 'Edit'}
                                    >
                                      <Edit3 size={15} />
                                    </button>
                                    <button
                                      onClick={() => deleteBlog(post.id)}
                                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                                      title={isRtl ? 'حذف' : 'Delete'}
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- TAB: GALLERY ITEMS --- */}
                {activeTab === 'gallery' && (
                  <div className="space-y-6 max-w-4xl">
                    {editingGallery ? (
                      <form onSubmit={saveGallery} className={`${cardClass} p-6 md:p-8 space-y-6`}>
                        <div className="flex items-center justify-between border-b border-line pb-4">
                          <h3 className="text-xl font-display font-semibold text-ink">
                            {editingGallery.id
                              ? (isRtl ? 'تعديل صورة المعرض' : 'Edit Gallery Item')
                              : (isRtl ? 'إضافة صورة جديدة للمعرض' : 'Add Image to Gallery')}
                          </h3>
                          <button
                            type="button"
                            onClick={() => setEditingGallery(null)}
                            className="text-xs text-red-600 hover:underline cursor-pointer font-sans"
                          >
                            {isRtl ? 'إلغاء التعديل' : 'Cancel Edit'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                            <label className={labelClass}>العنوان بالعربية (Title AR)</label>
                            <input
                              type="text"
                              required
                              value={editingGallery.title?.ar || ''}
                              onChange={(e) => setEditingGallery({
                                ...editingGallery,
                                title: { ...editingGallery.title, ar: e.target.value, en: editingGallery.title?.en || '' }
                              })}
                              className={fieldClass}
                              placeholder="مثال: ابتسامة فينير ناصعة..."
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className={labelClass}>Title in English</label>
                            <input
                              type="text"
                              required
                              value={editingGallery.title?.en || ''}
                              onChange={(e) => setEditingGallery({
                                ...editingGallery,
                                title: { ...editingGallery.title, en: e.target.value, ar: editingGallery.title?.ar || '' }
                              })}
                              className={fieldClass}
                              placeholder="e.g., Bespoke Porcelain Veneers..."
                            />
                          </div>

                          <div className="md:col-span-2 space-y-1.5">
                            <label className={labelClass}>
                              {isRtl ? 'التصنيف' : 'Category'}
                            </label>
                            <select
                              value={editingGallery.category || 'clinic'}
                              onChange={(e) => setEditingGallery({
                                ...editingGallery,
                                category: e.target.value as 'clinic' | 'cases'
                              })}
                              className={fieldClass}
                            >
                              <option value="clinic">{isRtl ? 'مساحة بوتيك' : 'Boutique Space'}</option>
                              <option value="cases">{isRtl ? 'حالات تجميل' : 'Smile Case'}</option>
                            </select>
                          </div>

                          {renderImageDropzone(
                            editingGallery.image,
                            (dataUrl) => setEditingGallery({ ...editingGallery, image: dataUrl }),
                            () => setEditingGallery({ ...editingGallery, image: '' }),
                            isRtl ? 'تحميل الصورة الفنية المعرضية (من الجهاز)' : 'Artistic Gallery Image Upload (Local File)'
                          )}

                          <div className="space-y-1.5">
                            <label className={labelClass}>الشرح والوصف بالعربية (Description AR)</label>
                            <textarea
                              rows={3}
                              value={editingGallery.description?.ar || ''}
                              onChange={(e) => setEditingGallery({
                                ...editingGallery,
                                description: { ...editingGallery.description, ar: e.target.value, en: editingGallery.description?.en || '' }
                              })}
                              className={fieldClass}
                              placeholder="اكتب شرحاً بسيطاً تجميلياً للصورة..."
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className={labelClass}>Description in English</label>
                            <textarea
                              rows={3}
                              value={editingGallery.description?.en || ''}
                              onChange={(e) => setEditingGallery({
                                ...editingGallery,
                                description: { ...editingGallery.description, en: e.target.value, ar: editingGallery.description?.ar || '' }
                              })}
                              className={fieldClass}
                              placeholder="Write a brief aesthetic commentary or details..."
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-line">
                          <button type="button" onClick={() => setEditingGallery(null)} className={ghostBtnClass}>
                            {isRtl ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button type="submit" disabled={isSaving} className={primaryBtnClass}>
                            <Save size={13} />
                            <span>{isRtl ? 'حفظ وإضافة للمعرض' : 'Save & Publish Image'}</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-5">
                        <div className="flex items-end justify-between gap-4 flex-wrap">
                          <div>
                            <h3 className="text-2xl font-display font-semibold text-ink">
                              {isRtl ? 'محتويات المعرض الفني' : 'Gallery Showcase'}
                            </h3>
                            <p className="text-xs text-muted mt-1 font-sans">
                              {isRtl ? 'إدارة صور العيادة وحالات الابتسامات.' : 'Manage clinic photos & smile cases.'}
                            </p>
                          </div>
                          <button onClick={() => setEditingGallery({})} className={primaryBtnClass}>
                            <Plus size={14} />
                            <span>{isRtl ? 'إضافة صورة جديدة' : 'Add Image'}</span>
                          </button>
                        </div>

                        <div className={`${cardClass} overflow-hidden`}>
                          {galleryItems.length === 0 ? (
                            emptyState(
                              <ImageIcon size={28} />,
                              isRtl ? 'لا توجد صور مضافة' : 'No images yet',
                              isRtl ? 'أضف أول صورة لمعرض العيادة.' : 'Add your first gallery image.'
                            )
                          ) : (
                            <div className="divide-y divide-line">
                              {galleryItems.map((item) => (
                                <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-bg-light/80 transition-colors">
                                  <img
                                    src={item.image}
                                    alt={item.title[lang]}
                                    className="w-14 h-14 rounded-xl object-cover bg-bg-warm shrink-0 border border-line"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="flex-grow min-w-0">
                                    <h4 className="text-sm font-display font-semibold truncate text-ink">
                                      {item.title[lang]}
                                    </h4>
                                    <p className="text-[11px] text-muted flex items-center gap-2 mt-1 font-sans">
                                      <span className="bg-bronze/10 px-2 py-0.5 rounded text-bronze">
                                        {item.category === 'clinic'
                                          ? (isRtl ? 'مساحة بوتيك' : 'Boutique Space')
                                          : (isRtl ? 'حالات تجميل' : 'Smile Case')}
                                      </span>
                                      {item.description?.[lang] && (
                                        <>
                                          <span>·</span>
                                          <span className="truncate">{item.description[lang]}</span>
                                        </>
                                      )}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={() => setEditingGallery(item)}
                                      className="p-2 rounded-lg hover:bg-bg-warm text-ink-soft hover:text-bronze transition-colors cursor-pointer"
                                      title={isRtl ? 'تعديل' : 'Edit'}
                                    >
                                      <Edit3 size={15} />
                                    </button>
                                    <button
                                      onClick={() => deleteGallery(item.id)}
                                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                                      title={isRtl ? 'حذف' : 'Delete'}
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- TAB: MEDICAL TEAM --- */}
                {activeTab === 'team' && (
                  <div className="space-y-6 max-w-4xl">
                    {editingDoctor ? (
                      <form onSubmit={saveDoctor} className={`${cardClass} p-6 md:p-8 space-y-6`}>
                        <div className="flex items-center justify-between border-b border-line pb-4">
                          <h3 className="text-xl font-display font-semibold text-ink">
                            {editingDoctor.id
                              ? (isRtl ? 'تعديل بيانات الطبيب' : 'Edit Doctor Details')
                              : (isRtl ? 'إضافة طبيب استشاري جديد' : 'Add New Consultant Doctor')}
                          </h3>
                          <button
                            type="button"
                            onClick={() => setEditingDoctor(null)}
                            className="text-xs text-red-600 hover:underline cursor-pointer font-sans"
                          >
                            {isRtl ? 'إلغاء التعديل' : 'Cancel Edit'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                            <label className={labelClass}>الاسم بالعربية (Name AR)</label>
                            <input
                              type="text"
                              required
                              value={editingDoctor.name?.ar || ''}
                              onChange={(e) => setEditingDoctor({
                                ...editingDoctor,
                                name: { ...editingDoctor.name, ar: e.target.value, en: editingDoctor.name?.en || '' }
                              })}
                              className={fieldClass}
                              placeholder="مثال: د. فيصل الشهري..."
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className={labelClass}>Full Name in English</label>
                            <input
                              type="text"
                              required
                              value={editingDoctor.name?.en || ''}
                              onChange={(e) => setEditingDoctor({
                                ...editingDoctor,
                                name: { ...editingDoctor.name, en: e.target.value, ar: editingDoctor.name?.ar || '' }
                              })}
                              className={fieldClass}
                              placeholder="e.g., Dr. Faisal Al-Shehri..."
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className={labelClass}>التخصص بالعربية (Role/Specialty AR)</label>
                            <input
                              type="text"
                              required
                              value={editingDoctor.role?.ar || ''}
                              onChange={(e) => setEditingDoctor({
                                ...editingDoctor,
                                role: { ...editingDoctor.role, ar: e.target.value, en: editingDoctor.role?.en || '' }
                              })}
                              className={fieldClass}
                              placeholder="مثال: استشاري زراعة الأسنان المجهرية وجراحة الفكين"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className={labelClass}>Role / Specialty in English</label>
                            <input
                              type="text"
                              required
                              value={editingDoctor.role?.en || ''}
                              onChange={(e) => setEditingDoctor({
                                ...editingDoctor,
                                role: { ...editingDoctor.role, en: e.target.value, ar: editingDoctor.role?.ar || '' }
                              })}
                              className={fieldClass}
                              placeholder="e.g., Senior Consultant in Micro-Implantology & Oral Surgery"
                            />
                          </div>

                          {renderImageDropzone(
                            editingDoctor.image,
                            (dataUrl) => setEditingDoctor({ ...editingDoctor, image: dataUrl }),
                            () => setEditingDoctor({ ...editingDoctor, image: '' }),
                            isRtl ? 'تحميل صورة الطبيب الشخصية (من الجهاز)' : 'Doctor Profile Image Upload (Local File)'
                          )}

                          <div className="space-y-1.5">
                            <label className={labelClass}>الخبرات الدقيقة بالعربية (مفصولة بفاصلة)</label>
                            <input
                              type="text"
                              value={Array.isArray(editingDoctor.specialties?.ar) ? editingDoctor.specialties.ar.join(', ') : (editingDoctor.specialties?.ar || '')}
                              onChange={(e) => setEditingDoctor({
                                ...editingDoctor,
                                specialties: {
                                  ar: e.target.value as any,
                                  en: editingDoctor.specialties?.en || '' as any
                                }
                              })}
                              className={fieldClass}
                              placeholder="مثال: زراعة فورية, رفع جيوب أنفية, تطعيم عظمي"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className={labelClass}>Clinical Focuses in English (comma separated)</label>
                            <input
                              type="text"
                              value={Array.isArray(editingDoctor.specialties?.en) ? editingDoctor.specialties.en.join(', ') : (editingDoctor.specialties?.en || '')}
                              onChange={(e) => setEditingDoctor({
                                ...editingDoctor,
                                specialties: {
                                  en: e.target.value as any,
                                  ar: editingDoctor.specialties?.ar || '' as any
                                }
                              })}
                              className={fieldClass}
                              placeholder="e.g., Sinus Lift, Bone Grafting, Guided Implantology"
                            />
                          </div>

                          <div className="md:col-span-2 space-y-1.5">
                            <label className={labelClass}>الشهادات والدرجات العلمية بالعربية (Education AR)</label>
                            <input
                              type="text"
                              required
                              value={editingDoctor.education?.ar || ''}
                              onChange={(e) => setEditingDoctor({
                                ...editingDoctor,
                                education: { ...editingDoctor.education, ar: e.target.value, en: editingDoctor.education?.en || '' }
                              })}
                              className={fieldClass}
                              placeholder="مثال: البورد الألماني في زراعة الأسنان - دكتوراه من جامعة هايدلبرغ العريقة."
                            />
                          </div>

                          <div className="md:col-span-2 space-y-1.5">
                            <label className={labelClass}>Education & Degrees in English</label>
                            <input
                              type="text"
                              required
                              value={editingDoctor.education?.en || ''}
                              onChange={(e) => setEditingDoctor({
                                ...editingDoctor,
                                education: { ...editingDoctor.education, en: e.target.value, ar: editingDoctor.education?.ar || '' }
                              })}
                              className={fieldClass}
                              placeholder="e.g., German Board in Implantology. PhD from Heidelberg University."
                            />
                          </div>

                          <div className="md:col-span-2 space-y-1.5">
                            <label className={labelClass}>السيرة المهنية والقول المأثور بالعربية (Bio AR)</label>
                            <textarea
                              rows={2}
                              required
                              value={editingDoctor.bio?.ar || ''}
                              onChange={(e) => setEditingDoctor({
                                ...editingDoctor,
                                bio: { ...editingDoctor.bio, ar: e.target.value, en: editingDoctor.bio?.en || '' }
                              })}
                              className={fieldClass}
                              placeholder="مثال: يمتلك خبرة تفوق ١٥ عامًا في زراعة الأسنان الفورية وتطعيم العظام المتقدم..."
                            />
                          </div>

                          <div className="md:col-span-2 space-y-1.5">
                            <label className={labelClass}>Bio commentary in English</label>
                            <textarea
                              rows={2}
                              required
                              value={editingDoctor.bio?.en || ''}
                              onChange={(e) => setEditingDoctor({
                                ...editingDoctor,
                                bio: { ...editingDoctor.bio, en: e.target.value, ar: editingDoctor.bio?.ar || '' }
                              })}
                              className={fieldClass}
                              placeholder="e.g., Bringing over 15 years of exceptional clinical precision in same-day implant..."
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-line">
                          <button type="button" onClick={() => setEditingDoctor(null)} className={ghostBtnClass}>
                            {isRtl ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button type="submit" disabled={isSaving} className={primaryBtnClass}>
                            <Save size={13} />
                            <span>{isRtl ? 'حفظ الطبيب' : 'Save & Publish Profile'}</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-5">
                        <div className="flex items-end justify-between gap-4 flex-wrap">
                          <div>
                            <h3 className="text-2xl font-display font-semibold text-ink">
                              {isRtl ? 'الأطباء الاستشاريين المتواجدين' : 'Medical Faculty'}
                            </h3>
                            <p className="text-xs text-muted mt-1 font-sans">
                              {isRtl ? 'إدارة ملفات وشهادات الفريق الطبي.' : 'Manage profiles, degrees, and clinical focuses.'}
                            </p>
                          </div>
                          <button onClick={() => setEditingDoctor({})} className={primaryBtnClass}>
                            <Plus size={14} />
                            <span>{isRtl ? 'إضافة طبيب جديد' : 'Add Doctor'}</span>
                          </button>
                        </div>

                        <div className={`${cardClass} overflow-hidden`}>
                          {doctors.length === 0 ? (
                            emptyState(
                              <Users size={28} />,
                              isRtl ? 'لا يوجد أطباء مضافين' : 'No doctors yet',
                              isRtl ? 'أضف أول استشاري إلى الفريق الطبي.' : 'Add the first consultant to the medical team.'
                            )
                          ) : (
                            <div className="divide-y divide-line">
                              {doctors.map((doctor) => (
                                <div key={doctor.id} className="p-4 flex items-center gap-4 hover:bg-bg-light/80 transition-colors">
                                  <img
                                    src={doctor.image}
                                    alt={doctor.name[lang]}
                                    className="w-14 h-14 rounded-full object-cover bg-bg-warm shrink-0 border border-line"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="flex-grow min-w-0">
                                    <h4 className="text-sm font-display font-semibold truncate text-ink">
                                      {doctor.name[lang]}
                                    </h4>
                                    <p className="text-[11px] text-muted flex items-center gap-2 mt-1 font-sans">
                                      <span>{doctor.role[lang]}</span>
                                      <span>·</span>
                                      <span className="truncate">{doctor.education[lang]}</span>
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={() => setEditingDoctor(doctor)}
                                      className="p-2 rounded-lg hover:bg-bg-warm text-ink-soft hover:text-bronze transition-colors cursor-pointer"
                                      title={isRtl ? 'تعديل' : 'Edit'}
                                    >
                                      <Edit3 size={15} />
                                    </button>
                                    <button
                                      onClick={() => deleteDoctor(doctor.id)}
                                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                                      title={isRtl ? 'حذف' : 'Delete'}
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </main>
            </div>

            <footer className="bg-bg-warm/40 border-t border-line px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted gap-3">
              <div className="flex items-center gap-1.5 font-sans">
                <Star size={12} className="text-bronze" />
                <span>
                  {isRtl
                    ? 'جميع تعديلات المحتوى تظهر فورياً للزوار وتُحفظ بأمان.'
                    : 'Content updates sync securely for site visitors.'}
                </span>
              </div>
              <div className="font-sans uppercase text-bronze tracking-[0.16em] text-[10px]">
                Developed by Masar Agency
              </div>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}
