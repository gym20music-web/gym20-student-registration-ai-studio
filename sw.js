self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(clients.claim()));

self.addEventListener("push",event=>{
  let data={};
  try{data=event.data?event.data.json():{};}catch(_){data={body:event.data?event.data.text():"یادآوری کلاس GYM20"};}
  const title="GYM20";
  const body=data.body||"امروز وقت قوی‌تر شدنه. آماده‌ای؟";
  const options={body,icon:"/favicon.svg",badge:"/favicon.svg",dir:"rtl",lang:"fa",tag:data.tag||"gym20-class-reminder",renotify:true,data:{url:data.url||"https://gym20.ir/",title,body}};
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const notificationData=event.notification.data||{};
  const body=typeof notificationData.body==="string"?notificationData.body.trim().slice(0,1200):"";
  const title="GYM20";
  const original=typeof notificationData.url==="string"&&notificationData.url.startsWith("https://gym20.ir/")?notificationData.url:"https://gym20.ir/";
  const launchUrl=new URL("https://gym20.ir/notification.html");
  if(body)launchUrl.searchParams.set("gym20_notice",body);
  launchUrl.searchParams.set("gym20_title",title);
  launchUrl.searchParams.set("return_to",original);
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