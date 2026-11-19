import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const cors = {
  "Access-Control-Allow-Origin": "https://gym20.ir",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });
const secretMap = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
const serviceKey = secretMap.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const url = Deno.env.get("SUPABASE_URL") || "";
if (!url || !serviceKey) throw new Error("Supabase server credentials are not available.");
const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const gym = db.schema("gym20");

async function getVapid() {
  const { data, error } = await gym.from("student_push_vapid").select("public_key,private_key,subject").eq("id", 1).single();
  if (error) throw error;
  webpush.setVapidDetails(data.subject || "mailto:admin@gym20.ir", data.public_key, data.private_key);
  return data;
}
async function sendStudent(studentId: string, message: string, tag: string) {
  const { data: subs, error } = await gym.from("student_push_subscriptions").select("id,endpoint,p256dh,auth").eq("student_id", studentId).eq("is_active", true);
  if (error) throw error;
  const { data: studentLink, error: linkError } = await gym.from("student_public_links").select("code").eq("student_id", studentId).maybeSingle();
  if (linkError) throw linkError;
  const targetUrl = studentLink?.code ? "https://gym20.ir/s/" + studentLink.code : "https://gym20.ir/";
  let sent = 0, failed = 0;
  for (const sub of subs || []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: (message.replace(/\\s+/g, " ").trim().slice(0, 52) || "اطلاعیه کلاس GYM20"), body: message, tag, url: targetUrl }),
        { TTL: 3600, urgency: "normal" }
      );
      sent++;
    } catch (e) {
      failed++;
      const status = Number((e as { statusCode?: number })?.statusCode || 0);
      if (status === 404 || status === 410 || status === 403) await gym.from("student_push_subscriptions").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", sub.id);
      console.error("push delivery failed", status, e);
    }
  }
  return { sent, failed, total: (subs || []).length };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (req.method !== "POST") return reply({ ok: false, error: "Method not allowed" }, 405);
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return reply({ ok: false, error: "ورود مدیر لازم است." }, 401);
    const { data: authData, error: authError } = await db.auth.getUser(token);
    if (authError || !authData.user) return reply({ ok: false, error: "نشست مدیر معتبر نیست." }, 401);
    const { data: profile, error: profileError } = await gym.from("profiles").select("role,is_active").eq("id", authData.user.id).maybeSingle();
    if (profileError) throw profileError;
    if (profile?.role !== "owner" || profile.is_active !== true) return reply({ ok: false, error: "دسترسی مدیر تأیید نشد." }, 403);
    const body = await req.json();
    const action = String(body.action || "send");
    const studentId = String(body.student_id || "");
    if (!studentId) return reply({ ok: false, error: "هنرجو انتخاب نشده است." }, 400);
    if (action === "count") {
      const { count, error } = await gym.from("student_push_subscriptions").select("id", { count: "exact", head: true }).eq("student_id", studentId).eq("is_active", true);
      if (error) throw error;
      return reply({ ok: true, active_count: count || 0 });
    }
    const message = String(body.message || "").trim();
    if (!message || message.length > 1200) return reply({ ok: false, error: "متن اعلان معتبر نیست." }, 400);
    const { data: setting, error: settingError } = await gym.from("site_settings").select("value").eq("key", "student_push_config").maybeSingle();
    if (settingError) throw settingError;
    if (setting?.value?.enabled === false) return reply({ ok: false, error: "ارسال اعلان در تنظیمات مدیر خاموش است." }, 409);
    await getVapid();
    const result = await sendStudent(studentId, message, "gym20-manual-" + crypto.randomUUID());
    return reply({ ok: true, ...result });
  } catch (error) {
    console.error("student-push-admin error", error);
    return reply({ ok: false, error: error instanceof Error ? error.message : "Push admin error" }, 500);
  }
});