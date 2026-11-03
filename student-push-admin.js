(() => {
  const SUPABASE_URL = 'https://iqjujumhoawlugrmjvyj.supabase.co';
  const KEY = 'student_push_config';
  let mounted = false;
  const $ = id => document.getElementById(id);
  const note = (message, error = false) => {
    const el = $('stPushAdminStatus');
    if (el) { el.textContent = message || ''; el.style.color = error ? '#fb7185' : '#34d399'; }
  };
  const b64url = bytes => {
    let binary = '';
    new Uint8Array(bytes).forEach(v => binary += String.fromCharCode(v));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  };
  async function createVapidPair() {
    const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
    const publicRaw = await crypto.subtle.exportKey('raw', pair.publicKey);
    if (!jwk.d) throw new Error('ساخت کلید خصوصی اعلان ناموفق بود.');
    return { vapid_public_key: b64url(publicRaw), vapid_private_key: jwk.d };
  }
  async function loadConfig() {
    if (!(typeof gym20OwnerAuthorized !== 'undefined' && gym20OwnerAuthorized) || !(typeof gym20AdminClient !== 'undefined' ? gym20AdminClient : null)) return;
    try {
      const { data, error } = await (typeof gym20AdminClient !== 'undefined' ? gym20AdminClient : null).schema('gym20')
        .from('site_settings').select('value').eq('key', KEY).maybeSingle();
      if (error) throw error;
      const c = data?.value || {};
      $('stPushEnabled').checked = c.enabled !== false;
      $('stPushReminder1').value = String(c.reminder_1_hours ?? 6);
      $('stPushReminder2').value = String(c.reminder_2_hours ?? 2);
      $('stPushKeyStatus').textContent = (c.vapid_public_key && c.vapid_private_key) ? 'کلید امن اعلان آماده است.' : 'کلید امن هنگام اولین ذخیره ساخته یا تکمیل می‌شود.';
      note('تنظیمات اعلان دریافت شد.');
    } catch (e) { note(e.message || 'دریافت تنظیمات اعلان ناموفق بود.', true); }
  }
  async function saveConfig() {
    const button = $('stPushSave');
    if (!(typeof gym20OwnerAuthorized !== 'undefined' && gym20OwnerAuthorized) || !(typeof gym20AdminClient !== 'undefined' ? gym20AdminClient : null)) {
      note('برای ذخیره تنظیمات، ابتدا با حساب مدیر وارد شو.', true);
      return;
    }
    const first = Number($('stPushReminder1').value);
    const second = Number($('stPushReminder2').value);
    if (!Number.isInteger(first) || first < 0 || first > 168 || !Number.isInteger(second) || second < 0 || second > 168) {
      note('زمان یادآوری باید عددی بین صفر تا ۱۶۸ ساعت باشد.', true); return;
    }
    if (first > 0 && second > 0 && first === second) {
      note('زمان یادآوری اول و دوم نباید یکسان باشد.', true); return;
    }
    const old = button.textContent;
    button.disabled = true; button.textContent = 'در حال ذخیره…';
    try {
      const client = (typeof gym20AdminClient !== 'undefined' ? gym20AdminClient : null).schema('gym20');
      const { data: current, error: readError } = await client.from('site_settings')
        .select('value').eq('key', KEY).maybeSingle();
      if (readError) throw readError;
      const config = { ...(current?.value || {}), enabled: $('stPushEnabled').checked,
        reminder_1_hours: first, reminder_2_hours: second,
        subject: 'mailto:admin@gym20.ir', updated_at: new Date().toISOString() };
      if (!config.vapid_public_key || !config.vapid_private_key) {
        Object.assign(config, await createVapidPair());
      }
      const { data: authData, error: authError } = await (typeof gym20AdminClient !== 'undefined' ? gym20AdminClient : null).auth.getUser();
      if (authError) throw authError;
      const { error } = await client.from('site_settings').upsert({
        key: KEY, value: config, updated_at: new Date().toISOString(), updated_by: authData.user?.id || null
      }, { onConflict: 'key' });
      if (error) throw error;
      $('stPushKeyStatus').textContent = 'کلید امن اعلان آماده است.';
      note('تنظیمات ذخیره شد؛ یادآوری‌ها برای تمام جلسات منتشرشده اعمال می‌شوند.');
    } catch (e) { note(e.message || 'ذخیره تنظیمات ناموفق بود.', true); }
    finally { button.disabled = false; button.textContent = old; }
  }
  function mount() {
    const tab = $('studentTermsTab');
    if (!tab || mounted) return;
    mounted = true;
    const card = document.createElement('section');
    card.className = 'st-card';
    card.id = 'stPushAdminCard';
    card.innerHTML = '<div class="st-title">🔔 یادآوری کلاس روی گوشی هنرجو</div>' +
      '<div class="st-muted" style="margin-bottom:9px">این تنظیمات برای همه برنامه‌های منتشرشده اعمال می‌شود. هنرجو باید یک‌بار در لینک اختصاصی خودش اعلان را فعال کند.</div>' +
      '<label class="st-check" style="margin-bottom:9px"><input type="checkbox" id="stPushEnabled" checked><span>فعال بودن اعلان‌های یادآوری</span></label>' +
      '<div class="st-grid">' +
      '<div class="st-field"><label>یادآوری اول · چند ساعت قبل؟</label><input id="stPushReminder1" type="number" min="0" max="168" step="1" value="6"></div>' +
      '<div class="st-field"><label>یادآوری دوم · چند ساعت قبل؟</label><input id="stPushReminder2" type="number" min="0" max="168" step="1" value="2"></div>' +
      '</div><div class="st-muted" id="stPushKeyStatus" style="margin:3px 0 7px">کلید امن هنگام اولین ذخیره ساخته می‌شود.</div>' +
      '<div class="st-actions"><button type="button" class="st-btn primary" id="stPushSave">ذخیره تنظیمات اعلان</button></div>' +
      '<div id="stPushAdminStatus" class="st-muted" role="status" aria-live="polite" style="margin-top:7px"></div>';
    const anchor = tab.querySelector('#stMain');
    if (anchor) tab.insertBefore(card, anchor); else tab.appendChild(card);
    $('stPushSave').addEventListener('click', saveConfig);
    const watch = new MutationObserver(() => {
      if (tab.classList.contains('active') && (typeof gym20OwnerAuthorized !== 'undefined' && gym20OwnerAuthorized)) loadConfig();
    });
    watch.observe(tab, { attributes: true, attributeFilter: ['class'] });
    if (tab.classList.contains('active') && (typeof gym20OwnerAuthorized !== 'undefined' && gym20OwnerAuthorized)) loadConfig();
  }
  const observer = new MutationObserver(() => { if (!mounted) mount(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { mount(); observer.observe(document.body, { childList: true, subtree: true }); });
  else { mount(); observer.observe(document.body, { childList: true, subtree: true }); }
})();