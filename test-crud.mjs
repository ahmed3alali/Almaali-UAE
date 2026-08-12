/**
 * Full dashboard CRUD smoke test against Supabase.
 * Usage:
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run test:crud
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

const URL = process.env.VITE_SUPABASE_URL || '';
const KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const EMAIL = process.env.ADMIN_EMAIL || '';
const PASSWORD = process.env.ADMIN_PASSWORD || '';
const BUCKET = 'almaali-images';

const results = [];
function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`);
}
function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.log(`❌ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Almaali dashboard CRUD test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!URL || !KEY) {
    fail('env', 'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
    process.exit(1);
  }
  if (!EMAIL || !PASSWORD) {
    fail(
      'admin credentials',
      'Set ADMIN_EMAIL and ADMIN_PASSWORD in .env (or export them), then re-run npm run test:crud'
    );
    console.log('\nNeeded from you:');
    console.log('  ADMIN_EMAIL=your-admin@email.com');
    console.log('  ADMIN_PASSWORD=your-password');
    process.exit(1);
  }

  const sb = createClient(URL, KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Auth
  const { data: auth, error: authErr } = await sb.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (authErr || !auth.session) {
    fail('admin login', authErr?.message || 'no session');
    process.exit(1);
  }
  pass('admin login', auth.user?.email || EMAIL);

  // Bucket — list/create often RLS-blocked; probe upload is the real signal
  const { data: buckets } = await sb.storage.listBuckets();
  let hasBucket = (buckets || []).some((b) => b.name === BUCKET);
  if (!hasBucket) {
    const { error } = await sb.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
    });
    if (error) {
      console.log(`⚠️  createBucket via API blocked (${error.message}) — probing upload…`);
    }
  }

  const stamp = Date.now();
  const probePath = `doctors/crud-probe-${stamp}.png`;
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
  let publicUrl = `https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400`;
  const probe = await sb.storage.from(BUCKET).upload(probePath, png, {
    contentType: 'image/png',
    upsert: true,
  });
  if (probe.error) {
    fail(
      'storage upload',
      `${probe.error.message} — create public bucket "${BUCKET}" in Supabase → Storage, then run supabase-storage-setup.sql`
    );
    hasBucket = false;
  } else {
    publicUrl = sb.storage.from(BUCKET).getPublicUrl(probePath).data.publicUrl;
    pass('storage upload', publicUrl.slice(0, 70));
    hasBucket = true;
    await sb.storage.from(BUCKET).remove([probePath]);
  }

  // Doctors CRUD
  const doctorId = `dr-crud-${stamp}`;
  const doctor = {
    id: doctorId,
    name: { ar: 'طبيب اختبار', en: 'CRUD Test Doctor' },
    role: { ar: 'اختصاص تجميلي', en: 'Cosmetic Specialist' },
    bio: {
      ar: 'سيرة ذاتية اختبارية طويلة بما يكفي لاجتياز التحقق.',
      en: 'A sufficiently long English biography used for CRUD testing.',
    },
    specialties: { ar: ['تجميل'], en: ['Cosmetic'] },
    education: { ar: 'جامعة الاختبار', en: 'Test University' },
    image: publicUrl,
  };

  let { error } = await sb.from('doctors').upsert(doctor, { onConflict: 'id' });
  if (error) fail('doctor CREATE', error.message);
  else pass('doctor CREATE', doctorId);

  ({ error } = await sb
    .from('doctors')
    .update({ role: { ar: 'محدّث', en: 'Updated Role' } })
    .eq('id', doctorId));
  if (error) fail('doctor UPDATE', error.message);
  else pass('doctor UPDATE');

  const { data: readDoc, error: readErr } = await sb
    .from('doctors')
    .select('id, role')
    .eq('id', doctorId)
    .maybeSingle();
  if (readErr || !readDoc) fail('doctor READ', readErr?.message || 'missing');
  else pass('doctor READ', readDoc.role?.en || '');

  ({ error } = await sb.from('doctors').delete().eq('id', doctorId));
  if (error) fail('doctor DELETE', error.message);
  else pass('doctor DELETE');

  // Gallery CRUD
  const galleryId = `g-crud-${stamp}`;
  ({ error } = await sb.from('gallery_items').upsert({
    id: galleryId,
    title: { ar: 'صورة اختبار', en: 'Test Image' },
    category: 'clinic',
    image: publicUrl,
    description: { ar: 'وصف', en: 'Desc' },
  }));
  if (error) fail('gallery CREATE', error.message);
  else pass('gallery CREATE');

  ({ error } = await sb.from('gallery_items').delete().eq('id', galleryId));
  if (error) fail('gallery DELETE', error.message);
  else pass('gallery DELETE');

  // Blog CRUD
  const blogId = `b-crud-${stamp}`;
  ({ error } = await sb.from('blog_posts').upsert({
    id: blogId,
    title: { ar: 'مقال اختبار', en: 'Test Post' },
    excerpt: { ar: 'نبذة اختبار', en: 'Test excerpt' },
    content: {
      ar: 'محتوى عربي طويل بما يكفي للاختبار والتحقق من الحفظ.',
      en: 'Long enough English content for CRUD testing of blog posts.',
    },
    date: { ar: 'اليوم', en: 'Today' },
    read_time: { ar: '٥ دقائق', en: '5 min' },
    category: { ar: 'عام', en: 'General' },
    image: publicUrl,
    author: { ar: 'المعالي', en: 'Al Maali' },
  }));
  if (error) fail('blog CREATE', error.message);
  else pass('blog CREATE');

  ({ error } = await sb.from('blog_posts').delete().eq('id', blogId));
  if (error) fail('blog DELETE', error.message);
  else pass('blog DELETE');

  await sb.auth.signOut();

  const failed = results.filter((r) => !r.ok);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Done. ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log('Failures:');
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
