// finanzas.js — Lógica completa de la app de Finanzas

// main.js — All application logic
// Sections: CONSTANTS | STATE | HELPERS | AUTH | ONBOARDING | REGISTER
//           BALANCES | RECURRING | NOTIFICATIONS | DASHBOARD | ACCOUNTS
//           HISTORY | TRANSACTIONS | CHART | INIT

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const FB = initializeApp({apiKey:"AIzaSyDjA2H9b6Ec7CUpUppQGFcacJRtDVrYz74",authDomain:"olvezz-finanzas.firebaseapp.com",projectId:"olvezz-finanzas",storageBucket:"olvezz-finanzas.firebasestorage.app",messagingSenderId:"16267383608",appId:"1:16267383608:web:17f5dd9180f26ea7d067cd"});
const auth=getAuth(FB), db=getFirestore(FB);

// ─── CONSTANTS ────────────────────────────────────────────────────────────
const EX=58.5;
const MONTHS=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const CC={Comida:'#f5a623',Transporte:'#6c63ff',Entretenimiento:'#ff6584',Salud:'#3dd68c','Educación':'#009cde',Ropa:'#e91e8c',Casa:'#ff9800',Servicios:'#00bcd4',Iglesia:'#9c27b0',Negocios:'#607d8b',Ahorros:'#4caf50','Tarjeta de crédito':'#e040fb',Ingreso:'#3dd68c',Otro:'#888'};
const CE={Comida:'🍔',Transporte:'🚗',Entretenimiento:'🎮',Salud:'❤️','Educación':'📚',Ropa:'👕',Casa:'🏠',Servicios:'💡',Iglesia:'⛪',Negocios:'💼',Ahorros:'🐷','Tarjeta de crédito':'💳',Ingreso:'💰',Otro:'📦'};
const CL={Comida:5000,Transporte:3000,Entretenimiento:2000,Salud:3000,'Educación':5000,Ropa:3000,Casa:4000,Servicios:2000,Iglesia:1500,Negocios:5000,Otro:2000};
const PI={
  'Banreservas Débito':'🏦','Banreservas Crédito':'💳','MIO':'📱',
  'BHD Débito':'🏦','BHD Crédito':'💳',
  'Popular Débito':'🏦','Popular Crédito':'💳','QIK':'📱','Azul':'📱',
  'Scotiabank Débito':'🏦','Scotiabank Crédito':'💳',
  'Santa Cruz Débito':'🏦','Santa Cruz Crédito':'💳',
  'Promerica Débito':'🏦','Promerica Crédito':'💳',
  'Lopez de Haro Débito':'🏦','Lopez de Haro Crédito':'💳',
  'Caribe Débito':'🏦','Caribe Crédito':'💳',
  'Lafise Débito':'🏦','Lafise Crédito':'💳',
  'Vimenca Débito':'🏦','Vimenca Crédito':'💳',
  'Atlántico Débito':'🏦','Atlántico Crédito':'💳',
  'Empire Débito':'🏦','Empire Crédito':'💳',
  'Bellbank Débito':'🏦',
  'Asoc. Popular Débito':'🏦','La Nacional Débito':'🏦',
  'Duarte Débito':'🏦','Cibao Débito':'🏦','La Romana Débito':'🏦',
  'Bonao Débito':'🏦','Peravia Débito':'🏦',
  'ADOPEM Débito':'🏦','Banfondesa Débito':'🏦','Confisa Débito':'🏦','Fondesa Débito':'🏦',
  PayPal:'🅿️',Efectivo:'💵',Transferencia:'🏦',Depósito:'🏧'
};
const ALL_BANKS=[
  {val:'Banreservas',label:'Banreservas',cat:'Banco Múltiple'},
  {val:'BHD',label:'BHD',cat:'Banco Múltiple'},
  {val:'Popular',label:'Banco Popular',cat:'Banco Múltiple'},
  {val:'Scotiabank',label:'Scotiabank',cat:'Banco Múltiple'},
  {val:'Santa Cruz',label:'Banco Santa Cruz',cat:'Banco Múltiple'},
  {val:'Promerica',label:'Promerica',cat:'Banco Múltiple'},
  {val:'Lopez de Haro',label:'López de Haro',cat:'Banco Múltiple'},
  {val:'Caribe',label:'Banco Caribe',cat:'Banco Múltiple'},
  {val:'Lafise',label:'Banco Lafise',cat:'Banco Múltiple'},
  {val:'Vimenca',label:'Banco Vimenca',cat:'Banco Múltiple'},
  {val:'Atlántico',label:'Banco Atlántico',cat:'Banco Múltiple'},
  {val:'Empire',label:'Banco Empire',cat:'Banco Múltiple'},
  {val:'Bellbank',label:'Bellbank',cat:'Banco Múltiple'},
  {val:'Asociación Popular',label:'Asociación Popular',cat:'Asociación de Ahorro'},
  {val:'La Nacional',label:'La Nacional',cat:'Asociación de Ahorro'},
  {val:'Duarte',label:'Asociación Duarte',cat:'Asociación de Ahorro'},
  {val:'Cibao',label:'Asociación Cibao',cat:'Asociación de Ahorro'},
  {val:'Romana',label:'La Romana',cat:'Asociación de Ahorro'},
  {val:'Bonao',label:'Asociación Bonao',cat:'Asociación de Ahorro'},
  {val:'Peravia',label:'Banco Peravia',cat:'Asociación de Ahorro'},
  {val:'ADOPEM',label:'ADOPEM',cat:'Ahorro y Crédito'},
  {val:'Banfondesa',label:'Banfondesa',cat:'Ahorro y Crédito'},
  {val:'Confisa',label:'Confisa',cat:'Ahorro y Crédito'},
  {val:'Fondesa',label:'Fondesa',cat:'Ahorro y Crédito'},
];
const BP={
  'Banreservas':[{val:'Banreservas Débito',ico:'🏦',credit:false},{val:'Banreservas Crédito',ico:'💳',credit:true},{val:'MIO',ico:'📱',credit:false}],
  'BHD':[{val:'BHD Débito',ico:'🏦',credit:false},{val:'BHD Crédito',ico:'💳',credit:true}],
  'Popular':[{val:'Popular Débito',ico:'🏦',credit:false},{val:'Popular Crédito',ico:'💳',credit:true},{val:'QIK',ico:'📱',credit:false},{val:'Azul',ico:'📱',credit:false}],
  'Scotiabank':[{val:'Scotiabank Débito',ico:'🏦',credit:false},{val:'Scotiabank Crédito',ico:'💳',credit:true}],
  'Santa Cruz':[{val:'Santa Cruz Débito',ico:'🏦',credit:false},{val:'Santa Cruz Crédito',ico:'💳',credit:true}],
  'Promerica':[{val:'Promerica Débito',ico:'🏦',credit:false},{val:'Promerica Crédito',ico:'💳',credit:true}],
  'Lopez de Haro':[{val:'Lopez de Haro Débito',ico:'🏦',credit:false},{val:'Lopez de Haro Crédito',ico:'💳',credit:true}],
  'Caribe':[{val:'Caribe Débito',ico:'🏦',credit:false},{val:'Caribe Crédito',ico:'💳',credit:true}],
  'Lafise':[{val:'Lafise Débito',ico:'🏦',credit:false},{val:'Lafise Crédito',ico:'💳',credit:true}],
  'Vimenca':[{val:'Vimenca Débito',ico:'🏦',credit:false},{val:'Vimenca Crédito',ico:'💳',credit:true}],
  'Atlántico':[{val:'Atlántico Débito',ico:'🏦',credit:false},{val:'Atlántico Crédito',ico:'💳',credit:true}],
  'Empire':[{val:'Empire Débito',ico:'🏦',credit:false},{val:'Empire Crédito',ico:'💳',credit:true}],
  'Bellbank':[{val:'Bellbank Débito',ico:'🏦',credit:false}],
  'Asociación Popular':[{val:'Asoc. Popular Débito',ico:'🏦',credit:false}],
  'La Nacional':[{val:'La Nacional Débito',ico:'🏦',credit:false}],
  'Duarte':[{val:'Duarte Débito',ico:'🏦',credit:false}],
  'Cibao':[{val:'Cibao Débito',ico:'🏦',credit:false}],
  'Romana':[{val:'La Romana Débito',ico:'🏦',credit:false}],
  'Bonao':[{val:'Bonao Débito',ico:'🏦',credit:false}],
  'Peravia':[{val:'Peravia Débito',ico:'🏦',credit:false}],
  'ADOPEM':[{val:'ADOPEM Débito',ico:'🏦',credit:false}],
  'Banfondesa':[{val:'Banfondesa Débito',ico:'🏦',credit:false}],
  'Confisa':[{val:'Confisa Débito',ico:'🏦',credit:false}],
  'Fondesa':[{val:'Fondesa Débito',ico:'🏦',credit:false}],
};
const UNI=[{val:'PayPal',ico:'🅿️',credit:false},{val:'Efectivo',ico:'💵',credit:false}];

// ─── STATE ────────────────────────────────────────────────────────────────
let user=null,txs=[],cfg=null,unsub=null;
let rType='expense',rCurr='DOP',rStep=1,rTotal=6;
let ctxTx=null,edCurr='DOP',histF='all',chartType='expense',chartMonth=null;
let obBanks=[],obProds=[],obLimits={},obBals={};
let notifications=[];

// ─── HELPERS ──────────────────────────────────────────────────────────────
const fmt=n=>Math.round(n).toLocaleString('es-DO');
const fmtD=n=>n.toLocaleString('es-DO',{minimumFractionDigits:2,maximumFractionDigits:2});
function bindFmt(inp){
  if(!inp)return;
  inp.addEventListener('input',()=>{
    let raw=inp.value.replace(/[^0-9.]/g,'');
    const pts=raw.split('.');
    if(pts.length>2)raw=pts[0]+'.'+pts.slice(1).join('');
    const n=parseFloat(raw);
    if(!isNaN(n)&&raw!==''&&!raw.endsWith('.')&&!raw.match(/\.0*$/)){
      const cur=inp.selectionStart,len=inp.value.length;
      inp.value=n.toLocaleString('es-DO',{maximumFractionDigits:2});
      const diff=inp.value.length-len;
      try{inp.setSelectionRange(cur+diff,cur+diff);}catch(e){}
    }
  });
}
const rawAmt=id=>parseFloat((document.getElementById(id)||{value:'0'}).value.replace(/[^0-9.]/g,'')||'0');

// ─── OVERLAYS ─────────────────────────────────────────────────────────────
window.openOv=id=>document.getElementById(id).classList.add('on');
window.closeOv=id=>document.getElementById(id).classList.remove('on');

// ─── PAGES ────────────────────────────────────────────────────────────────
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>{p.classList.remove('on');p.style.display='';});
  const t=document.getElementById(id);
  t.classList.add('on');
  document.querySelectorAll('.ni').forEach(n=>n.classList.toggle('on',n.dataset.p===id));
  if(id==='pg-home'){updateDash();checkRecurring();}
  if(id==='pg-acc')buildAccList();
  if(id==='pg-hist')renderHist();
  if(id==='pg-chart')renderChart();
  if(id==='pg-notif')renderNotifs();
}
document.querySelectorAll('.ni').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.p)));

// ─── SYNC ─────────────────────────────────────────────────────────────────
function setSS(s,l){const d=document.getElementById('sync-dot'),lb=document.getElementById('sync-lbl');if(!d)return;d.className='sd'+(s==='sy'?' sy':s==='er'?' er':'');lb.textContent=l;}

// ─── AUTH ─────────────────────────────────────────────────────────────────
document.getElementById('btn-google').onclick=async()=>{
  document.getElementById('login-err').style.display='none';
  try{await signInWithPopup(auth,new GoogleAuthProvider());}
  catch(e){if(e.code==='auth/popup-blocked')await signInWithRedirect(auth,new GoogleAuthProvider());
  else{document.getElementById('login-err').textContent=e.message;document.getElementById('login-err').style.display='block';}}
};
getRedirectResult(auth).catch(()=>{});
document.getElementById('btn-lo').onclick=async()=>{closeOv('pf-ov');if(unsub)unsub();await signOut(auth);};

onAuthStateChanged(auth,async u=>{
  if(u){
    user=u;
    const av=document.getElementById('user-av');
    av.innerHTML=u.photoURL?`<img src="${u.photoURL}" style="width:100%;height:100%;object-fit:cover">`:(u.displayName?.[0]?.toUpperCase()||'?');
    document.getElementById('pf-av').innerHTML=u.photoURL?`<img src="${u.photoURL}" style="width:64px;height:64px;object-fit:cover">`:(u.displayName?.[0]?.toUpperCase()||'?');
    document.getElementById('pf-name').textContent=u.displayName||'Usuario';
    document.getElementById('pf-email').textContent=u.email||'';
    const cfgSnap=await getDoc(doc(db,'users',u.uid,'config','settings'));
    if(cfgSnap.exists()){cfg=cfgSnap.data();document.getElementById('bnav').style.display='flex';listenTxs();showPage('pg-home');}
    else{initOb();showPage('pg-ob');}
  } else {
    user=null;txs=[];if(unsub){unsub();unsub=null;}
    document.getElementById('bnav').style.display='none';
    document.querySelectorAll('.page').forEach(p=>{p.classList.remove('on');});
    document.getElementById('pg-login').classList.add('on');
  }
});

// ─── FIRESTORE ────────────────────────────────────────────────────────────
function listenTxs(){
  setSS('sy','Sincronizando...');
  const q=query(collection(db,'users',user.uid,'transactions'),orderBy('date','desc'));
  unsub=onSnapshot(q,snap=>{
    txs=snap.docs.map(d=>{const dt=d.data();return{...dt,id:d.id,date:dt.date?.toDate?dt.date.toDate():new Date()};});
    setSS('ok','Sincronizado');
    recalcBalances();
    buildNotifications();
    updateDash();renderHist();
  },e=>{setSS('er','Error de sync');console.error(e);});
}
async function addTx(tx){setSS('sy','Guardando...');await addDoc(collection(db,'users',user.uid,'transactions'),{...tx,date:serverTimestamp()});}
async function saveCfg(){await setDoc(doc(db,'users',user.uid,'config','settings'),cfg);}

// ─── ONBOARDING ───────────────────────────────────────────────────────────
function initOb(){
  obBanks=[];obProds=[];obLimits={};obBals={};
  // progress dots
  const pg=document.getElementById('ob-prog');pg.innerHTML='';
  for(let i=1;i<=4;i++){const d=document.createElement('div');d.id='op'+i;d.style.cssText=`width:${i===1?'20px':'6px'};height:6px;border-radius:3px;background:${i===1?'var(--acc)':'var(--bg4)'};transition:all .3s`;pg.appendChild(d);}
  // build bank list
  const bc=document.getElementById('ob-banks');bc.innerHTML='';
  let lastCat='';
  ALL_BANKS.forEach(b=>{
    if(b.cat!==lastCat){const d=document.createElement('div');d.style.cssText='font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;padding:10px 4px 4px;font-weight:600';d.textContent=b.cat;bc.appendChild(d);lastCat=b.cat;}
    const el=document.createElement('div');el.className='ob-c';el.dataset.v=b.val;
    el.innerHTML=`<span class="ob-ci">🏦</span><span class="ob-cl2">${b.label}</span><span class="ob-cm">✅</span>`;
    el.onclick=()=>{el.classList.toggle('on');obBanks=el.classList.contains('on')?[...new Set([...obBanks,b.val])]:obBanks.filter(x=>x!==b.val);};
    bc.appendChild(el);
  });
  document.getElementById('ob-n1').onclick=()=>{if(!obBanks.length){alert('Selecciona al menos un banco');return;}buildProdsStep();goOb(2);};
  document.getElementById('ob-n2').onclick=()=>{if(!obProds.length){alert('Selecciona al menos una cuenta');return;}buildBalsStep();goOb(3);};
  document.getElementById('ob-n3').onclick=()=>{buildIncomeAccSelect();goOb(4);};
  document.getElementById('ob-fin').onclick=()=>finishOb(false);
  document.getElementById('ob-skip').onclick=()=>finishOb(true);
}

function goOb(n){
  document.querySelectorAll('.ob-s').forEach(s=>s.classList.remove('on'));
  document.getElementById('ob-'+n).classList.add('on');
  for(let i=1;i<=4;i++){const d=document.getElementById('op'+i);if(d){d.style.width=i===n?'20px':'6px';d.style.background=i<=n?'var(--acc)':'var(--bg4)';}}
}

function buildProdsStep(){
  const ct=document.getElementById('ob-prods');ct.innerHTML='';obProds=[];
  obBanks.forEach(b=>{
    if(!BP[b])return;
    const hdr=document.createElement('div');hdr.style.cssText='font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;padding:10px 4px 4px;font-weight:600';hdr.textContent='🏦 '+b;ct.appendChild(hdr);
    BP[b].forEach(p=>{
      const el=document.createElement('div');el.className='ob-c';el.dataset.v=p.val;
      el.innerHTML=`<span class="ob-ci">${p.ico}</span><span class="ob-cl2">${p.val}</span><span class="ob-cm">✅</span>`;
      el.onclick=()=>{
        el.classList.toggle('on');
        obProds=el.classList.contains('on')?[...new Set([...obProds,p.val])]:obProds.filter(x=>x!==p.val);
        if(p.credit){const lr=document.getElementById('lim-'+p.val.replace(/ /g,'_'));if(lr)lr.style.display=el.classList.contains('on')?'block':'none';}
      };
      ct.appendChild(el);
      if(p.credit){const row=document.createElement('div');row.id='lim-'+p.val.replace(/ /g,'_');row.style.cssText='display:none;padding:8px 12px 12px;background:var(--bg3);border-radius:0 0 var(--rs) var(--rs);margin-top:-8px;margin-bottom:4px';row.innerHTML=`<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Límite de ${p.val} (DOP)</div><input class="ti ob-lim" data-p="${p.val}" type="text" inputmode="decimal" placeholder="Ej: 17,000" style="font-size:15px;padding:10px 14px"/>`;ct.appendChild(row);setTimeout(()=>bindFmt(row.querySelector('input')),50);}
    });
  });
  UNI.forEach(p=>{
    const el=document.createElement('div');el.className='ob-c';el.dataset.v=p.val;
    el.innerHTML=`<span class="ob-ci">${p.ico}</span><span class="ob-cl2">${p.val}</span><span class="ob-cm">✅</span>`;
    el.onclick=()=>{el.classList.toggle('on');obProds=el.classList.contains('on')?[...new Set([...obProds,p.val])]:obProds.filter(x=>x!==p.val);};
    ct.appendChild(el);
  });
}

function buildBalsStep(){
  const ct=document.getElementById('ob-bal-fields');ct.innerHTML='';obBals={};
  obProds.filter(p=>!p.toLowerCase().includes('crédito')).forEach(p=>{
    const row=document.createElement('div');row.style.cssText='margin-bottom:14px';
    row.innerHTML=`<div style="font-size:13px;font-weight:500;margin-bottom:6px">${PI[p]||'💳'} ${p}</div><input class="ti ob-bal" data-p="${p}" type="text" inputmode="decimal" placeholder="Ej: 5,000" style="font-size:16px"/>`;
    ct.appendChild(row);setTimeout(()=>bindFmt(row.querySelector('input')),50);
  });
  // collect limits
  obLimits={};
  document.querySelectorAll('.ob-lim').forEach(inp=>{const v=parseFloat(inp.value.replace(/[^0-9.]/g,''))||0;if(v>0)obLimits[inp.dataset.p]=v;});
}

function buildIncomeAccSelect(){
  const sel=document.getElementById('ob-iacc');sel.innerHTML='';
  obProds.filter(p=>!p.toLowerCase().includes('crédito')).forEach(p=>{const o=document.createElement('option');o.value=p;o.textContent=`${PI[p]||'💳'} ${p}`;sel.appendChild(o);});
  bindFmt(document.getElementById('ob-iamt'));
}

async function finishOb(skip){
  // collect balances
  document.querySelectorAll('.ob-bal').forEach(inp=>{const v=parseFloat(inp.value.replace(/[^0-9.]/g,''))||0;if(v!==0)obBals[inp.dataset.p]=v;});
  const salary=parseFloat((document.getElementById('ob-iamt').value||'0').replace(/[^0-9.]/g,''))||0;
  const payday=parseInt(document.getElementById('ob-iday').value)||0;
  const idesc=document.getElementById('ob-idesc').value.trim()||'Nómina';
  const iacc=document.getElementById('ob-iacc').value||obProds.find(p=>!p.toLowerCase().includes('crédito'))||'Efectivo';
  cfg={banks:obBanks,products:obProds,limits:obLimits,balances:obBals,salary:skip?0:salary,payday:skip?0:payday,incDesc:skip?'':idesc,incAcc:iacc,onboarded:true,confirmedMonths:[]};
  await saveCfg();
  if(salary>0&&!skip){
    await addTx({type:'income',currency:'DOP',amount:salary,amountDOP:salary,desc:idesc,account:iacc,category:'Ingreso',tipo:'recurrente',date:serverTimestamp()});
  }
  document.getElementById('bnav').style.display='flex';listenTxs();showPage('pg-home');
}

// ─── REGISTER ─────────────────────────────────────────────────────────────
document.getElementById('btn-inc').onclick=()=>openReg('income');
document.getElementById('btn-exp').onclick=()=>openReg('expense');
document.getElementById('reg-cls').onclick=()=>closeOv('reg-ov');
document.getElementById('dop-b').onclick=()=>{rCurr='DOP';document.getElementById('dop-b').className='cb on';document.getElementById('usd-b').className='cb';};
document.getElementById('usd-b').onclick=()=>{rCurr='USD';document.getElementById('dop-b').className='cb';document.getElementById('usd-b').className='cb on';};
document.getElementById('ms2-nx').onclick=()=>{const v=rawAmt('amt-f');if(!v){document.getElementById('amt-f').style.borderColor='var(--red)';return;}document.getElementById('amt-f').style.borderColor='var(--border)';goReg(rStep+1);};
document.getElementById('ms3-nx').onclick=()=>{
  const v=document.getElementById('desc-f').value.trim();
  if(!v){document.getElementById('desc-f').style.borderColor='var(--red)';return;}
  document.getElementById('desc-f').style.borderColor='var(--border)';
  const isRecurrente=[...document.querySelectorAll('#ms1-o .opt-b.sel')][0]?._v==='recurrente';
  if(isRecurrente){
    goReg(7); // go to recurrente detail step
  } else if(rType==='income'){
    goReg(4);
  } else {
    goReg(4);
  }
};
document.getElementById('ms5-sv').onclick=saveExpense;

function openReg(type){
  rType=type;rCurr='DOP';rStep=1;
  rTotal=type==='expense'?5:4; // adjusted per tipo in step 1
  document.getElementById('reg-title').textContent=type==='expense'?'💸 Registrar gasto':'💰 Registrar ingreso';
  document.getElementById('ms2-q').textContent=type==='expense'?'¿Cuánto gastaste?':'¿Cuánto recibiste?';
  document.getElementById('ms3-q').textContent=type==='expense'?'¿En qué lo gastaste?':'¿De qué ingreso?';
  document.getElementById('desc-f').placeholder=type==='expense'?'Ej: Netflix, Supermercado...':'Ej: Salario, Venta, Freelance...';
  document.getElementById('amt-f').value='';
  document.getElementById('desc-f').value='';
  document.getElementById('dop-b').className='cb on';document.getElementById('usd-b').className='cb';
  document.getElementById('ms-5').style.display=type==='income'?'none':'';
  // Rebuild category select with custom categories
  const catSel=document.getElementById('cat-f');
  const existingVals=[...catSel.options].map(o=>o.value);
  (cfg?.customCategories||[]).forEach(c=>{
    if(!existingVals.includes(c.name)){
      const o=document.createElement('option');o.value=c.name;o.textContent=`${c.emoji} ${c.name}`;catSel.appendChild(o);
    }
  });
  document.getElementById('ms-6').style.display=type==='expense'?'none':'';
  // step 1
  const o1=document.getElementById('ms1-o');o1.innerHTML='';
  [['unico','⚡ Único / puntual'],['recurrente','🔁 Recurrente / fijo mensual']].forEach(([v,l])=>{
    const b=document.createElement('button');b.className='opt-b';b.textContent=l;b._v=v;
    b.onclick=()=>{
      o1.querySelectorAll('.opt-b').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');
      // For recurrente income: skip step 4 (método cobro), go straight to desc then destino
      if(rType==='income'&&v==='recurrente'){
        rTotal=3; // tipo → monto → desc → destino(inline)
        goReg(2);
      } else if(rType==='income'){
        rTotal=4; // tipo → monto → desc → destino
        goReg(2);
      } else {
        rTotal=5; // tipo → monto → desc → cuenta → categoría
        goReg(2);
      }
    };
    o1.appendChild(b);
  });
  // step 4 — for expense: from account; for income: how received
  buildStep4(type);
  // step 6 — for income: destination account
  buildStep6();
  // Always hide step 5 for income
  document.getElementById('ms-5').style.display = type==='income' ? 'none' : '';
  document.getElementById('ms-6').style.display = type==='expense' ? 'none' : '';
  goReg(1);openOv('reg-ov');
}

function buildStep4(type){
  document.getElementById('ms4-q').textContent=type==='expense'?'¿Desde qué cuenta?':'¿Cómo recibiste el dinero?';
  const o4=document.getElementById('ms4-o');o4.innerHTML='';
  const items=type==='expense'
    ?getAccList(type)
    :[{val:'Transferencia',label:'🏦 Transferencia bancaria'},{val:'Depósito',label:'🏧 Depósito en cuenta'},{val:'Efectivo',label:'💵 Efectivo'},{val:'PayPal',label:'🅿️ PayPal'},{val:'Pago móvil',label:'📱 Pago móvil (QIK/MIO)'},{val:'Otro',label:'📦 Otro'}];
  items.forEach(a=>{
    const b=document.createElement('button');b.className='opt-b';b.textContent=a.label||a;b._v=a.val||a;
    b.onclick=()=>{
      o4.querySelectorAll('.opt-b').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');
      if(rType==='income') goReg(6); // skip cat, go to destino
      else goReg(5); // go to categoría for expense
    };
    o4.appendChild(b);
  });
}

function buildStep6(){
  const o6=document.getElementById('ms6-o');o6.innerHTML='';
  getAccList('income').forEach(a=>{
    const b=document.createElement('button');b.className='opt-b';b.textContent=a.label;b._v=a.val;
    b.onclick=()=>{o6.querySelectorAll('.opt-b').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');saveIncome();};
    o6.appendChild(b);
  });
}

function getAccList(type){
  if(!cfg?.products?.length)return[{val:'Efectivo',label:'💵 Efectivo'}];
  let p=[...(cfg.products||[])];
  if(type==='income')p=p.filter(x=>!x.toLowerCase().includes('crédito'));
  if(!p.includes('Efectivo'))p.push('Efectivo');
  return p.map(x=>({val:x,label:`${PI[x]||'💳'} ${x}`}));
}

function goReg(n){
  document.querySelectorAll('#reg-sh .ms').forEach(s=>{s.classList.remove('on');s.style.display='none';});
  const t=document.getElementById('ms-'+n);
  if(t){t.classList.add('on');t.style.display='block';}
  rStep=n;
  if(n===7) buildStep7();
  const dc=document.getElementById('reg-dots');dc.innerHTML='';
  for(let i=1;i<=rTotal;i++){const d=document.createElement('div');d.className='sd2'+(i===n?' on':'');dc.appendChild(d);}
}

async function saveExpense(){
  const acct=[...document.querySelectorAll('#ms4-o .opt-b.sel')][0]?._v||'Efectivo';
  const cat=document.getElementById('cat-f').value;
  const amt=rawAmt('amt-f');
  const desc=document.getElementById('desc-f').value.trim();
  const tipo=[...document.querySelectorAll('#ms1-o .opt-b.sel')][0]?.textContent?.includes('Recurrente')?'recurrente':'unico';
  const amtDOP=rCurr==='USD'?amt*EX:amt;
  // Check balance warning for non-credit accounts
  const isCredit=acct.toLowerCase().includes('crédito');
  const curBal=(cfg?.balances||{})[acct]??null;
  if(!isCredit && curBal!==null && curBal-amtDOP<0){
    const confirmed=confirm(`⚠️ Este gasto dejará tu cuenta "${acct}" en negativo (RD$${fmt(curBal-amtDOP)}). ¿Continuar de todas formas?`);
    if(!confirmed) return;
  }
  goReg('ok');
  document.getElementById('ok-msg').textContent=`−RD$${fmt(amtDOP)} · ${desc}`;
  await addTx({type:'expense',currency:rCurr,amount:amt,amountDOP:amtDOP,desc,account:acct,category:cat,tipo,date:serverTimestamp()});
  setTimeout(()=>closeOv('reg-ov'),1600);
}

async function saveIncome(){
  const dest=[...document.querySelectorAll('#ms6-o .opt-b.sel')][0]?._v||'Efectivo';
  const method=[...document.querySelectorAll('#ms4-o .opt-b.sel')][0]?._v||'Transferencia';
  const amt=rawAmt('amt-f');
  const desc=document.getElementById('desc-f').value.trim();
  const tipo=[...document.querySelectorAll('#ms1-o .opt-b.sel')][0]?.textContent?.includes('Recurrente')?'recurrente':'unico';
  goReg('ok');
  document.getElementById('ok-msg').textContent=`+RD$${fmt(rCurr==='USD'?amt*EX:amt)} · ${desc} → ${dest}`;
  const amtDOP=rCurr==='USD'?amt*EX:amt;
  updateBalance(dest,amtDOP);
  await addTx({type:'income',currency:rCurr,amount:amt,amountDOP:amtDOP,desc,account:method,destAccount:dest,category:'Ingreso',tipo,date:serverTimestamp()});
  setTimeout(()=>closeOv('reg-ov'),1600);
}

// ─── BALANCES ─────────────────────────────────────────────────────────────
function updateBalance(acct,delta){
  // Balance is now fully recalculated from transactions
  // This function kept for compatibility but recalcBalances handles truth
  if(!cfg)return;
  if(!cfg.balances)cfg.balances={};
  cfg.balances[acct]=(cfg.balances[acct]||0)+delta;
}

function getBalance(acct){return cfg?.balances?.[acct]??null;}


// ─── RECALC BALANCES ───────────────────────────────────────────────────────
// Always recalculate from scratch based on:
// 1. Initial balances set in onboarding (cfg.initialBalances)
// 2. All transactions (income adds, expense subtracts)
function recalcBalances(){
  if(!cfg) return;
  // Snapshot initial balances on first run if not set
  if(!cfg.initialBalances){
    cfg.initialBalances = {...(cfg.balances||{})};
  }
  // Always recalculate from initialBalances + all transactions
  const calc = {...(cfg.initialBalances||{})};
  txs.forEach(t => {
    const amt = t.amountDOP || t.amount || 0;
    if(t.type==='expense'){
      // Only deduct from non-credit accounts (credit tracked separately by usage)
      const acct = t.account||'';
      if(acct && !acct.toLowerCase().includes('crédito') && acct !== 'Transferencia' && acct !== 'Depósito' && acct !== 'PayPal' && acct !== 'Pago móvil' && acct !== 'Internacional' && acct !== 'Otro'){
        calc[acct] = (calc[acct]||0) - amt;
      }
    } else if(t.type==='income'){
      const dest = t.destAccount||'';
      if(dest && !dest.toLowerCase().includes('crédito')){
        calc[dest] = (calc[dest]||0) + amt;
      }
    }
  });
  cfg.balances = calc;
  saveCfg().catch(()=>{});
}

// ─── RECURRING ────────────────────────────────────────────────────────────
// Each recurring item stored in cfg.recurrings = [{id, type, subtype, desc, amount, currency, day, account, destAccount, category, active}]

function checkRecurring(){
  const banner=document.getElementById('rec-banner');
  banner.style.display='none';
  banner.innerHTML='';
  const recs=(cfg?.recurrings||[]).filter(r=>r.active!==false);
  const hasSalary=cfg?.salary&&cfg?.payday;
  if(!recs.length&&!hasSalary){
    banner.style.display='block';
    const mgBtn=document.createElement('button');
    mgBtn.textContent='🔁 Configurar pagos recurrentes';
    mgBtn.style.cssText='width:100%;padding:10px;background:rgba(108,99,255,.08);border:1px solid var(--border);border-radius:var(--rs);color:var(--text2);font-size:13px;cursor:pointer;margin-bottom:8px';
    mgBtn.onclick=()=>{openManageRecurrings();openOv('rec-mg-ov');};
    banner.appendChild(mgBtn);
    return;
  }
  const now=new Date();
  const monthKey=`${now.getFullYear()}-${now.getMonth()}`;
  const pending=recs.filter(r=>{
    const confirmed=(cfg.confirmedMonths||[]).includes(`${monthKey}-${r.id}`);
    return !confirmed && now.getDate()>=r.day;
  });
  // Legacy salary support
  if(cfg?.salary&&cfg?.payday){
    const legacyKey=`${monthKey}-legacy`;
    if(!(cfg.confirmedMonths||[]).includes(legacyKey)&&now.getDate()>=cfg.payday){
      pending.push({id:'legacy',type:'income',desc:cfg.incDesc||'Nómina',amount:cfg.salary,currency:'DOP',day:cfg.payday,destAccount:cfg.incAcc,account:'Transferencia',category:'Ingreso',subtype:'nomina'});
    }
  }
  if(!pending.length) return;
  banner.style.display='block';
  let html=`<div class="rec-banner"><div class="rec-title">📅 Pagos recurrentes pendientes este mes</div>`;
  pending.forEach(r=>{
    const mKey=`${monthKey}-${r.id}`;
    const sign=r.type==='income'?'+':'-';
    const amtDisplay=r.currency==='USD'?`USD $${r.amount.toFixed(2)}`:`RD$${fmt(r.amount)}`;
    const subtypeEmoji={nomina:'💼',producto:'📦',servicio:'💡',suscripcion:'📱',prestamo:'🏦',otro:'📄'}[r.subtype]||'📅';
    html+=`<div class="rec-item">
      <div>
        <div style="font-size:14px;font-weight:500">${subtypeEmoji} ${r.desc}</div>
        <div style="font-size:12px;color:var(--text2)">${sign}${amtDisplay} · Día ${r.day}${r.destAccount?' → '+r.destAccount:''}</div>
      </div>
      <button class="rec-confirm" onclick="confirmRecurring('${mKey}','${r.id}')">✓ Confirmar</button>
    </div>`;
  });
  html+='</div>';
  banner.innerHTML=html;
}

window.confirmRecurring=async(monthKey, recId)=>{
  if(!cfg.confirmedMonths)cfg.confirmedMonths=[];
  cfg.confirmedMonths.push(monthKey);
  // Find the recurring item
  let r=null;
  if(recId==='legacy'){
    r={type:'income',amount:cfg.salary,currency:'DOP',desc:cfg.incDesc||'Nómina',account:'Transferencia',destAccount:cfg.incAcc,category:'Ingreso'};
  } else {
    r=(cfg.recurrings||[]).find(x=>x.id===recId);
  }
  if(!r){await saveCfg();checkRecurring();return;}
  const amtDOP=r.currency==='USD'?r.amount*EX:r.amount;
  if(r.type==='income') updateBalance(r.destAccount||r.account,amtDOP);
  else updateBalance(r.account,-amtDOP);
  await addTx({type:r.type,currency:r.currency||'DOP',amount:r.amount,amountDOP:amtDOP,desc:r.desc,account:r.account,destAccount:r.destAccount||null,category:r.category||'Ingreso',tipo:'recurrente'});
  await saveCfg();
  // Web notification
  if(Notification.permission==='granted'){
    const sign=r.type==='income'?'+':'-';
    const amtD=r.currency==='USD'?`USD $${r.amount.toFixed(2)}`:`RD$${fmt(r.amount)}`;
    new Notification(`✅ ${r.desc} confirmado`,{body:`${sign}${amtD} registrado correctamente`,icon:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💼</text></svg>'});
  }
  checkRecurring();
};

// ── MANAGE RECURRING ────────────────────────────────────────────────────────
window.openManageRecurrings=function(){
  const recs=cfg?.recurrings||[];
  const ct=document.getElementById('rec-manage-list');
  if(!ct) return;
  ct.innerHTML='';
  if(!recs.length){ct.innerHTML='<div style="color:var(--text2);font-size:13px;padding:8px 0">No tienes pagos recurrentes configurados.</div>';return;}
  recs.forEach((r,i)=>{
    const sign=r.type==='income'?'+':'-';
    const amtD=r.currency==='USD'?`USD $${r.amount.toFixed(2)}`:`RD$${fmt(r.amount)}`;
    const div=document.createElement('div');
    div.style.cssText='background:var(--bg3);border-radius:var(--rs);padding:12px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:10px';
    div.innerHTML=`<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.desc}</div><div style="font-size:12px;color:var(--text2)">${sign}${amtD} · Día ${r.day} · ${r.type==='income'?'Ingreso':'Gasto'}</div></div><button onclick="deleteRecurring(${i})" style="background:rgba(255,77,77,.15);border:1px solid rgba(255,77,77,.3);color:#ff8080;border-radius:var(--rs);padding:6px 10px;font-size:13px;cursor:pointer;flex-shrink:0">🗑️</button>`;
    ct.appendChild(div);
  });
};

window.deleteRecurring=async(i)=>{
  if(!confirm('¿Eliminar este recurrente?'))return;
  cfg.recurrings.splice(i,1);
  await saveCfg();
  openManageRecurrings();
  checkRecurring();
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────
function buildNotifications(){
  notifications=[];
  const now=new Date();
  const mTx=txs.filter(t=>t.date.getMonth()===now.getMonth()&&t.date.getFullYear()===now.getFullYear());
  const tIn=mTx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amountDOP,0);
  const tEx=mTx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amountDOP,0);
  const ct={};
  mTx.filter(t=>t.type==='expense').forEach(t=>{ct[t.category]=(ct[t.category]||0)+t.amountDOP;});
  // Category alerts
  Object.entries(ct).forEach(([cat,amt])=>{
    const l=CL[cat]||0;
    if(l&&amt/l>=1)notifications.push({type:'danger',ico:'🚨',title:`Límite superado en ${cat}`,sub:`Gastaste RD$${fmt(amt)} de RD$${fmt(l)} presupuestado`});
    else if(l&&amt/l>=.8)notifications.push({type:'warn',ico:'⚠️',title:`Casi en el límite: ${cat}`,sub:`${Math.round(amt/l*100)}% del presupuesto usado (RD$${fmt(amt)} / RD$${fmt(l)})`});
  });
  // Income vs expense
  if(tIn>0&&tEx/tIn>.9)notifications.push({type:'danger',ico:'🚨',title:'Gastas casi todo lo que ganas',sub:`${Math.round(tEx/tIn*100)}% de tus ingresos van a gastos este mes`});
  if(tIn>0&&tEx/tIn>.5&&tEx/tIn<=.9)notifications.push({type:'warn',ico:'⚠️',title:'Más de la mitad de ingresos en gastos',sub:`Llevas RD$${fmt(tEx)} gastado de RD$${fmt(tIn)} en ingresos`});
  // Credit card limits
  (cfg?.products||[]).filter(p=>p.toLowerCase().includes('crédito')).forEach(p=>{
    const lim=cfg?.limits?.[p]||0;if(!lim)return;
    const used=txs.filter(t=>t.account===p).reduce((s,t)=>s+t.amountDOP,0);
    const pct=used/lim*100;
    if(pct>=100)notifications.push({type:'danger',ico:'💳',title:`Límite alcanzado: ${p}`,sub:`Usaste RD$${fmt(used)} de RD$${fmt(lim)}`});
    else if(pct>=80)notifications.push({type:'warn',ico:'💳',title:`Crédito casi lleno: ${p}`,sub:`${Math.round(pct)}% usado — RD$${fmt(lim-used)} disponible`});
  });
  // Zero / negative balances
  Object.entries(cfg?.balances||{}).forEach(([acc,bal])=>{
    if(bal<=0)notifications.push({type:'danger',ico:'❌',title:`Sin fondos: ${acc}`,sub:bal<0?`Balance negativo: RD$${fmt(bal)}`:'Balance en cero — considera otra cuenta'});
  });
  // Savings suggestion
  if(tIn>0&&tEx/tIn<.6)notifications.push({type:'info',ico:'🐷',title:'¡Buen control de gastos!',sub:`Solo gastas el ${Math.round(tEx/tIn*100)}% de tus ingresos. Considera ahorrar el resto.`});
  // Update badge
  const count=notifications.filter(n=>n.type!=='info').length;
  const nb=document.getElementById('notif-badge');if(nb)nb.style.display=count>0?'block':'none';
  // Auto-dismiss home alerts after 60s
  clearTimeout(window._alertTimer);
  if(count>0){
    window._alertTimer=setTimeout(()=>{
      const ct=document.getElementById('alerts-ct');
      if(!ct)return;
      ct.style.transition='opacity 1.2s ease';
      ct.style.opacity='0';
      setTimeout(()=>{
        if(ct){ct.innerHTML='';ct.style.opacity='1';ct.style.transition='';}
      },1200);
    },60000);
  }
}

function renderNotifs(){
  const el=document.getElementById('notif-list');
  if(!el)return;
  el.innerHTML='';
  if(!notifications.length){el.innerHTML='<div style="text-align:center;padding:40px 20px;color:var(--text2);font-size:14px;line-height:2">🔔<br>Sin alertas por ahora</div>';return;}
  notifications.forEach(n=>{
    const d=document.createElement('div');
    d.style.cssText='background:var(--bg3);border-radius:var(--rs);padding:12px 14px;margin-bottom:10px;display:flex;gap:10px;align-items:flex-start';
    const borderCol=n.type==='danger'?'rgba(255,77,77,.4)':n.type==='warn'?'rgba(245,166,35,.4)':'rgba(108,99,255,.3)';
    d.style.borderLeft=`3px solid ${borderCol}`;
    d.innerHTML=`<div style="font-size:20px;flex-shrink:0">${n.ico}</div><div style="flex:1"><div style="font-size:14px;font-weight:500;margin-bottom:2px">${n.title}</div><div style="font-size:12px;color:var(--text2);line-height:1.4">${n.sub}</div></div>`;
    el.appendChild(d);
  });
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────
function updateDash(){
  if(!document.getElementById('pg-home').classList.contains('on'))return;
  const now=new Date();
  const mTx=txs.filter(t=>t.date.getMonth()===now.getMonth()&&t.date.getFullYear()===now.getFullYear());
  const tIn=mTx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amountDOP,0);
  const tEx=mTx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amountDOP,0);
  // Total balance = sum of all account balances
  const totalBal=Object.values(cfg?.balances||{}).reduce((s,v)=>s+v,0);
  document.getElementById('bal-amt').textContent='RD$ '+fmt(totalBal);
  document.getElementById('bal-usd').textContent='≈ USD '+fmtD(totalBal/EX);
  document.getElementById('bal-in').textContent='Ingresos: RD$'+fmt(tIn);
  document.getElementById('bal-ex').textContent='Gastos: RD$'+fmt(tEx);
  document.getElementById('st-in').textContent='RD$'+fmt(tIn);
  document.getElementById('st-ex').textContent='RD$'+fmt(tEx);
  // Category bars
  const ct={};mTx.filter(t=>t.type==='expense').forEach(t=>{ct[t.category]=(ct[t.category]||0)+t.amountDOP;});
  const bEl=document.getElementById('cat-bars');
  if(!Object.keys(ct).length){bEl.innerHTML='<div class="empty">📊<br>Sin gastos este mes</div>';}
  else{bEl.innerHTML='';Object.entries(ct).sort((a,b)=>b[1]-a[1]).forEach(([cat,amt])=>{const l=CL[cat]||5000,pct=Math.min(amt/l*100,100),col=CC[cat]||'#888',fill=pct>=90?'var(--red)':pct>=70?'var(--amber)':col;bEl.innerHTML+=`<div class="bgt-i"><div class="bgt-h"><span style="color:${col}">${CE[cat]||'📦'} ${cat}</span><span class="bgt-a">RD$${fmt(amt)}${l?' / '+fmt(l):''}</span></div><div class="prog"><div class="prog-f" style="width:${pct.toFixed(0)}%;background:${fill}"></div></div></div>`;});}
  // Alerts
  const al=notifications.filter(n=>n.type!=='info');
  document.getElementById('alerts-ct').innerHTML=al.map(n=>`<div class="alrt ${n.type==='danger'?'dng':''}" onclick="openNotifPanel()">${n.ico} ${n.title}</div>`).join('');
  document.getElementById('notif-badge').style.display=al.length?'block':'none';
  renderTxList('tx-home',txs.slice(0,6));
}

// ─── ACCOUNTS PAGE ────────────────────────────────────────────────────────
function buildAccList(){
  const el=document.getElementById('acc-list');el.innerHTML='';
  if(!cfg?.products?.length){el.innerHTML='<div class="empty">💳<br>Configura tus cuentas</div>';return;}
  cfg.products.forEach(p=>{
    const bal=getBalance(p);
    const lim=(cfg.limits||{})[p]||0;
    const isCC=p.toLowerCase().includes('crédito');
    const used=isCC?txs.filter(t=>t.account===p).reduce((s,t)=>s+t.amountDOP,0):0;
    const pct=isCC&&lim?Math.min(used/lim*100,100):0;
    let badgeCls='b-ok',badgeTxt='✅ OK';
    if(isCC&&pct>=100){badgeCls='b-neg';badgeTxt='❌ Límite';}
    else if(isCC&&pct>=80){badgeCls='b-wa';badgeTxt='⚠️ Vigilar';}
    else if(!isCC&&bal!==null&&bal<=0){badgeCls=bal<0?'b-neg':'b-wa';badgeTxt=bal<0?'❌ Negativo':'⚠️ En cero';}
    const balDisplay=isCC?`RD$ ${fmt(lim-used)} disponible`:(bal!==null?`RD$ ${fmt(bal)}`:'RD$ —');
    const subDisplay=isCC&&lim?`Usado: RD$${fmt(used)} / RD$${fmt(lim)}`:(bal!==null&&bal<0?`⚠️ Balance negativo`:'');
    el.innerHTML+=`<div class="ac-card"><div class="ac-h"><div class="ac-n">${PI[p]||'💳'} ${p}</div><div class="bdg ${badgeCls}">${badgeTxt}</div></div><div class="ac-bal">${balDisplay}</div>${subDisplay?`<div class="ac-sub">${subDisplay}</div>`:''}${isCC&&lim?`<div style="margin-top:8px"><div class="prog"><div class="prog-f" style="width:${pct.toFixed(0)}%;background:${pct>=90?'var(--red)':pct>=70?'var(--amber)':'#6c63ff'}"></div></div></div>`:''}${!isCC&&bal!==null&&bal<0?`<div style="font-size:12px;color:var(--red);margin-top:6px">Este saldo está en negativo. Considera transferir fondos.</div>`:''}</div>`;
  });
}

// ─── MANAGE ACCOUNTS ─────────────────────────────────────────────────────
window.openManageAccts=function(){
  const ct=document.getElementById('mg-list');ct.innerHTML='';
  Object.entries({...Object.fromEntries(Object.entries(BP).filter(([k])=>(cfg?.banks||[]).includes(k)))}).forEach(([bank,prods])=>{
    const h=document.createElement('div');h.style.cssText='font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;padding:12px 4px 6px;font-weight:600;border-bottom:1px solid var(--border);margin-bottom:8px';h.textContent='🏦 '+bank;ct.appendChild(h);
    prods.forEach(p=>addMgItem(ct,p));
  });
  const uh=document.createElement('div');uh.style.cssText='font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;padding:12px 4px 6px;font-weight:600;border-bottom:1px solid var(--border);margin-bottom:8px';uh.textContent='💳 Otros métodos';ct.appendChild(uh);
  UNI.forEach(p=>addMgItem(ct,p));
  // Add bank selector for adding new accounts
  const ar=document.createElement('div');
  ar.style.cssText='padding:14px;background:var(--bg3);border-radius:var(--rs);margin-top:16px;border:1px solid var(--border)';
  ar.innerHTML=`
    <div style="font-size:13px;font-weight:600;color:var(--text2);margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px">➕ Agregar banco o cuenta</div>
    <div style="font-size:12px;color:var(--text2);margin-bottom:6px">Selecciona un banco</div>
    <select id="mg-bank-sel" class="si" style="margin-bottom:10px" onchange="onMgBankChange()">
      <option value="">— Elige un banco —</option>
      ${ALL_BANKS.map(b=>`<option value="${b.val}">${b.label}</option>`).join('')}
      <option value="_custom">📦 Otra cuenta (nombre libre)</option>
    </select>
    <div id="mg-bank-prods" style="display:none;margin-bottom:10px"></div>
    <div id="mg-custom-row" style="display:none">
      <div style="font-size:12px;color:var(--text2);margin-bottom:6px">Nombre de la cuenta</div>
      <input class="ti" id="mg-ci" type="text" placeholder="Ej: Cripto, Nequi, Zelle..." style="margin-bottom:8px"/>
      <button onclick="addMgCustom()" style="width:100%;padding:10px;background:rgba(108,99,255,.15);border:1px solid rgba(108,99,255,.3);border-radius:var(--rs);color:#a89dff;font-size:14px;font-weight:600;cursor:pointer">+ Agregar</button>
    </div>
  `;
  ct.appendChild(ar);
  openOv('mg-ov');
};

function addMgItem(ct,p){
  const active=(cfg?.products||[]).includes(p.val);
  const el=document.createElement('div');el.className='ob-c'+(active?' on':'');el.dataset.v=p.val;el.style.marginBottom='8px';
  el.innerHTML=`<span class="ob-ci">${p.ico}</span><span class="ob-cl2">${p.val}</span><span class="ob-cm">✅</span>`;
  const lid='ml-'+p.val.replace(/ /g,'_');
  el.onclick=()=>{el.classList.toggle('on');const lr=document.getElementById(lid);if(lr)lr.style.display=el.classList.contains('on')?'block':'none';};
  ct.appendChild(el);
  if(p.credit){const row=document.createElement('div');row.id=lid;row.style.cssText=`display:${active?'block':'none'};padding:8px 12px 12px;background:var(--bg3);border-radius:0 0 var(--rs) var(--rs);margin-top:-8px;margin-bottom:4px`;const eL=(cfg?.limits||{})[p.val]||'';row.innerHTML=`<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Límite de ${p.val} (DOP)</div><input class="ti mg-lim" data-p="${p.val}" type="text" inputmode="decimal" placeholder="Ej: 17,000" value="${eL?Number(eL).toLocaleString('es-DO'):''}" style="font-size:15px;padding:10px 14px"/>`;ct.appendChild(row);setTimeout(()=>bindFmt(row.querySelector('input')),50);}
}


window.onMgBankChange=function(){
  const sel=document.getElementById('mg-bank-sel');
  const prodsDiv=document.getElementById('mg-bank-prods');
  const customRow=document.getElementById('mg-custom-row');
  const val=sel.value;
  if(!val){prodsDiv.style.display='none';customRow.style.display='none';return;}
  if(val==='_custom'){prodsDiv.style.display='none';customRow.style.display='block';return;}
  customRow.style.display='none';
  const prods=BP[val]||[];
  if(!prods.length){prodsDiv.style.display='none';return;}
  prodsDiv.style.display='block';
  prodsDiv.innerHTML='<div style="font-size:12px;color:var(--text2);margin-bottom:8px">Selecciona los productos</div>';
  prods.forEach(p=>{
    const already=(cfg?.products||[]).includes(p.val);
    const el=document.createElement('div');
    el.className='ob-c'+(already?' on':'');
    el.dataset.v=p.val;
    el.style.marginBottom='8px';
    el.innerHTML=`<span class="ob-ci">${p.ico}</span><span class="ob-cl2">${p.val}${already?' <span style="font-size:11px;color:var(--text2)">(ya agregada)</span>':''}</span><span class="ob-cm">✅</span>`;
    if(!already) el.onclick=()=>el.classList.toggle('on');
    prodsDiv.appendChild(el);
    if(p.credit&&!already){
      const row=document.createElement('div');
      row.id='mgnew-lim-'+p.val.replace(/ /g,'_');
      row.style.cssText='display:none;padding:8px 12px 10px;background:var(--bg2);border-radius:0 0 var(--rs) var(--rs);margin-top:-8px;margin-bottom:4px';
      row.innerHTML=`<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Límite de ${p.val} (DOP)</div><input class="ti mgnew-lim" data-p="${p.val}" type="text" inputmode="decimal" placeholder="Ej: 17,000" style="font-size:15px;padding:10px 14px"/>`;
      el.onclick=()=>{
        el.classList.toggle('on');
        row.style.display=el.classList.contains('on')?'block':'none';
      };
      prodsDiv.appendChild(row);
      setTimeout(()=>bindFmt(row.querySelector('input')),50);
    }
  });
  // Add button
  const addBtn=document.createElement('button');
  addBtn.textContent='+ Agregar seleccionados';
  addBtn.style.cssText='width:100%;padding:10px;background:rgba(108,99,255,.15);border:1px solid rgba(108,99,255,.3);border-radius:var(--rs);color:#a89dff;font-size:14px;font-weight:600;cursor:pointer;margin-top:8px';
  addBtn.onclick=()=>{
    const selected=[...prodsDiv.querySelectorAll('.ob-c.on')].map(el=>el.dataset.v).filter(v=>v&&!(cfg?.products||[]).includes(v));
    if(!selected.length){alert('Selecciona al menos un producto nuevo');return;}
    if(!cfg.products)cfg.products=[];
    cfg.products=[...new Set([...cfg.products,...selected])];
    // Collect limits
    if(!cfg.limits)cfg.limits={};
    prodsDiv.querySelectorAll('.mgnew-lim').forEach(inp=>{
      const v=parseFloat(inp.value.replace(/[^0-9.]/g,''))||0;
      if(v>0)cfg.limits[inp.dataset.p]=v;
    });
    // Add bank to cfg.banks if not already there
    const bankVal=document.getElementById('mg-bank-sel').value;
    if(bankVal&&bankVal!=='_custom'&&!(cfg.banks||[]).includes(bankVal)){
      if(!cfg.banks)cfg.banks=[];
      cfg.banks.push(bankVal);
    }
    saveCfg().then(()=>{openManageAccts();setSS('ok','Cuentas actualizadas');});
  };
  prodsDiv.appendChild(addBtn);
};

window.addMgCustom=function(){const inp=document.getElementById('mg-ci');const v=inp.value.trim();if(!v)return;if(!(cfg.products||[]).includes(v)){cfg.products=[...(cfg.products||[]),v];}inp.value='';openManageAccts();};

window.saveMgAccts=async function(){
  const newP=[...document.querySelectorAll('#mg-list .ob-c.on')].map(el=>el.dataset.v).filter(Boolean);
  const newL={...(cfg.limits||{})};
  document.querySelectorAll('.mg-lim').forEach(inp=>{const v=parseFloat(inp.value.replace(/[^0-9.]/g,''))||0;if(v>0)newL[inp.dataset.p]=v;else delete newL[inp.dataset.p];});
  cfg.products=newP;cfg.limits=newL;
  await saveCfg();closeOv('mg-ov');buildAccList();setSS('ok','Cuentas actualizadas');
};

// ─── HISTORY ──────────────────────────────────────────────────────────────
document.querySelectorAll('#hist-filters .fb').forEach(b=>{b.onclick=()=>{document.querySelectorAll('#hist-filters .fb').forEach(x=>x.classList.remove('on'));b.classList.add('on');histF=b.dataset.f;renderHist();};});

function renderHist(){
  const el=document.getElementById('tx-hist');el.innerHTML='';
  const fl=histF==='all'?[...txs]:txs.filter(t=>t.type===histF);
  if(!fl.length){el.innerHTML='<div class="empty">📅<br>Sin movimientos</div>';return;}
  let lk='';
  fl.forEach(t=>{const k=`${t.date.getFullYear()}-${t.date.getMonth()}`;if(k!==lk){const d=document.createElement('div');d.className='mo-div';d.textContent=`📅 ${MONTHS[t.date.getMonth()]} ${t.date.getFullYear()}`;el.appendChild(d);lk=k;}el.appendChild(makeTx(t));});
}

// ─── TX ELEMENT ───────────────────────────────────────────────────────────
function makeTx(t){
  const sign=t.type==='expense'?'−':'+',cls=t.type==='expense'?'neg':'pos';
  const disp=t.currency==='USD'?`${sign}USD $${fmtD(t.amount)}`:`${sign}RD$${fmt(t.amountDOP||t.amount)}`;
  const col=CC[t.category]||'#6c63ff',emoji=t.type==='income'?'💰':(CE[t.category]||'📦');
  const ds=t.date.toLocaleDateString('es-DO',{day:'2-digit',month:'short'});
  const dest=t.destAccount?` → ${t.destAccount}`:'';
  const el=document.createElement('div');el.className='tx-i';
  el.innerHTML=`<div class="tx-ico" style="background:${col}22">${emoji}</div><div class="tx-inf"><div class="tx-n">${t.desc}</div><div class="tx-m">${t.account}${dest} · ${ds} <span class="tag">${t.category||'Ingreso'}</span></div></div><div class="tx-a ${cls}">${disp}</div>`;
  attachLP(el,t);return el;
}

function renderTxList(id,list){const el=document.getElementById(id);el.innerHTML='';if(!list.length){el.innerHTML='<div class="empty">🧾<br>Sin movimientos</div>';return;}list.forEach(t=>el.appendChild(makeTx(t)));}

// ─── LONG PRESS ───────────────────────────────────────────────────────────
function attachLP(el,t){
  let tmr=null,mv=false;
  const start=()=>{mv=false;el.classList.add('pressing');tmr=setTimeout(()=>{if(!mv)showCtx(t);el.classList.remove('pressing');},550);};
  const cancel=()=>{clearTimeout(tmr);el.classList.remove('pressing');};
  el.addEventListener('touchstart',start,{passive:true});el.addEventListener('touchend',cancel);el.addEventListener('touchmove',()=>{mv=true;cancel();},{passive:true});
  el.addEventListener('mousedown',start);el.addEventListener('mouseup',cancel);el.addEventListener('mouseleave',cancel);el.addEventListener('contextmenu',e=>e.preventDefault());
}

// ─── CONTEXT MENU ─────────────────────────────────────────────────────────
function showCtx(t){
  ctxTx=t;
  const col=CC[t.category]||'#6c63ff',emoji=t.type==='income'?'💰':(CE[t.category]||'📦');
  const sign=t.type==='expense'?'−':'+',disp=t.currency==='USD'?`${sign}USD $${fmtD(t.amount)}`:`${sign}RD$${fmt(t.amountDOP||t.amount)}`;
  document.getElementById('ctx-prev').innerHTML=`<div style="width:38px;height:38px;border-radius:50%;background:${col}22;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${emoji}</div><div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.desc}</div><div style="font-size:12px;color:var(--text2)">${t.account}${t.destAccount?' → '+t.destAccount:''} · ${t.category||'Ingreso'}</div></div><div style="font-size:15px;font-weight:600;color:${t.type==='expense'?'var(--red)':'var(--green)'}">${disp}</div>`;
  openOv('ctx-ov');
}

document.getElementById('ctx-dl').onclick=()=>{closeOv('ctx-ov');document.getElementById('cf-sub').textContent=`"${ctxTx.desc}". Esta acción no se puede deshacer.`;openOv('cf-ov');};
document.getElementById('cf-ok').onclick=async()=>{closeOv('cf-ov');if(!ctxTx||!user)return;await deleteDoc(doc(db,'users',user.uid,'transactions',ctxTx.id));ctxTx=null;};
document.getElementById('ctx-ed').onclick=()=>{
  closeOv('ctx-ov');
  document.getElementById('ed-desc').value=ctxTx.desc||'';
  document.getElementById('ed-amt').value=(ctxTx.amount||0).toLocaleString('es-DO',{maximumFractionDigits:2});
  edCurr=ctxTx.currency||'DOP';
  document.getElementById('ed-dop').className='cb'+(edCurr==='DOP'?' on':'');
  document.getElementById('ed-usd').className='cb'+(edCurr==='USD'?' on':'');
  document.getElementById('ed-cat').value=ctxTx.category||'Otro';
  document.getElementById('ed-cat-l').style.display=ctxTx.type==='income'?'none':'';
  document.getElementById('ed-cat').style.display=ctxTx.type==='income'?'none':'';
  // Add custom categories to edit select
  const edCatSel=document.getElementById('ed-cat');
  const edExisting=[...edCatSel.options].map(o=>o.value);
  (cfg?.customCategories||[]).forEach(c=>{
    if(!edExisting.includes(c.name)){const o=document.createElement('option');o.value=c.name;o.textContent=`${c.emoji} ${c.name}`;edCatSel.appendChild(o);}
  });
  const accSel=document.getElementById('ed-acc');accSel.innerHTML='';
  getAccList(ctxTx.type).forEach(a=>{const o=document.createElement('option');o.value=a.val;o.textContent=a.label;if(a.val===ctxTx.account)o.selected=true;accSel.appendChild(o);});
  bindFmt(document.getElementById('ed-amt'));
  openOv('ed-ov');
};
document.getElementById('ed-dop').onclick=()=>{edCurr='DOP';document.getElementById('ed-dop').className='cb on';document.getElementById('ed-usd').className='cb';};
document.getElementById('ed-usd').onclick=()=>{edCurr='USD';document.getElementById('ed-dop').className='cb';document.getElementById('ed-usd').className='cb on';};
document.getElementById('ed-sv').onclick=async()=>{
  if(!ctxTx||!user)return;
  const desc=document.getElementById('ed-desc').value.trim();
  const amt=parseFloat(document.getElementById('ed-amt').value.replace(/[^0-9.]/g,''))||0;
  if(!desc||!amt)return;
  closeOv('ed-ov');
  await updateDoc(doc(db,'users',user.uid,'transactions',ctxTx.id),{desc,amount:amt,currency:edCurr,amountDOP:edCurr==='USD'?amt*EX:amt,category:document.getElementById('ed-cat').value,account:document.getElementById('ed-acc').value});
  ctxTx=null;
};

// ─── CHART ────────────────────────────────────────────────────────────────
document.querySelectorAll('#chart-type-btns .fb').forEach(b=>{b.onclick=()=>{document.querySelectorAll('#chart-type-btns .fb').forEach(x=>x.classList.remove('on'));b.classList.add('on');chartType=b.dataset.ct;renderChart();};});

function renderChart(){
  if(!document.getElementById('pg-chart').classList.contains('on'))return;
  // Build month buttons
  const months=[...new Set(txs.map(t=>`${t.date.getFullYear()}-${t.date.getMonth()}`))].slice(0,6);
  const mbEl=document.getElementById('chart-month-btns');
  if(!chartMonth&&months.length)chartMonth=months[0];
  mbEl.innerHTML='';
  months.forEach(m=>{
    const [y,mo]=m.split('-').map(Number);
    const b=document.createElement('button');b.className='fb'+(m===chartMonth?' on':'');b.textContent=`${MONTHS[mo].slice(0,3)} ${y}`;
    b.onclick=()=>{chartMonth=m;renderChart();};mbEl.appendChild(b);
  });
  // Filter txs
  const [chy,chm]=chartMonth?chartMonth.split('-').map(Number):[new Date().getFullYear(),new Date().getMonth()];
  const fl=txs.filter(t=>t.type===chartType&&t.date.getFullYear()===chy&&t.date.getMonth()===chm);
  // Aggregate
  const agg={};
  fl.forEach(t=>{const k=chartType==='expense'?(t.category||'Otro'):(t.account||'Otro');agg[k]=(agg[k]||0)+(t.amountDOP||t.amount);});
  const entries=Object.entries(agg).sort((a,b)=>b[1]-a[1]);
  const total=entries.reduce((s,[,v])=>s+v,0);
  // Draw pie
  const canvas=document.getElementById('pie-canvas');
  const dpr=window.devicePixelRatio||1;
  const SIZE=220;
  canvas.width=SIZE*dpr;canvas.height=SIZE*dpr;
  const ctx2=canvas.getContext('2d');
  ctx2.scale(dpr,dpr);
  const pcx=SIZE/2,pcy=SIZE/2,R=95,IR=44;
  ctx2.clearRect(0,0,SIZE,SIZE);
  if(!entries.length){
    ctx2.fillStyle='#2a2a38';ctx2.beginPath();ctx2.arc(pcx,pcy,R,0,Math.PI*2);ctx2.fill();
    ctx2.fillStyle='#1a1a22';ctx2.beginPath();ctx2.arc(pcx,pcy,IR,0,Math.PI*2);ctx2.fill();
    ctx2.fillStyle='#666';ctx2.font='14px system-ui,sans-serif';ctx2.textAlign='center';ctx2.textBaseline='middle';ctx2.fillText('Sin datos',pcx,pcy);
    renderChartLegend([],total);return;
  }
  const colors=entries.map(([k])=>CC[k]||(chartType==='income'?'#3dd68c':'#6c63ff'));
  let start=-Math.PI/2;
  entries.forEach(([k,v],i)=>{
    const slice=v/total*Math.PI*2;
    ctx2.beginPath();ctx2.moveTo(pcx,pcy);ctx2.arc(pcx,pcy,R,start,start+slice);ctx2.closePath();
    ctx2.fillStyle=colors[i];ctx2.fill();
    // Gap between slices
    ctx2.strokeStyle='#0f0f13';ctx2.lineWidth=2;ctx2.stroke();
    start+=slice;
  });
  // Donut hole
  ctx2.beginPath();ctx2.arc(pcx,pcy,IR,0,Math.PI*2);ctx2.fillStyle='#1a1a22';ctx2.fill();
  // Center text
  ctx2.fillStyle='#f0f0f8';ctx2.font=`bold ${SIZE>200?15:13}px system-ui,sans-serif`;ctx2.textAlign='center';ctx2.textBaseline='middle';
  ctx2.fillText('RD$'+fmt(total),pcx,pcy-8);
  ctx2.font=`11px system-ui,sans-serif`;ctx2.fillStyle='#9999b8';
  ctx2.fillText(chartType==='expense'?'Gastos del mes':'Ingresos del mes',pcx,pcy+10);
  renderChartLegend(entries.map(([k,v],i)=>({label:k,val:v,color:colors[i]})),total);
}

function renderChartLegend(items,total){
  const el=document.getElementById('chart-legend');el.innerHTML='';
  items.forEach(item=>{const pct=total>0?Math.round(item.val/total*100):0;const d=document.createElement('div');d.className='leg-i';d.innerHTML=`<div class="leg-dot" style="background:${item.color}"></div><div style="flex:1">${CE[item.label]||'📦'} ${item.label}</div><div style="font-weight:600">RD$${fmt(item.val)}</div><div style="color:var(--text2);font-size:12px;margin-left:8px">${pct}%</div>`;el.appendChild(d);});
}


// ─── CATEGORY CONFIG ───────────────────────────────────────────────────────
// Custom categories stored in cfg.customCategories = [{name, emoji, limit}]
// Custom limits for default cats in cfg.catLimits = {name: limit}

function getEffectiveLimits(){
  return {...CL, ...(cfg?.catLimits||{})};
}

function getEffectiveCategories(){
  const hidden=cfg?.hiddenCategories||[];
  const defaults=Object.keys(CE).filter(k=>k!=='Ingreso'&&!hidden.includes(k));
  const customs=(cfg?.customCategories||[]).map(c=>c.name).filter(n=>!hidden.includes(n));
  return [...new Set([...defaults,...customs])];
}

function getCatEmoji(name){
  return CE[name] || (cfg?.customCategories||[]).find(c=>c.name===name)?.emoji || '📦';
}

window.openCatConfig=function(){
  closeOv('pf-ov');
  const ct = document.getElementById('cat-cfg-list');
  ct.innerHTML = '';
  const limits = getEffectiveLimits();
  const cats = getEffectiveCategories();
  const hiddenCats = cfg?.hiddenCategories||[];
  cats.filter(name=>!hiddenCats.includes(name)).forEach(name => {
    const emoji = getCatEmoji(name);
    const limit = limits[name] || 0;
    const isCustom = (cfg?.customCategories||[]).some(c=>c.name===name);
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)';
    div.innerHTML = `
      <div style="font-size:20px;flex-shrink:0">${emoji}</div>
      <div style="flex:1;font-size:14px;font-weight:500">${name}</div>
      <div style="display:flex;align-items:center;gap:6px">
        <input class="ti cat-limit-inp" data-cat="${name}"
          type="text" inputmode="decimal"
          value="${limit > 0 ? Number(limit).toLocaleString('es-DO') : ''}"
          placeholder="Sin límite"
          style="width:100px;padding:8px 10px;font-size:14px;text-align:right"/>
        <button onclick="hideCat('${name}')" style="background:rgba(255,77,77,.15);border:1px solid rgba(255,77,77,.3);color:#ff8080;border-radius:var(--rs);padding:6px 8px;font-size:14px;cursor:pointer;flex-shrink:0">🗑️</button>
      </div>`;
    ct.appendChild(div);
    setTimeout(()=>bindFmt(div.querySelector('.cat-limit-inp')), 50);
  });
  // Show hidden categories section if any
  if(hiddenCats.length){
    const hdr=document.createElement('div');
    hdr.style.cssText='font-size:12px;color:var(--text2);margin-top:14px;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px';
    hdr.textContent='Categorías ocultas';
    ct.appendChild(hdr);
    hiddenCats.forEach(name=>{
      const div=document.createElement('div');
      div.style.cssText='display:flex;align-items:center;gap:10px;padding:8px 0;opacity:.5';
      div.innerHTML=`<div style="font-size:18px">${getCatEmoji(name)}</div><div style="flex:1;font-size:13px">${name}</div><button onclick="restoreCat('${name}')" style="background:rgba(61,214,140,.1);border:1px solid rgba(61,214,140,.2);color:#3dd68c;border-radius:var(--rs);padding:5px 10px;font-size:12px;cursor:pointer">Restaurar</button>`;
      ct.appendChild(div);
    });
  }
  openOv('cat-cfg-ov');
};

window.addCustomCategory=function(){
  const name = document.getElementById('cat-new-name').value.trim();
  const emoji = document.getElementById('cat-new-emoji').value.trim() || '📦';
  const limit = parseFloat((document.getElementById('cat-new-limit').value||'0').replace(/[^0-9.]/g,''))||0;
  if(!name){ document.getElementById('cat-new-name').style.borderColor='var(--red)'; return; }
  if(!cfg.customCategories) cfg.customCategories=[];
  if(cfg.customCategories.some(c=>c.name===name)||Object.keys(CE).includes(name)){
    alert('Ya existe una categoría con ese nombre'); return;
  }
  cfg.customCategories.push({name, emoji, limit});
  // Also add to CE and CL live
  CE[name] = emoji;
  if(limit > 0) CL[name] = limit;
  document.getElementById('cat-new-name').value='';
  document.getElementById('cat-new-emoji').value='';
  document.getElementById('cat-new-limit').value='';
  openCatConfig(); // refresh list
};

window.hideCat=function(name){
  if(!cfg.hiddenCategories)cfg.hiddenCategories=[];
  if(!cfg.hiddenCategories.includes(name)) cfg.hiddenCategories.push(name);
  openCatConfig();
};
window.restoreCat=function(name){
  cfg.hiddenCategories=(cfg.hiddenCategories||[]).filter(c=>c!==name);
  openCatConfig();
};
window.removeCustomCat=function(name){
  cfg.customCategories=(cfg.customCategories||[]).filter(c=>c.name!==name);
  delete CE[name]; delete CL[name];
  openCatConfig();
};

window.saveCategoryConfig=async function(){
  if(!cfg.catLimits) cfg.catLimits={};
  document.querySelectorAll('.cat-limit-inp').forEach(inp=>{
    const v=parseFloat(inp.value.replace(/[^0-9.]/g,''))||0;
    const cat=inp.dataset.cat;
    if(v>0){cfg.catLimits[cat]=v;CL[cat]=v;}
    else{delete cfg.catLimits[cat];}
  });
  // Save hidden categories too
  await saveCfg();
  // Reload effective limits
  Object.assign(CL,cfg.catLimits||{});
  closeOv('cat-cfg-ov');
  setSS('ok','Categorías guardadas');
  buildNotifications();
  updateDash();
};


// ─── STEP 7 — RECURRING DETAIL ─────────────────────────────────────────────
const REC_SUBTYPES = {
  income: [{val:'nomina',label:'💼 Nómina / Salario'},{val:'producto',label:'📦 Venta de producto'},{val:'servicio',label:'💡 Servicio prestado'},{val:'renta',label:'🏠 Renta / Alquiler'},{val:'otro',label:'📄 Otro ingreso'}],
  expense:[{val:'suscripcion',label:'📱 Suscripción (Netflix, Spotify...)'},{val:'servicio',label:'💡 Servicio (luz, agua, internet)'},{val:'prestamo',label:'🏦 Cuota de préstamo'},{val:'renta',label:'🏠 Renta / Alquiler'},{val:'tarjeta',label:'💳 Pago de tarjeta de crédito'},{val:'otro',label:'📄 Otro gasto'}],
};
let recSubtype = '';

function buildStep7(){
  // Build subtype options
  const ct=document.getElementById('ms7-sub');ct.innerHTML='';recSubtype='';
  const subtypes=REC_SUBTYPES[rType]||REC_SUBTYPES.expense;
  subtypes.forEach(s=>{
    const b=document.createElement('button');b.className='opt-b';b.textContent=s.label;b._v=s.val;
    b.onclick=()=>{ct.querySelectorAll('.opt-b').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');recSubtype=s.val;};
    ct.appendChild(b);
  });
  // Build account select
  const sel=document.getElementById('ms7-acc');sel.innerHTML='';
  getAccList(rType).forEach(a=>{const o=document.createElement('option');o.value=a.val;o.textContent=a.label;sel.appendChild(o);});
  // Label
  document.getElementById('ms7-dest-wrap').querySelector('.fl').textContent=rType==='income'?'¿A qué cuenta llega?':'¿Desde qué cuenta sale?';
}

document.getElementById('ms7-nx').onclick=async()=>{
  const day=parseInt(document.getElementById('ms7-day').value)||1;
  const acct=document.getElementById('ms7-acc').value;
  const amt=rawAmt('amt-f');
  const desc=document.getElementById('desc-f').value.trim();
  if(!recSubtype){alert('Selecciona el tipo de pago');return;}
  if(!day||day<1||day>31){document.getElementById('ms7-day').style.borderColor='var(--red)';return;}
  document.getElementById('ms7-day').style.borderColor='var(--border)';
  // Save recurring to cfg
  if(!cfg.recurrings)cfg.recurrings=[];
  const recId='rec_'+Date.now();
  const recItem={
    id:recId, type:rType, subtype:recSubtype,
    desc, amount:amt, currency:rCurr, day,
    account: rType==='expense'?acct:'Transferencia',
    destAccount: rType==='income'?acct:null,
    category: rType==='expense'?(document.getElementById('cat-f')?.value||'Otro'):'Ingreso',
    active:true
  };
  cfg.recurrings.push(recItem);
  await saveCfg();
  // Also register this month's occurrence right now
  const amtDOP=rCurr==='USD'?amt*EX:amt;
  if(rType==='income') updateBalance(acct,amtDOP);
  else updateBalance(recItem.account,-amtDOP);
  await addTx({type:rType,currency:rCurr,amount:amt,amountDOP:amtDOP,desc,account:recItem.account,destAccount:recItem.destAccount||null,category:recItem.category,tipo:'recurrente'});
  goReg('ok');
  document.getElementById('ok-msg').textContent=`${rType==='income'?'+':'-'}RD$${fmt(amtDOP)} · ${desc} guardado como recurrente (día ${day})`;
  // Request push notification permission
  if(Notification.permission==='default') Notification.requestPermission();
  setTimeout(()=>closeOv('reg-ov'),2000);
};



// ── ENTER KEY NAVIGATION IN MODAL ──────────────────────────────────────────
document.addEventListener('keydown', e => {
  if(e.key !== 'Enter') return;
  const regOv = document.getElementById('reg-ov');
  if(!regOv.classList.contains('on')) return;
  e.preventDefault();
  // Step 2: amount → click continue
  const ms2 = document.getElementById('ms-2');
  if(ms2 && ms2.style.display !== 'none' && ms2.classList.contains('on')){
    document.getElementById('ms2-nx').click(); return;
  }
  // Step 3: description → click continue
  const ms3 = document.getElementById('ms-3');
  if(ms3 && ms3.style.display !== 'none' && ms3.classList.contains('on')){
    document.getElementById('ms3-nx').click(); return;
  }
  // Step 7: recurring day field → click save
  const ms7 = document.getElementById('ms-7');
  if(ms7 && ms7.style.display !== 'none' && ms7.classList.contains('on')){
    document.getElementById('ms7-nx').click(); return;
  }
  // Edit modal
  const edOv = document.getElementById('ed-ov');
  if(edOv && edOv.classList.contains('on')){
    document.getElementById('ed-sv').click(); return;
  }
});


window.openResetBalances=function(){
  closeOv('pf-ov');
  const ct=document.getElementById('reset-bal-fields');
  ct.innerHTML='';
  const prods=(cfg?.products||[]).filter(p=>!p.toLowerCase().includes('crédito'));
  prods.forEach(p=>{
    const cur=(cfg?.initialBalances||cfg?.balances||{})[p]||0;
    const div=document.createElement('div');div.style.cssText='margin-bottom:12px';
    div.innerHTML=`<div style="font-size:13px;font-weight:500;margin-bottom:6px">${PI[p]||'💳'} ${p}</div><input class="ti rb-inp" data-p="${p}" type="text" inputmode="decimal" placeholder="Saldo actual" value="${cur?Number(cur).toLocaleString('es-DO'):''}"/>`;
    ct.appendChild(div);
    setTimeout(()=>bindFmt(div.querySelector('input')),50);
  });
  openOv('reset-bal-ov');
};

window.saveResetBalances=async function(){
  const newBals={};
  document.querySelectorAll('.rb-inp').forEach(inp=>{
    const v=parseFloat(inp.value.replace(/[^0-9.-]/g,''))||0;
    newBals[inp.dataset.p]=v;
  });
  cfg.initialBalances=newBals;
  cfg.balances={...newBals};
  await saveCfg();
  recalcBalances();
  closeOv('reset-bal-ov');
  updateDash();buildAccList();
  setSS('ok','Saldos actualizados');
};

// ─── BELL BUTTON ──────────────────────────────────────────────────────────
document.getElementById('bell-btn').onclick=()=>openNotifPanel();
window.openNotifPanel=function(){
  renderNotifs();
  document.getElementById('notif-panel').style.right='0';
  document.getElementById('notif-backdrop').style.display='block';
  // Clear red badge when panel is opened
  const badge=document.getElementById('notif-badge');
  if(badge)badge.style.display='none';
};
window.closeNotifPanel=function(){document.getElementById('notif-panel').style.right='-100%';document.getElementById('notif-backdrop').style.display='none';};

// ─── PUSH NOTIFICATIONS ───────────────────────────────────────────────────
async function requestPushPermission(){
  if(!('Notification' in window))return;
  if(Notification.permission==='default'){
    const perm=await Notification.requestPermission();
    if(perm==='granted')showLocalNotif('✅ Notificaciones activadas','Te avisaremos cuando haya alertas importantes.');
  }
}
function showLocalNotif(title,body){
  if(Notification.permission==='granted')new Notification(title,{body,icon:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💼</text></svg>'});
}
// Request on first load after auth
window._notifRequested=false;

// ─── INIT ─────────────────────────────────────────────────────────────────
bindFmt(document.getElementById('amt-f'));
bindFmt(document.getElementById('ed-amt'));
showPage('pg-load');