self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(clients.claim()));

self.addEventListener("push",event=>{
  let data={};
  try{data=event.data?event.data.json():{};}catch(_){data={body:event.data?event.data.text():"یادآوری کلاس GYM20"};}
  const title=data.title||"یادآوری کلاس GYM20";
  const options={body:data.body||"زمان کلاس شما نزدیک است.",icon:"/favicon.svg",badge:"/favicon.svg",dir:"rtl",lang:"fa",tag:data.tag||"gym20-class-reminder",renotify:true,data:{url:data.url||"https://gym20.ir/"}};
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const target=event.notification.data&&event.notification.data.url;
  const url=typeof target==="string"&&target.startsWith("https://gym20.ir/")?target:"https://gym20.ir/";
  event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
    for(const client of list){if(client.url.startsWith("https://gym20.ir/")&&"focus" in client)return client.focus().then(()=>client.navigate?client.navigate(url):undefined);}
    return clients.openWindow(url);
  }));
});
