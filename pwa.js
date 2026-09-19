(function () {
  'use strict';
  const bar=document.getElementById('pwa-bar');
  if(!bar)return;
  const status=document.getElementById('pwa-status'),install=document.getElementById('pwa-install'),update=document.getElementById('pwa-update'),dialog=document.getElementById('install-dialog'),tips=document.getElementById('install-tips');
  let installEvent=null,registration=null,offlineReady=false,reloading=false,updateRequested=false,statusTimer;
  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  function showStatus(text){status.textContent=text;}
  function renderStatus(){
    install.hidden=standalone();
    install.textContent=isIOS()?'加入主畫面':'安裝到手機';
    if(offlineReady)showStatus((standalone()?'主畫面模式 · ':'')+(navigator.onLine?'已可離線使用':'離線模式 · 可起卦與查看紀錄'));
    else if(!navigator.onLine)showStatus('目前離線 · 請先連線完成離線準備');
    else showStatus('正在準備離線使用…');
  }
  function installGuide(){
    if(location.protocol==='file:')tips.innerHTML='<p>這份檔案可以直接起卦。若要安裝到主畫面，請先用手機開啟已發布的 HTTPS 網址。</p><p>將 PWA 壓縮包的內容完整上傳 GitHub Pages，再開啟它提供的網址，即可安裝。</p>';
    else if(isIOS())tips.innerHTML='<ol><li>用 <strong>Safari</strong> 開啟這個網址。</li><li>點選工具列的<strong>分享</strong>按鈕。</li><li>選擇<strong>加入主畫面</strong>。若看到「以網頁 App 開啟」，請保持開啟。</li><li>按「加入」，再從主畫面開啟「梅花觀象」。</li></ol><p>第一次請保持連線，看到「已可離線使用」後，再離線使用。</p>';
    else tips.innerHTML='<ol><li>用手機的 <strong>Chrome</strong> 開啟這個網址。</li><li>點選右上角的<strong>⋮</strong>選單。</li><li>選擇<strong>安裝應用程式</strong>或<strong>新增至主畫面</strong>，依畫面完成安裝。</li></ol><p>電腦可使用網址列的安裝圖示。若瀏覽器未提供安裝選項，仍可直接使用網頁。</p><p>第一次請保持連線，看到「已可離線使用」後，再離線使用。</p>';
    dialog.showModal();
  }
  install.addEventListener('click',async()=>{
    if(!installEvent){installGuide();return;}
    const event=installEvent;installEvent=null;
    try{await event.prompt();const choice=await event.userChoice;if(choice.outcome==='accepted')showStatus('安裝已送出，完成後可從主畫面開啟');}catch(_){installGuide();}
  });
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installEvent=event;install.hidden=false;});
  window.addEventListener('appinstalled',()=>{installEvent=null;install.hidden=true;renderStatus();install.hidden=true;});
  function offerUpdate(){if(registration?.waiting){update.hidden=false;update.textContent='新版已備妥';}}
  update.addEventListener('click',()=>{
    if(!registration?.waiting)return;
    const event=new CustomEvent('meihua:before-reload',{cancelable:true});
    if(!window.dispatchEvent(event))return;
    updateRequested=true;update.disabled=true;update.textContent='正在更新…';
    registration.waiting.postMessage({type:'SKIP_WAITING'});
  });
  function checkOffline(worker){
    if(!worker||typeof MessageChannel==='undefined'){showStatus('網頁可使用 · 尚未確認離線準備');return;}
    const channel=new MessageChannel();
    clearTimeout(statusTimer);
    statusTimer=setTimeout(()=>{channel.port1.close();if(!offlineReady)showStatus('網頁可使用 · 離線準備尚未完成');},5000);
    channel.port1.onmessage=event=>{clearTimeout(statusTimer);channel.port1.close();offlineReady=event.data?.type==='CACHE_STATUS'&&event.data.ready===true;renderStatus();if(!offlineReady)showStatus('網頁可使用 · 請連線重新開啟以完成離線準備');};
    worker.postMessage({type:'CACHE_STATUS'},[channel.port2]);
  }
  if(location.protocol==='file:'){showStatus('本機檔案 · 手機安裝請開啟線上網址');return;}
  if(!window.isSecureContext||!('serviceWorker' in navigator)){showStatus('網頁可使用 · 此環境尚不支援離線安裝');return;}
  renderStatus();
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(updateRequested&&!reloading){reloading=true;location.reload();return;}
    checkOffline(navigator.serviceWorker.controller);
  });
  const registrationURL=new URL('./sw.js',location.href);
  navigator.serviceWorker.register(registrationURL.href,{scope:'./',updateViaCache:'none'}).then(reg=>{
    registration=reg;offerUpdate();
    reg.addEventListener('updatefound',()=>{const worker=reg.installing;if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)offerUpdate();if(worker.state==='redundant'&&!offlineReady)showStatus('網頁可使用 · 離線準備未完成，請稍後連線重試');});});
    if(reg.active)checkOffline(reg.active);
    navigator.serviceWorker.ready.then(ready=>checkOffline(ready.active)).catch(()=>{});
  }).catch(()=>showStatus('網頁可使用 · 目前無法啟用離線模式'));
  window.addEventListener('online',()=>{renderStatus();if(registration){checkOffline(registration.active);registration.update().catch(()=>{});}});
  window.addEventListener('offline',renderStatus);
})();
