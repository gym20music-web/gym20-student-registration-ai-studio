/* GYM20 Preview: one-tap anonymous admin session. Preview project only. */
window.GYM20AdminAuth = (() => {
  let client = null;

  function init({ url, publishableKey, onStatus = () => {}, onAuthorized = () => {} }) {
    if (!window.supabase?.createClient) throw new Error('Supabase JS v2 is not loaded.');
    if (!url || !publishableKey) throw new Error('Supabase URL and Publishable key are required.');
    client = window.supabase.createClient(url, publishableKey, {
      db: { schema: 'gym20' },
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });

    async function verifyOwner() {
      onStatus('در حال ورود سریع به محیط آزمایشی…', false);
      let { data: { session } } = await client.auth.getSession();
      if (!session) {
        const { data, error } = await client.auth.signInAnonymously();
        if (error) {
          if (/anonymous|disabled|not enabled/i.test(error.message || '')) {
            throw new Error('ورود یک‌کلیکی در تنظیمات Auth دیتابیس آزمایشی فعال نیست. باید Anonymous Sign-Ins فعال شود.');
          }
          throw error;
        }
        session = data.session;
      }
      if (!session?.user) throw new Error('نشست آزمایشی ساخته نشد؛ دوباره تلاش کن.');
      const { error: claimError } = await client.schema('gym20').rpc('claim_preview_owner');
      if (claimError) throw claimError;
      const { data: profile, error } = await client.schema('gym20')
        .from('profiles').select('role,is_active').eq('id', session.user.id).maybeSingle();
      if (error || !profile || profile.role !== 'owner' || profile.is_active !== true) {
        throw new Error(error?.message || 'دسترسی مدیر آزمایشی تأیید نشد.');
      }
      onAuthorized({ user: session.user, profile });
      onStatus('', false);
      return true;
    }

    async function signOut() {
      if (!client) return;
      const { error } = await client.auth.signOut();
      if (error) throw error;
    }

    return { verifyOwner, signOut, getClient: () => client };
  }

  return { init };
})();
