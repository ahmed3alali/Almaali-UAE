/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Lock, LayoutDashboard, BookOpen, Image as ImageIcon,
  Users, Trash2, Edit3, Plus, Save, RotateCcw,
  ChevronRight, ChevronLeft, Check, Star, AlertCircle, FileText,
  Database, Copy, LogOut, Mail
} from 'lucide-react';
import { Language, BlogPost, GalleryItem, Doctor } from '../types';
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

export default function AdminDashboard({
  lang,
  isOpen,
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
  const [sqlCopied, setSqlCopied] = useState(false);

  // Check for existing Supabase Auth session on mount
  useEffect(() => {
    getAdminSession().then((session) => {
      setIsAuthenticated(!!session);
      setIsCheckingSession(false);
    });
  }, []);

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

  const showConfirm = (message: string, onConfirm: () => void) => setConfirmDialog({ message, onConfirm });

  const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

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
    setIsLoggingIn(true);
    setLoginError(null);
    const result = await signInAdmin(email, password);
    setIsLoggingIn(false);
    if (result.success) {
      setIsAuthenticated(true);
      setEmail('');
      setPassword('');
    } else {
      const isEmailNotConfirmed = result.error === 'email_not_confirmed';
      setLoginError(
        isRtl
          ? isEmailNotConfirmed
            ? 'البريد الإلكتروني غير مؤكد — يرجى تفعيل الحساب من لوحة Supabase'
            : 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
          : isEmailNotConfirmed
            ? 'Email not confirmed — please confirm the user in Supabase Dashboard'
            : 'Invalid email or password'
      );
      setTimeout(() => setLoginError(null), 6000);
    }
  };


  const resetToFactoryDefault = () => {
    window.location.reload();
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

  return (
    <div className="min-h-screen bg-[#fcfaf7] flex flex-col text-[#4e4033] selection:bg-[#9c7049]/30 selection:text-[#4e4033] overflow-x-hidden">
      {/* Main Administrative Dashboard Shell */}
      <div className="relative bg-white w-full min-h-screen flex flex-col overflow-hidden text-[#4e4033]">

        {/* Head Bar */}
        <header className="bg-[#4e4033] text-[#f0e8dd] px-6 py-4 flex items-center justify-between border-b border-[#9c7049]/30 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#9c7049]/20 flex items-center justify-center text-[#d2b58b] border border-[#9c7049]/30">
              <LayoutDashboard size={18} />
            </div>
            <div>
              <h1 className="text-sm md:text-lg font-display font-bold tracking-wide">
                {isRtl ? 'بوابة إدارة عيادات المعالي الفخمة' : 'Al Maali Luxury Admin Portal'}
              </h1>
              <p className="text-[9px] md:text-[10px] font-mono text-[#d2b58b] uppercase tracking-wider">
                Elite Medical CMS Panel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                await signOutAdmin();
                setIsAuthenticated(false);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-all cursor-pointer border border-red-400/30 text-xs font-sans font-medium"
            >
              <LogOut size={14} />
              <span>{isRtl ? 'تسجيل خروج' : 'Logout'}</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10 text-[#f0e8dd] hover:text-[#9c7049] transition-all cursor-pointer border border-[#9c7049]/20 text-xs font-sans font-medium"
            >
              {isRtl ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              <span>{isRtl ? 'العودة للموقع' : 'Back to Site'}</span>
            </button>
          </div>
        </header>

        {/* Toast popup notifications */}
        <AnimatePresence>
          {isSaving && (
            <motion.div
              key="saving-toast"
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#4e4033] text-[#f0e8dd] px-6 py-3.5 rounded-2xl shadow-2xl border border-[#d2b58b]/30 flex items-center gap-3 min-w-[260px]"
            >
              <div className="w-5 h-5 border-2 border-[#d2b58b] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">{isRtl ? 'جاري النشر...' : 'Publishing...'}</span>
            </motion.div>
          )}

          {actionSuccess && !isSaving && (
            <motion.div
              key="success-toast"
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-white text-[#4e4033] px-6 py-4 rounded-2xl shadow-2xl border border-emerald-200 flex items-center gap-3 min-w-[280px]"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Check size={18} className="text-emerald-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">{isRtl ? 'تم بنجاح' : 'Success'}</span>
                <span className="text-xs text-[#4e4033]/70">{actionSuccess}</span>
              </div>
            </motion.div>
          )}

          {actionError && (
            <motion.div
              key="error-toast"
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-white text-[#4e4033] px-6 py-4 rounded-2xl shadow-2xl border border-red-200 flex items-center gap-3 min-w-[280px]"
            >
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle size={18} className="text-red-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">{isRtl ? 'خطأ' : 'Error'}</span>
                <span className="text-xs text-[#4e4033]/70">{actionError}</span>
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
              className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setConfirmDialog(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl border border-[#9c7049]/20 p-6 w-full max-w-sm text-center space-y-5"
              >
                <div className="w-12 h-12 rounded-full bg-red-100 mx-auto flex items-center justify-center">
                  <Trash2 size={22} className="text-red-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#4e4033]">
                    {isRtl ? 'تأكيد الحذف' : 'Confirm Deletion'}
                  </h3>
                  <p className="text-sm text-[#4e4033]/70 leading-relaxed">
                    {confirmDialog.message}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#9c7049]/30 text-[#4e4033] text-sm font-medium hover:bg-[#f0e8dd]/40 transition-all cursor-pointer"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      const cb = confirmDialog.onConfirm;
                      setConfirmDialog(null);
                      cb();
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all cursor-pointer"
                  >
                    {isRtl ? 'حذف' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ADMIN LOGIN — Supabase Auth */}
        {!isAuthenticated ? (
          <div className="flex-grow flex flex-col items-center justify-center p-6 bg-[#fcfaf7]">
            {isCheckingSession ? (
              /* Checking existing session spinner */
              <div className="flex flex-col items-center gap-4 text-[#4e4033]/60">
                <div className="w-10 h-10 border-2 border-[#9c7049] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-sans">{isRtl ? 'جاري التحقق من الجلسة...' : 'Checking session...'}</p>
              </div>
            ) : (
              <motion.form
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onSubmit={handleLogin}
                className="bg-white p-8 rounded-3xl border border-[#9c7049]/25 shadow-xl max-w-sm w-full space-y-6 text-center"
              >
                <div className="w-14 h-14 bg-[#4e4033] text-[#d2b58b] rounded-2xl mx-auto flex items-center justify-center shadow-md">
                  <Lock size={24} />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-display font-bold text-[#4e4033]">
                    {isRtl ? 'تسجيل الدخول الإداري' : 'Admin Sign In'}
                  </h2>
                  <p className="text-xs text-[#4e4033]/60 leading-relaxed font-sans">
                    {isRtl
                      ? 'أدخل بريدك الإلكتروني وكلمة المرور للدخول إلى لوحة التحكم.'
                      : 'Enter your admin email and password to access the dashboard.'}
                  </p>
                </div>

                <div className="space-y-3 text-left">
                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                      {isRtl ? 'البريد الإلكتروني' : 'Email'}
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9c7049]/60" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={isRtl ? 'admin@almaali.com' : 'admin@almaali.com'}
                        autoComplete="email"
                        className={`w-full border ${loginError ? 'border-red-400 bg-red-50' : 'border-[#9c7049]/30 bg-white'} rounded-full py-2.5 pl-9 pr-4 text-xs focus:ring-1 focus:ring-[#9c7049] focus:outline-none font-sans`}
                        required
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                      {isRtl ? 'كلمة المرور' : 'Password'}
                    </label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9c7049]/60" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className={`w-full border ${loginError ? 'border-red-400 bg-red-50' : 'border-[#9c7049]/30 bg-white'} rounded-full py-2.5 pl-9 pr-4 text-xs focus:ring-1 focus:ring-[#9c7049] focus:outline-none font-sans`}
                        required
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Error message */}
                  {loginError && (
                    <p className="text-xs text-red-600 text-center font-sans pt-1">{loginError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-[#4e4033] hover:bg-[#9c7049] disabled:opacity-60 disabled:cursor-not-allowed text-[#f0e8dd] rounded-full py-3 font-medium text-xs shadow-md transition-all cursor-pointer transform hover:translate-y-[-1px] active:translate-y-0 flex items-center justify-center gap-2"
                >
                  {isLoggingIn ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#f0e8dd] border-t-transparent rounded-full animate-spin" />
                      <span>{isRtl ? 'جاري التحقق...' : 'Signing in...'}</span>
                    </>
                  ) : (
                    <span>{isRtl ? 'دخول لوحة التحكم' : 'Sign In & Enter'}</span>
                  )}
                </button>
              </motion.form>
            )}
          </div>
        ) : (
          /* ACTUAL ADMINISTRATIVE WORKSPACE PANEL */
          <div className="flex-grow flex flex-col md:flex-row overflow-hidden bg-[#fcfaf7]">

            {/* Left/Right Sidebar Tabs */}
            <aside className="w-full md:w-56 bg-white border-b md:border-b-0 md:border-r border-[#9c7049]/10 p-4 space-y-1.5 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible shrink-0">

              <button
                onClick={() => { setActiveTab('blogs'); setEditingBlog(null); }}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all flex-grow md:flex-grow-0 whitespace-nowrap ${activeTab === 'blogs'
                  ? 'bg-[#4e4033] text-[#f0e8dd] shadow-sm'
                  : 'text-[#4e4033]/75 hover:bg-[#f0e8dd]/40 hover:text-[#4e4033]'
                  }`}
              >
                <BookOpen size={15} />
                <span>{isRtl ? 'مقالات المدونة' : 'Blog Articles'}</span>
                <span className="ml-auto text-[10px] bg-black/10 px-1.5 py-0.5 rounded-md font-mono">{blogPosts.length}</span>
              </button>

              <button
                onClick={() => { setActiveTab('gallery'); setEditingGallery(null); }}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all flex-grow md:flex-grow-0 whitespace-nowrap ${activeTab === 'gallery'
                  ? 'bg-[#4e4033] text-[#f0e8dd] shadow-sm'
                  : 'text-[#4e4033]/75 hover:bg-[#f0e8dd]/40 hover:text-[#4e4033]'
                  }`}
              >
                <ImageIcon size={15} />
                <span>{isRtl ? 'معرض الصور' : 'Photo Gallery'}</span>
                <span className="ml-auto text-[10px] bg-black/10 px-1.5 py-0.5 rounded-md font-mono">{galleryItems.length}</span>
              </button>

              <button
                onClick={() => { setActiveTab('team'); setEditingDoctor(null); }}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all flex-grow md:flex-grow-0 whitespace-nowrap ${activeTab === 'team'
                  ? 'bg-[#4e4033] text-[#f0e8dd] shadow-sm'
                  : 'text-[#4e4033]/75 hover:bg-[#f0e8dd]/40 hover:text-[#4e4033]'
                  }`}
              >
                <Users size={15} />
                <span>{isRtl ? 'الفريق الطبي' : 'Medical Team'}</span>
                <span className="ml-auto text-[10px] bg-black/10 px-1.5 py-0.5 rounded-md font-mono">{doctors.length}</span>
              </button>
            </aside>

            {/* TAB CONTAINER BODY */}
            <main className="flex-grow p-6 overflow-y-auto relative">

              {/* --- TAB: BLOG POSTS --- */}
              {activeTab === 'blogs' && (
                <div className="space-y-6">
                  {editingBlog ? (
                    /* EDITING / ADDING BLOG COMPONENT */
                    <form onSubmit={saveBlog} className="bg-white p-6 rounded-2xl border border-[#9c7049]/15 shadow-sm space-y-6">
                      <div className="flex items-center justify-between border-b border-[#9c7049]/10 pb-3">
                        <h3 className="text-base font-display font-bold">
                          {editingBlog.id ? (isRtl ? 'تعديل المقال الطبي' : 'Edit Medical Article') : (isRtl ? 'إضافة مقال جديد' : 'Compose New Article')}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setEditingBlog(null)}
                          className="text-xs text-red-600 hover:underline cursor-pointer"
                        >
                          {isRtl ? 'إلغاء التعديل' : 'Cancel Edit'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Title AR */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            العنوان بالعربية (Title AR)
                          </label>
                          <input
                            type="text"
                            required
                            value={editingBlog.title?.ar || ''}
                            onChange={(e) => setEditingBlog({
                              ...editingBlog,
                              title: { ...editingBlog.title, ar: e.target.value, en: editingBlog.title?.en || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="مثال: طب الأسنان المجهري التجميلي..."
                          />
                        </div>

                        {/* Title EN */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            Title in English
                          </label>
                          <input
                            type="text"
                            required
                            value={editingBlog.title?.en || ''}
                            onChange={(e) => setEditingBlog({
                              ...editingBlog,
                              title: { ...editingBlog.title, en: e.target.value, ar: editingBlog.title?.ar || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="e.g., Microscope-Assisted Dentistry..."
                          />
                        </div>

                        {/* Category AR */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            التصنيف بالعربية (Category AR)
                          </label>
                          <input
                            type="text"
                            required
                            value={editingBlog.category?.ar || ''}
                            onChange={(e) => setEditingBlog({
                              ...editingBlog,
                              category: { ...editingBlog.category, ar: e.target.value, en: editingBlog.category?.en || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="مثال: تكنولوجيا طبية"
                          />
                        </div>

                        {/* Category EN */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            Category in English
                          </label>
                          <input
                            type="text"
                            required
                            value={editingBlog.category?.en || ''}
                            onChange={(e) => setEditingBlog({
                              ...editingBlog,
                              category: { ...editingBlog.category, en: e.target.value, ar: editingBlog.category?.ar || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="e.g., Technology"
                          />
                        </div>

                        {/* Author AR */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            الكاتب بالعربية (Author AR)
                          </label>
                          <input
                            type="text"
                            value={editingBlog.author?.ar || ''}
                            onChange={(e) => setEditingBlog({
                              ...editingBlog,
                              author: { ...editingBlog.author, ar: e.target.value, en: editingBlog.author?.en || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="مثال: د. هبة المعالي"
                          />
                        </div>

                        {/* Author EN */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            Author in English
                          </label>
                          <input
                            type="text"
                            value={editingBlog.author?.en || ''}
                            onChange={(e) => setEditingBlog({
                              ...editingBlog,
                              author: { ...editingBlog.author, en: e.target.value, ar: editingBlog.author?.ar || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="e.g., Dr. Hiba Al Maali"
                          />
                        </div>

                        {/* ReadTime AR */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            مدة القراءة بالعربية (Read Time AR)
                          </label>
                          <input
                            type="text"
                            value={editingBlog.readTime?.ar || ''}
                            onChange={(e) => setEditingBlog({
                              ...editingBlog,
                              readTime: { ...editingBlog.readTime, ar: e.target.value, en: editingBlog.readTime?.en || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="مثال: ٤ دقائق قراءة"
                          />
                        </div>

                        {/* ReadTime EN */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            Read Time in English
                          </label>
                          <input
                            type="text"
                            value={editingBlog.readTime?.en || ''}
                            onChange={(e) => setEditingBlog({
                              ...editingBlog,
                              readTime: { ...editingBlog.readTime, en: e.target.value, ar: editingBlog.readTime?.ar || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="e.g., 4 min read"
                          />
                        </div>

                        {/* Image Upload */}
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            {isRtl ? 'صورة المقال التوضيحية (من الجهاز)' : 'Article Thumbnail Image (Local File)'}
                          </label>
                          <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const file = e.dataTransfer.files?.[0];
                              if (file) readImageFile(file, (dataUrl) => setEditingBlog({ ...editingBlog, image: dataUrl }));
                            }}
                            className="border-2 border-dashed border-[#9c7049]/30 hover:border-[#9c7049] rounded-2xl p-6 text-center transition-all cursor-pointer bg-[#fcfaf7] relative group"
                          >
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) readImageFile(file, (dataUrl) => setEditingBlog({ ...editingBlog, image: dataUrl }));
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {editingBlog.image ? (
                              <div className="space-y-3 relative z-20">
                                <img
                                  src={editingBlog.image}
                                  alt="Preview"
                                  className="mx-auto max-h-36 object-cover rounded-xl border border-[#9c7049]/20"
                                />
                                <div className="flex justify-center gap-2">
                                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    {isRtl ? '✓ تم اختيار الصورة' : '✓ Image Selected'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setEditingBlog({ ...editingBlog, image: '' });
                                    }}
                                    className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 cursor-pointer hover:bg-rose-100 transition-colors"
                                  >
                                    {isRtl ? 'إلغاء' : 'Clear'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2 py-3">
                                <ImageIcon className="mx-auto text-[#9c7049]/50 group-hover:text-[#9c7049]/80 transition-colors" size={36} />
                                <p className="text-xs text-[#4e4033]/80 font-sans font-medium">
                                  {isRtl
                                    ? 'اسحب وأفلت ملف الصورة هنا، أو اضغط للتصفح من جهازك'
                                    : 'Drag & drop image file here, or click to browse'}
                                </p>
                                <p className="text-[10px] text-[#4e4033]/45 font-mono">
                                  PNG, JPG, WEBP, GIF (Max 2MB)
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Excerpt AR */}
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            نبذة مختصرة بالعربية (Excerpt AR)
                          </label>
                          <textarea
                            rows={2}
                            required
                            value={editingBlog.excerpt?.ar || ''}
                            onChange={(e) => setEditingBlog({
                              ...editingBlog,
                              excerpt: { ...editingBlog.excerpt, ar: e.target.value, en: editingBlog.excerpt?.en || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="ملخص قصير جداً يظهر في صفحة المدونات الرئيسية..."
                          />
                        </div>

                        {/* Excerpt EN */}
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            Excerpt in English
                          </label>
                          <textarea
                            rows={2}
                            required
                            value={editingBlog.excerpt?.en || ''}
                            onChange={(e) => setEditingBlog({
                              ...editingBlog,
                              excerpt: { ...editingBlog.excerpt, en: e.target.value, ar: editingBlog.excerpt?.ar || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="Brief abstract preview summary of the article..."
                          />
                        </div>

                        {/* Content AR */}
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            نص المقال كاملاً بالعربية (Full Content AR)
                          </label>
                          <textarea
                            rows={5}
                            required
                            value={editingBlog.content?.ar || ''}
                            onChange={(e) => setEditingBlog({
                              ...editingBlog,
                              content: { ...editingBlog.content, ar: e.target.value, en: editingBlog.content?.en || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs leading-relaxed"
                            placeholder="اكتب المحتوى الكامل للمقال هنا بالتفصيل وبشكل منسق..."
                          />
                        </div>

                        {/* Content EN */}
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            Full Content in English
                          </label>
                          <textarea
                            rows={5}
                            required
                            value={editingBlog.content?.en || ''}
                            onChange={(e) => setEditingBlog({
                              ...editingBlog,
                              content: { ...editingBlog.content, en: e.target.value, ar: editingBlog.content?.ar || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs leading-relaxed"
                            placeholder="Enter the complete English translation of the article..."
                          />
                        </div>

                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-[#9c7049]/10">
                        <button
                          type="button"
                          onClick={() => setEditingBlog(null)}
                          className="bg-[#f0e8dd] hover:bg-[#d2b58b]/20 px-4 py-2 rounded-full text-xs transition-colors cursor-pointer"
                        >
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          className="bg-[#4e4033] hover:bg-[#9c7049] text-[#f0e8dd] px-6 py-2 rounded-full text-xs font-semibold shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Save size={13} />
                          <span>{isRtl ? 'حفظ المقال ونشره' : 'Save & Publish Article'}</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* REGULAR BLOGS LISTING VIEW */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-display font-bold">
                            {isRtl ? 'المقالات الطبية المنشورة' : 'Published Medical Articles'}
                          </h3>
                          <p className="text-[10px] text-[#4e4033]/60">
                            {isRtl ? 'قم بإضافة مقالات أو تعديل المحتويات المنشورة حالياً.' : 'Add new posts or edit/delete existing content.'}
                          </p>
                        </div>
                        <button
                          onClick={() => setEditingBlog({})}
                          className="bg-[#4e4033] hover:bg-[#9c7049] text-[#f0e8dd] px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>{isRtl ? 'إضافة مقال جديد' : 'Compose Article'}</span>
                        </button>
                      </div>

                      <div className="bg-white rounded-2xl border border-[#9c7049]/10 shadow-sm overflow-hidden">
                        {blogPosts.length === 0 ? (
                          <div className="p-12 text-center text-[#4e4033]/55 space-y-2">
                            <FileText className="mx-auto text-[#9c7049]/30" size={36} />
                            <p className="text-sm font-bold">{isRtl ? 'لا توجد مقالات مضافة' : 'No articles added yet'}</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-[#9c7049]/10">
                            {blogPosts.map((post) => (
                              <div key={post.id} className="p-4 flex items-center gap-4 hover:bg-[#fcfaf7]/50 transition-colors">
                                <img
                                  src={post.image}
                                  alt={post.title[lang]}
                                  className="w-12 h-12 rounded-lg object-cover bg-[#f0e8dd]/40 shrink-0 border border-[#9c7049]/10"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex-grow min-w-0">
                                  <h4 className="text-xs font-bold truncate text-[#4e4033]">
                                    {post.title[lang]}
                                  </h4>
                                  <p className="text-[10px] text-[#4e4033]/60 flex items-center gap-2 mt-1">
                                    <span>{post.category[lang]}</span>
                                    <span>•</span>
                                    <span>{post.date[lang]}</span>
                                    <span>•</span>
                                    <span>{post.author[lang]}</span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => setEditingBlog(post)}
                                    className="p-1.5 rounded-md hover:bg-[#f0e8dd] text-[#4e4033]/85 hover:text-[#9c7049] transition-colors cursor-pointer"
                                    title={isRtl ? 'تعديل' : 'Edit'}
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button
                                    onClick={() => deleteBlog(post.id)}
                                    className="p-1.5 rounded-md hover:bg-red-50 text-red-600 hover:text-red-800 transition-colors cursor-pointer"
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
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB: GALLERY ITEMS --- */}
              {activeTab === 'gallery' && (
                <div className="space-y-6">
                  {editingGallery ? (
                    /* EDITING / ADDING GALLERY IMAGE */
                    <form onSubmit={saveGallery} className="bg-white p-6 rounded-2xl border border-[#9c7049]/15 shadow-sm space-y-6">
                      <div className="flex items-center justify-between border-b border-[#9c7049]/10 pb-3">
                        <h3 className="text-base font-display font-bold">
                          {editingGallery.id ? (isRtl ? 'تعديل صورة المعرض' : 'Edit Gallery Item') : (isRtl ? 'إضافة صورة جديدة للمعرض' : 'Add Image to Gallery')}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setEditingGallery(null)}
                          className="text-xs text-red-600 hover:underline cursor-pointer"
                        >
                          {isRtl ? 'إلغاء التعديل' : 'Cancel Edit'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Title AR */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            العنوان بالعربية (Title AR)
                          </label>
                          <input
                            type="text"
                            required
                            value={editingGallery.title?.ar || ''}
                            onChange={(e) => setEditingGallery({
                              ...editingGallery,
                              title: { ...editingGallery.title, ar: e.target.value, en: editingGallery.title?.en || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="مثال: ابتسامة فينير ناصعة..."
                          />
                        </div>

                        {/* Title EN */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            Title in English
                          </label>
                          <input
                            type="text"
                            required
                            value={editingGallery.title?.en || ''}
                            onChange={(e) => setEditingGallery({
                              ...editingGallery,
                              title: { ...editingGallery.title, en: e.target.value, ar: editingGallery.title?.ar || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="e.g., Bespoke Porcelain Veneers..."
                          />
                        </div>



                        {/* Image Upload */}
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            {isRtl ? 'تحميل الصورة الفنية المعرضية (من الجهاز)' : 'Artistic Gallery Image Upload (Local File)'}
                          </label>
                          <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const file = e.dataTransfer.files?.[0];
                              if (file) readImageFile(file, (dataUrl) => setEditingGallery({ ...editingGallery, image: dataUrl }));
                            }}
                            className="border-2 border-dashed border-[#9c7049]/30 hover:border-[#9c7049] rounded-2xl p-6 text-center transition-all cursor-pointer bg-[#fcfaf7] relative group"
                          >
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) readImageFile(file, (dataUrl) => setEditingGallery({ ...editingGallery, image: dataUrl }));
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {editingGallery.image ? (
                              <div className="space-y-3 relative z-20">
                                <img
                                  src={editingGallery.image}
                                  alt="Preview"
                                  className="mx-auto max-h-36 object-cover rounded-xl border border-[#9c7049]/20"
                                />
                                <div className="flex justify-center gap-2">
                                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    {isRtl ? '✓ تم اختيار الصورة' : '✓ Image Selected'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setEditingGallery({ ...editingGallery, image: '' });
                                    }}
                                    className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 cursor-pointer hover:bg-rose-100 transition-colors"
                                  >
                                    {isRtl ? 'إلغاء' : 'Clear'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2 py-3">
                                <ImageIcon className="mx-auto text-[#9c7049]/50 group-hover:text-[#9c7049]/80 transition-colors" size={36} />
                                <p className="text-xs text-[#4e4033]/80 font-sans font-medium">
                                  {isRtl
                                    ? 'اسحب وأفلت ملف الصورة هنا، أو اضغط للتصفح من جهازك'
                                    : 'Drag & drop image file here, or click to browse'}
                                </p>
                                <p className="text-[10px] text-[#4e4033]/45 font-mono">
                                  PNG, JPG, WEBP, GIF (Max 2MB)
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Description AR */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            الشرح والوصف بالعربية (Description AR)
                          </label>
                          <textarea
                            rows={3}
                            value={editingGallery.description?.ar || ''}
                            onChange={(e) => setEditingGallery({
                              ...editingGallery,
                              description: { ...editingGallery.description, ar: e.target.value, en: editingGallery.description?.en || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="اكتب شرحاً بسيطاً تجميلياً للصورة..."
                          />
                        </div>

                        {/* Description EN */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            Description in English
                          </label>
                          <textarea
                            rows={3}
                            value={editingGallery.description?.en || ''}
                            onChange={(e) => setEditingGallery({
                              ...editingGallery,
                              description: { ...editingGallery.description, en: e.target.value, ar: editingGallery.description?.ar || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="Write a brief aesthetic commentary or details..."
                          />
                        </div>

                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-[#9c7049]/10">
                        <button
                          type="button"
                          onClick={() => setEditingGallery(null)}
                          className="bg-[#f0e8dd] hover:bg-[#d2b58b]/20 px-4 py-2 rounded-full text-xs transition-colors cursor-pointer"
                        >
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          className="bg-[#4e4033] hover:bg-[#9c7049] text-[#f0e8dd] px-6 py-2 rounded-full text-xs font-semibold shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Save size={13} />
                          <span>{isRtl ? 'حفظ وإضافة للمعرض' : 'Save & Publish Image'}</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* REGULAR GALLERY LISTING VIEW */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-display font-bold">
                            {isRtl ? 'محتويات المعرض الفني' : 'Aesthetic Gallery Showcase'}
                          </h3>
                          <p className="text-[10px] text-[#4e4033]/60">
                            {isRtl ? 'إدارة صور العيادة وحالات الابتسامات التي تظهر في سلايدر المعرض.' : 'Manage space photos & smile cases displayed in the slider.'}
                          </p>
                        </div>
                        <button
                          onClick={() => setEditingGallery({})}
                          className="bg-[#4e4033] hover:bg-[#9c7049] text-[#f0e8dd] px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>{isRtl ? 'إضافة صورة جديدة' : 'Add Image'}</span>
                        </button>
                      </div>

                      <div className="bg-white rounded-2xl border border-[#9c7049]/10 shadow-sm overflow-hidden">
                        {galleryItems.length === 0 ? (
                          <div className="p-12 text-center text-[#4e4033]/55 space-y-2">
                            <ImageIcon className="mx-auto text-[#9c7049]/30" size={36} />
                            <p className="text-sm font-bold">{isRtl ? 'لا توجد صور مضافة' : 'No images added yet'}</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-[#9c7049]/10">
                            {galleryItems.map((item) => (
                              <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-[#fcfaf7]/50 transition-colors">
                                <img
                                  src={item.image}
                                  alt={item.title[lang]}
                                  className="w-12 h-12 rounded-lg object-cover bg-[#f0e8dd]/40 shrink-0 border border-[#9c7049]/10"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex-grow min-w-0">
                                  <h4 className="text-xs font-bold truncate text-[#4e4033]">
                                    {item.title[lang]}
                                  </h4>
                                  <p className="text-[10px] text-[#4e4033]/60 flex items-center gap-2 mt-1">
                                    <span className="bg-[#4e4033]/5 px-2 py-0.5 rounded text-[#9c7049] font-mono">
                                      {item.category === 'clinic' ? (isRtl ? 'مساحة بوتيك' : 'Boutique Space') : (isRtl ? 'حالات تجميل' : 'Smile Case')}
                                    </span>
                                    {item.description?.[lang] && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate">{item.description[lang]}</span>
                                      </>
                                    )}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => setEditingGallery(item)}
                                    className="p-1.5 rounded-md hover:bg-[#f0e8dd] text-[#4e4033]/85 hover:text-[#9c7049] transition-colors cursor-pointer"
                                    title={isRtl ? 'تعديل' : 'Edit'}
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button
                                    onClick={() => deleteGallery(item.id)}
                                    className="p-1.5 rounded-md hover:bg-red-50 text-red-600 hover:text-red-800 transition-colors cursor-pointer"
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
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB: MEDICAL TEAM --- */}
              {activeTab === 'team' && (
                <div className="space-y-6">
                  {editingDoctor ? (
                    /* EDITING / ADDING TEAM MEMBER */
                    <form onSubmit={saveDoctor} className="bg-white p-6 rounded-2xl border border-[#9c7049]/15 shadow-sm space-y-6">
                      <div className="flex items-center justify-between border-b border-[#9c7049]/10 pb-3">
                        <h3 className="text-base font-display font-bold">
                          {editingDoctor.id ? (isRtl ? 'تعديل بيانات الطبيب' : 'Edit Doctor Details') : (isRtl ? 'إضافة طبيب استشاري جديد' : 'Add New Consultant Doctor')}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setEditingDoctor(null)}
                          className="text-xs text-red-600 hover:underline cursor-pointer"
                        >
                          {isRtl ? 'إلغاء التعديل' : 'Cancel Edit'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Name AR */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            الاسم بالعربية (Name AR)
                          </label>
                          <input
                            type="text"
                            required
                            value={editingDoctor.name?.ar || ''}
                            onChange={(e) => setEditingDoctor({
                              ...editingDoctor,
                              name: { ...editingDoctor.name, ar: e.target.value, en: editingDoctor.name?.en || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="مثال: د. فيصل الشهري..."
                          />
                        </div>

                        {/* Name EN */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            Full Name in English
                          </label>
                          <input
                            type="text"
                            required
                            value={editingDoctor.name?.en || ''}
                            onChange={(e) => setEditingDoctor({
                              ...editingDoctor,
                              name: { ...editingDoctor.name, en: e.target.value, ar: editingDoctor.name?.ar || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="e.g., Dr. Faisal Al-Shehri..."
                          />
                        </div>

                        {/* Role AR */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            التخصص بالعربية (Role/Specialty AR)
                          </label>
                          <input
                            type="text"
                            required
                            value={editingDoctor.role?.ar || ''}
                            onChange={(e) => setEditingDoctor({
                              ...editingDoctor,
                              role: { ...editingDoctor.role, ar: e.target.value, en: editingDoctor.role?.en || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="مثال: استشاري زراعة الأسنان المجهرية وجراحة الفكين"
                          />
                        </div>

                        {/* Role EN */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            Role / Specialty in English
                          </label>
                          <input
                            type="text"
                            required
                            value={editingDoctor.role?.en || ''}
                            onChange={(e) => setEditingDoctor({
                              ...editingDoctor,
                              role: { ...editingDoctor.role, en: e.target.value, ar: editingDoctor.role?.ar || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="e.g., Senior Consultant in Micro-Implantology & Oral Surgery"
                          />
                        </div>

                        {/* Image Upload */}
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            {isRtl ? 'تحميل صورة الطبيب الشخصية (من الجهاز)' : 'Doctor Profile Image Upload (Local File)'}
                          </label>
                          <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const file = e.dataTransfer.files?.[0];
                              if (file) readImageFile(file, (dataUrl) => setEditingDoctor({ ...editingDoctor, image: dataUrl }));
                            }}
                            className="border-2 border-dashed border-[#9c7049]/30 hover:border-[#9c7049] rounded-2xl p-6 text-center transition-all cursor-pointer bg-[#fcfaf7] relative group"
                          >
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) readImageFile(file, (dataUrl) => setEditingDoctor({ ...editingDoctor, image: dataUrl }));
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {editingDoctor.image ? (
                              <div className="space-y-3 relative z-20">
                                <img
                                  src={editingDoctor.image}
                                  alt="Preview"
                                  className="mx-auto max-h-36 object-cover rounded-xl border border-[#9c7049]/20"
                                />
                                <div className="flex justify-center gap-2">
                                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    {isRtl ? '✓ تم اختيار الصورة' : '✓ Image Selected'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setEditingDoctor({ ...editingDoctor, image: '' });
                                    }}
                                    className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 cursor-pointer hover:bg-rose-100 transition-colors"
                                  >
                                    {isRtl ? 'إلغاء' : 'Clear'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2 py-3">
                                <ImageIcon className="mx-auto text-[#9c7049]/50 group-hover:text-[#9c7049]/80 transition-colors" size={36} />
                                <p className="text-xs text-[#4e4033]/80 font-sans font-medium">
                                  {isRtl
                                    ? 'اسحب وأفلت ملف الصورة هنا، أو اضغط للتصفح من جهازك'
                                    : 'Drag & drop image file here, or click to browse'}
                                </p>
                                <p className="text-[10px] text-[#4e4033]/45 font-mono">
                                  PNG, JPG, WEBP, GIF (Max 2MB)
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Specialties List AR (Comma-separated) */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            الخبرات الدقيقة بالعربية (مفصولة بفاصلة)
                          </label>
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
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="مثال: زراعة فورية, رفع جيوب أنفية, تطعيم عظمي"
                          />
                        </div>

                        {/* Specialties List EN (Comma-separated) */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            Clinical Focuses in English (comma separated)
                          </label>
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
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="e.g., Sinus Lift, Bone Grafting, Guided Implantology"
                          />
                        </div>

                        {/* Education/Degrees AR */}
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            الشهادات والدرجات العلمية بالعربية (Education AR)
                          </label>
                          <input
                            type="text"
                            required
                            value={editingDoctor.education?.ar || ''}
                            onChange={(e) => setEditingDoctor({
                              ...editingDoctor,
                              education: { ...editingDoctor.education, ar: e.target.value, en: editingDoctor.education?.en || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="مثال: البورد الألماني في زراعة الأسنان - دكتوراه من جامعة هايدلبرغ العريقة."
                          />
                        </div>

                        {/* Education/Degrees EN */}
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            Education & Degrees in English
                          </label>
                          <input
                            type="text"
                            required
                            value={editingDoctor.education?.en || ''}
                            onChange={(e) => setEditingDoctor({
                              ...editingDoctor,
                              education: { ...editingDoctor.education, en: e.target.value, ar: editingDoctor.education?.ar || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="e.g., German Board in Implantology. PhD from Heidelberg University."
                          />
                        </div>

                        {/* Bio AR */}
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            السيرة المهنية والقول المأثور بالعربية (Bio AR)
                          </label>
                          <textarea
                            rows={2}
                            required
                            value={editingDoctor.bio?.ar || ''}
                            onChange={(e) => setEditingDoctor({
                              ...editingDoctor,
                              bio: { ...editingDoctor.bio, ar: e.target.value, en: editingDoctor.bio?.en || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="مثال: يمتلك خبرة تفوق ١٥ عامًا في زراعة الأسنان الفورية وتطعيم العظام المتقدم..."
                          />
                        </div>

                        {/* Bio EN */}
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9c7049] font-bold block">
                            Bio commentary in English
                          </label>
                          <textarea
                            rows={2}
                            required
                            value={editingDoctor.bio?.en || ''}
                            onChange={(e) => setEditingDoctor({
                              ...editingDoctor,
                              bio: { ...editingDoctor.bio, en: e.target.value, ar: editingDoctor.bio?.ar || '' }
                            })}
                            className="w-full border border-[#9c7049]/20 rounded-lg p-2.5 focus:outline-[#9c7049] text-xs"
                            placeholder="e.g., Bringing over 15 years of exceptional clinical precision in same-day implant..."
                          />
                        </div>

                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-[#9c7049]/10">
                        <button
                          type="button"
                          onClick={() => setEditingDoctor(null)}
                          className="bg-[#f0e8dd] hover:bg-[#d2b58b]/20 px-4 py-2 rounded-full text-xs transition-colors cursor-pointer"
                        >
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          className="bg-[#4e4033] hover:bg-[#9c7049] text-[#f0e8dd] px-6 py-2 rounded-full text-xs font-semibold shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Save size={13} />
                          <span>{isRtl ? 'حفظ الطبيب' : 'Save & Publish Profile'}</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* REGULAR TEAM MEMBERS LISTING VIEW */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-display font-bold">
                            {isRtl ? 'الأطباء الاستشاريين المتواجدين' : 'Our Specialized Medical Faculty'}
                          </h3>
                          <p className="text-[10px] text-[#4e4033]/60">
                            {isRtl ? 'إدارة ملفات وشهادات الفريق الطبي والخبرات الدقيقة.' : 'Manage profiles, academic degrees, and micro-dental skills.'}
                          </p>
                        </div>
                        <button
                          onClick={() => setEditingDoctor({})}
                          className="bg-[#4e4033] hover:bg-[#9c7049] text-[#f0e8dd] px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>{isRtl ? 'إضافة طبيب جديد' : 'Add Doctor'}</span>
                        </button>
                      </div>

                      <div className="bg-white rounded-2xl border border-[#9c7049]/10 shadow-sm overflow-hidden">
                        {doctors.length === 0 ? (
                          <div className="p-12 text-center text-[#4e4033]/55 space-y-2">
                            <Users className="mx-auto text-[#9c7049]/30" size={36} />
                            <p className="text-sm font-bold">{isRtl ? 'لا يوجد أطباء مضافين' : 'No doctors added yet'}</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-[#9c7049]/10">
                            {doctors.map((doctor) => (
                              <div key={doctor.id} className="p-4 flex items-center gap-4 hover:bg-[#fcfaf7]/50 transition-colors">
                                <img
                                  src={doctor.image}
                                  alt={doctor.name[lang]}
                                  className="w-12 h-12 rounded-full object-cover bg-[#f0e8dd]/40 shrink-0 border border-[#9c7049]/10"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex-grow min-w-0">
                                  <h4 className="text-xs font-bold truncate text-[#4e4033]">
                                    {doctor.name[lang]}
                                  </h4>
                                  <p className="text-[10px] text-[#4e4033]/60 flex items-center gap-2 mt-1">
                                    <span>{doctor.role[lang]}</span>
                                    <span>•</span>
                                    <span className="truncate">{doctor.education[lang]}</span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => setEditingDoctor(doctor)}
                                    className="p-1.5 rounded-md hover:bg-[#f0e8dd] text-[#4e4033]/85 hover:text-[#9c7049] transition-colors cursor-pointer"
                                    title={isRtl ? 'تعديل' : 'Edit'}
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button
                                    onClick={() => deleteDoctor(doctor.id)}
                                    className="p-1.5 rounded-md hover:bg-red-50 text-red-600 hover:text-red-800 transition-colors cursor-pointer"
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
                    </div>
                  )}
                </div>
              )}




            </main>



          </div>
        )}

        {/* Modal Footer banner */}
        <footer className="bg-[#fcfaf7] border-t border-[#9c7049]/10 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#4e4033]/60 gap-3">
          <div className="flex items-center gap-1.5 font-sans">
            <Star size={12} className="text-[#9c7049]" />
            <span>{isRtl ? 'جميع تعديلات المحتوى تظهر فورياً للزوار وتُحفظ بأمان.' : 'All clinical updates are synchronized persistently inside local storage.'}</span>
          </div>

          <div className="font-mono uppercase text-[#9c7049] tracking-wider text-[10px]">
            Developed by Masar Agency</div>
        </footer>

      </div>
    </div>
  );
}
