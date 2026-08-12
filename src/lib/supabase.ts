/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, type AuthChangeEvent, type Session } from '@supabase/supabase-js';
import { BlogPost, GalleryItem, GalleryCategory, Doctor, Service, Testimonial, VisionImages } from '../types';
import { DEFAULT_GALLERY_CATEGORIES } from './galleryCategories';
import { DEFAULT_SERVICES, DEFAULT_TESTIMONIALS, DEFAULT_VISION_IMAGES } from './contentDefaults';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const isDev = import.meta.env.DEV;

/** Softened logger — verbose diagnostics only in development. */
const logDev = (...args: unknown[]) => {
  if (isDev) console.log(...args);
};

// Check if configuration parameters are present
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

logDev(
  '[Supabase] isConfigured:',
  isSupabaseConfigured,
  '| URL:',
  supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : '(empty)'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'almaali_auth_session',
      },
      realtime: { params: { eventsPerSecond: 0 } },
      global: {
        headers: { 'Cache-Control': 'max-age=300' },
      },
    })
  : null;

// --- ADMIN AUTH ---

/**
 * Sign in the admin user via Supabase Auth.
 * On success the JWT is stored automatically and RLS authenticated policies will work.
 */
export async function signInAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !password) {
    return { success: false, error: 'missing_credentials' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });

  if (error) {
    if (isDev) {
      console.error('[Auth] Sign-in failed:', error.message, '| status:', error.status);
    }

    if (error.message?.toLowerCase().includes('email not confirmed')) {
      return { success: false, error: 'email_not_confirmed' };
    }
    if (error.status === 429 || error.message?.toLowerCase().includes('rate')) {
      return { success: false, error: 'rate_limited' };
    }

    return { success: false, error: 'invalid_credentials' };
  }

  logDev('[Auth] Admin signed in successfully. User:', data.user?.email);
  return { success: true };
}

/** Sign out the admin user. */
export async function signOutAdmin(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
  logDev('[Auth] Admin signed out');
}

/** Returns the current Supabase Auth session, or null if not signed in. */
export async function getAdminSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Alias helper — returns the active session or null.
 * Useful for gating privileged actions before writes.
 */
export async function requireAuthSession(): Promise<Session | null> {
  return getAdminSession();
}

/**
 * Subscribe to Supabase auth state changes.
 * Returns an unsubscribe function (no-op when Supabase is not configured).
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): () => void {
  if (!supabase) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return () => subscription.unsubscribe();
}

/**
 * SQL Schema script to run in the Supabase SQL Editor:
 * 
 * -- 1. Create table for Doctors (Medical Team)
 * CREATE TABLE IF NOT EXISTS doctors (
 *   id TEXT PRIMARY KEY,
 *   name JSONB NOT NULL,
 *   role JSONB NOT NULL,
 *   bio JSONB NOT NULL,
 *   specialties JSONB NOT NULL,
 *   education JSONB NOT NULL,
 *   image TEXT NOT NULL,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
 * );
 * 
 * -- 2. Create table for Gallery Items
 * CREATE TABLE IF NOT EXISTS gallery_items (
 *   id TEXT PRIMARY KEY,
 *   title JSONB NOT NULL,
 *   category TEXT NOT NULL CHECK (category IN ('clinic', 'cases')),
 *   image TEXT NOT NULL,
 *   description JSONB,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
 * );
 * 
 * -- 3. Create table for Blog Posts
 * CREATE TABLE IF NOT EXISTS blog_posts (
 *   id TEXT PRIMARY KEY,
 *   title JSONB NOT NULL,
 *   excerpt JSONB NOT NULL,
 *   content JSONB NOT NULL,
 *   date JSONB NOT NULL,
 *   read_time JSONB NOT NULL,
 *   category JSONB NOT NULL,
 *   image TEXT NOT NULL,
 *   author JSONB NOT NULL,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
 * );
 * 
 * -- Enable Row Level Security (RLS) on all tables
 * ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
 * 
 * -- Create public read access policy for all
 * CREATE POLICY "Allow public read access for doctors" ON doctors FOR SELECT USING (true);
 * CREATE POLICY "Allow public read access for gallery_items" ON gallery_items FOR SELECT USING (true);
 * CREATE POLICY "Allow public read access for blog_posts" ON blog_posts FOR SELECT USING (true);
 * 
 * -- Write access only for authenticated users (Supabase Auth)
 * CREATE POLICY "Allow write access for doctors" ON doctors FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
 * CREATE POLICY "Allow write access for gallery_items" ON gallery_items FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
 * CREATE POLICY "Allow write access for blog_posts" ON blog_posts FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
 */

const STORAGE_BUCKET = 'almaali-images';

/** Ensure public media bucket is usable (call while admin is authenticated). */
export async function ensureStorageBucket(): Promise<{ ok: boolean; message: string }> {
  if (!supabase) return { ok: false, message: 'Supabase not configured' };
  try {
    // listBuckets is often blocked for anon/authenticated roles — probe with a tiny upload instead
    const { data: buckets } = await supabase.storage.listBuckets();
    if ((buckets || []).some((b) => b.name === STORAGE_BUCKET)) {
      return { ok: true, message: 'exists' };
    }

    const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    });

    // Probe write — bucket may already exist even when list/create is RLS-blocked
    const probePath = `_probe/${Date.now()}.txt`;
    const { error: probeError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(probePath, new Blob(['ok'], { type: 'text/plain' }), {
        upsert: true,
        contentType: 'text/plain',
      });

    if (!probeError) {
      await supabase.storage.from(STORAGE_BUCKET).remove([probePath]);
      return { ok: true, message: createError ? 'usable' : 'created' };
    }

    return {
      ok: false,
      message: createError?.message || probeError.message,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'bucket error' };
  }
}

export async function uploadBase64Image(base64DataUrl: string, folder: string, fileName: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    await ensureStorageBucket();

    const res = await fetch(base64DataUrl);
    const blob = await res.blob();
    const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
    const path = `${folder}/${fileName}.${ext}`;
    const file = new File([blob], `${fileName}.${ext}`, { type: blob.type || 'image/jpeg' });

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: true, contentType: blob.type || 'image/jpeg' });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    return urlData.publicUrl;
  } catch (err) {
    console.error('Error uploading image to storage:', err);
    return null;
  }
}

// --- BLOG POSTS OPERATIONS ---

/**
 * Fetch blog posts list WITHOUT the heavy `content` field.
 * Content is loaded on-demand via fetchBlogPostContent().
 */
export async function fetchBlogPostsFromSupabase(): Promise<BlogPost[] | null> {
  if (!supabase) { if (isDev) console.warn('[Supabase] fetchBlogPosts: client is null, skipping'); return null; }
  try {
    logDev('[Supabase] Fetching blog_posts...');
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, excerpt, date, read_time, category, image, author')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('[Supabase] Error fetching blogs:', error.message, error);
      return null;
    }
    logDev('[Supabase] blog_posts fetched:', data?.length ?? 0, 'rows');

    // Map DB underscore fields back to camelCase properties of BlogPost
    return (data || []).map(row => ({
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      content: { ar: '', en: '' }, // placeholder — loaded on demand
      date: row.date,
      readTime: row.read_time,
      category: row.category,
      // Prefer remote URLs; tiny data: thumbs are ok (<100KB), else placeholder
      image: publicImageUrl(row.image) || (
        typeof row.image === 'string' && row.image.startsWith('data:') && row.image.length < 100_000
          ? row.image
          : ''
      ),
      author: row.author
    }));
  } catch (err) {
    console.error('Unhandled error in fetchBlogPostsFromSupabase:', err);
    return null;
  }
}

/**
 * Fetch the full content for a single blog post (on-demand).
 */
export async function fetchBlogPostContent(postId: string): Promise<{ ar: string; en: string } | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('content')
      .eq('id', postId)
      .single();

    if (error || !data) return null;
    return data.content as { ar: string; en: string };
  } catch {
    return null;
  }
}

export async function saveBlogPostToSupabase(post: BlogPost): Promise<BlogPost | null> {
  if (!supabase) return null;
  try {
    const image = await resolveStoredImage(post.image, 'blog', post.id);
    const toSave: BlogPost = { ...post, image };

    const dbPayload = {
      id: toSave.id,
      title: toSave.title,
      excerpt: toSave.excerpt,
      content: toSave.content,
      date: toSave.date,
      read_time: toSave.readTime,
      category: toSave.category,
      image: toSave.image,
      author: toSave.author
    };

    const { error } = await supabase
      .from('blog_posts')
      .upsert(dbPayload, { onConflict: 'id' });

    if (error) {
      console.error('Error saving blog to Supabase:', error.message);
      throw error;
    }
    return toSave;
  } catch (err) {
    console.error('Unhandled error in saveBlogPostToSupabase:', err);
    return null;
  }
}

export async function deleteBlogPostFromSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting blog from Supabase:', error.message);
      throw error;
    }
    return true;
  } catch (err) {
    console.error('Unhandled error in deleteBlogPostFromSupabase:', err);
    return false;
  }
}

// --- GALLERY OPERATIONS ---

export async function fetchGalleryItemsFromSupabase(): Promise<GalleryItem[] | null> {
  if (!supabase) { if (isDev) console.warn('[Supabase] fetchGallery: client is null, skipping'); return null; }
  try {
    logDev('[Supabase] Fetching gallery_items (fast)...');
    // Metadata first — avoid downloading inline base64 payloads
    const { data, error } = await supabase
      .from('gallery_items')
      .select('id, title, category, description')
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('[Supabase] Error fetching gallery_items:', error.message, error);
      return null;
    }

    const items: GalleryItem[] = (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      image: '',
      description: row.description,
    }));

    const { data: imageRows } = await supabase
      .from('gallery_items')
      .select('id, image')
      .like('image', 'http%')
      .limit(100);

    const byId = new Map((imageRows || []).map((r) => [String(r.id), publicImageUrl(r.image)]));
    return items.map((item) => ({ ...item, image: byId.get(item.id) || '' }));
  } catch (err) {
    console.error('Unhandled error in fetchGalleryItemsFromSupabase:', err);
    return null;
  }
}

/** Fill in gallery photos (incl. legacy base64) after the fast list is on screen. */
export async function hydrateGalleryImages(
  items: GalleryItem[],
  onUpdate?: (id: string, image: string) => void
): Promise<GalleryItem[]> {
  if (!supabase || items.length === 0) return items;
  const missing = items.filter((g) => !publicImageUrl(g.image));
  if (missing.length === 0) return items;

  const next = [...items];
  await Promise.all(
    missing.map(async (item) => {
      try {
        const { data, error } = await supabase!
          .from('gallery_items')
          .select('image')
          .eq('id', item.id)
          .maybeSingle();
        if (error || !data?.image || typeof data.image !== 'string') return;
        let image = data.image;
        if (image.startsWith('data:')) image = await compressDataUrlForDisplay(image);
        else if (!image.startsWith('http')) return;
        const idx = next.findIndex((g) => g.id === item.id);
        if (idx >= 0) next[idx] = { ...next[idx], image };
        onUpdate?.(item.id, image);
      } catch (err) {
        console.warn(`[DB] hydrate gallery failed for ${item.id}:`, err);
      }
    })
  );
  return next;
}

export async function saveGalleryItemToSupabase(item: GalleryItem): Promise<GalleryItem | null> {
  if (!supabase) return null;
  try {
    const image = await resolveStoredImage(item.image, 'gallery', item.id);
    const toSave: GalleryItem = { ...item, image };

    const { error } = await supabase
      .from('gallery_items')
      .upsert({
        id: toSave.id,
        title: toSave.title,
        category: toSave.category,
        image: toSave.image,
        description: toSave.description
      }, { onConflict: 'id' });

    if (error) {
      console.error('Error saving gallery item to Supabase:', error.message);
      throw error;
    }
    return toSave;
  } catch (err) {
    console.error('Unhandled error in saveGalleryItemToSupabase:', err);
    return null;
  }
}

export async function deleteGalleryItemFromSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('gallery_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting gallery item from Supabase:', error.message);
      throw error;
    }
    return true;
  } catch (err) {
    console.error('Unhandled error in deleteGalleryItemFromSupabase:', err);
    return false;
  }
}

// --- GALLERY CATEGORIES ---

export async function fetchGalleryCategoriesFromSupabase(): Promise<GalleryCategory[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('gallery_categories')
      .select('id, label, sort_order')
      .order('sort_order', { ascending: true })
      .limit(100);

    if (error) {
      // Table may not exist yet — fall back silently
      console.warn('[DB] gallery_categories fetch:', error.message);
      return null;
    }

    const rows = (data || []).map((row, index) => ({
      id: String(row.id),
      label: asLocaleText(row.label),
      sort: typeof row.sort_order === 'number' ? row.sort_order : index,
    }));

    return rows
      .sort((a, b) => a.sort - b.sort)
      .map(({ id, label }) => ({ id, label }));
  } catch (err) {
    console.error('Unhandled error in fetchGalleryCategoriesFromSupabase:', err);
    return null;
  }
}

export async function saveGalleryCategoryToSupabase(
  category: GalleryCategory,
  sortOrder = 0
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('gallery_categories').upsert(
      {
        id: category.id,
        label: category.label,
        sort_order: sortOrder,
      },
      { onConflict: 'id' }
    );
    if (error) {
      console.error('Error saving gallery category:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unhandled error in saveGalleryCategoryToSupabase:', err);
    return false;
  }
}

export async function deleteGalleryCategoryFromSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('gallery_categories').delete().eq('id', id);
    if (error) {
      console.error('Error deleting gallery category:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unhandled error in deleteGalleryCategoryFromSupabase:', err);
    return false;
  }
}

/** Seed defaults when the table is empty / first login. */
export async function ensureDefaultGalleryCategories(): Promise<GalleryCategory[]> {
  const remote = await fetchGalleryCategoriesFromSupabase();
  if (remote && remote.length > 0) return remote;

  if (supabase) {
    for (let i = 0; i < DEFAULT_GALLERY_CATEGORIES.length; i++) {
      await saveGalleryCategoryToSupabase(DEFAULT_GALLERY_CATEGORIES[i], i);
    }
    const seeded = await fetchGalleryCategoriesFromSupabase();
    if (seeded && seeded.length > 0) return seeded;
  }

  return DEFAULT_GALLERY_CATEGORIES;
}

// --- TEAM/DOCTORS OPERATIONS ---

function asLocaleText(value: unknown, fallback = ''): { ar: string; en: string } {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    return {
      ar: typeof obj.ar === 'string' ? obj.ar : fallback,
      en: typeof obj.en === 'string' ? obj.en : fallback,
    };
  }
  if (typeof value === 'string') return { ar: value, en: value };
  return { ar: fallback, en: fallback };
}

function asLocaleList(value: unknown): { ar: string[]; en: string[] } {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const toList = (v: unknown) =>
      Array.isArray(v) ? v.map(String).map((s) => s.trim()).filter(Boolean) : [];
    return { ar: toList(obj.ar), en: toList(obj.en) };
  }
  if (Array.isArray(value)) {
    const list = value.map(String).map((s) => s.trim()).filter(Boolean);
    return { ar: list, en: list };
  }
  return { ar: [], en: [] };
}

/** Public CDN/http images only — never pull multi‑MB `data:` blobs over the wire. */
function publicImageUrl(image: unknown): string {
  if (typeof image !== 'string') return '';
  const trimmed = image.trim();
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) return trimmed;
  return '';
}

/**
 * Prefer Storage URLs. Never block the row save — if upload fails, store empty
 * image (placeholders on the site) rather than aborting the whole CRUD upsert.
 */
async function resolveStoredImage(
  image: string,
  folder: string,
  fileName: string
): Promise<string> {
  if (!image) return '';
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  if (image.startsWith('data:')) {
    const uploaded = await uploadBase64Image(image, folder, fileName);
    if (uploaded) return uploaded;
    console.error(
      `[DB] Image upload failed for ${folder}/${fileName} — saving record without image URL`
    );
    return '';
  }
  return image;
}

function mapDoctorRow(row: Record<string, unknown>, imageOverride?: string): Doctor {
  return {
    id: String(row.id ?? ''),
    name: asLocaleText(row.name),
    role: asLocaleText(row.role),
    bio: asLocaleText(row.bio),
    specialties: asLocaleList(row.specialties),
    education: asLocaleText(row.education),
    image: imageOverride ?? publicImageUrl(row.image),
  };
}

/**
 * Fast public doctors fetch:
 * 1) metadata only (~2KB / ~100ms)
 * 2) attach only http(s) image URLs (skips multi‑MB base64 rows)
 */
export async function fetchDoctorsFromSupabase(): Promise<Doctor[] | null> {
  if (!supabase) return null;
  try {
    const metaQuery = await supabase
      .from('doctors')
      .select('id, name, role, bio, specialties, education')
      .order('created_at', { ascending: true })
      .limit(100);

    let rows = metaQuery.data as Record<string, unknown>[] | null;
    let error = metaQuery.error;

    if (error) {
      console.warn('[DB] fetchDoctors ordered meta failed:', error.message);
      const retry = await supabase
        .from('doctors')
        .select('id, name, role, bio, specialties, education')
        .limit(100);
      rows = retry.data as Record<string, unknown>[] | null;
      error = retry.error;
    }

    if (error) {
      console.warn('Error fetching doctors from Supabase:', error.message);
      return null;
    }

    const doctors = (rows || [])
      .map((row) => mapDoctorRow(row, ''))
      .filter((d) => Boolean(d.id));

    // Lightweight second query — `like.http%` matches http and https
    const { data: imageRows, error: imageError } = await supabase
      .from('doctors')
      .select('id, image')
      .like('image', 'http%')
      .limit(100);

    if (imageError) {
      console.warn('[DB] doctor image URL fetch skipped:', imageError.message);
      return doctors;
    }

    const byId = new Map(
      (imageRows || []).map((r) => [String(r.id), publicImageUrl(r.image)])
    );

    logDev('[DB] fetchDoctors fast path:', { doctors: doctors.length, remoteImages: byId.size });

    return doctors.map((d) => ({
      ...d,
      image: byId.get(d.id) || '',
    }));
  } catch (err) {
    console.error('Unhandled error in fetchDoctorsFromSupabase:', err);
    return null;
  }
}

/**
 * After the fast list loads, pull real photos one-by-one (including legacy base64)
 * so the UI stays responsive while portraits appear.
 * Optionally compress huge base64 before returning.
 */
export async function hydrateDoctorImages(
  doctors: Doctor[],
  onUpdate?: (doctorId: string, image: string) => void
): Promise<Doctor[]> {
  if (!supabase || doctors.length === 0) return doctors;

  const missing = doctors.filter((d) => !publicImageUrl(d.image));
  if (missing.length === 0) return doctors;

  const next = [...doctors];

  await Promise.all(
    missing.map(async (doc) => {
      try {
        const { data, error } = await supabase!
          .from('doctors')
          .select('image')
          .eq('id', doc.id)
          .maybeSingle();

        if (error || !data?.image || typeof data.image !== 'string') return;

        let image = data.image;
        if (image.startsWith('http://') || image.startsWith('https://')) {
          // keep
        } else if (image.startsWith('data:')) {
          image = await compressDataUrlForDisplay(image);
        } else {
          return;
        }

        const idx = next.findIndex((d) => d.id === doc.id);
        if (idx >= 0) next[idx] = { ...next[idx], image };
        onUpdate?.(doc.id, image);
      } catch (err) {
        console.warn(`[DB] hydrate image failed for ${doc.id}:`, err);
      }
    })
  );

  return next;
}

/** Shrink oversized data-URLs so portraits don't freeze the tab. */
async function compressDataUrlForDisplay(dataUrl: string): Promise<string> {
  if (typeof document === 'undefined') return dataUrl;
  if (dataUrl.length < 400_000) return dataUrl;

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = dataUrl;
    });

    const maxSide = 1100;
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.78);
  } catch {
    return dataUrl;
  }
}

export async function saveDoctorToSupabase(doctor: Doctor): Promise<Doctor | null> {
  if (!supabase) return null;
  try {
    const image = await resolveStoredImage(doctor.image, 'doctor', doctor.id);
    const toSave: Doctor = { ...doctor, image };

    const { error } = await supabase
      .from('doctors')
      .upsert({
        id: toSave.id,
        name: toSave.name,
        role: toSave.role,
        bio: toSave.bio,
        specialties: toSave.specialties,
        education: toSave.education,
        image: toSave.image,
      }, { onConflict: 'id' });

    if (error) {
      console.error('Error saving doctor to Supabase:', error.message);
      throw error;
    }
    return toSave;
  } catch (err) {
    console.error('Unhandled error in saveDoctorToSupabase:', err);
    return null;
  }
}

export async function deleteDoctorFromSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('doctors')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting doctor from Supabase:', error.message);
      throw error;
    }
    return true;
  } catch (err) {
    console.error('Unhandled error in deleteDoctorFromSupabase:', err);
    return false;
  }
}

// --- MIGRATION: move base64 images to Supabase Storage ---
export interface MigrationResult {
  totalBase64: number;
  migrated: number;
  failed: number;
  details: string[];
}

export async function migrateBase64ImagesToStorage(
  onProgress?: (msg: string) => void
): Promise<MigrationResult> {
  const result: MigrationResult = { totalBase64: 0, migrated: 0, failed: 0, details: [] };
  if (!supabase) return result;

  const log = (msg: string) => {
    result.details.push(msg);
    onProgress?.(msg);
  };

  const tables = [
    { name: 'blog_posts', folder: 'blog' },
    { name: 'gallery_items', folder: 'gallery' },
    { name: 'doctors', folder: 'doctors' },
    { name: 'services', folder: 'services' },
    { name: 'testimonials', folder: 'testimonials' },
  ] as const;

  for (const table of tables) {
    // IDs only — never select all images in one payload
    const { data: idRows, error } = await supabase.from(table.name).select('id');
    if (error || !idRows) {
      log(`❌ ${table.name}: ${error?.message}`);
      continue;
    }

    let tableBase64 = 0;

    for (const { id } of idRows) {
      const { data: row, error: rowErr } = await supabase
        .from(table.name)
        .select('id, image')
        .eq('id', id)
        .maybeSingle();

      if (rowErr || !row?.image || typeof row.image !== 'string') continue;
      if (!row.image.startsWith('data:')) continue;

      tableBase64++;
      result.totalBase64++;
      log(`🔄 ${table.name}/${id}: uploading…`);

      const url = await uploadBase64Image(row.image, table.folder, id);
      if (!url) {
        result.failed++;
        log(`  ❌ ${id}: upload failed`);
        continue;
      }

      const { error: updateErr } = await supabase
        .from(table.name)
        .update({ image: url })
        .eq('id', id);

      if (updateErr) {
        result.failed++;
        log(`  ❌ ${id}: DB update failed — ${updateErr.message}`);
      } else {
        result.migrated++;
        log(`  ✅ ${id}`);
      }
    }

    if (tableBase64 === 0) log(`✅ ${table.name}: no base64 images`);
  }

  // Vision images (single-row, two columns)
  try {
    const { data: visionRow } = await supabase
      .from('vision_images')
      .select('id, image_primary, image_secondary')
      .eq('id', 'main')
      .maybeSingle();

    if (visionRow) {
      for (const col of ['image_primary', 'image_secondary'] as const) {
        const raw = visionRow[col];
        if (typeof raw === 'string' && raw.startsWith('data:')) {
          result.totalBase64++;
          const folder = col === 'image_primary' ? 'vision-primary' : 'vision-secondary';
          const url = await uploadBase64Image(raw, 'vision', folder);
          if (!url) {
            result.failed++;
            log(`  ❌ vision.${col}: upload failed`);
            continue;
          }
          const { error: updateErr } = await supabase
            .from('vision_images')
            .update({ [col]: url })
            .eq('id', 'main');
          if (updateErr) {
            result.failed++;
            log(`  ❌ vision.${col}: DB update failed — ${updateErr.message}`);
          } else {
            result.migrated++;
            log(`  ✅ vision.${col}`);
          }
        }
      }
    }
  } catch (err) {
    log(`❌ vision_images: ${err instanceof Error ? err.message : 'error'}`);
  }

  return result;
}

// --- SERVICES ---

function mapServiceRow(row: Record<string, unknown>, imageOverride?: string): Service {
  return {
    id: String(row.id ?? ''),
    iconName: typeof row.icon_name === 'string' && row.icon_name ? row.icon_name : 'Gem',
    title: asLocaleText(row.title),
    description: asLocaleText(row.description),
    details: asLocaleList(row.details),
    duration: asLocaleText(row.duration),
    image: imageOverride ?? (publicImageUrl(row.image) || (
      typeof row.image === 'string' && row.image.startsWith('data:') && row.image.length < 100_000
        ? row.image
        : ''
    )),
  };
}

export async function fetchServicesFromSupabase(): Promise<Service[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('services')
      .select('id, icon_name, title, description, details, duration, image, sort_order')
      .order('sort_order', { ascending: true })
      .limit(50);

    if (error) {
      console.warn('[DB] fetchServices failed:', error.message);
      return null;
    }

    return (data || [])
      .map((row) => mapServiceRow(row as Record<string, unknown>))
      .filter((s) => Boolean(s.id));
  } catch (err) {
    console.error('Unhandled error in fetchServicesFromSupabase:', err);
    return null;
  }
}

export async function saveServiceToSupabase(service: Service, sortOrder = 0): Promise<Service | null> {
  if (!supabase) return null;
  try {
    const image = await resolveStoredImage(service.image, 'services', service.id);
    const toSave: Service = { ...service, image };

    const { error } = await supabase.from('services').upsert(
      {
        id: toSave.id,
        icon_name: toSave.iconName || 'Gem',
        title: toSave.title,
        description: toSave.description,
        details: toSave.details,
        duration: toSave.duration,
        image: toSave.image,
        sort_order: sortOrder,
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.error('Error saving service to Supabase:', error.message);
      throw error;
    }
    return toSave;
  } catch (err) {
    console.error('Unhandled error in saveServiceToSupabase:', err);
    return null;
  }
}

export async function deleteServiceFromSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      console.error('Error deleting service:', error.message);
      throw error;
    }
    return true;
  } catch (err) {
    console.error('Unhandled error in deleteServiceFromSupabase:', err);
    return false;
  }
}

/** Seed static specialties when the table is empty. */
export async function ensureDefaultServices(): Promise<Service[]> {
  const remote = await fetchServicesFromSupabase();
  if (remote && remote.length > 0) return remote;

  if (supabase) {
    for (let i = 0; i < DEFAULT_SERVICES.length; i++) {
      await saveServiceToSupabase(DEFAULT_SERVICES[i], i);
    }
    const seeded = await fetchServicesFromSupabase();
    if (seeded && seeded.length > 0) return seeded;
  }

  return DEFAULT_SERVICES;
}

// --- TESTIMONIALS / RATINGS ---

function mapTestimonialRow(row: Record<string, unknown>): Testimonial {
  const ratingRaw = typeof row.rating === 'number' ? row.rating : Number(row.rating);
  const rating = Number.isFinite(ratingRaw) ? Math.min(5, Math.max(1, Math.round(ratingRaw))) : 5;
  return {
    id: String(row.id ?? ''),
    name: asLocaleText(row.name),
    rating,
    comment: asLocaleText(row.comment),
    treatment: asLocaleText(row.treatment),
    date: typeof row.date === 'string' ? row.date : '',
    image: publicImageUrl(row.image) || (
      typeof row.image === 'string' && row.image.startsWith('data:') && row.image.length < 100_000
        ? row.image
        : ''
    ),
  };
}

export async function fetchTestimonialsFromSupabase(): Promise<Testimonial[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('id, name, rating, comment, treatment, date, image, sort_order')
      .order('sort_order', { ascending: true })
      .limit(50);

    if (error) {
      console.warn('[DB] fetchTestimonials failed:', error.message);
      return null;
    }

    return (data || [])
      .map((row) => mapTestimonialRow(row as Record<string, unknown>))
      .filter((t) => Boolean(t.id));
  } catch (err) {
    console.error('Unhandled error in fetchTestimonialsFromSupabase:', err);
    return null;
  }
}

export async function saveTestimonialToSupabase(
  item: Testimonial,
  sortOrder = 0
): Promise<Testimonial | null> {
  if (!supabase) return null;
  try {
    const image = await resolveStoredImage(item.image, 'testimonials', item.id);
    const toSave: Testimonial = { ...item, image };

    const { error } = await supabase.from('testimonials').upsert(
      {
        id: toSave.id,
        name: toSave.name,
        rating: toSave.rating,
        comment: toSave.comment,
        treatment: toSave.treatment,
        date: toSave.date,
        image: toSave.image,
        sort_order: sortOrder,
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.error('Error saving testimonial to Supabase:', error.message);
      throw error;
    }
    return toSave;
  } catch (err) {
    console.error('Unhandled error in saveTestimonialToSupabase:', err);
    return null;
  }
}

export async function deleteTestimonialFromSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) {
      console.error('Error deleting testimonial:', error.message);
      throw error;
    }
    return true;
  } catch (err) {
    console.error('Unhandled error in deleteTestimonialFromSupabase:', err);
    return false;
  }
}

export async function ensureDefaultTestimonials(): Promise<Testimonial[]> {
  const remote = await fetchTestimonialsFromSupabase();
  const seedKey = 'almaali_testimonial_seed_v3';
  let alreadySeeded = false;
  try {
    alreadySeeded = localStorage.getItem(seedKey) === '1';
  } catch {
    /* ignore */
  }

  const oldDemoNames = new Set([
    'Khaled Bin Abdulrahman',
    'Dr. Maryam Al-Qahtani',
    'Rashid Al-Sudairy',
  ]);
  const looksLikeOldDemo =
    !!remote &&
    remote.length > 0 &&
    remote.every((t) => oldDemoNames.has(t.name.en));

  if (remote && remote.length > 0 && alreadySeeded && !looksLikeOldDemo) return remote;

  if (supabase) {
    for (let i = 0; i < DEFAULT_TESTIMONIALS.length; i++) {
      await saveTestimonialToSupabase(DEFAULT_TESTIMONIALS[i], i);
    }
    try {
      localStorage.setItem(seedKey, '1');
    } catch {
      /* ignore */
    }
    const seeded = await fetchTestimonialsFromSupabase();
    if (seeded && seeded.length > 0) return seeded;
  }

  return DEFAULT_TESTIMONIALS;
}

// --- VISION / ABOUT IMAGES ---

export async function fetchVisionImagesFromSupabase(): Promise<VisionImages | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('vision_images')
      .select('image_primary, image_secondary')
      .eq('id', 'main')
      .maybeSingle();

    if (error) {
      console.warn('[DB] fetchVisionImages failed:', error.message);
      return null;
    }
    if (!data) return null;

    const primary = publicImageUrl(data.image_primary) || (
      typeof data.image_primary === 'string' && data.image_primary.startsWith('data:')
        ? data.image_primary
        : ''
    );
    const secondary = publicImageUrl(data.image_secondary) || (
      typeof data.image_secondary === 'string' && data.image_secondary.startsWith('data:')
        ? data.image_secondary
        : ''
    );

    if (!primary && !secondary) return null;

    return {
      imagePrimary: primary || DEFAULT_VISION_IMAGES.imagePrimary,
      imageSecondary: secondary || DEFAULT_VISION_IMAGES.imageSecondary,
    };
  } catch (err) {
    console.error('Unhandled error in fetchVisionImagesFromSupabase:', err);
    return null;
  }
}

export async function saveVisionImagesToSupabase(vision: VisionImages): Promise<VisionImages | null> {
  if (!supabase) return null;
  try {
    const imagePrimary = await resolveStoredImage(vision.imagePrimary, 'vision', 'primary');
    const imageSecondary = await resolveStoredImage(vision.imageSecondary, 'vision', 'secondary');
    const toSave: VisionImages = { imagePrimary, imageSecondary };

    const { error } = await supabase.from('vision_images').upsert(
      {
        id: 'main',
        image_primary: toSave.imagePrimary,
        image_secondary: toSave.imageSecondary,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.error('Error saving vision images:', error.message);
      throw error;
    }
    return toSave;
  } catch (err) {
    console.error('Unhandled error in saveVisionImagesToSupabase:', err);
    return null;
  }
}

export async function ensureDefaultVisionImages(): Promise<VisionImages> {
  const remote = await fetchVisionImagesFromSupabase();
  if (remote && (remote.imagePrimary || remote.imageSecondary)) return remote;

  if (supabase) {
    const saved = await saveVisionImagesToSupabase(DEFAULT_VISION_IMAGES);
    if (saved) return saved;
  }

  return DEFAULT_VISION_IMAGES;
}

