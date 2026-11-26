/*
 * GYM20 Supabase admin-auth helper (starter module).
 * This file intentionally contains no credentials.
 * Load after the Supabase JS v2 CDN, then call GYM20AdminAuth.init(...)
 * Use only the project's Publishable key in browser code. Never use service_role/Secret keys here.
 */
window.GYM20AdminAuth = (() => {
  let client = null;

  function init({ url, publishableKey, onStatus = () => {}, onAuthorized = () => {} }) {
    if (!window.supabase?.createClient) throw new Error('Supabase JS v2 is not loaded.');
    if (!url || !publishableKey) throw new Error('Supabase URL and Publishable key are required.');
    client = window.supabase.createClient(url, publishableKey, {
      db: { schema: 'gym20' },
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    async function verifyOwner() {
      const { data: { session }, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) return false;
      const { data: { user }, error: userError } = await client.auth.getUser(session.access_token);
      if (userError || !user) return false;
      const { data: profile, error } = await client
        .schema('gym20')
        .from('profiles')
        .select('role,is_active')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        onStatus('ورود انجام شد، اما بررسی نقش مدیر با خطا روبه‌رو شد: ' + error.message, true);
        return false;
      }
      if (!profile) {
        onStatus('ایمیل تأیید شد و نشست ورود برقرار است؛ حساب هنوز به‌عنوان مدیر فعال نشده است. پس از ثبت نقش مالک، صفحه را تازه‌سازی کنید.', false);
        return false;
      }
      if (profile.role !== 'owner' || profile.is_active !== true) {
        onStatus('این حساب هنوز دسترسی مدیر فعال ندارد.', true);
        return false;
      }
      onAuthorized({ user, profile });
      return true;
    }

    async function sendMagicLink(email, redirectTo = window.location.href) {
      if (!email?.trim()) throw new Error('ایمیل حساب مدیر را وارد کنید.');
      onStatus('در حال ارسال لینک ورود به ایمیل…', false);
      const { error } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo }
      });
      if (error) throw error;
      onStatus('درخواست ارسال شد. صندوق ورودی و پوشه هرزنامه را بررسی کنید و لینک را روی همین دستگاه باز کنید.', false);
    }

    async function signInWithPassword(email, password) {
      if (!email?.trim()) throw new Error('ایمیل حساب مدیر را وارد کنید.');
      if (!password) throw new Error('رمز عبور را وارد کنید.');
      onStatus('در حال بررسی اطلاعات ورود…', false);
      const { error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) throw error;
      onStatus('ورود انجام شد؛ در حال بررسی دسترسی مدیر…', false);
    }

    async function signOut() {
      if (!client) return;
      const { error } = await client.auth.signOut();
      if (error) throw error;
    }

    return { verifyOwner, sendMagicLink, signInWithPassword, signOut, getClient: () => client };
  }

  return { init };
})();
