(function () {
  'use strict';
  const M=window.Meihua, KEY='xiaoliu.meihua.observations.v1', SCHEMA='xiaoliu.meihua-observations/v1';
  const $=id=>document.getElementById(id);
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const STATUSES=['待觀察','進行中','已結束'], MATCHES=['尚未對照','部分相符','大致相符','大致不符','資訊不足'];
  const METHOD_NAMES={time:'時間起卦',numbers:'數字起卦',random:'隨機起卦'};
  let historyRecordId=null;
  let method='time',current=null,currentResult=null,records=[],dirty=false,formDirty=false,toastTimer,storageBroken=false,rawBackup=null;
  const makeId=()=>window.crypto?.randomUUID?.()||'mh-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  const shorten=(s,n=100)=>s.length>n?s.slice(0,n)+'…':s;
  function notify(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4200);}
  function showError(message){$('form-error').textContent=message;$('form-error').hidden=!message;}
  function textField(raw,key,max){if(raw[key]!==undefined&&typeof raw[key]!=='string')throw new Error('紀錄的文字欄位格式不正確。');const s=raw[key]||'';if(s.length>max)throw new Error('紀錄內容超過長度限制。');return s;}
  function validateRecord(raw){
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('紀錄格式無效。');
    const r=M.calculate(raw.input);
    const input=r.method==='time'?{method:'time',date:r.source.date,time:r.source.time,rollover:r.source.rollover}:{method:r.method,numbers:r.source.numbers};
    if(typeof raw.id!=='string'||!raw.id.length||raw.id.length>100)throw new Error('紀錄識別碼無效。');
    if(!Number.isFinite(Date.parse(raw.createdAt))||!Number.isFinite(Date.parse(raw.updatedAt)))throw new Error('紀錄時間無效。');
    if(!STATUSES.includes(raw.status)||!MATCHES.includes(raw.match))throw new Error('紀錄的觀察狀態無效。');
    return {id:raw.id,input,question:textField(raw,'question',1000),context:textField(raw,'context',5000),expected:textField(raw,'expected',5000),actual:textField(raw,'actual',10000),status:raw.status,match:raw.match,createdAt:raw.createdAt,updatedAt:raw.updatedAt};
  }
  function parseRecords(text){const data=JSON.parse(text);if(data.schema!==SCHEMA||!Array.isArray(data.records))throw new Error('請選擇由「梅花觀象」匯出的 JSON 備份。');if(data.records.length>500)throw new Error('每份備份最多支援 500 筆紀錄。');const list=data.records.map(validateRecord);if(new Set(list.map(r=>r.id)).size!==list.length)throw new Error('備份含有重複的紀錄識別碼。');return list;}
  function loadRecords(){try{rawBackup=localStorage.getItem(KEY);if(rawBackup)records=parseRecords(rawBackup);}catch(e){storageBroken=true;notify('無法讀取瀏覽器紀錄，仍可起卦及複製。請先匯出備份。');}}
  function persist(next){if(storageBroken)throw new Error('目前無法儲存。請先匯出備份；也可用「複製給 AI」保留這次內容。');const encoded=JSON.stringify({schema:SCHEMA,version:M.VERSION,records:next});localStorage.setItem(KEY,encoded);records=next;rawBackup=encoded;updateCount();}
  function updateCount(){$('record-count').textContent=records.length;}
  function switchMethod(next){
    if(!Object.hasOwn(METHOD_NAMES,next))return;
    method=next;
    for(const name of Object.keys(METHOD_NAMES)){$('method-'+name).setAttribute('aria-pressed',String(next===name));$(name==='numbers'?'number-fields':name+'-fields').hidden=next!==name;}
    $('cast-date').required=next==='time';$('cast-time').required=next==='time';
    ['number-upper','number-lower','number-moving'].forEach(id=>{$(id).required=next==='numbers';$(id).disabled=next!=='numbers';});
    $('cast-label').textContent=next==='random'?'隨機起卦':'起卦';showError('');
  }
  function randomNumbers(){
    if(!window.crypto?.getRandomValues)throw new Error('此瀏覽器不支援隨機產生數字，請改用時間或數字起卦。');
    // 960 為 8、6 的公倍數；拒絕取樣讓每個數字及取卦餘數等機率。
    const limit=Math.floor(4294967296/960)*960,word=new Uint32Array(1);
    return Array.from({length:3},()=>{do{window.crypto.getRandomValues(word);}while(word[0]>=limit);return word[0]%960+1;});
  }
  function showRandomNumbers(numbers){
    $('random-preview').hidden=!numbers;
    $('random-preview').innerHTML=numbers?numbers.map((n,i)=>`<div><span>${['上卦數','下卦數','動爻數'][i]}</span><strong>${n}</strong></div>`).join(''):'';
  }
  function markFormChanged(){if(current){formDirty=true;const n=$('stale-note');if(n)n.hidden=false;}}
  function setNow(){const n=M.taipeiNow();$('cast-date').value=n.date;$('cast-time').value=n.time;updateLunar();}
  function updateLunar(){try{const l=M.lunarInfo($('cast-date').value,$('cast-time').value,$('rollover').value);$('lunar-preview').textContent=l.label+(l.shifted?'（子初，按次日計）':'');}catch(e){$('lunar-preview').textContent=e.message;}}
  function readInput(){if(method==='random')return {method:'random',numbers:randomNumbers()};return method==='time'?{method:'time',date:$('cast-date').value,time:$('cast-time').value,rollover:$('rollover').value}:{method:'numbers',numbers:[$('number-upper').value,$('number-lower').value,$('number-moving').value].map(Number)};}
  function canReplace(){return !dirty||confirm('這次紀錄有尚未儲存的內容。確定離開這筆紀錄嗎？');}
  function cast(){
    if(!canReplace())return false;
    try{const input=readInput(),result=M.calculate(input),now=new Date().toISOString();current={id:makeId(),input,question:$('question').value.trim(),context:$('context').value.trim(),expected:'',actual:'',status:'待觀察',match:'尚未對照',createdAt:now,updatedAt:now};currentResult=result;dirty=true;formDirty=false;historyRecordId=null;$('history-notes').innerHTML='';showRandomNumbers(input.method==='random'?input.numbers:null);showError('');switchView('cast');renderResult();return true;}catch(e){showError(e.message);return false;}
  }
  function hexCard(h,label,moving=0){
    const drawing=h.lines.map((v,i)=>({v,i})).reverse().map(({v,i})=>`<div class="yao ${i+1===moving?'moving':''}" aria-hidden="true">${v?'<span></span>':'<span></span><span></span>'}</div>`).join('');
    return `<article class="hex-panel"><p class="hex-kicker">${label} · ${String(h.id).padStart(2,'0')}</p><div class="hex-drawing" role="img" aria-label="${escape(h.fullName)}，由下至上：${h.lines.map((v,i)=>(v?'陽':'陰')+(i+1===moving?'爻動':'爻')).join('、')}">${drawing}</div><h4 class="hex-name">${escape(h.fullName)}</h4><p class="hex-theme">${escape(h.theme)}</p><p class="trigram-caption">上${h.upper.name}・${h.upper.element}　下${h.lower.name}・${h.lower.element}</p></article>`;
  }
  function lineTexts(r){
    const item=(h,line,label)=>`<article class="line-text"><p class="line-text-label">${label}</p><h4>${escape(h.fullName)} · ${line.label}</h4><blockquote>${escape(line.text)}</blockquote><a href="${escape(line.source)}" target="_blank" rel="noopener noreferrer">《周易・${escape(h.name)}》原文 ↗</a></article>`;
    return `<section class="line-texts" aria-label="動爻爻辭">${item(r.base,r.movingText,'本卦動爻爻辭')}${item(r.changed,r.changedText,'變卦同位爻辭 · 對照')}<p class="line-text-note">變卦爻辭對應陰陽變化後的同一爻位。</p></section>`;
  }
  function options(list,value){return list.map(x=>`<option value="${escape(x)}" ${value===x?'selected':''}>${escape(x)}</option>`).join('');}
  function renderResult(){
    if(!current)return;
    const r=currentResult,source=r.method==='time'?`${r.source.date} ${r.source.time} · 台灣時間<br>${escape(r.source.lunar.label)}`:`${METHOD_NAMES[r.method]} · ${r.source.numbers.join(' / ')}`;
    const saved=records.some(x=>x.id===current.id);
    $('result').innerHTML=`<div class="result-card"><div class="result-heading"><div><p class="eyebrow">${METHOD_NAMES[r.method]} · 觀察開始</p><h3>${escape(current.question||'未指定問題')}</h3><p class="meta">${source}</p></div><span class="badge">${escape(current.status)}</span></div><p id="stale-note" class="stale-note" ${formDirty?'':'hidden'}>左側輸入已變更。此處仍保留上次起卦，按「起卦」後才會更新。</p><div class="result-actions"><button type="button" class="primary" id="copy-result">複製給 AI 解盤</button><button type="button" class="secondary" id="save-result">${saved?'已儲存':'儲存紀錄'}</button>${saved?'<button type="button" class="secondary" id="open-observation">開啟觀察紀錄</button>':''}</div><div class="hex-grid">${hexCard(r.base,'本卦',r.moving)}${hexCard(r.mutual,'互卦')}${hexCard(r.changed,'變卦')}</div><p class="moving-note">${r.movingName}動 · 由下往上第 ${r.moving} 爻</p>${lineTexts(r)}<div class="body-use"><div class="unit"><span>體 · ${r.bodyPosition==='upper'?'上':'下'}卦</span>${r.body.name}${r.body.element}</div><div class="relation-name">${r.initialRelation.type}<small>${r.initialRelation.detail}</small></div><div class="unit"><span>用 · ${r.usePosition==='upper'?'上':'下'}卦</span>${r.use.name}${r.use.element}</div></div>${current.context?`<details class="original-context"><summary>起卦前的實際狀況</summary><p>${escape(current.context)}</p></details>`:''}<div class="result-bottom"><div class="insight"><h4 class="subhead">這次可以留意的線索</h4><p class="hint">依卦意與五行規則整理，與實際情況對照。</p><div class="observation-items"><div class="observation-item"><span class="step-number">01</span><div><strong>${r.base.name} · ${r.base.theme}</strong><p>${escape(r.base.question)}</p></div></div><div class="observation-item"><span class="step-number">02</span><div><strong>本卦體用 · ${r.initialRelation.type}</strong><p>${escape(r.initialRelation.meaning)}${escape(r.initialRelation.observe)}</p></div></div><div class="observation-item"><span class="step-number">03</span><div><strong>變用對體 · ${r.changedRelation.type}</strong><p>${r.changedUse.name}${r.changedUse.element}對${r.body.name}${r.body.element}：${escape(r.changedRelation.meaning)}${escape(r.changedRelation.observe)}</p></div></div></div></div><details class="calc"><summary>查看演算與完整體用</summary><dl>${r.calculation.map(c=>`<dt>${c.label}</dt><dd>${escape(c.text)}</dd>`).join('')}</dl><p class="field-help">體卦固定為本卦不動的一方。互卦上${r.mutual.upper.name}${r.mutual.upper.element}：${r.mutualRelations[0].type}；下${r.mutual.lower.name}${r.mutual.lower.element}：${r.mutualRelations[1].type}。<br>互卦取本卦第 2–4 爻與第 3–5 爻；純乾純坤亦同。</p>${r.method==='time'?`<p class="field-help">${r.source.rollover==='zi'?'子初 23:00':'午夜 00:00'}換日；閏月沿用原月數。${r.source.lunar.shifted?'本次已使用次日農曆。':''}</p>`:''}<a class="source-link" href="https://zh.wikisource.org/wiki/周易/${encodeURIComponent(r.base.name)}" target="_blank" rel="noopener noreferrer">閱讀「${r.base.name}」卦原典 ↗</a></details></div></div>`;
    $('copy-result').addEventListener('click',copyCurrent);
    $('save-result').addEventListener('click',saveCurrent);$('save-result').disabled=saved;
    $('open-observation')?.addEventListener('click',()=>openRecord(current.id));
  }
  function renderNotes(){
    if(!current||historyRecordId!==current.id||!records.some(x=>x.id===current.id)){$('history-notes').innerHTML='';return;}
    $('history-notes').innerHTML=`<section class="notes-card"><h3>把實際發展也留下來</h3><p>這筆卦象已儲存；有後續消息時，再回來補上實際發展。</p><label for="expected-notes">事前觀察重點</label><textarea id="expected-notes" rows="2" maxlength="5000" placeholder="例如：是否主動問交屋時間？是否提出具體下一步？">${escape(current.expected)}</textarea><label for="actual-notes">事後實際發展</label><textarea id="actual-notes" rows="3" maxlength="10000" placeholder="記下對方說了什麼、做了什麼，以及沒出現的情況。">${escape(current.actual)}</textarea><div class="note-grid"><div><label for="record-status">目前進度</label><select id="record-status">${options(STATUSES,current.status)}</select></div><div><label for="record-match">與觀察線索對照</label><select id="record-match">${options(MATCHES,current.match)}</select></div></div><div class="actions"><span class="save-hint" id="save-state">已載入紀錄；修改後請儲存。</span><button type="button" class="secondary" id="save-notes">更新觀察紀錄</button></div></section>`;
    $('save-notes').addEventListener('click',saveCurrent);
    [['expected-notes','expected'],['actual-notes','actual'],['record-status','status'],['record-match','match']].forEach(([id,key])=>$(id).addEventListener(id.includes('notes')?'input':'change',()=>{current[key]=$(id).value;dirty=true;$('save-state').textContent='有新內容，請記得儲存。';}));
  }
  function saveCurrent(){
    if(!current)return;
    try{const now=new Date().toISOString(),record=validateRecord({...current,updatedAt:now});let next=records.filter(x=>x.id!==record.id);if(next.length>=500)throw new Error('已達 500 筆紀錄，請先備份並整理舊紀錄。');next.unshift(record);persist(next);current=structuredClone(record);dirty=false;renderResult();if($('save-state'))$('save-state').textContent='已儲存在此瀏覽器。';renderHistory();notify(historyRecordId===record.id?'觀察紀錄已更新':'卦象已儲存，可到「觀察紀錄」開啟回填');}catch(e){notify(e.message||'儲存失敗，請先複製結果或匯出備份。');}
  }
  async function copyCurrent(){
    if(!current)return;
    const text=M.textReport(current);
    try{if(!navigator.clipboard?.writeText)throw new Error('clipboard unavailable');await navigator.clipboard.writeText(text);notify('已複製完整卦象，可以貼給 AI 解盤');}
    catch(e){$('copy-text').value=text;$('copy-dialog').showModal();$('copy-text').focus();$('copy-text').select();}
  }
  function switchView(view){
    const history=view==='history',detail=history&&historyRecordId===current?.id&&records.some(x=>x.id===historyRecordId);
    $('cast-view').hidden=history;$('history-view').hidden=!history;$('nav-cast').classList.toggle('active',!history);$('nav-history').classList.toggle('active',history);
    $('history-detail').hidden=!detail;$('history-list').hidden=detail;
    $(detail?'history-result-host':'cast-result-host').appendChild($('result'));
    if(history)renderHistory();
  }
  function openRecord(id){
    if(historyRecordId===id&&current?.id===id){switchView('history');return true;}
    if(!canReplace())return false;
    const record=records.find(x=>x.id===id);if(!record)return false;
    current=structuredClone(record);currentResult=M.calculate(record.input);historyRecordId=id;dirty=false;formDirty=false;
    $('question').value=record.question;$('context').value=record.context;switchMethod(record.input.method);
    if(record.input.method==='time'){$('cast-date').value=record.input.date;$('cast-time').value=record.input.time;$('rollover').value=record.input.rollover;updateLunar();}
    else if(record.input.method==='numbers'){['number-upper','number-lower','number-moving'].forEach((id,i)=>$(id).value=record.input.numbers[i]);}
    showRandomNumbers(record.input.method==='random'?record.input.numbers:null);
    switchView('history');renderResult();renderNotes();return true;
  }
  function closeRecord(){
    if(!canReplace())return;
    const stored=records.find(x=>x.id===current?.id);
    if(stored){current=structuredClone(stored);currentResult=M.calculate(stored.input);dirty=false;renderResult();}
    historyRecordId=null;$('history-notes').innerHTML='';switchView('history');
  }
  function renderHistory(){
    if(!records.length){$('history-list').innerHTML=`<div class="history-empty"><h3>還沒有觀察紀錄</h3><p>起卦後按「儲存紀錄」，就能日後回來對照。</p><button id="go-cast" type="button" class="primary">回到起卦</button></div>`;$('go-cast').addEventListener('click',()=>switchView('cast'));return;}
    $('history-list').innerHTML=records.slice().sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt)).map(record=>{const r=M.calculate(record.input);const when=r.method==='time'?`${r.source.date} ${r.source.time}`:`${METHOD_NAMES[r.method]} ${r.source.numbers.join(' / ')}`;return `<article class="history-item"><span class="history-glyph" aria-hidden="true">${r.base.symbol}</span><div class="history-info"><h3>${escape(shorten(record.question||'未指定問題'))}</h3><p class="meta">${escape(when)} · ${escape(record.status)} · ${escape(record.match)}</p><p class="summary">${r.base.fullName}　${r.movingName}動　之 ${r.changed.fullName}</p></div><div class="actions"><button type="button" class="secondary" data-open="${escape(record.id)}">開啟／回填</button><button type="button" class="text-button delete-record" data-delete="${escape(record.id)}">刪除</button></div></article>`;}).join('');
    $('history-list').querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openRecord(b.dataset.open)));
    $('history-list').querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.delete;if(!confirm('確定刪除這筆紀錄？若需要保留，請先匯出備份。'))return;try{persist(records.filter(x=>x.id!==id));if(current?.id===id){dirty=true;historyRecordId=null;$('history-notes').innerHTML='';renderResult();switchView('history');}renderHistory();notify('已刪除紀錄');}catch(e){notify(e.message);}}));
  }
  function download(text,filename){const url=URL.createObjectURL(new Blob([text],{type:'application/json;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
  function exportRecords(){if(storageBroken&&rawBackup){download(rawBackup,'Meihua-original-backup.json');notify('已匯出原始備份');return;}if(!records.length){notify('目前沒有已儲存的紀錄。');return;}download(JSON.stringify({schema:SCHEMA,version:M.VERSION,exportedAt:new Date().toISOString(),records},null,2),'Meihua-records-'+M.taipeiNow().date+'.json');notify('已匯出 '+records.length+' 筆紀錄');}
  async function importRecords(event){const file=event.target.files[0];if(!file)return;try{if(file.size>2*1024*1024)throw new Error('備份檔案請小於 2 MB。');const incoming=parseRecords(await file.text());const merged=new Map(records.map(r=>[r.id,r]));let count=0;for(const record of incoming){const prev=merged.get(record.id);if(!prev||Date.parse(record.updatedAt)>Date.parse(prev.updatedAt)){merged.set(record.id,record);count++;}}if(merged.size>500)throw new Error('合併後超過 500 筆，請先整理現有紀錄。');persist([...merged.values()]);renderHistory();notify(`已匯入或更新 ${count} 筆，較新的現有紀錄已保留`);}catch(e){notify(e.message||'匯入失敗，現有紀錄未變更。');}finally{event.target.value='';}}
  function about(){
    $('about-content').innerHTML=`<p><strong>時間起卦</strong><br>採農曆年支數、月數、日數相加取上卦，再加時辰數取下卦與動爻。八卦序為乾 1、兌 2、離 3、震 4、巽 5、坎 6、艮 7、坤 8；地支從子 1 至亥 12。整除時，八卦取 8、動爻取 6。</p><p>日期輸入為國曆，時間固定採台灣 UTC+8。農曆由瀏覽器的 Chinese Calendar 換算，年支依農曆年；預設午夜換日，也可選擇子初換日。閏月沿用原月數。本工具支援 1900–2100 年，不使用真太陽時校正。</p><p><strong>三數起卦</strong><br>第一數除以 8 取上卦，第二數除以 8 取下卦，第三數直接除以 6 取動爻。這是明確選定的三數法，不另加時辰，與「兩數之和取動爻」不同。</p><p><strong>隨機起卦</strong><br>系統每次產生三個 1–960 的整數，再依三數法起卦。實際數字會隨卦象保存、複製與匯出；開啟紀錄時使用原數字，不重新抽取。</p><p><strong>互卦、動爻與體用</strong><br>六爻自下往上編號。互卦取本卦第 2–4 爻為下互、第 3–5 爻為上互；純乾純坤亦同，不採「乾坤無互，互其變卦」的另一約定。含動爻的一方為用，不動的一方為體。變卦沿用本卦的體卦。</p><p><strong>動爻爻辭</strong><br>卦象下方列出本卦動爻及變卦同一爻位的《周易》原文；變卦同位爻提供對照，並非另一個動爻。內建六十四卦共 384 條爻辭，保留來源標點及「无」等異體字，離線也可閱讀。經文來源為維基文庫，各條均附原典連結。</p><p><strong>觀察線索</strong><br>畫面中的卦意為白話整理，體用文字依五行規則生成，沒有連接 AI。季節旺衰、具體問事脈絡與卦爻辭，可透過「複製給 AI 解盤」進一步綜合解讀。</p><p><strong>紀錄與備份</strong><br>起卦後先按「儲存紀錄」，再到「觀察紀錄」開啟該筆紀錄，填寫觀察重點、後續發展與對照結果。所有問事與回填內容只存在目前裝置的瀏覽器中。不同網址、瀏覽器或裝置不會自動共用；請用 JSON 匯出、匯入搬移。匯入同一筆紀錄時，保留更新時間較晚的一份。</p><p><strong>參考原典</strong></p><ul><li><a href="https://zh.wikisource.org/wiki/梅花易數/卷一" target="_blank" rel="noopener noreferrer">《梅花易數》卷一：卦數、起卦與互卦</a></li><li><a href="https://www.eee-learning.com/book/4085" target="_blank" rel="noopener noreferrer">《梅花易數》卷二：體用生剋</a></li><li><a href="https://zh.wikisource.org/wiki/周易" target="_blank" rel="noopener noreferrer">《周易》六十四卦原典</a></li><li><a href="https://www.hko.gov.hk/tc/gts/time/conversion.htm" target="_blank" rel="noopener noreferrer">香港天文台公農曆對照</a></li></ul><p class="meta">梅花觀象 v${M.VERSION} · 起卦、對照、保留不同的結果。</p>`;
    $('about-dialog').showModal();
  }
  $('cast-form').addEventListener('submit',e=>{e.preventDefault();if(cast()&&window.matchMedia('(max-width:760px)').matches)$('result').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});});
  $('method-time').addEventListener('click',()=>{switchMethod('time');markFormChanged();});$('method-numbers').addEventListener('click',()=>{switchMethod('numbers');markFormChanged();});$('method-random').addEventListener('click',()=>{switchMethod('random');markFormChanged();});
  $('use-now').addEventListener('click',()=>{setNow();markFormChanged();});
  ['cast-date','cast-time','rollover'].forEach(id=>$(id).addEventListener('change',()=>{updateLunar();markFormChanged();}));
  ['question','context','number-upper','number-lower','number-moving'].forEach(id=>$(id).addEventListener('input',markFormChanged));
  $('back-to-records').addEventListener('click',closeRecord);
  $('nav-cast').addEventListener('click',()=>switchView('cast'));$('nav-history').addEventListener('click',()=>switchView('history'));
  $('export-records').addEventListener('click',exportRecords);$('import-records').addEventListener('click',()=>$('import-file').click());$('import-file').addEventListener('change',importRecords);
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
  $('select-copy').addEventListener('click',()=>{$('copy-text').focus();$('copy-text').select();notify('已全選，請按 ⌘C／Ctrl+C 或長按複製');});
  $('show-about').addEventListener('click',about);
  let allowReload=false;
  window.addEventListener('meihua:before-reload',e=>{if(dirty&&!confirm('有尚未儲存的紀錄。確定放棄這次修改並更新嗎？')){e.preventDefault();return;}allowReload=true;});
  window.addEventListener('beforeunload',e=>{if(dirty&&!allowReload){e.preventDefault();e.returnValue='';}});
  window.addEventListener('storage',e=>{if(e.key===KEY){try{records=e.newValue?parseRecords(e.newValue):[];updateCount();if(!$('history-view').hidden)renderHistory();notify('另一個分頁已更新紀錄');}catch(_){notify('另一分頁的紀錄無法讀取，請先備份。');}}});
  loadRecords();updateCount();switchMethod('time');setNow();
  // Progressive enhancement: optional browser agent interface, same state as UI.
  const context=document.modelContext;
  if(context?.registerTool){
    const lifecycle=new AbortController();
    const register=tool=>{try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch(_){};};
    register({name:'read_meihua_result',title:'讀取目前梅花易數結果',description:'Read the current cast and unsaved observation notes. Does not cast, save, copy, or change any data.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input){if(input&&Object.keys(input).length)throw new Error('No parameters accepted.');if(!current)return {hasResult:false};return {hasResult:true,question:current.question,result:currentResult,expected:current.expected,actual:current.actual,report:M.textReport(current),saved:!dirty};}});
    register({name:'calculate_meihua_time',title:'以指定時間起卦',description:'Cast a new Meihua time reading and update the visible page. Does not save a record. Refuses to replace unsaved observation data.',inputSchema:{type:'object',properties:{date:{type:'string',description:'Gregorian YYYY-MM-DD'},time:{type:'string',description:'Taiwan time HH:mm'},question:{type:'string',maxLength:1000},rollover:{type:'string',enum:['midnight','zi']}},required:['date','time','question'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input){if(!input||typeof input.question!=='string'||input.question.length>1000||Object.keys(input).some(k=>!['date','time','question','rollover'].includes(k)))throw new Error('Invalid input.');if(dirty)throw new Error('Please save or finish the current reading first.');M.fromTime(input.date,input.time,input.rollover||'midnight');switchMethod('time');$('cast-date').value=input.date;$('cast-time').value=input.time;$('rollover').value=input.rollover||'midnight';$('question').value=input.question;$('context').value='';updateLunar();cast();switchView('cast');return {base:currentResult.base.fullName,moving:currentResult.movingName,mutual:currentResult.mutual.fullName,changed:currentResult.changed.fullName};}});
    window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  }
})();
