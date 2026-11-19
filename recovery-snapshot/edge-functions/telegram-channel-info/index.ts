import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set(["https://gym20.ir", "https://www.gym20.ir"]);
function cors(origin: string | null) {
  const accepted = origin && allowedOrigins.has(origin) ? origin : "https://gym20.ir";
  return {"Access-Control-Allow-Origin":accepted,"Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin","Content-Type":"application/json; charset=utf-8"};
}
function reply(status:number, body:Record<string,unknown>, origin:string|null) {
  return new Response(JSON.stringify(body),{status,headers:cors(origin)});
}
function normalizeChannel(value:unknown):string {
  let raw=String(value??"").trim();
  if(!raw) throw new Error("لینک یا آیدی کانال را وارد کنید.");
  if(/^https?:\/\//i.test(raw)) {
    const url=new URL(raw);
    if(!["t.me","www.t.me","telegram.me","www.telegram.me"].includes(url.hostname.toLowerCase())) throw new Error("فقط لینک t.me یا آیدی کانال تلگرام معتبر است.");
    raw=url.pathname.split("/").filter(Boolean)[0]??"";
    if(raw.startsWith("+")||raw==="joinchat") throw new Error("لینک دعوت خصوصی قابل استعلام نیست؛ آیدی عددی کانال یا لینک عمومی آن را وارد کنید.");
  }
  raw=raw.replace(/^@/,"").trim();
  if(/^-100\d{5,}$/.test(raw)) return raw;
  if(!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(raw)) throw new Error("فرمت آیدی کانال معتبر نیست. نمونه: @GYM20MUSIC");
  return "@"+raw;
}
function decodeHtml(value:string):string {
  return value.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/\s+/g," ").trim();
}
function metaContent(html:string, key:string):string {
  const tags=html.match(/<meta\b[^>]*>/gi)??[];
  for(const tag of tags) {
    const name=(tag.match(/(?:name|property)=["']([^"']+)["']/i)?.[1]??"").toLowerCase();
    if(name===key) return decodeHtml(tag.match(/content=["']([^"']*)["']/i)?.[1]??"");
  }
  return "";
}
async function publicChannelDescription(username:string):Promise<string> {
  if(!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(username)) return "";
  try {
    const response=await fetch("https://t.me/s/"+encodeURIComponent(username),{
      headers:{"User-Agent":"Mozilla/5.0 (compatible; GYM20ChannelInfo/1.0)","Accept":"text/html"},
      signal:AbortSignal.timeout(7000)
    });
    if(!response.ok) return "";
    const html=await response.text();
    const node=html.match(/<div[^>]*class=["'][^"']*tgme_page_description[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]??"";
    const fromNode=decodeHtml(node.replace(/<br\s*\/?>/gi,"\n").replace(/<[^>]+>/g," "));
    return fromNode||metaContent(html,"og:description")||metaContent(html,"description");
  } catch(error) {
    console.warn("Telegram public preview fallback unavailable:",error instanceof Error?error.message:String(error));
    return "";
  }
}
Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS") {
    if(origin&&!allowedOrigins.has(origin)) return new Response("Origin not allowed",{status:403,headers:cors(null)});
    return new Response("ok",{headers:cors(origin)});
  }
  if(req.method!=="POST") return reply(405,{ok:false,error:"Method not allowed"},origin);
  if(origin&&!allowedOrigins.has(origin)) return reply(403,{ok:false,error:"Origin not allowed"},null);
  try {
    const authorization=req.headers.get("authorization")??"";
    const token=authorization.replace(/^Bearer\s+/i,"").trim();
    if(!token||token===authorization) return reply(401,{ok:false,error:"نشست مدیر معتبر نیست؛ دوباره وارد شوید."},origin);
    const supabaseUrl=Deno.env.get("SUPABASE_URL")??"";
    let secretKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
    if(!secretKey) {
      const raw=Deno.env.get("SUPABASE_SECRET_KEYS");
      if(raw) {try{secretKey=JSON.parse(raw).default??"";}catch{/* handled below */}}
    }
    if(!supabaseUrl||!secretKey) {
      console.error("Missing Supabase server credentials for telegram-channel-info");
      return reply(503,{ok:false,error:"تنظیمات امن سرویس در Supabase کامل نیست."},origin);
    }
    const admin=createClient(supabaseUrl,secretKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:userData,error:authError}=await admin.auth.getUser(token);
    if(authError||!userData.user) return reply(401,{ok:false,error:"نشست مدیر منقضی یا نامعتبر است؛ دوباره وارد شوید."},origin);
    const {data:profile,error:profileError}=await admin.schema("gym20").from("profiles").select("role,is_active").eq("id",userData.user.id).maybeSingle();
    if(profileError) {console.error("Owner profile lookup failed:",profileError.message);return reply(500,{ok:false,error:"بررسی دسترسی مدیر ناموفق بود."},origin);}
    if(!profile||profile.role!=="owner"||profile.is_active!==true) return reply(403,{ok:false,error:"این حساب، مدیر فعال GYM20 نیست."},origin);
    let body:Record<string,unknown>;
    try{body=await req.json();}catch{return reply(400,{ok:false,error:"درخواست نامعتبر است."},origin);}
    let channelId:string;
    try{channelId=normalizeChannel(body.channel);}catch(error){return reply(400,{ok:false,error:error instanceof Error?error.message:"آیدی کانال نامعتبر است."},origin);}
    const botToken=Deno.env.get("TELEGRAM_BOT_TOKEN");
    if(!botToken) return reply(503,{ok:false,error:"توکن ربات تلگرام در Secretهای Supabase تنظیم نشده است."},origin);
    const telegramResponse=await fetch("https://api.telegram.org/bot"+botToken+"/getChat",{
      method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:channelId}),signal:AbortSignal.timeout(12000)
    });
    const telegram=await telegramResponse.json().catch(()=>({}));
    if(!telegramResponse.ok||telegram.ok!==true||!telegram.result) {
      const description=String(telegram.description??"Telegram API returned an error");
      console.warn("Telegram getChat failed:",telegram.error_code??telegramResponse.status,description);
      return reply(502,{ok:false,error:description.includes("chat not found")?"کانال پیدا نشد؛ آیدی را بررسی کنید و مطمئن شوید ربات به کانال دسترسی دارد.":"تلگرام اطلاعات کانال را برنگرداند: "+description},origin);
    }
    const chat=telegram.result;
    let description=String(chat.description??"").trim();
    let descriptionSource=description?"telegram_bot_api":"unavailable";
    if(!description) {
      const username=String(chat.username??(channelId.startsWith("@")?channelId.slice(1):"")).trim();
      const fallback=await publicChannelDescription(username);
      if(fallback){description=fallback;descriptionSource="telegram_public_preview";}
    }
    console.info("telegram-channel-info result:",JSON.stringify({type:chat.type,hasTitle:!!chat.title,hasDescription:!!description,descriptionSource}));
    return reply(200,{
      ok:true,
      chat:{id:chat.id,title:chat.title??"",username:chat.username??"",type:chat.type??"",description},
      description_source:descriptionSource,
      description_available:!!description,
      ...(description?{}:{notice:"تلگرام عنوان کانال را برگرداند، اما توضیحات عمومی کانال در دسترس نبود."})
    },origin);
  } catch(error) {
    console.error("telegram-channel-info failed:",error instanceof Error?error.message:String(error));
    return reply(502,{ok:false,error:"ارتباط با تلگرام برقرار نشد. چند لحظه بعد دوباره تلاش کنید."},origin);
  }
});