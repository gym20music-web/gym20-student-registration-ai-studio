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
  const { data, error } = await gym.from("student_push_vapid")
    .select("public_key,private_key,subject").eq("id", 1).single();
  if (error) throw error;
  return data;
}
async function findStudent(code: string) {
  if (!/^[0-9a-f]{12}$/i.test(code || "")) return null;
  const { data, error } = await gym.from("student_public_links")
    .select("student_id").eq("code", code.toLowerCase()).maybeSingle();
  if (error) throw error;
  return data?.student_id || null;
}
async function getOwner(req: Request) {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile, error: profileError } = await gym.from("profiles")
    .select("role,is_active").eq("id", data.user.id).maybeSingle();
  if (profileError) throw profileError;
  return profile?.role === "owner" && profile.is_active === true ? data.user : null;
}
function validSubscription(sub: any) {
  return !!sub?.endpoint && /^https:\/\//i.test(sub.endpoint) &&
    !!sub?.keys?.p256dh && !!sub?.keys?.auth;
}
async function sendExerciseCompletion(code: string, exerciseId: string) {
  const studentId = await findStudent(code);
  if (!studentId) return reply({ ok: false, error: "لینک هنرجو معتبر نیست." }, 404);
  const { data: exercise, error: exerciseError } = await gym.from("student_exercises")
    .select("id,title,is_completed,completed_at")
    .eq("id", exerciseId).eq("student_id", studentId).maybeSingle();
  if (exerciseError) throw exerciseError;
  if (!exercise || exercise.is_completed !== true || !exercise.completed_at) {
    return reply({ ok: false, error: "انجام تمرین در سامانه ثبت نشده است." }, 409);
  }
  const { data: student, error: studentError } = await gym.from("students")
    .select("full_name").eq("id", studentId).maybeSingle();
  if (studentError) throw studentError;
  const { data: owners, error: ownerError } = await gym.from("profiles")
    .select("id").eq("role", "owner").eq("is_active", true);
  if (ownerError) throw ownerError;
  const ownerIds = (owners || []).map((x: any) => x.id);
  if (!ownerIds.length) return reply({ ok: true, sent: 0, total: 0, reason: "no_active_owner" });
  const { data: subs, error: subError } = await gym.from("admin_push_subscriptions")
    .select("id,endpoint,p256dh,auth").in("owner_id", ownerIds).eq("is_active", true);
  if (subError) throw subError;
  if (!subs?.length) return reply({ ok: true, sent: 0, total: 0, reason: "no_admin_device" });

  const { error: claimError } = await gym.from("admin_exercise_push_deliveries")
    .insert({ exercise_id: exercise.id, completed_at: exercise.completed_at });
  if (claimError) {
    if (claimError.code === "23505" || /duplicate|unique/i.test(claimError.message || "")) {
      return reply({ ok: true, duplicate: true, sent: 0, total: subs.length });
    }
    throw claimError;
  }

  const vapid = await getVapid();
  webpush.setVapidDetails(vapid.subject || "mailto:admin@gym20.ir", vapid.public_key, vapid.private_key);
  const studentName = String(student?.full_name || "هنرجو").slice(0, 120);
  const exerciseTitle = String(exercise.title || "تمرین").slice(0, 120);
  const payload = JSON.stringify({
    title: "GYM20 | انجام تمرین",
    body: studentName + " تمرین «" + exerciseTitle + "» را انجام داد. 💪",
    tag: "gym20-exercise-" + exercise.id + "-" + new Date(exercise.completed_at).getTime(),
    url: "https://gym20.ir/"
  });
  let sent = 0, failed = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: 86400, urgency: "high" }
      );
      sent++;
    } catch (e) {
      failed++;
      const status = Number((e as { statusCode?: number })?.statusCode || 0);
      if (status === 404 || status === 410 || status === 403) {
        await gym.from("admin_push_subscriptions")
          .update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", sub.id);
      }
      console.error("admin exercise push failed", status, e);
    }
  }
  if (sent === 0) {
    await gym.from("admin_exercise_push_deliveries")
      .delete().eq("exercise_id", exercise.id).eq("completed_at", exercise.completed_at);
  }
  return reply({ ok: true, sent, failed, total: subs.length });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (req.method === "GET") {
      const code = new URL(req.url).searchParams.get("code") || "";
      const studentId = await findStudent(code);
      if (!studentId) return reply({ ok: false, error: "لینک هنرجو معتبر نیست." }, 404);
      const { data: setting, error } = await gym.from("site_settings")
        .select("value").eq("key", "student_push_config").maybeSingle();
      if (error) throw error;
      if (setting?.value?.enabled === false) return reply({ ok: true, enabled: false });
      const keys = await getVapid();
      return reply({ ok: true, enabled: true, public_key: keys.public_key });
    }
    if (req.method !== "POST") return reply({ ok: false, error: "Method not allowed" }, 405);
    const body = await req.json();
    const action = String(body?.action || "");

    if (action === "exercise-completed") {
      const exerciseId = String(body.exercise_id || "");
      if (!/^[0-9a-f-]{36}$/i.test(exerciseId)) return reply({ ok: false, error: "شناسه تمرین معتبر نیست." }, 400);
      return await sendExerciseCompletion(String(body.code || ""), exerciseId);
    }

    if (action === "admin-config" || action === "admin-status" || action === "admin-test" || action === "admin-subscribe" || action === "admin-unsubscribe") {
      const owner = await getOwner(req);
      if (!owner) return reply({ ok: false, error: "دسترسی مدیر تأیید نشد." }, 401);
      if (action === "admin-config") {
        const keys = await getVapid();
        return reply({ ok: true, public_key: keys.public_key });
      }
      if (action === "admin-status") {
        const endpoint = String(body.endpoint || "");
        const { data, error } = await gym.from("admin_push_subscriptions")
          .select("id").eq("owner_id", owner.id).eq("endpoint", endpoint).eq("is_active", true).maybeSingle();
        if (error) throw error;
        return reply({ ok: true, active: !!data });
      }
      if (action === "admin-test") {
        const endpoint = String(body.endpoint || "");
        const { data: sub, error } = await gym.from("admin_push_subscriptions")
          .select("id,endpoint,p256dh,auth").eq("owner_id", owner.id)
          .eq("endpoint", endpoint).eq("is_active", true).maybeSingle();
        if (error) throw error;
        if (!sub) return reply({ ok: true, sent: 0, total: 0 });
        const vapid = await getVapid();
        webpush.setVapidDetails(vapid.subject || "mailto:admin@gym20.ir", vapid.public_key, vapid.private_key);
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title: "GYM20 | اعلان فعال شد", body: "اعلان انجام تمرین روی این گوشی فعال است.", tag: "gym20-admin-test-" + crypto.randomUUID(), url: "https://gym20.ir/" }),
            { TTL: 3600, urgency: "normal" }
          );
          return reply({ ok: true, sent: 1, total: 1 });
        } catch (e) {
          const status = Number((e as { statusCode?: number })?.statusCode || 0);
          if (status === 404 || status === 410 || status === 403) {
            await gym.from("admin_push_subscriptions").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", sub.id);
          }
          throw e;
        }
      }
      if (action === "admin-subscribe") {
        const sub = body.subscription;
        if (!validSubscription(sub)) return reply({ ok: false, error: "اطلاعات اشتراک اعلان ناقص است." }, 400);
        const now = new Date().toISOString();
        const { error } = await gym.from("admin_push_subscriptions").upsert({
          owner_id: owner.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth,
          user_agent: String(body.user_agent || "").slice(0, 500), is_active: true,
          updated_at: now, last_seen_at: now
        }, { onConflict: "endpoint" });
        if (error) throw error;
        return reply({ ok: true, message: "اعلان مدیر برای این دستگاه فعال شد." });
      }
      const endpoint = String(body.endpoint || "");
      if (!/^https:\/\//i.test(endpoint)) return reply({ ok: false, error: "شناسه دستگاه معتبر نیست." }, 400);
      const { error } = await gym.from("admin_push_subscriptions")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("owner_id", owner.id).eq("endpoint", endpoint);
      if (error) throw error;
      return reply({ ok: true, message: "اعلان مدیر برای این دستگاه غیرفعال شد." });
    }

    if (action !== "subscribe") return reply({ ok: false, error: "درخواست نامعتبر است." }, 400);
    const studentId = await findStudent(String(body.code || ""));
    if (!studentId) return reply({ ok: false, error: "لینک هنرجو معتبر نیست." }, 404);
    const sub = body.subscription;
    if (!validSubscription(sub)) return reply({ ok: false, error: "اطلاعات اشتراک اعلان ناقص است." }, 400);
    const now = new Date().toISOString();
    const { error } = await gym.from("student_push_subscriptions").upsert({
      student_id: studentId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh,
      auth: sub.keys.auth, user_agent: String(body.user_agent || "").slice(0, 500),
      is_active: true, updated_at: now, last_seen_at: now
    }, { onConflict: "endpoint" });
    if (error) throw error;
    return reply({ ok: true, message: "اعلان برای این دستگاه ثبت شد." });
  } catch (error) {
    console.error("student-push error", error);
    return reply({ ok: false, error: error instanceof Error ? error.message : "Push service error" }, 500);
  }
});