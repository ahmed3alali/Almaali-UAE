/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { BlogPost, GalleryItem, Doctor } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if configuration parameters are present
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Diagnostic log — shows in browser console
console.log('[Supabase] isConfigured:', isSupabaseConfigured, '| URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : '(empty)');

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

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Log full error details to browser console for debugging
    console.error('[Auth] Sign-in failed:', error.message, '| status:', error.status, '| code:', (error as any).code);
    console.error('[Auth] Full error:', JSON.stringify(error, null, 2));

    // If "Email not confirmed" — try to resend confirmation or hint user
    if (error.message?.toLowerCase().includes('email not confirmed')) {
      console.warn('[Auth] Email is not confirmed. Go to Supabase Dashboard → Authentication → Users and confirm the user manually.');
      return { success: false, error: 'email_not_confirmed' };
    }

    return { success: false, error: error.message };
  }

  console.log('[Auth] Admin signed in successfully. User:', data.user?.email);
  return { success: true };
}

/** Sign out the admin user. */
export async function signOutAdmin(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
  console.log('[Auth] Admin signed out');
}

/** Returns the current Supabase Auth session, or null if not signed in. */
export async function getAdminSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
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

export async function uploadBase64Image(base64DataUrl: string, folder: string, fileName: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    const res = await fetch(base64DataUrl);
    const blob = await res.blob();
    const ext = blob.type.split('/')[1] || 'png';
    const path = `${folder}/${fileName}.${ext}`;
    const file = new File([blob], `${fileName}.${ext}`, { type: blob.type });

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: true, contentType: blob.type });

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
  if (!supabase) { console.warn('[Supabase] fetchBlogPosts: client is null, skipping'); return null; }
  try {
    console.log('[Supabase] Fetching blog_posts...');
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, excerpt, date, read_time, category, image, author')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('[Supabase] Error fetching blogs:', error.message, error);
      return null;
    }
    console.log('[Supabase] blog_posts fetched:', data?.length ?? 0, 'rows');

    // Map DB underscore fields back to camelCase properties of BlogPost
    return (data || []).map(row => ({
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      content: { ar: '', en: '' }, // placeholder — loaded on demand
      date: row.date,
      readTime: row.read_time,
      category: row.category,
      image: row.image,
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

export async function saveBlogPostToSupabase(post: BlogPost): Promise<boolean> {
  if (!supabase) return false;
  try {
    const dbPayload = {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      date: post.date,
      read_time: post.readTime, // map camelCase to snake_case
      category: post.category,
      image: post.image,
      author: post.author
    };

    const { error } = await supabase
      .from('blog_posts')
      .upsert(dbPayload, { onConflict: 'id' });

    if (error) {
      console.error('Error saving blog to Supabase:', error.message);
      throw error;
    }
    return true;
  } catch (err) {
    console.error('Unhandled error in saveBlogPostToSupabase:', err);
    return false;
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
  if (!supabase) { console.warn('[Supabase] fetchGallery: client is null, skipping'); return null; }
  try {
    console.log('[Supabase] Fetching gallery_items...');
    const { data, error } = await supabase
      .from('gallery_items')
      .select('id, title, category, image, description')
      .order('created_at', { ascending: true })
      .limit(50);


    if (error) {
      console.error('[Supabase] Error fetching gallery_items:', error.message, error);
      return null;
    }
    console.log('[Supabase] gallery_items fetched:', data?.length ?? 0, 'rows');

    return (data || []).map(row => ({
      id: row.id,
      title: row.title,
      category: row.category,
      image: row.image,
      description: row.description
    }));
  } catch (err) {
    console.error('Unhandled error in fetchGalleryItemsFromSupabase:', err);
    return null;
  }
}

export async function saveGalleryItemToSupabase(item: GalleryItem): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('gallery_items')
      .upsert({
        id: item.id,
        title: item.title,
        category: item.category,
        image: item.image,
        description: item.description
      }, { onConflict: 'id' });

    if (error) {
      console.error('Error saving gallery item to Supabase:', error.message);
      throw error;
    }
    return true;
  } catch (err) {
    console.error('Unhandled error in saveGalleryItemToSupabase:', err);
    return false;
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

// --- TEAM/DOCTORS OPERATIONS ---

export async function fetchDoctorsFromSupabase(): Promise<Doctor[] | null> {
  if (!supabase) return null;
  try {

    const { data, error } = await supabase
      .from('doctors')
      .select('id, name, role, bio, specialties, education, image')
      .order('created_at', { ascending: true })
      .limit(20);

    console.log('[DB] fetchDoctors result:', { dataLen: data?.length, error: error?.message });

    if (error) {
      console.warn('Error fetching doctors from Supabase:', error.message);
      return null;
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      role: row.role,
      bio: row.bio,
      specialties: row.specialties,
      education: row.education,
      image: row.image
    }));
  } catch (err) {
    console.error('Unhandled error in fetchDoctorsFromSupabase:', err);
    return null;
  }
}

export async function saveDoctorToSupabase(doctor: Doctor): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('doctors')
      .upsert({
        id: doctor.id,
        name: doctor.name,
        role: doctor.role,
        bio: doctor.bio,
        specialties: doctor.specialties,
        education: doctor.education,
        image: doctor.image
      }, { onConflict: 'id' });

    if (error) {
      console.error('Error saving doctor to Supabase:', error.message);
      throw error;
    }
    return true;
  } catch (err) {
    console.error('Unhandled error in saveDoctorToSupabase:', err);
    return false;
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

  const log = (msg: string) => { result.details.push(msg); onProgress?.(msg); };

  // Find all base64 images across all tables
  const tables = [
    { name: 'blog_posts', idField: 'id', folder: 'blog' },
    { name: 'gallery_items', idField: 'id', folder: 'gallery' },
    { name: 'doctors', idField: 'id', folder: 'doctors' },
  ] as const;

  for (const table of tables) {
    const { data: rows, error } = await supabase
      .from(table.name)
      .select('id, image');
    if (error || !rows) { log(`❌ ${table.name}: ${error?.message}`); continue; }

    const base64Rows = rows.filter(r => r.image && typeof r.image === 'string' && r.image.startsWith('data:'));
    if (base64Rows.length === 0) { log(`✅ ${table.name}: no base64 images`); continue; }

    result.totalBase64 += base64Rows.length;
    log(`🔄 ${table.name}: ${base64Rows.length} base64 images found`);

    for (const row of base64Rows) {
      const url = await uploadBase64Image(row.image, table.folder, row.id);
      if (!url) {
        result.failed++;
        log(`  ❌ ${row.id}: upload failed`);
        continue;
      }
      const { error: updateErr } = await supabase
        .from(table.name)
        .update({ image: url })
        .eq('id', row.id);
      if (updateErr) {
        result.failed++;
        log(`  ❌ ${row.id}: DB update failed — ${updateErr.message}`);
      } else {
        result.migrated++;
        log(`  ✅ ${row.id}: migrated`);
      }
    }
  }

  return result;
}
