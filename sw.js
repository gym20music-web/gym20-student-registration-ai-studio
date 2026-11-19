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
  if(typeof notificationData.body==="string"&&notificationData.body.trim())launchUrl.hash="gym20-notice="+encodeURIComponent(notificationData.body.trim());
  event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
    for(const client of list){if(client.url.startsWith("https://gym20.ir/")&&"focus" in client)return client.focus().then(()=>client.navigate?client.navigate(launchUrl.href):undefined);}
    return clients.openWindow(launchUrl.href);
  }));
});
