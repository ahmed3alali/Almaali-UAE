/**
 * Migrate base64 doctor/gallery/blog images → Supabase Storage URLs.
 * Fetches ONE row at a time so we don't pull 5MB+ in a single request.
 *
 * Usage: npm run migrate:images
 * Requires .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, ADMIN_EMAIL, ADMIN_PASSWORD
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@almaali.com';
const PASSWORD = process.env.ADMIN_PASSWORD || '';
const BUCKET = 'almaali-images';

const TABLES = [
  { name: 'doctors', folder: 'doctors' },
  { name: 'gallery_items', folder: 'gallery' },
  { name: 'blog_posts', folder: 'blog' },
];

function dataUrlToBlob(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!match) throw new Error('Invalid data URL');
  const contentType = match[1] || 'image/jpeg';
  const buffer = Buffer.from(match[2], 'base64');
  return { buffer, contentType, ext: contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg' };
}

async function ensureBucket(supabase) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = (buckets || []).some((b) => b.name === BUCKET);
  if (exists) {
    console.log(`✅ Bucket "${BUCKET}" exists`);
    return;
  }
  console.log(`🪣 Creating public bucket "${BUCKET}"...`);
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  });
  if (error) {
    console.warn(`⚠️  Could not create bucket (may already exist / need service role): ${error.message}`);
  } else {
    console.log('✅ Bucket created');
  }
}

async function uploadBuffer(supabase, buffer, contentType, path) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    upsert: true,
    contentType,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🖼️  Migrate base64 images → Storage');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
    process.exit(1);
  }
  if (!PASSWORD) {
    console.error('❌ Set ADMIN_PASSWORD in .env (and ADMIN_EMAIL if needed)');
    console.error('   Storage uploads require an authenticated admin session.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`🔐 Signing in as ${EMAIL}...`);
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (authError || !auth.session) {
    console.error('❌ Admin login failed:', authError?.message || 'no session');
    process.exit(1);
  }
  console.log('✅ Authenticated\n');

  await ensureBucket(supabase);

  let migrated = 0;
  let failed = 0;
  let skipped = 0;

  for (const table of TABLES) {
    console.log(`\n—— ${table.name} ——`);
    // IDs only first (tiny)
    const { data: ids, error: idErr } = await supabase.from(table.name).select('id');
    if (idErr) {
      console.error(`❌ list failed: ${idErr.message}`);
      continue;
    }

    for (const { id } of ids || []) {
      const { data: row, error } = await supabase
        .from(table.name)
        .select('id, image')
        .eq('id', id)
        .single();

      if (error || !row) {
        console.error(`  ❌ ${id}: fetch failed — ${error?.message}`);
        failed++;
        continue;
      }

      const image = row.image;
      if (typeof image !== 'string' || !image.startsWith('data:')) {
        console.log(`  ⏭  ${id}: already URL / empty`);
        skipped++;
        continue;
      }

      const sizeKb = Math.round(image.length / 1024);
      console.log(`  🔄 ${id}: uploading base64 (${sizeKb} KB)...`);

      try {
        const { buffer, contentType, ext } = dataUrlToBlob(image);
        const path = `${table.folder}/${id}.${ext}`;
        const publicUrl = await uploadBuffer(supabase, buffer, contentType, path);

        const { error: updErr } = await supabase
          .from(table.name)
          .update({ image: publicUrl })
          .eq('id', id);

        if (updErr) throw updErr;

        console.log(`  ✅ ${id}: ${publicUrl.slice(0, 80)}...`);
        migrated++;
      } catch (err) {
        console.error(`  ❌ ${id}: ${err.message || err}`);
        failed++;
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Done. migrated=${migrated} skipped=${skipped} failed=${failed}`);
  console.log('Hard-refresh the site — doctors should show real Storage URLs.');
  await supabase.auth.signOut();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
