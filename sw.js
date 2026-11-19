self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(clients.claim()));

self.addEventListener("push",event=>{
  let data={};
  try{data=event.data?event.data.json():{};}catch(_){data={body:event.data?event.data.text():"یادآوری کلاس GYM20"};}
  const title=data.title||"یادآوری کلاس GYM20";
  const options={body:data.body||"زمان کلاس شما نزدیک است.",icon:"/favicon.svg",badge:"/favicon.svg",dir:"rtl",lang:"fa",tag:data.tag||"gym20-class-reminder",renotify:true,data:{url:data.url||"https://gym20.ir/",body:data.body||"زمان کلاس شما نزدیک است."}};
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const notificationData=event.notification.data||{};
  const target=notificationData.url;
  const url=typeof target==="string"&&target.startsWith("https://gym20.ir/")?target:"https://gym20.ir/";
  const launchUrl=new URL(url);
  const notice=typeof notificationData.body==="string"?notificationData.body.trim().slice(0,1200):"";
  if(notice){
    // Query survives the /s/<code> -> student.html fallback on Android PWAs;
    // hash remains as a compatibility fallback for older student pages.
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
