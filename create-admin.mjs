/**
 * تشخيص وإنشاء حساب الأدمن عبر Supabase Auth
 * Usage:
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run test:auth
 * Or place values in .env (never commit secrets).
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
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
const EMAIL = process.env.ADMIN_EMAIL || '';
const PASSWORD = process.env.ADMIN_PASSWORD || '';

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Almaali admin auth diagnostic');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !EMAIL || !PASSWORD) {
    console.log('❌ Missing required environment variables.');
    console.log('');
    console.log('Set these in .env (or export them) then re-run:');
    console.log('  VITE_SUPABASE_URL=https://xxxx.supabase.co');
    console.log('  VITE_SUPABASE_ANON_KEY=your_anon_key');
    console.log('  ADMIN_EMAIL=admin@yourdomain.com');
    console.log('  ADMIN_PASSWORD=a-strong-password');
    console.log('');
    console.log('Then: npm run test:auth');
    process.exit(1);
  }

  console.log('📡 URL:', SUPABASE_URL);
  console.log('📧 Email:', EMAIL);
  console.log('');

  console.log('🔐 Attempt 1: signInWithPassword...');
  const signInRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  const signInData = await signInRes.json();

  if (signInRes.ok && signInData.access_token) {
    console.log('✅ Login succeeded.');
    console.log('   User ID:', signInData.user?.id);
    console.log(
      '   Email confirmed:',
      signInData.user?.email_confirmed_at ? 'yes ✅' : 'no ❌'
    );
    return;
  }

  console.log('❌ Login failed');
  console.log(
    '   Error:',
    signInData.error || signInData.error_description || JSON.stringify(signInData)
  );
  console.log('');

  console.log('📝 Attempt 2: signUp...');
  const signUpRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  const signUpData = await signUpRes.json();

  if (signUpRes.ok && (signUpData.id || signUpData.user?.id)) {
    console.log('✅ Account created (or pending confirmation).');
    console.log('   User ID:', signUpData.id || signUpData.user?.id);
    if (!(signUpData.email_confirmed_at || signUpData.user?.email_confirmed_at)) {
      console.log('');
      console.log('⚠️  Email may be unconfirmed. In Supabase Dashboard:');
      console.log('   1. Authentication → Providers → Email → disable "Confirm email" (dev), OR');
      console.log('   2. Authentication → Users → confirm the admin user manually');
    }
    return;
  }

  if (
    signUpData.error === 'User already registered' ||
    signUpData.msg === 'User already registered' ||
    String(signUpData.error_description || '').includes('already')
  ) {
    console.log('⚠️  User already exists but login failed.');
    console.log('   Reset the password in Supabase Auth → Users, or confirm the email.');
    return;
  }

  console.log('❌ Sign-up failed:', JSON.stringify(signUpData));
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
