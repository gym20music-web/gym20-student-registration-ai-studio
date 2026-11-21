self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(clients.claim()));

self.addEventListener("push",event=>{
  let data={};
  try{data=event.data?event.data.json():{};}catch(_){data={body:event.data?event.data.text():"یادآوری کلاس GYM20"};}
  const title=data.title||"وقت تمرینه! 💪🔥";
  const options={body:data.body||"امروز وقت قوی‌تر شدنه. آماده‌ای؟",icon:"/favicon.svg",badge:"/favicon.svg",dir:"rtl",lang:"fa",tag:data.tag||"gym20-class-reminder",renotify:true,data:{url:data.url||"https://gym20.ir/",body:data.body||"امروز وقت قوی‌تر شدنه. آماده‌ای؟"}};
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const notificationData=event.notification.data||{};
  const target=notificationData.url;
  const url=typeof target==="string"&&target.startsWith("https://gym20.ir/")?target:"https://gym20.ir/";
  let launchUrl=new URL(url);
  const notice=typeof notificationData.body==="string"?notificationData.body.trim().slice(0,1200):"";
  if(notice){
    const studentTarget=/^\\/s\\/[0-9a-f]{12}\\/?$/i.test(launchUrl.pathname);
    if(!studentTarget && (launchUrl.pathname==="/" || launchUrl.pathname==="/index.html")){
      // Admin exercise-completion notices open a dedicated reader; the
      // homepage itself does not render the gym20_notice query parameter.
      launchUrl=new URL("/notification.html",self.location.origin);
      launchUrl.searchParams.set("return","/");
    }
    // Student pages render the message from this query; the dedicated reader
    // renders admin notices that otherwise land on the homepage.
    launchUrl.searchParams.set("gym20_notice",notice);
    launchUrl.hash="gym20-notice="+encodeURIComponent(notice);
  }
  event.waitUntil((async()=>{
    const list=await clients.matchAll({type:"window",includeUncontrolled:true});
    const existing=list.find(client=>client.url.startsWith("https://gym20.ir/"));
    if(existing){
      try{
        if(typeof existing.navigate==="function")await existing.navigate(launchUrl.href);
        await existing.focus();
        return;
      }catch(error){console.warn("GYM20 notification window navigation failed:",error);}
    }
    await clients.openWindow(launchUrl.href);
  })());
});
