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
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError || !user) return false;
      const { data: profile, error } = await client
        .schema('gym20')
        .from('profiles')
        .select('role,is_active')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !profile || profile.role !== 'owner' || profile.is_active !== true) {
        await client.auth.signOut();
        onStatus('این حساب دسترسی مدیر فعال ندارد؛ تنظیمات جدول profiles و RLS را بررسی کنید.', true);
        return false;
      }
      onAuthorized({ user, profile });
      return true;
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

    async function signUpWithPassword(email, password) {
      if (!email?.trim()) throw new Error('ایمیل حساب آزمایشی را وارد کنید.');
      if (!password || password.length < 6) throw new Error('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      onStatus('در حال ساخت حساب آزمایشی…', false);
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: 'GYM20 Preview Owner' } }
      });
      if (error) throw error;
      onStatus(data.session
        ? 'حساب ساخته شد. کد دعوت یک‌بارمصرف را وارد کنید و ورود را بزنید.'
        : 'حساب ساخته شد. ایمیل تأیید را باز کنید؛ سپس با همان ایمیل و رمز، همراه کد دعوت وارد شوید.', false);
      return data;
    }

    async function signOut() {
      if (!client) return;
      const { error } = await client.auth.signOut();
      if (error) throw error;
    }

    return { verifyOwner, signInWithPassword, signUpWithPassword, signOut, getClient: () => client };
  }

  return { init };
})();
