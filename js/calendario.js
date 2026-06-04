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
let wizState = { type:null, q2ans:null, q3ans:[], step:1 };
let addEventDate = null;
let delCalTarget = null;

// ─── HELPERS ──────────────────────────────────────────────────────────────
window.openOv = id => document.getElementById(id).classList.add('on');
window.closeOv = id => document.getElementById(id).classList.remove('on');

function dateKey(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

function getActiveCal() { return calendars.find(c => c.id === activeCalId); }

function calColor(type) { return CAL_TYPES.find(t => t.val === type)?.color || '#9999b8'; }
function calCls(type)   { return CAL_TYPES.find(t => t.val === type)?.cls   || 'col-gen'; }
function calBgcls(type) { return CAL_TYPES.find(t => t.val === type)?.bgcls || 'bg-gen'; }

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
      html += `<div class="event-item">
        <div class="event-color" style="background:${color}"></div>
        <div class="event-info">
          <div class="event-name" style="${isDone?'text-decoration:line-through;opacity:.5':''}">${ev.name}</div>
          ${ev.time ? `<div class="event-time">🕐 ${ev.time}${ev.repeat&&ev.repeat!=='none'?' · 🔁':''}</div>` : ''}
          ${ev.notes ? `<div class="event-time">📝 ${ev.notes}</div>` : ''}
        </div>
        <div class="event-check ${isDone?'done':''}" onclick="toggleEventDone('${key}',${i})">
          ${isDone?'✓':''}
        </div>
        <button class="event-del" onclick="deleteEvent('${key}',${i})">🗑️</button>
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
  CAL_TYPES.forEach(t => {
    const b = document.createElement('button');
    b.className = 'opt-b';
    b.textContent = t.label;
    b.onclick = () => {
      wizState.type = t.val;
      goWizStep(2);
    };
    ct.appendChild(b);
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
document.getElementById('wiz-skip-ai').onclick = () => finishWizard([]);
document.getElementById('wiz-finish').onclick = () => {
  const suggestions = [...document.querySelectorAll('.sug-card:not(.applied)')];
  finishWizard(suggestions.map(s => ({ name: s.dataset.name, time: s.dataset.time||null, notes: s.dataset.notes||null })));
};

async function runAI() {
  const ct = document.getElementById('wiz-ai-content');
  const finBtn = document.getElementById('wiz-finish');
  finBtn.style.display = 'none';
  ct.innerHTML = '<div class="ai-typing"><span></span><span></span><span></span></div>';

  const typeInfo = CAL_TYPES.find(t => t.val === wizState.type);
  const prompt = buildAIPrompt();

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:1000,
        system:`Eres un asistente experto en planificación personal. El usuario está configurando un calendario de tipo "${typeInfo?.label}". 
Responde SOLO en JSON con este formato exacto, sin markdown ni texto extra:
{
  "intro": "Frase motivadora de 1-2 oraciones basada en sus respuestas",
  "suggestions": [
    {"name": "Nombre del evento/tarea", "time": "HH:MM o null", "notes": "detalle breve o null", "repeat": "weekly/daily/none"},
    ...
  ]
}
Genera entre 5 y 8 sugerencias concretas, prácticas y personalizadas. Para gimnasio incluye ejercicios específicos. Para cocina incluye recetas reales. Para trabajo incluye tareas concretas.`,
        messages:[{ role:'user', content: prompt }]
      })
    });

    const data = await res.json();
    const text = data.content?.map(i => i.text||'').join('') || '';
    const clean = text.replace(/```json|```/g,'').trim();
    const parsed = JSON.parse(clean);

    ct.innerHTML = '';

    // Intro bubble
    const bubble = document.createElement('div');
    bubble.className = 'ai-bubble';
    bubble.innerHTML = `<p>✨ ${parsed.intro}</p>`;
    ct.appendChild(bubble);

    // Suggestions
    const sugTitle = document.createElement('div');
    sugTitle.style.cssText = 'font-size:13px;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;margin-top:16px';
    sugTitle.textContent = 'Eventos sugeridos';
    ct.appendChild(sugTitle);

    (parsed.suggestions || []).forEach(sug => {
      const card = document.createElement('div');
      card.className = 'suggestion-card';
      card.dataset.name = sug.name;
      card.dataset.time = sug.time || '';
      card.dataset.notes = sug.notes || '';
      card.dataset.repeat = sug.repeat || 'none';
      const color = calColor(wizState.type);
      card.innerHTML = `
        <div class="sug-ico" style="color:${color}">${typeInfo?.label.split(' ')[0]||'📅'}</div>
        <div class="sug-info">
          <div class="sug-name">${sug.name}</div>
          <div class="sug-detail">${sug.time||'Sin hora'} ${sug.notes?'· '+sug.notes:''} ${sug.repeat&&sug.repeat!=='none'?'· 🔁':''}</div>
        </div>
        <button class="sug-add" onclick="removeSuggestion(this)">✓ Incluir</button>`;
      ct.appendChild(card);
    });

    finBtn.style.display = 'block';

  } catch(e) {
    ct.innerHTML = `<div class="ai-bubble"><p>No se pudo conectar con la IA. Puedes crear el calendario sin sugerencias.</p></div>`;
    finBtn.style.display = 'none';
    console.error(e);
  }
}

window.removeSuggestion = function(btn) {
  const card = btn.closest('.suggestion-card');
  card.classList.toggle('applied');
  btn.textContent = card.classList.contains('applied') ? '+ Agregar' : '✓ Incluir';
};

function buildAIPrompt() {
  const typeInfo = CAL_TYPES.find(t => t.val === wizState.type);
  const q = WIZARD_QUESTIONS[wizState.type];
  let prompt = `Tipo de calendario: ${typeInfo?.label}\n`;
  if(q?.q2 && wizState.q2ans) prompt += `${q.q2.title}: ${Array.isArray(wizState.q2ans) ? wizState.q2ans.join(', ') : wizState.q2ans}\n`;
  if(q?.q3 && wizState.q3ans?.length) prompt += `${q.q3.title}: ${wizState.q3ans.join(', ')}\n`;
  prompt += 'Por favor sugiere eventos/tareas/rutinas concretas y personalizadas para este calendario.';
  return prompt;
}

async function finishWizard(suggestions) {
  const typeInfo = CAL_TYPES.find(t => t.val === wizState.type);
  const calName = typeInfo?.label.split(' ').slice(1).join(' ') || 'Mi calendario';
  const calId = 'cal_' + Date.now();

  // Build events object from suggestions (add to today and recurring days)
  const events = {};
  const today = dateKey(new Date());

  suggestions.forEach((sug, i) => {
    const card = document.querySelector(`.suggestion-card:not(.applied)[data-name="${sug.name}"]`) ||
                 { dataset: sug };
    const ev = {
      name: sug.name || card.dataset?.name,
      time: sug.time || card.dataset?.time || null,
      notes: sug.notes || card.dataset?.notes || null,
      repeat: card.dataset?.repeat || 'none',
      date: today,
      done: false
    };
    if(!ev.name) return;
    if(!events[today]) events[today] = [];
    events[today].push(ev);
  });

  const newCal = {
    id: calId,
    name: calName,
    type: wizState.type,
    color: calColor(wizState.type),
    createdAt: new Date().toISOString(),
    events
  };

  await setDoc(doc(db, 'users', user.uid, 'calendars', calId), newCal);
  activeCalId = calId;
  closeOv('wizard-ov');
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
