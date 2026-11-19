import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
  const { data: existing, error } = await gym.from("student_push_vapid").select("public_key,private_key,subject").eq("id", 1).maybeSingle();
  if (error) throw error;
  if (existing) return existing;
  const keys = webpush.generateVAPIDKeys();
  const row = { id: 1, public_key: keys.publicKey, private_key: keys.privateKey, subject: "mailto:admin@gym20.ir" };
  const { error: insertError } = await gym.from("student_push_vapid").insert(row);
  if (insertError && !/duplicate|unique/i.test(insertError.message || "")) throw insertError;
  const { data, error: readError } = await gym.from("student_push_vapid").select("public_key,private_key,subject").eq("id", 1).single();
  if (readError) throw readError;
  return data;
}
async function findStudent(code: string) {
  if (!/^[0-9a-f]{12}$/i.test(code || "")) return null;
  const { data, error } = await gym.from("student_public_links").select("student_id").eq("code", code).maybeSingle();
  if (error) throw error;
  return data?.student_id || null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (req.method === "GET") {
      const code = new URL(req.url).searchParams.get("code") || "";
      const studentId = await findStudent(code);
      if (!studentId) return reply({ ok: false, error: "لینک هنرجو معتبر نیست." }, 404);
      const { data: setting, error } = await gym.from("site_settings").select("value").eq("key", "student_push_config").maybeSingle();
      if (error) throw error;
      const config = setting?.value || {};
      if (config.enabled === false) return reply({ ok: true, enabled: false });
      const keys = await getVapid();
      return reply({ ok: true, enabled: true, public_key: keys.public_key });
    }
    if (req.method === "POST") {
      const body = await req.json();
      if (body?.action !== "subscribe") return reply({ ok: false, error: "درخواست نامعتبر است." }, 400);
      const studentId = await findStudent(String(body.code || ""));
      if (!studentId) return reply({ ok: false, error: "لینک هنرجو معتبر نیست." }, 404);
      const sub = body.subscription;
      if (!sub?.endpoint || !/^https:\/\//i.test(sub.endpoint) || !sub?.keys?.p256dh || !sub?.keys?.auth) {
        return reply({ ok: false, error: "اطلاعات اشتراک اعلان ناقص است." }, 400);
      }
      const { error } = await gym.from("student_push_subscriptions").upsert({
        student_id: studentId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh,
        auth: sub.keys.auth, user_agent: String(body.user_agent || "").slice(0, 500),
        is_active: true, updated_at: new Date().toISOString(), last_seen_at: new Date().toISOString()
      }, { onConflict: "endpoint" });
      if (error) throw error;
      return reply({ ok: true, message: "اعلان برای این دستگاه ثبت شد." });
    }
    return reply({ ok: false, error: "Method not allowed" }, 405);
  } catch (error) {
    console.error("student-push error", error);
    return reply({ ok: false, error: error instanceof Error ? error.message : "Push service error" }, 500);
  }
});