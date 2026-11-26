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
  const original=typeof notificationData.url==="string"&&notificationData.url.startsWith("https://gym20.ir/")?notificationData.url:"https://gym20.ir/";
  // Bypass the GitHub Pages /s/<code> 404 rewrite and open the student page directly.
  const targetUrl=new URL(original);
  const studentMatch=targetUrl.pathname.match(/^\/s\/([0-9a-f]{12})\/?$/i);
  if(studentMatch){
    targetUrl.pathname="/student.html";
    targetUrl.searchParams.set("c",studentMatch[1].toLowerCase());
  }
  event.waitUntil(clients.openWindow(targetUrl.href));
});