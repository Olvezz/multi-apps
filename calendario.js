// calendario.js — Lógica completa del Calendario con IA

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const FB = initializeApp({
  apiKey:"AIzaSyDjA2H9b6Ec7CUpUppQGFcacJRtDVrYz74",
  authDomain:"olvezz-finanzas.firebaseapp.com",
  projectId:"olvezz-finanzas",
  storageBucket:"olvezz-finanzas.firebasestorage.app",
  messagingSenderId:"16267383608",
  appId:"1:16267383608:web:17f5dd9180f26ea7d067cd"
});
const auth = getAuth(FB);
const db = getFirestore(FB);

// ─── CONSTANTS ────────────────────────────────────────────────────────────
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

const CAL_TYPES = [
  { val:'gym',    label:'💪 Gimnasio / Rutinas',        color:'#ff6584', cls:'col-gym',  bgcls:'bg-gym' },
  { val:'work',   label:'💼 Trabajo / Tareas',           color:'#6c63ff', cls:'col-work', bgcls:'bg-work' },
  { val:'cook',   label:'🍳 Cocina / Menú semanal',      color:'#f5a623', cls:'col-cook', bgcls:'bg-cook' },
  { val:'shop',   label:'🛒 Lista de compras',           color:'#3dd68c', cls:'col-shop', bgcls:'bg-shop' },
  { val:'gen',    label:'📋 General / Personal',         color:'#9999b8', cls:'col-gen',  bgcls:'bg-gen'  },
];

// Wizard questions per calendar type
const WIZARD_QUESTIONS = {
  gym: {
    q2: { title:'¿Cuántos días puedes entrenar por semana?', sub:'Sé realista con tu disponibilidad.', type:'chips', opts:['2 días','3 días','4 días','5 días','6 días'] },
    q3: { title:'¿Cuál es tu objetivo principal?', sub:'La IA adaptará las rutinas a esto.', type:'chips', opts:['💪 Ganar músculo','🔥 Perder grasa','⚡ Mejorar resistencia','🧘 Bienestar general','🏃 Cardio y movilidad'] }
  },
  work: {
    q2: { title:'¿Cuántos días trabajas por semana?', sub:'', type:'chips', opts:['Lunes a viernes','Lunes a sábado','Solo fines de semana','Variable'] },
    q3: { title:'¿Qué tipo de tareas quieres gestionar?', sub:'Puedes elegir varias.', type:'chips_multi', opts:['📋 Tareas pendientes','📞 Reuniones y llamadas','⏰ Recordatorios','📊 Proyectos','🎯 Metas semanales'] }
  },
  cook: {
    q2: { title:'¿Para cuántas personas cocinas?', sub:'', type:'chips', opts:['Solo yo','2 personas','3-4 personas','5 o más'] },
    q3: { title:'¿Qué tipo de comida prefieres?', sub:'La IA sugerirá recetas acordes.', type:'chips_multi', opts:['🥗 Saludable / fitness','🍗 Tradicional / casera','🌱 Vegetariana / vegana','🍕 Internacional','🍱 Rápida y fácil'] }
  },
  shop: {
    q2: { title:'¿Cada cuánto sueles hacer compras?', sub:'', type:'chips', opts:['Cada semana','Cada 2 semanas','Cada mes','Según necesito'] },
    q3: { title:'¿Qué categorías compras más?', sub:'', type:'chips_multi', opts:['🥦 Frutas y verduras','🥩 Carnes y proteínas','🥛 Lácteos','🧴 Limpieza y hogar','🍫 Snacks y antojos'] }
  },
  gen: {
    q2: { title:'¿Qué quieres organizar en este calendario?', sub:'Descríbelo brevemente.', type:'text', placeholder:'Ej: Mis citas médicas, eventos familiares...' },
    q3: { title:'¿Con qué frecuencia agregas eventos?', sub:'', type:'chips', opts:['Todos los días','Varias veces por semana','Semanalmente','Ocasionalmente'] }
  }
};

// ─── STATE ────────────────────────────────────────────────────────────────
let user = null, unsub = null;
let calendars = [];   // [{id, name, type, color, cls, bgcls, events:{}}]
let activeCalId = null;
let currentDate = new Date();
let selectedDate = null;
let wizState = { type:null, q2ans:[], q3ans:[], days:[], timeSlot:'', step:1, title:'' };
let addEventDate = null;
let delCalTarget = null;

// ─── HELPERS ──────────────────────────────────────────────────────────────
window.openOv = id => document.getElementById(id).classList.add('on');
window.closeOv = id => document.getElementById(id).classList.remove('on');

function dateKey(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

function getActiveCal() { return calendars.find(c => c.id === activeCalId); }

// calColor/calCls/calBgcls defined above with CAL_TYPES

// ─── AUTH ──────────────────────────────────────────────────────────────────
getRedirectResult(auth).catch(()=>{});

onAuthStateChanged(auth, async u => {
  if(u) {
    user = u;
    const av = document.getElementById('user-av');
    av.innerHTML = u.photoURL ? `<img src="${u.photoURL}" style="width:100%;height:100%;object-fit:cover">` : (u.displayName?.[0]?.toUpperCase()||'?');
    listenCalendars();
  } else {
    // Redirect to hub for login
    window.location.href = 'index.html';
  }
});

// ─── FIRESTORE ─────────────────────────────────────────────────────────────
function listenCalendars() {
  if(unsub) unsub();
  const ref = collection(db, 'users', user.uid, 'calendars');
  unsub = onSnapshot(ref, snap => {
    calendars = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    if(!activeCalId && calendars.length) activeCalId = calendars[0].id;
    renderTabs();
    renderMonth();
    if(selectedDate) renderDayDetail(selectedDate);
  });
}

async function saveCalendar(cal) {
  const ref = doc(db, 'users', user.uid, 'calendars', cal.id);
  await setDoc(ref, cal);
}

async function deleteCalendar(id) {
  await deleteDoc(doc(db, 'users', user.uid, 'calendars', id));
}

// ─── TABS ──────────────────────────────────────────────────────────────────
function renderTabs() {
  const ct = document.getElementById('cal-tabs');
  // Clear except the + button
  [...ct.children].forEach(c => { if(c.id !== 'btn-add-cal') c.remove(); });
  const addBtn = document.getElementById('btn-add-cal');

  calendars.forEach(cal => {
    const tab = document.createElement('button');
    tab.className = 'cal-tab' + (cal.id === activeCalId ? ' on' : '');
    tab.innerHTML = `<div class="tab-dot" style="background:${calColor(cal.type)}"></div>${cal.name}`;
    tab.onclick = () => { activeCalId = cal.id; renderTabs(); renderMonth(); if(selectedDate) renderDayDetail(selectedDate); };
    // Long press to delete
    let tmr = null;
    tab.addEventListener('touchstart', () => { tmr = setTimeout(() => askDeleteCal(cal), 600); }, {passive:true});
    tab.addEventListener('touchend', () => clearTimeout(tmr));
    tab.addEventListener('mousedown', () => { tmr = setTimeout(() => askDeleteCal(cal), 600); });
    tab.addEventListener('mouseup', () => clearTimeout(tmr));
    ct.insertBefore(tab, addBtn);
  });
}

function askDeleteCal(cal) {
  delCalTarget = cal;
  document.getElementById('del-cal-sub').textContent = `"${cal.name}" y todos sus eventos serán eliminados.`;
  openOv('del-cal-ov');
}

document.getElementById('del-cal-ok').onclick = async () => {
  if(!delCalTarget) return;
  closeOv('del-cal-ov');
  await deleteCalendar(delCalTarget.id);
  if(activeCalId === delCalTarget.id) activeCalId = calendars[0]?.id || null;
  delCalTarget = null;
};

// ─── MONTH GRID ────────────────────────────────────────────────────────────
function renderMonth() {
  document.getElementById('month-title').textContent = `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  const grid = document.getElementById('cal-grid');
  // Remove day cells (keep DOW headers = first 7 children)
  while(grid.children.length > 7) grid.removeChild(grid.lastChild);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month+1, 0);
  // Monday-based week: 0=Mon...6=Sun
  let startDow = firstDay.getDay() - 1;
  if(startDow < 0) startDow = 6;

  const today = new Date();
  const todayKey = dateKey(today);
  const selectedKey = selectedDate ? dateKey(selectedDate) : null;

  // Get all events for active calendar
  const cal = getActiveCal();
  const events = cal?.events || {};

  // Fill leading empty cells
  for(let i = 0; i < startDow; i++) {
    const prev = new Date(year, month, -startDow+i+1);
    addDayCell(grid, prev, true, events, todayKey, selectedKey);
  }
  // Fill month days
  for(let d = 1; d <= lastDay.getDate(); d++) {
    addDayCell(grid, new Date(year, month, d), false, events, todayKey, selectedKey);
  }
  // Fill trailing cells to complete grid
  const total = startDow + lastDay.getDate();
  const trailing = total % 7 === 0 ? 0 : 7 - (total % 7);
  for(let i = 1; i <= trailing; i++) {
    addDayCell(grid, new Date(year, month+1, i), true, events, todayKey, selectedKey);
  }
}

function addDayCell(grid, date, otherMonth, events, todayKey, selectedKey) {
  const key = dateKey(date);
  const dayEvents = events[key] || [];
  // Also check recurring events
  const recurringEvents = getAllEventsForDate(date, events);

  const cell = document.createElement('div');
  cell.className = 'cal-day' +
    (key === todayKey ? ' today' : '') +
    (key === selectedKey ? ' selected' : '') +
    (otherMonth ? ' other-month' : '');

  const numEl = document.createElement('div');
  numEl.className = 'cal-day-num';
  numEl.textContent = date.getDate();
  cell.appendChild(numEl);

  if(recurringEvents.length) {
    const dotsEl = document.createElement('div');
    dotsEl.className = 'cal-day-dots';
    recurringEvents.slice(0,4).forEach(ev => {
      const dot = document.createElement('div');
      dot.className = 'cal-dot';
      dot.style.background = getActiveCal() ? calColor(getActiveCal().type) : '#6c63ff';
      dotsEl.appendChild(dot);
    });
    cell.appendChild(dotsEl);
  }

  cell.onclick = () => {
    selectedDate = date;
    renderMonth();
    renderDayDetail(date);
  };
  grid.appendChild(cell);
}

// Get events for a date including recurring
function getAllEventsForDate(date, events) {
  const key = dateKey(date);
  const direct = events[key] || [];
  const dow = date.getDay(); // 0=Sun...6=Sat
  const dayOfMonth = date.getDate();

  // Find recurring events
  const recurring = [];
  Object.values(events).forEach(dayEvs => {
    (dayEvs || []).forEach(ev => {
      if(!ev.repeat || ev.repeat === 'none') return;
      const evDate = new Date(ev.date);
      if(dateKey(evDate) === key) return; // already in direct
      if(ev.repeat === 'weekly' && evDate.getDay() === dow && evDate <= date) recurring.push(ev);
      if(ev.repeat === 'daily' && evDate <= date) recurring.push(ev);
      if(ev.repeat === 'monthly' && evDate.getDate() === dayOfMonth && evDate <= date) recurring.push(ev);
    });
  });
  return [...direct, ...recurring];
}

// ─── MONTH NAVIGATION ──────────────────────────────────────────────────────
document.getElementById('btn-prev-month').onclick = () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1);
  selectedDate = null;
  renderMonth();
  document.getElementById('day-detail-wrap').innerHTML = '';
};
document.getElementById('btn-next-month').onclick = () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1);
  selectedDate = null;
  renderMonth();
  document.getElementById('day-detail-wrap').innerHTML = '';
};

// ─── DAY DETAIL ────────────────────────────────────────────────────────────
function renderDayDetail(date) {
  const wrap = document.getElementById('day-detail-wrap');
  const cal = getActiveCal();
  if(!cal) { wrap.innerHTML = '<div class="empty">📅<br>Crea un calendario primero</div>'; return; }

  const key = dateKey(date);
  const allEvents = getAllEventsForDate(date, cal.events||{});
  const color = calColor(cal.type);
  const dayLabel = `${DAYS[(date.getDay()+6)%7]}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`;

  let html = `<div class="day-detail">
    <div class="day-detail-header">
      <div class="day-detail-title">${dayLabel}</div>
      <button class="day-add-btn" onclick="openAddEvent('${key}')">+ Evento</button>
    </div>`;

  if(!allEvents.length) {
    html += `<div style="text-align:center;padding:20px;color:var(--text2);font-size:14px">Sin eventos · toca + para agregar</div>`;
  } else {
    allEvents.forEach((ev, i) => {
      const isDone = ev.done;
      html += `<div class="event-item" style="cursor:pointer" onclick="openEditEvent('${key}',${i})">
        <div class="event-color" style="background:${color}"></div>
        <div class="event-info">
          <div class="event-name" style="${isDone?'text-decoration:line-through;opacity:.5':''}">${ev.name}</div>
          ${ev.time ? `<div class="event-time">🕐 ${ev.time}${ev.repeat&&ev.repeat!=='none'?' · 🔁':''}</div>` : ''}
          ${ev.notes ? `<div class="event-time">📝 ${ev.notes}</div>` : ''}
        </div>
        <div class="event-check ${isDone?'done':''}" onclick="event.stopPropagation();toggleEventDone('${key}',${i})">
          ${isDone?'✓':''}
        </div>
        <button class="event-del" onclick="event.stopPropagation();deleteEvent('${key}',${i})">🗑️</button>
      </div>`;
    });
  }
  html += '</div>';
  wrap.innerHTML = html;
}

// ─── ADD EVENT ─────────────────────────────────────────────────────────────
window.openAddEvent = function(dateKey) {
  addEventDate = dateKey;
  const cal = getActiveCal();
  document.getElementById('event-ov-title').textContent = `Nuevo evento · ${cal?.name||''}`;
  document.getElementById('ev-name').value = '';
  document.getElementById('ev-time').value = '';
  document.getElementById('ev-notes').value = '';
  document.getElementById('ev-repeat').value = 'none';
  openOv('event-ov');
  setTimeout(() => document.getElementById('ev-name').focus(), 100);
};

document.getElementById('ev-save').onclick = async () => {
  const name = document.getElementById('ev-name').value.trim();
  if(!name) { document.getElementById('ev-name').style.borderColor='var(--red)'; return; }
  const cal = getActiveCal();
  if(!cal) return;
  const ev = {
    name,
    time: document.getElementById('ev-time').value || null,
    notes: document.getElementById('ev-notes').value.trim() || null,
    repeat: document.getElementById('ev-repeat').value,
    date: addEventDate,
    done: false
  };
  if(!cal.events) cal.events = {};
  if(!cal.events[addEventDate]) cal.events[addEventDate] = [];
  cal.events[addEventDate].push(ev);
  await saveCalendar(cal);
  closeOv('event-ov');
};

window.toggleEventDone = async (key, idx) => {
  const cal = getActiveCal();
  if(!cal?.events?.[key]?.[idx]) return;
  cal.events[key][idx].done = !cal.events[key][idx].done;
  await saveCalendar(cal);
};

window.deleteEvent = async (key, idx) => {
  const cal = getActiveCal();
  if(!cal?.events?.[key]) return;
  cal.events[key].splice(idx, 1);
  await saveCalendar(cal);
};

let editEvKey = null, editEvIdx = null;

window.openEditEvent = function(key, idx) {
  const cal = getActiveCal();
  if(!cal?.events?.[key]?.[idx]) return;
  const ev = cal.events[key][idx];
  editEvKey = key; editEvIdx = idx;
  document.getElementById('edit-ev-name').value = ev.name||'';
  document.getElementById('edit-ev-time').value = ev.time||'';
  document.getElementById('edit-ev-notes').value = ev.notes||'';
  document.getElementById('edit-ev-repeat').value = ev.repeat||'none';
  openOv('edit-ev-ov');
};

document.getElementById('edit-ev-save').onclick = async () => {
  const cal = getActiveCal();
  if(!cal?.events?.[editEvKey]?.[editEvIdx] === undefined) return;
  cal.events[editEvKey][editEvIdx] = {
    ...cal.events[editEvKey][editEvIdx],
    name: document.getElementById('edit-ev-name').value.trim(),
    time: document.getElementById('edit-ev-time').value||null,
    notes: document.getElementById('edit-ev-notes').value.trim()||null,
    repeat: document.getElementById('edit-ev-repeat').value,
  };
  await saveCalendar(cal);
  closeOv('edit-ev-ov');
};

document.getElementById('edit-ev-del').onclick = async () => {
  const cal = getActiveCal();
  if(!cal?.events?.[editEvKey]) return;
  cal.events[editEvKey].splice(editEvIdx, 1);
  await saveCalendar(cal);
  closeOv('edit-ev-ov');
};

// ─── WIZARD ────────────────────────────────────────────────────────────────
document.getElementById('btn-add-cal').onclick = () => {
  wizState = { type:null, q2ans:null, q3ans:[], step:1 };
  document.querySelectorAll('.wizard-step').forEach(s => { s.classList.remove('on'); });
  document.getElementById('wiz-1').classList.add('on');
  document.getElementById('wiz-title').textContent = 'Nuevo calendario';
  buildWizTypeOpts();
  renderWizDots(1, 4);
  openOv('wizard-ov');
};

function buildWizTypeOpts() {
  const ct = document.getElementById('wiz-type-opts');
  ct.innerHTML = '';

  // Title input for custom name
  const titleWrap = document.createElement('div');
  titleWrap.innerHTML = `<div style="font-size:13px;color:var(--text2);margin-bottom:8px">Nombre del calendario (opcional)</div>
    <input class="ti" id="wiz-title-inp" type="text" placeholder="Ej: Gimnasio, Mi trabajo, Menú semanal..." style="margin-bottom:16px"/>`;
  ct.appendChild(titleWrap);
  setTimeout(()=>{
    const inp = document.getElementById('wiz-title-inp');
    if(inp) inp.oninput = () => { wizState.title = inp.value.trim(); };
  }, 50);

  // Type options
  const typeLabel = document.createElement('div');
  typeLabel.style.cssText = 'font-size:13px;color:var(--text2);margin-bottom:8px';
  typeLabel.textContent = 'Tipo de calendario';
  ct.appendChild(typeLabel);

  // Group types
  const groups = {};
  CAL_TYPES.forEach(t => {
    if(!groups[t.group]) groups[t.group] = [];
    groups[t.group].push(t);
  });
  Object.entries(groups).forEach(([grp, types]) => {
    const grpHdr = document.createElement('div');
    grpHdr.style.cssText = 'font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;padding:12px 0 6px;font-weight:600';
    grpHdr.textContent = grp;
    ct.appendChild(grpHdr);
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:4px';
    types.forEach(t => {
      const b = document.createElement('button');
      b.style.cssText = `padding:8px 14px;background:var(--bg3);border:1px solid var(--border);border-radius:20px;font-size:14px;cursor:pointer;color:var(--text);transition:all .15s;border-left:3px solid ${t.color}`;
      b.textContent = t.label;
      b.onmouseover = () => { b.style.background='var(--bg4)'; };
      b.onmouseout = () => { b.style.background='var(--bg3)'; };
      b.onclick = () => {
        wizState.type = t.val;
        const titleInp = document.getElementById('wiz-title-inp');
        if(titleInp?.value.trim()) wizState.title = titleInp.value.trim();
        else wizState.title = t.label.split(' ').slice(1).join(' ');
        goWizStep(2);
      };
      row.appendChild(b);
    });
    ct.appendChild(row);
  });
}

function renderWizDots(current, total) {
  const ct = document.getElementById('wiz-dots');
  ct.innerHTML = '';
  for(let i=1;i<=total;i++) {
    const d = document.createElement('div');
    d.className = 'sd2' + (i===current?' on':'');
    ct.appendChild(d);
  }
}

function goWizStep(n) {
  document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('on'));
  document.getElementById('wiz-'+n).classList.add('on');
  wizState.step = n;
  renderWizDots(n, 4);
  if(n === 2) buildWizQ(2);
  if(n === 3) buildWizQ(3);
  if(n === 4) runAI();
}

function buildWizQ(stepNum) {
  const qKey = `q${stepNum}`;
  const q = WIZARD_QUESTIONS[wizState.type]?.[qKey];
  if(!q) { goWizStep(stepNum+1); return; }

  document.getElementById(`wiz-q${stepNum>2?'3':''}-title`).textContent = q.title;
  document.getElementById(`wiz-q${stepNum>2?'3':''}-sub`).textContent = q.sub || '';

  const ct = document.getElementById(stepNum===2 ? 'wiz-q-content' : 'wiz-q3-content');
  ct.innerHTML = '';

  if(q.type === 'chips' || q.type === 'chips_multi') {
    const grid = document.createElement('div');
    grid.className = 'chip-grid';
    q.opts.forEach(opt => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.textContent = opt;
      chip.onclick = () => {
        if(q.type === 'chips') {
          grid.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
          chip.classList.add('on');
          if(stepNum === 2) wizState.q2ans = opt;
          else wizState.q3ans = [opt];
        } else {
          chip.classList.toggle('on');
          const sel = [...grid.querySelectorAll('.chip.on')].map(c => c.textContent);
          if(stepNum === 2) wizState.q2ans = sel;
          else wizState.q3ans = sel;
        }
      };
      grid.appendChild(chip);
    });
    ct.appendChild(grid);
  } else if(q.type === 'text') {
    const inp = document.createElement('input');
    inp.className = 'ti';
    inp.placeholder = q.placeholder || '';
    inp.oninput = () => {
      if(stepNum === 2) wizState.q2ans = inp.value;
      else wizState.q3ans = [inp.value];
    };
    ct.appendChild(inp);
  }
}

document.getElementById('wiz-next-2').onclick = () => goWizStep(3);
document.getElementById('wiz-next-3').onclick = () => goWizStep(4);
document.getElementById('wiz-skip-ai').onclick = async () => {
  closeOv('wizard-ov');
  await finishWizard([]);
};
document.getElementById('wiz-finish').onclick = () => {
  const included = [...document.querySelectorAll('.suggestion-card:not(.applied)')];
  finishWizard(included.map(s => ({
    name: s.dataset.name,
    time: s.dataset.time||null,
    notes: s.dataset.notes||null,
    repeat: s.dataset.repeat||'none'
  })));
};

async function runAI() {
  const ct = document.getElementById('wiz-ai-content');
  const finBtn = document.getElementById('wiz-finish');
  finBtn.style.display = 'none';
  ct.innerHTML = '<div class="ai-typing"><span></span><span></span><span></span></div>';

  const typeInfo = CAL_TYPES.find(t => t.val === wizState.type);
  let prompt;
  try { prompt = buildAIPrompt(); }
  catch(e) {
    console.warn('buildAIPrompt failed, using fallback:', e);
    prompt = `Tipo de calendario: ${typeInfo?.label||'General'}. Sugiere 6 eventos prácticos.`;
  }
  const systemPrompt = `Eres un asistente experto en planificación personal. El usuario está configurando un calendario de tipo "${typeInfo?.label}". 
Responde SOLO en JSON con este formato exacto, sin markdown ni texto extra:
{"intro":"Frase motivadora de 1-2 oraciones","suggestions":[{"name":"Nombre del evento","time":"HH:MM o null","notes":"detalle o null","repeat":"weekly/daily/none"}]}
Genera entre 5 y 8 sugerencias concretas y personalizadas.`;

  // Use allorigins CORS proxy to reach Anthropic API
  const apiUrl = 'https://api.anthropic.com/v1/messages';
  const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(apiUrl);

  try {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if(!res.ok) throw new Error('API error: ' + res.status);
    const data = await res.json();
    const text = data.content?.map(i => i.text||'').join('') || '';
    const clean = text.replace(/```json|```/g,'').trim();
    const parsed = JSON.parse(clean);
    renderAISuggestions(parsed, typeInfo);

  } catch(e) {
    console.warn('AI API failed, using local suggestions:', e);
    try {
      const parsed = generateLocalSuggestions(wizState.type, wizState.q2ans, wizState.q3ans);
      renderAISuggestions(parsed, typeInfo);
    } catch(e2) {
      console.error('Local fallback also failed:', e2);
      const ct2 = document.getElementById('wiz-ai-content');
      if(ct2) ct2.innerHTML = '<div class="ai-bubble"><p>No se pudieron cargar sugerencias. Usa "Crear sin sugerencias".</p></div>';
    }
  }
}

function generateLocalSuggestions(type, q2, q3) {
  const suggestions = {
    gym: [
      {name:'Calentamiento 10 min', time:'07:00', notes:'Movilidad articular', repeat:'weekly'},
      {name:'Press de banca', time:'07:10', notes:'4 series x 10 reps', repeat:'weekly'},
      {name:'Sentadillas', time:'07:30', notes:'4 series x 12 reps', repeat:'weekly'},
      {name:'Peso muerto', time:'07:50', notes:'3 series x 8 reps', repeat:'weekly'},
      {name:'Cardio 20 min', time:'08:10', notes:'Caminata inclinada o bicicleta', repeat:'weekly'},
      {name:'Abdominales', time:'08:35', notes:'3 series x 20 reps', repeat:'weekly'},
    ],
    work: [
      {name:'Revisar correos', time:'08:00', notes:'Priorizar urgentes', repeat:'daily'},
      {name:'Bloque de trabajo profundo', time:'09:00', notes:'Sin distracciones 90 min', repeat:'daily'},
      {name:'Reunión de equipo', time:'10:30', notes:'Revisión semanal', repeat:'weekly'},
      {name:'Planificación del día siguiente', time:'17:00', notes:'Lista de tareas', repeat:'daily'},
      {name:'Revisión de metas semanales', time:'17:30', notes:'Viernes', repeat:'weekly'},
    ],
    cook: [
      {name:'Pollo al horno con vegetales', time:'12:00', notes:'Para 2 personas', repeat:'weekly'},
      {name:'Arroz con habichuelas', time:'12:00', notes:'Tradicional dominicano', repeat:'weekly'},
      {name:'Ensalada fresca', time:'12:30', notes:'Lechuga, tomate, aguacate', repeat:'daily'},
      {name:'Sancocho', time:'11:00', notes:'Para el fin de semana', repeat:'weekly'},
      {name:'Preparar meriendas', time:'08:00', notes:'Fruta y yogur', repeat:'daily'},
    ],
    shop: [
      {name:'Compra semanal supermercado', time:'10:00', notes:'Lista completa', repeat:'weekly'},
      {name:'Revisar despensa', time:'09:00', notes:'Antes de ir a comprar', repeat:'weekly'},
      {name:'Frutas y verduras frescas', time:'10:30', notes:'Mercado o colmado', repeat:'weekly'},
    ],
    gen: [
      {name:'Revisión semanal personal', time:'09:00', notes:'Domingos', repeat:'weekly'},
      {name:'Llamar a familia', time:'18:00', notes:'Fin de semana', repeat:'weekly'},
      {name:'Ejercicio 30 min', time:'07:00', notes:'Mañanas', repeat:'daily'},
      {name:'Lectura antes de dormir', time:'21:30', notes:'20-30 minutos', repeat:'daily'},
    ]
  };
  const intros = {
    gym: 'Con constancia y disciplina lograrás tus metas. Aquí tienes una rutina para empezar.',
    work: 'La productividad es cuestión de hábitos. Estos bloques te ayudarán a organizarte mejor.',
    cook: 'Comer bien en casa es más fácil cuando tienes un plan. Aquí van algunas ideas.',
    shop: 'Una lista organizada te ahorra tiempo y dinero. Aquí tienes un punto de partida.',
    gen: 'Organizar tu tiempo es el primer paso hacia una vida más equilibrada.'
  };
  // Generic suggestions for types not explicitly defined
  const genericSugs = [
    {name:'Revisar tareas pendientes', time:'09:00', notes:'Lista del día', repeat:'daily'},
    {name:'Bloque de trabajo', time:'10:00', notes:'90 minutos de foco', repeat:'weekly'},
    {name:'Revisión semanal', time:'09:00', notes:'Domingos', repeat:'weekly'},
    {name:'Meta de la semana', time:'08:00', notes:'Lunes', repeat:'weekly'},
  ];
  return {
    intro: intros[type] || 'Aquí tienes algunas sugerencias para organizar tu calendario.',
    suggestions: suggestions[type] || genericSugs
  };
}

function renderAISuggestions(parsed, typeInfo) {
  const ct = document.getElementById('wiz-ai-content');
  const finBtn = document.getElementById('wiz-finish');
  ct.innerHTML = '';

  const bubble = document.createElement('div');
  bubble.className = 'ai-bubble';
  bubble.innerHTML = `<p>✨ ${parsed.intro}</p>`;
  ct.appendChild(bubble);

  const sugTitle = document.createElement('div');
  sugTitle.style.cssText = 'font-size:13px;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;margin-top:16px';
  sugTitle.textContent = 'Eventos sugeridos';
  ct.appendChild(sugTitle);

  const color = calColor(wizState.type);
  (parsed.suggestions||[]).forEach(sug => {
    const card = document.createElement('div');
    card.className = 'suggestion-card';
    card.dataset.name = sug.name;
    card.dataset.time = sug.time||'';
    card.dataset.notes = sug.notes||'';
    card.dataset.repeat = sug.repeat||'none';
    card.innerHTML = `
      <div class="sug-ico" style="color:${color}">${typeInfo?.label.split(' ')[0]||'📅'}</div>
      <div class="sug-info">
        <div class="sug-name">${sug.name}</div>
        <div class="sug-detail">${sug.time&&sug.time!=='null'?sug.time:'Sin hora'}${sug.notes&&sug.notes!=='null'?' · '+sug.notes:''}${sug.repeat&&sug.repeat!=='none'?' · 🔁':''}</div>
      </div>
      <button class="sug-add" onclick="removeSuggestion(this)">✓ Incluir</button>`;
    ct.appendChild(card);
  });

  finBtn.style.display = 'block';
}

window.removeSuggestion = function(btn) {
  const card = btn.closest('.suggestion-card');
  card.classList.toggle('applied');
  btn.textContent = card.classList.contains('applied') ? '+ Agregar' : '✓ Incluir';
};

function buildAIPrompt() {
  const typeInfo = CAL_TYPES.find(t => t.val === wizState.type);
  const q = WIZARD_QUESTIONS[wizState.type];
  const DAY_NAMES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const q2arr = Array.isArray(wizState.q2ans) ? wizState.q2ans : (wizState.q2ans ? [wizState.q2ans] : []);
  const q3arr = Array.isArray(wizState.q3ans) ? wizState.q3ans : (wizState.q3ans ? [wizState.q3ans] : []);
  const days = q2arr.filter(a => DAY_NAMES.includes(a));
  const prefs = [...q2arr,...q3arr].filter(a => !DAY_NAMES.includes(a));
  let prompt = `Tipo de calendario: ${typeInfo?.label}\n`;
  if(wizState.title) prompt += `Nombre del calendario: ${wizState.title}\n`;
  if(days.length) prompt += `Días disponibles: ${days.join(', ')}\n`;
  if(prefs.length) prompt += `Preferencias y horario: ${prefs.join(', ')}\n`;
  prompt += `Genera sugerencias concretas con horarios específicos basados en los días y preferencias indicados. Si son días de gimnasio, incluye ejercicios reales. Si es cocina, incluye recetas reales. Asigna horarios coherentes con las preferencias.`;
  return prompt;
}

async function finishWizard(suggestions) {
  const typeInfo = CAL_TYPES.find(t => t.val === wizState.type);
  const calName = wizState.title || typeInfo?.label.split(' ').slice(1).join(' ') || 'Mi calendario';
  const calId = 'cal_' + Date.now();
  const events = {};

  // Extract days and time from wizard answers
  const DAY_NAMES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const q2safe = Array.isArray(wizState.q2ans) ? wizState.q2ans : (wizState.q2ans ? [wizState.q2ans] : []);
  const q3safe = Array.isArray(wizState.q3ans) ? wizState.q3ans : (wizState.q3ans ? [wizState.q3ans] : []);
  const selectedDays = q2safe.filter(a => DAY_NAMES.includes(a));
  const timeHints = [...q2safe,...q3safe].filter(a => a.includes('am')||a.includes('pm'));
  let defaultTime = null;
  if(timeHints.length) {
    if(timeHints[0].includes('6-9')||timeHints[0].includes('7-9')||timeHints[0].includes('8-12')) defaultTime='07:00';
    else if(timeHints[0].includes('12-2')||timeHints[0].includes('1-5')) defaultTime='12:00';
    else if(timeHints[0].includes('5-8')||timeHints[0].includes('6-8')||timeHints[0].includes('6-10')) defaultTime='18:00';
  }

  // Add suggestions to the next 4 weeks on selected days
  const now = new Date();
  suggestions.forEach((sug, idx) => {
    const name = sug.name || sug.dataset?.name;
    const time = (sug.time&&sug.time!=='null') ? sug.time : (defaultTime||(sug.dataset?.time||null));
    const notes = (sug.notes&&sug.notes!=='null') ? sug.notes : (sug.dataset?.notes||null);
    const repeat = sug.repeat || sug.dataset?.repeat || (selectedDays.length?'weekly':'none');
    if(!name) return;

    // Determine which date to assign this event
    let targetDate = new Date(now);
    if(selectedDays.length) {
      // Find the next occurrence of a selected day
      const dayIdx = idx % selectedDays.length;
      const targetDow = DAY_NAMES.indexOf(selectedDays[dayIdx]);
      let d = new Date(now);
      for(let i=0;i<7;i++) {
        if(d.getDay()===targetDow) break;
        d.setDate(d.getDate()+1);
      }
      targetDate = d;
    }

    const key = dateKey(targetDate);
    const ev = { name, time, notes, repeat, date:key, done:false };
    if(!events[key]) events[key] = [];
    events[key].push(ev);
  });

  // If no suggestions, create empty calendar
  const newCal = {
    id: calId,
    name: calName,
    type: wizState.type,
    color: calColor(wizState.type),
    createdAt: new Date().toISOString(),
    wizardAnswers: { q2: wizState.q2ans, q3: wizState.q3ans },
    events
  };

  await setDoc(doc(db, 'users', user.uid, 'calendars', calId), newCal);
  activeCalId = calId;
  closeOv('wizard-ov');
  // Navigate to first event date if exists
  if(Object.keys(events).length) {
    const firstKey = Object.keys(events).sort()[0];
    const parts = firstKey.split('-');
    currentDate = new Date(parseInt(parts[0]), parseInt(parts[1])-1, 1);
    selectedDate = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
  }
}

// ─── KEYBOARD ─────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if(e.key === 'Enter') {
    if(document.getElementById('event-ov').classList.contains('on')) {
      document.getElementById('ev-save').click();
    }
  }
});

// ─── INIT ──────────────────────────────────────────────────────────────────
selectedDate = new Date();
renderMonth();
