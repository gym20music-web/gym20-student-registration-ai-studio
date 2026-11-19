import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-gym20-cron-secret", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json; charset=utf-8" };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });
const secretMap = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
const serviceKey = secretMap.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const url = Deno.env.get("SUPABASE_URL") || "";
if (!url || !serviceKey) throw new Error("Supabase server credentials are not available.");
const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const gym = db.schema("gym20");

function fillTemplate(template: string, values: Record<string,string>) {
  return template.replace(/\{(student|relative|day|time)\}/g, (_, key) => values[key] || "");
}
function localDateTime(value: string) {
  const date = new Date(value);
  const day = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { timeZone: "Asia/Tehran", weekday: "long" }).format(date);
  const time = new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  return { day, time };
}
async function getVapid() {
  const { data, error } = await gym.from("student_push_vapid").select("public_key,private_key,subject").eq("id", 1).single();
  if (error) throw error;
  webpush.setVapidDetails(data.subject || "mailto:admin@gym20.ir", data.public_key, data.private_key);
}
async function sendOne(sub: any, message: string, tag: string, studentCode: string) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ title: "یادآوری کلاس GYM20", body: message, tag, url: studentCode ? "https://gym20.ir/s/" + studentCode : "https://gym20.ir/" }),
      { TTL: 3600, urgency: "normal" }
    );
    return true;
  } catch (e) {
    const status = Number((e as { statusCode?: number })?.statusCode || 0);
    if (status === 404 || status === 410) await gym.from("student_push_subscriptions").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", sub.id);
    console.error("scheduled push failed", status, e);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (req.method !== "POST") return reply({ ok: false, error: "Method not allowed" }, 405);
    const supplied = req.headers.get("x-gym20-cron-secret") || "";
    const { data: allowed, error: authError } = await gym.rpc("verify_student_push_cron_secret", { p_secret: supplied });
    if (authError) throw authError;
    if (allowed !== true) return reply({ ok: false, error: "Unauthorized scheduler request" }, 401);
    const { data: settingRow, error: settingError } = await gym.from("site_settings").select("value").eq("key", "student_push_config").maybeSingle();
    if (settingError) throw settingError;
    const config = settingRow?.value || {};
    if (config.enabled === false) return reply({ ok: true, disabled: true, processed: 0 });
    await getVapid();
    const now = Date.now();
    const reminders = [
      { kind: "first", hours: Number(config.reminder_1_hours ?? 6), template: String(config.reminder_1_template || "{student} عزیز، کلاس ما {relative}، {day} ساعت {time} برگزار می‌شود.") },
      { kind: "second", hours: Number(config.reminder_2_hours ?? 2), template: String(config.reminder_2_template || "{student} عزیز، کلاس شما {relative}، {day} ساعت {time} شروع می‌شود.") }
    ].filter(x => Number.isInteger(x.hours) && x.hours > 0 && x.hours <= 168);
    const { data: versions, error: versionError } = await gym.from("term_schedule_versions").select("id").eq("status", "published");
    if (versionError) throw versionError;
    const versionIds = (versions || []).map(x => x.id);
    if (!versionIds.length) return reply({ ok: true, processed: 0, sent: 0 });
    let processed = 0, sent = 0;
    for (const reminder of reminders) {
      const target = now + reminder.hours * 3600000;
      const from = new Date(target - 60000).toISOString();
      const to = new Date(target).toISOString();
      const { data: sessions, error: sessionError } = await gym.from("class_sessions")
        .select("id,term_id,starts_at,coach_name")
        .in("schedule_version_id", versionIds).gte("starts_at", from).lt("starts_at", to);
      if (sessionError) throw sessionError;
      for (const session of sessions || []) {
        if (!session.term_id) continue;
        const { data: links, error: linkError } = await gym.from("term_enrollments").select("enrollment_id").eq("term_id", session.term_id);
        if (linkError) throw linkError;
        const enrollmentIds = (links || []).map(x => x.enrollment_id);
        if (!enrollmentIds.length) continue;
        const { data: enrollments, error: enrollmentError } = await gym.from("enrollments").select("student_id").in("id", enrollmentIds);
        if (enrollmentError) throw enrollmentError;
        const studentIds = [...new Set((enrollments || []).map(x => x.student_id))];
        for (const studentId of studentIds) {
          const { data: existing, error: existingError } = await gym.from("student_push_deliveries").select("id").eq("student_id", studentId).eq("session_id", session.id).eq("reminder_kind", reminder.kind).maybeSingle();
          if (existingError) throw existingError;
          if (existing) continue;
          const { data: student, error: studentError } = await gym.from("students").select("full_name").eq("id", studentId).maybeSingle();
          if (studentError) throw studentError;
          const { data: studentLink, error: studentLinkError } = await gym.from("student_public_links").select("code").eq("student_id", studentId).maybeSingle();
          if (studentLinkError) throw studentLinkError;
          const { data: subs, error: subError } = await gym.from("student_push_subscriptions").select("id,endpoint,p256dh,auth").eq("student_id", studentId).eq("is_active", true);
          if (subError) throw subError;
          if (!subs?.length) continue;
          const { day, time } = localDateTime(session.starts_at);
          const relative = reminder.hours === 1 ? "یک ساعت دیگر" : reminder.hours.toLocaleString("fa-IR") + " ساعت دیگر";
          const message = fillTemplate(reminder.template, { student: student?.full_name || "هنرجو", relative, day, time });
          const tag = "gym20-" + session.id + "-" + reminder.kind;
          let studentSent = 0;
          for (const sub of subs) if (await sendOne(sub, message, tag, studentLink?.code || "")) studentSent++;
          if (studentSent > 0) {
            const { error: deliveryError } = await gym.from("student_push_deliveries").insert({ student_id: studentId, session_id: session.id, reminder_kind: reminder.kind });
            if (deliveryError && !/duplicate|unique/i.test(deliveryError.message || "")) throw deliveryError;
            sent += studentSent;
          }
          processed++;
        }
      }
    }
    return reply({ ok: true, processed, sent });
  } catch (error) {
    console.error("student-push-cron error", error);
    return reply({ ok: false, error: error instanceof Error ? error.message : "Scheduled push error" }, 500);
  }
});