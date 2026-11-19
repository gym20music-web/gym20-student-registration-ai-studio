import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://gym20.ir",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}
function esc(value: unknown): string {
  return String(value ?? "—").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { ok: false, error: "Method not allowed" });

  const origin = req.headers.get("origin");
  if (origin && !["https://gym20.ir", "https://www.gym20.ir"].includes(origin)) {
    return json(403, { ok: false, error: "Origin not allowed" });
  }

  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatIds = (Deno.env.get("TELEGRAM_CHAT_IDS") || Deno.env.get("TELEGRAM_CHAT_ID") || "")
    .split(",").map(x => x.trim()).filter(Boolean);
  if (!token || !chatIds.length) {
    return json(503, {
      ok: false,
      error: "تنظیمات امن تلگرام در Supabase کامل نیست.",
      detail: "در Secrets پروژه، TELEGRAM_BOT_TOKEN و TELEGRAM_CHAT_ID (یا TELEGRAM_CHAT_IDS) را تنظیم کنید."
    });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(400, { ok: false, error: "Invalid JSON" }); }

  const test = body.isTest === true;
  if (!test && (!body.fullName || !body.phone)) {
    return json(400, { ok: false, error: "اطلاعات نام و شماره برای اعلان ثبت‌نام ناقص است." });
  }

  const message = test
    ? "🧪 <b>پیام آزمایشی GYM20</b>\nاتصال ربات تلگرام با موفقیت برقرار شد. 🌱"
    : [
        "🔔 <b>ثبت‌نام جدید GYM20</b>",
        "",
        "👤 <b>نام:</b> " + esc(body.fullName),
        "📱 <b>موبایل:</b> " + esc(body.phone),
        "🎂 <b>تاریخ تولد:</b> " + esc(body.birthDate || "ثبت نشده"),
        "📍 <b>منطقه:</b> " + esc(body.regionName || "ثبت نشده"),
        "🥋 <b>سبک‌ها:</b> " + esc(body.styles || "ثبت نشده"),
        "👥 <b>رده سنی:</b> " + esc(body.ageGroup || "—"),
        "🏷️ <b>نوع کلاس:</b> " + esc(body.classTypeName || "—"),
        "📅 <b>جلسات:</b> " + esc(body.sessions || "—"),
        "💳 <b>شهریه:</b> " + esc(body.price || "—"),
        "📝 <b>توضیحات:</b> " + esc(body.notes || "ندارد"),
      ].join("\n");

  const results = await Promise.all(chatIds.map(async chat_id => {
    const response = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text: message, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    const result = await response.json().catch(() => ({}));
    return { chat_id, ok: response.ok && result.ok === true, description: result.description || null };
  }));

  const failed = results.filter(x => !x.ok);
  if (failed.length) {
    return json(502, {
      ok: false,
      error: "ارسال پیام تلگرام برای یک یا چند مقصد ناموفق بود.",
      detail: failed.map(x => x.description || "خطای Telegram API").join("؛ "),
      sent: results.length - failed.length,
      total: results.length,
    });
  }
  return json(200, { ok: true, sent: results.length });
});