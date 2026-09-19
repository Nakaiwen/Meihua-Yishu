/* 梅花觀象：離線 app shell，僅快取明列的同來源靜態檔。 */
'use strict';
const VERSION='1.3.1-c6faa7ed9fa1';
const PREFIX='meihua-shell-'+encodeURIComponent(self.registration.scope)+'-';
const CACHE=PREFIX+VERSION;
const ASSETS=['./index.html','./style.css','./engine.js','./app.js','./pwa.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png','./icons/apple-touch-icon.png'].map(p=>new URL(p,self.registration.scope).href);
const SHELL=ASSETS[0];
const allowed=new Set(ASSETS);
async function verifiedFetch(url){
  const response=await fetch(new Request(url,{cache:'reload',credentials:'same-origin',redirect:'error'}));
  if(!response.ok||response.redirected||response.type==='opaque')throw new Error('Invalid static response');
  const type=response.headers.get('content-type')||'';
  if(url.endsWith('.js')&&!/(java|ecma)script/i.test(type))throw new Error('Expected JavaScript');
  if(url.endsWith('.css')&&!type.includes('text/css'))throw new Error('Expected stylesheet');
  if(url.endsWith('.webmanifest')&&!/json|manifest/i.test(type))throw new Error('Expected manifest');
  if(url.endsWith('.png')&&!type.includes('image/png'))throw new Error('Expected icon');
  if(url===SHELL){const html=await response.clone().text();if(!type.includes('text/html')||!html.includes('id="cast-form"')||!html.includes('id="pwa-bar"'))throw new Error('Expected Meihua app, not sign-in page');}
  return response;
}
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const responses=await Promise.all(ASSETS.map(verifiedFetch));
    const cache=await caches.open(CACHE);
    try{await Promise.all(ASSETS.map((url,i)=>cache.put(url,responses[i])));}catch(error){await caches.delete(CACHE);throw error;}
    // 不強制 skipWaiting：使用者確認更新後才切換，避免遺失未儲存內容。
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING'){event.waitUntil(self.skipWaiting());return;}
  if(event.data?.type==='CACHE_STATUS'&&event.ports[0])event.waitUntil((async()=>{const cache=await caches.open(CACHE);const entries=await Promise.all(ASSETS.map(url=>cache.match(url)));event.ports[0].postMessage({type:'CACHE_STATUS',version:VERSION,ready:entries.every(Boolean)});})());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url),scope=new URL(self.registration.scope);
  if(url.origin!==scope.origin)return;
  const canonical=url.origin+url.pathname;
  const navigation=request.mode==='navigate'&&(url.pathname===scope.pathname||canonical===SHELL);
  if(!navigation&&!allowed.has(canonical))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE),key=navigation?SHELL:canonical;
    const saved=await cache.match(key);if(saved)return saved;
    try{const response=await verifiedFetch(key);await cache.put(key,response.clone());return response;}
    catch(_){return navigation?new Response('<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>梅花觀象</title><body style="font:18px/1.8 sans-serif;padding:32px;background:#f5f0e7;color:#584532"><h1>請先連線開啟一次</h1><p>這台裝置的離線資料尚未準備完成，或已被瀏覽器清除。連線重新開啟，看到「已可離線使用」後即可離線起卦。</p><button onclick="location.reload()" style="font:inherit;padding:10px 20px">重新載入</button></body></html>',{status:503,headers:{'Content-Type':'text/html;charset=utf-8'}}):new Response('Offline asset unavailable',{status:503});}
  })());
});
