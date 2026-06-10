/* ==================== ДАННЫЕ СХЕМЫ ====================
   Единый источник — mapdata.js. Игра берёт оттуда узлы, связи и уровни,
   чтобы карта и игра не расходились при правках схемы. */
const NODES = window.MAPDATA.NODES;
const LINKS = window.MAPDATA.LINKS.map(l=>[l.a[0], l.b[0], l.rtc?1:0]);
const LEVELS = window.MAPDATA.LEVELS;
const LAYERS = {
  client:{c:'#f4c95d',n:'Клиент'}, edge:{c:'#5ec8f2',n:'Соединения'}, core:{c:'#8b9bff',n:'Ядро'},
  store:{c:'#5ad19a',n:'Хранение'}, scale:{c:'#ff944d',n:'Масштаб'}, push:{c:'#cf91f5',n:'Пуши'}, rtc:{c:'#ff6f91',n:'RTC'},
};

/* ==================== ВКЛАДКИ + HASH-РОУТИНГ ==================== */
/* #home · #course · #course/6A · #course/ref/ws · #build · #cards · #map —
   F5 и кнопка «назад» возвращают на то же место, разделом можно поделиться ссылкой. */
let lastAppliedHash=null;
function setHash(h){ lastAppliedHash=h; if(location.hash!==h) location.hash=h; }
function hashForDoc(doc){ // doc = 'intro' | 'sec:6A' | 'ref:ws'
  if(!doc||doc==='intro') return '#course';
  return doc.startsWith('ref:') ? '#course/ref/'+encodeURIComponent(doc.slice(4))
                                : '#course/'+encodeURIComponent(doc.slice(4));
}
/* три раздела: Курс / Практика / Карта. Пять тренажёров живут внутри «Практики»;
   старые имена вкладок (build, cards…) и хэши (#cards) продолжают работать. */
const PRACTICE=['build','apidb','cards','estimate','interview'];
let practiceMode=localStorage.getItem('msg_practice')||'build';
function goTab(name,opts){
  if(PRACTICE.includes(name)){practiceMode=name;localStorage.setItem('msg_practice',name);name='practice';}
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x.dataset.view===name));
  document.querySelectorAll('.view').forEach(x=>x.classList.remove('on'));
  document.getElementById('view-'+name).classList.add('on');
  if(name==='home') renderDashboard();
  if(name==='course'){renderToc();if(!curDoc)openIntro({noHash:true});}
  if(name==='practice') showPractice();
  if(!(opts&&opts.noHash)) setHash(name==='course'?hashForDoc(curDoc):(name==='practice'?'#practice/'+practiceMode:'#'+name));
  window.scrollTo(0,0);
}
function showPractice(){
  document.querySelectorAll('#view-practice .pview').forEach(x=>x.classList.toggle('on',x.id==='view-'+practiceMode));
  document.querySelectorAll('.pseg').forEach(b=>b.classList.toggle('on',b.dataset.p===practiceMode));
  const onSeg=document.querySelector('.pseg.on'); // лента тренажёров скроллится на телефоне — активная вкладка должна быть видна
  if(onSeg)onSeg.scrollIntoView({block:'nearest',inline:'nearest'});
  if(practiceMode==='cards') renderCardsSide();
  if(practiceMode==='apidb') renderApiDb();
  if(practiceMode==='estimate') renderEstimate();
  if(practiceMode==='interview') renderInterview();
}
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>goTab(t.dataset.view));
document.querySelectorAll('.pseg').forEach(b=>b.onclick=()=>goTab(b.dataset.p));
document.getElementById('brandHome').onclick=()=>goTab('home');
function applyHash(){
  lastAppliedHash=location.hash;
  const h=location.hash.slice(1);
  const parts=h.split('/').map(decodeURIComponent);
  const tab=parts[0]||'home';
  if(tab==='course'){
    goTab('course',{noHash:true});
    if(parts[1]==='ref'&&parts[2]) openRef(parts[2],{noHash:true});
    else if(parts[1]) openSection(parts[1],{noHash:true});
    else openIntro({noHash:true}); // голый #course — вводная «что тебя ждёт»
  } else if(tab==='practice') goTab(PRACTICE.includes(parts[1])?parts[1]:practiceMode,{noHash:true});
  else if(PRACTICE.includes(tab)||['home','map'].includes(tab)) goTab(tab,{noHash:true});
  else goTab('home',{noHash:true});
}
window.addEventListener('hashchange',()=>{ if(location.hash!==lastAppliedHash) applyHash(); });

/* ==================== ИКОНКИ (линейные SVG, как в макете) ==================== */
const ICONS={
  chat:'<path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 21l2-5.6A8.5 8.5 0 1 1 21 11.5Z"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  dumbbell:'<path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  blocks:'<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
  cards:'<rect x="8" y="3" width="13" height="16" rx="2"/><path d="M16 21H5a2 2 0 0 1-2-2V8"/>',
  mic:'<rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v3.5"/>',
  arrow:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3 1.07-.4 2.5-1.5 2.5-4 2 1.5 4.5 4.46 4.5 8a5.5 5.5 0 1 1-11 0c0-1.5.5-3 1.5-4 0 2 1 3.5 1 5.5Z"/>',
  checkc:'<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 5-6"/>',
  rotate:'<path d="M3 2v6h6"/><path d="M3.51 9a9 9 0 1 0 2.13-3.36L3 8"/>',
  bulb:'<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
  play:'<path d="m7 4 13 8-13 8Z"/>',
  pause:'<path d="M8 4v16M16 4v16"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 8 5-5 5 5"/><path d="M12 3v12"/>',
  send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  braces:'<path d="M8 3H7.5A2.5 2.5 0 0 0 5 5.5V9a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3.5A2.5 2.5 0 0 0 7.5 19H8"/><path d="M16 3h.5A2.5 2.5 0 0 1 19 5.5V9a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3.5a2.5 2.5 0 0 1-2.5 2.5H16"/>',
  calc:'<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M9 7h6"/><path d="M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01"/>',
};
function icon(name,size=16){return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;">${ICONS[name]||''}</svg>`;}
function initStaticIcons(){
  document.getElementById('btnHint').innerHTML=icon('bulb',17);
  document.getElementById('btnReset').innerHTML=icon('rotate',15);
  document.getElementById('mReset').innerHTML=icon('rotate',15);
}

/* ==================== ТЕМА ==================== */
const themeBtn=document.getElementById('themeBtn');
function syncThemeBtn(){themeBtn.innerHTML=icon(document.documentElement.dataset.theme==='dark'?'sun':'moon',17);}
themeBtn.onclick=()=>{
  const t=document.documentElement.dataset.theme==='dark'?'light':'dark';
  document.documentElement.dataset.theme=t;localStorage.setItem('msg_theme',t);syncThemeBtn();
};
syncThemeBtn();

/* ==================== ПРАЗДНОВАНИЯ ==================== */
function celebrate(){
  const colors=['#2f6bff','#5b63e6','#16a06a','#e0701c','#9b46e8','#e6397a','#f4c95d'];
  for(let i=0;i<70;i++){
    const c=document.createElement('i');c.className='confetti';
    c.style.left=(6+Math.random()*88)+'vw';
    c.style.background=colors[i%colors.length];
    c.style.animationDelay=(Math.random()*.3)+'s';
    c.style.animationDuration=(1+Math.random()*.9)+'s';
    c.style.setProperty('--dx',(Math.random()*140-70)+'px');
    document.body.appendChild(c);setTimeout(()=>c.remove(),2400);
  }
}
let toastTimer=null;
function showToast(msg){
  let t=document.getElementById('toast');
  if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t);}
  t.textContent=msg;t.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2800);
}

/* ==================== ИГРА «СОБЕРИ СХЕМУ» ==================== */
const SVGNS='http://www.w3.org/2000/svg';
const svg=document.getElementById('boardSvg');
const BSTORE='msg_build_v1', BLVL='msg_build_lvl';
let curLevel=0, levelNodes=[], reqLinks=[], placed={}, phase='place', paletteOrder=[];
let pickChip=null, pickNode=null, doneLinks=new Set(), missCount=0, hintTimer=null, drag=null;
let buildMode=localStorage.getItem('msg_build_mode')||'easy', hintsUsed=0, levelStart=0;
let recallChips=[], recallPick=new Set(), recallChecked=false;
function fmtDur(ms){const s=Math.max(1,Math.round(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}

function bestStore(){try{return JSON.parse(localStorage.getItem(BSTORE))||{}}catch(e){return {}}}
function saveBest(o){localStorage.setItem(BSTORE,JSON.stringify(o));}
(function(){const v=parseInt(localStorage.getItem(BLVL));if(v>=0&&v<LEVELS.length)curLevel=v;})();

function levelSet(idx){let s=[];for(let i=0;i<=idx;i++)s=s.concat(LEVELS[i].add);return s;}
function el(tag,attrs){const e=document.createElementNS(SVGNS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);return e;}
function center(id){const n=NODES[id];return [n.x+n.w/2,n.y+n.h/2];}

function renderLevels(){
  const best=bestStore();
  const sel=document.getElementById('lvlSelect');
  sel.innerHTML=LEVELS.map((lv,i)=>{
    const b=best[lv.id], done=b&&b.complete;
    const mark=done?(b.hardClean?'★ ':(b.clean?'✦ ':'✓ ')):'';
    return `<option value="${i}"${i===curLevel?' selected':''}>${mark}${lv.name}</option>`;
  }).join('');
  document.getElementById('lvlDesc').textContent=LEVELS[curLevel].desc;
  document.getElementById('lvlPrev').disabled=curLevel===0;
  document.getElementById('lvlNext').disabled=curLevel===LEVELS.length-1;
}
document.getElementById('lvlSelect').onchange=e=>{curLevel=+e.target.value;startLevel();};
document.getElementById('lvlPrev').onclick=()=>{if(curLevel>0){curLevel--;startLevel();}};
document.getElementById('lvlNext').onclick=()=>{if(curLevel<LEVELS.length-1){curLevel++;startLevel();}};
const modeSel=document.getElementById('modeSelect');
modeSel.value=buildMode;
modeSel.onchange=()=>{buildMode=modeSel.value;localStorage.setItem('msg_build_mode',buildMode);startLevel(true);};

function startLevel(fresh){
  levelNodes=levelSet(curLevel);
  const includeRtc=curLevel>=LEVELS.findIndex(l=>l.id==='rtc');
  const setHas=id=>levelNodes.includes(id);
  reqLinks=LINKS.filter(l=>setHas(l[0])&&setHas(l[1])&&(!l[2]||includeRtc));
  localStorage.setItem(BLVL,curLevel);
  const done=bestStore()[LEVELS[curLevel].id];
  if(done&&done.complete&&!fresh){ renderSolved(done); return; }
  placed={}; pickChip=null; pickNode=null; doneLinks=new Set(); missCount=0;
  hintsUsed=0; levelStart=Date.now();
  // фаза 0 «вспомни состав» имеет смысл, только если есть компоненты-обманки вне уровня
  const hasDistractors=Object.keys(NODES).some(id=>!levelNodes.includes(id));
  phase=(buildMode==='hard'&&hasDistractors)?'recall':'place';
  recallChips=(phase==='recall')?shuffle(Object.keys(NODES)):[];
  recallPick=new Set(); recallChecked=false;
  paletteOrder=shuffle(levelNodes.slice());
  document.getElementById('doneBanner').classList.remove('show');
  document.getElementById('btnToLinks').style.display='none';
  renderLevels(); renderBoard(); renderPalette(); updateScore();
  setPhaseTag();
  renderLegend();
}
function setPhaseTag(){
  const tag=document.getElementById('phaseTag'),tt=document.getElementById('paletteTitle');
  if(phase==='recall'){tag.innerHTML='<span class="fnum">Фаза 0</span> · Вспомни состав';tt.textContent='Назови компоненты по памяти';}
  else if(phase==='place'){tag.innerHTML='<span class="fnum">Фаза 1</span> · Расставь блоки';tt.textContent='Блоки — перетащи на доску';}
  else{tag.innerHTML='<span class="fnum">Фаза 2</span> · Восстанови связи';tt.textContent='Связи';}
}
function renderSolved(best){
  placed={}; levelNodes.forEach(id=>placed[id]=true);
  phase='link'; doneLinks=new Set(reqLinks.map(l=>linkKey(l[0],l[1]))); missCount=0;
  document.getElementById('btnToLinks').style.display='none';
  renderLevels(); renderBoard();
  reqLinks.forEach(l=>drawLink(l[0],l[1],'done'));
  updateScore(); renderLegend();
  document.getElementById('phaseTag').innerHTML='<span class="fnum">✓ Собрано</span> · уровень пройден';
  document.getElementById('paletteTitle').textContent='Готово';
  levelDoneActions(`Уровень уже собран ✓ Лучший результат — ошибок: ${best.miss}${best.time?` · время ${fmtDur(best.time)}`:''}${best.clean?' · ✦':''}.`);
  const bn=document.getElementById('doneBanner');
  bn.textContent=`✓ Уровень «${LEVELS[curLevel].name}» пройден. Можешь пройти заново или взять следующий уровень.`;
  bn.classList.add('show');
}
function levelDoneActions(note){
  const box=document.getElementById('paletteBox');
  if(IV.active){ // уровень собран внутри прогона интервью — возвращаемся к вопросам
    box.innerHTML=(note?`<div class="empty">${note}</div>`:'')
      +`<button class="primary w100" id="btnIvBack">Вернуться к прогону →</button>`;
    document.getElementById('btnIvBack').onclick=ivBuildDone;
    return;
  }
  const hasNext=curLevel<LEVELS.length-1;
  box.innerHTML=(note?`<div class="empty">${note}</div>`:'')
    +(hasNext?`<button class="primary w100" id="btnNextLvl">Следующий уровень →</button>`:`<div class="empty">Это полная схема — собрано! 🎉</div>`)
    +`<button class="ghost w100 mt8" id="btnRedo">Пройти заново</button>`;
  if(hasNext)document.getElementById('btnNextLvl').onclick=()=>{curLevel++;startLevel();};
  document.getElementById('btnRedo').onclick=()=>startLevel(true);
}

function viewBox(){
  let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  levelNodes.forEach(id=>{const n=NODES[id];minX=Math.min(minX,n.x);minY=Math.min(minY,n.y);maxX=Math.max(maxX,n.x+n.w);maxY=Math.max(maxY,n.y+n.h);});
  const p=34;return `${minX-p} ${minY-p} ${maxX-minX+2*p} ${maxY-minY+2*p}`;
}

function renderBoard(){
  svg.innerHTML=''; svg.setAttribute('viewBox',viewBox());
  const gl=el('g',{}); gl.id='glinks'; svg.appendChild(gl);
  // ghost slots (unplaced) or placed nodes
  levelNodes.forEach(id=>{
    const n=NODES[id], col=LAYERS[n.layer].c;
    if(placed[id]) drawPlaced(id);
    else{
      const g=el('g',{class:'slot'}); g.dataset.id=id; g.style.color=col;
      g.appendChild(el('rect',{class:'box',x:n.x,y:n.y,width:n.w,height:n.h,rx:11,stroke:col}));
      const qm=el('text',{class:'qm',x:n.x+n.w/2,y:n.y+n.h/2-3,'text-anchor':'middle','dominant-baseline':'middle'});qm.textContent='?';
      g.appendChild(qm);
      if(buildMode!=='hard'){ // в «чистой доске» роли-подсказки скрыты
        const ht=el('text',{class:'hint',x:n.x+n.w/2,y:n.y+n.h-9,'text-anchor':'middle'});ht.textContent=n.sub;
        g.appendChild(ht);
      }
      g.onclick=()=>onSlotClick(id,g);
      svg.appendChild(g);
    }
  });
}

function drawPlaced(id){
  const n=NODES[id], col=LAYERS[n.layer].c;
  const g=el('g',{class:'pnode'}); g.dataset.id=id; g.style.color=col;
  g.appendChild(el('rect',{class:'box',x:n.x,y:n.y,width:n.w,height:n.h,rx:11,fill:'var(--nodefill)',stroke:col}));
  const t1=el('text',{class:'lbl',x:n.x+10,y:n.y+24});t1.textContent=n.label;g.appendChild(t1);
  const t2=el('text',{class:'sub',x:n.x+10,y:n.y+40});t2.textContent=n.sub;g.appendChild(t2);
  g.onclick=()=>onNodeClick(id,g);
  svg.appendChild(g);
}

function placeNode(id){ placed[id]=true; pickChip=null; renderBoard(); renderPalette(); updateScore(); checkPlaceDone(); }
function onSlotClick(id,g){
  if(phase!=='place') return;
  if(!pickChip){flashBad(g);return;}
  if(pickChip===id){ placeNode(id); }
  else { missCount++; flashBad(g); updateScore(); }
}
function flashBad(g){g.classList.add('bad');setTimeout(()=>g.classList.remove('bad'),350);}

/* ---- drag-and-drop блоков ---- */
function slotAt(x,y){const e=document.elementFromPoint(x,y);const s=e&&e.closest?e.closest('.slot'):null;return s?s.dataset.id:null;}
function startChipDrag(e,id,chip){
  if(phase!=='place')return;
  e.preventDefault();
  drag={id,chip,sx:e.clientX,sy:e.clientY,moved:false,ghost:null};
  window.addEventListener('pointermove',onChipMove);
  window.addEventListener('pointerup',onChipUp);
}
function onChipMove(e){
  if(!drag)return;
  if(!drag.moved){
    if(Math.abs(e.clientX-drag.sx)+Math.abs(e.clientY-drag.sy)<6)return;
    drag.moved=true;
    const gh=document.createElement('div');gh.className='dragghost';gh.textContent=NODES[drag.id].label;
    document.body.appendChild(gh);drag.ghost=gh;drag.chip.classList.add('dragging');
  }
  drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';
  svg.querySelectorAll('.slot.dragover').forEach(s=>s.classList.remove('dragover'));
  const sid=slotAt(e.clientX,e.clientY);
  if(sid){const s=[...svg.querySelectorAll('.slot')].find(x=>x.dataset.id===sid);if(s)s.classList.add('dragover');}
}
function onChipUp(e){
  window.removeEventListener('pointermove',onChipMove);
  window.removeEventListener('pointerup',onChipUp);
  if(!drag)return;
  svg.querySelectorAll('.slot.dragover').forEach(s=>s.classList.remove('dragover'));
  if(drag.ghost)drag.ghost.remove();
  if(drag.moved){
    const sid=slotAt(e.clientX,e.clientY);
    if(sid===drag.id){ placeNode(drag.id); }
    else if(sid){ missCount++; updateScore(); const s=[...svg.querySelectorAll('.slot')].find(x=>x.dataset.id===sid); if(s)flashBad(s); }
    drag=null;
  } else {
    const id=drag.id; drag=null; pickChip=(pickChip===id?null:id); renderPalette();
  }
}

function onNodeClick(id,g){
  if(phase==='place'){ // un-place
    delete placed[id]; renderBoard(); renderPalette(); updateScore(); return;
  }
  // link phase
  if(!pickNode){ pickNode=id; g.classList.add('pick'); return; }
  if(pickNode===id){ pickNode=null; g.classList.remove('pick'); return; }
  attemptLink(pickNode,id);
  document.querySelectorAll('.pnode.pick').forEach(x=>x.classList.remove('pick'));
  pickNode=null;
}

function linkKey(a,b){return [a,b].sort().join('~');}
function attemptLink(a,b){
  const key=linkKey(a,b);
  const exists=reqLinks.some(l=>linkKey(l[0],l[1])===key);
  if(exists && !doneLinks.has(key)){ doneLinks.add(key); drawLink(a,b,'done'); updateScore(); checkLinksDone(); }
  else if(exists){ /* already done */ }
  else { missCount++; updateScore(); drawLink(a,b,'flash',true); }
}
function drawLink(a,b,cls,temp){
  const [ax,ay]=center(a),[bx,by]=center(b);
  const ln=el('line',{class:'glink '+cls,x1:ax,y1:ay,x2:bx,y2:by});
  document.getElementById('glinks').appendChild(ln);
  if(temp) setTimeout(()=>ln.remove(),350);
}

function renderPalette(){
  const box=document.getElementById('paletteBox');box.innerHTML='';
  if(phase==='recall'){ renderRecallBox(box); return; }
  if(phase==='link'){ box.innerHTML='<div class="empty">Соедини блоки: кликни один, потом второй. Нужно восстановить все связи.</div>'; document.getElementById('btnToLinks').style.display='none'; return; }
  const remaining=paletteOrder.filter(id=>!placed[id]);
  if(remaining.length===0){ box.innerHTML='<div class="empty">Все блоки на месте ✓</div>'; return; }
  remaining.forEach(id=>{
    const n=NODES[id],col=LAYERS[n.layer].c;
    const c=document.createElement('button');
    c.className='chip'+(pickChip===id?' pick':'');c.style.borderLeftColor=col;c.dataset.id=id;
    c.innerHTML=`<span><span class="nm">${n.label}</span><span class="sb">${LAYERS[n.layer].n}</span></span>`;
    c.addEventListener('pointerdown',e=>startChipDrag(e,id,c));
    box.appendChild(c);
  });
}

/* ---- фаза 0 «чистой доски»: отметить состав уровня среди всех компонентов ---- */
function renderRecallBox(box){
  document.getElementById('btnToLinks').style.display='none';
  const chips=recallChips.map(id=>{
    const inLvl=levelNodes.includes(id);
    let cls='pchip';
    if(recallChecked)cls+=inLvl?(recallPick.has(id)?' right':' missed'):(recallPick.has(id)?' wrong':' faded');
    else if(recallPick.has(id))cls+=' on';
    return `<button class="${cls}" data-id="${id}">${NODES[id].label}</button>`;
  }).join('');
  box.innerHTML=`<div class="note mb8">Что входит в уровень «${LEVELS[curLevel].name}»? Отметь нужные компоненты (${levelNodes.length} шт.), лишние не трогай.</div>
    <div class="pickgrid">${chips}</div>
    ${recallChecked
      ?`<button class="primary w100 mt8" id="btnRecallGo">К расстановке →</button>`
      :`<button class="primary w100 mt8" id="btnRecallCheck">Проверить состав</button>`}`;
  box.querySelectorAll('.pchip[data-id]').forEach(b=>b.onclick=()=>{
    if(recallChecked)return;
    const id=b.dataset.id;
    recallPick.has(id)?recallPick.delete(id):recallPick.add(id);
    renderPalette();updateScore();
  });
  const ck=document.getElementById('btnRecallCheck');
  if(ck)ck.onclick=()=>{
    let errs=0;
    levelNodes.forEach(id=>{if(!recallPick.has(id))errs++;});
    recallPick.forEach(id=>{if(!levelNodes.includes(id))errs++;});
    missCount+=errs;recallChecked=true;
    renderPalette();updateScore();
  };
  const go=document.getElementById('btnRecallGo');
  if(go)go.onclick=finishRecall;
}
function finishRecall(){phase='place';setPhaseTag();renderBoard();renderPalette();updateScore();}

function checkPlaceDone(){
  if(levelNodes.every(id=>placed[id])){
    document.getElementById('btnToLinks').style.display='block';
    document.getElementById('paletteBox').innerHTML='<div class="empty">Все блоки на месте ✓ Переходи к связям.</div>';
  }
}
document.getElementById('btnToLinks').onclick=()=>{
  phase='link'; pickChip=null;
  setPhaseTag();
  renderBoard(); renderPalette(); updateScore();
};

function checkLinksDone(){
  if(doneLinks.size===reqLinks.length && reqLinks.length>0){
    const timeMs=Date.now()-levelStart;
    const clean=missCount===0&&hintsUsed===0;
    const best=bestStore(); const lv=LEVELS[curLevel].id; const prev=best[lv]||{};
    best[lv]={complete:true,
      miss:Math.min(missCount,prev.miss==null?missCount:prev.miss),
      time:Math.min(timeMs,prev.time==null?timeMs:prev.time),
      clean:!!(prev.clean||clean),
      hardClean:!!(prev.hardClean||(clean&&buildMode==='hard'))};
    saveBest(best);
    if(IV.active)IV.lastBuild={name:LEVELS[curLevel].name,miss:missCount,time:timeMs,clean};
    celebrate();
    const bn=document.getElementById('doneBanner');
    bn.textContent=`✓ Уровень «${LEVELS[curLevel].name}» собран за ${fmtDur(timeMs)} · ошибок: ${missCount}`
      +(clean?' · чисто ✦':'')+(buildMode==='hard'?' · чистая доска':'');
    bn.classList.add('show'); renderLevels();
    document.getElementById('phaseTag').innerHTML='<span class="fnum">✓ Собрано</span> · уровень пройден';
    document.getElementById('paletteTitle').textContent='Готово';
    levelDoneActions(`Готово за ${fmtDur(timeMs)} · ошибок: ${missCount}.`);
  }
}

function updateScore(){
  let cur,tot,label;
  if(phase==='recall'){cur=recallPick.size;tot=levelNodes.length;label='отмечено';}
  else if(phase==='place'){cur=Object.keys(placed).length;tot=levelNodes.length;label='блоков на месте';}
  else{cur=doneLinks.size;tot=reqLinks.length;label='связей восстановлено';}
  document.getElementById('pbarFill').style.width=(tot?Math.round(cur/tot*100):0)+'%';
  document.getElementById('phaseCount').textContent=cur+'/'+tot;
  document.getElementById('phaseLabel').textContent=label;
  document.getElementById('scMiss').textContent=missCount;
}

document.getElementById('btnReset').onclick=()=>startLevel(true);
document.getElementById('btnHint').onclick=()=>{
  clearTimeout(hintTimer);
  document.querySelectorAll('.glink.hint').forEach(x=>x.remove());
  document.querySelectorAll('.hintnode').forEach(x=>x.classList.remove('hintnode'));
  if(phase==='recall'){
    const miss=levelNodes.find(id=>!recallPick.has(id)); if(!miss||recallChecked)return;
    hintsUsed++; recallPick.add(miss);
    renderPalette();updateScore();return;
  }
  if(phase==='place'){
    const miss=levelNodes.find(id=>!placed[id]); if(!miss)return; hintsUsed++;
    pickChip=miss; renderPalette();
    const g=[...svg.querySelectorAll('.slot')].find(s=>s.dataset.id===miss);
    if(g){g.classList.add('armed');hintTimer=setTimeout(()=>g.classList.remove('armed'),1500);}
  } else {
    const miss=reqLinks.find(l=>!doneLinks.has(linkKey(l[0],l[1]))); if(!miss)return; hintsUsed++;
    drawLink(miss[0],miss[1],'hint');
    [miss[0],miss[1]].forEach(id=>{const g=[...svg.querySelectorAll('.pnode')].find(s=>s.dataset.id===id);if(g)g.classList.add('hintnode');});
    hintTimer=setTimeout(()=>{document.querySelectorAll('.glink.hint').forEach(x=>x.remove());document.querySelectorAll('.hintnode').forEach(x=>x.classList.remove('hintnode'));},1800);
  }
};
function renderLegend(){
  const used=[...new Set(levelNodes.map(id=>NODES[id].layer))];
  document.getElementById('legend').innerHTML=used.map(l=>`<span><i style="background:${LAYERS[l].c}"></i>${LAYERS[l].n}</span>`).join('');
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

/* ==================== КАРТОЧКИ + ИНТЕРВАЛЬНЫЕ ПОВТОРЫ ==================== */
const Q=window.QUESTIONS||[];
const SR='msg_sr_v2', SR_V1='msg_sr_v1';
const DAY=864e5, MIN=6e4;
// Состояние повторов ключуется содержимым карточки (раздел + вопрос), а не индексом:
// при вставке новых вопросов в середину questions.js прогресс не съезжает на чужие карточки.
function srKey(i){const c=Q[i];return c.sec+'|'+c.q;}
function srStore(){try{return JSON.parse(localStorage.getItem(SR))||{}}catch(e){return {}}}
function srSave(o){localStorage.setItem(SR,JSON.stringify(o));}
(function migrateSR(){ // v1 хранил состояние по индексу массива — переносим на ключи как есть
  if(localStorage.getItem(SR)||!localStorage.getItem(SR_V1))return;
  let old;try{old=JSON.parse(localStorage.getItem(SR_V1))||{}}catch(e){old={};}
  const s={};for(const k in old){const i=+k;if(Q[i])s[srKey(i)]=old[k];}
  srSave(s);localStorage.removeItem(SR_V1);
})();
function isDue(i){const c=srStore()[srKey(i)];return !c?false:c.due<=Date.now();}
function isNew(i){return !srStore()[srKey(i)];}

let queue=[], qPos=0, secSel='all', revealed=false;
let cardHist=[]; // история оценок сессии — для «← предыдущая» с откатом SR-состояния
function inSession(){return queue.length>0&&qPos<queue.length;}

function buildSecFilter(){
  const sel=document.getElementById('secFilter');
  const secs=[...new Set(Q.map(c=>c.sec))].sort((a,b)=>(parseInt(a)-parseInt(b))||String(a).localeCompare(String(b)));
  sel.innerHTML='<option value="all">Все разделы ('+Q.length+')</option>'+
    secs.map(s=>{const t=Q.find(c=>c.sec===s).secTitle;const n=Q.filter(c=>c.sec===s).length;return `<option value="${s}">Раздел ${s} · ${t} (${n})</option>`}).join('');
  sel.value=secSel;
  sel.onchange=()=>{secSel=sel.value;renderCardsSide();};
}

function pool(){return Q.map((c,i)=>i).filter(i=>secSel==='all'||String(Q[i].sec)===String(secSel));}

function renderCardsSide(){
  buildSecFilter();
  const p=pool();
  const due=p.filter(isDue).length, nw=p.filter(isNew).length, seen=p.filter(i=>!isNew(i)).length;
  document.getElementById('stDue').textContent=due;
  document.getElementById('stNew').textContent=nw;
  document.getElementById('stSeen').textContent=seen;
  const btn=document.getElementById('btnStudy');
  btn.textContent=inSession()?'Завершить сессию':'Начать сессию';
  btn.classList.toggle('primary',!inSession());
  renderHeat();
  if(!queue.length) renderFlashIdle(due,nw);
}
function renderHeat(){
  const heat=document.getElementById('heat');heat.innerHTML='';
  const secs=[...new Set(Q.map(c=>c.sec))].sort((a,b)=>(parseInt(a)-parseInt(b))||String(a).localeCompare(String(b)));
  secs.forEach(s=>{
    const idxs=Q.map((c,i)=>i).filter(i=>Q[i].sec===s);
    const seen=idxs.filter(i=>!isNew(i));
    let col=getComputedStyle(document.documentElement).getPropertyValue('--bg2');
    if(seen.length){
      const avgInt=seen.reduce((a,i)=>a+(srStore()[srKey(i)].interval||0),0)/seen.length;
      const frac=seen.length/idxs.length;
      if(avgInt>=3 && frac>=0.6) col='rgba(90,209,154,.85)';
      else if(frac>0) col='rgba(244,201,93,.7)';
    }
    const c=document.createElement('button');c.className='cell';c.style.background=col;c.textContent=s;
    c.title=`Раздел ${s}: ${seen.length}/${idxs.length} изучено`;
    c.onclick=()=>{secSel=String(s);document.getElementById('secFilter').value=secSel;renderCardsSide();};
    heat.appendChild(c);
  });
}
function renderFlashIdle(due,nw){
  const status=due?`К повтору сейчас: ${due}.`:(nw?'Срочных повторов нет.':'Все повторы сделаны — сессия даст случайную выборку для прогона.');
  document.getElementById('flashBox').innerHTML=
    `<div class="emptyq"><b>Готова тренироваться?</b>${status} ${nw?`Новых вопросов: ${nw}.`:''}<br><br>Отвечай вслух или на бумаге <i>до</i> того, как раскроешь ответ — так тренируется воспроизведение, а не узнавание.<div class="mt16"><button class="primary" onclick="startSession()">Начать сессию</button></div></div>`;
}

function startSession(){
  const p=pool();
  let due=p.filter(isDue), nw=p.filter(isNew);
  queue=shuffle(due).concat(shuffle(nw)).slice(0,40);
  if(!queue.length) queue=shuffle(p.slice()).slice(0,20); // всё освоено — повтори по кругу
  qPos=0; cardHist=[]; showCard(); renderCardsSide();
}
function endSession(){queue=[];qPos=0;cardHist=[];renderCardsSide();}
document.getElementById('btnStudy').onclick=()=>{inSession()?endSession():startSession();};
document.getElementById('btnResetSR').onclick=()=>{
  if(confirm('Сбросить весь прогресс карточек?')){localStorage.removeItem(SR);queue=[];cardHist=[];renderCardsSide();}
};

function showCard(){
  if(qPos>=queue.length){
    document.getElementById('flashBox').innerHTML=`<div class="emptyq"><b>Сессия завершена ✓</b>Прогресс сохранён. Можно начать новую или переключиться на сборку схемы.</div>`;
    queue=[];renderCardsSide();return;
  }
  revealed=false;
  const i=queue[qPos], c=Q[i];
  document.getElementById('flashBox').innerHTML=`
    <div class="meta"><span class="secpill">Раздел ${c.sec} · ${c.secTitle}</span><span>${qPos+1} / ${queue.length}</span></div>
    <div class="q">${c.q}</div>
    <div class="ahint" id="ahint">Ответь сама вслух, потом раскрой ↓ (пробел)</div>
    <div class="answer" id="answer">${c.a}<span class="src">↩ ${c.courseFile}</span></div>
    <div class="spacer"></div>
    <div class="actions" id="actions">
      <button class="primary w100" id="btnReveal">Показать ответ</button>
    </div>
    ${(cardHist.length&&qPos>0)?`<button class="linkbtn" onclick="cardBack()" title="Вернуться и переоценить (клавиша ←)">← предыдущая карточка</button>`:''}`;
  document.getElementById('btnReveal').onclick=reveal;
}
function reveal(){
  revealed=true;
  document.getElementById('answer').classList.add('show');
  document.getElementById('ahint').style.display='none';
  document.getElementById('actions').innerHTML=`
    <div class="lab mb8">Насколько уверенно ответила? · клавиши 1–4</div>
    <div class="grades">
      <button class="g-again" data-g="0">Снова<small>&lt;10м</small></button>
      <button class="g-hard" data-g="1">Трудно<small>~1д</small></button>
      <button class="g-good" data-g="2">Хорошо<small>дни</small></button>
      <button class="g-easy" data-g="3">Легко<small>недели</small></button>
    </div>`;
  document.querySelectorAll('.grades button').forEach(b=>b.onclick=()=>grade(+b.dataset.g));
}
function srApply(i,g){ // SM-2-обновление одной карточки; используется и сессией, и прогоном интервью
  const s=srStore(); const k=srKey(i); const c=s[k]||{ease:2.5,interval:0,due:0,reps:0};
  if(g===0){ c.ease=Math.max(1.3,c.ease-0.2); c.interval=0; c.reps=0; c.due=Date.now()+10*MIN; }
  else if(g===1){ c.ease=Math.max(1.3,c.ease-0.15); c.interval=Math.max(1,(c.interval||1)*1.2); c.reps++; c.due=Date.now()+c.interval*DAY; }
  else if(g===2){ c.interval=c.reps===0?1:(c.reps===1?3:Math.round((c.interval||1)*c.ease)); c.reps++; c.due=Date.now()+c.interval*DAY; }
  else { c.ease=c.ease+0.15; c.interval=Math.round((c.interval||1)*c.ease*1.3); c.reps++; c.due=Date.now()+c.interval*DAY; }
  s[k]=c; srSave(s); bumpGrades();
}
function grade(g){
  const i=queue[qPos];
  const s=srStore(), k=srKey(i);
  cardHist.push({i,g,prev:s[k]?{...s[k]}:null}); // снимок до оценки — для отката
  srApply(i,g);
  if(g===0) queue.push(i); // показать снова в конце сессии
  qPos++; showCard(); renderCardsSide();
}
/* возврат к предыдущей карточке: откатываем SR-состояние, счётчик повторов
   и добавленный в конец повтор (если была оценка «Снова»), даём переоценить */
function cardBack(){
  if(!cardHist.length||qPos===0) return;
  const h=cardHist.pop();
  const s=srStore(), k=srKey(h.i);
  if(h.prev) s[k]=h.prev; else delete s[k];
  srSave(s);
  localStorage.setItem(BGRADES,Math.max(0,gradesCount()-1));
  if(h.g===0) queue.pop();
  qPos--; showCard(); reveal(); renderCardsSide();
}
/* клавиатура: пробел — показать ответ, 1–4 — оценка */
document.addEventListener('keydown',e=>{
  if(!document.getElementById('view-practice').classList.contains('on'))return;
  if(!document.getElementById('view-cards').classList.contains('on'))return;
  if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  if(!queue.length||qPos>=queue.length)return;
  if(!revealed&&e.key===' '){e.preventDefault();reveal();}
  else if(revealed&&e.key>='1'&&e.key<='4'){e.preventDefault();grade(+e.key-1);}
  else if(e.key==='ArrowLeft'){e.preventDefault();cardBack();}
});

/* ==================== КУРС ==================== */
const COURSE=window.COURSE||{parts:[],sections:{},refs:[]};
const READ='msg_read_v1';            // legacy (очищается при сбросе)
const TST='msg_test_v1';             // лучший результат теста по разделу
function testStore(){try{return JSON.parse(localStorage.getItem(TST))||{}}catch(e){return {}}}
function testCount(n){const v=testStore()[String(n)];return v==null?null:v;}
function testTotal(n){const t=(window.TESTS||{})[String(n)];return t?t.length:6;}
function secPassed(n){const c=testCount(n);return c!=null&&c>=testTotal(n);}
function secFrac(n){const c=testCount(n);return c==null?0:Math.min(1,c/testTotal(n));}
function saveTest(n,score){const s=testStore();const k=String(n);if(score>(s[k]||0))s[k]=score;localStorage.setItem(TST,JSON.stringify(s));}

// номерные разделы — основной счёт курса; буквенные (2A, 3A…) — дополнения, в счёт не идут
function mainSecNums(){return Object.keys(COURSE.sections).filter(n=>/^\d+$/.test(n));}
function pluralSec(n){const a=n%10,b=n%100;if(a===1&&b!==11)return 'раздел';if(a>=2&&a<=4&&(b<10||b>=20))return 'раздела';return 'разделов';}
// плоский порядок для навигации пред/след
function courseOrder(){
  const o=[];
  COURSE.parts.forEach(p=>p.secs.forEach(n=>o.push({type:'sec',key:String(n)})));
  COURSE.refs.forEach(r=>o.push({type:'ref',key:r.id}));
  return o;
}
let curDoc=null;

/* мобильное оглавление: список спрятан за кнопкой-шапкой с названием текущего
   раздела; выбор пункта закрывает список (на десктопе кнопка скрыта стилями) */
const tocBarEl=document.getElementById('tocBar');
if(tocBarEl)tocBarEl.onclick=()=>{
  const open=document.getElementById('toc').classList.toggle('open');
  tocBarEl.setAttribute('aria-expanded',open);
};
function closeToc(){
  document.getElementById('toc').classList.remove('open');
  if(tocBarEl)tocBarEl.setAttribute('aria-expanded','false');
}
function updateTocBar(){
  const el=document.getElementById('tocBarTitle');if(!el)return;
  let t='Оглавление';
  if(curDoc==='intro')t='О курсе · что тебя ждёт';
  else if(curDoc&&curDoc.startsWith('sec:')){const n=curDoc.slice(4),s=COURSE.sections[n];if(s)t=`Раздел ${n} · ${s.title}`;}
  else if(curDoc&&curDoc.startsWith('ref:')){const r=COURSE.refs.find(x=>x.id===curDoc.slice(4));if(r)t='Справка · '+r.title;}
  el.textContent=t;
}

function renderToc(){
  const toc=document.getElementById('toc');toc.innerHTML='';
  const ib=document.createElement('button');
  ib.className='ti'+(curDoc==='intro'?' on':'');
  ib.innerHTML='<span class="n" style="color:var(--edge);"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg></span><span class="tt">О курсе · что тебя ждёт</span>';
  ib.onclick=()=>openIntro();
  toc.appendChild(ib);
  COURSE.parts.forEach(p=>{
    const h=document.createElement('div');h.className='part';h.textContent=p.part;toc.appendChild(h);
    p.secs.forEach(n=>{
      const s=COURSE.sections[String(n)];if(!s)return;
      const b=document.createElement('button');
      b.className='ti'+(curDoc==='sec:'+n?' on':'')+(secPassed(n)?' read':'');
      const c=testCount(n);
      const score=(!secPassed(n)&&c!=null)?`<span class="qsc">${c}/${testTotal(n)}</span>`:'';
      b.innerHTML=`<span class="n">${n}</span><span class="tt">${s.title}</span>${score}`;
      b.onclick=()=>openSection(n);
      toc.appendChild(b);
    });
  });
  if(COURSE.refs.length){
    const h=document.createElement('div');h.className='part';h.textContent='Справка · сети и соединения';toc.appendChild(h);
    COURSE.refs.forEach(r=>{
      const b=document.createElement('button');
      b.className='ti'+(curDoc==='ref:'+r.id?' on':'');
      b.innerHTML=`<span class="n">§</span><span class="tt">${r.title}</span>`;
      b.onclick=()=>openRef(r.id);
      toc.appendChild(b);
    });
  }
  updateTocBar();
}
function mdToHtml(md){
  const clean=md.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g,'$1'); // wiki-ссылки → текст
  return marked.parse(clean);
}
function renderReader(meta,title,html,navHtml){
  document.getElementById('reader').innerHTML=
    `<div class="rmeta">${meta}</div><h1 class="rt">${title}</h1><div class="md">${html}</div><div id="quizbox"></div><div class="rnav" id="rnav">${navHtml}</div>`;
  window.scrollTo(0,0);
}
function navButtons(key){
  const ord=courseOrder();const i=ord.findIndex(x=>x.type+':'+x.key===key);
  let h='';
  if(i>0){const p=ord[i-1];h+=`<button class="ghost" onclick="openDoc('${p.type}','${p.key}')">← Назад</button>`;}
  h+='<span class="grow"></span>';
  if(i<ord.length-1){const nx=ord[i+1];h+=`<button class="ghost" onclick="openDoc('${nx.type}','${nx.key}')">Дальше →</button>`;}
  return h;
}
function openDoc(type,key){type==='sec'?openSection(key):openRef(key);}
function openIntro(opts){
  curDoc='intro';
  if(!(opts&&opts.noHash)) setHash('#course');
  const secNums=mainSecNums();
  const passed=secNums.filter(n=>secPassed(n)).length;
  const partsHtml=COURSE.parts.map((p,pi)=>{
    const desc=(COURSE.partsIntro||[])[pi]||'';
    const secs=p.secs.map(n=>{
      const s=COURSE.sections[String(n)];if(!s)return '';
      return `<button class="introsec${secPassed(n)?' done':''}" onclick="openSection('${n}')"><b>${n}</b>${s.title}</button>`;
    }).join('');
    return `<div class="intropart"><h3>${p.part}</h3><p>${desc}</p><div class="introsecs">${secs}</div></div>`;
  }).join('');
  const startBtn=passed?`Продолжить курс → (пройдено ${passed} / ${secNums.length})`:'Начать с раздела 1 →';
  document.getElementById('reader').innerHTML=`
    <div class="rmeta">Курс</div>
    <h1 class="rt">Что тебя ждёт в курсе</h1>
    <div class="md">
      <p><b>${secNums.length} ${pluralSec(secNums.length)} в шести частях</b> плюс дополнения (2A, 3A, 6A, 8A) — от «что такое мессенджер с точки зрения архитектуры» до групповых звонков и их шифрования. Курс выстроен так, как развивается ответ на интервью: сначала скелет и доставка одного сообщения, потом хранение, масштаб, безопасность и реальное время. Каждый раздел опирается на предыдущие — читай по порядку.</p>
      <p><b>Как заниматься.</b> Прочитай раздел → сдай тест в конце на 6/6 (варианты перемешиваются, зубрить буквы бесполезно) → если завалила, карточки раздела сами встанут к повтору. Раз в пару разделов заглядывай в «Практика → Схема» — то, что прочитано, должно рисоваться рукой. Финальная проверка — «Практика → Прогон»: вся схема плюс вопросы вслух на время.</p>
      <p>Внизу оглавления лежит <b>справка по сетям</b> (TCP, сокеты, WebSocket, уровни L4/L7) — она не входит в зачёт, открывай её как словарик, когда встречаешь незнакомый термин.</p>
    </div>
    <div class="introprog"><div class="bar"><i style="width:${secNums.length?Math.round(passed/secNums.length*100):0}%"></i></div><span>${passed} / ${secNums.length} разделов пройдено</span></div>
    ${partsHtml}
    <div class="rnav"><span class="grow"></span><button class="primary" onclick="continueCourse()">${startBtn}</button></div>`;
  renderToc();closeToc();
  window.scrollTo(0,0);
}
function openSection(n,opts){
  n=String(n);const s=COURSE.sections[n];if(!s)return;
  curDoc='sec:'+n;
  if(!(opts&&opts.noHash)) setHash(hashForDoc(curDoc));
  renderReader('Раздел '+n,s.title,mdToHtml(s.md),navButtons('sec:'+n));
  renderQuiz(n);
  renderToc();closeToc();
}
function openRef(id,opts){
  const r=COURSE.refs.find(x=>x.id===id);if(!r)return;
  curDoc='ref:'+id;
  if(!(opts&&opts.noHash)) setHash(hashForDoc(curDoc));
  renderReader('Справка',r.title,mdToHtml(r.md),navButtons('ref:'+id));
  renderToc();closeToc();
}
function studySection(n){secSel=String(n);goTab('cards');document.getElementById('secFilter').value=secSel;renderCardsSide();startSession();}
// ошибки в тесте раздела возвращают его изученные карточки в очередь повторов
function bumpSectionCards(sec){
  const s=srStore(); let total=0; const now=Date.now();
  Q.forEach((c,i)=>{
    if(String(c.sec)!==String(sec))return; total++;
    const k=srKey(i); if(s[k]&&s[k].due>now)s[k].due=now;
  });
  srSave(s); return total;
}

/* ---- Тест по разделу ---- */
const TESTS=window.TESTS||{};
const QLET=['А','Б','В','Г'];
let quizSec=null,quizSel={},quizChecked=false,quizPerm=[];
function renderQuiz(n){
  const box=document.getElementById('quizbox');if(!box)return;
  const qs=TESTS[String(n)];
  if(!qs||!qs.length){box.innerHTML='';return;}
  quizSec=String(n);quizSel={};quizChecked=false;
  // варианты перемешиваются на каждом рендере, чтобы при пересдаче
  // запоминался смысл ответа, а не его буква
  quizPerm=qs.map(q=>shuffle(q.opts.map((_,i)=>i)));
  box.innerHTML=`<div class="quiz" id="quizroot">
    <div class="quizhead"><h2>Тест по разделу</h2></div>
    <div class="quizsub">Ответь на все ${qs.length} вопросов и нажми «Проверить». Раздел засчитывается пройденным при ${qs.length} / ${qs.length}.</div>
    ${qs.map((q,qi)=>`<div class="qitem" id="qitem${qi}">
      <div class="qq"><b>${qi+1}.</b>${q.q}</div>
      <div class="qopts">${quizPerm[qi].map((orig,oi)=>`<button class="qopt" id="q${qi}o${oi}" onclick="pickOpt(${qi},${oi})"><span class="ltr">${QLET[oi]})</span>${q.opts[orig]}</button>`).join('')}</div>
      <div class="qexp" id="qexp${qi}"></div>
    </div>`).join('')}
    <div class="quizfoot" id="quizfoot">
      <button class="primary qcheckbtn" id="qcheck" onclick="checkQuiz()" disabled>Проверить · 0 / ${qs.length}</button>
    </div>
  </div>`;
}
function pickOpt(qi,oi){
  if(quizChecked)return;
  quizSel[qi]=oi;
  TESTS[quizSec][qi].opts.forEach((o,i)=>document.getElementById('q'+qi+'o'+i).classList.toggle('sel',i===oi));
  const qs=TESTS[quizSec],done=Object.keys(quizSel).length,btn=document.getElementById('qcheck');
  if(btn){btn.textContent=`Проверить · ${done} / ${qs.length}`;btn.disabled=done<qs.length;}
}
function checkQuiz(){
  const qs=TESTS[quizSec];if(!qs)return;
  if(Object.keys(quizSel).length<qs.length)return;
  quizChecked=true;let score=0;
  document.getElementById('quizroot').classList.add('checked');
  qs.forEach((q,qi)=>{
    const correctDisp=quizPerm[qi].indexOf(q.correct);
    const picked=quizSel[qi],ok=picked===correctDisp;if(ok)score++;
    q.opts.forEach((o,oi)=>{const b=document.getElementById('q'+qi+'o'+oi);b.classList.remove('sel');
      if(oi===correctDisp){b.classList.add('right');b.insertAdjacentHTML('beforeend','<span class="verdict">✓ верно</span>');}
      else if(picked===oi){b.classList.add('wrong');b.insertAdjacentHTML('beforeend','<span class="verdict">✗ ваш ответ</span>');}
      else b.classList.add('faded');});
    document.getElementById('qitem'+qi).classList.add(ok?'ok':'bad');
    const ex=document.getElementById('qexp'+qi);ex.innerHTML=`<b>Ответ: ${QLET[correctDisp]}.</b> ${q.exp}`;ex.classList.add('show');
  });
  saveTest(quizSec,score);
  const pass=score===qs.length,nx=nextCourseKey();
  let failCardsBtn='';
  if(pass){ celebrate(); }
  else {
    const n=bumpSectionCards(quizSec);
    if(n)failCardsBtn=`<button onclick="studySection('${quizSec}')">🃏 Карточки раздела (${n}) →</button>`;
  }
  document.getElementById('quizfoot').innerHTML=`<div class="qsummary ${pass?'ok':'bad'}">
    <div class="big">${score} / ${qs.length}</div>
    <div class="msg">${pass?'✓ Раздел пройден — засчитан в прогрессе на Главной.':'Чтобы зачесть раздел, нужно '+qs.length+' из '+qs.length+'. Разбери ошибки — карточки раздела поставлены к повтору.'}</div>
    <div class="acts">
      ${pass?(nx?`<button class="primary" onclick="goNextCourse()">Следующий раздел →</button>`:'')
            :`<button class="primary" onclick="scrollFirstWrong()">К ошибкам ↓</button>${failCardsBtn}`}
      <button class="ghost" onclick="resetQuiz()">Пройти заново</button>
    </div>
  </div>`;
  renderToc();renderDashboard();
  document.getElementById('quizfoot').scrollIntoView({behavior:'smooth',block:'center'});
}
function resetQuiz(){renderQuiz(quizSec);const b=document.getElementById('quizbox');if(b)b.scrollIntoView({behavior:'smooth',block:'start'});}
function scrollFirstWrong(){const qs=TESTS[quizSec];for(let i=0;i<qs.length;i++){if(quizSel[i]!==quizPerm[i].indexOf(qs[i].correct)){document.getElementById('qitem'+i).scrollIntoView({behavior:'smooth',block:'center'});return;}}}
function nextCourseKey(){const ord=courseOrder();const i=ord.findIndex(x=>x.type==='sec'&&x.key===quizSec);return (i>=0&&i<ord.length-1)?ord[i+1]:null;}
function goNextCourse(){const nx=nextCourseKey();if(nx)openDoc(nx.type,nx.key);}

/* ==================== ДАШБОРД (главная) ==================== */
/* ---- аналитика ---- */
const BTIME='msg_time_v1',BDAYS='msg_days_v1',BGRADES='msg_grades_v1';
function todayStr(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
function markActive(){let days;try{days=JSON.parse(localStorage.getItem(BDAYS))||[];}catch(e){days=[];}const t=todayStr();if(!days.includes(t)){days.push(t);localStorage.setItem(BDAYS,JSON.stringify(days));const s=streakDays();if(s>=2)showToast('🔥 Стрик: '+s+' '+pluralDay(s)+'!');}}
function streakDays(){let days;try{days=JSON.parse(localStorage.getItem(BDAYS))||[];}catch(e){days=[];}const set=new Set(days);let s=0,d=new Date();const k=x=>x.getFullYear()+'-'+(x.getMonth()+1)+'-'+x.getDate();if(!set.has(k(d)))d.setDate(d.getDate()-1);while(set.has(k(d))){s++;d.setDate(d.getDate()-1);}return s;}
function gradesCount(){return +localStorage.getItem(BGRADES)||0;}
function bumpGrades(){localStorage.setItem(BGRADES,gradesCount()+1);}
function fmtTime(sec){const m=Math.round(sec/60);if(m<1)return '< 1 мин';if(m<60)return m+' мин';const h=Math.floor(m/60);return h+' ч '+(m%60)+' м';}
function pluralDay(n){const a=n%10,b=n%100;if(a===1&&b!==11)return 'день подряд';if(a>=2&&a<=4&&(b<10||b>=20))return 'дня подряд';return 'дней подряд';}
let _timeAcc=+localStorage.getItem(BTIME)||0;
setInterval(()=>{if(document.visibilityState==='visible'){_timeAcc+=10;localStorage.setItem(BTIME,_timeAcc);}},10000);

function pillarStats(){
  const secNums=mainSecNums();
  const totalSec=secNums.length;
  const passed=secNums.filter(n=>secPassed(n)).length;
  const courseKnow=totalSec?secNums.reduce((a,n)=>a+secFrac(n),0)/totalSec:0;
  const lvlsDone=LEVELS.filter(l=>{const b=bestStore()[l.id];return b&&b.complete;}).length;
  const s=srStore(); let mastery=0;
  Q.forEach((c,i)=>{const cs=s[srKey(i)];if(cs)mastery+=Math.max(0,Math.min(1,(cs.interval||0)/7));});
  const idx=Q.map((c,i)=>i);
  return {totalSec,passed,courseFrac:totalSec?passed/totalSec:0,courseKnow,
          lvlsDone,buildFrac:lvlsDone/LEVELS.length,
          cardsFrac:Q.length?mastery/Q.length:0,
          dueNow:idx.filter(isDue).length,seen:idx.filter(i=>!isNew(i)).length};
}
// реальный прогресс (не просто открытие сайта) переключает главную с лендинга на кабинет
function hasProgress(){
  return !!(localStorage.getItem(TST)||localStorage.getItem(SR)||localStorage.getItem(BSTORE)||localStorage.getItem(EST)||localStorage.getItem(ADS));
}
function renderDashboard(){
  const box=document.getElementById('homeBox'); if(!box)return;
  if(hasProgress())renderCabinet(box); else renderLanding(box);
}

function renderLanding(box){
  const tests=Object.values(TESTS).reduce((a,t)=>a+t.length,0);
  const seq=[
    {dir:'in', t:'Спроектируй мессенджер на 500 млн DAU.', tm:'14:02'},
    {dir:'out',t:'Начну с требований: доставка ≤ 1 с, строгий порядок в чате, мультидевайс.', tm:'14:03'},
    {dir:'in', t:'А если получатель офлайн?', tm:'14:05'},
    {dir:'out',t:'Сообщение ждёт в durable-логе, уходит push, при реконнекте — догон по курсору seq.', tm:'14:06'},
  ];
  const dbl='<svg width="13" height="9" viewBox="0 0 16 10" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 5.5 4 8.5 10 1.5"/><path d="M7.5 7.5 8.5 8.5 15 1.5"/></svg>';
  const msgs=seq.map((m,i)=>`<div class="ph-msg ${m.dir}" style="animation-delay:${(.35+i*.6).toFixed(2)}s">${m.t}<span class="mt">${m.tm}${m.dir==='out'?dbl:''}</span></div>`).join('');
  const tIn=.35+seq.length*.6+.5, tOut=tIn+2.1; // тайпинг живёт ~2 с, потом интервьюер «дописывает»
  box.innerHTML=`
  <div class="landing">
    <div>
      <div class="kickrow"><span>Бесплатно</span><span>Без регистрации</span><span>Открытый код</span></div>
      <h2>Спроектируй мессенджер.<br>Пройди интервью <b>уверенно</b>.</h2>
      <p class="sub">Курс по архитектуре мессенджера и пять тренажёров, которые учат не узнавать, а воспроизводить: схему — рукой, контракты — по памяти, ответы — вслух. Открой и занимайся: никаких аккаунтов, прогресс хранится в твоём браузере.</p>
      <div class="ctas">
        <button class="primary" onclick="continueCourse()">Начать курс</button>
        <button class="ghosty" onclick="goTab('map')">Посмотреть карту</button>
      </div>
      <div class="factrow"><span><b>${mainSecNums().length}</b> ${pluralSec(mainSecNums().length)}</span><span><b>${tests}</b> тестов</span><span><b>${window.MAPDATA.SCENARIOS.length}</b> сценариев на карте</span></div>
    </div>
    <div class="phone">
      <div class="blob"></div>
      <div class="ph-head"><span class="ph-ava"><i>SD</i></span><div><div class="nm">Интервьюер</div><div class="st">online</div></div></div>
      <div class="ph-msgs">${msgs}
        <div class="ph-typing" style="animation:msgIn .5s forwards ${tIn.toFixed(2)}s, typOut .4s forwards ${tOut.toFixed(2)}s"><i></i><i></i><i></i></div>
        <div class="ph-msg in" style="animation-delay:${(tOut+.3).toFixed(2)}s">Сильно. Следующий вопрос — шардирование 😉<span class="mt">14:07</span></div>
      </div>
      <div class="ph-input"><button class="fld" onclick="goTab('interview')">Твоя очередь отвечать…</button></div>
    </div>
  </div>
  <div class="landsec flip reveal">
    <div class="lstext">
      <div class="lab">Курс</div>
      <h3>22 раздела — и тест после каждого</h3>
      <p>Читаешь по порядку: от скелета и доставки одного сообщения до E2EE и звонков. Раздел засчитан только при 6 из 6 — варианты перемешиваются, зубрить буквы бесполезно. Завалила тест — карточки раздела сами встанут к повтору.</p>
      <button class="ghosty" onclick="continueCourse()">Открыть курс →</button>
    </div>
    <div class="panel lsdemo">
      <div class="introsecs">
        <span class="introsec done"><b>1</b>Что такое мессенджер архитектурно</span>
        <span class="introsec"><b>2</b>Требования и рамки</span>
        <span class="introsec"><b>3</b>Связь с сервером</span>
      </div>
      <div class="qq mt16"><b>3.</b>Зачем мессенджеру постоянное соединение?</div>
      <div class="qopts">
        <span class="qopt right"><span class="ltr">А)</span>Сервер может сам прислать событие — сообщение прилетает мгновенно<span class="verdict">✓ верно</span></span>
        <span class="qopt faded"><span class="ltr">Б)</span>Так приложение быстрее запускается</span>
      </div>
      <div class="qexp show"><b>Ответ: А.</b> Push-модель: новые события приходят сами, без опроса сервера.</div>
    </div>
  </div>
  <div class="landsec reveal">
    <div class="lstext">
      <div class="lab">Практика</div>
      <h3>Пять тренажёров: воспроизведение, а не узнавание</h3>
      <p>Собери схему по памяти и восстанови связи, собери API-запрос из кусочков, вспомни столбцы таблиц, прикинь нагрузку в уме и прогони интервью целиком — вслух и на время.</p>
      <button class="ghosty" onclick="goTab('practice')">Тренироваться →</button>
    </div>
    <div class="panel lsdemo">
      <div class="lab">Чистая доска · вспомни состав уровня</div>
      <div class="pickgrid">
        <span class="pchip right">Conn-сервер</span>
        <span class="pchip right">Message-сервис</span>
        <span class="pchip right">БД (шардированная)</span>
        <span class="pchip missed">Реестр сессий</span>
        <span class="pchip wrong">CDN</span>
        <span class="pchip faded">SFU</span>
      </div>
      <div class="done-banner show">✓ Уровень «Скелет» собран за 1:42 · ошибок 1</div>
    </div>
  </div>
  <div class="landsec flip reveal">
    <div class="lstext">
      <div class="lab">Карта</div>
      <h3>Живая схема: ${Object.keys(window.MAPDATA.NODES).length} компонент и ${window.MAPDATA.SCENARIOS.length} сценариев</h3>
      <p>Кликни любой блок — что он делает и зачем. Выбери сценарий — от доставки сообщения до группового звонка — и пройди его по шагам прямо на карте, с зумом и подсветкой пути.</p>
      <button class="ghosty" onclick="goTab('map')">Открыть карту →</button>
    </div>
    <div class="panel lsdemo">
      <div class="lab mb8">Сценарий · онлайн-доставка · шаг 2 / 7</div>
      <svg viewBox="0 0 520 240" width="100%" style="display:block;">
        <line class="link active" x1="140" y1="45" x2="196" y2="45"/>
        <line class="link active" x1="336" y1="45" x2="380" y2="45"/>
        <line class="link dim" x1="444" y1="68" x2="444" y2="160"/>
        <line class="link dim" x1="380" y1="60" x2="280" y2="160"/>
        <line class="link dim" x1="196" y1="183" x2="140" y2="183"/>
        <g class="node active" style="color:var(--client)"><rect class="shape" x="12" y="22" width="128" height="46" rx="11" fill="var(--nodefill)" stroke="currentColor" stroke-width="1.6"/><text class="label" x="76" y="42" text-anchor="middle">Алиса</text><text class="sub" x="76" y="56" text-anchor="middle">клиент-отправитель</text></g>
        <g class="node active" style="color:var(--edge)"><rect class="shape" x="196" y="22" width="140" height="46" rx="11" fill="var(--nodefill)" stroke="currentColor" stroke-width="1.6"/><text class="label" x="266" y="42" text-anchor="middle">Conn-сервер A</text><text class="sub" x="266" y="56" text-anchor="middle">соединение Алисы</text></g>
        <g class="node dim" style="color:var(--core)"><rect class="shape" x="380" y="22" width="128" height="46" rx="11" fill="var(--nodefill)" stroke="currentColor" stroke-width="1.6"/><text class="label" x="444" y="42" text-anchor="middle">Message-сервис</text><text class="sub" x="444" y="56" text-anchor="middle">ядро + сигналинг</text></g>
        <g class="node dim" style="color:var(--client)"><rect class="shape" x="12" y="160" width="128" height="46" rx="11" fill="var(--nodefill)" stroke="currentColor" stroke-width="1.6"/><text class="label" x="76" y="180" text-anchor="middle">Боб</text><text class="sub" x="76" y="194" text-anchor="middle">клиент-получатель</text></g>
        <g class="node dim" style="color:var(--edge)"><rect class="shape" x="196" y="160" width="140" height="46" rx="11" fill="var(--nodefill)" stroke="currentColor" stroke-width="1.6"/><text class="label" x="266" y="180" text-anchor="middle">Conn-сервер B</text><text class="sub" x="266" y="194" text-anchor="middle">соединение Боба</text></g>
        <g class="node dim" style="color:var(--store)"><rect class="shape" x="380" y="160" width="128" height="46" rx="11" fill="var(--nodefill)" stroke="currentColor" stroke-width="1.6"/><text class="label" x="444" y="180" text-anchor="middle">БД</text><text class="sub" x="444" y="194" text-anchor="middle">durable-лог</text></g>
      </svg>
    </div>
  </div>
  <div class="landsec reveal">
    <div class="lstext">
      <div class="lab">Личный кабинет</div>
      <h3>Готовность к интервью — одним числом</h3>
      <p>Балл 0–100 складывается из курса, сборки схемы и карточек. Рядом — стрик, время в тренажёре и прогресс всех пяти направлений. Без регистрации: всё хранится в твоём браузере, экспорт — одним файлом.</p>
      <button class="ghosty" onclick="continueCourse()">Начать копить прогресс →</button>
    </div>
    <div class="panel lsdemo center">
      <div class="ring" id="demoRing" style="--p:0"><div class="hole"><b><span id="demoReady">0</span><i>%</i></b><small>ГОТОВНОСТЬ</small></div></div>
      <div class="cabstats">
        <span><b>4 ч 12 м</b>в тренажёре</span>
        <span><b>5</b>дней подряд</span>
        <span><b>22 / 22</b>тестов</span>
        <span><b>310</b>повторов</span>
      </div>
    </div>
  </div>
  <div class="landcta">
    <h3>Первый раздел — минут десять</h3>
    <p>Без регистрации и установки. Прогресс сохраняется в твоём браузере.</p>
    <button class="primary" onclick="continueCourse()">Начать курс</button>
  </div>
  <div class="landsign">Курс и тренажёры делаю я — <a href="https://t.me/monrech" target="_blank" rel="noopener">@monrech</a>, готовясь к своим system design собеседованиям. Замечания и идеи — пиши.</div>
  <div class="landsign">Занималась раньше на другом устройстве? <button class="linkbtn" onclick="document.getElementById('importFile').click()">Импортировать прогресс</button></div>
  `;
  initLandingFx(box);
}
/* появление секций лендинга при скролле + счётчик кольца готовности */
function initLandingFx(box){
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting)return;
    e.target.classList.add('in');
    if(e.target.querySelector('#demoRing'))animateDemoRing(e.target);
    io.unobserve(e.target);
  }),{threshold:.25});
  box.querySelectorAll('.reveal').forEach(el=>io.observe(el));
}
function animateDemoRing(scope){
  const ring=scope.querySelector('#demoRing'),num=scope.querySelector('#demoReady');
  if(!ring||ring.dataset.done)return; ring.dataset.done='1';
  const T=66;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){ring.style.setProperty('--p',T);num.textContent=T;return;}
  const t0=performance.now();
  (function frame(t){
    const k=Math.min(1,(t-t0)/900);
    const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2; // ease-in-out
    const v=Math.round(T*e);
    ring.style.setProperty('--p',v);num.textContent=v;
    if(k<1)requestAnimationFrame(frame);
  })(t0);
}
function renderCabinet(box){
  markActive();
  const st=pillarStats();
  const readiness=Math.round(100*(0.35*st.courseKnow+0.30*st.buildFrac+0.35*st.cardsFrac));
  let label,sub;
  if(readiness<25){label='Старт';sub='Только начинаешь. Пройди первые разделы курса и собери скелет схемы по памяти.';}
  else if(readiness<55){label='Разогрев';sub='База набирается. Дожимай карточки на повторе и наращивай схему по уровням.';}
  else if(readiness<80){label='Уверенно';sub='Хорошая форма. Закрывай слабые разделы и гоняй полную схему без подсказок.';}
  else{label='Готова';sub='Ты почти у цели. Держи карточки на повторе и прогоняй сценарии звонков и E2EE на карте.';}
  const nx=courseOrder().find(x=>x.type==='sec'&&!secPassed(x.key));
  const sd=streakDays();
  const stats=`<div class="cabstats">
      <span><b>${fmtTime(_timeAcc)}</b>в тренажёре</span>
      <span><b>${sd}</b>${pluralDay(sd)}</span>
      <span><b>${st.passed} / ${st.totalSec}</b>тестов сдано</span>
      <span><b>${gradesCount()}</b>повторов карточек</span>
    </div>`;
  const ad=adStore();
  const tDone=AD.TABLES.filter(t=>ad.tables[t.name]&&ad.tables[t.name].complete).length;
  const es=estStats();
  const cols=[
    {ic:'book',t:'Курс',frac:st.courseKnow,num:`<b>${st.passed}</b> из ${st.totalSec} разделов пройдено`,act:'continueCourse()'},
    {ic:'blocks',t:'Схема',frac:st.buildFrac,num:`<b>${st.lvlsDone}</b> из ${LEVELS.length} уровней собрано`,act:"goTab('build')"},
    {ic:'braces',t:'API · БД',frac:AD.TABLES.length?tDone/AD.TABLES.length:0,
     num:`<b>${tDone}</b> из ${AD.TABLES.length} таблиц собрано${ad.api.n?` · API ${ad.api.ok}/${ad.api.n}`:''}`,act:"goTab('apidb')"},
    {ic:'cards',t:'Карточки',frac:st.cardsFrac,
     num:st.dueNow?`<b>${st.dueNow}</b> к повтору · ${st.seen}/${Q.length} изучено`:`<b>${st.seen}</b> из ${Q.length} изучено`,
     act:'startCards()'},
    {ic:'calc',t:'Прикидки',frac:es.n?es.ok/es.n:0,
     num:es.n?`<b>${es.ok}</b> из ${es.n} верно`:`<b>0</b> задач решено`,act:"goTab('estimate')"},
  ].map(p=>`
    <div class="ccol" onclick="${p.act}" title="Открыть">
      <span class="cic">${icon(p.ic,22)}</span>
      <h3>${p.t} <span class="go">${icon('arrow',15)}</span></h3>
      <div class="num">${p.num}</div>
      <div class="bar"><i style="width:${Math.round(p.frac*100)}%"></i></div>
    </div>`).join('');
  box.innerHTML=`
    <div class="cabhero">
      <div class="ring" style="--p:${readiness}"><div class="hole"><b>${readiness}<i>%</i></b><small>ГОТОВНОСТЬ</small></div></div>
      <div class="meta">
        <span class="lvlbadge">Уровень: ${label}</span>
        <h2>С возвращением!</h2>
        <p>${sub}</p>
      </div>
      <div class="heroctas">
        ${nx?`<button class="primary" onclick="goTab('course');openSection('${nx.key}')">Продолжить курс · раздел ${nx.key}</button>`
            :(st.lvlsDone<LEVELS.length
              ?`<button class="primary" onclick="goTab('build')">Собирать схему · уровень ${st.lvlsDone+1} из ${LEVELS.length}</button>`
              :`<button class="primary" onclick="startCards()">Учить карточки${st.dueNow?` · ${st.dueNow} к повтору`:''}</button>`)}
        <button class="ghosty" onclick="goTab('interview')">${icon('mic',14)} Прогон интервью</button>
        <div class="herodata">
          <button class="databtn" onclick="exportProgress()" title="Скачать копию прогресса файлом">${icon('download',13)} Экспорт</button>
          <i>·</i>
          <button class="databtn" onclick="document.getElementById('importFile').click()" title="Восстановить прогресс из файла">${icon('upload',13)} Импорт</button>
          <i>·</i>
          <button class="databtn danger" onclick="resetAll()" title="Сбросить весь прогресс">${icon('rotate',12)} Сброс</button>
        </div>
      </div>
    </div>
    ${stats}
    <div class="cabcols">${cols}</div>`;
}
function continueCourse(){
  goTab('course');
  if(!Object.keys(testStore()).length){openIntro();return;} // курс ещё не начат — сначала «О курсе», а не сразу раздел 1
  const nx=courseOrder().find(x=>x.type==='sec'&&!secPassed(x.key))||courseOrder()[0];
  openDoc(nx.type,nx.key);
}
function startCards(){goTab('cards');startSession();}
/* ---- экспорт / импорт / сброс прогресса ---- */
const PROGRESS_KEYS=[READ,SR,SR_V1,BSTORE,TST,BLVL,BTIME,BDAYS,BGRADES,'msg_est_v1','msg_apidb_v1'];
function exportProgress(){
  const data={_app:'messenger-trainer',_exported:new Date().toISOString()};
  PROGRESS_KEYS.forEach(k=>{const v=localStorage.getItem(k);if(v!=null)data[k]=v;});
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='messenger-trainer-progress-'+new Date().toISOString().slice(0,10)+'.json';
  a.click();URL.revokeObjectURL(a.href);
}
function importProgress(file){
  const r=new FileReader();
  r.onload=()=>{
    let data;try{data=JSON.parse(r.result);}catch(e){alert('Не получилось прочитать файл: это не JSON.');return;}
    if(data._app!=='messenger-trainer'){alert('Это не файл прогресса тренажёра.');return;}
    if(!confirm('Импорт заменит текущий прогресс данными из файла. Продолжить?'))return;
    PROGRESS_KEYS.forEach(k=>{typeof data[k]==='string'?localStorage.setItem(k,data[k]):localStorage.removeItem(k);});
    location.reload();
  };
  r.readAsText(file);
}
function resetAll(){
  const st=pillarStats();
  if(!confirm('Сброс удалит весь прогресс:\n'
    +'· разделов пройдено: '+st.passed+' из '+st.totalSec+'\n'
    +'· времени в тренажёре: '+fmtTime(_timeAcc)+'\n'
    +'· уровней схемы: '+st.lvlsDone+', повторов карточек: '+gradesCount()+'\n\n'
    +'Файл с копией прогресса сейчас скачается автоматически — через «Импорт» из него можно всё восстановить.\n\nСбросить?'))return;
  exportProgress(); // страховка от случайного сброса: копия уезжает в загрузки до очистки
  PROGRESS_KEYS.forEach(k=>localStorage.removeItem(k));_timeAcc=0;
  queue=[];qPos=0;secSel='all';curLevel=0;startLevel(true);renderCardsSide();renderToc();renderDashboard();
  if(curDoc&&curDoc.startsWith('sec:'))renderQuiz(curDoc.slice(4));
  alert('Прогресс сброшен.');
}

/* ==================== ПРИКИДКИ (back-of-envelope) ==================== */
const EST='msg_est_v1';
function estStats(){try{return JSON.parse(localStorage.getItem(EST))||{n:0,ok:0}}catch(e){return{n:0,ok:0}}}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function fmtInt(n){return Math.round(n).toLocaleString('ru-RU');}
function fmtAns(n){return (n>=100?Math.round(n):Math.round(n*10)/10).toLocaleString('ru-RU');}
const EST_T=[
  ()=>{const D=pick([50,100,200,500]),m=pick([20,40,60]);const ans=D*1e6*m/86400;
    return {q:`У мессенджера ${D} млн DAU, каждый отправляет в среднем ${m} сообщений в день. Какой средний RPS на отправку?`,unit:'RPS',ans,
      steps:[`Сообщений в день: ${D} млн × ${m} = ${fmtInt(D*m)} млн`,`В сутках 86 400 с ≈ 10⁵ с`,`${fmtInt(D*m)} млн / 86 400 ≈ ${fmtInt(ans)} RPS`]};},
  ()=>{const a=pick([10,25,50,120]),k=pick([3,4,5]);const ans=a*1000*k;
    return {q:`Средняя нагрузка на отправку — ${a} тыс RPS. Для вечернего пика закладывают множитель ×${k}. На какой пиковый RPS проектировать?`,unit:'RPS',ans,
      steps:[`${a} 000 × ${k} = ${fmtInt(ans)} RPS`,`Пик — то, под что считают число conn-серверов и шардов, а не среднее`]};},
  ()=>{const N=pick([1,2,5,10]),s=pick([100,200,300]);const ans=N*1e9*s/1e12;
    return {q:`${N} млрд сообщений в день, среднее сообщение с метаданными — ${s} байт. На сколько ТБ прирастает хранилище за день?`,unit:'ТБ в день',ans,
      steps:[`${N}×10⁹ сообщений × ${s} Б = ${fmtAns(ans)}×10¹² Б`,`10¹² Б = 1 ТБ → ≈ ${fmtAns(ans)} ТБ/день`,`За год: ×365 ≈ ${fmtAns(ans*365/1000)} ПБ — отсюда шардирование и TTL медиа`]};},
  ()=>{const C=pick([10,50,100,200]),c=pick([100,200,500]);const ans=C*1e6/(c*1000);
    return {q:`Онлайн одновременно ${C} млн пользователей; один conn-сервер держит ~${c} тыс WebSocket-соединений. Сколько conn-серверов нужно (без запаса)?`,unit:'серверов',ans,
      steps:[`${C}×10⁶ / ${c}×10³ = ${fmtInt(ans)}`,`На практике ×1.5–2 — на пик, деплой и падения`]};},
  ()=>{const C=pick([20,50,100]),b=pick([100,200,500]);const ans=C*1e6*b/1e9;
    return {q:`Реестр сессий хранит запись на каждого из ${C} млн онлайн-пользователей, запись ≈ ${b} байт. Сколько ГБ памяти под реестр?`,unit:'ГБ',ans,
      steps:[`${C}×10⁶ × ${b} Б = ${fmtAns(ans)}×10⁹ Б = ${fmtAns(ans)} ГБ`,`Влезает в Redis-кластер из нескольких узлов — поэтому реестр и держат в памяти`]};},
  ()=>{const N=pick([5,10,50]),t=pick([5,10,30]);const ans=N*1e6/t;
    return {q:`Канал на ${N} млн подписчиков; пост нужно доставить всем за ~${t} с. Какой темп доставки (сообщений в секунду) должен выдать fan-out?`,unit:'сообщений/с',ans,
      steps:[`${N}×10⁶ / ${t} с = ${fmtInt(ans)} msg/s`,`Такой темп на запись нереален — поэтому для каналов делают fan-out on read`]};},
  ()=>{const D=pick([100,200,500]),p=pick([5,10,20]),s=pick([1,2,5]);const ans=D*1e6*(p/100)*s/86400;
    return {q:`${D} млн DAU, ${p}% из них раз в день отправляют фото по ${s} МБ. Какой средний входящий трафик медиа в МБ/с?`,unit:'МБ/с',ans,
      steps:[`Фото в день: ${D} млн × ${p}% = ${fmtInt(D*p/100)} млн`,`Объём: × ${s} МБ = ${fmtAns(D*p/100*s/1000)} ТБ/день`,`Делим на 86 400 с ≈ ${fmtInt(ans)} МБ/с — и это мимо канала сообщений, в объектное хранилище`]};},
  ()=>{const T=pick([50,100,500]),x=pick([2,4,8]);const ans=Math.ceil(T*2/x);
    return {q:`В БД сообщений ${T} ТБ данных; один шард комфортно держит до ${x} ТБ. Сколько шардов заложить с двукратным запасом на рост?`,unit:'шардов',ans,
      steps:[`${T} ТБ × 2 (запас) = ${T*2} ТБ`,`${T*2} / ${x} = ${fmtInt(ans)} шардов`,`Число шардов удобно брать степенью двойки — проще решардинг`]};},
];
let estCur=null, estChecked=false, estPick=null;
function estOptions(ans){ // 4 варианта: точный + промахи на порядок и «в разы»
  const seen=new Set(),out=[];
  [1,10,0.1,3].forEach(k=>{const v=ans*k,l=fmtAns(v);if(!seen.has(l)){seen.add(l);out.push({v,l,ok:k===1});}});
  const extra=[30,0.03,0.5,300];
  while(out.length<4&&extra.length){const v=ans*extra.shift(),l=fmtAns(v);if(!seen.has(l)){seen.add(l);out.push({v,l,ok:false});}}
  return shuffle(out);
}
function estOptsHtml(prob,checked,picked){
  return `<div class="qopts mt8">${prob.opts.map((o,i)=>{
    let cls='qopt';
    if(checked)cls+=o.ok?' right':(i===picked?' wrong':' faded');
    return `<button class="${cls}" data-i="${i}">≈ ${o.l} ${prob.unit}</button>`;
  }).join('')}</div>`;
}
function estStepsHtml(prob,nextHtml){
  return `<div class="eststeps mt12">${prob.steps.map(s=>'· '+s).join('<br>')}</div>
    <div class="acts mt12">${nextHtml}</div>`;
}
function newEstimate(){estCur=pick(EST_T)();estCur.opts=estOptions(estCur.ans);estChecked=false;estPick=null;renderEstimate();}
function renderEstimate(){
  const box=document.getElementById('estBox'); if(!box)return;
  if(!estCur){newEstimate();return;}
  const st=estStats();
  box.innerHTML=`
    <div class="estq">${estCur.q}</div>
    <div class="estunit">Прикинь в уме и выбери порядок величины — на интервью важна степень десятки, а не точная цифра.</div>
    ${estOptsHtml(estCur,estChecked,estPick)}
    ${estChecked?estStepsHtml(estCur,'<button class="primary" onclick="newEstimate()">Дальше →</button>'):''}
    <div class="note mt16">Серия: верно ${st.ok} из ${st.n}${st.n?` (${Math.round(st.ok/st.n*100)}%)`:''} · <button class="linkbtn inline" onclick="newEstimate()">другая задача ↻</button></div>`;
  if(!estChecked)box.querySelectorAll('.qopt').forEach(b=>b.onclick=()=>{
    estPick=+b.dataset.i;estChecked=true;
    const ok=estCur.opts[estPick].ok;
    const s=estStats();s.n++;if(ok)s.ok++;localStorage.setItem(EST,JSON.stringify(s));
    renderEstimate();
  });
}

/* ==================== ТРЕНАЖЁР «КОНТРАКТЫ»: API + МОДЕЛЬ ДАННЫХ ==================== */
const AD=window.APIDB||{API_TASKS:[],TABLES:[]};
const ADS='msg_apidb_v1';
function adStore(){try{return JSON.parse(localStorage.getItem(ADS))||{api:{n:0,ok:0},tables:{}}}catch(e){return{api:{n:0,ok:0},tables:{}}}}
function adSave(s){localStorage.setItem(ADS,JSON.stringify(s));}
let adMode='api';
let apiPool=[],apiCur=null,apiMethod=null,apiChecked=false;
let dbTable=null,dbPhase=null,dbMiss=0,dbKeyIdx=0,dbKeyPicked=null;

function renderApiDb(){
  const box=document.getElementById('adBox');if(!box)return;
  if(!AD.API_TASKS.length||!AD.TABLES.length){ // apidb.js не загрузился (старый кэш) — не молчим
    box.innerHTML='<div class="emptyq"><b>Данные тренажёра не загрузились</b>Похоже, в кэше старая версия. Обнови страницу с очисткой кэша: <b>Cmd+Shift+R</b> (Mac) или <b>Ctrl+Shift+R</b>.</div>';
    return;
  }
  document.getElementById('adModeApi').classList.toggle('on',adMode==='api');
  document.getElementById('adModeDb').classList.toggle('on',adMode==='db');
  if(adMode==='api')renderApiDrill(box);else renderDbDrill(box);
}
document.getElementById('adModeApi').onclick=()=>{adMode='api';renderApiDb();};
document.getElementById('adModeDb').onclick=()=>{adMode='db';renderApiDb();};

/* ---- дрилл 1: API-конструктор (всё кликами, без печати) ---- */
const AD_METHODS=['GET','POST','PUT','DELETE','WS'];
const AD_SEGPOOL=[...new Set(AD.API_TASKS.filter(t=>t.path).flatMap(t=>t.path.split('/').filter(Boolean)))];
const AD_EVPOOL=[...new Set(AD.API_TASKS.filter(t=>t.method==='WS').map(t=>t.event))].concat(['message.send','chat.muted','user.blocked']);
let apiSeq=[],apiPathChips=[],apiEvChips=[],apiEvPick=null;
function normEvent(s){return String(s).toLowerCase().replace(/[^a-zа-я0-9]/g,'');}
function apiPrepRound(t){
  apiCur=t;apiMethod=null;apiChecked=false;apiSeq=[];apiEvPick=null;
  const correct=(t.path||'').split('/').filter(Boolean);
  const dis=shuffle(AD_SEGPOOL.filter(s=>!correct.includes(s))).slice(0,Math.max(4,10-correct.length));
  apiPathChips=shuffle([...correct,...dis]);
  const evCorrect=t.method==='WS'?t.event:null;
  let pool=shuffle(AD_EVPOOL.filter(e=>e!==evCorrect)).slice(0,5);
  if(t.evAccept&&!pool.includes('message.send'))pool[0]='message.send'; // дуальной задаче нужен валидный WS-вариант
  apiEvChips=shuffle([...(evCorrect?[evCorrect]:[]),...pool]);
}
function apiNext(){
  if(!apiPool.length)apiPool=shuffle(AD.API_TASKS.map((t,i)=>i)); // цикл без повторов, пока пул не кончится
  apiPrepRound(AD.API_TASKS[apiPool.pop()]);
  renderApiDb();
}
function renderApiDrill(box){
  if(!apiCur){apiNext();return;}
  const st=adStore().api;
  let work='';
  if(!apiMethod)
    work=`<div class="note">Выбери метод: для HTTP соберёшь путь из кусочков, для WS — выберешь событие.</div>`;
  else if(apiMethod==='WS')
    work=`<div class="pickgrid">${apiEvChips.map(e=>`<button class="pchip${apiEvPick===e?' on':''}" data-ev="${e}">${e}</button>`).join('')}</div>`;
  else
    work=`<div class="pathbuild">${apiSeq.length
        ?apiSeq.map((s,i)=>`<span class="slash">/</span><button class="bseg" data-i="${i}" title="убрать">${s}</button>`).join('')
        :'<span class="ph">путь соберётся здесь — клик по кусочку добавляет, клик по собранному убирает</span>'}</div>
      <div class="pickgrid">${apiPathChips.map(s=>`<button class="pchip" data-seg="${s}"${apiSeq.includes(s)?' disabled':''}>/${s}</button>`).join('')}</div>`;
  box.innerHTML=`
    <div class="estq">${apiCur.task}</div>
    <div class="mrow">${AD_METHODS.map(m=>`<button class="mbtn${apiMethod===m?' on':''}" data-m="${m}">${m}</button>`).join('')}</div>
    ${work}
    <div class="row mt12"><button class="primary" id="apiCheckBtn"${apiMethod?'':' disabled'}>Проверить</button></div>
    <div id="apiOut"></div>
    <div class="note mt16">Серия: верно ${st.ok} из ${st.n} · правило: «запросил один раз → HTTP; прилетает само → WS»</div>`;
  box.querySelectorAll('.mbtn').forEach(b=>b.onclick=()=>{if(apiChecked)return;apiMethod=b.dataset.m;renderApiDb();});
  box.querySelectorAll('.pchip[data-seg]').forEach(b=>b.onclick=()=>{if(apiChecked)return;apiSeq.push(b.dataset.seg);renderApiDb();});
  box.querySelectorAll('.bseg').forEach(b=>b.onclick=()=>{if(apiChecked)return;apiSeq.splice(+b.dataset.i,1);renderApiDb();});
  box.querySelectorAll('.pchip[data-ev]').forEach(b=>b.onclick=()=>{if(apiChecked)return;apiEvPick=b.dataset.ev;renderApiDb();});
  document.getElementById('apiCheckBtn').onclick=apiCheck;
}
function apiCheck(){
  if(apiChecked||!apiCur||!apiMethod)return;
  const t=apiCur;
  if(apiMethod==='WS'&&!apiEvPick){showToast('Выбери событие');return;}
  if(apiMethod!=='WS'&&!apiSeq.length){showToast('Собери путь из кусочков');return;}
  const okMethod=(apiMethod===t.method)||(t.methodAlt||[]).includes(apiMethod);
  let okPath,built;
  if(apiMethod==='WS'){
    built=apiEvPick;
    okPath=t.method==='WS'?normEvent(apiEvPick)===normEvent(t.event):(t.evAccept||[]).includes(normEvent(apiEvPick));
  }else{
    built='/'+apiSeq.join('/');
    const canon=(t.path||'').split('/').filter(Boolean);
    okPath=canon.length>0&&apiSeq.length===canon.length&&canon.every((s,i)=>s===apiSeq[i]);
  }
  const ok=okMethod&&okPath;
  apiChecked=true;
  const s=adStore();s.api.n++;if(ok)s.api.ok++;adSave(s);
  if(ok&&s.api.ok%15===0)celebrate();
  const canon=t.method==='WS'
    ?`WS-событие <b>${t.event}</b>`
    :`<b>${t.method} ${t.path}${t.query||''}</b>${t.methodAlt?` <span class="soft">(или ${t.methodAlt.join(' / ')})</span>`:''}`;
  document.getElementById('apiOut').innerHTML=`
    <div class="qsummary ${ok?'ok':'bad'} compact mt16">
      <div class="big">${ok?'✓ Верно':'✗ Не то'}</div>
      <div class="adcanon">${canon}</div>
      <div class="adfacts">
        ${okMethod?'':`<div>✗ Метод: ты выбрала <b>${apiMethod}</b>, нужен <b>${t.method}</b></div>`}
        ${okPath?'':`<div>✗ ${apiMethod==='WS'?'Событие':'Путь'}: у тебя получилось «${built}»</div>`}
        ${t.note?`<div>· ${t.note}</div>`:''}
        ${t.event&&t.method!=='WS'?`<div>· Ручка тянет событие: по WS уходит <b>${t.event}</b></div>`:''}
        ${t.tables?`<div>· Трогает таблицы: <b>${t.tables.join(', ')}</b></div>`:''}
      </div>
      <div class="acts mt12"><button class="primary" onclick="apiNext()">Дальше →</button></div>
    </div>`;
}

/* ---- дрилл 2: модель данных (мультивыбор столбцов, без печати) ---- */
const AD_ALLCOLS=[...new Set(AD.TABLES.flatMap(t=>t.cols.map(c=>c.c)))];
let dbChips=[],dbPicks=new Set(),dbColsChecked=false;
function curTable(){return AD.TABLES.find(t=>t.name===dbTable);}
function dbStart(name){
  dbTable=name;dbMiss=0;dbKeyIdx=0;dbKeyPicked=null;dbPhase='cols';
  dbPicks=new Set();dbColsChecked=false;
  const correct=curTable().cols.map(c=>c.c);
  // подмешиваем реальные столбцы других таблиц — ловушки вида push_token в users
  const dis=shuffle(AD_ALLCOLS.filter(c=>!correct.includes(c))).slice(0,Math.min(7,Math.max(4,12-correct.length)));
  dbChips=shuffle([...correct,...dis]);
  renderApiDb();
}
function renderDbDrill(box){
  const st=adStore().tables;
  const chips=AD.TABLES.map(t=>{
    const done=st[t.name]&&st[t.name].complete;
    return `<button class="tchip${dbTable===t.name?' on':''}${done?' done':''}" data-t="${t.name}">${done?'✓ ':''}${t.name}</button>`;
  }).join('');
  box.innerHTML=`<div class="tchips">${chips}</div>${dbTable?dbBody():
    `<p class="note lg">Выбери таблицу и восстанови её: сначала <b>столбцы по памяти</b>, потом <b>ключевые решения</b> — шардирование, первичный ключ, что лежит ссылкой. Ровно то, что спрашивают после «какие таблицы заведёшь?».</p>`}`;
  box.querySelectorAll('.tchip').forEach(b=>b.onclick=()=>dbStart(b.dataset.t));
  dbBind(box);
}
function dbBody(){
  const t=curTable();
  if(dbPhase==='cols'){
    const correct=new Set(t.cols.map(c=>c.c));
    const chips=dbChips.map(c=>{
      let cls='pchip';
      if(dbColsChecked){
        if(correct.has(c))cls+=dbPicks.has(c)?' right':' missed';
        else cls+=dbPicks.has(c)?' wrong':' faded';
      } else if(dbPicks.has(c))cls+=' on';
      return `<button class="${cls}" data-c="${c}">${c}</button>`;
    }).join('');
    return `<div class="estq sm">${t.name} — ${t.title.toLowerCase()}. Отметь её столбцы (${t.cols.length} шт.), чужие не трогай:</div>
      <div class="pickgrid">${chips}</div>
      ${dbColsChecked
        ?`<div class="note">Жёлтое — пропустила, зачёркнутое — лишнее. Ошибок: <b>${dbMiss}</b></div>
          <div class="acts mt12"><button class="primary" id="dbToKeys">К ключевым вопросам →</button></div>`
        :`<div class="row mt8"><button class="primary" id="dbColsCheck">Проверить</button><span class="note">отмечено: ${dbPicks.size} / ${t.cols.length}</span></div>`}`;
  }
  if(dbPhase==='key'){
    const k=t.keys[dbKeyIdx];
    const opts=k.opts.map((o,i)=>{
      let cls='qopt';
      if(dbKeyPicked!=null){cls+=i===k.correct?' right':(i===dbKeyPicked?' wrong':' faded');}
      return `<button class="${cls}" data-i="${i}">${o}</button>`;
    }).join('');
    return `<div class="estq sm">${t.name}: ${k.q}</div>
      <div class="qopts mt8">${opts}</div>
      ${dbKeyPicked!=null?`<div class="qexp show mt12">${k.why}</div>
        <div class="acts mt12"><button class="primary" id="dbKeyNext">${dbKeyIdx<t.keys.length-1?'Следующий вопрос →':'Готово →'}</button></div>`:''}`;
  }
  const best=adStore().tables[t.name]||{};
  return `<div class="qsummary ok compact mt8">
    <div class="big">✓ ${t.name} собрана · ошибок ${dbMiss}${best.miss!=null&&best.miss<dbMiss?` (лучший: ${best.miss})`:''}</div>
    <div class="adcanon">${t.schema}</div>
    <div class="adfacts">${t.keys.map(k=>`<div>· ${k.why}</div>`).join('')}</div>
    <div class="acts mt12">
      <button class="primary" id="dbNextTable">Следующая таблица →</button>
      <button class="ghost" id="dbRedo">Эту заново</button></div></div>`;
}
function dbBind(box){
  if(dbPhase==='cols'){
    box.querySelectorAll('.pchip[data-c]').forEach(b=>b.onclick=()=>{
      if(dbColsChecked)return;
      const c=b.dataset.c;
      dbPicks.has(c)?dbPicks.delete(c):dbPicks.add(c);
      renderApiDb();
    });
    const ck=document.getElementById('dbColsCheck');
    if(ck)ck.onclick=()=>{
      const correct=new Set(curTable().cols.map(c=>c.c));
      let errs=0;
      correct.forEach(c=>{if(!dbPicks.has(c))errs++;});
      dbPicks.forEach(c=>{if(!correct.has(c))errs++;});
      dbMiss+=errs;dbColsChecked=true;renderApiDb();
    };
    const tk=document.getElementById('dbToKeys');
    if(tk)tk.onclick=()=>{dbPhase='key';renderApiDb();};
  }
  if(dbPhase==='key'){
    box.querySelectorAll('.qopt').forEach(b=>b.onclick=()=>{
      if(dbKeyPicked!=null)return;
      dbKeyPicked=+b.dataset.i;
      if(dbKeyPicked!==curTable().keys[dbKeyIdx].correct)dbMiss++;
      renderApiDb();
    });
    const nx=document.getElementById('dbKeyNext');
    if(nx)nx.onclick=()=>{
      if(dbKeyIdx<curTable().keys.length-1){dbKeyIdx++;dbKeyPicked=null;}
      else dbFinish();
      renderApiDb();
    };
  }
  const nt=document.getElementById('dbNextTable');
  if(nt)nt.onclick=()=>{
    const st=adStore().tables;
    const next=AD.TABLES.find(x=>!(st[x.name]&&st[x.name].complete)&&x.name!==dbTable)||AD.TABLES[0];
    dbStart(next.name);
  };
  const rd=document.getElementById('dbRedo');
  if(rd)rd.onclick=()=>dbStart(dbTable);
}
function dbFinish(){
  dbPhase='done';
  const s=adStore();const prev=s.tables[dbTable]||{};
  s.tables[dbTable]={complete:true,miss:Math.min(dbMiss,prev.miss==null?dbMiss:prev.miss)};
  adSave(s);
  if(dbMiss===0)celebrate();
}

/* ==================== ПРОГОН ИНТЕРВЬЮ ==================== */
const IV={active:false,plan:[],stage:0,sub:'',t0:0,tEnd:0,cards:[],cardPos:0,revealed:false,estProb:null,estOk:null,lastBuild:null,res:null};
const IV_SECS={skeleton:['1','2','4'],reliab:['5','6','6A'],session:['3','7'],media:['9'],scale:['11','12','2A'],multi:['10'],rtc:['21','22']};
function ivStart(short){
  IV.active=true;IV.t0=Date.now();IV.tEnd=0;IV.stage=0;IV.sub='est';
  IV.plan=LEVELS.slice(0,short?3:LEVELS.length).map(l=>l.id);
  IV.estProb=pick(EST_T)();IV.estProb.opts=estOptions(IV.estProb.ans);
  IV.estOk=null;IV.estPickIdx=null;IV.lastBuild=null;
  IV.res={builds:[],ok:0,again:0};
  renderInterview();
}
function ivHead(){
  const lbl=IV.sub==='est'?'разминка':(IV.sub==='done'?'итог':`этап ${IV.stage+1} / ${IV.plan.length}`);
  const t=IV.sub==='done'?fmtDur(IV.tEnd-IV.t0):`<span id="ivTimer">${fmtDur(Date.now()-IV.t0)}</span>`;
  return `<div class="ivhead"><span class="lab">Прогон интервью · ${lbl}</span>
    <span class="lab">${icon('clock',12)} ${t} · <button class="linkbtn inline" onclick="ivAbort()">прервать</button></span></div>`;
}
setInterval(()=>{const e=document.getElementById('ivTimer');if(e&&IV.active&&IV.sub!=='done')e.textContent=fmtDur(Date.now()-IV.t0);},1000);
function renderInterview(){
  const box=document.getElementById('ivBox'); if(!box)return;
  if(!IV.active){
    box.innerHTML=`<div class="ivpanel">
      <h3>Репетиция «Спроектируй мессенджер»</h3>
      <p>Полный цикл, как на реальном интервью: <b>прикидка нагрузки → схема у доски → углубляющие вопросы вслух</b> — и так уровень за уровнем. Отвечай голосом, как живому интервьюеру: тренируется связная выдача, а не узнавание.</p>
      <p class="mt8">Совет: включи в сборке режим <b>«Чистая доска»</b> — сначала вспоминаешь состав уровня, потом расставляешь.</p>
      <div class="row mt16">
        <button class="primary" onclick="ivStart(false)">Полный прогон · ${LEVELS.length} уровней (~40 мин)</button>
        <button onclick="ivStart(true)">Короткий · первые 3 уровня (~15 мин)</button>
      </div></div>`;
    return;
  }
  if(IV.sub==='est'){
    box.innerHTML=`<div class="ivpanel">${ivHead()}
      <h3>Разминка: оцени нагрузку</h3>
      <p>Интервью почти всегда начинается с прикидки. Прикинь в уме (вслух!) и выбери порядок величины.</p>
      <div class="estq">${IV.estProb.q}</div>
      ${estOptsHtml(IV.estProb,IV.estOk!=null,IV.estPickIdx)}
      ${IV.estOk!=null?estStepsHtml(IV.estProb,'<button class="primary" onclick="ivNext()">К доске →</button>'):''}</div>`;
    if(IV.estOk==null)box.querySelectorAll('.qopt').forEach(b=>b.onclick=()=>{
      IV.estPickIdx=+b.dataset.i;IV.estOk=IV.estProb.opts[IV.estPickIdx].ok;renderInterview();
    });
    return;
  }
  if(IV.sub==='build'){
    const lv=LEVELS[IV.stage];
    box.innerHTML=`<div class="ivpanel">${ivHead()}
      <h3>Этап ${IV.stage+1}: «${lv.name.replace(/^\d+ · /,'')}»</h3>
      <p>${lv.desc}</p>
      <p class="mt8">Собери уровень на доске, <b>проговаривая вслух</b>, зачем каждый компонент и куда идёт стрелка. Когда соберёшь — вернёшься сюда к вопросам интервьюера.</p>
      <div class="row mt16"><button class="primary" onclick="ivOpenBuild()">Открыть доску →</button></div></div>`;
    return;
  }
  if(IV.sub==='cards'){
    if(!IV.cards.length){ivAfterCards();return;}
    const i=IV.cards[IV.cardPos], c=Q[i];
    box.innerHTML=`<div>${ivHead()}
      <div class="flash">
        <div class="meta"><span class="secpill">Вопрос интервьюера · раздел ${c.sec}</span><span>${IV.cardPos+1} / ${IV.cards.length}</span></div>
        <div class="q">${c.q}</div>
        ${IV.revealed?`<div class="answer show">${c.a}</div>`:`<div class="ahint">Ответь вслух, потом сверься ↓ (пробел)</div>`}
        <div class="spacer"></div>
        <div class="actions">${IV.revealed
          ?`<div class="grades duo">
              <button class="g-again" onclick="ivGrade(0)">Плавала<small>клавиша 1</small></button>
              <button class="g-good" onclick="ivGrade(2)">Ответила уверенно<small>клавиша 2</small></button></div>`
          :`<button class="primary w100" onclick="ivReveal()">Показать ответ</button>`}</div>
      </div></div>`;
    return;
  }
  // итог
  const bm=IV.res.builds.reduce((a,b)=>a+b.miss,0);
  const buildRows=IV.res.builds.map(b=>`<div>· ${b.name} — ${fmtDur(b.time)}, ошибок ${b.miss}${b.clean?' ✦':''}</div>`).join('');
  const verdict=IV.res.again>IV.res.ok
    ?'Вопросы вслух — слабое звено: дожми карточки этих разделов, они уже поставлены к повтору.'
    :(bm>IV.res.builds.length*2
      ?'Схема ещё подвисает — гоняй уровни в режиме «чистая доска» до чистых прогонов.'
      :'Сильный прогон. Держи темп: повторы карточек + полная схема раз в пару дней.');
  box.innerHTML=`<div class="ivpanel">${ivHead()}
    <h3>Прогон завершён</h3>
    <div class="pillrow my12">
      <div class="pill"><b>${fmtDur(IV.tEnd-IV.t0)}</b>общее время</div>
      <div class="pill"><b>${bm}</b>ошибок в сборке</div>
      <div class="pill"><b>${IV.res.ok} / ${IV.res.ok+IV.res.again}</b>уверенных ответов</div>
      <div class="pill"><b>${IV.estOk==null?'—':(IV.estOk?'✓':'✗')}</b>прикидка</div>
    </div>
    <div class="eststeps sans">${buildRows}</div>
    <p class="mt12"><b>${verdict}</b></p>
    <div class="row mt16"><button class="primary" onclick="ivFinish()">Готово</button></div></div>`;
}
function ivNext(){if(IV.sub==='est'){IV.sub='build';renderInterview();}}
function ivOpenBuild(){curLevel=IV.stage;goTab('build');startLevel(true);}
function ivBuildDone(){
  if(IV.lastBuild){IV.res.builds.push(IV.lastBuild);IV.lastBuild=null;}
  IV.sub='cards';IV.cards=ivPickCards(IV.plan[IV.stage]);IV.cardPos=0;IV.revealed=false;
  goTab('interview');
}
function ivPickCards(levelId){
  const secs=IV_SECS[levelId]||[];
  const idx=Q.map((c,i)=>i).filter(i=>secs.includes(String(Q[i].sec)));
  const seen=new Set(),out=[];
  for(const i of shuffle(idx.filter(isDue)).concat(shuffle(idx.filter(isNew))).concat(shuffle(idx.slice()))){
    if(!seen.has(i)){seen.add(i);out.push(i);}
    if(out.length===2)break;
  }
  return out;
}
function ivReveal(){IV.revealed=true;renderInterview();}
function ivGrade(g){
  srApply(IV.cards[IV.cardPos],g);
  if(g===0)IV.res.again++;else IV.res.ok++;
  IV.cardPos++;IV.revealed=false;
  if(IV.cardPos>=IV.cards.length)ivAfterCards();else renderInterview();
}
function ivAfterCards(){
  IV.stage++;
  if(IV.stage>=IV.plan.length){IV.sub='done';IV.tEnd=Date.now();celebrate();}
  else IV.sub='build';
  renderInterview();
}
function ivAbort(){if(confirm('Прервать прогон? Результат не сохранится.')){IV.active=false;renderInterview();}}
function ivFinish(){IV.active=false;renderInterview();}
/* клавиатура в вопросах прогона: пробел — ответ, 1 — плавала, 2 — уверенно */
document.addEventListener('keydown',e=>{
  if(!document.getElementById('view-practice').classList.contains('on'))return;
  if(!document.getElementById('view-interview').classList.contains('on')||!IV.active||IV.sub!=='cards')return;
  if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  if(!IV.revealed&&e.key===' '){e.preventDefault();ivReveal();}
  else if(IV.revealed&&(e.key==='1'||e.key==='2')){e.preventDefault();ivGrade(e.key==='1'?0:2);}
});

/* ==================== КАРТА (нативная) ==================== */
(function(){
  const MD=window.MAPDATA; if(!MD) return;
  const N=MD.NODES,L=MD.LINKS,INFO=MD.INFO,SCN=MD.SCENARIOS,CATS=MD.CAT_ORDER,LN=MD.LAYER_NAME;
  const LV={client:'--client',edge:'--edge',core:'--core',store:'--store',scale:'--scale',push:'--push',rtc:'--rtc'};
  const svgm=document.getElementById('mapSvg');
  const linksG=document.getElementById('mlinks'),nodesG=document.getElementById('mnodes'),panel=document.getElementById('mpanel');
  const cap=document.getElementById('mcap'),capStep=document.getElementById('mcapStep'),capText=document.getElementById('mcapText');
  const btnPrev=document.getElementById('mPrev'),btnNext=document.getElementById('mNext'),sel=document.getElementById('scnSelect');
  const LE={}; L.forEach(l=>LE[l.id]=[l.a[0],l.b[0]]);
  const linkEls={},nodeEls={}; let curScn=null,stepIdx=0,mode=null;
  /* ---- зум и панорама: колесо мыши, перетаскивание, кнопки +/− ---- */
  const VBW=1080,VBH=700; let vb={x:0,y:0,w:VBW,h:VBH}; let mapDragged=false,mpan=null;
  function applyVB(){svgm.setAttribute('viewBox',vb.x+' '+vb.y+' '+vb.w+' '+vb.h);svgm.style.cursor=vb.w<VBW?'grab':'';}
  function clampVB(){vb.x=Math.max(0,Math.min(vb.x,VBW-vb.w));vb.y=Math.max(0,Math.min(vb.y,VBH-vb.h));}
  function zoomAt(f,px,py){
    const nw=Math.max(VBW/4,Math.min(VBW,vb.w*f)),nh=nw*VBH/VBW;
    vb.x=px-(px-vb.x)*nw/vb.w; vb.y=py-(py-vb.y)*nh/vb.h; vb.w=nw; vb.h=nh; clampVB(); applyVB();
  }
  function svgXY(e){const r=svgm.getBoundingClientRect();return [vb.x+(e.clientX-r.left)/r.width*vb.w, vb.y+(e.clientY-r.top)/r.height*vb.h];}
  svgm.addEventListener('wheel',e=>{e.preventDefault();const p=svgXY(e);zoomAt(e.deltaY>0?1.18:0.85,p[0],p[1]);},{passive:false});
  document.getElementById('mzIn').onclick=()=>zoomAt(0.8,vb.x+vb.w/2,vb.y+vb.h/2);
  document.getElementById('mzOut').onclick=()=>zoomAt(1.25,vb.x+vb.w/2,vb.y+vb.h/2);
  svgm.addEventListener('pointerdown',e=>{if(vb.w>=VBW)return;mpan={sx:e.clientX,sy:e.clientY,vx:vb.x,vy:vb.y};mapDragged=false;});
  window.addEventListener('pointermove',e=>{
    if(!mpan)return;
    const r=svgm.getBoundingClientRect();
    if(Math.abs(e.clientX-mpan.sx)+Math.abs(e.clientY-mpan.sy)>5)mapDragged=true;
    vb.x=mpan.vx-(e.clientX-mpan.sx)/r.width*vb.w; vb.y=mpan.vy-(e.clientY-mpan.sy)/r.height*vb.h;
    clampVB(); applyVB();
  });
  window.addEventListener('pointerup',()=>{mpan=null;setTimeout(()=>{mapDragged=false;},0);});
  function anchor(id,side,t){const n=N[id];t=(t===undefined)?.5:t;
    if(side==='L')return[n.x,n.y+n.h*t];if(side==='R')return[n.x+n.w,n.y+n.h*t];
    if(side==='T')return[n.x+n.w*t,n.y];return[n.x+n.w*t,n.y+n.h];}
  function cyl(x,y,w,h,ry){const rx=w/2,t=y+ry,b=y+h-ry;return `M${x},${t} L${x},${b} A${rx},${ry} 0 0 0 ${x+w},${b} L${x+w},${t} A${rx},${ry} 0 0 1 ${x},${t} Z`;}
  L.forEach(l=>{
    const[ax,ay]=anchor(...l.a),[bx,by]=anchor(...l.b);
    const cls='link'+(l.dashed?' dashed':'')+(l.rtc?' rtc':'');
    const p=l.cp?el('path',{d:`M${ax},${ay} Q${l.cp[0]},${l.cp[1]} ${bx},${by}`,class:cls,'marker-end':'url(#marrow)'})
                :el('line',{x1:ax,y1:ay,x2:bx,y2:by,class:cls,'marker-end':'url(#marrow)'});
    linkEls[l.id]=p;linksG.appendChild(p);
  });
  for(const id in N){
    const n=N[id],shape=n.shape||'rect',col=`var(${LV[n.layer]})`;
    const g=el('g',{class:'node'+(n.isnew?' isnew':'')});g.dataset.id=id;g.style.color=col;let shiftY=0;
    if(shape==='cyl'){const ry=Math.min(8,n.h*0.16);
      g.appendChild(el('path',{d:cyl(n.x,n.y,n.w,n.h,ry),class:'shape',fill:'var(--nodefill)',stroke:col,'stroke-width':1.6}));
      g.appendChild(el('ellipse',{cx:n.x+n.w/2,cy:n.y+ry,rx:n.w/2,ry:ry,class:'lid',fill:'var(--cyllid)',stroke:col,'stroke-width':1.6}));shiftY=-2;
    }else if(shape==='queue'){
      g.appendChild(el('rect',{x:n.x,y:n.y,width:n.w,height:n.h,rx:11,class:'shape',fill:'var(--nodefill)',stroke:col,'stroke-width':1.6}));
      [0.32,0.5,0.68].forEach(f=>{const lx=n.x+n.w*f;g.appendChild(el('line',{x1:lx,y1:n.y+9,x2:lx,y2:n.y+n.h-9,class:'qline'}));});
    }else{
      g.appendChild(el('rect',{x:n.x,y:n.y,width:n.w,height:n.h,rx:11,class:'shape',fill:'var(--nodefill)',stroke:col,'stroke-width':1.6}));
      if(n.layer==='client')g.appendChild(el('rect',{x:n.x+9,y:n.y+5,width:n.w-18,height:4,rx:2,class:'titlebar',fill:col}));
    }
    const cy=n.y+n.h/2+shiftY;
    const t1=el('text',{x:n.x+n.w/2,y:cy-9,'text-anchor':'middle',class:'label'});t1.textContent=n.label;
    const t2=el('text',{x:n.x+n.w/2,y:cy+5,'text-anchor':'middle',class:'sub'});t2.textContent=n.sub;
    const t3=el('text',{x:n.x+n.w/2,y:cy+18,'text-anchor':'middle',class:'tech'});t3.textContent=n.tech;
    g.appendChild(t1);g.appendChild(t2);g.appendChild(t3);
    g.addEventListener('click',e=>{e.stopPropagation();if(mapDragged)return;selectNode(id);});
    nodeEls[id]=g;nodesG.appendChild(g);
  }
  document.getElementById('mlegend').innerHTML=Object.keys(LV).map(k=>`<span><i style="background:var(${LV[k]})"></i>${LN[k]}</span>`).join('')+'<span>⬭ хранилище · ▥ очередь · ▔ клиент</span>';
  let opts='<option value="">— выбери прогон —</option>';
  CATS.forEach(cat=>{opts+=`<optgroup label="${cat}">`+SCN.filter(s=>s.cat===cat).map(s=>`<option value="${s.id}">${s.n}. ${s.title}</option>`).join('')+'</optgroup>';});
  sel.innerHTML=opts;
  sel.onchange=()=>{sel.value?startScenario(sel.value):fullReset();};
  function clearC(){
    for(const id in nodeEls)nodeEls[id].classList.remove('dim','hl','active','sel','act-status','act-rtc');
    for(const id in linkEls){linkEls[id].classList.remove('dim','active','statusline','rtcline');linkEls[id].setAttribute('marker-end','url(#marrow)');}
    cap.classList.remove('rtc');
  }
  function fullReset(){mode=null;curScn=null;stepIdx=0;clearC();cap.classList.remove('show');sel.value='';
    panel.classList.add('show');panel.style.cssText='';
    panel.innerHTML='<p class="mhint">Кликни по компоненту — что он делает и зачем. Или выбери <b>сценарий</b> и листай шаги стрелками ← →. Колесо мыши — зум, перетаскивание — обзор.</p>';
    vb={x:0,y:0,w:VBW,h:VBH};applyVB();}
  function selectNode(id){mode='node';clearC();cap.classList.remove('show');sel.value='';
    panel.classList.add('show');
    nodeEls[id].classList.add('sel');const n=N[id],i=INFO[id];
    panel.innerHTML=`<button class="mclose" title="Закрыть">×</button>
      <span class="tag">${LN[n.layer]}</span><h3>${n.label}</h3><div class="secref">${i.sec}</div>
      <div class="row"><b>Что делает</b><span>${i.what}</span></div>
      <div class="row"><b>Зачем нужен</b><span>${i.why}</span></div>
      <div class="row"><b>Технологии</b><span>${n.tech}</span></div>`;
    panel.querySelector('.mclose').onclick=fullReset;
    // карточка встаёт рядом с кликнутым узлом: справа, если не влезает — слева/в границах
    const br=document.querySelector('.mapboard').getBoundingClientRect();
    const nr=nodeEls[id].getBoundingClientRect();
    const pw=320;let px=nr.right-br.left+12;
    if(px+pw+12>br.width)px=nr.left-br.left-pw-12;
    px=Math.max(12,Math.min(px,br.width-pw-12));
    let py=nr.top-br.top-4;
    panel.style.cssText=`left:${px}px;top:${py}px;width:${pw}px;`;
    py=Math.min(py,br.height-panel.offsetHeight-12);
    panel.style.top=Math.max(12,py)+'px';}
  function startScenario(id){mode='scn';curScn=SCN.find(s=>s.id===id);stepIdx=0;clearC();cap.classList.add('show');
    panel.classList.remove('show'); // контекст сценария живёт в полосе шагов
    renderStep();}
  function renderStep(){const steps=curScn.steps,st=steps[stepIdx];
    for(const id in nodeEls){nodeEls[id].classList.remove('hl','active','sel','act-status','act-rtc');nodeEls[id].classList.add('dim');}
    for(const id in linkEls){linkEls[id].classList.remove('active','statusline','rtcline');linkEls[id].classList.add('dim');linkEls[id].setAttribute('marker-end','url(#marrow)');}
    st.nodes.forEach(id=>{const e=nodeEls[id];if(!e)return;e.classList.remove('dim');e.classList.add('active');if(st.status)e.classList.add('act-status');if(st.rtc)e.classList.add('act-rtc');});
    st.links.forEach(id=>{const l=linkEls[id];if(!l)return;l.classList.remove('dim');l.classList.add('active');if(st.status)l.classList.add('statusline');if(st.rtc)l.classList.add('rtcline');l.setAttribute('marker-end','url(#marrowA)');
      const e=LE[id];if(e)e.forEach(nn=>{const ne=nodeEls[nn];if(ne)ne.classList.remove('dim');});});
    cap.classList.toggle('rtc',!!st.rtc);
    capStep.textContent=`${curScn.title} · шаг ${stepIdx+1} / ${steps.length}`;capText.textContent=st.cap;
    btnPrev.disabled=stepIdx===0;btnNext.disabled=stepIdx===steps.length-1;}
  btnNext.onclick=()=>{if(curScn&&stepIdx<curScn.steps.length-1){stepIdx++;renderStep();}};
  btnPrev.onclick=()=>{if(curScn&&stepIdx>0){stepIdx--;renderStep();}};
  document.getElementById('mScnClose').onclick=fullReset;
  document.getElementById('mReset').onclick=fullReset;
  svgm.addEventListener('click',()=>{if(mapDragged)return;if(mode==='node')fullReset();});
  document.addEventListener('keydown',e=>{
    if(!document.getElementById('view-map').classList.contains('on')||!curScn)return;
    if(e.key==='ArrowRight'){e.preventDefault();if(stepIdx<curScn.steps.length-1){stepIdx++;renderStep();}}
    else if(e.key==='ArrowLeft'){e.preventDefault();if(stepIdx>0){stepIdx--;renderStep();}}
  });
  fullReset();
})();

/* ==================== INIT ==================== */
initStaticIcons(); renderLevels(); startLevel(); renderCardsSide(); renderToc(); renderDashboard();
applyHash();
