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

    async function sendMagicLink(email, redirectTo = window.location.href) {
      if (!email?.trim()) throw new Error('ایمیل را وارد کنید.');
      onStatus('در حال ارسال لینک ورود…', false);
      const { error } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo }
      });
      if (error) throw error;
      onStatus('لینک ورود به ایمیل شما ارسال شد. ایمیل را باز کنید و لینک را بزنید.', false);
    }

    async function signOut() {
      if (!client) return;
      const { error } = await client.auth.signOut();
      if (error) throw error;
    }

    return { verifyOwner, sendMagicLink, signOut, getClient: () => client };
  }

  return { init };
})();
