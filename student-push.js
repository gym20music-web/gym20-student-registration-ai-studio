(() => {
  const SUPABASE_URL = 'https://iqjujumhoawlugrmjvyj.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_L8uWywK_73syAaq_wvr72Q_WlvD-IcZ';
  const ENDPOINT = SUPABASE_URL + '/functions/v1/student-push';
  const code = (location.pathname.match(/\/s\/([0-9a-f]{12})\/?$/i) || [])[1] ||
    new URLSearchParams(location.search).get('c') || '';
  if (!/^[0-9a-f]{12}$/i.test(code)) return;
  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const b64ToBytes = value => {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
    const raw = atob(base64), out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  };
  const api = async (method, body) => {
    const response = await fetch(ENDPOINT, {
      method, headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || 'ارتباط با سرویس اعلان ناموفق بود.');
    return data;
  };
  function mountBox() {
    if (document.getElementById('studentPushCard')) return document.getElementById('studentPushCard');
    const card = document.createElement('section');
    card.id = 'studentPushCard';
    card.className = 'card';
    card.innerHTML = '<div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;color:#e8c46b;font-size:11px;font-weight:800">🔔 یادآوری کلاس روی گوشی</div>' +
      '<div style="font-size:9px;color:#9aa6b6;line-height:1.8;margin-bottom:7px">با فعال‌سازی اعلان، زمان کلاس‌ها را حتی وقتی این صفحه بسته است دریافت می‌کنی.</div>' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><button id="studentPushEnable" type="button" style="border:1px solid #c8a75b;border-radius:8px;background:linear-gradient(110deg,#a98235,#e0c16e);color:#17130a;padding:7px 11px;font:800 10px Vazirmatn,sans-serif">فعال‌سازی اعلان کلاس‌ها</button>' +
      '<button id="studentPushDisable" type="button" hidden style="border:1px solid #475569;border-radius:8px;background:#1b2431;color:#e2e8f0;padding:7px 10px;font:700 10px Vazirmatn,sans-serif">غیرفعال‌سازی</button></div>' +
      '<div id="studentPushStatus" role="status" aria-live="polite" style="font-size:9px;color:#9aa6b6;line-height:1.7;margin-top:6px"></div>';
    const header = document.querySelector('main header');
    if (header?.nextSibling) header.parentNode.insertBefore(card, header.nextSibling);
    else document.querySelector('main')?.appendChild(card);
    return card;
  }
  const status = (message, bad = false) => {
    const el = document.getElementById('studentPushStatus');
    if (el) { el.textContent = message || ''; el.style.color = bad ? '#fda4af' : '#9aa6b6'; }
  };
  const showState = active => {
    const on = document.getElementById('studentPushEnable'), off = document.getElementById('studentPushDisable');
    if (on) { on.hidden = active; on.textContent = Notification.permission === 'denied' ? 'راهنمای فعال‌سازی اعلان' : 'فعال‌سازی اعلان کلاس‌ها'; }
    if (off) off.hidden = !active;
  };
  let config = null, registration = null;
  async function registerWorker() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error('مرورگر این گوشی از اعلان وب پشتیبانی نمی‌کند.');
    registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return registration;
  }
  async function saveSubscription(subscription) {
    await api('POST', { action: 'subscribe', code, subscription: subscription.toJSON(), user_agent: navigator.userAgent });
  }
  async function refreshExisting() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return false;
    await registerWorker();
    const existing = await registration.pushManager.getSubscription();
    if (!existing) return false;
    await saveSubscription(existing);
    return true;
  }
  async function enable() {
    const btn = document.getElementById('studentPushEnable');
    if (Notification.permission === 'denied') {
      status('اعلان برای این سایت در تنظیمات مرورگر مسدود شده است؛ از تنظیمات سایت، اجازه Notifications را فعال کن.', true);
      return;
    }
    btn.disabled = true; btn.textContent = 'در حال فعال‌سازی…';
    try {
      if (!('Notification' in window)) throw new Error('این مرورگر از اعلان سیستم پشتیبانی نمی‌کند.');
      let permission = Notification.permission;
      if (permission !== 'granted') permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('اجازه نمایش اعلان داده نشد.');
      await registerWorker();
      if (!config?.publicKey) throw new Error('کلید عمومی اعلان هنوز توسط مدیر تنظیم نشده است.');
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, applicationServerKey: b64ToBytes(config.publicKey)
      });
      await saveSubscription(subscription);
      showState(true); status('اعلان‌های کلاس با موفقیت فعال شد. می‌توانی این صفحه را ببندی.');
    } catch (e) { status(e.message || 'فعال‌سازی اعلان ناموفق بود.', true); }
    finally { btn.disabled = false; btn.textContent = 'فعال‌سازی اعلان کلاس‌ها'; }
  }
  async function disable() {
    const btn = document.getElementById('studentPushDisable');
    btn.disabled = true;
    try {
      await registerWorker();
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await api('POST', { action: 'unsubscribe', code, endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      showState(false); status('اعلان‌های این گوشی غیرفعال شد.');
    } catch (e) { status(e.message || 'غیرفعال‌سازی اعلان ناموفق بود.', true); }
    finally { btn.disabled = false; }
  }
  async function init() {
    mountBox();
    document.getElementById('studentPushEnable').addEventListener('click', enable);
    document.getElementById('studentPushDisable').addEventListener('click', disable);
    try {
      config = await api('GET');
      if (!config.enabled) { document.getElementById('studentPushCard').hidden = true; return; }
      if (!('Notification' in window)) { status('مرورگر این دستگاه از اعلان پشتیبانی نمی‌کند.'); return; }
      if (Notification.permission === 'denied') status('اجازه اعلان در مرورگر مسدود است. از تنظیمات سایت آن را فعال کن.');
      else if (await refreshExisting()) { showState(true); status('اعلان‌های این گوشی فعال است.'); }
      else status('برای دریافت یادآوری، دکمه فعال‌سازی را بزن.');
    } catch (e) { status(e.message || 'سرویس اعلان در دسترس نیست.', true); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();