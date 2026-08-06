/**
 * سكريبت تشخيص وإنشاء حساب الأدمن
 * يتصل مباشرة بـ Supabase Auth API
 */

const SUPABASE_URL = 'https://osqngjtghzkfmseonexr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcW5nanRnaHprZm1zZW9uZXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMjE4NDAsImV4cCI6MjA5OTU5Nzg0MH0.nRLmUt769nMaRCzIcbG2m9ZWW7_DzPvmppZ0HgLOPF4';

const EMAIL = 'admin@almaali.com';
const PASSWORD = 'almaali@123';

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 تشخيص مشكلة تسجيل الدخول');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📡 URL:', SUPABASE_URL);
  console.log('📧 Email:', EMAIL);
  console.log('');

  // 1. محاولة تسجيل الدخول
  console.log('🔐 محاولة 1: signInWithPassword...');
  const signInRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  const signInData = await signInRes.json();

  if (signInRes.ok && signInData.access_token) {
    console.log('✅ تسجيل الدخول نجح! المشكلة ليست في Supabase.');
    console.log('   User ID:', signInData.user?.id);
    console.log('   Email confirmed:', signInData.user?.email_confirmed_at ? 'نعم ✅' : 'لا ❌');
    return;
  }

  console.log('❌ فشل تسجيل الدخول');
  console.log('   الخطأ:', signInData.error || signInData.error_description || JSON.stringify(signInData));
  console.log('');

  // 2. محاولة إنشاء حساب جديد
  console.log('📝 محاولة 2: إنشاء حساب جديد (signUp)...');
  const signUpRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  const signUpData = await signUpRes.json();

  if (signUpRes.ok && signUpData.id) {
    console.log('✅ تم إنشاء الحساب!');
    console.log('   User ID:', signUpData.id);
    const confirmed = signUpData.email_confirmed_at;
    if (confirmed) {
      console.log('   ✅ البريد مؤكد — يمكنك الدخول الآن');
    } else {
      console.log('   ⚠️  البريد غير مؤكد تلقائياً');
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🛠️  الحل: عطّل تأكيد البريد من Supabase:');
      console.log('   1. افتح: https://supabase.com/dashboard/project/osqngjtghzkfmseonexr/auth/providers');
      console.log('   2. اضغط Email');
      console.log('   3. عطّل "Confirm email" (اجعلها OFF)');
      console.log('   4. احفظ');
      console.log('   5. ثم اذهب إلى: https://supabase.com/dashboard/project/osqngjtghzkfmseonexr/auth/users');
      console.log('   6. اضغط على المستخدم admin@almaali.com');
      console.log('   7. اضغط "Confirm email" أو "Send confirmation"');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  } else if (signUpData.error === 'User already registered') {
    console.log('⚠️  الحساب موجود لكن كلمة المرور خاطئة أو البريد غير مؤكد');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🛠️  الحل:');
    console.log('   اذهب إلى: https://supabase.com/dashboard/project/osqngjtghzkfmseonexr/auth/users');
    console.log('   اضغط على المستخدم → "Send password reset" أو "Confirm user"');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } else {
    console.log('❌ خطأ في إنشاء الحساب:', JSON.stringify(signUpData));
  }
}

main().catch(err => console.error('❌ خطأ:', err.message));
