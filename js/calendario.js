// calendario.js — Reescrito limpio desde cero

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, collection, doc, onSnapshot, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const FB = initializeApp({apiKey:"AIzaSyDjA2H9b6Ec7CUpUppQGFcacJRtDVrYz74",authDomain:"olvezz-finanzas.firebaseapp.com",projectId:"olvezz-finanzas",storageBucket:"olvezz-finanzas.firebasestorage.app",messagingSenderId:"16267383608",appId:"1:16267383608:web:17f5dd9180f26ea7d067cd"});
const auth=getAuth(FB), db=getFirestore(FB);

const MONTHS=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DOW=['Do','Lu','Ma','Mi','Ju','Vi','Sá'];
const DAY_NAMES=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

const CAL_TYPES=[
  {val:'gym',label:'💪 Gimnasio',color:'#ff6584',group:'Salud y bienestar'},
  {val:'run',label:'🏃 Correr',color:'#ff9966',group:'Salud y bienestar'},
  {val:'yoga',label:'🧘 Yoga',color:'#c084fc',group:'Salud y bienestar'},
  {val:'health',label:'❤️ Salud/Médico',color:'#f87171',group:'Salud y bienestar'},
  {val:'sleep',label:'😴 Rutina de sueño',color:'#818cf8',group:'Salud y bienestar'},
  {val:'work',label:'💼 Trabajo',color:'#6c63ff',group:'Trabajo y estudio'},
  {val:'study',label:'📚 Estudio',color:'#60a5fa',group:'Trabajo y estudio'},
  {val:'project',label:'🎯 Proyectos',color:'#34d399',group:'Trabajo y estudio'},
  {val:'meeting',label:'📞 Reuniones',color:'#a78bfa',group:'Trabajo y estudio'},
  {val:'cook',label:'🍳 Cocina/Menú',color:'#f5a623',group:'Hogar y familia'},
  {val:'shop',label:'🛒 Compras',color:'#3dd68c',group:'Hogar y familia'},
  {val:'clean',label:'🧹 Limpieza',color:'#22d3ee',group:'Hogar y familia'},
  {val:'family',label:'👨‍👩‍👧 Familia',color:'#fb923c',group:'Hogar y familia'},
  {val:'pet',label:'🐾 Mascotas',color:'#a3e635',group:'Hogar y familia'},
  {val:'finance',label:'💰 Metas financieras',color:'#4ade80',group:'Finanzas y metas'},
  {val:'habit',label:'✅ Hábitos diarios',color:'#facc15',group:'Finanzas y metas'},
  {val:'goal',label:'🏆 Objetivos',color:'#f59e0b',group:'Finanzas y metas'},
  {val:'travel',label:'✈️ Viajes',color:'#38bdf8',group:'Entretenimiento'},
  {val:'social',label:'🎉 Eventos sociales',color:'#e879f9',group:'Entretenimiento'},
  {val:'hobby',label:'🎨 Hobbies',color:'#f472b6',group:'Entretenimiento'},
  {val:'gen',label:'📋 General',color:'#9999b8',group:'General'},
];

function getCalType(v){return CAL_TYPES.find(t=>t.val===v);}
function calColor(v){return getCalType(v)?.color||'#9999b8';}

const WIZ_Q={
  gym:{q2:{title:'¿Qué días puedes entrenar?',type:'multi',opts:['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']},q3:{title:'¿Horario y objetivo?',type:'multi',opts:['🌅 Mañana (6-9am)','☀️ Tarde (5-8pm)','💪 Ganar músculo','🔥 Perder grasa','⚡ Resistencia','🧘 Bienestar']}},
  run:{q2:{title:'¿Qué días corres?',type:'multi',opts:['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']},q3:{title:'¿Horario y objetivo?',type:'multi',opts:['🌅 Mañana','☀️ Tarde','🏃 5K','🏃 10K','🏃 Maratón','🔥 Perder peso']}},
  yoga:{q2:{title:'¿Qué días practicas?',type:'multi',opts:['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']},q3:{title:'¿Horario y nivel?',type:'multi',opts:['🌅 Mañana','🌙 Noche','🌱 Principiante','⭐ Intermedio','🔥 Avanzado','🧘 Meditación']}},
  health:{q2:{title:'¿Qué tipo de citas?',type:'multi',opts:['Médico general','Dentista','Especialista','Farmacia','Laboratorio','Terapia']},q3:{title:'¿Frecuencia?',type:'multi',opts:['Semanal','Mensual','Bimestral','Según necesidad']}},
  sleep:{q2:{title:'¿A qué hora acostarte?',type:'single',opts:['9:00 PM','10:00 PM','11:00 PM','12:00 AM']},q3:{title:'¿A qué hora despertar?',type:'single',opts:['5:00 AM','6:00 AM','7:00 AM','8:00 AM']}},
  work:{q2:{title:'¿Qué días trabajas?',type:'multi',opts:['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']},q3:{title:'¿Horario y tipo de tareas?',type:'multi',opts:['🌅 Mañana (8-12)','☀️ Tarde (1-5)','📋 Tareas','📞 Reuniones','📊 Proyectos','🎯 Metas']}},
  study:{q2:{title:'¿Qué días estudias?',type:'multi',opts:['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']},q3:{title:'¿Horario y materia?',type:'multi',opts:['🌅 Mañana','☀️ Tarde','🌙 Noche','💻 Programación','📖 Idiomas','🎓 Universidad','📐 Exactas']}},
  project:{q2:{title:'¿Cuántos días por semana?',type:'single',opts:['1-2 días','3-4 días','5-6 días','Todos los días']},q3:{title:'¿Horario y tipo?',type:'multi',opts:['🌅 Mañana','☀️ Tarde','🌙 Noche','💻 Tech','🎨 Creativo','📊 Negocio','🏠 Personal']}},
  meeting:{q2:{title:'¿Cuántas reuniones semanales?',type:'single',opts:['1-2','3-5','5-10','Diarias']},q3:{title:'¿Cuándo?',type:'multi',opts:['🌅 Mañana','☀️ Tarde','📞 Llamadas','🎥 Video','👥 Presencial']}},
  cook:{q2:{title:'¿Qué días cocinas?',type:'multi',opts:['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']},q3:{title:'¿Comidas y tipo?',type:'multi',opts:['🌅 Desayuno','☀️ Almuerzo','🌆 Cena','🥗 Saludable','🍗 Tradicional','🌱 Vegetariana','🍱 Rápida']}},
  shop:{q2:{title:'¿Qué días haces compras?',type:'multi',opts:['Lunes','Miércoles','Viernes','Sábado','Domingo','Variable']},q3:{title:'¿Horario y categorías?',type:'multi',opts:['🌅 Mañana','☀️ Tarde','🥦 Frutas/Verduras','🥩 Carnes','🥛 Lácteos','🧴 Limpieza','🍫 Snacks']}},
  clean:{q2:{title:'¿Qué días limpias?',type:'multi',opts:['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']},q3:{title:'¿Qué áreas?',type:'multi',opts:['🛋️ Sala','🍽️ Cocina','🛁 Baños','🛏️ Habitaciones','🪟 Ventanas','🌿 Exterior']}},
  family:{q2:{title:'¿Qué tipo de eventos?',type:'multi',opts:['Cumpleaños','Cenas','Salidas','Llamadas','Aniversarios','Fiestas']},q3:{title:'¿Frecuencia?',type:'multi',opts:['Semanal','Quincenal','Mensual','Ocasional']}},
  pet:{q2:{title:'¿Qué mascotas tienes?',type:'multi',opts:['🐕 Perro','🐈 Gato','🐠 Peces','🐇 Conejo','🦜 Ave','Otra']},q3:{title:'¿Qué cuidados?',type:'multi',opts:['🍖 Alimentación','🚶 Paseos','🏥 Veterinario','💆 Baño','💊 Medicamentos']}},
  finance:{q2:{title:'¿Qué metas financieras?',type:'multi',opts:['💰 Ahorrar','📉 Reducir deudas','📊 Invertir','🏠 Comprar casa','✈️ Viajar','🎓 Educación']},q3:{title:'¿Cuándo revisas?',type:'multi',opts:['Diario','Semanal','Mensual','🌅 Mañana','🌙 Noche']}},
  habit:{q2:{title:'¿Qué hábitos quieres?',type:'multi',opts:['💧 Agua','📖 Leer','🚶 Caminar','🙏 Gratitud','📝 Journaling','🍎 Comer sano']},q3:{title:'¿A qué hora?',type:'multi',opts:['🌅 Al despertar','🌞 Mediodía','🌆 Tarde','🌙 Antes de dormir']}},
  goal:{q2:{title:'¿Qué tipo de metas?',type:'multi',opts:['🏋️ Físicas','💼 Profesionales','📚 Educativas','💰 Financieras','❤️ Personales']},q3:{title:'¿Cuándo haces seguimiento?',type:'multi',opts:['Diario','Semanal','Mensual','🌅 Mañana','🌙 Noche']}},
  travel:{q2:{title:'¿Qué tipo de salidas?',type:'multi',opts:['✈️ Viajes largos','🚗 Day trips','🍽️ Restaurantes','🎬 Cine','🏖️ Playa','🛍️ Compras']},q3:{title:'¿Con quién?',type:'multi',opts:['Solo/a','En pareja','Con amigos','Con familia']}},
  social:{q2:{title:'¿Qué eventos sociales?',type:'multi',opts:['🎂 Cumpleaños','🎊 Fiestas','🍻 Amigos','💒 Bodas','🎓 Graduaciones']},q3:{title:'¿Frecuencia?',type:'multi',opts:['Semanal','Mensual','Ocasional']}},
  hobby:{q2:{title:'¿Cuál es tu hobby?',type:'multi',opts:['🎨 Arte','📸 Fotografía','🎮 Gaming','🎵 Música','✍️ Escritura','🌱 Jardinería','🍳 Cocinar']},q3:{title:'¿Cuándo?',type:'multi',opts:['Lunes','Miércoles','Viernes','Sábado','Domingo','🌅 Mañana','☀️ Tarde','🌙 Noche']}},
  gen:{q2:{title:'¿Qué quieres organizar?',type:'text',placeholder:'Ej: Citas, proyectos, rutinas personales...'},q3:{title:'¿Días y horario?',type:'multi',opts:['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo','🌅 Mañana','☀️ Tarde','🌙 Noche']}},
};

const LOCAL_SUGS={
  gym:[{n:'Calentamiento 10 min',t:'07:00',r:'weekly'},{n:'Press de banca — 4x10',t:'07:15',r:'weekly'},{n:'Sentadillas — 4x12',t:'07:35',r:'weekly'},{n:'Peso muerto — 3x8',t:'07:55',r:'weekly'},{n:'Cardio 20 min',t:'08:15',r:'weekly'},{n:'Abdominales — 3x20',t:'08:40',r:'weekly'}],
  run:[{n:'Trote suave 20 min',t:'06:30',r:'weekly'},{n:'Intervalos de velocidad',t:'06:30',r:'weekly'},{n:'Carrera de fondo 45 min',t:'07:00',r:'weekly'},{n:'Estiramientos post-carrera',t:'07:50',r:'weekly'}],
  yoga:[{n:'Saludo al sol 15 min',t:'07:00',r:'daily'},{n:'Secuencia de equilibrio',t:'07:20',r:'weekly'},{n:'Meditación 10 min',t:'21:00',r:'daily'},{n:'Yoga restaurativo',t:'20:30',r:'weekly'}],
  health:[{n:'Tomar medicamentos',t:'08:00',r:'daily'},{n:'Ejercicio ligero 30 min',t:'17:00',r:'daily'},{n:'Control de presión/glucosa',t:'08:30',r:'daily'}],
  sleep:[{n:'Apagar pantallas',t:'21:30',r:'daily'},{n:'Rutina de relajación',t:'21:45',r:'daily'},{n:'Hora de dormir',t:'22:00',r:'daily'},{n:'Despertar y estirar',t:'06:30',r:'daily'}],
  work:[{n:'Revisar correos',t:'08:00',r:'daily'},{n:'Bloque de trabajo profundo',t:'09:00',r:'daily'},{n:'Revisión de tareas',t:'17:00',r:'daily'},{n:'Planificar día siguiente',t:'17:30',r:'daily'}],
  study:[{n:'Repaso del día anterior',t:'08:00',r:'daily'},{n:'Sesión de estudio 90 min',t:'08:30',r:'daily'},{n:'Segunda sesión 60 min',t:'10:15',r:'daily'},{n:'Revisión de notas',t:'20:00',r:'daily'}],
  project:[{n:'Revisión de objetivos',t:'09:00',r:'weekly'},{n:'Bloque de trabajo 2h',t:'09:30',r:'weekly'},{n:'Actualizar estado',t:'17:00',r:'weekly'},{n:'Retrospectiva semanal',t:'17:00',r:'weekly'}],
  meeting:[{n:'Reunión de equipo',t:'10:00',r:'weekly'},{n:'Revisión de agenda',t:'08:30',r:'daily'},{n:'Seguimiento de acuerdos',t:'17:00',r:'weekly'}],
  cook:[{n:'Desayuno saludable',t:'07:30',r:'daily'},{n:'Almuerzo — Pollo con arroz',t:'12:00',r:'weekly'},{n:'Cena ligera',t:'19:00',r:'daily'},{n:'Sancocho dominicano',t:'11:00',r:'weekly'},{n:'Preparar meriendas',t:'16:00',r:'daily'}],
  shop:[{n:'Revisar despensa',t:'08:30',r:'weekly'},{n:'Lista de compras',t:'09:00',r:'weekly'},{n:'Compra en supermercado',t:'10:00',r:'weekly'}],
  clean:[{n:'Limpieza rápida sala',t:'09:00',r:'daily'},{n:'Limpiar cocina y baños',t:'09:00',r:'weekly'},{n:'Lavar ropa',t:'08:00',r:'weekly'},{n:'Limpieza profunda',t:'09:00',r:'weekly'}],
  family:[{n:'Llamar a familia',t:'18:00',r:'weekly'},{n:'Cena familiar',t:'19:00',r:'weekly'},{n:'Tiempo de calidad',t:'15:00',r:'weekly'}],
  pet:[{n:'Alimentar mascota',t:'07:00',r:'daily'},{n:'Paseo matutino',t:'07:30',r:'daily'},{n:'Paseo vespertino',t:'18:00',r:'daily'},{n:'Baño semanal',t:'10:00',r:'weekly'}],
  finance:[{n:'Revisar gastos del día',t:'21:00',r:'daily'},{n:'Control semanal de presupuesto',t:'09:00',r:'weekly'},{n:'Transferir a ahorros',t:'08:00',r:'weekly'}],
  habit:[{n:'2 vasos de agua al despertar',t:'07:00',r:'daily'},{n:'Lectura 20 min',t:'21:30',r:'daily'},{n:'Caminata 30 min',t:'07:30',r:'daily'},{n:'Diario de gratitud',t:'21:00',r:'daily'}],
  goal:[{n:'Revisión de metas semanales',t:'09:00',r:'weekly'},{n:'Paso de acción diario',t:'09:00',r:'daily'},{n:'Retrospectiva mensual',t:'10:00',r:'weekly'}],
  travel:[{n:'Planificar próxima salida',t:'19:00',r:'weekly'},{n:'Guardar dinero para viaje',t:'08:00',r:'weekly'}],
  social:[{n:'Cumpleaños pendientes',t:'09:00',r:'weekly'},{n:'Organizar reunión',t:'10:00',r:'weekly'}],
  hobby:[{n:'Sesión de hobby 1h',t:'18:00',r:'weekly'},{n:'Practicar habilidad nueva',t:'19:00',r:'weekly'}],
  gen:[{n:'Revisión personal semanal',t:'09:00',r:'weekly'},{n:'Tarea del día',t:'09:00',r:'daily'},{n:'Descanso activo',t:'12:30',r:'daily'}],
};

// STATE
let user=null,unsub=null,calendars=[],activeCalId=null;
let currentDate=new Date(),selectedDate=new Date();
let delCalTarget=null,editEvKey=null,editEvIdx=null,addEvKey=null;
let wiz={step:1,type:'',title:'',q2:[],q3:[]};

// UTILS
function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function getActiveCal(){return calendars.find(c=>c.id===activeCalId);}
window.openOv=id=>document.getElementById(id)?.classList.add('on');
window.closeOv=id=>document.getElementById(id)?.classList.remove('on');

// AUTH
getRedirectResult(auth).catch(()=>{});
onAuthStateChanged(auth,u=>{
  if(u){
    user=u;
    const av=document.getElementById('user-av');
    if(av) av.innerHTML=u.photoURL?`<img src="${u.photoURL}" style="width:100%;height:100%;object-fit:cover">`:(u.displayName?.[0]?.toUpperCase()||'?');
    // Wire logout button if present
    const loBtn=document.getElementById('cal-lo-btn');
    if(loBtn) loBtn.onclick=async()=>{ if(unsub)unsub(); await signOut(auth); window.location.href='index.html'; };
    listenCalendars();
  } else { window.location.href='index.html'; }
});

// FIRESTORE
function listenCalendars(){
  if(unsub)unsub();
  unsub=onSnapshot(collection(db,'users',user.uid,'calendars'),snap=>{
    calendars=snap.docs.map(d=>({id:d.id,...d.data()}));
    if(!activeCalId&&calendars.length)activeCalId=calendars[0].id;
    renderTabs();renderMonth();renderDayDetail(selectedDate);
  });
}
async function saveCal(cal){await setDoc(doc(db,'users',user.uid,'calendars',cal.id),cal);}
async function deleteCal(id){await deleteDoc(doc(db,'users',user.uid,'calendars',id));}

// TABS
function renderTabs(){
  const ct=document.getElementById('cal-tabs');
  const addBtn=document.getElementById('btn-add-cal');
  [...ct.children].forEach(c=>{if(c!==addBtn)c.remove();});
  calendars.forEach(cal=>{
    const tab=document.createElement('button');
    tab.className='cal-tab'+(cal.id===activeCalId?' on':'');
    tab.innerHTML=`<div class="tab-dot" style="background:${calColor(cal.type)}"></div>${cal.name}`;
    tab.onclick=()=>{activeCalId=cal.id;renderTabs();renderMonth();renderDayDetail(selectedDate);};
    let timer=null,fired=false;
    const startLP=()=>{fired=false;timer=setTimeout(()=>{fired=true;askDeleteCal(cal);},650);};
    const cancelLP=()=>clearTimeout(timer);
    tab.addEventListener('touchstart',startLP,{passive:true});
    tab.addEventListener('touchend',cancelLP);
    tab.addEventListener('touchmove',cancelLP,{passive:true});
    tab.addEventListener('mousedown',startLP);
    tab.addEventListener('mouseup',cancelLP);
    tab.addEventListener('mouseleave',cancelLP);
    tab.addEventListener('click',e=>{if(fired){e.stopImmediatePropagation();fired=false;}});
    ct.insertBefore(tab,addBtn);
  });
}
function askDeleteCal(cal){
  delCalTarget=cal;
  const sub=document.getElementById('del-cal-sub');
  if(sub)sub.textContent=`"${cal.name}" y todos sus eventos serán eliminados.`;
  openOv('del-cal-ov');
}
document.getElementById('del-cal-ok').onclick=async()=>{
  if(!delCalTarget)return;
  closeOv('del-cal-ov');
  const id=delCalTarget.id;
  delCalTarget=null;
  if(activeCalId===id)activeCalId=calendars.find(c=>c.id!==id)?.id||null;
  await deleteCal(id);
};

// MONTH
function renderMonth(){
  const title=document.getElementById('month-title');
  if(title)title.textContent=`${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  const grid=document.getElementById('cal-grid');
  if(!grid)return;
  while(grid.children.length>7)grid.removeChild(grid.lastChild);
  const yr=currentDate.getFullYear(),mo=currentDate.getMonth();
  const firstDow=new Date(yr,mo,1).getDay(); // 0=Sun, 1=Mon...
  const lastD=new Date(yr,mo+1,0).getDate();
  const todayKey=dateKey(new Date()),selKey=dateKey(selectedDate);
  const cal=getActiveCal(),events=cal?.events||{};
  const prevLast=new Date(yr,mo,0).getDate();
  for(let i=0;i<firstDow;i++) addCell(grid,new Date(yr,mo-1,prevLast-firstDow+i+1),true,events,todayKey,selKey);
  for(let d=1;d<=lastD;d++) addCell(grid,new Date(yr,mo,d),false,events,todayKey,selKey);
  const trail=(firstDow+lastD)%7===0?0:7-((firstDow+lastD)%7);
  for(let i=1;i<=trail;i++) addCell(grid,new Date(yr,mo+1,i),true,events,todayKey,selKey);
}
function addCell(grid,date,dim,events,todayKey,selKey){
  const key=dateKey(date);
  const evs=getEventsForDate(date,events);
  const cell=document.createElement('div');
  cell.className='cal-day'+(key===todayKey?' today':'')+(key===selKey?' selected':'')+(dim?' other-month':'');
  const num=document.createElement('div');num.className='cal-day-num';num.textContent=date.getDate();cell.appendChild(num);
  if(evs.length){
    const dots=document.createElement('div');dots.className='cal-day-dots';
    evs.slice(0,4).forEach(()=>{const d=document.createElement('div');d.className='cal-dot';d.style.background=calColor(getActiveCal()?.type||'gen');dots.appendChild(d);});
    cell.appendChild(dots);
  }
  cell.onclick=()=>{selectedDate=date;renderMonth();renderDayDetail(date);};
  grid.appendChild(cell);
}
function getEventsForDate(date,events){
  const key=dateKey(date),dow=date.getDay(),dom=date.getDate();
  const direct=events[key]||[];
  const recurring=[];
  Object.entries(events).forEach(([k,list])=>{
    if(k===key)return;
    (list||[]).forEach(ev=>{
      if(!ev.repeat||ev.repeat==='none')return;
      const evDate=new Date(k);if(evDate>date)return;
      if(ev.repeat==='weekly'&&evDate.getDay()===dow)recurring.push(ev);
      if(ev.repeat==='daily')recurring.push(ev);
      if(ev.repeat==='monthly'&&evDate.getDate()===dom)recurring.push(ev);
    });
  });
  return [...direct,...recurring];
}
document.getElementById('btn-prev-month').onclick=()=>{currentDate=new Date(currentDate.getFullYear(),currentDate.getMonth()-1,1);renderMonth();};
document.getElementById('btn-next-month').onclick=()=>{currentDate=new Date(currentDate.getFullYear(),currentDate.getMonth()+1,1);renderMonth();};

// DAY DETAIL
function renderDayDetail(date){
  const wrap=document.getElementById('day-detail-wrap');if(!wrap)return;
  const cal=getActiveCal();
  if(!cal){wrap.innerHTML='<div class="empty">📅<br>Crea un calendario primero tocando +</div>';return;}
  const key=dateKey(date),color=calColor(cal.type);
  const dayLabel=`${DOW[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
  const evs=getEventsForDate(date,cal.events||{});
  let html=`<div class="day-detail"><div class="day-detail-header"><div class="day-detail-title">${dayLabel}</div><button class="day-add-btn" onclick="openAddEvent('${key}')">+ Evento</button></div>`;
  if(!evs.length){html+=`<div style="text-align:center;padding:20px;color:var(--text2);font-size:14px">Sin eventos · toca + para agregar</div>`;}
  else{evs.forEach((ev,i)=>{html+=`<div class="event-item" onclick="openEditEvent('${key}',${i})"><div class="event-color" style="background:${color}"></div><div class="event-info"><div class="event-name" style="${ev.done?'text-decoration:line-through;opacity:.5':''}">${ev.name}</div>${ev.time?`<div class="event-time">🕐 ${ev.time}${ev.repeat&&ev.repeat!=='none'?' · 🔁':''}</div>`:''}${ev.notes?`<div class="event-time">📝 ${ev.notes}</div>`:''}</div><div class="event-check ${ev.done?'done':''}" onclick="event.stopPropagation();toggleDone('${key}',${i})">${ev.done?'✓':''}</div></div>`;});}
  html+='</div>';wrap.innerHTML=html;
}

// ADD EVENT
window.openAddEvent=function(key){
  addEvKey=key;
  const cal=getActiveCal();
  document.getElementById('event-ov-title').textContent=`Nuevo evento · ${cal?.name||''}`;
  ['ev-name','ev-notes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('ev-time').value='';
  document.getElementById('ev-repeat').value='none';
  openOv('event-ov');
  setTimeout(()=>document.getElementById('ev-name').focus(),100);
};
document.getElementById('ev-save').onclick=async()=>{
  const name=document.getElementById('ev-name').value.trim();
  if(!name){document.getElementById('ev-name').style.borderColor='var(--red)';return;}
  const cal=getActiveCal();if(!cal)return;
  if(!cal.events)cal.events={};
  if(!cal.events[addEvKey])cal.events[addEvKey]=[];
  cal.events[addEvKey].push({name,time:document.getElementById('ev-time').value||null,notes:document.getElementById('ev-notes').value.trim()||null,repeat:document.getElementById('ev-repeat').value,date:addEvKey,done:false});
  await saveCal(cal);closeOv('event-ov');
};
window.toggleDone=async(key,idx)=>{
  const cal=getActiveCal();if(!cal?.events?.[key]?.[idx])return;
  cal.events[key][idx].done=!cal.events[key][idx].done;await saveCal(cal);
};

// EDIT EVENT
window.openEditEvent=function(key,idx){
  const cal=getActiveCal();if(!cal?.events?.[key])return;
  const ev=cal.events[key][idx];if(!ev)return;
  editEvKey=key;editEvIdx=idx;
  document.getElementById('edit-ev-name').value=ev.name||'';
  document.getElementById('edit-ev-time').value=ev.time||'';
  document.getElementById('edit-ev-notes').value=ev.notes||'';
  document.getElementById('edit-ev-repeat').value=ev.repeat||'none';
  openOv('edit-ev-ov');
};
document.getElementById('edit-ev-save').onclick=async()=>{
  const cal=getActiveCal();
  if(!cal||editEvKey===null||editEvIdx===null)return;
  if(!cal.events?.[editEvKey]?.[editEvIdx])return;
  cal.events[editEvKey][editEvIdx]={...cal.events[editEvKey][editEvIdx],name:document.getElementById('edit-ev-name').value.trim(),time:document.getElementById('edit-ev-time').value||null,notes:document.getElementById('edit-ev-notes').value.trim()||null,repeat:document.getElementById('edit-ev-repeat').value};
  await saveCal(cal);closeOv('edit-ev-ov');
};
document.getElementById('edit-ev-del').onclick=async()=>{
  const cal=getActiveCal();if(!cal?.events?.[editEvKey])return;
  cal.events[editEvKey].splice(editEvIdx,1);
  await saveCal(cal);closeOv('edit-ev-ov');
};

// WIZARD
document.getElementById('btn-add-cal').onclick=()=>{
  wiz={step:1,type:'',title:'',q2:[],q3:[]};
  showWizStep(1);buildWizStep1();renderWizDots(1,4);openOv('wizard-ov');
};
function showWizStep(n){
  document.querySelectorAll('.wizard-step').forEach(s=>s.classList.remove('on'));
  document.getElementById('wiz-'+n)?.classList.add('on');
  wiz.step=n;renderWizDots(n,4);
}
function renderWizDots(cur,total){
  const ct=document.getElementById('wiz-dots');if(!ct)return;ct.innerHTML='';
  for(let i=1;i<=total;i++){const d=document.createElement('div');d.className='sd2'+(i===cur?' on':'');ct.appendChild(d);}
}
function buildWizStep1(){
  const ct=document.getElementById('wiz-type-opts');ct.innerHTML='';
  const titleDiv=document.createElement('div');
  titleDiv.innerHTML=`<div style="font-size:13px;color:var(--text2);margin-bottom:6px">Nombre personalizado (opcional)</div><input class="ti" id="wiz-title-inp" type="text" placeholder="Ej: Mi Gym, Trabajo remoto..." style="margin-bottom:16px"/>`;
  ct.appendChild(titleDiv);
  setTimeout(()=>{const inp=document.getElementById('wiz-title-inp');if(inp)inp.oninput=()=>{wiz.title=inp.value.trim();};},50);
  const groups={};
  CAL_TYPES.forEach(t=>{if(!groups[t.group])groups[t.group]=[];groups[t.group].push(t);});
  Object.entries(groups).forEach(([grp,types])=>{
    const hdr=document.createElement('div');
    hdr.style.cssText='font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;padding:10px 0 6px;font-weight:600';
    hdr.textContent=grp;ct.appendChild(hdr);
    const row=document.createElement('div');row.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin-bottom:4px';
    types.forEach(t=>{
      const b=document.createElement('button');
      b.style.cssText=`padding:8px 14px;background:var(--bg3);border:1px solid var(--border);border-left:3px solid ${t.color};border-radius:20px;font-size:14px;cursor:pointer;color:var(--text);transition:background .15s`;
      b.textContent=t.label;
      b.onmouseover=()=>b.style.background='var(--bg4)';
      b.onmouseout=()=>b.style.background='var(--bg3)';
      b.onclick=()=>{wiz.type=t.val;if(!wiz.title)wiz.title=t.label.split(' ').slice(1).join(' ');buildWizStep2();showWizStep(2);};
      row.appendChild(b);
    });
    ct.appendChild(row);
  });
}
function buildChips(qData,container,stateKey){
  container.innerHTML='';
  if(qData.type==='text'){
    const inp=document.createElement('input');inp.className='ti';inp.placeholder=qData.placeholder||'';
    inp.oninput=()=>{wiz[stateKey]=[inp.value.trim()];};container.appendChild(inp);return;
  }
  const grid=document.createElement('div');grid.className='chip-grid';
  (qData.opts||[]).forEach(opt=>{
    const chip=document.createElement('div');chip.className='chip';chip.textContent=opt;
    chip.onclick=()=>{
      if(qData.type==='single'){grid.querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));chip.classList.add('on');wiz[stateKey]=[opt];}
      else{chip.classList.toggle('on');wiz[stateKey]=[...grid.querySelectorAll('.chip.on')].map(c=>c.textContent);}
    };
    grid.appendChild(chip);
  });
  container.appendChild(grid);
}
function buildWizStep2(){
  const q=(WIZ_Q[wiz.type]||WIZ_Q.gen).q2;
  document.getElementById('wiz-q-title').textContent=q.title;
  document.getElementById('wiz-q-sub').textContent='';
  buildChips(q,document.getElementById('wiz-q-content'),'q2');
}
function buildWizStep3(){
  const q=(WIZ_Q[wiz.type]||WIZ_Q.gen).q3;
  document.getElementById('wiz-q3-title').textContent=q.title;
  document.getElementById('wiz-q3-sub').textContent='';
  buildChips(q,document.getElementById('wiz-q3-content'),'q3');
}
document.getElementById('wiz-next-2').onclick=()=>{buildWizStep3();showWizStep(3);};
document.getElementById('wiz-next-3').onclick=()=>{showWizStep(4);runAI();};
document.getElementById('wiz-skip-ai').onclick=async()=>{closeOv('wizard-ov');await createCalendar([]);};
document.getElementById('wiz-finish').onclick=()=>{
  const sugs=[...document.querySelectorAll('.suggestion-card:not(.excluded)')].map(c=>({name:c.dataset.name,time:c.dataset.time||null,notes:c.dataset.notes||null,repeat:c.dataset.repeat||'weekly'}));
  closeOv('wizard-ov');createCalendar(sugs);
};

// AI
async function runAI(){
  const ct=document.getElementById('wiz-ai-content'),finBtn=document.getElementById('wiz-finish');
  if(!ct||!finBtn)return;
  finBtn.style.display='none';
  ct.innerHTML='<div class="ai-typing"><span></span><span></span><span></span></div>';
  const typeInfo=getCalType(wiz.type)||CAL_TYPES[0];
  const days=wiz.q2.filter(a=>DAY_NAMES.includes(a));
  const prefs=[...wiz.q2,...wiz.q3].filter(a=>!DAY_NAMES.includes(a));
  let prompt=`Tipo: ${typeInfo.label}\n`;
  if(wiz.title)prompt+=`Nombre: ${wiz.title}\n`;
  if(days.length)prompt+=`Días: ${days.join(', ')}\n`;
  if(prefs.length)prompt+=`Preferencias: ${prefs.join(', ')}\n`;
  prompt+='Genera sugerencias concretas con horarios.';
  try{
    const res=await fetch('https://corsproxy.io/?'+encodeURIComponent('https://api.anthropic.com/v1/messages'),{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:800,
        system:'Responde SOLO en JSON sin markdown: {"intro":"frase","suggestions":[{"name":"evento","time":"HH:MM","notes":"detalle o null","repeat":"weekly/daily/none"}]}. Genera 5-7 sugerencias prácticas.',
        messages:[{role:'user',content:prompt}]})
    });
    if(!res.ok)throw new Error('HTTP '+res.status);
    const data=await res.json();
    const text=(data.content||[]).map(i=>i.text||'').join('');
    const parsed=JSON.parse(text.replace(/```json|```/g,'').trim());
    showSuggestions(parsed,typeInfo);
  }catch(e){
    console.warn('AI failed:',e.message);
    const local=(LOCAL_SUGS[wiz.type]||LOCAL_SUGS.gen).map(s=>({name:s.n,time:s.t,notes:null,repeat:s.r}));
    showSuggestions({intro:`Aquí tienes una rutina para "${typeInfo.label}" basada en mejores prácticas:`,suggestions:local},typeInfo);
  }
}
function showSuggestions(data,typeInfo){
  const ct=document.getElementById('wiz-ai-content'),finBtn=document.getElementById('wiz-finish');
  if(!ct)return;ct.innerHTML='';
  const bubble=document.createElement('div');bubble.className='ai-bubble';
  bubble.innerHTML=`<p>✨ ${data.intro||''}</p>`;ct.appendChild(bubble);
  const hdr=document.createElement('div');
  hdr.style.cssText='font-size:13px;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin:16px 0 10px';
  hdr.textContent='Eventos sugeridos — toca para excluir';ct.appendChild(hdr);
  const color=calColor(wiz.type);
  (data.suggestions||[]).forEach(sug=>{
    if(!sug.name)return;
    const card=document.createElement('div');card.className='suggestion-card';
    card.dataset.name=sug.name;
    card.dataset.time=(sug.time&&sug.time!=='null')?sug.time:'';
    card.dataset.notes=(sug.notes&&sug.notes!=='null')?sug.notes:'';
    card.dataset.repeat=sug.repeat||'weekly';
    const tStr=card.dataset.time||'Sin hora',nStr=card.dataset.notes?` · ${card.dataset.notes}`:'',rStr=(sug.repeat&&sug.repeat!=='none')?' · 🔁':'';
    card.innerHTML=`<div class="sug-ico" style="color:${color}">${typeInfo.label.split(' ')[0]||'📅'}</div><div class="sug-info"><div class="sug-name">${sug.name}</div><div class="sug-detail">${tStr}${nStr}${rStr}</div></div><button class="sug-add">✓ Incluir</button>`;
    card.querySelector('.sug-add').onclick=e=>{
      e.stopPropagation();const ex=card.classList.toggle('excluded');
      card.querySelector('.sug-add').textContent=ex?'+ Agregar':'✓ Incluir';card.style.opacity=ex?'0.4':'1';
    };
    ct.appendChild(card);
  });
  if(finBtn)finBtn.style.display='block';
}

// CREATE CALENDAR
async function createCalendar(suggestions){
  const calId='cal_'+Date.now(),events={},now=new Date(),todayKey=dateKey(now);
  const days=wiz.q2.filter(a=>DAY_NAMES.includes(a));
  suggestions.forEach((sug,idx)=>{
    if(!sug.name)return;
    let targetKey=todayKey;
    if(days.length){
      const targetDow=DAY_NAMES.indexOf(days[idx%days.length]);
      const d=new Date(now);
      for(let i=0;i<7;i++){if(d.getDay()===targetDow)break;d.setDate(d.getDate()+1);}
      targetKey=dateKey(d);
    }
    if(!events[targetKey])events[targetKey]=[];
    events[targetKey].push({name:sug.name,time:sug.time||null,notes:sug.notes||null,repeat:sug.repeat||'weekly',date:targetKey,done:false});
  });
  const cal={id:calId,name:wiz.title||getCalType(wiz.type)?.label?.split(' ').slice(1).join(' ')||'Mi calendario',type:wiz.type||'gen',color:calColor(wiz.type||'gen'),createdAt:now.toISOString(),events};
  await saveCal(cal);activeCalId=calId;
  const firstKey=Object.keys(events).sort()[0];
  if(firstKey){const parts=firstKey.split('-').map(Number);currentDate=new Date(parts[0],parts[1]-1,1);selectedDate=new Date(parts[0],parts[1]-1,parts[2]);}
}

// KEYBOARD
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter')return;
  if(document.getElementById('event-ov')?.classList.contains('on'))document.getElementById('ev-save')?.click();
  if(document.getElementById('edit-ev-ov')?.classList.contains('on'))document.getElementById('edit-ev-save')?.click();
});

// INIT
renderMonth();renderDayDetail(selectedDate);
