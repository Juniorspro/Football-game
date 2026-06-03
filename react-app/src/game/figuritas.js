import * as THREE from 'three';
//============================ DATOS ============================
const RAR = {
  comun:      {name:'COMÚN',      col:'#3b82f6', tcol:'#bcd2ff', weight:50},
  raro:       {name:'RARO',       col:'#a855f7', tcol:'#e2c8ff', weight:30},
  legendario: {name:'LEGENDARIO', col:'#f5b50a', tcol:'#ffe9a8', weight:14},
  mitico:     {name:'MÍTICO',     col:'#e0115f', tcol:'#ffb8cf', weight:6},
  goat:       {name:'G.O.A.T.',   col:'#ffcf40', tcol:'#fff6cf', weight:0}
};
const RAR_ORDER = ['comun','raro','legendario','mitico'];
// Tope de mejora por rareza (los comunes NO llegan a 100; los míticos/GOAT sí)
const RAR_CAP = { comun:78, raro:87, legendario:94, mitico:100, goat:100 };
const UPGRADE_COST = 15;   // 15 monedas = +3 a un stat
const UPGRADE_STEP = 3;

// ====== i18n figuritas (lee window.LANG que setea el juego) ======
const FEN = {
  'COMÚN':'COMMON','RARO':'RARE','LEGENDARIO':'LEGENDARY','MÍTICO':'MYTHIC',
  'VEL':'SPD','TIR':'SHO','PAS':'PAS','DEF':'DEF','FÍS':'PHY','GEN':'OVR',
  'DEL':'FWD','MED':'MID',
  'Brasil':'Brazil','Francia':'France','Alemania':'Germany','España':'Spain','Inglaterra':'England',
  'Italia':'Italy','Países Bajos':'Netherlands','Bélgica':'Belgium','México':'Mexico','Estados Unidos':'United States',
  'Japón':'Japan','Corea del Sur':'South Korea','Croacia':'Croatia','Marruecos':'Morocco','Canadá':'Canada',
  'ABRIR SOBRE':'OPEN PACK','📖 VER ÁLBUM':'📖 VIEW ALBUM','ABRIR OTRO':'OPEN ANOTHER',
  '‹ INICIO':'‹ HOME','‹ JUGAR':'‹ PLAY','¡SOBRE COMPLETO!':'PACK COMPLETE!','Agregado al álbum':'Added to album',
  'ABRIENDO SOBRE':'OPENING PACK','SOBRE MUNDIAL REZONA':'REZONA WORLD CUP PACK','EDICIÓN COLECCIONABLE':'COLLECTOR EDITION',
  'FIGURITAS':'STICKERS','3 FIGURITAS':'3 STICKERS','Tocá el sobre para abrirlo':'Tap the pack to open',
  'SOBRE':'PACK','MUNDIAL':'WORLD CUP'
};
function FEN_on(){ return (typeof window!=='undefined' && window.LANG==='en'); }
function FT(s){ return (FEN_on() && FEN[s]) ? FEN[s] : s; }
function applyFigLang(){
  const en=FEN_on(), q=id=>document.getElementById(id);
  const set=(id,es,enT)=>{ const e=q(id); if(e) e.textContent = en?enT:es; };
  set('figBrand','FIGURITAS','STICKERS');
  set('figTtl','SOBRE MUNDIAL REZONA','REZONA WORLD CUP PACK');
  set('figSub','Edición coleccionable','Collector edition');
  set('btnOpen', 'ABRIR SOBRE · '+PACK_COST+'🪙', 'OPEN PACK · '+PACK_COST+'🪙');
  set('btnAlbum','📖 VER ÁLBUM','📖 VIEW ALBUM');
  set('toGame','‹ JUGAR','‹ PLAY');
  set('albExit','‹ INICIO','‹ HOME');
  set('openTitle','ABRIENDO SOBRE','OPENING PACK');
  set('packSeal','REZONA ★ MUNDIAL','REZONA ★ WORLD CUP');
  document.querySelectorAll('.packBig').forEach(e=>e.textContent = en?'PACK':'SOBRE');
  document.querySelectorAll('.packSub').forEach(e=>e.textContent = en?'WORLD CUP':'MUNDIAL');
  document.querySelectorAll('.packX3').forEach(e=>e.textContent = en?'3 STICKERS':'3 FIGURITAS');
  set('btnWheel','🎰 MONEDAS GRATIS','🎰 FREE COINS');
  set('wheelBrand','MONEDAS GRATIS','FREE COINS');
  set('wheelBack','‹ VOLVER','‹ BACK');
  set('wheelNote','1 giro gratis cada 4 h · 🎁 = premio secreto (mítico o GOAT)','1 free spin every 4h · 🎁 = secret prize (mythic or GOAT)');
  set('prizeOk','¡GENIAL!','AWESOME!');
  set('dailyBack','‹ VOLVER','‹ BACK');
  set('dailyBrand','INGRESO DIARIO','DAILY REWARD');
  set('dailySub','30 días seguidos · cada día reclamás tu premio','30 days streak · claim your reward each day');
  set('questsBack','‹ VOLVER','‹ BACK'); set('questsBrand','MISIONES','QUESTS');
  set('questsSub','Misiones de hoy · se renuevan cada día',"Today's quests · refresh daily");
  set('leaguesBack','‹ VOLVER','‹ BACK'); set('leaguesBrand','LIGAS','LEAGUES');
  set('leagueHint','Ganá partidos para subir de liga · +25 RP victoria · −12 derrota','Win matches to rank up · +25 RP win · −12 loss');
  set('storeBack','‹ VOLVER','‹ BACK'); set('storeBrand','TIENDA','STORE');
  set('albPrevEmpty','Tocá una figurita para verla en 3D','Tap a sticker to see it in 3D');
  set('albPrevFull','VER CARTA','VIEW CARD');
}


// 24 países: jersey [principal, acento, short], región, bandera
const COUNTRIES = [
  {name:'Argentina',     region:'latin', jersey:['#75aadb','#0a1f44','#0a1f44'], flag:{t:'sun', c:['#75aadb','#ffffff','#75aadb'], sun:'#f6b40e'}},
  {name:'Brasil',        region:'latin', jersey:['#ffdf00','#009c3b','#002776'], flag:{t:'brasil'}},
  {name:'Francia',       region:'euro',  jersey:['#1f2a6b','#ffffff','#ef4135'], flag:{t:'v', c:['#0055a4','#ffffff','#ef4135']}},
  {name:'Alemania',      region:'euro',  jersey:['#ffffff','#000000','#000000'], flag:{t:'h', c:['#000000','#dd0000','#ffce00']}},
  {name:'España',        region:'euro',  jersey:['#c60b1e','#ffc400','#1a1a3a'], flag:{t:'h', c:['#aa151b','#f1bf00','#aa151b']}},
  {name:'Inglaterra',    region:'euro',  jersey:['#ffffff','#0a2472','#0a2472'], flag:{t:'cross', bg:'#ffffff', c:'#ce1124'}},
  {name:'Portugal',      region:'euro',  jersey:['#a8000b','#006600','#a8000b'], flag:{t:'v', c:['#006600','#ff0000']}},
  {name:'Italia',        region:'euro',  jersey:['#1c5bd6','#ffffff','#1a1a3a'], flag:{t:'v', c:['#009246','#ffffff','#ce2b37']}},
  {name:'Países Bajos',  region:'euro',  jersey:['#f36c21','#ffffff','#1a1a3a'], flag:{t:'h', c:['#ae1c28','#ffffff','#21468b']}},
  {name:'Bélgica',       region:'euro',  jersey:['#c8102e','#ffd700','#1a1a1a'], flag:{t:'v', c:['#000000','#fdda24','#ef3340']}},
  {name:'Uruguay',       region:'latin', jersey:['#5fa8e0','#ffffff','#0a1f44'], flag:{t:'sun', c:['#ffffff','#7b9fe0','#ffffff'], sun:'#f6b40e'}},
  {name:'México',        region:'latin', jersey:['#0a7a3b','#ffffff','#a8000b'], flag:{t:'v', c:['#006847','#ffffff','#ce1126']}},
  {name:'Estados Unidos',region:'na',    jersey:['#1a2a6c','#ffffff','#b22234'], flag:{t:'usa'}},
  {name:'Japón',         region:'asia',  jersey:['#1b2a6b','#ffffff','#1b2a6b'], flag:{t:'circle', bg:'#ffffff', c:'#bc002d'}},
  {name:'Corea del Sur', region:'asia',  jersey:['#c8102e','#1a3a8a','#1a1a3a'], flag:{t:'korea'}},
  {name:'Croacia',       region:'euro',  jersey:['#c8102e','#ffffff','#1a2a6b'], flag:{t:'h', c:['#ff0000','#ffffff','#171796']}},
  {name:'Marruecos',     region:'africa',jersey:['#c1272d','#006233','#1a1a1a'], flag:{t:'star', bg:'#c1272d', c:'#006233'}},
  {name:'Senegal',       region:'africa',jersey:['#00853f','#fdef42','#e31b23'], flag:{t:'v', c:['#00853f','#fdef42','#e31b23']}},
  {name:'Nigeria',       region:'africa',jersey:['#008751','#ffffff','#008751'], flag:{t:'v', c:['#008751','#ffffff','#008751']}},
  {name:'Colombia',      region:'latin', jersey:['#fcd116','#003893','#ce1126'], flag:{t:'colombia'}},
  {name:'Chile',         region:'latin', jersey:['#c8102e','#0039a6','#ffffff'], flag:{t:'chile'}},
  {name:'Vietnam',       region:'asia',  jersey:['#da251d','#ffff00','#da251d'], flag:{t:'star', bg:'#da251d', c:'#ffff00'}},
  {name:'China',         region:'asia',  jersey:['#de2910','#ffde00','#de2910'], flag:{t:'star', bg:'#de2910', c:'#ffde00', corner:true}},
  {name:'Canadá',        region:'na',    jersey:['#d80621','#ffffff','#d80621'], flag:{t:'maple'}}
];

const NAMES = {
  latin:{f:['Diego','Mateo','Santiago','Lucas','Thiago','Bruno','Facundo','Julián','Emiliano','Nicolás','Agustín','Rodrigo'],
         s:['González','Rodríguez','Martínez','Silva','Souza','Pereira','Fernández','Torres','Ramírez','Vargas','Castro','Rojas']},
  euro: {f:['Liam','Hugo','Louis','Leon','Matteo','João','Marco','Daan','Sven','Luka','Karim','Sergio'],
         s:['Müller','Rossi','Dubois','Silva','De Jong','Smith','Kovač','Nowak','Andersson','Costa','Bianchi','Schmidt']},
  asia: {f:['Min-ho','Hiroshi','Kenji','Tuan','Wei','Jun','Sora','Hao','Long','Yuto','Jin','Bao'],
         s:['Kim','Tanaka','Nguyen','Wang','Li','Park','Sato','Chen','Tran','Yamamoto','Zhang','Lee']},
  africa:{f:['Amadou','Sadio','Youssef','Kalidou','Victor','Mohamed','Samuel','Idrissa','Riyad','Achraf','Khalifa','Ousmane'],
          s:['Diop','Traoré','Mané','Okafor','Hassan','Ndiaye','Eze','Benali','Koné','Sow','Cissé','Mendy']},
  na:   {f:['Tyler','Jordan','Mason','Ethan','Cody','Logan','Brandon','Hunter','Chase','Connor','Tanner','Drew'],
         s:['Johnson','Miller','Davis','Brown','Wilson','Taylor','Moore','Clark','Lewis','Walker','Hall','Young']}
};
const SKINS = {
  latin:['#e8b88a','#d49a6a','#c08552','#a86b3c'],
  euro: ['#f1c9a5','#e8b88a','#d8a878','#c89868'],
  asia: ['#f0cba0','#e6c08c','#dcb27a','#cfa066'],
  africa:['#8a5a36','#6e4423','#5a3418','#7a4e2a'],
  na:   ['#f1c9a5','#d8a878','#a86b3c','#7a4e2a']
};
const HAIRC = ['#1a1008','#2a1a0a','#4a2a14','#6a4a2a','#0a0604','#caa45a','#e8e8e8','#1a1a1a'];
const HAIRS = ['short','buzz','curly','afro','long','mohawk','bald','fade'];
const POSSET = ['DEL','MED','DEF','DEL','MED','DEF'];

//============================ RNG seedeado ============================
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const clamp=(v)=>Math.max(40,Math.min(99,Math.round(v)));
function pickRarity(rng){
  const tot=RAR_ORDER.reduce((s,r)=>s+RAR[r].weight,0); let x=rng()*tot;
  for(const r of RAR_ORDER){ if(x<RAR[r].weight) return r; x-=RAR[r].weight; }
  return 'comun';
}
function tilt(pos,k){
  const T={DEL:{vel:6,tiro:10,pase:2,def:-10,fis:4},MED:{vel:4,tiro:2,pase:10,def:0,fis:0},DEF:{vel:-2,tiro:-6,pase:2,def:12,fis:8}};
  return T[pos][k]||0;
}

//============================ ROSTER (144) ============================
const ROSTER=[];
(function(){
  let id=0;
  for(let ci=0;ci<COUNTRIES.length;ci++){
    const co=COUNTRIES[ci]; const rng=mulberry32(7000+ci*131); const pool=NAMES[co.region]; const skins=SKINS[co.region];
    for(let j=0;j<6;j++){
      const rar=pickRarity(rng);
      const pos=POSSET[j];
      const rb={comun:0,raro:6,legendario:12,mitico:18}[rar];
      const base=56+Math.floor(rng()*10);
      const v=()=>Math.floor(rng()*9)-3;
      const st={vel:clamp(base+rb+tilt(pos,'vel')+v()),tiro:clamp(base+rb+tilt(pos,'tiro')+v()),
                pase:clamp(base+rb+tilt(pos,'pase')+v()),def:clamp(base+rb+tilt(pos,'def')+v()),fis:clamp(base+rb+tilt(pos,'fis')+v())};
      const ovr=Math.round((st.vel+st.tiro+st.pase+st.def+st.fis)/5);
      const name=pool.f[Math.floor(rng()*pool.f.length)]+' '+pool.s[Math.floor(rng()*pool.s.length)];
      const look={skin:skins[Math.floor(rng()*skins.length)],hair:HAIRC[Math.floor(rng()*HAIRC.length)],
                  style:HAIRS[Math.floor(rng()*HAIRS.length)],beard:rng()<0.42};
      ROSTER.push({id,ci,slot:j,num:1+Math.floor(rng()*30),name,pos,rar,st,ovr,look,albumNo:id+1});
      id++;
    }
  }
})();
// ===== 6 GOATs SECRETOS (no entran en sobres, solo por la RULETA) =====
const GOAT_IDS = [];
(function buildGoats(){
  // ci elegido por variedad de camiseta/bandera; stats máximas
  const defs = [
    {ci:0,  name:'El Pulga',     pos:'DEL', st:{vel:97,tiro:96,pase:95,def:42,fis:80}},
    {ci:1,  name:'O Fenômeno',   pos:'DEL', st:{vel:96,tiro:97,pase:88,def:40,fis:90}},
    {ci:5,  name:'Sir Goalden',  pos:'MED', st:{vel:90,tiro:92,pase:97,def:78,fis:88}},
    {ci:2,  name:'Le Maître',    pos:'MED', st:{vel:88,tiro:90,pase:97,def:82,fis:86}},
    {ci:11, name:'El Káiser',    pos:'DEF', st:{vel:84,tiro:80,pase:90,def:97,fis:95}},
    {ci:14, name:'The Wall',     pos:'DEF', st:{vel:82,tiro:70,pase:86,def:97,fis:96}}
  ];
  let gid = 1000;
  for(const d of defs){
    const rng = mulberry32(99000 + gid);
    const skins = SKINS[COUNTRIES[d.ci].region] || SKINS.euro;
    const ovr = Math.round((d.st.vel+d.st.tiro+d.st.pase+d.st.def+d.st.fis)/5);
    ROSTER.push({ id:gid, ci:d.ci, slot:0, num:10, name:d.name, pos:d.pos, rar:'goat', st:d.st, ovr,
      look:{ skin:skins[Math.floor(rng()*skins.length)], hair:HAIRC[Math.floor(rng()*HAIRC.length)],
             style:HAIRS[Math.floor(rng()*HAIRS.length)], beard:rng()<0.5 }, albumNo:'★'+(gid-999), goat:true });
    GOAT_IDS.push(gid); gid++;
  }
})();
// ===== Carta MÍTICA fija del premio del DÍA 30 (argentino ficticio #10, oculta hasta ganarla) =====
const DAY30_ID = 980;
(function buildDay30(){
  const rng = mulberry32(98030);
  const skins = SKINS[COUNTRIES[0].region] || SKINS.latin;
  const st = { vel:94, tiro:93, pase:96, def:48, fis:78 };
  const ovr = Math.round((st.vel+st.tiro+st.pase+st.def+st.fis)/5);
  ROSTER.push({ id:DAY30_ID, ci:0, slot:0, num:10, name:'El Capitán', pos:'DEL', rar:'mitico', st, ovr,
    look:{ skin:skins[Math.floor(rng()*skins.length)], hair:HAIRC[Math.floor(rng()*HAIRC.length)],
           style:HAIRS[Math.floor(rng()*HAIRS.length)], beard:true }, albumNo:'★30', hidden:true });
})();
function pById(id){ return ROSTER.find(p=>p.id===+id); }

//============================ PERSISTENCIA ============================
let owned={}, packsOpened=0, coins=15, upg={}, lastSpin=0, dailyDay=0, dailyDate='', quests=null, leagueRP=0;
const PACK_COST=5;
(function load(){ try{ const s=localStorage.getItem('rezonaAlbum'); if(s){ const o=JSON.parse(s); owned=o.owned||{}; packsOpened=o.packs||0; coins=(o.coins!=null?o.coins:15); upg=o.upg||{}; lastSpin=o.lastSpin||0; dailyDay=o.dailyDay||0; dailyDate=o.dailyDate||''; quests=o.quests||null; leagueRP=o.leagueRP||0; } else { coins=15; } }catch(e){} })();
function save(){ try{ localStorage.setItem('rezonaAlbum',JSON.stringify({owned,packs:packsOpened,coins,upg,lastSpin,dailyDay,dailyDate,quests,leagueRP})); }catch(e){} }
// Stats EFECTIVOS = base + mejoras, con tope por rareza
function statCap(p){ return RAR_CAP[p.rar] || 100; }
function effStat(p,key){ const b=p.st[key]+(((upg[p.id]||{})[key])||0); return Math.min(statCap(p), b); }
function effStats(p){ return {vel:effStat(p,'vel'),tiro:effStat(p,'tiro'),pase:effStat(p,'pase'),def:effStat(p,'def'),fis:effStat(p,'fis')}; }
function effOvr(p){ const s=effStats(p); return Math.round((s.vel+s.tiro+s.pase+s.def+s.fis)/5); }
function gradeOf(ovr){ return ovr>=90?'A+' : ovr>=84?'A' : ovr>=76?'B' : ovr>=66?'C' : 'D'; }
function gradeColor(g){ return g==='A+'?'#ffd24a' : g==='A'?'#46d369' : g==='B'?'#7cc0ff' : g==='C'?'#f5b50a' : '#ff6a4d'; }
const POWER_TIERS=[
  {key:'junior',name:'JUNIOR',en:'JUNIOR',emb:'🟢',col:'#9aa6b8',min:0},
  {key:'regional',name:'REGIONAL',en:'REGIONAL',emb:'🔵',col:'#6fd3a0',min:62},
  {key:'national',name:'NACIONAL',en:'NATIONAL',emb:'🟣',col:'#5aa9ff',min:72},
  {key:'champion',name:'CHAMPION',en:'CHAMPION',emb:'🟠',col:'#c08bff',min:80},
  {key:'premier',name:'PREMIER',en:'PREMIER',emb:'⭐',col:'#ffce6a',min:88}
];
function powerTier(ovr){ let t=POWER_TIERS[0]; for(const x of POWER_TIERS){ if(ovr>=x.min) t=x; } return t; }
function tierName(t){ return FEN_on()? t.en : t.name; }
window.gradeOf=gradeOf; window.gradeColor=gradeColor; window.powerTier=powerTier; window.tierName=tierName;
function ownedCount(){ return Object.keys(owned).filter(k=>owned[k]>0 && +k<900).length; }
window.addCoins=function(n){ coins=Math.max(0, coins+(n||0)); save(); try{ refreshProgress(); }catch(e){} };
window.getCoins=function(){ return coins; };
// Jugadores coleccionados (de sobres) de un país, para usarlos en el plantel del partido
window.ownedByCountry=function(teamName){
  try{
    const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
    const tn=norm(teamName);
    const ci=COUNTRIES.findIndex(c=>norm(c.name)===tn);
    if(ci<0) return [];
    const posMap={DEL:'DELANTERO',MED:'MEDIOCAMPO',DEF:'DEFENSA'};
    return ROSTER.filter(p=>p.ci===ci && owned[p.id]>0).map(p=>({
      id:p.id, num:p.num, name:p.name, pos:posMap[p.pos]||'MEDIOCAMPO', ovr:effOvr(p), rar:p.rar,
      stats:effStats(p),
      look:{skin:p.look.skin, hair:p.look.hair, hairStyle:p.look.style||'short', height:1.0, eyeColor:0x201810, hasBeard:!!p.look.beard, hasHeadband:false}
    }));
  }catch(e){ return []; }
};

//============================ COLOR utils ============================
function shade(hex,amt){
  let c=hex.replace('#',''); if(c.length===3)c=c.split('').map(x=>x+x).join('');
  let r=parseInt(c.substr(0,2),16),g=parseInt(c.substr(2,2),16),b=parseInt(c.substr(4,2),16);
  r=Math.max(0,Math.min(255,Math.round(r+255*amt)));g=Math.max(0,Math.min(255,Math.round(g+255*amt)));b=Math.max(0,Math.min(255,Math.round(b+255*amt)));
  return 'rgb('+r+','+g+','+b+')';
}

//============================ RENDER 3D DEL JUGADOR → PNG ============================
let _r3=null,_cv3=null,_scene3=null,_cam3=null; const _bustCache={};
function ensure3D(){
  if(_r3!==null) return _r3!==false;
  try{
    _cv3=document.createElement('canvas'); _cv3.width=260; _cv3.height=320;
    _r3=new THREE.WebGLRenderer({canvas:_cv3,antialias:true,alpha:true,preserveDrawingBuffer:true});
    _r3.setPixelRatio(1); _r3.outputColorSpace=THREE.SRGBColorSpace;
    _scene3=new THREE.Scene();
    _cam3=new THREE.PerspectiveCamera(28,260/320,0.1,100);
    _cam3.position.set(0,1.46,2.7); _cam3.lookAt(0,1.4,0);
    const key=new THREE.DirectionalLight(0xffffff,1.0); key.position.set(2,3,4); _scene3.add(key);
    const front=new THREE.DirectionalLight(0xffffff,1.25); front.position.set(0,1.6,5); _scene3.add(front);  // ilumina la cara
    const fill=new THREE.DirectionalLight(0x9fb8ff,0.5); fill.position.set(-3,1.5,1); _scene3.add(fill);
    _scene3.add(new THREE.AmbientLight(0xffffff,0.8));
    return true;
  }catch(e){ _r3=false; return false; }
}
function _mat(c,rough){ return new THREE.MeshStandardMaterial({color:new THREE.Color(c),roughness:rough==null?0.72:rough,metalness:0.05}); }
function addHair3D(g,hair,style){
  const m=_mat(hair,0.85);
  const HY=1.46, HR=0.34;
  // casquete corrido hacia ATRÁS y con nacimiento alto: nunca tapa la cara
  const cap=(r,th,zoff,sc)=>{ const c=new THREE.Mesh(new THREE.SphereGeometry(r,22,16,0,Math.PI*2,0,th),m);
    c.position.set(0,HY+0.05,(zoff||0)-0.04); c.scale.set(1.0,sc||0.95,1.05); g.add(c); return c; };
  if(style==='bald') return;
  if(style==='buzz'||style==='fade'){ cap(HR+0.01,Math.PI*0.40,0,0.85); return; }
  if(style==='short'){ cap(HR+0.025,Math.PI*0.44,-0.01); return; }
  if(style==='afro'){ const a=new THREE.Mesh(new THREE.SphereGeometry(HR+0.13,18,16,0,Math.PI*2,0,Math.PI*0.66),m); a.position.set(0,HY+0.06,-0.07); g.add(a); return; }
  if(style==='curly'){ cap(HR+0.04,Math.PI*0.45,-0.02); for(let i=0;i<8;i++){ const a=Math.PI*(0.2+0.6*(i/7)); const b=new THREE.Mesh(new THREE.SphereGeometry(0.08,8,8),m); b.position.set(Math.cos(a)*(HR+0.03),HY+0.2,-Math.abs(Math.sin(a))*0.12-0.06); g.add(b);} return; }
  if(style==='long'){ cap(HR+0.04,Math.PI*0.46,-0.02); const back=new THREE.Mesh(new THREE.CylinderGeometry(HR*0.95,HR*0.8,0.55,16),m); back.position.set(0,HY-0.18,-0.2); back.scale.z=0.5; g.add(back); return; }
  if(style==='mohawk'){ const k=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.32,0.42),m); k.position.set(0,HY+0.26,-0.04); k.scale.z=0.85; g.add(k); cap(HR+0.005,Math.PI*0.36,0,0.4); return; }
}
function buildBust(p){
  const co=COUNTRIES[p.ci]; const g=new THREE.Group();
  const torso=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.5,0.92,18),_mat(co.jersey[0])); torso.position.y=0.55; torso.scale.z=0.66; g.add(torso);
  const sh=new THREE.Mesh(new THREE.SphereGeometry(0.66,18,12),_mat(co.jersey[0])); sh.position.y=0.95; sh.scale.set(1,0.5,0.68); g.add(sh);
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.92,0.7),_mat(co.jersey[1])); stripe.position.set(0,0.55,0.34); stripe.scale.z=0.66; g.add(stripe);
  const col=new THREE.Mesh(new THREE.TorusGeometry(0.19,0.055,8,18),_mat(co.jersey[1])); col.position.y=1.06; col.rotation.x=Math.PI/2; col.scale.set(1,0.7,1); g.add(col);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.18,0.26,14),_mat(p.look.skin,0.8)); neck.position.y=1.13; g.add(neck);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.34,22,18),_mat(p.look.skin,0.82)); head.position.y=1.46; head.scale.set(0.92,1.06,0.95); g.add(head);
  for(const sx of [-1,1]){ const ear=new THREE.Mesh(new THREE.SphereGeometry(0.07,8,8),_mat(p.look.skin,0.82)); ear.position.set(sx*0.31,1.44,0); g.add(ear); }
  addHair3D(g,p.look.hair,p.look.style);
  if(p.look.beard){ const bd=new THREE.Mesh(new THREE.SphereGeometry(0.3,16,12,0,7,Math.PI*0.55,Math.PI*0.32),_mat(p.look.hair,0.9)); bd.position.set(0,1.38,0.04); bd.scale.set(0.95,1,0.95); g.add(bd); }
  // === CARA bien visible ===
  const white=_mat(0xf2efe8,0.5), pup=_mat(0x161620,0.3), brow=_mat(p.look.hair,0.9);
  for(const sx of [-1,1]){
    const w=new THREE.Mesh(new THREE.SphereGeometry(0.05,12,10),white); w.position.set(sx*0.125,1.49,0.30); w.scale.set(1.1,0.8,0.55); g.add(w);
    const pu=new THREE.Mesh(new THREE.SphereGeometry(0.026,10,8),pup); pu.position.set(sx*0.125,1.49,0.345); g.add(pu);
    const eb=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.022,0.025),brow); eb.position.set(sx*0.125,1.55,0.31); eb.rotation.z=-sx*0.1; g.add(eb);
  }
  const nose=new THREE.Mesh(new THREE.ConeGeometry(0.04,0.11,8),_mat(p.look.skin,0.8)); nose.position.set(0,1.44,0.33); nose.rotation.x=Math.PI*0.5; g.add(nose);
  const mouth=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.022,0.02),_mat(0x9a5246,0.6)); mouth.position.set(0,1.37,0.31); g.add(mouth);
  // === ACCESORIOS (a algunos) ===
  if(p.rar==='goat'){
    // CORONA dorada (accesorio exclusivo GOAT)
    const gold=_mat(0xffcf40,0.18); gold.metalness=0.9; gold.emissive=new THREE.Color(0x6b4e00);
    const ring=new THREE.Mesh(new THREE.CylinderGeometry(0.30,0.34,0.16,18,1,true),gold); ring.position.set(0,1.74,0); g.add(ring);
    for(let i=0;i<7;i++){ const a=i/7*Math.PI*2; const sp=new THREE.Mesh(new THREE.ConeGeometry(0.05,0.16,6),gold); sp.position.set(Math.cos(a)*0.32,1.86,Math.sin(a)*0.32); g.add(sp);
      const jw=new THREE.Mesh(new THREE.SphereGeometry(0.03,8,8),_mat(0xff3b6e,0.1)); jw.position.set(Math.cos(a)*0.32,1.94,Math.sin(a)*0.32); g.add(jw); }
    // aura dorada detrás del busto + capa
    const aura=new THREE.Mesh(new THREE.TorusGeometry(0.7,0.05,10,28),gold); aura.position.set(0,1.0,-0.25); g.add(aura);
    const cape=new THREE.Mesh(new THREE.CylinderGeometry(0.62,0.85,0.95,18,1,true),_mat(0xffcf40,0.2)); cape.position.set(0,0.5,-0.18); cape.scale.z=0.4; g.add(cape);
  } else if(p.rar==='mitico'){
    const band=new THREE.Mesh(new THREE.TorusGeometry(0.31,0.045,8,22),_mat(0xffd24a,0.25)); band.position.set(0,1.6,0); band.rotation.x=Math.PI/2; band.scale.set(1,0.65,1); g.add(band);
    for(let i=0;i<5;i++){ const sp=new THREE.Mesh(new THREE.ConeGeometry(0.035,0.09,6),_mat(0xffd24a,0.25)); const a=(-0.5+i*0.25); sp.position.set(Math.sin(a)*0.3,1.66,Math.cos(a)*0.2); g.add(sp); }
  } else if(p.rar==='legendario' || p.id%3===0){
    const hb=new THREE.Mesh(new THREE.TorusGeometry(0.345,0.05,8,22),_mat(co.jersey[1],0.6)); hb.position.set(0,1.55,0); hb.rotation.x=Math.PI/2; hb.scale.set(1,0.5,1); g.add(hb);
  }
  if(p.id%4===1){
    const gl=_mat(0x121218,0.25);
    for(const sx of [-1,1]){ const lens=new THREE.Mesh(new THREE.TorusGeometry(0.075,0.016,6,16),gl); lens.position.set(sx*0.13,1.47,0.31); g.add(lens); }
    const br=new THREE.Mesh(new THREE.BoxGeometry(0.09,0.018,0.018),gl); br.position.set(0,1.47,0.33); g.add(br);
  }
  return g;
}
// Render 3D real del jugador, devuelto como PNG (data URL) y cacheado
function renderBustPNG(p){
  if(_bustCache[p.id]!==undefined) return _bustCache[p.id];
  if(!ensure3D()){ _bustCache[p.id]=null; return null; }
  const bust=buildBust(p); bust.rotation.y=0; _scene3.add(bust);
  let url=null;
  try{ _r3.render(_scene3,_cam3); url=_cv3.toDataURL('image/png'); }catch(e){}
  _scene3.remove(bust);
  bust.traverse(o=>{ if(o.geometry)o.geometry.dispose(); if(o.material)o.material.dispose(); });
  _bustCache[p.id]=url; return url;
}

//============================ BANDERAS ============================
function drawFlag(cv,spec){
  const ctx=cv.getContext('2d'),W=cv.width,H=cv.height; ctx.clearRect(0,0,W,H);
  const f=spec;
  const stripesH=(cols)=>{const n=cols.length;for(let i=0;i<n;i++){ctx.fillStyle=cols[i];ctx.fillRect(0,Math.round(H*i/n),W,Math.ceil(H/n)+1);}};
  const stripesV=(cols)=>{const n=cols.length;for(let i=0;i<n;i++){ctx.fillStyle=cols[i];ctx.fillRect(Math.round(W*i/n),0,Math.ceil(W/n)+1,H);}};
  const star=(cx,cy,r,col)=>{ctx.fillStyle=col;ctx.beginPath();for(let i=0;i<10;i++){const a=Math.PI/5*i-Math.PI/2;const rr=i%2?r*0.45:r;ctx.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);}ctx.closePath();ctx.fill();};
  if(f.t==='h') stripesH(f.c);
  else if(f.t==='v') stripesV(f.c);
  else if(f.t==='circle'){ctx.fillStyle=f.bg;ctx.fillRect(0,0,W,H);ctx.fillStyle=f.c;ctx.beginPath();ctx.arc(W/2,H/2,H*0.32,0,7);ctx.fill();}
  else if(f.t==='star'){ctx.fillStyle=f.bg;ctx.fillRect(0,0,W,H);if(f.corner)star(W*0.28,H*0.4,H*0.22,f.c);else star(W/2,H/2,H*0.3,f.c);}
  else if(f.t==='cross'){ctx.fillStyle=f.bg;ctx.fillRect(0,0,W,H);ctx.fillStyle=f.c;ctx.fillRect(0,H*0.4,W,H*0.2);ctx.fillRect(W*0.4,0,W*0.2,H);}
  else if(f.t==='sun'){stripesH(f.c);ctx.fillStyle=f.sun;ctx.beginPath();ctx.arc(W/2,H/2,H*0.16,0,7);ctx.fill();}
  else if(f.t==='brasil'){ctx.fillStyle='#009c3b';ctx.fillRect(0,0,W,H);ctx.fillStyle='#ffdf00';ctx.beginPath();ctx.moveTo(W/2,H*0.12);ctx.lineTo(W*0.88,H/2);ctx.lineTo(W/2,H*0.88);ctx.lineTo(W*0.12,H/2);ctx.closePath();ctx.fill();ctx.fillStyle='#002776';ctx.beginPath();ctx.arc(W/2,H/2,H*0.2,0,7);ctx.fill();}
  else if(f.t==='usa'){const rows=7;for(let i=0;i<rows;i++){ctx.fillStyle=i%2?'#fff':'#b22234';ctx.fillRect(0,Math.round(H*i/rows),W,Math.ceil(H/rows)+1);}ctx.fillStyle='#3c3b6e';ctx.fillRect(0,0,W*0.42,H*0.54);}
  else if(f.t==='korea'){ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.fillStyle='#c8102e';ctx.beginPath();ctx.arc(W/2,H/2,H*0.3,Math.PI,0);ctx.fill();ctx.fillStyle='#0047a0';ctx.beginPath();ctx.arc(W/2,H/2,H*0.3,0,Math.PI);ctx.fill();}
  else if(f.t==='colombia'){ctx.fillStyle='#fcd116';ctx.fillRect(0,0,W,H/2);ctx.fillStyle='#003893';ctx.fillRect(0,H/2,W,H/4);ctx.fillStyle='#ce1126';ctx.fillRect(0,H*0.75,W,H/4);}
  else if(f.t==='chile'){ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H/2);ctx.fillStyle='#d52b1e';ctx.fillRect(0,H/2,W,H/2);ctx.fillStyle='#0039a6';ctx.fillRect(0,0,W*0.36,H/2);star(W*0.18,H*0.25,H*0.13,'#fff');}
  else if(f.t==='maple'){ctx.fillStyle='#d80621';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.fillRect(W*0.28,0,W*0.44,H);ctx.fillStyle='#d80621';ctx.beginPath();ctx.moveTo(W/2,H*0.2);ctx.lineTo(W*0.6,H*0.45);ctx.lineTo(W*0.7,H*0.4);ctx.lineTo(W*0.6,H*0.7);ctx.lineTo(W*0.4,H*0.7);ctx.lineTo(W*0.3,H*0.4);ctx.lineTo(W*0.4,H*0.45);ctx.closePath();ctx.fill();}
  else {ctx.fillStyle='#444';ctx.fillRect(0,0,W,H);}
}

//============================ RETRATO DEL JUGADOR ============================
function drawHair(ctx,hx,hy,hr,look){
  ctx.fillStyle=look.hair;
  const s=look.style;
  if(s==='bald'){return;}
  if(s==='buzz'||s==='fade'){ctx.globalAlpha=s==='fade'?0.9:1;ctx.beginPath();ctx.ellipse(hx,hy-hr*0.55,hr*0.95,hr*0.6,0,Math.PI,0);ctx.fill();ctx.globalAlpha=1;return;}
  if(s==='short'){ctx.beginPath();ctx.ellipse(hx,hy-hr*0.45,hr*1.0,hr*0.8,0,Math.PI*1.05,Math.PI*-0.05);ctx.fill();return;}
  if(s==='curly'||s==='afro'){const R=s==='afro'?hr*1.25:hr*1.05;for(let i=0;i<12;i++){const a=Math.PI+Math.PI*(i/11);ctx.beginPath();ctx.arc(hx+Math.cos(a)*hr*0.85,hy-hr*0.4+Math.sin(a)*hr*0.5,R*0.28,0,7);ctx.fill();}ctx.beginPath();ctx.ellipse(hx,hy-hr*0.5,hr*0.95,hr*0.7,0,Math.PI,0);ctx.fill();return;}
  if(s==='long'){ctx.beginPath();ctx.ellipse(hx,hy-hr*0.3,hr*1.05,hr*1.1,0,Math.PI*0.95,Math.PI*0.05);ctx.fill();ctx.fillRect(hx-hr*1.0,hy-hr*0.4,hr*0.35,hr*1.3);ctx.fillRect(hx+hr*0.65,hy-hr*0.4,hr*0.35,hr*1.3);return;}
  if(s==='mohawk'){ctx.fillRect(hx-hr*0.18,hy-hr*1.15,hr*0.36,hr*0.8);ctx.beginPath();ctx.ellipse(hx,hy-hr*0.45,hr*0.95,hr*0.4,0,Math.PI,0);ctx.fill();return;}
}
function drawPortrait(cv,p){
  const ctx=cv.getContext('2d'),W=cv.width,H=cv.height; ctx.clearRect(0,0,W,H);
  const co=COUNTRIES[p.ci];
  const bg=ctx.createRadialGradient(W/2,H*0.4,8,W/2,H*0.5,H*0.75);
  bg.addColorStop(0,shade(RAR[p.rar].col,0.05)); bg.addColorStop(1,'rgba(8,10,18,0.2)');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  const cx=W/2;
  // jersey / hombros
  const jy=H*0.74;
  const gj=ctx.createLinearGradient(0,jy,0,H); gj.addColorStop(0,shade(co.jersey[0],0.06)); gj.addColorStop(1,shade(co.jersey[0],-0.12));
  ctx.fillStyle=gj;
  ctx.beginPath();
  ctx.moveTo(cx-W*0.44,H+4);
  ctx.quadraticCurveTo(cx-W*0.42,jy,cx-W*0.17,jy);
  ctx.lineTo(cx+W*0.17,jy);
  ctx.quadraticCurveTo(cx+W*0.42,jy,cx+W*0.44,H+4);
  ctx.closePath(); ctx.fill();
  // cuello camiseta (acento)
  ctx.strokeStyle=co.jersey[1]; ctx.lineWidth=W*0.03;
  ctx.beginPath(); ctx.moveTo(cx-W*0.12,jy+H*0.005); ctx.lineTo(cx,jy+H*0.06); ctx.lineTo(cx+W*0.12,jy+H*0.005); ctx.stroke();
  // cuello piel
  ctx.fillStyle=shade(p.look.skin,-0.14); ctx.fillRect(cx-W*0.075,H*0.6,W*0.15,H*0.16);
  // cabeza
  const hx=cx,hy=H*0.45,hr=W*0.2;
  drawHair(ctx,hx,hy,hr,p.look); // pelo de atrás (afro/long) primero queda detrás de la cara igual; ok
  const gs=ctx.createLinearGradient(hx-hr,hy-hr,hx+hr,hy+hr);
  gs.addColorStop(0,shade(p.look.skin,0.12)); gs.addColorStop(1,shade(p.look.skin,-0.12));
  ctx.fillStyle=shade(p.look.skin,-0.05);
  ctx.beginPath(); ctx.ellipse(hx-hr*0.92,hy+hr*0.05,hr*0.16,hr*0.26,0,0,7); ctx.ellipse(hx+hr*0.92,hy+hr*0.05,hr*0.16,hr*0.26,0,0,7); ctx.fill();
  ctx.fillStyle=gs;
  ctx.beginPath(); ctx.ellipse(hx,hy,hr*0.9,hr*1.08,0,0,7); ctx.fill();
  // pelo de adelante
  drawHair(ctx,hx,hy,hr,p.look);
  // ojos
  ctx.fillStyle='#15151c';
  ctx.beginPath(); ctx.ellipse(hx-hr*0.34,hy+hr*0.05,hr*0.09,hr*0.12,0,0,7); ctx.ellipse(hx+hr*0.34,hy+hr*0.05,hr*0.09,hr*0.12,0,0,7); ctx.fill();
  // nariz + boca sutiles
  ctx.strokeStyle=shade(p.look.skin,-0.22); ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(hx,hy+hr*0.12); ctx.lineTo(hx-hr*0.06,hy+hr*0.32); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx-hr*0.2,hy+hr*0.55); ctx.quadraticCurveTo(hx,hy+hr*0.62,hx+hr*0.2,hy+hr*0.55); ctx.stroke();
  // barba
  if(p.look.beard){ ctx.fillStyle=p.look.hair; ctx.globalAlpha=0.45; ctx.beginPath(); ctx.ellipse(hx,hy+hr*0.5,hr*0.78,hr*0.62,0,0.15,Math.PI-0.15); ctx.fill(); ctx.globalAlpha=1; }
  // número en el pecho
  ctx.fillStyle='rgba(255,255,255,0.92)'; ctx.font='900 '+Math.floor(W*0.13)+'px system-ui'; ctx.textAlign='center';
  ctx.fillText(p.num, cx, H*0.97);
}

//============================ CARTA (DOM) ============================
function statRow(label,val,col){
  const c = val>=80?'#2fbf5e' : val>=70?'#46d369' : val>=58?'#9be15d' : val>=46?'#f5b50a' : '#ff6a4d';
  return '<div class="stat"><span class="sl">'+FT(label)+'</span><span class="sb"><span class="sf" data-w="'+val+'" style="width:'+val+'%;background:'+c+'"></span></span><span class="sv">'+val+'</span></div>';
}
// ============================ RULETA MONEDAS GRATIS ============================
const WHEEL_COOLDOWN = 4*60*60*1000;   // 4 horas
const WHEEL_SEG = [
  {kind:'c3',  label:'3🪙',   col:'#2b6cff'},
  {kind:'c25', label:'25🪙',  col:'#16a34a'},
  {kind:'c3',  label:'3🪙',   col:'#2b6cff'},
  {kind:'myth',label:'🎁',    col:'#7a0f33', secret:true},
  {kind:'c3',  label:'3🪙',   col:'#2b6cff'},
  {kind:'c100',label:'100🪙', col:'#e85d10'},
  {kind:'c3',  label:'3🪙',   col:'#2b6cff'},
  {kind:'goat',label:'🎁',    col:'#5a4400', secret:true}
];
const WHEEL_WEIGHTS = [['c3',62],['c25',18],['c100',8],['myth',8],['goat',4]];
let wheelRot = 0, wheelSpinning = false, wheelTick = null;
function buildWheel(){
  const disc = document.getElementById('wheelDisc'); if(!disc) return;
  const n = WHEEL_SEG.length, deg = 360/n;
  // fondo en cuñas con conic-gradient
  let stops = [];
  for(let i=0;i<n;i++){ stops.push(WHEEL_SEG[i].col+' '+(i*deg)+'deg '+((i+1)*deg)+'deg'); }
  disc.style.background = 'conic-gradient(from '+(-deg/2)+'deg,'+stops.join(',')+')';
  disc.innerHTML = '';
  for(let i=0;i<n;i++){
    const seg = document.createElement('div'); seg.className='seg';
    seg.style.transform = 'rotate('+(i*deg)+'deg)';
    const s = document.createElement('span'); s.textContent = WHEEL_SEG[i].secret ? '🎁' : WHEEL_SEG[i].label;
    seg.appendChild(s); disc.appendChild(seg);
  }
}
function wheelReady(){ return (Date.now() - lastSpin) >= WHEEL_COOLDOWN; }
function fmtRemain(ms){ const s=Math.max(0,Math.ceil(ms/1000)); const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60;
  return (h>0?h+'h ':'')+String(m).padStart(2,'0')+'m '+String(ss).padStart(2,'0')+'s'; }
function updateWheelState(){
  const btn=document.getElementById('spinBtn'), tm=document.getElementById('wheelTimer'), rb=document.getElementById('reSpinBtn');
  const cw=document.getElementById('coinsWheel'); if(cw) cw.textContent='🪙 '+coins;
  if(wheelTick){ clearInterval(wheelTick); wheelTick=null; }
  const en=FEN_on();
  if(rb){ const ready=wheelReady();
    if(ready){ rb.style.display='none'; }
    else { rb.style.display=''; rb.disabled=(coins<25||wheelSpinning);
      rb.textContent=(en?'REACTIVATE · 25🪙':'REACTIVAR · 25🪙'); } }
  if(wheelSpinning) return;
  if(wheelReady()){
    if(btn){ btn.disabled=false; btn.textContent=en?'SPIN':'GIRAR'; }
    if(tm) tm.textContent=en?'Free spin ready!':'¡Giro gratis listo!';
  } else {
    if(btn){ btn.disabled=true; btn.textContent=en?'SPIN':'GIRAR'; }
    const upd=()=>{ const r=WHEEL_COOLDOWN-(Date.now()-lastSpin);
      if(r<=0){ updateWheelState(); return; }
      if(tm) tm.textContent=(en?'Next free spin in ':'Próximo giro en ')+fmtRemain(r); };
    upd(); wheelTick=setInterval(upd,1000);
  }
}
function openWheel(){ buildWheel(); show('wheel'); updateWheelState(); }
function pickWheelKind(){ let r=Math.random()*100, acc=0; for(const [k,w] of WHEEL_WEIGHTS){ acc+=w; if(r<acc) return k; } return 'c3'; }
function segIndexFor(kind){ const idx=[]; WHEEL_SEG.forEach((s,i)=>{ if(s.kind===kind) idx.push(i); }); return idx[Math.floor(Math.random()*idx.length)]; }
function randUnowned(rar){ const pool=ROSTER.filter(p=>p.rar===rar && !(owned[p.id]>0)); const src=pool.length?pool:ROSTER.filter(p=>p.rar===rar); return src[Math.floor(Math.random()*src.length)]; }
function spinWheel(){
  if(wheelSpinning || !wheelReady()) return;
  wheelSpinning=true; sfxClick();
  const btn=document.getElementById('spinBtn'); if(btn) btn.disabled=true;
  const kind=pickWheelKind(), i=segIndexFor(kind), n=WHEEL_SEG.length, deg=360/n;
  const disc=document.getElementById('wheelDisc');
  const desired=(360 - i*deg) % 360;            // lleva el centro del segmento i arriba
  let newRot = wheelRot - (wheelRot%360) + 360*6 + desired;
  if(newRot <= wheelRot+360) newRot += 360;
  wheelRot=newRot;
  if(disc) disc.style.transform='rotate('+newRot+'deg)';
  setTimeout(()=>{ grantWheel(kind); lastSpin=Date.now(); save(); wheelSpinning=false; updateWheelState(); }, 4500);
}
function reSpinWheel(){
  if(wheelSpinning || wheelReady() || coins<25) return;
  coins-=25; lastSpin=0; save(); try{refreshProgress();}catch(e){}
  updateWheelState(); spinWheel();
}
function grantWheel(kind){
  const en=FEN_on(); const inner=document.getElementById('prizeInner'); if(!inner) return;
  let html='';
  if(kind==='c3'||kind==='c25'||kind==='c100'){
    const amt=kind==='c3'?3:kind==='c25'?25:100;
    coins+=amt; save(); try{ refreshProgress(); }catch(e){}
    sfxReveal('comun');
    html='<div class="pwin" style="color:#ffd24a">+'+amt+' 🪙</div><div class="psub">'+(en?'Coins added':'Monedas sumadas')+'</div>';
  } else {
    const rar = kind==='goat' ? 'goat' : 'mitico';
    const p = randUnowned(rar); owned[p.id]=(owned[p.id]||0)+1; save(); try{ refreshProgress(); }catch(e){}
    sfxReveal(rar==='goat'?'mitico':'mitico');
    const card=buildCard(p); card.style.cssText='transform:scale(.62);margin:-58px 0';
    inner.innerHTML='<div class="pwin" style="color:'+RAR[rar].tcol+'">'+(rar==='goat'?'¡GOAT! 👑':(en?'MYTHIC!':'¡MÍTICO!'))+'</div>';
    inner.appendChild(card);
    const sub=document.createElement('div'); sub.className='psub'; sub.textContent=p.name; inner.appendChild(sub);
    document.getElementById('prizePop').classList.add('show'); return;
  }
  inner.innerHTML=html;
  document.getElementById('prizePop').classList.add('show');
}
function buildCard(p){
  const co=COUNTRIES[p.ci];
  const el=document.createElement('div');
  return _buildCardBody(p, co, el);
}
// ===== INGRESO DIARIO (30 días) =====
function _dstr(d){ return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
function todayStr(){ return _dstr(new Date()); }
function yesterdayStr(){ return _dstr(new Date(Date.now()-86400000)); }
function dailyReward(day){ if(day<=7) return {coin:3}; if(day<=14) return {coin:10}; if(day<=29) return {coin:25}; return {card:DAY30_ID}; }
function dailyAvailable(){ return dailyDate !== todayStr(); }
function nextDailyDay(){ if(dailyDate===yesterdayStr()) return dailyDay>=30?1:dailyDay+1; return 1; }
function renderDaily(){
  const grid=document.getElementById('dailyGrid'); if(!grid) return;
  grid.innerHTML='';
  const avail=dailyAvailable(), nx=nextDailyDay(), en=FEN_on();
  const continuing=(dailyDate===todayStr()||dailyDate===yesterdayStr());
  for(let d=1; d<=30; d++){
    const r=dailyReward(d), c=document.createElement('div'); c.className='dCell';
    if(r.card) c.classList.add('big');
    if(continuing && d<=dailyDay) c.classList.add('claimed');
    const isNext = avail && d===nx;
    if(isNext){ c.classList.add('next'); c.onclick=()=>{ claimDaily(); }; }   // TOCAR para reclamar
    c.innerHTML='<div class="dDay">'+(en?'DAY ':'DÍA ')+d+'</div><div class="dRew">'+(r.card?'★':r.coin+'🪙')+'</div>';
    grid.appendChild(c);
  }
  // previsualización del premio del día 30 (mítico ficticio)
  const pv=document.getElementById('dailyPrev');
  if(pv){ pv.innerHTML=''; const card=buildCard(pById(DAY30_ID)); card.style.cssText='transform:scale(.52);transform-origin:top center;margin:-78px 0 -84px';
    const lab=document.createElement('div'); lab.className='dPrevLab'; lab.textContent=(en?'DAY 30 · MYTHIC':'DÍA 30 · MÍTICO');
    pv.appendChild(lab); pv.appendChild(card); }
  const cd=document.getElementById('coinsDaily'); if(cd) cd.textContent='🪙 '+coins;
  const msg=document.getElementById('dailyMsg');
  if(!avail && msg && !msg.dataset.keep) msg.textContent=en?'Claimed today · come back tomorrow!':'Reclamado hoy · ¡volvé mañana!';
  if(avail && msg && !msg.dataset.keep) msg.textContent=en?'Tap the glowing day to claim ✨':'Tocá el día que brilla para reclamar ✨';
}
function claimDaily(){
  if(!dailyAvailable()) return;
  const day=nextDailyDay(), r=dailyReward(day); let txt='';
  if(r.coin){ coins+=r.coin; txt='+'+r.coin+' 🪙'; sfxReveal('comun'); }
  else { const p=pById(r.card); owned[p.id]=(owned[p.id]||0)+1; txt=(FEN_on()?'MYTHIC! ':'¡MÍTICO! ')+p.name; sfxReveal('mitico'); }
  dailyDay=day; dailyDate=todayStr(); save(); try{ refreshProgress(); }catch(e){}
  const msg=document.getElementById('dailyMsg'); if(msg){ msg.dataset.keep='1'; msg.textContent='✓ '+txt; }
  renderDaily();
}
function openDaily(){ renderDaily(); show('daily'); }
window.openDaily=openDaily;
window.dailyAvailable=dailyAvailable;
// ===== QUESTS (misiones diarias) =====
const QUEST_DEFS = [
  {key:'play',  ico:'⚽', name:'Jugá 1 partido',  en:'Play 1 match',   goal:1, coin:5},
  {key:'win',   ico:'🏆', name:'Ganá 1 partido',  en:'Win 1 match',    goal:1, coin:10},
  {key:'goals', ico:'🥅', name:'Meté 3 goles',     en:'Score 3 goals',  goal:3, coin:8},
  {key:'pack',  ico:'🎴', name:'Abrí 1 sobre',     en:'Open 1 pack',    goal:1, coin:6}
];
function questsToday(){
  const t=todayStr();
  if(!quests || quests.date!==t){ quests={date:t, prog:{}, claimed:{}}; for(const q of QUEST_DEFS){ quests.prog[q.key]=0; quests.claimed[q.key]=false; } save(); }
  return quests;
}
function questAdd(key,n){ const q=questsToday(); if(q.prog[key]==null)q.prog[key]=0; q.prog[key]+=(n||1); save(); try{renderQuests();}catch(e){} }
window.quest=questAdd;
window.questsPending=function(){ const q=questsToday(); return QUEST_DEFS.some(d=>(q.prog[d.key]||0)>=d.goal && !q.claimed[d.key]); };
function questClaim(def){ const q=questsToday(); if(q.claimed[def.key]||(q.prog[def.key]||0)<def.goal) return;
  q.claimed[def.key]=true; coins+=def.coin; save(); try{refreshProgress();}catch(e){} sfxReveal('comun'); renderQuests(); }
function renderQuests(){
  const list=document.getElementById('questList'); if(!list) return;
  const q=questsToday(), en=FEN_on(); list.innerHTML='';
  for(const def of QUEST_DEFS){
    const p=Math.min(def.goal,q.prog[def.key]||0), done=p>=def.goal, claimed=q.claimed[def.key];
    const row=document.createElement('div'); row.className='qRow'+(claimed?' done':'');
    row.innerHTML='<div class="qIco">'+def.ico+'</div><div class="qMid"><div class="qName">'+(en?def.en:def.name)+'</div>'+
      '<div class="qBar"><div class="qFill" style="width:'+Math.round(p/def.goal*100)+'%"></div></div>'+
      '<div class="qProg">'+p+' / '+def.goal+'</div></div>';
    const b=document.createElement('button'); b.className='qBtn'+(done&&!claimed?' ready':'');
    b.textContent= claimed?(en?'CLAIMED':'LISTO'):(done?('+'+def.coin+'🪙'):(en?'IN PROGRESS':'EN CURSO'));
    b.disabled = claimed||!done; if(done&&!claimed) b.onclick=()=>questClaim(def);
    row.appendChild(b); list.appendChild(row);
  }
  const cn=document.getElementById('coinsQuests'); if(cn) cn.textContent='🪙 '+coins;
}
function openQuests(){ renderQuests(); show('quests'); }
window.openQuests=openQuests;
// ===== LEAGUES (ranking esports) =====
const LEAGUE_TIERS = [
  {name:'BRONCE',en:'BRONZE',e:'🥉',rp:0},{name:'PLATA',en:'SILVER',e:'🥈',rp:100},
  {name:'ORO',en:'GOLD',e:'🥇',rp:250},{name:'PLATINO',en:'PLATINUM',e:'💠',rp:450},
  {name:'DIAMANTE',en:'DIAMOND',e:'💎',rp:700},{name:'MAESTRO',en:'MASTER',e:'👑',rp:1000},
  {name:'GRAN MAESTRO',en:'GRANDMASTER',e:'🏆',rp:1400}
];
function leagueTierIndex(){ let idx=0; for(let i=0;i<LEAGUE_TIERS.length;i++){ if(leagueRP>=LEAGUE_TIERS[i].rp) idx=i; } return idx; }
function leagueResult(res){ if(res==='win') leagueRP+=25; else if(res==='draw') leagueRP+=8; else leagueRP=Math.max(0,leagueRP-12); save(); try{renderLeagues();}catch(e){} }
window.leagueResult=leagueResult;
function renderLeagues(){
  const idx=leagueTierIndex(), en=FEN_on(), t=LEAGUE_TIERS[idx], next=LEAGUE_TIERS[idx+1];
  const setT=(id,v)=>{ const e=document.getElementById(id); if(e) e.textContent=v; };
  setT('leagueBadge',t.e); setT('leagueTier',en?t.en:t.name); setT('rpLeagues',leagueRP+' RP');
  const fill=document.getElementById('leagueFill'), nx=document.getElementById('leagueNext');
  if(next){ const span=next.rp-t.rp, prog=leagueRP-t.rp; if(fill) fill.style.width=Math.min(100,Math.round(prog/span*100))+'%';
    if(nx) nx.textContent=(next.rp-leagueRP)+' RP → '+(en?next.en:next.name); }
  else { if(fill) fill.style.width='100%'; if(nx) nx.textContent=en?'Top tier!':'¡Liga máxima!'; }
  const lad=document.getElementById('leagueLadder'); if(lad){ lad.innerHTML='';
    LEAGUE_TIERS.forEach((tt,i)=>{ const d=document.createElement('div'); d.className='lTier'+(i===idx?' cur':'');
      d.innerHTML='<div class="le">'+tt.e+'</div><div class="ln">'+(en?tt.en:tt.name)+'</div>'; lad.appendChild(d); }); }
}
function openLeagues(){ renderLeagues(); show('leagues'); }
window.openLeagues=openLeagues;
// ===== TIENDA =====
function countDuplicates(){ let n=0; for(const k in owned){ if(+k<900 && owned[k]>1) n+=owned[k]-1; } return n; }
function sellDuplicates(){
  const dup=countDuplicates(); if(dup<=0) return;
  for(const k in owned){ if(+k<900 && owned[k]>1) owned[k]=1; }
  coins+=dup*3; save(); try{refreshProgress();}catch(e){} sfxReveal('comun');
  const m=document.getElementById('storeMsg'); if(m){ m.dataset.keep='1'; m.textContent=(FEN_on()?'Sold ':'Vendidas ')+dup+' → +'+(dup*3)+'🪙'; }
  renderStore();
}
function renderStore(){
  const list=document.getElementById('storeList'); if(!list) return;
  const en=FEN_on(), dup=countDuplicates(); list.innerHTML='';
  const items=[
    {ico:'🎴', name:en?'Buy pack':'Comprar sobre', desc:en?'3 stickers · 5🪙':'3 figuritas · 5🪙',
     btn:'5🪙', can:coins>=PACK_COST, act:()=>{ tryOpenPack(); }},
    {ico:'💱', name:en?'Sell duplicates':'Vender repetidas', desc:(en?'Turn dupes into coins · ':'Convertí repetidas · ')+dup+(en?' dupes (+3🪙 each)':' rep. (+3🪙 c/u)'),
     btn:dup>0?('+'+(dup*3)+'🪙'):(en?'NONE':'NADA'), can:dup>0, act:sellDuplicates},
    {ico:'🎰', name:en?'Free coins wheel':'Ruleta gratis', desc:en?'Spin every 4h':'Giro cada 4 h',
     btn:en?'OPEN':'ABRIR', can:true, act:()=>{ openWheel(); }}
  ];
  for(const it of items){
    const row=document.createElement('div'); row.className='stRow';
    row.innerHTML='<div class="stIco">'+it.ico+'</div><div class="stMid"><div class="stName">'+it.name+'</div><div class="stDesc">'+it.desc+'</div></div>';
    const b=document.createElement('button'); b.className='stBtn'; b.textContent=it.btn; b.disabled=!it.can;
    if(it.can) b.onclick=it.act; row.appendChild(b); list.appendChild(row);
  }
  const cs=document.getElementById('coinsStore'); if(cs) cs.textContent='🪙 '+coins;
}
function openStore(){ const m=document.getElementById('storeMsg'); if(m){ delete m.dataset.keep; m.textContent=''; } renderStore(); show('store'); }
window.openStore=openStore;
function _buildCardBody(p, co, el){
  const holo=(p.rar==='legendario'||p.rar==='mitico'||p.rar==='goat')?' holo':'';
  el.className='card r-'+p.rar+holo;
  el.innerHTML=
    '<div class="abar" style="background:'+RAR[p.rar].col+'"></div>'+
    '<div class="num">'+(p.goat?String(p.albumNo):String(p.albumNo).padStart(3,'0'))+'</div>'+
    '<div class="rtag" style="color:'+RAR[p.rar].tcol+'">'+FT(RAR[p.rar].name)+'</div>'+
    (function(){ const g=gradeOf(effOvr(p)); return '<div class="grade" style="color:'+gradeColor(g)+';border-color:'+gradeColor(g)+'">'+g+'</div>'; })()+
    '<canvas class="flag" width="60" height="40"></canvas>'+
    '<div class="face">'+
      '<img class="pcanvas" alt="">'+
      '<div class="info">'+
        '<div class="ovr">'+effOvr(p)+'<small>'+FT('GEN')+'</small></div>'+
        '<div class="nm">'+p.name+'</div>'+
        '<div class="country">'+FT(co.name)+' · '+FT(p.pos)+'</div>'+
        (function(){ const tt=powerTier(effOvr(p)); return '<div class="tierPill" style="color:'+tt.col+';border-color:'+tt.col+'">'+tt.emb+' '+tierName(tt)+'</div>'; })()+
        statRow('VEL',effStat(p,'vel'),'#7ee0a0')+statRow('TIR',effStat(p,'tiro'),'#ff8a5c')+
        statRow('PAS',effStat(p,'pase'),'#7cc0ff')+statRow('DEF',effStat(p,'def'),'#c0a0ff')+statRow('FÍS',effStat(p,'fis'),'#ffd24a')+
      '</div>'+
    '</div>';
  requestAnimationFrame(()=>{ const fc=el.querySelector('.flag'); if(fc)drawFlag(fc,co.flag); const img=el.querySelector('.pcanvas'); const u=renderBustPNG(p); if(img&&u)img.src=u; });
  if(p.rar==='mitico' || p.rar==='goat'){
    const sp=document.createElement('div'); sp.className='sparkles';
    const n=p.rar==='goat'?16:11;
    for(let i=0;i<n;i++){ const dot=document.createElement('i'); dot.style.left=(6+Math.random()*88)+'%'; dot.style.top=(20+Math.random()*70)+'%'; dot.style.animationDelay=(Math.random()*2.6)+'s'; sp.appendChild(dot); }
    el.appendChild(sp);
  }
  return el;
}
function buildMini(p){
  const el=document.createElement('div');
  el.className='minicard m-'+p.rar;
  el.innerHTML='<canvas class="mflag" width="40" height="27"></canvas><img alt="">'+
    '<div class="mgrade" style="color:'+gradeColor(gradeOf(effOvr(p)))+'">'+gradeOf(effOvr(p))+'</div>'+
    (owned[p.id]>1?'<div class="dupe">x'+owned[p.id]+'</div>':'')+
    '<div class="mn">'+p.name.split(' ')[0]+'</div>';
  requestAnimationFrame(()=>{ const im=el.querySelector('img'); const u=renderBustPNG(p); if(im&&u)im.src=u;
    const mf=el.querySelector('.mflag'); if(mf && COUNTRIES[p.ci]) drawFlag(mf, COUNTRIES[p.ci].flag); });
  return el;
}

//============================ NAVEGACIÓN ============================
function show(id){ document.querySelectorAll('.scr').forEach(s=>s.classList.remove('show')); document.getElementById(id).classList.add('show'); }
function refreshProgress(){ const t=ownedCount()+' / 144'; document.getElementById('progHome').textContent=t; document.getElementById('progAlbum').textContent=t; document.getElementById('packCount').textContent=(FEN_on()?'Packs opened: ':'Sobres abiertos: ')+packsOpened; const cn=document.getElementById('coinsHome'); if(cn) cn.textContent='🪙 '+coins; applyFigLang(); }
function tryOpenPack(){
  if(coins < PACK_COST){
    const cn=document.getElementById('coinsHome');
    if(cn){ cn.classList.add('flash'); setTimeout(()=>cn.classList.remove('flash'),400); }
    document.getElementById('packCount').textContent = FEN_on()?('Need '+PACK_COST+' 🪙 — win matches!'):('Te faltan monedas ('+PACK_COST+' 🪙) — ¡ganá partidos!');
    sfxClick();
    return;
  }
  coins -= PACK_COST; save(); refreshProgress();
  try{ questAdd('pack',1); }catch(e){}
  startOpening();
}

//============================ SOBRES + CINEMÁTICA ============================
function pullCard(){
  const tot=RAR_ORDER.reduce((s,r)=>s+RAR[r].weight,0); let x=Math.random()*tot,rar='comun';
  for(const r of RAR_ORDER){ if(x<RAR[r].weight){rar=r;break;} x-=RAR[r].weight; }
  const pool=ROSTER.filter(p=>p.rar===rar);
  return pool[Math.floor(Math.random()*pool.length)];
}
let openState='idle', openCards=[], openIdx=0;
function startOpening(){
  show('opening'); openState='pack'; openIdx=0;
  openCards=[pullCard(),pullCard(),pullCard()];
  const stage=document.getElementById('stage'); stage.removeAttribute('style'); stage.innerHTML='';
  const pack=document.createElement('div'); pack.className='pack openpack';
  pack.innerHTML='<div class="seal" id="packSeal">REZONA ★ MUNDIAL</div><div class="big"><span class="packBig">SOBRE</span><small class="packSub">MUNDIAL</small></div><div class="ball">⚽</div><div class="x3 packX3">3 FIGURITAS</div>';
  stage.appendChild(pack); applyFigLang();
  document.getElementById('openHint').textContent=FEN_on()?'Tap the pack to open':'Tocá el sobre para abrirlo';
}
function flash(){ const f=document.getElementById('flash'); f.classList.add('on'); setTimeout(()=>f.classList.remove('on'),120); }
function tearPack(){
  if(openState!=='pack') return; openState='busy';
  sfxTear();
  const pack=document.querySelector('#stage .openpack');
  pack.classList.add('tear');
  setTimeout(()=>{ flash(); pack.classList.add('gone'); setTimeout(buildRevealGrid,420); },260);
}
function revealFX(rar, host){
  const stage = host || document.getElementById('stage'); if(!stage) return;
  const col=RAR[rar].col;
  const glow=document.createElement('div'); glow.className='fxGlow';
  glow.style.background='radial-gradient(circle, '+col+', transparent 62%)';
  stage.appendChild(glow); requestAnimationFrame(()=>glow.classList.add('on'));
  setTimeout(()=>glow.remove(),760);
  const n = rar==='mitico'?34 : rar==='legendario'?24 : rar==='raro'?14 : 8;
  for(let i=0;i<n;i++){
    const pt=document.createElement('div'); pt.className='fxP'; pt.style.background=col;
    stage.appendChild(pt);
    const ang=Math.random()*Math.PI*2, dist=70+Math.random()*180;
    requestAnimationFrame(()=>{ pt.style.transform='translate('+(Math.cos(ang)*dist)+'px,'+(Math.sin(ang)*dist)+'px) scale('+(0.4+Math.random()*0.9)+')'; pt.style.opacity='0'; });
    setTimeout(()=>pt.remove(),780);
  }
}
function sfxWhoosh(){ if(!aud())return; noiseB(actx.currentTime,0.22,0.16,1000); }

// ===== PACK OPENING GOTY: cartas boca abajo, tocás para revelar (flip 3D + FX) =====
function buildRevealGrid(){
  const en=FEN_on();
  const op=document.getElementById('opening');
  const stage=document.getElementById('stage'); if(stage) stage.style.display='none';
  const hint=document.getElementById('openHint'); if(hint) hint.style.display='none';
  let old=document.getElementById('packReveal'); if(old) old.remove();
  const wrap=document.createElement('div'); wrap.id='packReveal';
  wrap.innerHTML='<div class="prFx"></div>'+
    '<div class="prTitle" id="prTitle">'+(en?'TAP TO REVEAL':'TOCÁ PARA DESCUBRIR')+'</div>';
  const row=document.createElement('div'); row.className='prRow';
  let revealed=0;
  openCards.forEach((p, idx)=>{
    // registrar la carta como obtenida ya
    owned[p.id]=(owned[p.id]||0)+1;
    const slot=document.createElement('div'); slot.className='prSlot';
    // estructura flip: cara dorso + cara frente
    const flip=document.createElement('div'); flip.className='prFlip';
    const back=document.createElement('div'); back.className='prBack';
    back.innerHTML='<div class="prBackInner"><div class="prBackLogo">★</div><div class="prBackName">REZONA</div></div>';
    const front=document.createElement('div'); front.className='prFront';
    front.appendChild(buildCard(p));
    flip.appendChild(back); flip.appendChild(front);
    slot.appendChild(flip);
    slot.dataset.done='0';
    slot.onclick=()=>{
      if(slot.dataset.done==='1'){ zoomCard(p); return; }
      slot.dataset.done='1';
      slot.classList.add('flipped');
      sfxReveal(p.rar);
      revealFX(p.rar, slot);
      if(p.rar==='mitico'||p.rar==='legendario'){ flash(); wrap.classList.add('prBig'); setTimeout(()=>wrap.classList.remove('prBig'),900); }
      // glow del borde según rareza
      slot.style.setProperty('--rc', RAR[p.rar].col);
      slot.classList.add('lit');
      revealed++;
      if(revealed>=openCards.length){
        const tt=document.getElementById('prTitle');
        if(tt) tt.textContent = en?'PACK COMPLETE!':'¡SOBRE COMPLETO!';
        setTimeout(showPackActions, 700);
      }
    };
    row.appendChild(slot);
  });
  wrap.appendChild(row);
  // acciones (ocultas hasta revelar todas)
  const actions=document.createElement('div'); actions.className='prActions'; actions.id='prActions';
  const mk=(cls,txt,fn)=>{ const b=document.createElement('button'); b.className=cls; b.textContent=txt; b.onclick=()=>{sfxClick();fn();}; return b; };
  actions.appendChild(mk('prBtn prPrimary', (en?'OPEN ANOTHER':'ABRIR OTRO')+' · '+PACK_COST+' 🪙', ()=>{ wrap.remove(); if(stage)stage.style.display=''; if(hint)hint.style.display=''; tryOpenPack(); }));
  actions.appendChild(mk('prBtn prGhost', en?'ALBUM':'ÁLBUM', openAlbum));
  actions.appendChild(mk('prBtn prGhost', en?'HOME':'INICIO', ()=>show('home')));
  wrap.appendChild(actions);
  op.appendChild(wrap);
  save(); refreshProgress();
  openState='reveal';
}
function showPackActions(){
  const a=document.getElementById('prActions'); if(a) a.classList.add('show');
}
function finishOpening(){ /* reemplazado por buildRevealGrid */ }
function showNextCard(){ /* obsoleto */ }
function dropFront(){ /* obsoleto */ }
// Ampliar una carta al tocarla
function zoomCard(p){
  let ov=document.getElementById('cardZoom');
  if(!ov){ ov=document.createElement('div'); ov.id='cardZoom';
    (document.getElementById('figModal')||document.body).appendChild(ov);
    ov.onclick=()=>{ ov.classList.remove('on'); setTimeout(()=>{ov.innerHTML='';},250); }; }
  ov.innerHTML=''; const big=buildCard(p); ov.appendChild(big);
  ov.classList.add('on');
}
//============================ ÁLBUM ============================
let albCountry=0;
function openAlbum(){ show('album'); buildTabs(); renderCountry(albCountry);
  if(window.enableDragScroll){ window.enableDragScroll(document.getElementById('grid'),'y'); window.enableDragScroll(document.getElementById('tabs'),'x'); } }
function buildTabs(){
  const tabs=document.getElementById('tabs'); tabs.innerHTML='';
  COUNTRIES.forEach((co,ci)=>{
    const have=ROSTER.filter(p=>p.ci===ci&&!p.goat&&owned[p.id]>0).length;
    const t=document.createElement('div'); t.className='tab'+(ci===albCountry?' on':'');
    t.innerHTML='<canvas class="tf" width="52" height="34"></canvas><div class="tn">'+FT(co.name)+'</div><div class="tc">'+have+'/6</div>';
    t.onclick=()=>{ sfxClick(); albCountry=ci; buildTabs(); renderCountry(ci); };
    tabs.appendChild(t);
    requestAnimationFrame(()=>{ const c=t.querySelector('.tf'); if(c)drawFlag(c,co.flag); });
  });
  // scrollear a la pestaña activa
  const active=tabs.children[albCountry]; if(active) active.scrollIntoView({inline:'center',block:'nearest'});
}
function renderCountry(ci){
  const grid=document.getElementById('grid'); grid.innerHTML='';
  let first=null;
  // 6 base del país
  ROSTER.filter(p=>p.ci===ci&&!p.goat&&!p.hidden).forEach(p=>{
    if(owned[p.id]>0){
      const m=buildMini(p); m.classList.add('slot'); m.onclick=()=>{ sfxClick(); albPreview(p); }; grid.appendChild(m); if(!first) first=p;
    } else {
      const s=document.createElement('div'); s.className='slot locked'; s.innerHTML='<div class="q">?</div>'; grid.appendChild(s);
    }
  });
  // GOAT / cartas especiales del país: SOLO si las ganaste (secretas si no)
  ROSTER.filter(p=>p.ci===ci&&(p.goat||p.hidden)&&owned[p.id]>0).forEach(p=>{
    const m=buildMini(p); m.classList.add('slot'); m.onclick=()=>{ sfxClick(); albPreview(p); }; grid.appendChild(m); if(!first) first=p;
  });
  if(first) albPreview(first); else albPreviewClear();
}
function albPreviewClear(){
  const e=document.getElementById('albPrevEmpty'), c=document.getElementById('albPrevCard');
  if(e) e.style.display=''; if(c) c.style.display='none';
}
function albPreview(p){
  const e=document.getElementById('albPrevEmpty'), c=document.getElementById('albPrevCard');
  if(!c) return; if(e) e.style.display='none'; c.style.display='flex';
  const img=document.getElementById('albPrevImg'); const u=renderBustPNG(p); if(img&&u) img.src=u;
  const g=gradeOf(effOvr(p)), gc=gradeColor(g);
  const ge=document.getElementById('albPrevGrade'); if(ge){ ge.textContent=g+' · '+effOvr(p); ge.style.color=gc; }
  const nm=document.getElementById('albPrevName'); if(nm) nm.textContent=p.name;
  const sub=document.getElementById('albPrevSub'); if(sub){ const tt=powerTier(effOvr(p)); sub.innerHTML=FT(COUNTRIES[p.ci].name)+' · '+FT(p.pos)+' · '+FT(RAR[p.rar].name)+'<br><span style="color:'+tt.col+';font-weight:900">'+tt.emb+' '+tierName(tt)+'</span>'; }
  const st=document.getElementById('albPrevStats'); if(st){ st.innerHTML='';
    const rows=[['VEL','vel','#7ee0a0'],['TIR','tiro','#ff8a5c'],['PAS','pase','#7cc0ff'],['DEF','def','#c0a0ff'],['FÍS','fis','#ffd24a']];
    rows.forEach(([lab,key,col])=>{ const v=effStat(p,key);
      st.innerHTML+='<div class="pr"><span>'+FT(lab)+'</span><span class="prt"><span class="prf" style="width:'+v+'%;background:'+col+'"></span></span><span>'+v+'</span></div>'; }); }
  const fb=document.getElementById('albPrevFull'); if(fb) fb.onclick=()=>{ sfxClick(); viewCard(p); };
}
function doUpgrade(p, key){
  if((owned[p.id]||0) <= 0) return;
  if(coins < UPGRADE_COST) return;
  if(effStat(p, key) >= statCap(p)) return;   // ya en el tope de su rareza
  coins -= UPGRADE_COST;
  if(!upg[p.id]) upg[p.id] = {};
  const maxBoost = statCap(p) - p.st[key];     // no desperdiciar más allá del tope
  upg[p.id][key] = Math.min(maxBoost, (upg[p.id][key] || 0) + UPGRADE_STEP);
  save();
  try{ refreshProgress(); }catch(e){}
  sfxClick();
  viewCard(p);   // re-render con los nuevos valores
}
function upgradePanel(p){
  const en = FEN_on();
  const wrap = document.createElement('div'); wrap.className = 'upgPanel';
  const title = document.createElement('div'); title.className = 'upgTitle';
  title.textContent = (en ? 'UPGRADE · +' : 'MEJORAR · +') + UPGRADE_STEP + ' = ' + UPGRADE_COST + '🪙   (' + (en ? 'cap ' : 'tope ') + statCap(p) + ')';
  wrap.appendChild(title);
  const keys = [['vel','VEL'],['tiro','TIR'],['pase','PAS'],['def','DEF'],['fis','FÍS']];
  for(const [k, lab] of keys){
    const v = effStat(p, k), capped = v >= statCap(p);
    const can = !capped && coins >= UPGRADE_COST && (owned[p.id] || 0) > 0;
    const row = document.createElement('div'); row.className = 'upgRow';
    row.innerHTML = '<span class="ul">' + FT(lab) + '</span><span class="uv">' + v + ' / ' + statCap(p) + '</span>';
    const b = document.createElement('button'); b.className = 'upgBtn';
    b.textContent = capped ? (en ? 'MAX' : 'TOPE') : ('+' + UPGRADE_STEP + ' · ' + UPGRADE_COST + '🪙');
    b.disabled = !can;
    if(can) b.onclick = () => doUpgrade(p, k);
    row.appendChild(b); wrap.appendChild(row);
  }
  return wrap;
}
function viewCard(p){
  const inner=document.getElementById('cardViewInner'); inner.innerHTML='';
  const c=buildCard(p); c.classList.add('fade-in'); inner.appendChild(c);
  const right=document.createElement('div'); right.className='cvRight';
  const lbl=document.createElement('div'); lbl.style.cssText='font-size:11px;color:#9aa0b8;letter-spacing:.08em;text-align:center';
  lbl.textContent=FEN_on()?('Sticker #'+p.albumNo+' · '+(owned[p.id]||0)+' in your collection'):('Figurita #'+p.albumNo+' · '+(owned[p.id]||0)+' en tu colección');
  right.appendChild(lbl);
  right.appendChild(upgradePanel(p));
  inner.appendChild(right);
  show('cardView');
}

//============================ SONIDO ============================
let actx=null,master=null;
function aud(){ try{ if(!actx){actx=new (window.AudioContext||window.webkitAudioContext)(); master=actx.createGain(); master.gain.value=0.6; master.connect(actx.destination);} if(actx.state==='suspended')actx.resume(); }catch(e){actx=null;} return actx; }
function tone(f,t,d,type,g){ if(!aud())return; const o=actx.createOscillator(),gn=actx.createGain(); o.type=type||'sine'; o.frequency.setValueAtTime(f,t); gn.gain.setValueAtTime(0.0001,t); gn.gain.exponentialRampToValueAtTime(g||0.3,t+0.01); gn.gain.exponentialRampToValueAtTime(0.0008,t+d); o.connect(gn); gn.connect(master); o.start(t); o.stop(t+d+0.02); }
function noiseB(t,d,g,freq){ if(!aud())return; const len=Math.floor(actx.sampleRate*d),buf=actx.createBuffer(1,len,actx.sampleRate),da=buf.getChannelData(0); for(let i=0;i<len;i++)da[i]=Math.random()*2-1; const s=actx.createBufferSource();s.buffer=buf; const fl=actx.createBiquadFilter();fl.type='bandpass';fl.frequency.value=freq||1200; const gn=actx.createGain();gn.gain.setValueAtTime(g,t);gn.gain.exponentialRampToValueAtTime(0.0008,t+d); s.connect(fl);fl.connect(gn);gn.connect(master);s.start(t);s.stop(t+d+0.02); }
function sfxClick(){ if(!aud())return; tone(760,actx.currentTime,0.06,'triangle',0.22); }
function sfxTear(){ if(!aud())return; noiseB(actx.currentTime,0.35,0.3,2200); }
function sfxReveal(rar){ if(!aud())return; const t=actx.currentTime;
  noiseB(t,0.28,0.16,1600);   // whoosh de aparición
  if(rar==='mitico'){ [523,659,784,1046,1318].forEach((f,i)=>tone(f,t+i*0.07,0.6,'sawtooth',0.26)); noiseB(t+0.1,0.7,0.18,4200); for(let i=0;i<6;i++) tone(1500+i*220,t+0.22+i*0.05,0.22,'sine',0.12); }
  else if(rar==='legendario'){ [440,554,659,880].forEach((f,i)=>tone(f,t+i*0.07,0.5,'square',0.2)); noiseB(t+0.05,0.4,0.12,3600); for(let i=0;i<4;i++) tone(1200+i*200,t+0.18+i*0.05,0.18,'sine',0.1); }
  else if(rar==='raro'){ tone(440,t,0.18,'triangle',0.24); tone(660,t+0.09,0.22,'triangle',0.2); tone(880,t+0.18,0.2,'sine',0.14); }
  else { tone(330,t,0.12,'sine',0.2); tone(440,t+0.08,0.14,'sine',0.13); }
}

//============================ EVENTOS ============================
document.getElementById('btnOpen').onclick=()=>{ aud(); sfxClick(); tryOpenPack(); };
document.getElementById('toGame').onclick=()=>{ sfxClick(); closeFig(); };
document.getElementById('homePack').onclick=()=>{ aud(); sfxClick(); tryOpenPack(); };
document.getElementById('btnAlbum').onclick=()=>{ sfxClick(); openAlbum(); };
document.getElementById('albExit').onclick=()=>{ sfxClick(); show('home'); refreshProgress(); };
document.getElementById('openExit').onclick=()=>{ sfxClick(); show('home'); refreshProgress(); };
document.getElementById('cardViewClose').onclick=()=>{ sfxClick(); show('album'); };
document.getElementById('btnWheel').onclick=()=>{ aud(); sfxClick(); openWheel(); };
document.getElementById('wheelBack').onclick=()=>{ sfxClick(); if(wheelTick){clearInterval(wheelTick);wheelTick=null;} closeFig(); };
document.getElementById('spinBtn').onclick=()=>{ aud(); spinWheel(); };
const _reBtn=document.getElementById('reSpinBtn'); if(_reBtn) _reBtn.onclick=()=>{ aud(); reSpinWheel(); };
document.getElementById('prizeOk').onclick=()=>{ sfxClick(); document.getElementById('prizePop').classList.remove('show'); updateWheelState(); };
document.getElementById('dailyBack').onclick=()=>{ sfxClick(); closeFig(); };
document.getElementById('questsBack').onclick=()=>{ sfxClick(); closeFig(); };
document.getElementById('leaguesBack').onclick=()=>{ sfxClick(); closeFig(); };
document.getElementById('storeBack').onclick=()=>{ sfxClick(); closeFig(); };
document.getElementById('stage').addEventListener('click',()=>{ if(openState==='pack') tearPack(); else if(openState==='card') dropFront(); });

refreshProgress();

function closeFig(){ document.getElementById('figModal').style.display='none'; }
window.openFig=function(){ var m=document.getElementById('figModal'); m.style.display='block'; show('home'); applyFigLang(); refreshProgress(); };
window.applyFigLang=applyFigLang;
window.drawCountryFlag=function(canvas,name){ try{ const co=COUNTRIES.find(c=>c.name.toLowerCase()===String(name).toLowerCase()); if(co){ drawFlag(canvas,co.flag); return true; } }catch(e){} return false; };
window.closeFig=closeFig;
