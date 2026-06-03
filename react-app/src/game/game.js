import * as Colyseus from 'colyseus.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { BVHLoader } from 'three/examples/jsm/loaders/BVHLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// ===== MODO DESARROLLADOR: SIN GUARDADO PERSISTENTE =====
// Reemplaza localStorage por uno en memoria: el juego SIEMPRE arranca desde cero
// (monedas iniciales, tutorial visible, álbum vacío) sin tener que borrar caché.
// Para reactivar el guardado, borrá este bloque.
(function(){
  try{
    const _mem = {};
    const memStore = {
      getItem(k){ return Object.prototype.hasOwnProperty.call(_mem,k) ? _mem[k] : null; },
      setItem(k,v){ _mem[k] = String(v); },
      removeItem(k){ delete _mem[k]; },
      clear(){ for(const k in _mem) delete _mem[k]; },
      key(i){ return Object.keys(_mem)[i] || null; },
      get length(){ return Object.keys(_mem).length; }
    };
    try{ Object.defineProperty(window, 'localStorage', { value: memStore, configurable: true }); }
    catch(e){ window.localStorage = memStore; }
  }catch(e){}
})();

const REPO = 'https://cdn.jsdelivr.net/gh/Juniorspro/Football-game@main';
// === Dimensiones LÓGICAS (el juego corre rotado 90° en pantallas verticales) ===
const isPortraitScreen = () => window.matchMedia('(orientation:portrait)').matches;
const LW = () => isPortraitScreen() ? window.innerHeight : window.innerWidth;
const LH = () => isPortraitScreen() ? window.innerWidth  : window.innerHeight;
const COURT_URL = import.meta.env.BASE_URL + 'football_court.glb';
const BALL_URL  = import.meta.env.BASE_URL + 'football.glb';
const PACK_URL  = import.meta.env.BASE_URL + 'bvh_pack_v5.json';
const CMU_SCALE = 0.056;

const REZONA_LOGO_B64 = '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';

const TEAMS = {
  rezona: {
    name: 'REZONA', color: 0xff7a20, accentHex: '#ff7a20',
    jerseyColor: 0xff5e10, shortsColor: 0xff7a20, socksColor: 0xffffff, sockBandColor: 0xff7a20,
    players: [
      {num:10, name:'CAPITÁN', pos:'DELANTERO', stats:{vel:88, tiro:92, pase:85, def:55, fis:78},
       look:{skin:0xd4a576, hair:0x2a1a0a, hairStyle:'short', height:1.0, eyeColor:0x101010, hasBeard:false, hasHeadband:true, headbandColor:0xff7a20}},
      {num:7, name:'FANTASMA', pos:'MEDIOCAMPO', stats:{vel:94, tiro:74, pase:90, def:60, fis:68},
       look:{skin:0xb88862, hair:0xeeeeee, hairStyle:'short', height:0.96, eyeColor:0x2a4a8a, hasBeard:false, hasHeadband:false}},
      {num:9, name:'TANQUE', pos:'DELANTERO', stats:{vel:70, tiro:89, pase:66, def:72, fis:95},
       look:{skin:0xa07050, hair:0x080804, hairStyle:'short', height:1.04, eyeColor:0x402010, hasBeard:true, hasHeadband:false}},
    ]
  },
  saurrex: {
    name: 'SAURREX', color: 0x0a0a0a, accentHex: '#ff7a20',
    jerseyColor: 0x0a0a0a, shortsColor: 0x0a0a0a, socksColor: 0x1a1a1a, sockBandColor: 0xff7a20,
    players: [
      {num:1, name:'GUARDIÁN', pos:'DEFENSA', stats:{vel:66, tiro:60, pase:72, def:93, fis:84},
       look:{skin:0xc89060, hair:0x4a2a18, hairStyle:'curly', height:1.06, eyeColor:0x305020, hasBeard:false, hasHeadband:false}},
      {num:11, name:'VELOZ', pos:'MEDIOCAMPO', stats:{vel:96, tiro:78, pase:82, def:58, fis:64},
       look:{skin:0x8a5838, hair:0x1a0a04, hairStyle:'short', height:0.94, eyeColor:0x100808, hasBeard:false, hasHeadband:true, headbandColor:0xff7a20}},
      {num:5, name:'MURALLA', pos:'DEFENSA', stats:{vel:62, tiro:65, pase:70, def:96, fis:92},
       look:{skin:0xd4b896, hair:0xc09060, hairStyle:'short', height:1.08, eyeColor:0x4060a0, hasBeard:true, hasHeadband:false}},
    ]
  },
  argentina: {
    name: 'ARGENTINA', color: 0x75aadb, accentHex: '#75aadb', strength: 'Ataque y gambeta',
    jerseyColor: 0x75aadb, shortsColor: 0x14213d, socksColor: 0xffffff, sockBandColor: 0x75aadb,
    players: [
      {num:10, name:'EL DIEZ', pos:'DELANTERO', stats:{vel:90, tiro:95, pase:94, def:50, fis:74},
       look:{skin:0xd6b08a, hair:0x2a1a0a, hairStyle:'short', height:0.97, eyeColor:0x3a2a18, hasBeard:true, hasHeadband:false}},
      {num:11, name:'FIDEO', pos:'MEDIOCAMPO', stats:{vel:93, tiro:80, pase:92, def:55, fis:62},
       look:{skin:0xc89878, hair:0x3a2a16, hairStyle:'short', height:0.95, eyeColor:0x402818, hasBeard:false, hasHeadband:false}},
      {num:9, name:'LA ARAÑA', pos:'DELANTERO', stats:{vel:84, tiro:90, pase:78, def:60, fis:85},
       look:{skin:0xb88862, hair:0x100a06, hairStyle:'short', height:1.02, eyeColor:0x201410, hasBeard:true, hasHeadband:false}},
    ]
  },
  usa: {
    name: 'ESTADOS UNIDOS', color: 0x1a2a6c, accentHex: '#3c5bd6', strength: 'Físico y potencia',
    jerseyColor: 0x1a2a6c, shortsColor: 0xffffff, socksColor: 0xb22234, sockBandColor: 0xffffff,
    players: [
      {num:8, name:'EAGLE', pos:'MEDIOCAMPO', stats:{vel:86, tiro:82, pase:84, def:74, fis:90},
       look:{skin:0xe0c0a0, hair:0xd8b840, hairStyle:'short', height:1.06, eyeColor:0x3a6aa0, hasBeard:false, hasHeadband:false}},
      {num:9, name:'BRICK', pos:'DELANTERO', stats:{vel:80, tiro:88, pase:70, def:70, fis:97},
       look:{skin:0x8a5a3a, hair:0x0a0604, hairStyle:'short', height:1.1, eyeColor:0x201410, hasBeard:true, hasHeadband:false}},
      {num:4, name:'WALL ST', pos:'DEFENSA', stats:{vel:72, tiro:66, pase:74, def:92, fis:95},
       look:{skin:0xd0a884, hair:0x6a4a2a, hairStyle:'short', height:1.12, eyeColor:0x405028, hasBeard:true, hasHeadband:false}},
    ]
  },
  vietnam: {
    name: 'VIETNAM', color: 0xda251d, accentHex: '#ffcd00', strength: 'Velocidad y agilidad',
    jerseyColor: 0xda251d, shortsColor: 0xda251d, socksColor: 0xda251d, sockBandColor: 0xffcd00,
    players: [
      {num:19, name:'LIÊN', pos:'MEDIOCAMPO', stats:{vel:97, tiro:78, pase:88, def:56, fis:58},
       look:{skin:0xe8c498, hair:0x0a0604, hairStyle:'short', height:0.9, eyeColor:0x100a06, hasBeard:false, hasHeadband:false}},
      {num:7, name:'CÔNG', pos:'DELANTERO', stats:{vel:95, tiro:82, pase:80, def:52, fis:60},
       look:{skin:0xe0bc90, hair:0x080604, hairStyle:'short', height:0.92, eyeColor:0x140c08, hasBeard:false, hasHeadband:true, headbandColor:0xffcd00}},
      {num:5, name:'HÙNG', pos:'DEFENSA', stats:{vel:88, tiro:64, pase:78, def:84, fis:66},
       look:{skin:0xddb88a, hair:0x0a0604, hairStyle:'short', height:0.95, eyeColor:0x100a06, hasBeard:false, hasHeadband:false}},
    ]
  },
  china: {
    name: 'CHINA', color: 0xde2910, accentHex: '#ffde00', strength: 'Defensa sólida',
    jerseyColor: 0xde2910, shortsColor: 0xffffff, socksColor: 0xde2910, sockBandColor: 0xffde00,
    players: [
      {num:6, name:'LÓNG', pos:'DEFENSA', stats:{vel:70, tiro:68, pase:80, def:97, fis:90},
       look:{skin:0xe6c49a, hair:0x080604, hairStyle:'short', height:1.05, eyeColor:0x120c08, hasBeard:false, hasHeadband:false}},
      {num:10, name:'WĚI', pos:'MEDIOCAMPO', stats:{vel:80, tiro:78, pase:86, def:82, fis:78},
       look:{skin:0xe2bf92, hair:0x0a0604, hairStyle:'short', height:1.0, eyeColor:0x100a06, hasBeard:false, hasHeadband:false}},
      {num:9, name:'GĀNG', pos:'DELANTERO', stats:{vel:76, tiro:84, pase:72, def:80, fis:88},
       look:{skin:0xddb98c, hair:0x080604, hairStyle:'short', height:1.04, eyeColor:0x140c08, hasBeard:true, hasHeadband:false}},
    ]
  },
  japan: {
    name: 'JAPÓN', color: 0x1b2a6b, accentHex: '#bc002d', strength: 'Técnica y pases',
    jerseyColor: 0x1b2a6b, shortsColor: 0x14204a, socksColor: 0x1b2a6b, sockBandColor: 0xffffff,
    players: [
      {num:10, name:'TSUBASA', pos:'MEDIOCAMPO', stats:{vel:88, tiro:86, pase:97, def:62, fis:70},
       look:{skin:0xe6c8a0, hair:0x0a0604, hairStyle:'short', height:0.98, eyeColor:0x100a06, hasBeard:false, hasHeadband:true, headbandColor:0xffffff}},
      {num:9, name:'KAGE', pos:'DELANTERO', stats:{vel:90, tiro:90, pase:84, def:54, fis:68},
       look:{skin:0xe2c298, hair:0x100a06, hairStyle:'short', height:0.96, eyeColor:0x140c08, hasBeard:false, hasHeadband:false}},
      {num:4, name:'TETSU', pos:'DEFENSA', stats:{vel:74, tiro:70, pase:88, def:90, fis:80},
       look:{skin:0xe8caa2, hair:0x080604, hairStyle:'short', height:1.03, eyeColor:0x120c08, hasBeard:false, hasHeadband:false}},
    ]
  },
  mexico: {
    name: 'MÉXICO', color: 0x006847, accentHex: '#ce1126', strength: 'Ataque equilibrado',
    jerseyColor: 0x006847, shortsColor: 0xffffff, socksColor: 0x006847, sockBandColor: 0xce1126,
    players: [
      {num:14, name:'CHICHA', pos:'DELANTERO', stats:{vel:88, tiro:91, pase:80, def:56, fis:80},
       look:{skin:0xc89870, hair:0x1a1008, hairStyle:'short', height:0.99, eyeColor:0x201410, hasBeard:true, hasHeadband:false}},
      {num:11, name:'TRI', pos:'MEDIOCAMPO', stats:{vel:90, tiro:82, pase:88, def:60, fis:72},
       look:{skin:0xbc8a64, hair:0x100a06, hairStyle:'short', height:0.97, eyeColor:0x1a1008, hasBeard:false, hasHeadband:true, headbandColor:0xce1126}},
      {num:2, name:'AZTECA', pos:'DEFENSA', stats:{vel:78, tiro:70, pase:78, def:92, fis:88},
       look:{skin:0xa87850, hair:0x080604, hairStyle:'short', height:1.07, eyeColor:0x201410, hasBeard:true, hasHeadband:false}},
    ]
  }
};

// Arquero robot (igual para ambos equipos; toma el color de jersey del equipo)
const KEEPER_DATA = {
  num: 1, name: 'ARQUERO', pos: 'ARQUERO · ROBOT',
  stats: { vel: 58, tiro: 52, pase: 86, def: 97, fis: 92 },
  look: { skin: 0x9aa2b0, hair: 0x556070, hairStyle: 'short', height: 1.06,
          eyeColor: 0xff7a20, hasBeard: false, hasHeadband: true, headbandColor: 0xff7a20 }
};

// === PAÍSES EXTRA (se generan 3 jugadores c/u, estilo selección) → 24 países + 2 de marca ===
(function(){
  const EXTRA = [
    ['Brasil',0xffdf00,'#009c3b','Ataque y samba','latin'],
    ['Francia',0x1f2a6b,'#ef4135','Equilibrio total','euro'],
    ['Alemania',0xdddddd,'#000000','Potencia y orden','euro'],
    ['España',0xc60b1e,'#ffc400','Posesión','euro'],
    ['Inglaterra',0xffffff,'#0a2472','Físico y directo','euro'],
    ['Portugal',0xa8000b,'#006600','Talento individual','euro'],
    ['Italia',0x1c5bd6,'#ffffff','Defensa táctica','euro'],
    ['Países Bajos',0xf36c21,'#ffffff','Fútbol total','euro'],
    ['Bélgica',0xc8102e,'#ffd700','Generación dorada','euro'],
    ['Uruguay',0x5fa8e0,'#ffffff','Garra','latin'],
    ['Corea del Sur',0xc8102e,'#1a3a8a','Pulmón y velocidad','asia'],
    ['Croacia',0xc8102e,'#ffffff','Mediocampo letal','euro'],
    ['Marruecos',0xc1272d,'#006233','Orden y sorpresa','africa'],
    ['Senegal',0x00853f,'#fdef42','Potencia física','africa'],
    ['Nigeria',0x008751,'#ffffff','Velocidad pura','africa'],
    ['Colombia',0xfcd116,'#003893','Gambeta y gol','latin'],
    ['Chile',0xc8102e,'#0039a6','Presión alta','latin'],
    ['Canadá',0xd80621,'#ffffff','Energía joven','na']
  ];
  const FN={latin:['Diego','Mateo','Bruno','Thiago','Lucas','Nico'],euro:['Liam','Hugo','Leon','Marco','Luka','Sven'],
            asia:['Min','Hiro','Tuan','Wei','Jun','Hao'],africa:['Sadio','Amadou','Victor','Riyad','Kalidou','Samuel'],
            na:['Tyler','Jordan','Mason','Ethan','Logan','Chase']};
  const SN={latin:['Silva','Gómez','Rojas','Pereira','Torres','Castro'],euro:['Müller','Rossi','Smith','Kovač','Costa','Nowak'],
            asia:['Kim','Tanaka','Nguyen','Wang','Park','Chen'],africa:['Diop','Mané','Okafor','Traoré','Ndiaye','Koné'],
            na:['Johnson','Miller','Davis','Brown','Wilson','Clark']};
  const SK={latin:[0xd49a6a,0xc08552],euro:[0xe8b88a,0xd8a878],asia:[0xe6c08c,0xdcb27a],africa:[0x8a5a36,0x6e4423],na:[0xe8b88a,0xa86b3c]};
  let s=99; const rnd=()=>{ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
  const cl=v=>Math.max(48,Math.min(99,v|0));
  for(const [nm,col,acc,str,reg] of EXTRA){
    const key=nm.toLowerCase().replace(/[^a-z]/g,'');
    const poss=['DELANTERO','MEDIOCAMPO','DEFENSA']; const players=[];
    for(let j=0;j<3;j++){
      const b=70+(rnd()*14|0); const v=()=>(rnd()*16-5|0);
      players.push({num:1+(rnd()*30|0), name:FN[reg][rnd()*6|0]+' '+SN[reg][rnd()*6|0], pos:poss[j],
        stats:{vel:cl(b+v()),tiro:cl(b+v()),pase:cl(b+v()),def:cl(b+v()),fis:cl(b+v())},
        look:{skin:SK[reg][rnd()*2|0],hair:0x140d06,hairStyle:'short',height:0.93+rnd()*0.16,
              eyeColor:0x201410,hasBeard:rnd()<0.4,hasHeadband:false}});
    }
    TEAMS[key]={name:nm.toUpperCase(),color:col,accentHex:acc,strength:str,
      jerseyColor:col,shortsColor:col,socksColor:col,sockBandColor:0xffffff,players};
  }
})();
function pvRoster(teamKey){ return [...TEAMS[teamKey].players, KEEPER_DATA]; }

// === IDIOMA (ES / EN) ===
let LANG = 'es';
try{ const _sl=localStorage.getItem('rezonaLang'); if(_sl==='es'||_sl==='en') LANG=_sl; }catch(e){}
const EN = {
  'JUGAR':'PLAY','GRÁFICOS':'GRAPHICS','ALTA':'HIGH','MEDIA':'MEDIUM','BAJA':'LOW',
  'ELEGÍ TU EQUIPO':'CHOOSE YOUR TEAM','8 equipos disponibles':'8 teams available','✕ CANCELAR':'✕ CANCEL',
  '‹ EQUIPOS':'‹ TEAMS','▶ INICIAR PARTIDO':'▶ START MATCH',
  'Arrastrá para girar · flechas para cambiar':'Drag to rotate · arrows to switch',
  'Velocidad':'Speed','Tiro':'Shot','Pase':'Pass','Defensa':'Defense','Físico':'Physical',
  'DELANTERO':'FORWARD','MEDIOCAMPO':'MIDFIELD','DEFENSA':'DEFENSE','ARQUERO · ROBOT':'GOALKEEPER · ROBOT','ARQUERO':'GOALKEEPER',
  '✕ SALIR':'✕ EXIT','PATEAR':'KICK','PASE':'PASS','SPRINT':'SPRINT',
  'FIN DEL PARTIDO':'FULL TIME','↻ JUGAR DE NUEVO':'↻ PLAY AGAIN',
  '¡GANASTE! 🏆':'YOU WON! 🏆','EMPATE 🤝':'DRAW 🤝','PERDISTE':'YOU LOST','¡GANASTE!':'YOU WON!','EMPATE':'DRAW',
  'Saque lateral':'Throw-in','Saque de esquina':'Corner kick','Saque de arco':'Goal kick','rival':'opponent',
  '¡PASE!':'PASS!','⏱ ENTRETIEMPO · Cambio de lado':'⏱ HALF-TIME · Switching sides',
  'Saque del centro · ¡PASE para empezar!':'Kick-off · PASS to start!','¡ATAJADA!':'SAVE!',
  'Saque de arco · ¡PASE para distribuir!':'Goal kick · PASS to distribute!',
  'Moverte':'Move','Patear / Tiro':'Kick / Shoot','Pasar':'Pass','Sprint':'Sprint',
  'Arrastrá el joystick para correr por la cancha. La cámara te sigue siempre.':'Drag the joystick to run. The camera always follows you.',
  'PATEAR dispara fuerte. Con la pelota y el arco cerca… ¡buscá el gol!':'KICK shoots hard. With the ball near the goal… score!',
  'PASE entrega la pelota a un compañero cercano para armar la jugada.':'PASS gives the ball to a nearby teammate.',
  'Mantené SPRINT para acelerar y escaparte de los que te marcan.':'Hold SPRINT to accelerate and escape markers.',
  'SIGUIENTE →':'NEXT →','¡A JUGAR!':"LET'S PLAY!",'SALTAR TUTORIAL':'SKIP TUTORIAL',
  'Cámara FIFA':'FIFA Camera','Cámara cercana':'Close Camera',
  'Apuntá girando la cámara y TIRAR':'Aim with camera & THROW','Apuntá y PASE / PATEAR':'Aim & PASS / KICK',
  'REORDENAR':'REORDER','TU PLANTEL':'YOUR SQUAD','Tocá una figurita para poner ese jugador':'Tap a sticker to use that player',
  'No tenés figuritas de este país todavía':"You don't own stickers from this country yet",'Original':'Original','✕ CERRAR':'✕ CLOSE',
  // Países
  'ESTADOS UNIDOS':'UNITED STATES','JAPÓN':'JAPAN','MÉXICO':'MEXICO','BRASIL':'BRAZIL','FRANCIA':'FRANCE',
  'ALEMANIA':'GERMANY','ESPAÑA':'SPAIN','INGLATERRA':'ENGLAND','ITALIA':'ITALY','PAÍSES BAJOS':'NETHERLANDS',
  'BÉLGICA':'BELGIUM','COREA DEL SUR':'SOUTH KOREA','CROACIA':'CROATIA','MARRUECOS':'MOROCCO','CANADÁ':'CANADA',
  // Fortalezas
  'Ataque total':'Total attack','Defensa férrea':'Iron defense','Ataque y gambeta':'Attack & dribble',
  'Físico y potencia':'Physical & power','Velocidad y agilidad':'Speed & agility','Defensa sólida':'Solid defense',
  'Técnica y pases':'Technique & passing','Ataque equilibrado':'Balanced attack','Ataque y samba':'Attack & samba',
  'Equilibrio total':'Total balance','Potencia y orden':'Power & order','Posesión':'Possession',
  'Físico y directo':'Physical & direct','Talento individual':'Individual talent','Defensa táctica':'Tactical defense',
  'Fútbol total':'Total football','Generación dorada':'Golden generation','Garra':'Grit',
  'Pulmón y velocidad':'Stamina & speed','Mediocampo letal':'Lethal midfield','Orden y sorpresa':'Order & surprise',
  'Potencia física':'Physical power','Velocidad pura':'Pure speed','Gambeta y gol':'Dribble & goals',
  'Presión alta':'High press','Energía joven':'Young energy'
};
function t(s){ return (LANG === 'en' && EN[s]) ? EN[s] : s; }
function setTxt(id, s){ const e = document.getElementById(id); if(e) e.textContent = s; }
function applyLang(){
  window.LANG = LANG;
  if(window.applyFigLang) try{ window.applyFigLang(); }catch(e){}
  setTxt('playBtn', t('JUGAR'));
  setTxt('cancelBtn', t('✕ CANCELAR'));
  setTxt('modeBack', t('✕ CANCELAR'));
  setTxt('modeTitle', LANG === 'en' ? 'CHOOSE MODE' : 'ELEGÍ EL MODO');
  setTxt('modeKicker', LANG === 'en' ? 'REZONA · FOOTBALL' : 'REZONA · FÚTBOL');
  try{ document.querySelectorAll('#modeSelect .mcGo').forEach(e=>{ e.textContent = (LANG==='en'?'PLAY ▶':'JUGAR ▶'); }); }catch(e){}
  try{
    const md = { '1v1': LANG==='en'?'One on one · 2 players':'Mano a mano · 2 jugadores',
                 '2v2': LANG==='en'?'Team play · 4 players':'En equipo · 4 jugadores',
                 '3v3': LANG==='en'?'Full team · 6 players':'Equipo completo · 6 jugadores' };
    document.querySelectorAll('#modeSelect .modeCard').forEach(c=>{
      const m = c.getAttribute('data-mode'); const d = c.querySelector('.mcDesc');
      if(m && md[m] && d) d.textContent = md[m];
    });
  }catch(e){}
  setTxt('modeSub', LANG === 'en' ? 'Online multiplayer' : 'Multijugador online');
  setTxt('tsTitle', t('ELEGÍ TU EQUIPO'));
  setTxt('tsSub', Object.keys(TEAMS).length + (LANG === 'en' ? ' teams available' : ' equipos disponibles'));
  setTxt('pvBack', t('‹ EQUIPOS'));
  setTxt('pvPlay', t('▶ INICIAR PARTIDO'));
  setTxt('pvHint', t('Arrastrá para girar · flechas para cambiar'));
  setTxt('exitBtn', t('✕ SALIR'));
  setTxt('btnKick', t('PATEAR'));
  setTxt('btnPass', t('PASE'));
  setTxt('btnSprint', t('SPRINT'));
  setTxt('figBtn', LANG === 'en' ? '🎴 STICKERS' : '🎴 FIGURITAS');
  setTxt('langBtn', LANG === 'es' ? '🌐 ES' : '🌐 EN');
  setTxt('ftReplay', t('↻ JUGAR DE NUEVO'));
  const gl = document.querySelector('.gfxLabel'); if(gl) gl.textContent = t('GRÁFICOS');
  document.querySelectorAll('.gfxOpt').forEach(b => { b.textContent = t({ alta:'ALTA', media:'MEDIA', baja:'BAJA' }[b.dataset.q]); });
  const ftt = document.querySelector('#fullTime .ftTitle'); if(ftt) ftt.textContent = t('FIN DEL PARTIDO');
  // Riel + navegación del menú principal
  const railMap = {dailyTile:['INGRESO DIARIO','DAILY REWARD'], railQuests:['MISIONES','QUESTS'], railLeagues:['LIGAS','LEAGUES'], railStore:['TIENDA','STORE']};
  for(const id in railMap){ const e=document.querySelector('#'+id+' .rTxt'); if(e) e.textContent = LANG==='en'?railMap[id][1]:railMap[id][0]; }
  const rg=document.querySelector('#railGems .smTxt'); if(rg) rg.textContent = LANG==='en'?'FREE COINS':'MONEDAS GRATIS';
  const navMap = {navQuests:['🎯','MISIONES','QUESTS'], navLeagues:['🛡️','LIGAS','LEAGUES'], navMarket:['🛒','MERCADO','MARKET'], navStore:['🏪','TIENDA','STORE'], navDaily2:['🎁','DIARIO','DAILY']};
  for(const id in navMap){ const e=document.getElementById(id); if(e){ const m=navMap[id]; e.innerHTML='<span>'+m[0]+'</span>'+(LANG==='en'?m[2]:m[1]); } }
  try{ localStorage.setItem('rezonaLang', LANG); }catch(e){}
}

// === STATE ===
let scene, camera, renderer, clock;
let courtModel = null, ballModel = null;
let courtRaycastMeshes = [];  // meshes para raycast (detectar altura del suelo)
let courtNets = [];           // sistema de redes con física verlet
let courtBounds = null;  // AABB de la cancha (para limitar al jugador)
let fieldLimits = null;  // {minX, maxX, minZ, maxZ} - cuadrado de juego
let trees = [];          // {pos, radius} para colisiones
let player = null;       // {root, bones, mixer, actions}
let currentTeam = null;
let currentRival = null;   // equipo rival (aleatorio cada partido)
let bvhClipsRef = null;

// Input
const joystickState = { active:false, dx:0, dy:0, vx:0, vy:0 };
const buttons = { kick:false, pass:false, sprint:false };
// Cámara orbital
const cameraOrbit = {
  yaw: Math.PI,
  pitch: 0.28,
  distance: 6.0
};
// Modo cámara: 'player' (sigue al jugador) o 'ball' (sigue la pelota cuando va a un compañero)
let cameraMode = 'player';
let cameraView = 'fifa';   // 'fifa' = elevada/angulada (defecto) · 'tps' = cercana detrás del jugador
let camSwitchT = 0;        // al cambiar de cámara, transición suave durante ~1s
let cameraBallTimer = 0;  // tiempo restante en modo ball
let _autoSwitchCD = 0;    // cooldown del cambio automático por distancia
let passInFlight = false, passReceiver = null, passTimer = 0, passOffside = false;
// Compañeros (los otros 2 del equipo)
let teammates = [];  // 2 compañeros del jugador (mismo equipo)
let rivals = [];     // 3 rivales del equipo opuesto
let ballOwner = null;  // qué entidad tiene la pelota (player o un NPC) o null
let lastKicker = null, lastKickerTimer = 0;  // quien acaba de patear no puede re-agarrar al instante
let ballHomingTarget = null, ballHomingTimer = 0;  // pase NPC/arquero guiado: SIEMPRE llega al aliado
let scoreUs = 0;       // goles del equipo del jugador
let scoreThem = 0;     // goles del equipo rival
let goalCooldown = 0;  // tiempo desde el último gol (evita doble cuenta)
let goalAreas = [];    // [{teamForGoal: 'us'|'them', bbox}] - donde meter para anotar
let fieldAxis = 'z';   // 'x' o 'z' - eje principal de la cancha (arcos a sus extremos)
// Auto-freno: después de patear en movimiento, frena durante 0.5s
let autoFreezeTimer = 0;
// Multiplicador de velocidad temporal (kick durante carrera reduce al 50%)
let speedMultiplier = 1.0;
let speedMultiplierTimer = 0;

// === PORTEROS / FALTAS / TIEMPO DE PARTIDO ===
let goalkeepers = [];        // [{...buildPlayer, team, goal, baseMain, widthAxis, halfWidth, mainCoord, saveCD}]
let devMode = false, devHelpers = [], devSel = 0;   // editor DEV de arcos
const devCamTarget = new THREE.Vector3();            // pivote de la cámara libre en DEV
let freeKickPause = 0;       // segundos de pausa por tiro libre (congela al jugador)
let foulCooldown = 0;        // anti-doble-falta
let stealGrace = 0;          // tras un saque/tiro libre propio: los rivales no pueden robarte por unos segundos
let matchTime = 0;           // segundos REALES transcurridos del partido
let matchHalf = 1;           // 1 = primer tiempo, 2 = segundo tiempo
let halfStartReal = 0;       // matchTime al empezar el tiempo actual
let addedMin1 = 2, addedMin2 = 3;   // minutos de descuento por tiempo (se randomizan por partido)
const HALF_REAL = 90;        // duración real de cada tiempo (s) → 1:30 por tiempo (3 min total)
const HALF_FB = 2700;        // minutos "de fútbol" por tiempo (45 min = 2700 s)
let matchOver = false;       // true al terminar el tiempo
let audioCtx = null;         // contexto WebAudio para el silbato

// Direcciones y arcos para la IA de movimiento (se setean en startGame)
let fieldFwd = new THREE.Vector3(0, 0, -1);  // hacia el arco rival (ataque)
let fieldSide = new THREE.Vector3(1, 0, 0);  // perpendicular
let ourGoalPos = null;       // arco que defendemos (THREE.Vector3)
let theirGoalPos = null;     // arco que atacamos (THREE.Vector3)

// Cinemática de inicio
let cinematicActive = false, cinematicTimer = 0, cinematicStartYaw = Math.PI;
let halftimeActive = false, halftimeTimer = 0, halftimeSwitched = false;
let matchEndCine = false, endCineTimer = 99, endCineShot = 0, endCineTarget = null;
const PREP_KEYS = ['prep1','prep2','prep3','prep4','prep5','prep6'];
// 20 EMOTES / festejos (los 6 prep + 14 nuevos) para final de partido, inicio y cortes
const EMOTE_KEYS = ['emote1','emote2','emote3','emote4','emote5','emote6','emote7','emote8','emote9','emote10','emote11','emote12','emote13','emote14','emote15','emote16','emote17','emote18','emote19','emote20'];
function playRandomEmote(e, speedMin = 0.8, speedMax = 1.25){
  if(!e || !e.root || !e.actions) return;
  // elige un emote que exista realmente en este personaje
  const avail = EMOTE_KEYS.filter(k => e.actions[k]);
  if(!avail.length){ playerSetAnim(e, 'idle'); return; }
  const k = avail[Math.floor(Math.random() * avail.length)];
  playerSetAnim(e, k, speedMin + Math.random() * (speedMax - speedMin));
}

// Tutorial
let tutorialActive = false, tutorialSeen = false, tutIndex = 0;
let tutorialIntro = false;
// Reset total una vez (nuevo sistema con monedas) — borra progreso viejo
try{ if(localStorage.getItem('rezonaVer') !== '2'){ ['rezonaAlbum','rezonaCoins','rezonaTutDone'].forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} }); localStorage.setItem('rezonaVer','2'); } }catch(e){}
try{ if(localStorage.getItem('rezonaTutDone') === '1') tutorialSeen = true; }catch(e){}

// Festejo de gol + saque del centro
let slowmo = 1;                 // factor de cámara lenta (1 = normal)
let celebrating = false, celebTimer = 0, celebGroup = null, celebLight = null, celebGoalPos = null;
let kickoffActive = false, kickoffPending = false;
let setPiece = null;          // {type, team, taker, think} para lateral/esquina/saque de arco
let lastTouchTeam = null;     // último equipo que tocó la pelota (para reglas de saque)
const TUT_STEPS = [
  {target:'joystick', title:'Moverte',     desc:'Arrastrá el joystick para correr por la cancha. La cámara te sigue siempre.'},
  {target:'btnKick',  title:'Patear / Tiro', desc:'PATEAR dispara fuerte. Con la pelota y el arco cerca… ¡buscá el gol!'},
  {target:'btnPass',  title:'Pasar',        desc:'PASE entrega la pelota a un compañero cercano para armar la jugada.'},
  {target:'btnSprint',title:'Sprint',       desc:'Mantené SPRINT para acelerar y escaparte de los que te marcan.'}
];

// === SETUP LOGOS ===
function setupLogos(){
  const bigImg = document.getElementById("bigLogoImg");
  if(bigImg) bigImg.src = "data:image/png;base64," + REZONA_LOGO_B64;
}

// === SCENE ===
function initScene(){
  scene = new THREE.Scene();
  // Sky gradient via canvas → equirectangular texture
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 8; skyCanvas.height = 256;
  const skctx = skyCanvas.getContext('2d');
  // ===== ENTORNOS / AMBIENTES (cielo, niebla, sol, exposición) =====
  // Cada partido elige uno (aleatorio). Cambian la atmósfera por completo.
  const ENVIRONMENTS = {
    day:    { name:'Mediodía', sky:['#9fd9ff','#cfe9ff','#ffe9c8','#f5b870'], fog:0xcfe9ff, fogNear:80, fogFar:160,
              hemiSky:0xafe0ff, hemiGround:0x70a040, hemiInt:0.9, sun:0xffeac0, sunInt:2.4, expo:1.35, amb:0x6080a0 },
    sunset: { name:'Atardecer', sky:['#3a2a6a','#8a4a7a','#ff8a4a','#ffcf6a'], fog:0xff9a5a, fogNear:60, fogFar:150,
              hemiSky:0xffb070, hemiGround:0x603020, hemiInt:0.8, sun:0xff8a40, sunInt:2.2, expo:1.4, amb:0x806060 },
    night:  { name:'Nocturno', sky:['#0a0e2a','#141a44','#1a2050','#0e1430'], fog:0x101840, fogNear:55, fogFar:150,
              hemiSky:0x6080c0, hemiGround:0x202840, hemiInt:0.55, sun:0xcfe0ff, sunInt:1.4, expo:1.5, amb:0x304060, floods:true },
    dawn:   { name:'Amanecer', sky:['#2a3a7a','#7a8aca','#ffd0b0','#ffe8d0'], fog:0xd0c0e0, fogNear:70, fogFar:160,
              hemiSky:0xc0d0ff, hemiGround:0x807060, hemiInt:0.85, sun:0xfff0d0, sunInt:2.0, expo:1.35, amb:0x6070a0 },
    storm:  { name:'Tormenta', sky:['#3a4050','#4a5060','#5a6070','#6a7080'], fog:0x6a7080, fogNear:45, fogFar:120,
              hemiSky:0x90a0b0, hemiGround:0x404850, hemiInt:0.7, sun:0xc0c8d0, sunInt:1.6, expo:1.25, amb:0x506070 },
  };
  const _envKeys = Object.keys(ENVIRONMENTS);
  const _envKey = (window.forcedEnv && ENVIRONMENTS[window.forcedEnv]) ? window.forcedEnv
                  : _envKeys[Math.floor(Math.random()*_envKeys.length)];
  const ENV = ENVIRONMENTS[_envKey];
  window.currentEnv = _envKey;

  const skyGrad = skctx.createLinearGradient(0, 0, 0, 256);
  skyGrad.addColorStop(0.0, ENV.sky[0]);
  skyGrad.addColorStop(0.45, ENV.sky[1]);
  skyGrad.addColorStop(0.65, ENV.sky[2]);
  skyGrad.addColorStop(1.0, ENV.sky[3]);
  skctx.fillStyle = skyGrad;
  skctx.fillRect(0, 0, 8, 256);
  const skyTex = new THREE.CanvasTexture(skyCanvas);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyTex;
  
  // Niebla del entorno (se mezcla con el cielo)
  scene.fog = new THREE.Fog(ENV.fog, ENV.fogNear, ENV.fogFar);
  
  camera = new THREE.PerspectiveCamera(50, LW()/LH(), 0.1, 200);
  camera.position.set(0, 8, -12);
  
  renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
  renderer.setSize(LW(), LH());
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = ENV.expo;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;   // más barato que PCFSoft
  (document.getElementById('rotor')||document.body).appendChild(renderer.domElement);
  setupPostFX();
  try{ if(window.requestIdleCallback) requestIdleCallback(()=>{ precacheGolWords(); precacheNuke(); }); else setTimeout(()=>{ precacheGolWords(); precacheNuke(); }, 1200); }catch(e){ setTimeout(()=>{ precacheGolWords(); precacheNuke(); }, 1200); }
  
  // === ILUMINACIÓN CINEMATOGRÁFICA (según el entorno) ===
  scene.add(new THREE.HemisphereLight(ENV.hemiSky, ENV.hemiGround, ENV.hemiInt));
  
  // Sol / key light del entorno
  const sun = new THREE.DirectionalLight(ENV.sun, ENV.sunInt);
  sun.position.set(15, 25, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -30;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 80;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);
  
  // Fill azulada del lado opuesto (simulando rebote del cielo)
  const fill = new THREE.DirectionalLight(0x9ac8ff, 0.7);
  fill.position.set(-12, 8, -8);
  scene.add(fill);
  
  // Rim light cálida desde atrás (acentúa contorno del jugador)
  const rim = new THREE.DirectionalLight(0xffa050, 0.5);
  rim.position.set(0, 6, -15);
  scene.add(rim);
  optLights.length = 0; optLights.push(fill, rim);  // luces que se apagan en calidad media/baja
  
  // Ambient muy suave para iluminar zonas en sombra sin perder contraste
  scene.add(new THREE.AmbientLight(ENV.amb, 0.25));
  
  // Focos de estadio (solo en entornos nocturnos / tormenta)
  if(ENV.floods){
    const fc = [[-22,16,-12],[22,16,-12],[-22,16,12],[22,16,12]];
    for(const f of fc){
      const fl = new THREE.SpotLight(0xfff4e0, 1.6, 90, Math.PI/5, 0.4, 1.2);
      fl.position.set(f[0], f[1], f[2]); fl.target.position.set(0,0,0);
      scene.add(fl); scene.add(fl.target);
    }
  }
  
  clock = new THREE.Clock();
  
  const applyRotor = () => {
    const portrait = window.innerHeight > window.innerWidth;
    const W = window.innerWidth, H = window.innerHeight;
    [document.getElementById('rotor'), document.getElementById('figModal')].forEach(el => {
      if(!el) return;
      if(portrait){
        el.style.top='0'; el.style.left='0'; el.style.right='auto'; el.style.bottom='auto';
        el.style.width = H+'px'; el.style.height = W+'px';
        el.style.transformOrigin='0 0';
        el.style.transform = 'translateX('+W+'px) rotate(90deg)';
      } else {
        el.style.top=''; el.style.left=''; el.style.right=''; el.style.bottom='';
        el.style.width=''; el.style.height=''; el.style.transform=''; el.style.transformOrigin='';
      }
    });
  };
  const _doResize = () => {
    applyRotor();
    camera.aspect = LW()/LH();
    camera.updateProjectionMatrix();
    renderer.setSize(LW(), LH());
    resizePostFX();
  };
  applyRotor();
  addEventListener('resize', _doResize);
  addEventListener('orientationchange', () => setTimeout(_doResize, 120));
}

// === CANCHA + BOSQUE ===
async function loadCourt(){
  console.log('[court] descargando GLB...');
  setLoadProgress(20);
  const loader = new GLTFLoader();
  const gltf = await new Promise((rs, rj) => {
    loader.load(COURT_URL, rs, undefined, rj);
  });
  courtModel = gltf.scene;
  
  // Calcular bounding box
  const box = new THREE.Box3().setFromObject(courtModel);
  const size = new THREE.Vector3();
  box.getSize(size);
  console.log('[court] size:', size.x.toFixed(1), 'x', size.z.toFixed(1));
  
  // Si la cancha es muy chica/grande, escalar a ~30m de largo (cancha de fútbol mini)
  const targetLength = 30;
  const currentLength = Math.max(size.x, size.z);
  const scale = targetLength / currentLength;
  courtModel.scale.setScalar(scale);
  
  // Recentrar al origen
  const box2 = new THREE.Box3().setFromObject(courtModel);
  const center = new THREE.Vector3();
  box2.getCenter(center);
  courtModel.position.x -= center.x;
  courtModel.position.z -= center.z;
  // Poner sobre el piso
  courtModel.position.y -= box2.min.y;
  
  // Recalcular bbox final
  courtBounds = new THREE.Box3().setFromObject(courtModel);
  
  // === LÍMITES DE JUEGO (provisional = bbox del estadio entero) ===
  // Se reemplaza más abajo por el mesh real del césped si se detecta.
  const inset = 1.0;  // metros desde el borde
  fieldLimits = {
    minX: courtBounds.min.x + inset,
    maxX: courtBounds.max.x - inset,
    minZ: courtBounds.min.z + inset,
    maxZ: courtBounds.max.z - inset
  };
  
  // Actualizar transformaciones para que getWorldPosition funcione
  courtModel.updateMatrixWorld(true);
  
  // === RAYCASTER SETUP ===
  // Los meshes del estadio se usan para raycast (detectar altura del suelo bajo el jugador)
  // y para detectar colisiones con la pelota.
  courtRaycastMeshes = [];   // meshes sólidos para raycast jugador
  courtNets = [];            // sistema de redes (verlet) - solo unas pocas, las de los arcos
  const netCandidates = [];  // mallas tipo red detectadas; simulamos a lo sumo 2

  // === DETECCIÓN DEL CÉSPED REAL (mesh rectángulo de la cancha) ===
  // El bbox del GLB incluye gradas; buscamos el mesh PLANO + GRANDE + VERDE + centrado.
  let fieldMesh = null, fieldBB = null, fieldScore = -1;
  const courtArea = (courtBounds.max.x - courtBounds.min.x) * (courtBounds.max.z - courtBounds.min.z);
  const fieldKeywords = ['field','pitch','cancha','grass','césped','cesped','turf','lawn',
                         'soccer','futbol','fútbol','ground','floor','piso','suelo','plane','green'];
  
  courtModel.traverse(o => {
    if(!o.isMesh) return;
    o.castShadow = false;       // el estadio NO proyecta sombras (ahorro grande); solo recibe
    o.receiveShadow = true;
    
    const name = (o.name || '').toLowerCase();
    o.geometry.computeBoundingBox();
    const localBB = o.geometry.boundingBox;
    const worldBB = localBB.clone().applyMatrix4(o.matrixWorld);
    const sz = new THREE.Vector3();
    worldBB.getSize(sz);
    
    console.log(`[mesh] "${o.name}" size=(${sz.x.toFixed(2)},${sz.y.toFixed(2)},${sz.z.toFixed(2)})`);

    // === ¿Es el césped? PLANO + GRANDE + (verde o nombre de cancha) + centrado ===
    const footprint = sz.x * sz.z;
    if(sz.y < 0.9 && footprint > 15){
      const nameMatch = fieldKeywords.some(k => name.includes(k));
      let greenish = false;
      const mat = Array.isArray(o.material) ? o.material[0] : o.material;
      if(mat && mat.color){
        const c = mat.color;
        greenish = (c.g > c.r * 1.08 && c.g > c.b * 1.08);
      }
      const cx = (worldBB.min.x + worldBB.max.x) / 2;
      const cz = (worldBB.min.z + worldBB.max.z) / 2;
      const offCenter = Math.hypot(cx, cz);
      let score = footprint;
      if(nameMatch) score *= 100;
      if(greenish) score *= 50;
      // penalizar si abarca casi todo el estadio (probable losa/base, no el césped)
      if(footprint > courtArea * 0.85) score *= 0.15;
      // preferir centrado en el origen (la cancha está al medio)
      score /= (1 + offCenter * 0.08);
      if(score > fieldScore){
        fieldScore = score;
        fieldMesh = o;
        fieldBB = worldBB.clone();
      }
    }
    
    // Detectar red de arco (alta + delgada en un eje)
    const isNet = name.includes('net') || name.includes('red') || 
                  (sz.y > 1.5 && sz.y < 3.5 && Math.min(sz.x, sz.z) < 0.3 && Math.max(sz.x, sz.z) > 2);
    if(isNet){
      // Antes simulaba CADA reja del estadio como tela verlet (decenas → lag brutal).
      // Ahora solo las recolectamos; después simulamos a lo sumo 2 (las de los arcos).
      netCandidates.push({ mesh: o, bb: worldBB.clone(), area: sz.x * sz.y * sz.z });
      return;
    }
    
    // Resto = raycast target (incluye piso, paredes, postes, gradas)
    courtRaycastMeshes.push(o);
  });

  // Simular como tela SOLO las 2 redes más grandes (las de los arcos). El resto
  // de las rejas del estadio quedan visibles pero estáticas → enorme ahorro de CPU.
  netCandidates.sort((a, b) => b.area - a.area);
  const maxNets = (gfxQuality === 'baja') ? 0 : 2;
  for(let i = 0; i < netCandidates.length; i++){
    if(i < maxNets){
      const net = createNetPhysics(netCandidates[i].mesh, netCandidates[i].bb);
      if(net){ courtNets.push(net); netCandidates[i].mesh.visible = false; }
    }
    // las que no se simulan quedan visibles (estado original)
  }
  console.log('[nets] candidatas:', netCandidates.length, '· simuladas:', courtNets.length);
  
  // Asignar arcos: detectar sobre qué eje están alineados (X o Z) y asignar lados
  if(goalAreas.length === 2){
    const g0 = goalAreas[0].center;
    const g1 = goalAreas[1].center;
    // Eje principal de la cancha = el que tiene mayor diferencia entre arcos
    const dx = Math.abs(g0.x - g1.x);
    const dz = Math.abs(g0.z - g1.z);
    const axis = dx > dz ? 'x' : 'z';
    fieldAxis = axis;
    console.log(`[goals] eje principal: ${axis}, separación: ${Math.max(dx,dz).toFixed(1)}`);
    
    // El arco con valor menor en el eje = rival (negativo), el otro = nuestro
    if(axis === 'x'){
      if(g0.x < g1.x){
        goalAreas[0].teamForGoal = 'us';
        goalAreas[1].teamForGoal = 'them';
      } else {
        goalAreas[0].teamForGoal = 'them';
        goalAreas[1].teamForGoal = 'us';
      }
    } else {
      if(g0.z < g1.z){
        goalAreas[0].teamForGoal = 'us';
        goalAreas[1].teamForGoal = 'them';
      } else {
        goalAreas[0].teamForGoal = 'them';
        goalAreas[1].teamForGoal = 'us';
      }
    }
    const usGoal = goalAreas.find(g=>g.teamForGoal==='us');
    const themGoal = goalAreas.find(g=>g.teamForGoal==='them');
    console.log(`[goals] 'us' (atacar) en (${usGoal.center.x.toFixed(1)}, ${usGoal.center.z.toFixed(1)})`);
    console.log(`[goals] 'them' (defender) en (${themGoal.center.x.toFixed(1)}, ${themGoal.center.z.toFixed(1)})`);
  } else {
    fieldAxis = 'z';
    if(goalAreas.length === 1){
      goalAreas[0].teamForGoal = 'us';
    }
    console.log(`[goals] WARNING: ${goalAreas.length} arcos detectados`);
  }
  
  console.log(`[court] ${courtRaycastMeshes.length} meshes raycast, ${courtNets.length} redes, ${goalAreas.length} arcos`);

  // === FIJAR LÍMITES AL CÉSPED REAL ===
  if(fieldMesh && fieldBB){
    const fInset = 0.5;  // los jugadores quedan apenas adentro del borde del césped
    fieldLimits = {
      minX: fieldBB.min.x + fInset,
      maxX: fieldBB.max.x - fInset,
      minZ: fieldBB.min.z + fInset,
      maxZ: fieldBB.max.z - fInset
    };
    const w = (fieldBB.max.x - fieldBB.min.x).toFixed(1);
    const d = (fieldBB.max.z - fieldBB.min.z).toFixed(1);
    console.log(`[field] CÉSPED detectado: "${fieldMesh.name}" (${w} x ${d}m) → límites:`, fieldLimits);

    // === ARCOS ===
    const fSizeX = fieldBB.max.x - fieldBB.min.x;
    const fSizeZ = fieldBB.max.z - fieldBB.min.z;
    const longAxis = (fSizeX > fSizeZ) ? 'x' : 'z';
    fieldAxis = longAxis;
    const shortLen = (longAxis === 'x') ? fSizeZ : fSizeX;
    const longLen = (longAxis === 'x') ? fSizeX : fSizeZ;
    const cxF = (fieldBB.min.x + fieldBB.max.x) / 2;
    const czF = (fieldBB.min.z + fieldBB.max.z) / 2;
    const fcMain = (longAxis === 'x') ? cxF : czF;
    const fcW = (longAxis === 'x') ? czF : cxF;
    const baseY = fieldBB.min.y;

    // Caja de arco a partir de la malla de red REAL (extendida hacia el campo)
    function goalFromNet(c, isLow){
      const bb = c.bb.clone();
      const depth = 1.8;   // extender hacia el campo para captar la pelota entrando
      if(longAxis === 'x'){ if(isLow) bb.max.x += depth; else bb.min.x -= depth; }
      else { if(isLow) bb.max.z += depth; else bb.min.z -= depth; }
      bb.expandByScalar(0.3);
      bb.min.y = Math.min(bb.min.y, baseY);
      bb.max.y = Math.max(bb.max.y, baseY + 2.5);
      const center = new THREE.Vector3(); bb.getCenter(center);
      return { teamForGoal: null, bbox: bb, center };
    }
    // Boca de arco derivada del césped (respaldo si no hay red)
    function makeGoal(cx, cz){
      const goalMouth = Math.min(7.3, shortLen * 0.5), goalH = 2.5, goalDepth = 3.2;
      const center = new THREE.Vector3(cx, baseY + goalH / 2, cz);
      const size = (longAxis === 'x') ? new THREE.Vector3(goalDepth, goalH, goalMouth)
                                      : new THREE.Vector3(goalMouth, goalH, goalDepth);
      return { teamForGoal: null, bbox: new THREE.Box3().setFromCenterAndSize(center, size), center };
    }

    // 1) Intentar arcos REALES desde las mallas de red del GLB (extremos + centradas en ancho)
    let low = null, high = null, lowS = -1e9, highS = -1e9;
    for(const c of netCandidates){
      const ctr = new THREE.Vector3(); c.bb.getCenter(ctr);
      const sz = new THREE.Vector3(); c.bb.getSize(sz);
      const cm = (longAxis === 'x') ? ctr.x : ctr.z;
      const cw = (longAxis === 'x') ? ctr.z : ctr.x;
      const widthSpan = (longAxis === 'x') ? sz.z : sz.x;
      const widthOff = Math.abs(cw - fcW);
      if(widthOff > shortLen * 0.45) continue;      // debe estar centrada en ancho
      if(widthSpan < 2.5) continue;                 // boca ancha (no un poste suelto)
      if(Math.abs(cm - fcMain) < longLen * 0.25) continue;  // debe estar en un extremo
      const score = widthSpan - widthOff * 0.5;
      if(cm < fcMain){ if(score > lowS){ lowS = score; low = c; } }
      else { if(score > highS){ highS = score; high = c; } }
    }

    let c0, c1;
    if(low && high){
      c0 = goalFromNet(low, true);
      c1 = goalFromNet(high, false);
      console.log('[goals] desde RED del GLB ✓');
    } else {
      // 2) Respaldo: arcos derivados del césped
      if(longAxis === 'x'){ c0 = makeGoal(fieldBB.min.x + 1.0, czF); c1 = makeGoal(fieldBB.max.x - 1.0, czF); }
      else { c0 = makeGoal(cxF, fieldBB.min.z + 1.0); c1 = makeGoal(cxF, fieldBB.max.z - 1.0); }
      console.log('[goals] DERIVADOS del césped (no se hallaron redes claras)');
    }
    const lowFirst = (longAxis === 'x') ? (c0.center.x < c1.center.x) : (c0.center.z < c1.center.z);
    c0.teamForGoal = lowFirst ? 'us' : 'them';
    c1.teamForGoal = lowFirst ? 'them' : 'us';
    goalAreas = [c0, c1];
    const gus = goalAreas.find(g => g.teamForGoal === 'us'), gth = goalAreas.find(g => g.teamForGoal === 'them');
    console.log(`[goals] eje ${longAxis} · us=(${gus.center.x.toFixed(1)},${gus.center.z.toFixed(1)}) them=(${gth.center.x.toFixed(1)},${gth.center.z.toFixed(1)})`);
    bakeHardcodedGoals();   // valores alineados a mano en DEV (definitivos)
    applySavedGoals();      // si reajustás los arcos en DEV, esos ganan
  } else {
    console.log('[field] no se detectó césped, usando bbox del estadio:', fieldLimits);
  }

  scene.add(courtModel);
  buildFieldFence();           // cerca alrededor de la cancha (tapa huecos de las entradas)
  optimizeScene(gfxQuality);   // baja texturas/mapas según la calidad elegida
  sampleGroundOnce();          // cachea la altura del piso (evita raycast por frame)
  cullStadium();               // oculta gradas/asientos/estructuras lejanas
  mergeVisibleStadium();       // fusiona lo visible → baja los draw calls
}

// === CERCA PERIMETRAL (procedural) — tapa los huecos de las entradas ===
let fenceGroup = null;
function fenceTexture(){
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  x.clearRect(0,0,64,64);
  x.strokeStyle = 'rgba(200,210,225,0.85)'; x.lineWidth = 3;
  for(let i=-64;i<=64;i+=16){ x.beginPath(); x.moveTo(i,0); x.lineTo(i+64,64); x.stroke();
    x.beginPath(); x.moveTo(i+64,0); x.lineTo(i,64); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function buildFieldFence(){
  if(!fieldLimits) return;
  if(fenceGroup){ scene.remove(fenceGroup); fenceGroup = null; }
  fenceGroup = new THREE.Group();
  const m = 1.6;   // cuánto afuera del borde de juego
  const minX = fieldLimits.minX - m, maxX = fieldLimits.maxX + m;
  const minZ = fieldLimits.minZ - m, maxZ = fieldLimits.maxZ + m;
  const y0 = (typeof fieldGroundY === 'number' ? fieldGroundY : 0);
  const H = 2.6;
  const tex = fenceTexture();
  const meshMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x9aa3b2, roughness: 0.6, metalness: 0.4 });
  const railMat = postMat;
  const sides = [
    { x1: minX, z1: minZ, x2: maxX, z2: minZ },
    { x1: minX, z1: maxZ, x2: maxX, z2: maxZ },
    { x1: minX, z1: minZ, x2: minX, z2: maxZ },
    { x1: maxX, z1: minZ, x2: maxX, z2: maxZ }
  ];
  for(const s of sides){
    const len = Math.hypot(s.x2 - s.x1, s.z2 - s.z1);
    const cx = (s.x1 + s.x2)/2, cz = (s.z1 + s.z2)/2;
    const ang = Math.atan2(s.z2 - s.z1, s.x2 - s.x1);
    // malla
    const g = new THREE.PlaneGeometry(len, H);
    tex.repeat.set(Math.max(1, Math.round(len/1.5)), Math.round(H/1.5));
    const mesh = new THREE.Mesh(g, meshMat.clone()); mesh.material.map = tex.clone(); mesh.material.map.needsUpdate = true;
    mesh.material.map.wrapS = mesh.material.map.wrapT = THREE.RepeatWrapping;
    mesh.material.map.repeat.set(Math.max(1, Math.round(len/1.5)), Math.round(H/1.5));
    mesh.position.set(cx, y0 + H/2, cz); mesh.rotation.y = -ang;
    fenceGroup.add(mesh);
    // riel superior
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, len, 6), railMat);
    rail.rotation.z = Math.PI/2; rail.rotation.y = -ang;
    rail.position.set(cx, y0 + H - 0.05, cz); fenceGroup.add(rail);
    // postes
    const n = Math.max(2, Math.round(len/3));
    for(let i=0;i<=n;i++){
      const t = i/n;
      const px = s.x1 + (s.x2 - s.x1)*t, pz = s.z1 + (s.z2 - s.z1)*t;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, H, 6), postMat);
      post.position.set(px, y0 + H/2, pz); fenceGroup.add(post);
    }
  }
  fenceGroup.traverse(o => { o.castShadow = false; o.receiveShadow = false; });
  scene.add(fenceGroup);
}

// Sistema de red con física verlet (simulación de hilos)
function createNetPhysics(originalMesh, bbox){
  // La red ocupa un plano. Detectar orientación (cuál es el eje delgado)
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  
  // Eje delgado = normal de la red
  let normalAxis = 'z';
  if(size.x < size.y && size.x < size.z) normalAxis = 'x';
  else if(size.z < size.y && size.z < size.x) normalAxis = 'z';
  // (la y siempre es la altura)
  
  // Dimensiones del plano de la red
  const netW = normalAxis === 'x' ? size.z : size.x;
  const netH = size.y;
  
  // Grid de partículas: cantidad razonable
  const cols = Math.max(6, Math.min(14, Math.floor(netW * 4)));
  const rows = Math.max(6, Math.min(14, Math.floor(netH * 5)));
  
  const particles = [];
  for(let r = 0; r < rows; r++){
    for(let c = 0; c < cols; c++){
      const fx = c / (cols - 1);
      const fy = r / (rows - 1);
      let px, py, pz;
      if(normalAxis === 'x'){
        px = center.x;
        py = bbox.min.y + fy * netH;
        pz = bbox.min.z + fx * netW;
      } else {
        px = bbox.min.x + fx * netW;
        py = bbox.min.y + fy * netH;
        pz = center.z;
      }
      particles.push({
        pos: new THREE.Vector3(px, py, pz),
        prev: new THREE.Vector3(px, py, pz),
        pinned: (r === rows - 1)  // fila superior fija (atada al travesaño)
      });
    }
  }
  
  // Constraints: conexiones entre partículas adyacentes
  const constraints = [];
  for(let r = 0; r < rows; r++){
    for(let c = 0; c < cols; c++){
      const idx = r * cols + c;
      // Conectar con vecino derecho
      if(c + 1 < cols){
        const a = particles[idx], b = particles[idx + 1];
        constraints.push({a, b, restLen: a.pos.distanceTo(b.pos)});
      }
      // Conectar con vecino abajo
      if(r + 1 < rows){
        const a = particles[idx], b = particles[idx + cols];
        constraints.push({a, b, restLen: a.pos.distanceTo(b.pos)});
      }
    }
  }
  
  // Crear visualización con LineSegments
  const lineGeo = new THREE.BufferGeometry();
  const linePositions = new Float32Array(constraints.length * 6);  // 2 vertices x 3 coords por línea
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lineMat = new THREE.LineBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.85});
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lines);
  
  return { particles, constraints, lines, normalAxis, cols, rows };
}

// Actualizar simulación de red (verlet integration)
function updateNets(dt){
  const gravity = -9.8;
  const damping = 0.99;
  
  for(const net of courtNets){
    // Integración verlet
    for(const p of net.particles){
      if(p.pinned) continue;
      const vx = (p.pos.x - p.prev.x) * damping;
      const vy = (p.pos.y - p.prev.y) * damping;
      const vz = (p.pos.z - p.prev.z) * damping;
      p.prev.copy(p.pos);
      p.pos.x += vx;
      p.pos.y += vy + gravity * dt * dt;
      p.pos.z += vz;
    }
    
    // Constraints (varias iteraciones)
    for(let iter = 0; iter < 4; iter++){
      for(const c of net.constraints){
        const dx = c.b.pos.x - c.a.pos.x;
        const dy = c.b.pos.y - c.a.pos.y;
        const dz = c.b.pos.z - c.a.pos.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 0.0001;
        const diff = (dist - c.restLen) / dist;
        const px = dx * 0.5 * diff;
        const py = dy * 0.5 * diff;
        const pz = dz * 0.5 * diff;
        if(!c.a.pinned){
          c.a.pos.x += px;
          c.a.pos.y += py;
          c.a.pos.z += pz;
        }
        if(!c.b.pinned){
          c.b.pos.x -= px;
          c.b.pos.y -= py;
          c.b.pos.z -= pz;
        }
      }
    }
    
    // Colisión con la pelota (empuja partículas hacia afuera)
    if(ballModel){
      const ballPos = ballModel.position;
      const ballRadius = 0.13;
      for(const p of net.particles){
        if(p.pinned) continue;
        const dx = p.pos.x - ballPos.x;
        const dy = p.pos.y - ballPos.y;
        const dz = p.pos.z - ballPos.z;
        const distSq = dx*dx + dy*dy + dz*dz;
        if(distSq < ballRadius * ballRadius){
          const dist = Math.sqrt(distSq) || 0.0001;
          const push = (ballRadius - dist) / dist;
          p.pos.x += dx * push;
          p.pos.y += dy * push;
          p.pos.z += dz * push;
        }
      }
    }
    
    // Update visual lines
    const positions = net.lines.geometry.attributes.position.array;
    let i = 0;
    for(const c of net.constraints){
      positions[i++] = c.a.pos.x; positions[i++] = c.a.pos.y; positions[i++] = c.a.pos.z;
      positions[i++] = c.b.pos.x; positions[i++] = c.b.pos.y; positions[i++] = c.b.pos.z;
    }
    net.lines.geometry.attributes.position.needsUpdate = true;
  }
}

// ============================================================
// IA DE NPCS + POSESIÓN DE PELOTA + GOLES
// ============================================================

// Devuelve todos los jugadores en el campo (player + teammates + rivals)
function getAllPlayers(){
  const all = [];
  if(player) all.push(player);
  for(const t of teammates) all.push(t);
  for(const r of rivals) all.push(r);
  return all;
}

// === CAMBIO DE JUGADOR CONTROLADO ===
// Convierte al jugador controlado en otro de tu equipo (y el anterior pasa a ser NPC).
function switchControlTo(target){
  if(!target || target === player || target.team !== 'us') return;
  if(player){
    player.isPlayer = false;
    if(!player.isKeeper) teammates.push(player);  // los arqueros NO pasan a ser de campo
  }
  const i = teammates.indexOf(target);
  if(i >= 0) teammates.splice(i, 1);
  player = target;
  player.isPlayer = true;
  player._fLast = null;
  cameraMode = 'player';
  camSwitchT = 1.0;   // transición suave: evita el "corte de escena" al recibir el pase
}
// Ciclar control entre los jugadores de campo de tu equipo (botón PASE sin pelota)
function cycleControl(){
  const squad = [player, ...teammates].filter(e => e && e.team === 'us' && !e.isKeeper);
  if(squad.length < 2) return;
  const cur = (player._ctrlIndex !== undefined) ? player._ctrlIndex : 0;
  const n = squad.length;
  let next = null, best = 99;
  for(const e of squad){
    if(e === player) continue;
    const idx = (e._ctrlIndex !== undefined) ? e._ctrlIndex : 0;
    const delta = ((idx - cur) % n + n) % n;
    if(delta > 0 && delta < best){ best = delta; next = e; }
  }
  if(next) switchControlTo(next);
}
// Botón PASE: con pelota = pase; sin pelota = cambiar de jugador
function switchToNearestBall(){
  if(!ballModel){ cycleControl(); return; }
  const pool = [player, ...teammates].filter(e => e && e.root && e.team === 'us' && !e.isKeeper);
  let best = null, bd = 1e9;
  for(const e of pool){ const d = e.root.position.distanceTo(ballModel.position); if(d < bd){ bd = d; best = e; } }
  if(best && best !== player) switchControlTo(best);
}
// El compañero más ATRASADO (hacia nuestro arco) — para el saque del centro
function pickBackwardReceiver(){
  if(!player || !player.root || !ourGoalPos) return null;
  let best = null, bestD = 1e9;
  for(const tm of teammates){
    if(!tm || !tm.root || tm.isKeeper) continue;
    const d = tm.root.position.distanceTo(ourGoalPos);   // más cerca de nuestro arco = más atrás
    if(d < bestD){ bestD = d; best = tm; }
  }
  return best;
}
function pickPassReceiver(){
  if(!player || !player.root) return null;
  const rot = player.root.rotation.y;
  const fx = -Math.sin(rot), fz = -Math.cos(rot);   // hacia donde mira el jugador
  let best = null, bestScore = -1, fallback = null, fbD = 1e9;
  for(const tm of teammates){
    if(!tm || !tm.root || tm.isKeeper) continue;
    const dx = tm.root.position.x - player.root.position.x, dz = tm.root.position.z - player.root.position.z;
    const d = Math.hypot(dx, dz); if(d < 0.5) continue;
    if(d < fbD){ fbD = d; fallback = tm; }
    const dot = (dx * fx + dz * fz) / (d || 1);
    if(dot > 0.2 && d < 26){ const score = dot - d * 0.012; if(score > bestScore){ bestScore = score; best = tm; } }
  }
  return best || fallback;
}
function isOffsidePosition(rec){
  if(!rec || !rec.root || !theirGoalPos || !ballModel) return false;
  const gp = theirGoalPos;
  const recD = rec.root.position.distanceTo(gp);
  if(recD >= ballModel.position.distanceTo(gp)) return false;     // no está más adelante que la pelota
  if(recD >= getFieldCenter().distanceTo(gp)) return false;       // tiene que estar en campo rival
  let minRival = 1e9;
  for(const r of rivals){ if(r.root) minRival = Math.min(minRival, r.root.position.distanceTo(gp)); }
  for(const gk of goalkeepers){ if(gk.team === 'them' && gk.root) minRival = Math.min(minRival, gk.root.position.distanceTo(gp)); }
  return recD < minRival - 0.5;                                   // más adelantado que toda la defensa = offside claro
}
function flagOffside(pos){
  showFoulBanner(t('🚩 OFFSIDE · Tiro libre rival'), 2200);
  playWhistle();
  awardFreeKick('them', pos);
}
function passOrSwitch(pwr){
  pwr = pwr || 1;
  // SAQUES con apuntado: PASE pasa al apuntado (arco) o lanza (lateral/esquina)
  if(setPiece && setPiece.aim && setPiece.team === 'us'){
    // esperar a que todos terminen de formarse antes de permitir el saque
    const arranging = [player, ...teammates, ...rivals].some(e => e && e.root && e._walkTo && e !== setPiece.taker);
    if(arranging){
      showFoulBanner(LANG === 'en' ? 'Wait — players getting in position…' : 'Esperá — acomodándose…', 700);
      return;
    }
    if(setPiece.type === 'goalkick') goalKickPass(); else throwBall();
    return;
  }
  if(kickoffActive){
    const hasMates = teammates.some(tm => tm && tm.root && !tm.isKeeper);
    if(!hasMates){
      // 1v1 (START): solo poné la pelota en juego, te queda a vos
      kickoffActive = false;
      setStartLabel(false);
      showFoulBanner(LANG === 'en' ? 'Go!' : '¡A jugar!', 900);
      return;
    }
    // con equipo: el saque del centro SÍ o SÍ va a un compañero ATRASADO
    if(ballOwner === player){
      const back = pickBackwardReceiver();
      if(back){
        passReceiver = back; passInFlight = true; passTimer = 0;
        npcPassTo(player, back);   // pase directo y guiado al de atrás
      } else {
        kickBall(7);
      }
    }
    kickoffActive = false;
    return;
  }
  if(setPiece && setPiece.team === 'us'){
    if(ballOwner === player) kickBall(setPiece.type === 'penalty' ? 14 : 7);
    if(setPiece.type !== 'penalty') setPiece = null;
    return;
  }
  if(ballOwner === player){
    // GIRAR según el joystick: el pase sale hacia donde apuntás. Si el joystick está
    // activo en una dirección, el jugador se orienta ahí; si no, dirección aleatoria.
    const jvx = joystickState.vx || 0, jvy = joystickState.vy || 0;
    const jmag = Math.hypot(jvx, jvy);
    if(jmag > 0.2){
      // input del joystick a dirección de mundo (relativo a la cámara broadcast)
      const cy = Math.cos(cameraOrbit.yaw), sy = Math.sin(cameraOrbit.yaw);
      const wx = jvx * cy + jvy * sy;
      const wz = -jvx * sy + jvy * cy;
      const wl = Math.hypot(wx, wz) || 1;
      // el jugador mira hacia (wx,wz): rotación con la convención del juego
      player.root.rotation.y = Math.atan2(-(wx/wl), -(wz/wl));
    } else {
      // sin joystick: dirección aleatoria (hacia adelante con dispersión)
      player.root.rotation.y += (Math.random() - 0.5) * Math.PI;   // gira al azar antes de pasar
    }
    passReceiver = pickPassReceiver();
    passOffside = isOffsidePosition(passReceiver);   // ¿el que va a recibir está en offside?
    passInFlight = true; passTimer = 0;
    kickBall(7);   // 7 = marca de PASE (power < 10); la potencia real se calcula por distancia
    // ESTILO FIFA: la cámara sigue la PELOTA mientras viaja; el control pasa al receptor
    // recién cuando la recibe (lo maneja el loop al detectar ballOwner === compañero).
    cameraMode = 'ball'; cameraBallTimer = 3.0;
  }
  else switchToNearestBall();
}

// Mover un NPC hacia un target (pos en mundo) con velocidad dada
// Actualiza rotación y posición. Devuelve true si llegó.
function moveNPCTowards(npc, targetPos, speed, dt){
  if(!npc.root) return false;
  speed = speed * 0.64;   // ritmo global más lento aún (pausado, realista)
  const dx = targetPos.x - npc.root.position.x;
  const dz = targetPos.z - npc.root.position.z;
  const dist = Math.hypot(dx, dz);
  if(dist < 0.3) return true;  // ya llegó
  
  const dirX = dx / dist;
  const dirZ = dz / dist;
  
  // Rotación hacia target (con compensación PI para clips CMU)
  const targetRot = Math.atan2(dirX, dirZ) + Math.PI;
  let cur = npc.root.rotation.y;
  let diff = targetRot - cur;
  while(diff > Math.PI) diff -= Math.PI*2;
  while(diff < -Math.PI) diff += Math.PI*2;
  npc.root.rotation.y = cur + diff * Math.min(1, 8 * dt);
  
  // Mover
  const stepDist = Math.min(dist, speed * dt);
  const newX = npc.root.position.x + dirX * stepDist;
  const newZ = npc.root.position.z + dirZ * stepDist;
  if(canMoveTo(newX, newZ)){
    npc.root.position.x = newX;
    npc.root.position.z = newZ;
  }
  
  // Ajustar Y al suelo
  const groundY = getGroundHeight(newX, newZ);
  npc.root.position.y = groundY;
  
  return false;
}

// Actualiza la IA de los compañeros del jugador
// Comportamiento: si tienen la pelota, van al arco rival; sino, se mantienen abiertos
function updateTeammates(dt){
  for(const tm of teammates){
    tm.aiTimer -= dt;
    
    if(ballOwner === tm){
      // CON pelota: ir hacia el arco rival
      const goal = goalAreas.find(g => g.teamForGoal === 'us');
      if(goal){
        tm.aiTarget.copy(goal.center);
      } else {
        tm.aiTarget.set(0, 0, -15);  // fallback
      }
      const reached = moveNPCTowards(tm, tm.aiTarget, 4.0, dt);
      playerSetAnim(tm, 'run', 1.1);
      // Si está cerca del arco, patear
      if(reached || tm.root.position.distanceTo(tm.aiTarget) < 5){
        npcKick(tm, 14);
      }
    } else {
      // SIN pelota: posicionarse abierto cerca del jugador (si tiene la pelota)
      // o cubrir áreas si no hay nadie con la pelota
      if(tm.aiTimer <= 0){
        // Cambiar target cada 2-4 segundos
        tm.aiTimer = 2 + Math.random() * 2;
        if(ballOwner === player){
          // Posicionarse a un lado del jugador, adelantado
          const side = (teammates.indexOf(tm) === 0) ? -1 : 1;
          tm.aiTarget.set(
            player.root.position.x + side * 5,
            0,
            player.root.position.z - 5 - Math.random() * 3
          );
        } else {
          // Random walk en el campo medio
          tm.aiTarget.set(
            (Math.random() - 0.5) * 18,
            0,
            -8 + (Math.random() - 0.5) * 10
          );
        }
      }
      const reached = moveNPCTowards(tm, tm.aiTarget, 2.8, dt);
      if(reached){
        playerSetAnim(tm, 'idle');
      } else {
        playerSetAnim(tm, 'walk', 1.0);
      }
    }
  }
}

// IA de rivales: ir por la pelota o defender
function updateRivals(dt){
  for(const r of rivals){
    r.aiTimer -= dt;
    
    if(ballOwner === r){
      // CON pelota: ir hacia NUESTRO arco
      const goal = goalAreas.find(g => g.teamForGoal === 'them');
      if(goal){
        r.aiTarget.copy(goal.center);
      } else {
        r.aiTarget.set(0, 0, 15);
      }
      const reached = moveNPCTowards(r, r.aiTarget, 4.0, dt);
      playerSetAnim(r, 'run', 1.1);
      if(reached || r.root.position.distanceTo(r.aiTarget) < 5){
        npcKick(r, 14);
      }
    } else {
      // SIN pelota: ir hacia el dueño de la pelota (intentar quitársela)
      // o ir a la pelota si está libre
      let targetPos;
      if(ballOwner && ballOwner !== r){
        // Ir hacia el dueño actual
        targetPos = ballOwner.root.position;
      } else if(ballModel){
        // Pelota suelta → ir hacia ella
        targetPos = ballModel.position;
      } else {
        targetPos = new THREE.Vector3(0,0,0);
      }
      r.aiTarget.copy(targetPos);
      const reached = moveNPCTowards(r, r.aiTarget, 3.5, dt);
      playerSetAnim(r, 'run', 1.0);
      
      // Si está MUY cerca del dueño de la pelota (y no es él), intentar quitársela
      if(ballOwner && ballOwner !== r){
        const d = r.root.position.distanceTo(ballOwner.root.position);
        if(d < 1.0){
          // Probabilidad de éxito por tick
          if(Math.random() < dt * 1.5){
            ballOwner = r; lastTouchTeam = "them";  // ¡robó la pelota!
            console.log('[ball] robada por rival');
          }
        }
      } else if(!ballOwner && ballModel){
        // Pelota libre, agarrarla si está cerca
        const d = r.root.position.distanceTo(ballModel.position);
        if(d < 0.9){
          ballOwner = r; lastTouchTeam = "them";
          ballVelocity.set(0, 0, 0);
        }
      }
    }
  }
}

// Hacer que un NPC patee la pelota
function npcKick(npc, power){
  if(ballOwner !== npc || !ballModel) return;
  if(npc.kickCooldown && npc.kickCooldown > 0) return;
  sfxKick();
  playerSetAnim(npc, 'kick', 1.6);
  npc.kickCooldown = 1.0;
  
  // Dirección: hacia el arco objetivo
  const goalKey = (npc.team === 'us') ? 'us' : 'them';
  const goal = goalAreas.find(g => g.teamForGoal === goalKey);
  let tx, tz;
  if(goal){
    tx = goal.center.x;
    tz = goal.center.z;
  } else {
    // Fallback: forward del NPC
    const a = npc.root.rotation.y;
    tx = npc.root.position.x + Math.sin(a) * 5;
    tz = npc.root.position.z + Math.cos(a) * 5;
  }
  const dx = tx - npc.root.position.x;
  const dz = tz - npc.root.position.z;
  const len = Math.hypot(dx, dz) || 1;
  let fx = dx / len;
  let fz = dz / len;
  // Desvío: los TIROS al arco PUEDEN fallar (no son perfectos)
  const miss = (Math.random() - 0.5) * 0.30;   // ±~17% lateral
  const px = -fz, pz = fx;
  fx += px * miss; fz += pz * miss;
  const nl = Math.hypot(fx, fz) || 1; fx /= nl; fz /= nl;
  
  setTimeout(() => {
    if(!ballModel) return;
    ballOwner = null;
    lastKicker = npc; lastKickerTimer = 0.5;
    lastTouchTeam = npc.team;
    ballVelocity.set(fx * power, 2.4, fz * power);
  }, 200);
}

// Decrementar cooldowns de NPCs
function updateNPCCooldowns(dt){
  for(const list of [teammates, rivals]){
    for(const npc of list){
      if(npc.kickCooldown) npc.kickCooldown = Math.max(0, npc.kickCooldown - dt);
    }
  }
}

// Sistema de posesión: la pelota se pega al pie del dueño
function updateBallPossession(dt){
  if(!ballModel || !ballOwner) return;
  if(!ballOwner.root) return;
  
  // Forward del jugador en mundo
  // El root tiene rotation Y. El cuerpo visual del jugador "mira" hacia donde se mueve
  // por la convención del código (atan2(_moveDir.x, _moveDir.z) + PI compensa los clips CMU)
  // Por lo tanto cuando _moveDir = (0,0,-1) y root.rotation.y = 0,
  // el forward visual del personaje es -Z = (0, 0, -1)
  // Equivalente: forward = (-sin(rotY), 0, -cos(rotY))
  const angle = ballOwner.root.rotation.y;
  const fx = -Math.sin(angle);
  const fz = -Math.cos(angle);
  // Right = forward rotado 90° clockwise (visto desde arriba)
  const rx = -fz;
  const rz = fx;
  
  // Pelota un poquito a la derecha + ADELANTE del pie (siempre delante en la dirección de movimiento)
  const offsetRight = 0.18;
  const offsetForward = 0.6;  // más adelante para que se vea bien delante
  const targetX = ballOwner.root.position.x + rx * offsetRight + fx * offsetForward;
  const targetZ = ballOwner.root.position.z + rz * offsetRight + fz * offsetForward;
  const targetY = getGroundHeight(targetX, targetZ) + 0.11;
  
  // Lerp RÁPIDO para que la pelota siga al pie sin quedarse atrás
  const lerpFactor = 1 - Math.pow(0.00001, dt);  // muy rápido (~prácticamente instantáneo)
  ballModel.position.x += (targetX - ballModel.position.x) * lerpFactor;
  ballModel.position.y += (targetY - ballModel.position.y) * lerpFactor;
  ballModel.position.z += (targetZ - ballModel.position.z) * lerpFactor;
  
  ballVelocity.set(0, 0, 0);
  
  // Rotar la pelota como si rodara (basado en velocidad del dueño)
  if(ballOwner.lastPos){
    const dx = ballOwner.root.position.x - ballOwner.lastPos.x;
    const dz = ballOwner.root.position.z - ballOwner.lastPos.z;
    const spd = Math.hypot(dx, dz) / Math.max(dt, 0.001);
    if(spd > 0.1){
      const axis = new THREE.Vector3(dz, 0, -dx).normalize();
      ballModel.rotateOnWorldAxis(axis, spd * dt / 0.11);
    }
  }
  if(!ballOwner.lastPos) ballOwner.lastPos = new THREE.Vector3();
  ballOwner.lastPos.copy(ballOwner.root.position);
}

// Detectar si el jugador o cualquier NPC puede recoger la pelota
function updateBallPickup(dt){
  if(!ballModel || ballOwner) return;  // ya hay dueño
  if(freeKickPause > 0) return;        // pelota quieta durante tiro libre

  // PASE GUIADO en curso: SOLO el receptor previsto la toma (nadie la intercepta → no falla)
  if(ballHomingTarget && ballHomingTarget.root){
    const dh = ballHomingTarget.root.position.distanceTo(ballModel.position);
    if(dh < 1.2){
      ballOwner = ballHomingTarget; lastTouchTeam = ballHomingTarget.team;
      ballVelocity.set(0, 0, 0); ballHomingTarget = null;
    }
    return;
  }

  // EL JUGADOR agarra al contacto SIEMPRE (no importa la velocidad de la pelota)
  if(player && player.root && !(lastKicker === player && lastKickerTimer > 0)){
    const dp = player.root.position.distanceTo(ballModel.position);
    if(dp < 0.85){
      ballOwner = player;
      lastTouchTeam = 'us';
      ballVelocity.set(0, 0, 0);
      return;
    }
  }

  // Los demás reciben muy bien: atrapan aunque venga algo fuerte y con buen alcance (súper entrenados)
  const ballSpeed = Math.hypot(ballVelocity.x, ballVelocity.y, ballVelocity.z);
  if(ballSpeed > 11) return;
  for(const e of getAllPlayers()){
    if(e === player) continue;
    if(lastKicker === e && lastKickerTimer > 0) continue;   // el que pateó no la re-agarra al toque
    const d = e.root.position.distanceTo(ballModel.position);
    if(d < 1.05){
      ballOwner = e;
      lastTouchTeam = e.team;
      ballVelocity.set(0, 0, 0);
      return;
    }
  }
}

// Detectar goles
function updateGoals(dt){
  if(!ballModel || fieldTut) return;
  if(freeKickPause > 0) return;  // sin goles durante el tiro libre
  if(ballHomingTarget) return;   // un pase guiado nunca cuenta como gol
  goalCooldown = Math.max(0, goalCooldown - dt);
  if(goalCooldown > 0) return;
  if(ballOwner) return;   // solo es gol con la pelota suelta/disparada (evita autogoles al cargarla)
  
  const FC = getFieldCenter();
  for(const g of goalAreas){
    // caja de prueba: la del arco, extendida hacia el campo en el eje largo
    // (capta tiros rápidos sin cambiar el cubo visible ni el ancho del arquero)
    const tb = g.bbox.clone();
    if(fieldAxis === 'z'){
      if(g.center.z < FC.z) tb.max.z += 1.4; else tb.min.z -= 1.4;
    } else {
      if(g.center.x < FC.x) tb.max.x += 1.4; else tb.min.x -= 1.4;
    }
    if(!tb.containsPoint(ballModel.position)) continue;
    // ANTI-AUTOGOL DEL ARQUERO: si el último que la pateó es el arquero del equipo al que le harían
    // el gol (la metió en su propio arco), NO cuenta. Se la devolvemos para que vuelva a sacar.
    const concededTeam = (g.teamForGoal === 'us') ? 'them' : 'us';
    if(lastKicker && lastKicker.isKeeper && lastKicker.team === concededTeam){
      const gk = lastKicker;
      ballOwner = gk; lastTouchTeam = gk.team; ballHomingTarget = null;
      if(ballModel) ballModel.position.copy(gk.root.position);
      ballVelocity.set(0, 0, 0); gk.gkSaveCD = 1.0; goalCooldown = 0.6;
      console.log('[goal] autogol del arquero ANULADO');
      setTimeout(() => keeperDistribute(gk), 600);
      break;
    }
    if(g.teamForGoal === 'us'){ scoreUs++; console.log('[GOAL] equipo del jugador!', scoreUs, '-', scoreThem); try{ if(window.quest) window.quest('goals',1); }catch(e){} }
    else { scoreThem++; console.log('[GOAL] rivales!', scoreUs, '-', scoreThem); }
    // Festejo nuclear + cámara lenta + "GOL", luego saque del centro
    ballOwner = null;
    if(ballModel) ballModel.position.copy(getFieldCenter());
    ballVelocity.set(0, 0, 0);
    goalCooldown = 1;
    triggerGoalCelebration(g.center.clone(), g.teamForGoal);
    updateScoreboard();
    break;
  }
}

// Saque de arco tras gol: el arquero del equipo que recibió el gol pone la pelota en juego.
// Si es TU arquero, lo controlás vos y decidís el pase; si es rival, saca solo.
// El arquero SIEMPRE saca jugando: pase directo al compañero más conveniente de SU equipo
function keeperDistribute(gk){
  if(!gk || !gk.root || ballOwner !== gk) return;
  // Saque de arco: el equipo rival al arquero se ALEJA siempre (incluido el player si saca el rival)
  const myGoal = goalAreas.find(a => a.teamForGoal !== gk.team);
  if(myGoal) retreatBehindLine(gk.team === 'us' ? 'them' : 'us', myGoal.center);
  const mates = (gk.team === 'us')
    ? [player, ...teammates].filter(e => e && e.root && e !== gk && !e.isKeeper)
    : rivals.filter(r => r && r.root && r !== gk && !r.isKeeper);
  if(!mates.length){ ballOwner = null; ballVelocity.set(0, 4, 0); return; }
  const oppList = ((gk.team === 'us') ? rivals : [player, ...teammates]).filter(o => o && o.root);
  const attackGoal = (gk.team === 'us') ? theirGoalPos : ourGoalPos;

  // ARQUERO DECISIVO: puntúa cada compañero por seguridad del pase + distancia ideal.
  const IDEAL = 13;        // distancia ideal de entrega (ni pegado ni pelotazo)
  let best = null, bestScore = -1e9;
  for(const m of mates){
    const d = m.root.position.distanceTo(gk.root.position);
    if(d < 4) continue;                                   // demasiado pegado: no
    // 1) ¿la LÍNEA de pase está limpia? (clave: no que el receptor esté solo, sino que no lo intercepten)
    const lineClean = (typeof passIsSafe === 'function')
      ? passIsSafe(gk.root.position, m.root.position, oppList, 1.7) : true;
    // 2) rival más cercano al receptor (que pueda presionarlo al recibir)
    let nearOpp = 1e9;
    for(const o of oppList){ const od = o.root.position.distanceTo(m.root.position); if(od < nearOpp) nearOpp = od; }
    // 3) penalizar alejarse de la distancia ideal (en vez de premiar lo más lejos)
    const distPenalty = Math.abs(d - IDEAL);
    // 4) bonus leve por ganar terreno hacia el arco rival (salir jugando hacia adelante)
    let progress = 0;
    if(attackGoal){
      progress = gk.root.position.distanceTo(attackGoal) - m.root.position.distanceTo(attackGoal);
    }
    let score = 0;
    score += lineClean ? 40 : -50;        // lo más importante: que no la intercepten
    score += Math.min(nearOpp, 8) * 2.5;  // receptor con espacio para recibir
    score -= distPenalty * 1.4;           // cerca de la distancia ideal
    score += Math.max(-4, Math.min(6, progress)) * 1.2;   // un poco hacia adelante, sin exagerar
    if(score > bestScore){ bestScore = score; best = m; }
  }
  if(!best) best = mates[0];
  npcPassTo(gk, best);
}
function setupGoalKick(g){
  if(matchOver || !player || !ballModel || goalkeepers.length === 0) return;
  const concededTeam = (g.teamForGoal === 'us') ? 'them' : 'us';
  const gk = goalkeepers.find(k => k.team === concededTeam && k.root);
  if(!gk){ ballOwner = null; ballModel.position.set(0, 0.11, 0); ballVelocity.set(0, 0, 0); return; }
  ballOwner = gk; lastTouchTeam = gk.team;
  ballVelocity.set(0, 0, 0);
  gk.gkSaveCD = 3.0;
  showFoulBanner(t('Saque de arco'), 1400);
  // SIEMPRE pasa directo a un compañero (los dos arqueros)
  setTimeout(() => keeperDistribute(gk), 900);
}

async function loadBall(){
  console.log('[ball] descargando GLB...');
  setLoadProgress(40);
  const loader = new GLTFLoader();
  const gltf = await new Promise((rs, rj) => {
    loader.load(BALL_URL, rs, undefined, rj);
  });
  ballModel = gltf.scene;
  
  // Escalar la pelota a tamaño realista (radio ~0.11m)
  const box = new THREE.Box3().setFromObject(ballModel);
  const size = new THREE.Vector3();
  box.getSize(size);
  const targetSize = 0.19;
  const scale = targetSize / Math.max(size.x, size.y, size.z);
  ballModel.scale.setScalar(scale);
  
  ballModel.position.set(0, 0.095, 0);  // centro de la cancha
  
  ballModel.traverse(o => {
    if(o.isMesh){ o.castShadow = true; o.receiveShadow = true; }
  });
  
  scene.add(ballModel);
  console.log('[ball] OK');
}

// === BOSQUE PROCEDURAL ===
function buildForest(){
  // Piso de pasto extenso (debajo y alrededor de la cancha)
  const grassCanvas = document.createElement('canvas');
  grassCanvas.width = 256; grassCanvas.height = 256;
  const gc = grassCanvas.getContext('2d');
  // Base verde clara saturada
  gc.fillStyle = '#5aa838';
  gc.fillRect(0,0,256,256);
  // Manchas con variación
  for(let i=0;i<500;i++){
    const x = Math.random()*256, y = Math.random()*256;
    const r = 1 + Math.random()*3;
    const c = ['#6ec048','#4a9028','#7acc50','#5aa838','#82d058'][Math.floor(Math.random()*5)];
    gc.fillStyle = c;
    gc.fillRect(x, y, r, r);
  }
  // Hojitas más oscuras (sombras de pasto)
  for(let i=0;i<150;i++){
    const x = Math.random()*256, y = Math.random()*256;
    gc.fillStyle = '#3a7820';
    gc.fillRect(x, y, 1.5, 1.5);
  }
  const grassTex = new THREE.CanvasTexture(grassCanvas);
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
  grassTex.repeat.set(30, 30);
  grassTex.colorSpace = THREE.SRGBColorSpace;
  
  // Piso plano en la zona central (donde está la cancha y bosque cercano)
  // El terreno con elevaciones se agrega después y cubre el resto
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 90),
    new THREE.MeshStandardMaterial({map: grassTex, roughness: 0.95})
  );
  ground.rotation.x = -Math.PI/2;
  ground.position.y = -0.02;  // ligeramente por debajo del terreno para evitar z-fighting
  ground.receiveShadow = true;
  scene.add(ground);
  
  // Árboles low-poly alrededor de la cancha (sin atravesarla)
  // Padding: distancia mínima desde el borde de la cancha
  const courtPad = 4;
  const minX = courtBounds.min.x - courtPad;
  const maxX = courtBounds.max.x + courtPad;
  const minZ = courtBounds.min.z - courtPad;
  const maxZ = courtBounds.max.z + courtPad;
  
  // Generar 60 árboles en un anillo alrededor (entre cancha+pad y radio 60)
  const treeCount = 80;
  let attempts = 0;
  while(trees.length < treeCount && attempts < 500){
    attempts++;
    // Posición random en un cuadrado grande, descartar si cae dentro o muy cerca de la cancha
    const x = (Math.random() - 0.5) * 110;
    const z = (Math.random() - 0.5) * 110;
    
    // Skip si está dentro del bbox extendido de la cancha
    if(x > minX && x < maxX && z > minZ && z < maxZ) continue;
    
    // Skip si está muy cerca de otro árbol
    const minDist = 2.5;
    let tooClose = false;
    for(const t of trees){
      const dx = x - t.pos.x, dz = z - t.pos.z;
      if(dx*dx + dz*dz < minDist*minDist){ tooClose = true; break; }
    }
    if(tooClose) continue;
    
    // Crear árbol procedural
    const tree = makeTree();
    tree.position.set(x, 0, z);
    // Rotación random + escala leve
    tree.rotation.y = Math.random() * Math.PI * 2;
    const s = 0.85 + Math.random() * 0.4;
    tree.scale.setScalar(s);
    scene.add(tree);
    
    // Guardar para colisión (radio aproximado del tronco + un poco)
    trees.push({pos: new THREE.Vector2(x, z), radius: 0.7 * s});
  }
  console.log('[forest]', trees.length, 'árboles');
  
  // Algunas piedras decorativas
  for(let i=0;i<25;i++){
    const x = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;
    if(x > minX-2 && x < maxX+2 && z > minZ-2 && z < maxZ+2) continue;
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.3 + Math.random()*0.4, 0),
      new THREE.MeshStandardMaterial({color:0x6a6a70, roughness:0.9, flatShading:true})
    );
    rock.position.set(x, 0.1, z);
    rock.rotation.set(Math.random()*0.5, Math.random()*Math.PI*2, Math.random()*0.5);
    rock.castShadow = false;
    rock.receiveShadow = true;
    scene.add(rock);
  }
  
  // === TERRENO CON MONTAÑAS (elevaciones del suelo) ===
  // En vez de conos sueltos, hacemos un plano gigante con vértices elevados
  // alrededor del bosque, dejando una zona plana para la cancha
  
  // Picos de montañas: posiciones + alturas
  const peaks = [];
  const peakCount = 22;
  for(let i=0;i<peakCount;i++){
    const angle = (i / peakCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const dist = 80 + Math.random() * 30;  // anillo de 80-110m
    peaks.push({
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      height: 14 + Math.random() * 18,  // 14-32m de altura
      radius: 22 + Math.random() * 12   // radio de influencia
    });
  }
  
  // Terreno: plano subdividido grande (220×220, ~80×80 segmentos)
  const terrainSize = 220;
  const terrainSegs = 80;
  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegs, terrainSegs);
  
  // Zona plana protegida (donde está la cancha + bosque cercano)
  const flatRadius = 45;  // dentro de 45m del centro, suelo plano
  
  const tpos = terrainGeo.attributes.position;
  for(let i=0;i<tpos.count;i++){
    const px = tpos.getX(i);  // antes de rotar es X
    const py = tpos.getY(i);  // antes de rotar Y = futuro Z
    
    // Distancia al centro
    const distToCenter = Math.hypot(px, py);
    
    // Falloff: 0 dentro del flatRadius, sube hasta 1 más allá
    const falloff = Math.max(0, Math.min(1, (distToCenter - flatRadius) / 25));
    
    if(falloff <= 0){
      tpos.setZ(i, 0);
      continue;
    }
    
    // Sumar contribución de cada pico (gaussiana suave)
    let h = 0;
    for(const pk of peaks){
      const dx = px - pk.x;
      const dz = py - pk.z;
      const d = Math.hypot(dx, dz);
      if(d < pk.radius){
        // Función suave: cos²
        const t = d / pk.radius;
        const w = Math.cos(t * Math.PI * 0.5);
        h += pk.height * w * w;
      }
    }
    
    // Ruido extra para irregularidad
    const noise = (Math.sin(px * 0.3) * Math.cos(py * 0.25) + Math.sin(px * 0.7 + 1.5) * Math.cos(py * 0.5 + 2)) * 0.6;
    h += noise * falloff;
    
    // Aplicar falloff para que la transición sea suave (no salto desde plano)
    h *= falloff;
    
    tpos.setZ(i, h);
  }
  tpos.needsUpdate = true;
  terrainGeo.computeVertexNormals();
  
  // Material - vertex colors para nevar las cumbres
  const colors = new Float32Array(tpos.count * 3);
  const cGrass = new THREE.Color(0x5aa838);      // verde claro saturado
  const cGrass2 = new THREE.Color(0x6ec048);     // verde lima más brillante
  const cRock = new THREE.Color(0x9a8870);       // roca tipo tierra cálida
  const cRockDark = new THREE.Color(0x6a5a4a);   // roca más oscura
  const cSnow = new THREE.Color(0xffffff);       // nieve pura
  for(let i=0;i<tpos.count;i++){
    const h = tpos.getZ(i);
    let c;
    if(h < 0.5){
      // Ruido en color de pasto
      c = (Math.sin(tpos.getX(i)*0.5) * Math.cos(tpos.getY(i)*0.5)) > 0 ? cGrass2 : cGrass;
    } else if(h < 6){
      // Transición pasto a roca clara
      const t = (h - 0.5) / 5.5;
      c = cGrass.clone().lerp(cRock, t);
    } else if(h < 14){
      // Roca clara → roca oscura
      const t = (h - 6) / 8;
      c = cRock.clone().lerp(cRockDark, t);
    } else if(h < 20){
      // Roca oscura → nieve
      const t = (h - 14) / 6;
      c = cRockDark.clone().lerp(cSnow, t);
    } else {
      c = cSnow;
    }
    colors[i*3] = c.r;
    colors[i*3+1] = c.g;
    colors[i*3+2] = c.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    flatShading: true  // low-poly look
  });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.rotation.x = -Math.PI/2;
  terrain.receiveShadow = true;
  scene.add(terrain);
  
  console.log('[terrain]', peakCount, 'montañas como elevaciones');
}

function makeTree(){
  const tree = new THREE.Group();
  
  // Tronco - cilindro low-poly
  const trunkHeight = 2.5 + Math.random() * 1.5;
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, trunkHeight, 6);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x4a2e1a, roughness: 0.95, flatShading: true
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = trunkHeight/2;
  trunk.castShadow = false;
  trunk.receiveShadow = true;
  tree.add(trunk);
  
  // Follaje - 2-3 esferas low-poly apiladas
  const foliageColor = [0x5aa838, 0x6ec048, 0x82d058, 0x4a9028][Math.floor(Math.random()*4)];
  const foliageMat = new THREE.MeshStandardMaterial({
    color: foliageColor, roughness: 0.9, flatShading: true
  });
  
  const layers = 2 + Math.floor(Math.random()*2);
  for(let i=0;i<layers;i++){
    const r = 1.1 - i*0.2 + Math.random()*0.2;
    const foliage = new THREE.Mesh(
      new THREE.IcosahedronGeometry(r, 0),
      foliageMat
    );
    foliage.position.y = trunkHeight + i*0.7 + r*0.3;
    foliage.position.x = (Math.random() - 0.5) * 0.3;
    foliage.position.z = (Math.random() - 0.5) * 0.3;
    foliage.castShadow = false;
    tree.add(foliage);
  }
  
  return tree;
}

// ============================================================
// PERSONAJE PROCEDURAL (versión recortada del viewer)
// ============================================================
function buildPlayer(teamKey, playerData){
  const team = TEAMS[teamKey];
  const look = playerData.look;
  const root = new THREE.Group();
  root.scale.setScalar(look.height);
  
  // Sin wrapper interno: los huesos van directo al root.
  // La rotación de compensación del clip BVH se aplica al ROOT mismo (suma +PI al targetRotation).
  // Así al pasar de run a idle, el root mantiene la rotación final y el personaje sigue
  // mirando hacia donde caminaba.
  
  const matSkin = new THREE.MeshPhysicalMaterial({
    color: look.skin, roughness: 0.6, sheen: 0.2, sheenColor: 0xffaa80
  });
  const matJersey = new THREE.MeshStandardMaterial({color: team.jerseyColor, roughness: 0.85});
  const matShorts = new THREE.MeshStandardMaterial({color: team.shortsColor, roughness: 0.9});
  const matSocks = new THREE.MeshStandardMaterial({color: team.socksColor, roughness: 0.95});
  const matSockBand = new THREE.MeshStandardMaterial({color: team.sockBandColor, roughness: 0.95});
  const matCleats = new THREE.MeshPhysicalMaterial({
    color: 0x0a0a0a, roughness: 0.3, metalness: 0.5, clearcoat: 0.8
  });
  const matCleatsAccent = new THREE.MeshStandardMaterial({color: team.color, roughness: 0.5, metalness: 0.4});
  const matHair = new THREE.MeshPhysicalMaterial({color: look.hair, roughness: 0.6});
  const matEye = new THREE.MeshPhysicalMaterial({color:0xffffff, roughness:0.1, clearcoat:1.0});
  const matPupil = new THREE.MeshStandardMaterial({color: look.eyeColor});
  
  function bone(name, parent, ox, oy, oz){
    const b = new THREE.Bone();
    b.name = name;
    b.position.set(ox*CMU_SCALE, oy*CMU_SCALE, oz*CMU_SCALE);
    if(parent) parent.add(b);
    return b;
  }
  
  const hips = bone('Hips', null, 0, 0, 0);
  hips.position.y = 1.0;
  root.add(hips);
  
  const lHipJoint = bone('LHipJoint', hips, 0, 0, 0);
  const lUpLeg = bone('LeftUpLeg', lHipJoint, 1.35, -1.81, 0.86);
  const lLeg = bone('LeftLeg', lUpLeg, 2.44, -6.71, 0);
  const lFoot = bone('LeftFoot', lLeg, 2.78, -7.65, 0);
  bone('LeftToeBase', lFoot, 0.16, -0.43, 1.95);
  
  const rHipJoint = bone('RHipJoint', hips, 0, 0, 0);
  const rUpLeg = bone('RightUpLeg', rHipJoint, -1.15, -1.81, 0.86);
  const rLeg = bone('RightLeg', rUpLeg, -2.55, -7.02, 0);
  const rFoot = bone('RightFoot', rLeg, -2.63, -7.22, 0);
  bone('RightToeBase', rFoot, -0.22, -0.61, 2.06);
  
  const lowerBack = bone('LowerBack', hips, 0, 0, 0);
  const spine = bone('Spine', lowerBack, -0.06, 2.18, -0.22);
  const spine1 = bone('Spine1', spine, 0.09, 2.18, 0.01);
  const neck = bone('Neck', spine1, 0, 0, 0);
  const neck1 = bone('Neck1', neck, -0.15, 1.58, 0.25);
  const head = bone('Head', neck1, 0.14, 1.62, -0.28);
  
  const lShoulder = bone('LeftShoulder', spine1, 0, 0, 0);
  const lArm = bone('LeftArm', lShoulder, 3.23, 0.97, -0.51);
  const lForeArm = bone('LeftForeArm', lArm, 5.20, 0, 0);
  const lHand = bone('LeftHand', lForeArm, 3.32, 0, 0);
  
  const rShoulder = bone('RightShoulder', spine1, 0, 0, 0);
  const rArm = bone('RightArm', rShoulder, -2.96, 1.25, -0.52);
  const rForeArm = bone('RightForeArm', rArm, -5.66, 0, 0);
  const rHand = bone('RightHand', rForeArm, -3.38, 0, 0);
  
  // Shorts
  const shortsGeo = new THREE.CylinderGeometry(0.155, 0.17, 0.18, 24, 4);
  const sppos = shortsGeo.attributes.position;
  for(let i=0;i<sppos.count;i++){ sppos.setZ(i, sppos.getZ(i) * 0.72); }
  sppos.needsUpdate = true;
  shortsGeo.computeVertexNormals();
  hips.add(new THREE.Mesh(shortsGeo, matShorts));
  
  // Torso
  const lowerTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.08, 6, 12), matJersey);
  lowerTorso.position.y = 0.06;
  lowerBack.add(lowerTorso);
  const midTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.145, 0.08, 6, 12), matJersey);
  midTorso.position.y = 0.07;
  spine.add(midTorso);
  
  const jerseyGeo = new THREE.CylinderGeometry(0.18, 0.155, 0.28, 32, 4);
  const jpos = jerseyGeo.attributes.position;
  for(let i=0;i<jpos.count;i++){
    const y = jpos.getY(i);
    jpos.setZ(i, jpos.getZ(i) * 0.72);
    if(y > 0.08){ jpos.setX(i, jpos.getX(i) * 1.05); }
  }
  jpos.needsUpdate = true;
  jerseyGeo.computeVertexNormals();
  const jersey = new THREE.Mesh(jerseyGeo, matJersey);
  jersey.position.y = 0.04;
  spine1.add(jersey);
  
  // Número
  const numCanvas = document.createElement('canvas');
  numCanvas.width = 128; numCanvas.height = 128;
  const nctx = numCanvas.getContext('2d');
  nctx.clearRect(0,0,128,128);
  nctx.fillStyle = teamKey === 'rezona' ? '#ffffff' : '#ffffff';
  nctx.font = 'bold 90px Impact, sans-serif';
  nctx.textAlign = 'center';
  nctx.textBaseline = 'middle';
  nctx.fillText(String(playerData.num), 64, 64);
  const numTex = new THREE.CanvasTexture(numCanvas);
  const numPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.12, 0.12),
    new THREE.MeshBasicMaterial({map:numTex, transparent:true})
  );
  numPlate.position.set(0, 0.02, 0.135);
  spine1.add(numPlate);
  
  // Cuello
  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.06, 12), matSkin);
  neckMesh.position.y = 0.03;
  neck1.add(neckMesh);
  
  // Cabeza
  const headGeo = new THREE.SphereGeometry(0.115, 24, 18);
  const hpos = headGeo.attributes.position;
  for(let i=0;i<hpos.count;i++){
    const x = hpos.getX(i);
    const y = hpos.getY(i);
    hpos.setY(i, y * 1.18);
    if(y < -0.03){ hpos.setZ(i, hpos.getZ(i) * 0.85); hpos.setX(i, x * 0.88); }
  }
  hpos.needsUpdate = true;
  headGeo.computeVertexNormals();
  const headMesh = new THREE.Mesh(headGeo, matSkin);
  headMesh.position.y = 0.09;
  head.add(headMesh);
  
  // Pelo simple
  if(look.hairStyle === 'curly'){
    for(let lat=0;lat<3;lat++){
      const yh = 0.18 + lat*0.02;
      const r = 0.115 - lat*0.012;
      const count = 8-lat;
      for(let i=0;i<count;i++){
        const angle = (i/count) * Math.PI*1.6 + 0.5;
        const curl = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), matHair);
        curl.position.set(Math.cos(angle)*r, yh, Math.sin(angle)*r*0.7 + 0.02);
        head.add(curl);
      }
    }
  } else {
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.122, 24, 12, 0, Math.PI*2, 0, Math.PI*0.5),
      matHair
    );
    hairCap.position.y = 0.11;
    hairCap.scale.y = 1.18;
    head.add(hairCap);
  }
  
  // Ojos
  for(const x of [-0.038, 0.038]){
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), matEye);
    eye.position.set(x, 0.09, 0.094);
    head.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), matPupil);
    pupil.position.set(x, 0.09, 0.111);
    head.add(pupil);
  }
  
  // Headband
  if(look.hasHeadband){
    const headband = new THREE.Mesh(
      new THREE.TorusGeometry(0.122, 0.014, 8, 24),
      new THREE.MeshStandardMaterial({color: look.headbandColor, roughness: 0.5, metalness: 0.2})
    );
    headband.position.y = 0.16;
    headband.rotation.x = -0.15;
    head.add(headband);
  }
  
  // Brazos
  const sleeveLen = 0.13;
  function makeSleeve(b, len, dir){
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, sleeveLen*0.7, 8, 16), matJersey);
    sleeve.rotation.z = dir * -Math.PI/2;
    sleeve.position.set(dir * sleeveLen/2, 0, 0);
    b.add(sleeve);
    const armSkin = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.045, (len - sleeveLen)*0.7, 8, 16),
      matSkin
    );
    armSkin.rotation.z = dir * -Math.PI/2;
    armSkin.position.set(dir * (sleeveLen + (len - sleeveLen)/2), 0, 0);
    b.add(armSkin);
    b.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 16), matJersey));
  }
  makeSleeve(lArm, 5.20*CMU_SCALE, 1);
  makeSleeve(rArm, 5.66*CMU_SCALE, -1);
  
  function makeForeArm(b, len, dir){
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, len*0.7, 8, 16), matSkin);
    m.rotation.z = dir * -Math.PI/2;
    m.position.set(dir * len/2, 0, 0);
    b.add(m);
  }
  makeForeArm(lForeArm, 3.32*CMU_SCALE, 1);
  makeForeArm(rForeArm, 3.38*CMU_SCALE, -1);
  
  function makeHand(b, dir){
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.05, 6, 12), matSkin);
    m.position.set(dir * 0.045, 0, 0);
    m.rotation.z = dir * -Math.PI/2;
    b.add(m);
  }
  makeHand(lHand, 1);
  makeHand(rHand, -1);
  
  // Piernas
  function addLegSeg(b, mat){
    const child = b.children.find(c => c.isBone);
    if(!child) return null;
    const length = child.position.length();
    const radius = mat === matSocks ? 0.06 : 0.07;
    const geo = new THREE.CapsuleGeometry(radius, length*0.6, 8, 16);
    const m = new THREE.Mesh(geo, mat);
    const dir = child.position.clone().normalize();
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
    m.position.copy(child.position).multiplyScalar(0.5);
    b.add(m);
    return m;
  }
  
  for(const [upLeg, leg, foot] of [[lUpLeg, lLeg, lFoot], [rUpLeg, rLeg, rFoot]]){
    addLegSeg(upLeg, matSkin);
    const shortLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.08, 0.13, 16), matShorts);
    const dir = leg.position.clone().normalize();
    shortLeg.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
    shortLeg.position.copy(leg.position).multiplyScalar(0.15);
    upLeg.add(shortLeg);
    
    addLegSeg(leg, matSocks);
    const sockBand = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.025, 16), matSockBand);
    const sd = foot.position.clone().normalize();
    sockBand.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), sd);
    sockBand.position.copy(foot.position).multiplyScalar(0.08);
    leg.add(sockBand);
    leg.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), matSkin));
    
    const cleat = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.06, 0.20), matCleats);
    cleat.position.set(0, -0.02, 0.07);
    foot.add(cleat);
    const toe = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), matCleats);
    toe.scale.set(0.9, 0.7, 1.3);
    toe.position.set(0, -0.025, 0.15);
    foot.add(toe);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.012, 0.22), matCleatsAccent);
    sole.position.set(0, -0.055, 0.07);
    foot.add(sole);
  }
  
  // Sombra
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 64; shadowCanvas.height = 64;
  const sctx = shadowCanvas.getContext('2d');
  const grd = sctx.createRadialGradient(32, 32, 5, 32, 32, 30);
  grd.addColorStop(0, 'rgba(0,0,0,0.6)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  sctx.fillStyle = grd;
  sctx.fillRect(0,0,64,64);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.8),
    new THREE.MeshBasicMaterial({map:shadowTex, transparent:true, depthWrite:false})
  );
  shadow.rotation.x = -Math.PI/2;
  shadow.position.y = 0.01;
  root.add(shadow);
  
  root.traverse(o => { if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; }});
  const allBones = [];
  root.traverse(o => { if(o.isBone) allBones.push(o); });
  return { root, bones: allBones };
}

// === BVH ===
async function decodeGzipB64(b64){
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) arr[i] = bin.charCodeAt(i);
  const ds = new DecompressionStream('gzip');
  const stream = new Blob([arr]).stream().pipeThrough(ds);
  const buf = await new Response(stream).arrayBuffer();
  return new TextDecoder().decode(buf);
}

async function loadBVHPack(){
  setLoadProgress(70);
  const res = await fetch(PACK_URL);
  if(!res.ok) throw new Error('Pack HTTP '+res.status);
  const pack = await res.json();
  const bvhLoader = new BVHLoader();
  // Animaciones que necesitamos para el juego
  const wanted = ['00_idle_breathing', '127_06', '127_07', '127_08', '127_03', '74_04_kick_alt2', '105_61', '105_06', '127_25', '127_26', '128_05',
    '128_10_dive_over_roll', '127_23_dive_roll', '90_17_banana_slip', '13_11_forward_jump', '16_55_run_fast', '10_02_kick',
    '105_43', '105_46', '127_09', '127_10', '127_11', '127_12', '127_13', '127_14', '127_15', '127_16', '128_04', '128_09', '16_02_jump_high', '13_39_jump_short'];
  const parsed = {};
  for(const name of wanted){
    if(!pack[name]) continue;
    try{
      const txt = await decodeGzipB64(pack[name]);
      parsed[name] = bvhLoader.parse(txt);
    }catch(e){}
  }
  setLoadProgress(90);
  return parsed;
}

function buildPlayerAnimations(p){
  if(!bvhClipsRef) return;
  p.mixer = new THREE.AnimationMixer(p.root);
  p.actions = {};
  const validBones = new Set(p.bones.map(b => b.name));
  
  for(const [key, srcName] of Object.entries({
    idle: '00_idle_breathing', // idle real estático del pack (motion=0)
    walk: '127_08',           // RunSlow 1.17s
    run: '127_07',            // RunFast 1.22s
    sprint: '127_06',         // Run2 1.45s
    kick: '74_04_kick_alt2',  // patada rápida 1.80s
    dive: '128_10_dive_over_roll',  // ATAJADA del arquero (clavada)
    slide: '90_17_banana_slip',     // SLIDE TACKLE / barrida
    jump: '13_11_forward_jump',     // salto
    // poses de preparación (cinemática de inicio)
    prep1: '127_03', prep2: '105_61', prep3: '105_06',
    prep4: '127_25', prep5: '127_26', prep6: '128_05',
    // EMOTES / festejos (20 en total: 6 reusan las prep + 14 nuevos)
    emote1: '127_03', emote2: '105_61', emote3: '105_06',
    emote4: '127_25', emote5: '127_26', emote6: '128_05',
    emote7: '105_43', emote8: '105_46', emote9: '127_09',
    emote10: '127_10', emote11: '127_11', emote12: '127_12',
    emote13: '127_13', emote14: '127_14', emote15: '127_15',
    emote16: '127_16', emote17: '128_04', emote18: '128_09',
    emote19: '16_02_jump_high', emote20: '13_39_jump_short'
  })){
    const src = bvhClipsRef[srcName];
    if(!src) continue;
    const tracks = [];
    for(const t of src.clip.tracks){
      const dotIdx = t.name.lastIndexOf('.');
      if(dotIdx < 0) continue;
      const boneName = t.name.substring(0, dotIdx);
      const propName = t.name.substring(dotIdx+1);
      if(!validBones.has(boneName)) continue;
      if(propName === 'position') continue;
      let bad = false;
      for(let i=0;i<t.values.length;i++){
        if(isNaN(t.values[i]) || !isFinite(t.values[i])){ bad=true; break; }
      }
      if(bad) continue;
      tracks.push(t);
    }
    if(tracks.length === 0) continue;
    
    // Las nuevas anims (jog, run_cycle2) ya tienen duración natural corta
    // y loops más limpios - no necesitan recorte
    let finalDuration = src.clip.duration;
    let processedTracks = tracks;
    
    // === ROTAR IDLE 180° INTERNAMENTE ===
    // El subject 00 (idle) está orientado hacia +Z mientras subject 127 (run/walk/sprint)
    // están hacia -Z. Pre-rotamos el Hips del clip idle para que coincida.
    if(key === 'idle'){
      processedTracks = tracks.map(track => {
        // Solo rotamos el track quaternion del Hips
        if(track.name !== 'Hips.quaternion') return track;
        const numKeys = track.times.length;
        const newValues = new Float32Array(track.values.length);
        // Quaternion de rotación Y de 180°: (0, sin(π/2), 0, cos(π/2)) = (0, 1, 0, 0)
        // Aplicamos: q_new = q_flip * q_original
        const fx = 0, fy = 1, fz = 0, fw = 0;
        for(let i = 0; i < numKeys; i++){
          const ax = track.values[i*4];
          const ay = track.values[i*4+1];
          const az = track.values[i*4+2];
          const aw = track.values[i*4+3];
          // q_flip * q_orig: producto de quaternions
          newValues[i*4]   = fw*ax + fx*aw + fy*az - fz*ay;
          newValues[i*4+1] = fw*ay - fx*az + fy*aw + fz*ax;
          newValues[i*4+2] = fw*az + fx*ay - fy*ax + fz*aw;
          newValues[i*4+3] = fw*aw - fx*ax - fy*ay - fz*az;
        }
        const TrackClass = track.constructor;
        return new TrackClass(track.name, track.times, newValues);
      });
    }
    
    // === RECORTAR KICK ===
    // El clip de patada tiene warmup (preparación) al inicio y recovery (recuperación) al final.
    // Para que la patada se vea más explosiva, recortamos al rango del impacto (30%-85% del clip).
    if(key === 'kick'){
      const origDur = src.clip.duration;
      const startCut = origDur * 0.30;
      const endCut = origDur * 0.85;
      finalDuration = endCut - startCut;
      
      processedTracks = processedTracks.map(track => {
        const stride = track.getValueSize();
        const times = track.times;
        const values = track.values;
        const newTimes = [];
        const newVals = [];
        for(let i = 0; i < times.length; i++){
          if(times[i] >= startCut && times[i] <= endCut){
            newTimes.push(times[i] - startCut);  // shift a 0
            for(let k = 0; k < stride; k++){
              newVals.push(values[i*stride + k]);
            }
          }
        }
        if(newTimes.length < 2) return track;  // no recortar si quedan menos de 2 keys
        const TrackClass = track.constructor;
        return new TrackClass(track.name, new Float32Array(newTimes), new Float32Array(newVals));
      });
    }
    
    // === RECORTAR FINAL DE WALK/RUN/SPRINT ===
    // Cortar los últimos 0.13s para que el loop se vea más natural
    if(key === 'walk' || key === 'run' || key === 'sprint'){
      const cutEnd = 0.13;
      finalDuration = Math.max(0.2, src.clip.duration - cutEnd);
      
      processedTracks = processedTracks.map(track => {
        const stride = track.getValueSize();
        const times = track.times;
        const values = track.values;
        const newTimes = [];
        const newVals = [];
        for(let i = 0; i < times.length; i++){
          if(times[i] <= finalDuration){
            newTimes.push(times[i]);
            for(let k = 0; k < stride; k++){
              newVals.push(values[i*stride + k]);
            }
          }
        }
        if(newTimes.length < 2) return track;
        const TrackClass = track.constructor;
        return new TrackClass(track.name, new Float32Array(newTimes), new Float32Array(newVals));
      });
    }
    
    // === FILTRO DE SUAVIZADO DEL LOOP === (DESACTIVADO)
    
    const clean = new THREE.AnimationClip(key, finalDuration, processedTracks);
    console.log('[anim]', key, 'duración:', finalDuration.toFixed(2)+'s (original:', src.clip.duration.toFixed(2)+'s)');
    const action = p.mixer.clipAction(clean);
    if(key === 'kick'){
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    } else {
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.clampWhenFinished = false;
    }
    p.actions[key] = action;
  }
  
  // Guardar referencias a huesos para idle procedural
  p.idleBones = {
    hips: p.root.getObjectByName('Hips'),
    spine: p.root.getObjectByName('Spine'),
    spine1: p.root.getObjectByName('Spine1'),
    neck: p.root.getObjectByName('Neck1'),
    head: p.root.getObjectByName('Head'),
    lShoulder: p.root.getObjectByName('LeftArm'),
    rShoulder: p.root.getObjectByName('RightArm'),
    lForeArm: p.root.getObjectByName('LeftForeArm'),
    rForeArm: p.root.getObjectByName('RightForeArm'),
    lUpLeg: p.root.getObjectByName('LeftUpLeg'),
    rUpLeg: p.root.getObjectByName('RightUpLeg'),
    lLeg: p.root.getObjectByName('LeftLeg'),
    rLeg: p.root.getObjectByName('RightLeg'),
  };
  
  // CAPTURAR rotaciones bind ORIGINALES de TODOS los huesos (antes de aplicar pose descanso)
  // Estas son las que vamos a restaurar en cualquier hueso que no esté en idleBones
  p.allBoneBindRot = {};
  p.bones.forEach(bone => {
    p.allBoneBindRot[bone.name] = bone.rotation.clone();
  });
  
  // === POSE DE DESCANSO ===
  // El esqueleto procedural arranca en estrella (brazos horizontales como T-pose).
  // Le aplicamos una pose natural de pie: brazos hacia abajo, piernas paralelas
  const b = p.idleBones;
  
  // Brazos: rotar hacia abajo (~75°) en Z (en el frame local del hombro)
  // El brazo apunta en +X (LeftArm) o -X (RightArm) en bind pose
  // Para bajarlos: rotar en Z para que apunten hacia -Y
  if(b.lShoulder){
    b.lShoulder.rotation.z = -1.35;   // baja el brazo izquierdo
    b.lShoulder.rotation.y = 0.10;    // un poco hacia el frente
  }
  if(b.rShoulder){
    b.rShoulder.rotation.z = 1.35;    // baja el brazo derecho
    b.rShoulder.rotation.y = -0.10;
  }
  // Antebrazos: ligera flexión para look natural
  if(b.lForeArm){
    b.lForeArm.rotation.y = 0.15;
  }
  if(b.rForeArm){
    b.rForeArm.rotation.y = -0.15;
  }
  
  // Piernas: en el bind pose CMU los muslos apuntan diagonal abajo + un poco al frente
  // (porque el offset es (1.35, -1.81, 0.86)). Mejor las dejo casi así, solo ajusto
  // para que queden más paralelas (menos abiertas en X)
  // El offset es naturalmente abierto → rotar levemente hacia el centro
  if(b.lUpLeg){
    b.lUpLeg.rotation.z = -0.05;   // un poco hacia adentro
  }
  if(b.rUpLeg){
    b.rUpLeg.rotation.z = 0.05;
  }
  
  // Ahora SÍ guardar las rotaciones base (con la pose de descanso aplicada)
  p.idleBaseRot = {};
  for(const [name, bone] of Object.entries(p.idleBones)){
    if(bone) p.idleBaseRot[name] = bone.rotation.clone();
  }
  
  p.currentAnim = 'idle';
  p.idleTime = Math.random() * 10;
}

// === IDLE PROCEDURAL ===
// Aplica la pose de descanso (brazos abajo, piernas paralelas)
// + suma un movimiento sutil de respiración y balanceo encima
function updateIdle(p, dt){
  if(!p.idleBones || !p.idleBaseRot || !p.allBoneBindRot) return;
  p.idleTime += dt;
  const t = p.idleTime;
  
  // Blend desde pose actual hacia pose de descanso (cuando recién entramos a idle)
  if(p.idleBlendT === undefined) p.idleBlendT = 1;
  p.idleBlendT = Math.min(1, p.idleBlendT + dt * 3.5);
  const blend = p.idleBlendT;
  
  // PASO 1: resetear TODOS los huesos del personaje a su rotación bind original
  // (esto sobreescribe lo que dejó el mixer al hacer fadeOut del run/walk)
  p.bones.forEach(bone => {
    const bind = p.allBoneBindRot[bone.name];
    if(!bind) return;
    // Lerp hacia bind con blend factor
    bone.rotation.x = bone.rotation.x + (bind.x - bone.rotation.x) * blend;
    bone.rotation.y = bone.rotation.y + (bind.y - bone.rotation.y) * blend;
    bone.rotation.z = bone.rotation.z + (bind.z - bone.rotation.z) * blend;
  });
  
  // Movimientos procedurales encima de la pose de descanso
  const breath = Math.sin(t * 1.6) * 0.05;
  const sway = Math.sin(t * 0.9) * 0.02;
  const swayZ = Math.cos(t * 1.1) * 0.015;
  const headBob = Math.sin(t * 1.6 + 0.4) * 0.025;
  const headTurn = Math.sin(t * 0.4) * 0.04;
  const armSwing = Math.sin(t * 0.9 + Math.PI) * 0.03;
  
  const b = p.idleBones;
  const base = p.idleBaseRot;
  
  // Helper: aplicar pose descanso (idleBaseRot) + offset procedural
  // Tras el reset de arriba, los huesos están en bind. Ahora los movemos a la pose de descanso + offset
  function applyBone(bone, baseRot, offX = 0, offY = 0, offZ = 0){
    if(!bone || !baseRot) return;
    const targetX = baseRot.x + offX;
    const targetY = baseRot.y + offY;
    const targetZ = baseRot.z + offZ;
    bone.rotation.x = bone.rotation.x + (targetX - bone.rotation.x) * blend;
    bone.rotation.y = bone.rotation.y + (targetY - bone.rotation.y) * blend;
    bone.rotation.z = bone.rotation.z + (targetZ - bone.rotation.z) * blend;
  }
  
  applyBone(b.hips, base.hips, 0, 0, 0);
  applyBone(b.spine, base.spine, breath * 0.3, 0, sway);
  applyBone(b.spine1, base.spine1, breath, 0, swayZ);
  applyBone(b.neck, base.neck, headBob, 0, 0);
  applyBone(b.head, base.head, headBob * 0.4, headTurn, 0);
  applyBone(b.lShoulder, base.lShoulder, armSwing, 0, 0);
  applyBone(b.rShoulder, base.rShoulder, -armSwing, 0, 0);
  applyBone(b.lForeArm, base.lForeArm, 0, 0, 0);
  applyBone(b.rForeArm, base.rForeArm, 0, 0, 0);
  applyBone(b.lUpLeg, base.lUpLeg, 0, 0, 0);
  applyBone(b.rUpLeg, base.rUpLeg, 0, 0, 0);
  applyBone(b.lLeg, base.lLeg, 0, 0, 0);
  applyBone(b.rLeg, base.rLeg, 0, 0, 0);
}

function playerSetAnim(p, name, timeScale = 1.0){
  if(!p.actions) return;
  // Para kick: SIEMPRE relanzar (puede patearse encadenado o sobre run)
  // Para otras: solo si cambió
  if(name !== 'kick' && p.currentAnim === name) return;
  
  const fromAnim = p.currentAnim;
  p.currentAnim = name;
  
  // Reproducir nueva anim
  if(!p.actions[name]) return;
  
  const newAction = p.actions[name];
  newAction.timeScale = timeScale;
  newAction.setEffectiveWeight(1);
  newAction.enabled = true;
  
  // Si es relanzamiento del MISMO kick → reset directo y play
  if(name === 'kick' && fromAnim === 'kick'){
    newAction.reset();
    newAction.play();
    return;
  }
  
  if(fromAnim && p.actions[fromAnim]){
    // Crossfade desde la anim previa a la nueva
    const oldAction = p.actions[fromAnim];
    newAction.reset();
    newAction.play();
    // Kick = crossfade casi instantáneo (0.05s) para que la patada se vea inmediata
    // Otros = crossfade suave (0.25s)
    const fadeDur = (name === 'kick') ? 0.05 : 0.25;
    oldAction.crossFadeTo(newAction, fadeDur, true);
  } else {
    // Primera anim
    newAction.reset();
    newAction.fadeIn(0.25);
    newAction.play();
  }
}

// === START GAME (al elegir equipo) ===
// === MARCADOR: bandera + abreviación de cada equipo ===
function teamAbbr(name){
  const s = String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z ]/g, '');
  const words = s.split(/\s+/).filter(Boolean);
  if(words.length >= 2) return (words[0][0] + words[1][0] + (words[1][1] || '')).slice(0, 3);
  return s.replace(/\s/g, '').slice(0, 3) || '??';
}
function _hudFlag(id, name){
  const f = document.getElementById(id); if(!f) return false;
  f.width = 44; f.height = 30;
  const ok = window.drawCountryFlag ? window.drawCountryFlag(f, name) : false;
  return ok;
}
// Dibuja la bandera del equipo (por CLAVE, mapeo garantizado). Si no hay bandera de país, usa el color del equipo.
function _drawTeamFlag(id, teamKey){
  const f = document.getElementById(id); if(!f) return;
  const tm = TEAMS[teamKey];
  const ok = tm ? _hudFlag(id, tm.name) : false;
  if(!ok && tm){
    try{
      f.width = 44; f.height = 30;
      const ctx = f.getContext('2d'); ctx.clearRect(0, 0, 44, 30);
      const col = '#' + ('000000' + ((tm.color >>> 0).toString(16))).slice(-6);
      ctx.fillStyle = col; ctx.fillRect(0, 0, 44, 30);
      ctx.fillStyle = tm.accentHex || '#ffffff'; ctx.fillRect(0, 20, 44, 10);
    }catch(e){}
  }
  f.style.display = 'block';
  // aro de color del equipo (refuerzo visual e inequívoco)
  try{ const col = '#' + ('000000' + (((tm&&tm.color)>>>0).toString(16))).slice(-6); f.style.outline = '2px solid ' + col; f.style.outlineOffset = '0px'; }catch(e){}
}
function setupScoreboard(){
  const us = TEAMS[currentTeam], them = TEAMS[currentRival];
  const au = document.getElementById('hudAbbrUs'); if(au && us) au.textContent = teamAbbr(us.name);
  const at = document.getElementById('hudAbbrThem'); if(at && them) at.textContent = teamAbbr(them.name);
  updateScoreboard();
}
function updateScoreboard(){
  const el = document.getElementById('hudScore'); if(el) el.textContent = scoreUs + ' - ' + scoreThem;
}
function startGame(teamKey, playerIndex = 0, cinematic = true){
  // restaurar cualquier kit alterno de partidos anteriores
  for(const k in TEAMS){ const tt = TEAMS[k]; if(tt._origKit){ Object.assign(tt, tt._origKit); delete tt._origKit; } }
  currentTeam = teamKey;
  chosenPlayerIndex = playerIndex;
  const team = TEAMS[teamKey];
  // RIVAL con CONTRASTE: entre los equipos distintos al tuyo, elegimos uno cuyo color de
  // camiseta se distinga bien del TUYO y del VERDE del campo (evita kits confundibles).
  const rivalPool = Object.keys(TEAMS).filter(k => k !== teamKey);
  const _rgb = (c) => ({ r:(c>>16)&255, g:(c>>8)&255, b:c&255 });
  const _dist = (a, b) => { const x=_rgb(a), y=_rgb(b);
    return Math.sqrt((x.r-y.r)**2 + (x.g-y.g)**2 + (x.b-y.b)**2); };
  const FIELD_GREEN = 0x3a7a32;   // verde aproximado del césped
  let rivalKey;
  if(rivalPool.length){
    const mine = team.jerseyColor;
    let best = null, bestScore = -1;
    // barajamos para que con scores parejos no salga siempre el mismo
    const shuffled = rivalPool.slice().sort(() => Math.random() - 0.5);
    for(const k of shuffled){
      const rc = TEAMS[k].jerseyColor;
      const vsMine  = _dist(rc, mine);          // distinto a tu kit
      const vsField = _dist(rc, FIELD_GREEN);   // distinto al campo
      // ambos importan; penalizamos fuerte si CUALQUIERA es bajo
      const score = Math.min(vsMine, vsField) * 1.6 + (vsMine + vsField) * 0.2;
      if(score > bestScore){ bestScore = score; best = k; }
    }
    rivalKey = best;
  } else {
    rivalKey = (teamKey === 'rezona') ? 'saurrex' : 'rezona';
  }
  currentRival = rivalKey;
  const rivalTeam = TEAMS[rivalKey];

  // === KIT ALTERNO DE CONTRASTE ===
  // Si el kit del rival sigue siendo confundible con el tuyo o con el campo verde,
  // le ponemos una camiseta alterna de alto contraste para que se distingan a simple vista.
  // (restauramos el kit original al salir, en exitGame)
  {
    const rc = rivalTeam.jerseyColor;
    const tooCloseMine  = _dist(rc, team.jerseyColor) < 90;
    const tooCloseField = _dist(rc, FIELD_GREEN) < 80;
    if(tooCloseMine || tooCloseField){
      // paleta de kits alternos vivos y separados del verde
      const ALT = [0xffffff, 0x111111, 0xff2d2d, 0xffd400, 0xff7a00, 0xe040fb, 0x00e5ff, 0x1565ff];
      let alt = ALT[0], bestS = -1;
      for(const c of ALT){
        const s = Math.min(_dist(c, team.jerseyColor), _dist(c, FIELD_GREEN));
        if(s > bestS){ bestS = s; alt = c; }
      }
      // guardar original una sola vez
      if(rivalTeam._origKit === undefined){
        rivalTeam._origKit = {
          jerseyColor: rivalTeam.jerseyColor, shortsColor: rivalTeam.shortsColor,
          socksColor: rivalTeam.socksColor, sockBandColor: rivalTeam.sockBandColor
        };
      }
      const dark = ((alt>>16)&255) + ((alt>>8)&255) + (alt&255) < 280;
      rivalTeam.jerseyColor = alt;
      rivalTeam.shortsColor = alt;
      rivalTeam.socksColor  = alt;
      rivalTeam.sockBandColor = dark ? 0xffffff : 0x111111;
    }
  }

  // === FORMACIÓN basada en arcos detectados ===
  const ourGoal = goalAreas.find(g => g.teamForGoal === 'them');  // arco que defendemos
  const theirGoal = goalAreas.find(g => g.teamForGoal === 'us');  // arco al que atacamos
  
  // Si no se detectaron arcos, usar default
  if(!ourGoal || !theirGoal){
    console.log('[formation] sin arcos, usando default');
  }
  
  // Vector desde NUESTRO arco hacia el DEL RIVAL = "adelante"
  let forwardVec = new THREE.Vector3(1, 0, 0);  // default: arcos en X
  let sideVec = new THREE.Vector3(0, 0, 1);
  let centerPos = new THREE.Vector3(0, 0, 0);
  let halfDepth = 12;
  
  if(ourGoal && theirGoal){
    forwardVec.subVectors(theirGoal.center, ourGoal.center);
    halfDepth = forwardVec.length() / 2;
    forwardVec.y = 0;
    forwardVec.normalize();
    // Side = perpendicular a forward (rotado 90° hacia arriba mirando)
    sideVec.set(-forwardVec.z, 0, forwardVec.x);  // rotación 90° en XZ
    centerPos.addVectors(ourGoal.center, theirGoal.center).multiplyScalar(0.5);
    centerPos.y = 0;
    console.log('[formation] forward:', forwardVec.x.toFixed(2), forwardVec.z.toFixed(2), 'side:', sideVec.x.toFixed(2), sideVec.z.toFixed(2), 'halfDepth:', halfDepth.toFixed(1));
  }

  // Guardar para la IA de movimiento
  fieldFwd.copy(forwardVec); fieldFwd.y = 0;
  fieldSide.copy(sideVec); fieldSide.y = 0;
  ourGoalPos = ourGoal ? ourGoal.center.clone() : null;
  theirGoalPos = theirGoal ? theirGoal.center.clone() : null;
  
  // Posiciones relativas (en unidades del campo, no metros absolutos)
  // CLAMPEA al fieldLimits para que ningún NPC quede fuera de la cancha
  function makePos(forwardFrac, sideOff){
    const pos = centerPos.clone()
      .addScaledVector(forwardVec, forwardFrac * halfDepth)
      .addScaledVector(sideVec, sideOff);
    // Clampear a los límites
    if(fieldLimits){
      const margin = 1.5;
      pos.x = Math.max(fieldLimits.minX + margin, Math.min(fieldLimits.maxX - margin, pos.x));
      pos.z = Math.max(fieldLimits.minZ + margin, Math.min(fieldLimits.maxZ - margin, pos.z));
    }
    return pos;
  }
  
  // Calcular rotación.y para que mire en dirección "forward" (hacia el arco rival)
  const lookForwardAngle = Math.atan2(forwardVec.x, forwardVec.z);
  const lookBackwardAngle = lookForwardAngle + Math.PI;
  
  // === ORIENTACIÓN DE SPAWN ===
  const faceFwd  = Math.atan2(forwardVec.x, forwardVec.z) + Math.PI;
  const faceBack = faceFwd + Math.PI;

  // Posiciones RELATIVAS a la cancha (no fijas): nuestro equipo en NUESTRA mitad,
  // rivales en la suya. fieldFwd apunta de nuestro arco al rival (dirección de ataque).
  const C = getFieldCenter();
  const span = (theirGoalPos && ourGoalPos) ? theirGoalPos.distanceTo(ourGoalPos) : 24;
  const H = span * 0.5;
  function spot(ff, ss){
    const p = C.clone().addScaledVector(fieldFwd, ff * H).addScaledVector(fieldSide, ss);
    clampField(p); p.y = fieldGroundY; return p;
  }
  const tmSpots = [spot(-0.45, -6), spot(-0.45, 6)];
  const rivalSpots = [spot(0.25, 0), spot(0.52, -6), spot(0.52, 6)];

  // Crear jugador (el elegido en el visor) - en nuestra mitad
  const idx = Math.max(0, Math.min(team.players.length - 1, playerIndex));
  player = buildPlayer(teamKey, team.players[idx]);
  player.root.position.copy(spot(-0.18, 0));
  player.root.rotation.y = faceFwd;
  player.root.scale.multiplyScalar(0.6);
  player.isPlayer = true;
  player.team = 'us';
  player._ctrlIndex = 0;
  scene.add(player.root);
  buildPlayerAnimations(player);

  // === LÍMITE DE JUGADORES SEGÚN MODO (1v1 / 2v2) ===
  // 1v1 = vos vs 1 rival (sin compañeros de campo). 2v2 = vos + 1 compa vs 2 rivales.
  const _mode = window.selectedMode || '2v2';
  // jugadores de campo por equipo: 1v1=1, 2v2=2, 3v3=3 (vos contás como uno de los tuyos)
  const _perTeam = (_mode === '1v1') ? 1 : (_mode === '3v3') ? 3 : 2;
  const MAX_TM = _perTeam - 1;   // compañeros de campo (además de vos)
  const MAX_RV = _perTeam;        // rivales de campo

  // Compañeros = el resto del equipo (limitado por modo)
  teammates = [];
  let tmSlot = 0;
  for(let i = 0; i < team.players.length; i++){
    if(i === idx) continue;
    if(teammates.length >= MAX_TM) break;
    const tm = buildPlayer(teamKey, team.players[i]);
    tm.root.position.copy(tmSpots[tmSlot % tmSpots.length]);
    tmSlot++;
    tm.root.rotation.y = faceFwd;
    tm.root.scale.multiplyScalar(0.6);
    tm.team = 'us';
    tm._ctrlIndex = tmSlot;
    scene.add(tm.root);
    buildPlayerAnimations(tm);
    teammates.push(tm);
  }

  // Rivales (limitados por modo)
  rivals = [];
  for(let i = 0; i < rivalTeam.players.length; i++){
    if(rivals.length >= MAX_RV) break;
    const r = buildPlayer(rivalKey, rivalTeam.players[i]);
    r.root.position.copy(rivalSpots[i % rivalSpots.length]);
    r.root.rotation.y = faceBack;
    r.root.scale.multiplyScalar(0.6);
    r.team = 'them';
    scene.add(r.root);
    buildPlayerAnimations(r);
    rivals.push(r);
  }
  console.log('[formation] center:', centerPos, 'halfDepth:', halfDepth);
  console.log('[formation] player en', player.root.position);
  for(let i = 0; i < teammates.length; i++) console.log('[formation] teammate', i, teammates[i].root.position);
  for(let i = 0; i < rivals.length; i++) console.log('[formation] rival', i, rivals[i].root.position);
  
  // Reset score
  scoreUs = 0;
  scoreThem = 0;
  try{ if(window.quest) window.quest('play',1); }catch(e){}
  goalCooldown = 0;
  ballOwner = player;

  // Porteros (1 por arco)
  spawnGoalkeepers();

  // Reset estado de partido (tiempo / faltas / tiro libre)
  matchTime = 0;
  matchHalf = 1;
  halfStartReal = 0;
  addedMin1 = 1 + Math.floor(Math.random() * 4);   // 1-4'
  addedMin2 = 1 + Math.floor(Math.random() * 5);   // 1-5'
  matchOver = false;
  freeKickPause = 0;
  foulCooldown = 0;
  stealGrace = 0;
  pendingFKOwner = null;
  kickoffPending = true;
  kickoffActive = false;
  celebrating = false;
  slowmo = 1;
  ensureAudio(); stopBg(); startMusic(); startCrowd();
  player._fLast = null;
  
  // UI
  setupScoreboard();
  const clk = document.getElementById('matchClock');
  clk.textContent = formatClock(0);
  clk.classList.remove('low');
  document.getElementById('fullTime').classList.remove('show');
  document.getElementById('foulBanner').classList.remove('show');
  
  document.getElementById('gameUI').classList.add('show');
  requestAnimationFrame(() => setupScoreboard());
  setTimeout(setupScoreboard, 150);    // reintentos por si la WebView dibuja tarde
  setTimeout(setupScoreboard, 600);

  // Cinemática de inicio (al iniciar desde el visor; el replay la saltea)
  if(cinematic){
    startCinematic();
  } else {
    cinematicActive = false;
    const bars = document.getElementById('cinemaBars');
    if(bars) bars.classList.remove('on');
  }

  // === MODO RED: quitar los NPC locales (rivales/compañeros/arqueros) ===
  // En multijugador el server dibuja a los demás; los locales solo estorbarían.
  if(window.NET && window.NET.active){
    try{
      for(const tm of teammates){ if(tm && tm.root) scene.remove(tm.root); }
      for(const r of rivals){ if(r && r.root) scene.remove(r.root); }
      if(typeof goalkeepers !== 'undefined'){ for(const gk of goalkeepers){ if(gk && gk.root) scene.remove(gk.root); } }
      teammates = []; rivals = [];
      if(typeof goalkeepers !== 'undefined') goalkeepers = [];
      ballOwner = null;   // la posesión la maneja el server
      cinematicActive = false;
      const bars = document.getElementById('cinemaBars'); if(bars) bars.classList.remove('on');
    }catch(e){}
  }
}

function exitGame(){
  stopCrowd(); stopMusic(); startBg('menu');
  if(devMode){ devMode = false; document.getElementById('devBtn').classList.remove('on'); document.getElementById('devPanel').classList.remove('show'); }
  for(const h of devHelpers){ scene.remove(h); if(h.geometry) h.geometry.dispose(); }
  devHelpers = [];
  if(player){
    scene.remove(player.root);
    if(player.mixer) player.mixer.stopAllAction();
    player = null;
  }
  for(const tm of teammates){
    scene.remove(tm.root);
    if(tm.mixer) tm.mixer.stopAllAction();
  }
  teammates = [];
  for(const r of rivals){
    scene.remove(r.root);
    if(r.mixer) r.mixer.stopAllAction();
  }
  rivals = [];
  for(const gk of goalkeepers){
    scene.remove(gk.root);
    if(gk.mixer) gk.mixer.stopAllAction();
  }
  goalkeepers = [];
  ballOwner = null;
  cameraMode = 'player';
  cameraBallTimer = 0;
  passInFlight = false; passReceiver = null;
  autoFreezeTimer = 0;
  // Reset estado de partido y ocultar overlays
  matchOver = false;
  matchEndCine = false; endCineTarget = null;
  freeKickPause = 0;
  foulCooldown = 0;
  stealGrace = 0;
  matchTime = 0;
  pendingFKOwner = null;
  cinematicActive = false;
  document.getElementById('cinemaBars').classList.remove('on');
  tutorialActive = false;
  document.getElementById('tutorial').classList.remove('show');
  // limpiar festejo/saque
  slowmo = 1; celebrating = false; kickoffActive = false; setPiece = null; kickoffPending = false;
  if(celebGroup){ scene.remove(celebGroup); celebGroup = null; }
  if(celebLight){ scene.remove(celebLight); celebLight = null; }
  document.getElementById('goalFlash').classList.remove('on');
  document.getElementById('fullTime').classList.remove('show');
  document.getElementById('foulBanner').classList.remove('show');
  document.getElementById('gameUI').classList.remove('show');
  document.getElementById('playScreen').classList.remove('hide');
  document.getElementById('teamSelect').classList.remove('show');
  document.getElementById('playerViewer').classList.remove('show');
}

// ============================================================
// === PORTEROS / FALTAS / TIRO LIBRE / TIEMPO DE PARTIDO ===
// ============================================================
let pendingFKOwner = null;   // jugador que toma el tiro libre al terminar la pausa
let _foulBannerTO = null;

// --- SILBATO (WebAudio; speechSynthesis no anda en el WebView de Rezona) ---
function playWhistle(){
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const t0 = audioCtx.currentTime;
    for(const off of [0, 0.18]){
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.value = 2100;
      o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.0001, t0 + off);
      g.gain.exponentialRampToValueAtTime(0.25, t0 + off + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + off + 0.14);
      o.start(t0 + off);
      o.stop(t0 + off + 0.16);
    }
  }catch(e){ /* WebView sin audio: ignorar */ }
}

// === MOTOR DE SONIDO (WebAudio) — música mundialista + efectos ===
let _ag = null, musicTimer = null, crowdSrc = null, audioMuted = false, musicBar = 0;
let bgTimer = null, bgKind = null, bgBar = 0;
function ensureAudio(){
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if(audioCtx.state === 'suspended') audioCtx.resume();
    if(!_ag){
      const master = audioCtx.createGain(); master.gain.value = audioMuted ? 0 : 0.9; master.connect(audioCtx.destination);
      const music = audioCtx.createGain(); music.gain.value = 0.15; music.connect(master);
      const sfx = audioCtx.createGain(); sfx.gain.value = 0.6; sfx.connect(master);
      _ag = { master, music, sfx };
    }
  }catch(e){ audioCtx = null; }
  return _ag;
}
function _tone(freq, t0, dur, type, gain, dest){
  if(!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.002, gain), t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  o.connect(g); g.connect(dest || (_ag && _ag.sfx) || audioCtx.destination);
  o.start(t0); o.stop(t0 + dur + 0.03);
}
function _noise(t0, dur, gain, type, freq, dest){
  if(!audioCtx) return;
  const len = Math.max(1, Math.floor(audioCtx.sampleRate * dur));
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for(let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = audioCtx.createBufferSource(); src.buffer = buf;
  const f = audioCtx.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq || 1000; f.Q.value = 0.7;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(gain, t0 + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  src.connect(f); f.connect(g); g.connect(dest || (_ag && _ag.sfx) || audioCtx.destination);
  src.start(t0); src.stop(t0 + dur + 0.02);
}
function sfxKick(power){
  const a = ensureAudio(); if(!audioCtx) return;
  const t = audioCtx.currentTime;
  const p = Math.max(0, Math.min(1, ((power||16) - 14) / 10));  // 0..1 según potencia
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(190 + p*120, t);
  o.frequency.exponentialRampToValueAtTime(50, t + 0.12 + p*0.05);
  const vol = 0.55 + p*0.35;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.16);
  o.connect(g); g.connect(a ? a.sfx : audioCtx.destination); o.start(t); o.stop(t + 0.2);
  _noise(t, 0.05 + p*0.03, 0.22 + p*0.18, 'highpass', 1800);   // "thwack"
  if(p > 0.55) _tone(120, t, 0.18, 'sine', 0.3, a && a.sfx);   // golpe grave en tiros potentes
}
function sfxCurveKick(spin){
  // whoosh que "barre" de un lado al otro según la dirección del chanfle
  const a = ensureAudio(); if(!audioCtx) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'sawtooth';
  const up = spin >= 0;
  o.frequency.setValueAtTime(up ? 300 : 900, t);
  o.frequency.exponentialRampToValueAtTime(up ? 1100 : 320, t + 0.32);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.34);
  const f = audioCtx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=700; f.Q.value=3;
  o.connect(f); f.connect(g); g.connect(a ? a.sfx : audioCtx.destination); o.start(t); o.stop(t + 0.38);
  _noise(t, 0.34, 0.12, 'bandpass', 1400);   // aire
}
function sfxChargeReady(){
  const a = ensureAudio(); if(!audioCtx) return;
  const t = audioCtx.currentTime;
  _tone(880, t, 0.09, 'triangle', 0.18, a && a.sfx);   // "ding" cuando la carga llega al tope
}
function sfxGoal(){
  const a = ensureAudio(); if(!audioCtx) return;
  const t = audioCtx.currentTime;
  _noise(t, 2.0, 0.55, 'bandpass', 700);   // rugido de hinchada
  _noise(t, 2.0, 0.32, 'lowpass', 480);
  _noise(t + 0.02, 0.25, 0.4, 'highpass', 5000);   // silbato/chispa inicial
  // fanfarria más rica (acorde ascendente + remate agudo)
  [392, 523, 659, 784, 1046].forEach((f, i) => _tone(f, t + 0.08 + i * 0.11, 0.6, 'sawtooth', 0.17, a && a.music));
  _tone(1568, t + 0.62, 0.5, 'square', 0.12, a && a.music);   // remate brillante
}
function startCrowd(){
  const a = ensureAudio(); if(!audioCtx || crowdSrc) return;
  const len = Math.floor(audioCtx.sampleRate * 2);
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const d = buf.getChannelData(0); for(let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
  const src = audioCtx.createBufferSource(); src.buffer = buf; src.loop = true;
  const f = audioCtx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 0.5;
  const g = audioCtx.createGain(); g.gain.value = 0.05;
  src.connect(f); f.connect(g); g.connect(a ? a.master : audioCtx.destination); src.start();
  crowdSrc = { src, g };
}
function stopCrowd(){ if(crowdSrc){ try{ crowdSrc.src.stop(); }catch(e){} crowdSrc = null; } }
function playAnthemBar(){
  if(!audioCtx){ return; }
  const a = ensureAudio(); const bar = 1.8;
  if(!audioMuted){
    const t = audioCtx.currentTime + 0.04;
    const chords = [[130.81,164.81,196.00],[196.00,246.94,293.66],[220.00,261.63,329.63],[174.61,220.00,261.63]];
    const ch = chords[musicBar % 4]; musicBar++;
    ch.forEach(f => _tone(f, t, bar * 0.95, 'triangle', 0.09, a.music));      // colchón de acordes
    _tone(ch[0] / 2, t, bar * 0.5, 'sawtooth', 0.15, a.music);                // bajo
    _tone(ch[0] / 2, t + bar * 0.5, bar * 0.45, 'sawtooth', 0.15, a.music);
    _tone(ch[1] * 2, t + bar * 0.5, 0.22, 'square', 0.05, a.music);           // bronce
    for(let b = 0; b < 4; b++){
      const bt = t + bar * (b / 4);
      if(b % 2 === 0){
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(120, bt); o.frequency.exponentialRampToValueAtTime(45, bt + 0.1);
        g.gain.setValueAtTime(0.0001, bt); g.gain.exponentialRampToValueAtTime(0.5, bt + 0.006); g.gain.exponentialRampToValueAtTime(0.0008, bt + 0.12);
        o.connect(g); g.connect(a.music); o.start(bt); o.stop(bt + 0.14);     // bombo
      } else { _noise(bt, 0.12, 0.1, 'highpass', 2000, a.music); }            // redoblante
    }
  }
  musicTimer = setTimeout(playAnthemBar, bar * 1000);
}
function startMusic(){ ensureAudio(); if(!audioCtx || musicTimer) return; musicBar = 0; playAnthemBar(); }
function stopMusic(){ if(musicTimer){ clearTimeout(musicTimer); musicTimer = null; } }

// ===== MÚSICA DE FONDO SCI-FI / ELECTRÓNICA (menú + tutorial) =====
function stopBg(){ if(bgTimer){ clearTimeout(bgTimer); bgTimer = null; } bgKind = null; }
function startBg(kind){ ensureAudio(); if(!audioCtx) return; if(bgKind === kind) return; stopBg(); bgKind = kind; bgBar = 0; (kind === 'tut' ? tutBar : menuBar)(); }
function menuBar(){
  if(bgKind !== 'menu' || !audioCtx) return;
  const a = ensureAudio(); const bar = 1.6;
  if(!audioMuted && a){
    const t = audioCtx.currentTime + 0.04;
    const roots = [110.00, 87.31, 130.81, 98.00];                 // Am F C G
    const prog = [[220,261.63,329.63],[174.61,220,261.63],[261.63,329.63,392],[196,246.94,293.66]];
    const ch = prog[bgBar % 4], root = roots[bgBar % 4]; bgBar++;
    ch.forEach(f => _tone(f, t, bar * 0.98, 'sawtooth', 0.05, a.music));        // pad
    for(let i = 0; i < 4; i++) _tone(root, t + bar * (i / 4), bar * 0.22, 'square', 0.11, a.music);  // bajo pulsante
    const arp = [ch[0], ch[1], ch[2], ch[1] * 2, ch[2], ch[1], ch[0] * 2, ch[1]];
    for(let i = 0; i < 8; i++) _tone(arp[i], t + bar * (i / 8), bar * 0.12, 'triangle', 0.05, a.music);   // arpegio
    for(let b = 0; b < 4; b++){
      const bt = t + bar * (b / 4);
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(110, bt); o.frequency.exponentialRampToValueAtTime(42, bt + 0.09);
      g.gain.setValueAtTime(0.0001, bt); g.gain.exponentialRampToValueAtTime(0.34, bt + 0.005); g.gain.exponentialRampToValueAtTime(0.0008, bt + 0.11);
      o.connect(g); g.connect(a.music); o.start(bt); o.stop(bt + 0.12);          // bombo 4x4
      _noise(bt + bar / 8, 0.05, 0.04, 'highpass', 6500, a.music);               // hat en contratiempo
    }
    _tone(ch[2] * 2, t, bar * 0.6, 'sine', 0.03, a.music);                       // shimmer
  }
  bgTimer = setTimeout(menuBar, bar * 1000);
}
function tutBar(){
  if(bgKind !== 'tut' || !audioCtx) return;
  const a = ensureAudio(); const bar = 2.0;
  if(!audioMuted && a){
    const t = audioCtx.currentTime + 0.04;
    const roots = [73.42, 98.00, 87.31, 65.41];                   // Dm G F C (más etéreo)
    const prog = [[146.83,174.61,220],[196,246.94,293.66],[174.61,220,261.63],[130.81,164.81,196]];
    const ch = prog[bgBar % 4], root = roots[bgBar % 4]; bgBar++;
    ch.forEach(f => _tone(f, t, bar * 0.98, 'sine', 0.07, a.music));             // pad etéreo
    _tone(root, t, bar * 0.9, 'sawtooth', 0.06, a.music);                        // bajo largo
    const arp = [ch[0], ch[2], ch[1], ch[2] * 2];
    for(let i = 0; i < 4; i++) _tone(arp[i], t + bar * (i / 4), bar * 0.2, 'triangle', 0.045, a.music);
    for(let b = 0; b < 2; b++){
      const bt = t + bar * (b / 2);
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(90, bt); o.frequency.exponentialRampToValueAtTime(40, bt + 0.1);
      g.gain.setValueAtTime(0.0001, bt); g.gain.exponentialRampToValueAtTime(0.22, bt + 0.006); g.gain.exponentialRampToValueAtTime(0.0008, bt + 0.13);
      o.connect(g); g.connect(a.music); o.start(bt); o.stop(bt + 0.14);          // pulso suave
    }
    _noise(t, bar * 0.5, 0.018, 'bandpass', 1200, a.music);                      // aire sci-fi
  }
  bgTimer = setTimeout(tutBar, bar * 1000);
}
function toggleMute(){ audioMuted = !audioMuted; const a = ensureAudio(); if(a) a.master.gain.value = audioMuted ? 0 : 0.9; return audioMuted; }

function showFoulBanner(text, ms){
  const el = document.getElementById('foulBanner');
  if(!el) return;
  el.textContent = text;
  el.classList.add('show');
  if(_foulBannerTO){ clearTimeout(_foulBannerTO); _foulBannerTO = null; }
  const dur = ms ? Math.min(ms, 1300) : 1300;   // carteles cortos para no molestar
  _foulBannerTO = setTimeout(() => el.classList.remove('show'), dur);
}

// --- PORTEROS: 1 por arco, se mueven lateralmente sobre la línea y atajan ---
function spawnGoalkeepers(){
  goalkeepers = [];
  if(!goalAreas || goalAreas.length < 1) return;
  const rivalKey = currentRival || ((currentTeam === 'rezona') ? 'saurrex' : 'rezona');
  for(const g of goalAreas){
    // teamForGoal==='them' => arco que DEFENDEMOS => arquero nuestro
    // teamForGoal==='us'   => arco rival          => arquero rival
    const defendTeam = (g.teamForGoal === 'them') ? 'us' : 'them';
    const teamKey = (defendTeam === 'us') ? currentTeam : rivalKey;
    const gk = buildPlayer(teamKey, KEEPER_DATA);
    gk.team = defendTeam;
    gk.isKeeper = true;
    gk.root.scale.multiplyScalar(0.6);

    const mainAxis = fieldAxis;                  // eje largo de la cancha (arcos en sus extremos)
    const widthAxis = (mainAxis === 'x') ? 'z' : 'x';
    const size = new THREE.Vector3(); g.bbox.getSize(size);
    const halfWidth = Math.max(0.8, ((widthAxis === 'x') ? size.x : size.z) / 2 - 0.3);
    const inset = 1.4;                           // se para 1.4m por delante de la red
    const gc = g.center;
    const mainVal = (mainAxis === 'x') ? gc.x : gc.z;
    const sign = mainVal >= 0 ? 1 : -1;
    gk.gkMainAxis = mainAxis;
    gk.gkWidthAxis = widthAxis;
    gk.gkMainCoord = mainVal - sign * inset;
    gk.gkHalfWidth = halfWidth;
    gk.gkCenterW = (widthAxis === 'x') ? gc.x : gc.z;
    gk.gkSaveCD = 0;

    const px = (mainAxis === 'x') ? gk.gkMainCoord : gk.gkCenterW;
    const pz = (mainAxis === 'x') ? gk.gkCenterW : gk.gkMainCoord;
    gk.root.position.set(px, getGroundHeight(px, pz), pz);
    scene.add(gk.root);
    buildPlayerAnimations(gk);
    playerSetAnim(gk, 'idle');
    goalkeepers.push(gk);
  }
  console.log('[gk] porteros spawneados:', goalkeepers.length);
}

function updateGoalkeepers(dt){
  if(matchOver || fieldTut) return;
  // Durante festejo de gol O saques (setPiece/kickoff): arqueros quietos en idle.
  if(celebrating || kickoffPending || setPiece || kickoffActive){
    for(const gk of goalkeepers){ if(gk && gk.root && gk !== player) playerSetAnim(gk, 'idle'); }
    return;
  }
  const gkSpeed = 3.0;   // más lento: no llega a todos los tiros (a veces ataja, a veces no)
  for(const gk of goalkeepers){
    if(!gk.root) continue;
    if(gk === player) continue;  // si lo controlás vos (saque de arco), no lo maneja la IA
    gk.gkSaveCD = Math.max(0, gk.gkSaveCD - dt);
    const widthAxis = gk.gkWidthAxis, mainAxis = gk.gkMainAxis;

    // Seguir la pelota lateralmente SOLO cuando está cerca del arco (si no, recentra).
    // Así un contraataque rápido lo puede agarrar mal parado.
    const ballMain = ballModel ? ((mainAxis === 'x') ? ballModel.position.x : ballModel.position.z) : gk.gkMainCoord;
    const ballW = ballModel ? ((widthAxis === 'x') ? ballModel.position.x : ballModel.position.z) : gk.gkCenterW;
    const near = ballModel && Math.abs(ballMain - gk.gkMainCoord) < 14;
    const desiredW = near ? ballW : gk.gkCenterW;
    const targetW = Math.max(gk.gkCenterW - gk.gkHalfWidth, Math.min(gk.gkCenterW + gk.gkHalfWidth, desiredW));
    const curW = (widthAxis === 'x') ? gk.root.position.x : gk.root.position.z;
    const dW = targetW - curW;
    const step = Math.max(-gkSpeed * dt, Math.min(gkSpeed * dt, dW));
    const newW = curW + step;
    if(mainAxis === 'x'){ gk.root.position.x = gk.gkMainCoord; gk.root.position.z = newW; }
    else                { gk.root.position.z = gk.gkMainCoord; gk.root.position.x = newW; }
    gk.root.position.y = getGroundHeight(gk.root.position.x, gk.root.position.z);

    // Mirar hacia el centro de la cancha (de donde viene la pelota)
    let dcx = -gk.root.position.x, dcz = -gk.root.position.z;
    const dl = Math.hypot(dcx, dcz) || 1; dcx /= dl; dcz /= dl;
    const targetRot = Math.atan2(-dcx, -dcz);
    let cur = gk.root.rotation.y, diff = targetRot - cur;
    while(diff > Math.PI) diff -= Math.PI * 2;
    while(diff < -Math.PI) diff += Math.PI * 2;
    gk.root.rotation.y = cur + diff * Math.min(1, 10 * dt);

    // Animación: lateral = walk, quieto = idle
    if(Math.abs(step) > gkSpeed * dt * 0.4) playerSetAnim(gk, 'walk', 1.1);
    else playerSetAnim(gk, 'idle');

    // SMOTHER (regla anti "meterla caminando"): si un rival DRIBLEA súper cerca del arco,
    // el arquero le saca la pelota a la fuerza y hace saque de arco. Desde afuera podés rematar igual.
    if(ballOwner && !ballOwner.isKeeper && ballOwner.team !== gk.team && gk.gkSaveCD <= 0 && !setPiece && !kickoffActive && !celebrating){
      const myGoalS = goalAreas.find(a => a.teamForGoal !== gk.team);
      const ballToGoalS = myGoalS ? Math.hypot(ballModel.position.x - myGoalS.center.x,
                                               ballModel.position.z - myGoalS.center.z) : 999;
      const dCarrier = Math.hypot(ballOwner.root.position.x - gk.root.position.x,
                                  ballOwner.root.position.z - gk.root.position.z);
      if(ballToGoalS < 2.2 && dCarrier < 1.6){
        ballOwner = gk; lastTouchTeam = gk.team; ballHomingTarget = null;
        ballVelocity.set(0, 0, 0); gk.gkSaveCD = 1.6;
        playerSetAnim(gk, 'kick', 1.3);
        showFoulBanner(t('Saque de arco'), 1400);
        setTimeout(() => keeperDistribute(gk), 700);
        continue;   // ya resolvió este arquero este frame
      }
    }

    // ATAJADA: cuando la pelota suelta entra cerca del arco. Detecta tanto proximidad
    // como la pelota ENTRANDO rápido (anti-túnel: un tiro veloz no se "saltea" entre frames).
    if(ballModel && !ballOwner && !ballHomingTarget && freeKickPause <= 0 && gk.gkSaveCD <= 0){
      const myGoal = goalAreas.find(a => a.teamForGoal !== gk.team);   // arco que defiende este arquero
      const ballToGoal = myGoal ? Math.hypot(ballModel.position.x - myGoal.center.x,
                                              ballModel.position.z - myGoal.center.z) : 999;
      const d = Math.hypot(ballModel.position.x - gk.root.position.x,
                           ballModel.position.z - gk.root.position.z);
      // distancia al segmento que recorrió la pelota este frame (anti-túnel)
      let dPath = d;
      if(gk._ballPrev){
        const ax = gk._ballPrev.x, az = gk._ballPrev.z;
        const bx = ballModel.position.x, bz = ballModel.position.z;
        const abx = bx-ax, abz = bz-az; const L2 = abx*abx+abz*abz;
        if(L2 > 1e-5){
          let tt = ((gk.root.position.x-ax)*abx + (gk.root.position.z-az)*abz)/L2;
          tt = Math.max(0, Math.min(1, tt));
          dPath = Math.hypot(gk.root.position.x-(ax+abx*tt), gk.root.position.z-(az+abz*tt));
        }
      }
      const reach = 1.5;   // radio de atajada (antes 0.8, muy chico para tiros veloces)
      if((d < reach || dPath < reach) && ballToGoal < 3.4){
        ballOwner = gk; lastTouchTeam = gk.team;                 // la atrapa (la pega al arquero)
        ballVelocity.set(0, 0, 0);
        gk.gkSaveCD = 1.2;
        playerSetAnim(gk, (gk.actions && gk.actions.dive) ? 'dive' : 'kick', 1.2);   // ¡CLAVADA!
        showFoulBanner(t('¡ATAJADA!'), 900);
        // REGLA: el equipo rival al arquero debe RETROCEDER (caminando) fuera del área
        if(myGoal) retreatBehindLine(gk.team === 'us' ? 'them' : 'us', myGoal.center);
        // Saca jugando: SIEMPRE pase directo a un compañero
        setTimeout(() => keeperDistribute(gk), 900);
      }
    }
    // guardar posición de la pelota para el cálculo anti-túnel del próximo frame
    if(ballModel){ gk._ballPrev = gk._ballPrev || new THREE.Vector3(); gk._ballPrev.copy(ballModel.position); }
  }
}

// --- FALTAS: el jugador embiste a un rival en sprint -> tiro libre rival ---
function updateFouls(dt){
  if(fieldTut) return;
  foulCooldown = Math.max(0, foulCooldown - dt);
  if(matchOver || freeKickPause > 0 || setPiece || foulCooldown > 0) return;
  if(!player || !player.root) return;
  if(!player._fLast){ player._fLast = new THREE.Vector3().copy(player.root.position); return; }
  const spd = player.root.position.distanceTo(player._fLast) / Math.max(dt, 0.001);
  player._fLast.copy(player.root.position);

  // FALTA DEL JUGADOR: entrada a la carrera sobre un rival
  if(buttons.sprint && spd > 4.6){
    for(const r of rivals){
      if(!r.root) continue;
      const d = Math.hypot(player.root.position.x - r.root.position.x, player.root.position.z - r.root.position.z);
      if(d < 0.72){
        const mid = new THREE.Vector3((player.root.position.x + r.root.position.x) / 2, 0, (player.root.position.z + r.root.position.z) / 2);
        commitFoul(player, 'them', mid, spd);   // falta nuestra → tiro libre/penal rival
        return;
      }
    }
  }

  // FALTA DE RIVAL: un rival que corre fuerte choca a nuestro poseedor → falta a favor
  const carrier = (ballOwner && ballOwner.team === 'us') ? ballOwner : null;
  if(carrier && carrier.root){
    for(const r of rivals){
      if(!r.root) continue;
      if(!r._fLast){ r._fLast = new THREE.Vector3().copy(r.root.position); continue; }
      const rspd = r.root.position.distanceTo(r._fLast) / Math.max(dt, 0.001);
      r._fLast.copy(r.root.position);
      const d = Math.hypot(carrier.root.position.x - r.root.position.x, carrier.root.position.z - r.root.position.z);
      if(rspd > 5 && d < 0.7 && Math.random() < 0.04){   // contacto fuerte ocasional = falta
        const mid = new THREE.Vector3((carrier.root.position.x + r.root.position.x) / 2, 0, (carrier.root.position.z + r.root.position.z) / 2);
        commitFoul(r, 'us', mid, rspd);   // falta del rival → tiro libre/penal nuestro
        return;
      }
    }
  }
}

function awardFreeKick(forTeam, atPos){
  if(!ballModel) return;
  foulCooldown = 12;
  freeKickPause = 1.8;
  ballOwner = null;
  ballVelocity.set(0, 0, 0);
  let bx = atPos.x, bz = atPos.z;
  if(fieldLimits){
    const m = 1.0;
    bx = Math.max(fieldLimits.minX + m, Math.min(fieldLimits.maxX - m, bx));
    bz = Math.max(fieldLimits.minZ + m, Math.min(fieldLimits.maxZ - m, bz));
  }
  ballModel.position.set(bx, getGroundHeight(bx, bz) + 0.095, bz);

  // El más cercano del equipo beneficiado toma el tiro al terminar la pausa
  const rivalKey = currentRival || ((currentTeam === 'rezona') ? 'saurrex' : 'rezona');
  const squad = (forTeam === 'us') ? [player, ...teammates] : rivals;
  let best = null, bd = 1e9;
  for(const e of squad){
    if(!e || !e.root) continue;
    const d = e.root.position.distanceTo(ballModel.position);
    if(d < bd){ bd = d; best = e; }
  }
  pendingFKOwner = best;
  const teamName = (forTeam === 'us') ? TEAMS[currentTeam].name : TEAMS[rivalKey].name;
  showFoulBanner('⚠ FALTA — Tiro libre: ' + teamName, 0);
  playWhistle();
}

function updateFreeKick(dt){
  if(freeKickPause <= 0) return;
  freeKickPause -= dt;
  if(freeKickPause <= 0){
    freeKickPause = 0;
    document.getElementById('foulBanner').classList.remove('show');
    if(pendingFKOwner && pendingFKOwner.root && !ballOwner) ballOwner = pendingFKOwner;
    pendingFKOwner = null;
  }
}

// ===== TARJETAS / EXPULSIÓN (Ley 12) =====
function showCard(color){
  const el = document.getElementById('cardPop'); if(!el) return;
  el.className = ''; void el.offsetWidth; el.classList.add(color, 'show');
  setTimeout(() => el.classList.remove('show'), 1300);
}
function sendOff(ent){
  if(!ent || !ent.root) return;
  ent._sentOff = true; ent.root.visible = false;
  const wasPlayer = (ent === player);
  let i = rivals.indexOf(ent); if(i >= 0) rivals.splice(i, 1);
  i = teammates.indexOf(ent); if(i >= 0) teammates.splice(i, 1);
  ent.root.position.set(9999, -50, 9999);
  if(wasPlayer){
    const repl = teammates.find(t => t && t.root && !t.isKeeper && !t._sentOff);
    if(repl){ const j = teammates.indexOf(repl); if(j >= 0) teammates.splice(j, 1);
      repl.isPlayer = true; repl._fLast = null; player = repl; cameraMode = 'player'; }
  }
}
function giveCard(offender, hard){
  if(!offender) return;
  offender._yellows = offender._yellows || 0;
  if(hard){ showCard('red'); setTimeout(() => sendOff(offender), 700); }
  else {
    offender._yellows++;
    if(offender._yellows >= 2){ showCard('red'); setTimeout(() => sendOff(offender), 700); }
    else showCard('yellow');
  }
}

// ===== PENAL (Ley 14) =====
function awardPenalty(forTeam){
  const goal = (forTeam === 'us') ? theirGoalPos : ourGoalPos;
  if(!goal){ awardFreeKick(forTeam, getFieldCenter()); return; }
  const dir = new THREE.Vector3().subVectors(getFieldCenter(), goal); dir.y = 0;
  if(dir.lengthSq() < 0.001) dir.set(1, 0, 0); else dir.normalize();
  const spot = goal.clone().addScaledVector(dir, 6); spot.y = fieldGroundY;
  foulCooldown = 12; freeKickPause = 0; ballOwner = null; ballVelocity.set(0, 0, 0);
  const rivalKey = currentRival || ((currentTeam === 'rezona') ? 'saurrex' : 'rezona');
  const teamName = (forTeam === 'us') ? TEAMS[currentTeam].name : TEAMS[rivalKey].name;
  showFoulBanner((LANG==='en'?'⚽ PENALTY! · ':'⚽ ¡PENAL! · ') + teamName, 2400);
  playWhistle();
  beginSetPiece('penalty', forTeam, spot, nearestFieldPlayer(forTeam, spot));
}
// Decide penal vs tiro libre + tarjeta según dureza
function commitFoul(offender, forTeam, pos, spd){
  giveCard(offender, spd > 7.6);   // muy fuerte = roja directa
  const attackGoal = (forTeam === 'us') ? theirGoalPos : ourGoalPos;
  if(attackGoal && pos.distanceTo(attackGoal) < 7.5) awardPenalty(forTeam);
  else awardFreeKick(forTeam, pos);
}

// --- TIEMPO DE PARTIDO ---
function formatClock(s){
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return m + ':' + String(ss).padStart(2, '0');
}

function updateMatchClock(dt){
  if(matchOver || fieldTut) return;
  if(freeKickPause > 0 || goalCooldown > 0) return;  // pausa en tiro libre y festejo de gol
  matchTime += dt;
  const realInHalf = matchTime - halfStartReal;
  const addMin = (matchHalf === 1) ? addedMin1 : addedMin2;
  const addReal = Math.max(0.5, addMin / 45 * HALF_REAL);
  const el = document.getElementById('matchClock');
  const fbSec = (matchHalf - 1) * HALF_FB + Math.min(HALF_FB, (realInHalf / HALF_REAL) * HALF_FB);
  let label = '';
  if(realInHalf > HALF_REAL){   // tiempo de descuento: 45+X / 90+X
    label = ' +' + Math.min(addMin, Math.floor((realInHalf - HALF_REAL) / addReal * addMin) + 1);
  }
  if(el){
    el.textContent = formatClock(fbSec) + label;
    el.classList.toggle('low', realInHalf >= HALF_REAL);
  }
  // Fin del primer tiempo (con descuento) → entretiempo
  if(matchHalf === 1 && realInHalf >= HALF_REAL + addReal){ doHalftime(); return; }
  // Fin del partido (con descuento del 2T)
  if(matchHalf === 2 && realInHalf >= HALF_REAL + addReal) endMatch();
}

// Recalcula direcciones y arcos a partir de goalAreas (tras invertir lados)
function recomputeSides(){
  const ourGoal = goalAreas.find(g => g.teamForGoal === 'them');
  const theirGoal = goalAreas.find(g => g.teamForGoal === 'us');
  if(ourGoal && theirGoal){
    const fwd = new THREE.Vector3().subVectors(theirGoal.center, ourGoal.center);
    fwd.y = 0; fwd.normalize();
    fieldFwd.copy(fwd);
    fieldSide.set(-fwd.z, 0, fwd.x);
    ourGoalPos = ourGoal.center.clone();
    theirGoalPos = theirGoal.center.clone();
  }
}

function doHalftime(){
  if(halftimeActive) return;
  matchHalf = 2;                 // marca el 2T ya (evita re-disparar)
  halftimeActive = true; halftimeTimer = 0; halftimeSwitched = false;
  freeKickPause = 0; setPiece = null; kickoffActive = false; passInFlight = false;
  ballOwner = null; ballVelocity.set(0, 0, 0);
  // CORTE: barras de cine + cartel + silbato largo
  const bars = document.getElementById('cinemaBars'); if(bars) bars.classList.add('on');
  const ht = document.getElementById('halftimeText');
  if(ht){
    ht.querySelector('.htBig').textContent = (LANG === 'en') ? '⏱ HALF-TIME' : '⏱ ENTRETIEMPO';
    ht.querySelector('.htSub').textContent = (LANG === 'en') ? 'Switching sides' : 'Cambio de lado';
    ht.classList.add('on');
  }
  playWhistle(); setTimeout(playWhistle, 200); setTimeout(playWhistle, 400);   // pitido largo de fin del 1T
  // Poses de descanso/preparación para el corte
  for(const e of [player, ...teammates, ...rivals]){ if(e && e.root) playerSetAnim(e, 'idle'); }
  for(const gk of goalkeepers){ if(gk && gk.root) playerSetAnim(gk, 'idle'); }
}
// Invierte lados (se hace DETRÁS de las barras, en mitad de la cinemática)
function doHalftimeSwitch(){
  for(const g of goalAreas){ g.teamForGoal = (g.teamForGoal === 'us') ? 'them' : 'us'; }
  recomputeSides();
  for(const gk of goalkeepers){ scene.remove(gk.root); if(gk.mixer) gk.mixer.stopAllAction(); }
  goalkeepers = [];
  spawnGoalkeepers();
  ballOwner = null; ballVelocity.set(0, 0, 0);
  if(ballModel) ballModel.position.copy(getFieldCenter());
}
function updateHalftime(dt){
  halftimeTimer += dt;
  // Cámara: barrido orbital lento sobre el CENTRO de la cancha
  const C = getFieldCenter();
  const ang = Math.PI + halftimeTimer * 0.5;
  const radius = 13, height = 6.5;
  camera.position.set(C.x + Math.sin(ang) * radius, C.y + height, C.z + Math.cos(ang) * radius);
  camera.lookAt(C.x, C.y + 1.0, C.z);
  // A mitad del corte (detrás de las barras) invierte los lados
  if(!halftimeSwitched && halftimeTimer >= 1.8){ halftimeSwitched = true; doHalftimeSwitch(); }
  // Fin del corte: silbato de reanudación + saque del centro del 2T
  if(halftimeTimer >= 3.6){
    halftimeActive = false;
    const bars = document.getElementById('cinemaBars'); if(bars) bars.classList.remove('on');
    const ht = document.getElementById('halftimeText'); if(ht) ht.classList.remove('on');
    halfStartReal = matchTime;   // el descuento del 2T arranca desde acá
    playWhistle();               // pitido de reanudación
    startKickoff();              // saque del centro del segundo tiempo
  }
}

function endMatch(){
  if(matchOver) return;
  matchOver = true;
  const team = TEAMS[currentTeam];
  document.getElementById('ftScore').textContent = scoreUs + ' - ' + scoreThem;
  let res, reward;
  if(scoreUs > scoreThem){ res = t('¡GANASTE! 🏆'); reward = 15; }
  else if(scoreUs < scoreThem){ res = t('PERDISTE'); reward = 5; }
  else { res = t('EMPATE'); reward = 8; }
  // Misiones + ranking de ligas (autoguardado)
  try{
    const rk = (scoreUs > scoreThem) ? 'win' : (scoreUs < scoreThem ? 'loss' : 'draw');
    if(rk === 'win' && window.quest) window.quest('win', 1);
    if(window.leagueResult) window.leagueResult(rk);
  }catch(e){}
  // Premio en monedas (autoguardado) para abrir sobres de figuritas
  let total = reward;
  try{ if(window.addCoins){ window.addCoins(reward); total = window.getCoins ? window.getCoins() : reward; } }catch(e){}
  const coinLine = (LANG === 'en') ? ('🪙 +' + reward + '  (total ' + total + ')') : ('🪙 +' + reward + '  (total ' + total + ')');
  document.getElementById('ftResult').innerHTML = res + '  (' + team.name + ')<br><span style="color:#ffd24a;font-size:16px">' + coinLine + '</span>';
  document.getElementById('fullTime').classList.add('show');
  // CINEMÁTICA DE FONDO: tomas cercanas a los jugadores con animaciones
  matchEndCine = true; endCineTimer = 99; endCineShot = 0; endCineTarget = null;
  const weWon = scoreUs > scoreThem, weLost = scoreUs < scoreThem;
  const prep = e => playRandomEmote(e);
  for(const e of [player, ...teammates]){ if(e && e.root) (weWon ? prep(e) : playerSetAnim(e, 'idle')); }
  for(const e of rivals){ if(e && e.root) (weLost ? prep(e) : playerSetAnim(e, 'idle')); }
  for(const gk of goalkeepers){ if(gk && gk.root) playerSetAnim(gk, 'idle'); }
  playWhistle();
  setTimeout(playWhistle, 220);
  setTimeout(playWhistle, 440);  // pitido triple = final
}
function updateEndCine(dt){
  endCineTimer += dt;
  const pool = [player, ...teammates, ...rivals, ...goalkeepers].filter(e => e && e.root);
  if(!pool.length) return;
  if(!endCineTarget || !endCineTarget.root || endCineTimer > 2.6){
    endCineTimer = 0; endCineShot++;
    endCineTarget = pool[Math.floor(Math.random() * pool.length)];
    // refrescar emotes de los ganadores en cada corte → festejos variados
    const weWon = scoreUs > scoreThem, weLost = scoreUs < scoreThem;
    if(weWon){ for(const e of [player, ...teammates]){ if(e && e.root && Math.random() < 0.6) playRandomEmote(e); } }
    if(weLost){ for(const e of rivals){ if(e && e.root && Math.random() < 0.6) playRandomEmote(e); } }
  }
  const pp = endCineTarget.root.position;
  const ang = performance.now() * 0.00035 + endCineShot * 1.7;
  const radius = 2.8 + (endCineShot % 3) * 0.7, height = 1.7 + (endCineShot % 2) * 0.5;
  camera.position.set(pp.x + Math.sin(ang) * radius, pp.y + height, pp.z + Math.cos(ang) * radius);
  camera.lookAt(pp.x, pp.y + 1.1, pp.z);
}

function restartMatch(){
  if(player){ scene.remove(player.root); if(player.mixer) player.mixer.stopAllAction(); player = null; }
  for(const tm of teammates){ scene.remove(tm.root); if(tm.mixer) tm.mixer.stopAllAction(); }
  teammates = [];
  for(const r of rivals){ scene.remove(r.root); if(r.mixer) r.mixer.stopAllAction(); }
  rivals = [];
  for(const gk of goalkeepers){ scene.remove(gk.root); if(gk.mixer) gk.mixer.stopAllAction(); }
  goalkeepers = [];
  ballOwner = null; ballVelocity.set(0, 0, 0);
  if(ballModel) ballModel.position.set(0, 0.11, 0);
  cameraMode = 'player'; cameraBallTimer = 0;
  slowmo = 1; celebrating = false; kickoffActive = false; setPiece = null;
  matchEndCine = false; endCineTarget = null;
  if(celebGroup){ scene.remove(celebGroup); celebGroup = null; }
  if(celebLight){ scene.remove(celebLight); celebLight = null; }
  document.getElementById('goalFlash').classList.remove('on');
  document.getElementById('fullTime').classList.remove('show');
  startGame(currentTeam, chosenPlayerIndex, false);  // replay sin cinemática
}

// === CINEMÁTICA DE INICIO ===
function startCinematic(){
  cinematicActive = true;
  cinematicTimer = 0;
  cinematicStartYaw = cameraOrbit.yaw;
  const bars = document.getElementById('cinemaBars');
  if(bars) bars.classList.add('on');
  // Poses de preparación random para todos los jugadores de campo (de los 20 emotes)
  for(const e of [player, ...teammates, ...rivals]){
    if(!e || !e.root) continue;
    playRandomEmote(e, 0.85, 1.25);
  }
  for(const gk of goalkeepers){ if(gk && gk.root) playerSetAnim(gk, 'idle'); }
}
function updateCinematic(dt){
  cinematicTimer += dt;
  const dur = 4.5;
  const t = Math.min(1, cinematicTimer / dur);
  const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;  // easeInOutQuad
  const pp = player.root.position;
  const ang = cinematicStartYaw + t * 2.4;     // barrido orbital
  const radius = 12 - 7 * ease;                 // 12 → 5
  const height = 7 - 4.2 * ease;                // 7 → 2.8
  camera.position.set(
    pp.x + Math.sin(ang) * radius,
    pp.y + height,
    pp.z + Math.cos(ang) * radius
  );
  camera.lookAt(pp.x, pp.y + 1.0, pp.z);
  if(cinematicTimer >= dur) endCinematic(ang);
}
function endCinematic(finalAng){
  cinematicActive = false;
  if(finalAng !== undefined) cameraOrbit.yaw = finalAng;  // handoff suave a la cámara normal
  const bars = document.getElementById('cinemaBars');
  if(bars) bars.classList.remove('on');
  playWhistle();  // pitido de arranque del partido
  if(!tutorialSeen) startFieldTutorial();  // tutorial EN CANCHA la primera vez
  else maybeStartKickoff();          // si no, saque del centro directo
}

// === TUTORIAL ===
function positionTutRing(){
  const step = TUT_STEPS[tutIndex];
  const el = document.getElementById(step.target);
  const ring = document.getElementById('tutRing');
  if(!el || !ring) return;
  const r = el.getBoundingClientRect();
  const size = Math.max(r.width, r.height) + 28;
  ring.style.width = size + 'px';
  ring.style.height = size + 'px';
  ring.style.left = (r.left + r.width / 2 - size / 2) + 'px';
  ring.style.top = (r.top + r.height / 2 - size / 2) + 'px';
}
function showTutorialStep(){
  const step = TUT_STEPS[tutIndex];
  document.getElementById('tutStep').textContent = (LANG==='en'?'STEP ':'PASO ') + (tutIndex + 1) + ' / ' + TUT_STEPS.length;
  document.getElementById('tutTitle').textContent = t(step.title);
  document.getElementById('tutDesc').textContent = t(step.desc);
  document.getElementById('tutBtn').textContent = (tutIndex === TUT_STEPS.length - 1) ? t('¡A JUGAR!') : t('SIGUIENTE →');
  positionTutRing();
}
function openTutorial(){
  tutIndex = 0;
  tutorialActive = true;
  document.getElementById('tutorial').classList.add('show');
  showTutorialStep();
}
function closeTutorial(){
  tutorialActive = false;
  tutorialSeen = true;
  document.getElementById('tutorial').classList.remove('show');
  maybeStartKickoff();
}

// === TUTORIAL EN CANCHA (primera vez, jugás solo) ===
let fieldTut = null;
function tutHintEl(){
  let e = document.getElementById('fieldTutHint');
  if(!e){ e = document.createElement('div'); e.id = 'fieldTutHint'; (document.getElementById('rotor')||document.body).appendChild(e); }
  return e;
}
function tutBanner(es, en){ pxCoachSay(es, en); }
function tutHide(){ pxCoachHide(); const e = document.getElementById('fieldTutHint'); if(e) e.style.display = 'none'; }
function setEntityHidden(e, hidden){
  if(e && e.root){ e.root.visible = !hidden; e._tutHidden = hidden;
    if(hidden){ e.root.position.set(9999, -50, 9999); }   // fuera de juego para que no toque la pelota
  }
}
function parkAwayForTutorial(){
  // Jugás SOLO: ocultamos rivales de campo y compañeros (los traemos cuando hagan falta)
  for(const r of rivals) setEntityHidden(r, true);
  for(const tm of teammates) setEntityHidden(tm, true);
}
function restoreEntitiesAfterTutorial(){
  for(const r of rivals) if(r && r.root){ r.root.visible = true; r._tutHidden = false; }
  for(const tm of teammates) if(tm && tm.root){ tm.root.visible = true; tm._tutHidden = false; }
}
function giveBallAtCenter(){
  const c = getFieldCenter();
  player.root.position.set(c.x, c.y, c.z); faceTowardsGoal(player, theirGoalPos);
  ballOwner = player; lastTouchTeam = 'us'; ballVelocity.set(0, 0, 0);
  if(ballModel) ballModel.position.copy(player.root.position);
  playerSetAnim(player, 'idle');
}
// Pone al jugador con la pelota a ~8m del arco rival, de frente: tiro fácil para el tutorial
function giveBallForShot(){
  const goal = theirGoalPos || getFieldCenter();
  const dir = new THREE.Vector3().subVectors(goal, getFieldCenter()); dir.y = 0;
  if(dir.lengthSq() < 0.001) dir.set(1, 0, 0); else dir.normalize();
  const spot = goal.clone().addScaledVector(dir, -8); clampField(spot); spot.y = fieldGroundY;
  player.root.position.copy(spot); faceTowardsGoal(player, goal);
  ballOwner = player; lastTouchTeam = 'us'; ballVelocity.set(0, 0, 0);
  if(ballModel) ballModel.position.copy(player.root.position);
  playerSetAnim(player, 'idle');
}
// ¿La pelota entró al arco que atacás? (misma caja que los goles reales)
function tutGoalScored(){
  if(!ballModel || ballOwner) return false;
  const FC = getFieldCenter();
  const g = goalAreas.find(a => a.teamForGoal === 'us');
  if(!g || !g.bbox) return false;
  const tb = g.bbox.clone();
  if(fieldAxis === 'z'){ if(g.center.z < FC.z) tb.max.z += 1.4; else tb.min.z -= 1.4; }
  else { if(g.center.x < FC.x) tb.max.x += 1.4; else tb.min.x -= 1.4; }
  return tb.containsPoint(ballModel.position);
}
// ════════ COACH (mascota Charmander FIFA, imágenes del repo) ════════
// Poses: cross=serio, glasses=tip, clipboard=explica, side=perfil.
const COACH_POSES = {
  cross: 'data:image/png;base64,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',
  glasses: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKcAAADcCAYAAAAV87HuAAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAADVnklEQVR42uy9d7xeVZX//957n3OefnvJTe+NTkIvFxAEAZVisIxlLIOKOjq2GcfRGNuMYxvH9hMboqAQLEgRFYXQW2gJ6T25ub0+9ZS99++Pc+7NDU1U9Osgh9fzCnlyy3nOWWeVz/qszxK8ePxRx8qVK+Xtq26Xa1gTjb9nrXVvvwJ1zU8/8frefbtmPf7oXRqC1gWzD7msVh7DRgHaVLEEKKXQRqMNSOXheFlbyNWLXbu3XFHRdveZJ16gXLfw069/4jObUmena0HgT/zuTjqdNazRgP17uNbiRXN77ka5atUqAJMYpHjraf9+yK5ta88UUr/Zr3a359KyfdqURupzgqnNGeoLiua6HLmUi+cohAIhBRaLEJJaaCmXfMZGKxTLIV2DJUbLIbv2DpQi6soDleDmpvr5jy8/4ez7PnfNOx8QUpjELMWKFSvk6tWr9YvG+aJRAhihJP/11u8c/auffu/4KBp+T9apzVkwpzXV2uZy1KJWZk4p2HzW0/mMRJmaEDpQNvKxUYhCYbHoSIMQKMcBIcFKlPTQSuiaMrbqw3BJOnu6K2zeOcqurhpbd/domanrEqL5S5/+8m8vP/l1TtVEmk46ndNWnmZWrVplXjTOv7MjCaORVIp3v2Tlsk0b7n1P5O+/ZMFUN3P0klaOWjKV1kZCzw2V8EcEkS+sNmA0mAhhNUpYRHKZxeTLbcf/sFhjMQK0I8E6GFzrZhoQqUZT0Z7ZuX/YfXzTHh7ZVmb33nBvS9thDy1e2vmlz1z/9ruwsGLFCrV69WrzQgv3LxrnM3tLC9gPnPexZfff/5t/ztihS45Y3JY+6fhZHD63OczImgpKgwJdFo4M0X6A67goITA6RAiLEiCsBWHACkA+7e+z1gICJRXGWIJIY6SLVSkC4aEyBZvK1tuyzpgntgw7d9y7l0e2jZqRov7nS9703sf+7fI33TXpftoXjfMFeiReSFtrnVMaTnwD9H7zuMNbUq84eS7zZtTpyO+XIiwJGQZkHAehA4QIEdJFazBGAwYlQWBjWxEWrATU0/5OYy3CxDbsOApjIqwEjcBIQSgE2oCTrgO33lqn1Ty2Y0Td8NuNrN+n7ZQZR//ztQ9/5wohRKmzs9NZs+ZAsfaicb7AwvilZ/7LYWvv+tXKw2bnLr7g7Ln2yPn1xikPSqNLQooKaSWQViK1iEO4iEAKrLEgLVIIrDVYksLaAjgHG6ed7Oss1hLnnwqsjbA2wgiDch00BpA4TopaAEblkYUWW5GN+tb798obbuuWo9Xcbae94jXnr7r87ZXxz/Gicb5AjmUsc9eKteHLl5x7TmVo9/UnH9rkve7cw8Os6XVseUA4UuI4Fkf66ChECQ9wEMIAGmE00lqMiL2ltRYrbJxTWlA4CJwnhXIQQiCFwAhBaE3ibQ0IG/+/EAghsVgkLiAxVhAIqIk0qn42+4fT4dXX3e/ev7G2eclx537yitv+8+pLl13qXr728vD/8j1RL5rlAcNcaKefk416fvHWi5a4rzpzvlZje9y0HhEeAUIYpPSx+AhpYkhIEntHGSUOUhxwiiLOMQ0ChESgDiqIhBAIceDrrbBoYbECbPK9CJXkqbHXtSiwEolAYnBkhF8aIi1CdcqyRVoq23rnPfddfOKhZ229cu0Vj61ghdrABvuicf4fN8wO23H2oqbc9R+69HTvxKUFwv7tKi9DpI2LGyEMFh9LhJAKaxTCqMS0NMaCRRL7O4lFYpK/g4w95JMC1bhxjntSKURcMo0brpVM2LkAK0wS7ARCgJIatI9LAP6YPPKQWTqTMfbueze96uQjXrd1dc8PHn/Vq16lNmz4v2mgf+9hXQH6mMZjzm5QQ9d/6NJzvSNmGasHtsqcDMBorBRERiNFhLE+Fo2ULsKmwSosBkScFcZWJrHWTvKKZuIXySRoT3jOON3EWnPACCfdEivsxPt23Ditg7UKYS3axB7daInAoapdnKZF+md398krbt5Rmvuy/2hZvfqS4P9qFS//nuEiQL/+5A+ek3Wq17/zH4/3DpsrbTSyXWa8CsKJsE7cDhJCxEiQcBE2hQkFAosVEcZGRNoijEDY2AaksAihEcRGLUQERFgbYo3GWEukLZE2GKPj4smCtg4GBysUSJn4SIu1GmMMaAHGItCJDSuE8BBCIjBkHENlYKt65SnTzLnHNuQ23/jxW27+ypa6CXf7ouf8v/PZrbXeS6edtvuUo3Pt/3jhUu0P7FD1qohnKxhrsFZhdexwpCR5z2JNHFYFApNU2koapJ3knJJOoxCx4ckkubQTeGecOxo01mgQCqPcOKQnd2bc9yY2j0zCvwaMMdjxsG/j9wWKwDrUvDr87Nzwc99+0N0xkP7UPX23fXyZ/Sd3LZdH/5c86N+l5+xkpQPYC+e/4p+mFCqtF7xkSVgb7lKurWJ1gBGSwCpCK7FJ/meNQlgXiYMUAoxBGI1rNZ4NsVYQCYkWCi0EBoVFYKzEotAoDDJ+X0gMEFqLEQrhpEAppKkiTQ1shDWWQINvFKFNoVUOX9Xhu/UETgOB24jONqOzbZj8FGyhA5HvwKtvBU+Qr7fOhRceZYKg993vfO1nG9dyeZgYprNs2aXuihXXqr91j/r34DlFZ+dKVVpzo1hL3pLgf9Za7/iWY7e+ZcWRM88+ocPIYpfMuhEOARrQQiGsQpkQpQN0ZImiEBMGWBNA5CNMiCNCXCWpyTQaiUSDtQgBUoAQNvGWifszkyBOEVfzBoGwEUrXYgNWGayTwThZpJfFCIUfCao2RakWUKn41MKQYqmMH4SAIIo0NrI4Cty8xMnVkW6eH15381b3trU7P3nJKz/03ye/5OXuRW9tHLFP7cSrTlaKNayKXjTOv7Qx0qmeFoQW8ND1NnvDD5+IHuj5yqXF3s1ffe0rjgj9wZ2uDEYR2kepGFE0Kk3aS5FxIO865LMZspk0+YxLyoGMDPEIsUEJYUKi8X46GgeDK8V4HCfJUBOrjMO0sRakS2QloQErXZxMAZRHOXIYCxRd/UV2dvXR01+kp3+YgUqNUtVHhwKkJIpsAtALrJBYI1BCkHIsGk3kOBR1mp4RGdQ1zqk25Fvo7dr31ZkzDilPnz572+bfb/jlEzuvlWq+qBn9ouf8Cx52PEuzAK7rEgSBvOz8q+u3Dqx/48bNj9lSaSjd3t763v6x/W5khrMNmSCXCUetNFoIJfFEhBIGoxw0DkpJUha8GEpHKUi5gsZCjvbmJqa35pgzvY3pbU20ZAJyjgYdQVhBBAFWRwiSyl2MV+UWoVRc9LhpVLqAtpKBmmRjT8iGrXvZtreHPT19lANFEGmcVArluBhrcBxF6IcYo4mMQevEPB2JlWkc5ZBzFPl8BjebJXQcqsahVNVUSgE2cHFEgVotoFKp9E5pnymKY+aqKY2LHnxg+xd/kkAG9kXj/AscZxzxL9N2d206N1fwXhuEwYKx4pCXLdS3GQJcLI6jcTIg3QgbjGBGB9BRhG8tMgqRGFzPJTASjCUjLA6WEINKZUCoJOfUBJUK0kLOE8xqzbNkfgdzp7cxs72ZlrosKWlxHYU1ccdIOHGx40chZV/TOzTGjv2DbN3Vw6bdfewdi2GrVDaLFYIgDKlWajgCXMeQS7k0NTSQz+apq8uTTknclEcqlcJKKIeasdES5eEig0OjDJWK+FKQa2ym0NBskS6hFlrg2SiInHKxKKLI4heb0UHjzq7yL+ZikYB50TifR4957gmfmrllw/qrarZ3QTpn2qRbJZVReCkHUoQpzyFtXIb7h51iaYTIlMmnjeior2dKWwONzQ1MaShQSDuk0ymESqG1ISoXGRsZZv9ImX09Q/QPDTNSrBEZSyadoqGhAaM1I+Ua5UoJGYU0ZVM05RwaclkaC3W4rpuw3zV+WGO0WGS0UmOkpikGhlS+CS+VpS6fxver7N/XTdoTzJs5jaULpjN3xhTmzOigoeBRyGbxHBfXdVBS4qZc0uk0OqHc6Qh0KBkeqbKrq5v7Hl3Pb9bcT09/keZp03BzWaLIEOmQuvqsrVVr2h8rsHOb/3DRPHRcUiS/aJzPT+UdkxyOnP6215b9/Veb9H4iymE6nVaZbBrHQTieKyrFkP07+pg/a4FdPG+qyLijvPG1L6W1PkVjXQNR6JOyPq71YxKG8nAdD0/Efe6Rqs/wyCg1X9PVM8TmHXu556HHWb91NzKVpX7WdEKrsL5BV6uElTF06BP4ARgH6QiEMiilkK6LyqRwMhkcN4MjPWxk6O/pIhPVePV5J9N57CG0N9WT8RQmjI2eqIzRIoa4jAFp45CfyREKj9BavEw95QAcxyOfdkin0tz50EZ+ctOdrN20jXxTPVW/wqLFh/Lpz36Ou++6Xf/XJ7+q+rvVw0P+Y8v+lozTeaGEc2MrftkfMMuOnaOXHXOkOzg4wob1GxgaGaA6WjO9XUX55je8h7M6zxRPPHorWW+AubNnsG/3Nh5Z+zhzZk2lrc4jLQKksUQmLmRcGQNBxfIYUkNzOkv7vFaWLZ3Ny88+jS179vO9q1Zzz4b1TJu7ECkyGC+DUhJPaXJWgHVACKy0SRNJYpTE1xFGa2xQYrinh/kzpvDJD1zKrHpLdbCHqNRNzRhcGbdIpQ2RpCZcihSQyaYJlEuES8rLsKd3mJ7RGlprZrXU0d7UwPRpbRx6yAKmzlvIlT+5mhmzp7N92zbeddm7qJRLpLwsSui/OTb9CwbnrJYqoIX0HE9kMy7tbU2kMmmiwDIyGMn3vONjnHTcy/ziUKlr7649zJ0/0+7v72f91i5GAsXv73mIkUqAUGmEsGRTipSyeI5EWIMXBeSIELVRorFeKr27sGNdHD6rgS/+x7s4+5jDGdq1m7Sj0EAgBDUrqGlLYC2hFWijEDJNZFyqoURbB4FA18o0pSz/+aF3MCUVUu3dTUqXKDiGvGNI2QDXBEihkEIibYy9Oq6HRRJqMMKjvxTwu/sf5oldXTTNWsDGff0MViMaW1qRNmDu7BnMm7uA/r4hhBDs3bub0ZESSuYMJpt+0Tif52NN8ufwqO9mc/V286bN9mtf+yqXf/ub7Nuzx1TKkc1m6r93wrKzbyyPsLk0UHnAFWGtY2oz6zdtptA2gy1d/USpAg8+sY2alYRaYyIfSYCwIX61hNIaZQIcE5EiJCND0raEP7wPNxrmra+5gKyEUmmMCIisQCEROqA00MtYzz7G9u+lOtiLZzSechDCwZGKseEhTlx+ONMbHSgPkFMRaRHh6BCiEGs1So2zkUioJBIpFJEWCCeN8PLc8eDjVFWeoRrcft9jzFpyNBu278UimNHezGhfN8csP5biWBEhJJ6XxnWydqhPy7bm2bvjQn3li8b5fB0rVrRZgMULlwygMyLyXdnS1G4bGhpwlCeiQIp/WPH2k4f6i8uasnUPlYvFw/L1hD39+0VD2xTWbthCqFLkWqayf7jMpt1duNkCxmiEDmMMMwqILBgUxkoibbBGI7G4yhJUxmhpzNHR0ULVLyMdhackpjjC2M5dLGnO8aoTD2XFiYuYk/Yp79mI64/iJpyl0A+ZO2sWRAGYuMNorCVCYB0P66Rj9NQksJS1SCURyiW0kkhmuP+RDezqGSGdbyaVb6F3qMS+3hFydW309PQxZ1oHxi/T3tqKtDENRUnX9PdWHGOc289/+cv/wVokfMK+aJzP07F69Wq9YsUKddfWL/0uV6h/R7WYUeWS0Y7MGCXTon9gaP209rnFUmnkB21NLf+5t2tDY9uUxkLZr5nBkSrd/UM0T51GzShaps9jV98Yo77ACBchBTqK2UlISYRAC4kRTtymTHrkxlhSKZds3iPSYcxmKo1R29/NZReexmcvexVvPmspb33pEj73nou55NQlVPZuw9NVHBtT4xzHIYo0RsQtztAqIuESCpdIuETCwUhBZGPep3RdtBDgphgq+5SM4rBlJ1ALY+qel8rxxKZtNLW009M7QKFQwEQhWodI6WCNJKhZG/mp8tTpc977ucsvGV2xYoWIO/UvGufzaqDYTuexXVd+K5+r/9fqWMqRZEwQWj1zyoI2Kfjm2/51+b/vG9g+c3fXuutTWdemsvVm975hnFSWWhjQ0NLGm9/9AU552YV0DZbAzSCkQxTETCLQWBsBBpsQ4ayNW5MSgdEROgpBa3KOYKxrHytOO4pXn74Ub/gJ1OATiIHNZMZ28I/nHc+yOW34Q31k3Jh9NDQ4jHJdrLUHuKFSHmDCC4lwHSKrEUohHQctJJFy6Rsr85JXXMgbLn03U2fNIggjXNehWCpTDiK0dIiMIJXxqFaLKOUCStcqUtWq5sEHnvje47DS+Vubg38BET9u19DpvPy813w79O1Gv4oKa2HY0Ta7zQqdX7nSip79+86bPXfhW0RKRoiss3fPEJlMPTqMWHroEaSyDUydvZBIpTHSI9IQ+H4yRekjCcEGCKuRJmYhSWNQgAkigpImn0qjS2Wa0w5nnXAYengPdWKAghylTvlk9BjpYITzX3IsUXkEHVTIpFNs2rgBE8XtT2E1WJ3QlQ3SGhQ6ZiQJgfRcrBJoLOUgwLfQOn0mKMWSpUup+RUsBm0i+oaGSOfrKUeGpvZWyqVRXOWCcfBDmDlz3kg8MvK3R0h+ARmnsNBm/+ub/zDcXDdjOKpK4Tkpd+fuLX2elL9btUqYt3/6nE+PFvdU8nWN7mA5sMZzSWVSWCFpbGzGWk2hoRknW6AcQoQi0hasiYcskmFKawzCxrwjjAGpGCqNMjBWoq7QSHl4mOWLOpjbAsofIKUUQkpcV+CYkGi0myPmNLGoo4WR3lHSuQK7+4YYGSsilYsx43QQi0Qk/zlY6+JIF8/zAIFKZSlWIozykE6KIAzIFQpYExKEZUTaY2//IDKTI4xCcimPoFrCUYaUm0ZEGfp7yl/4W72jL0DKnBXZVP2N5THfep6rxioDxTe+76T1V3/tieMOmXpKvqkhY4R0bNGPaOxoIp3PEAYGP/ARQmGtpae3n4ofh0PpeiBj2ptFAQphibmb1hJZgXAzbN/Xw5hfJuVlIKhx5vGHkhclsk6E72ukkyUyoKSDNDXqVIWTj1hAdXgYL5Nn/+Ao2/b2gpsjsjJOHqJ4NkkgEAlLynM9HMdBS4lxXHwj6Nrfj1QunptlcGiQmNisEY7LwFgF6aWplko05fOUxoZJpyUYQVrVh8sOOz4AWPGicf6FK/fEg46UB251VEpEke83NDTN/ed/+vrq5Ycs7Trr+JO+39rSkstkPCMsor6+AW0h0poHH7iPMPDZvWMX27ZtRRtLGGosoJSHFQohJFJYHElcJFlBEFpQGe6+fx2ZVB1Rqcjc1noOnz+T2ugwjgBPCUQUIeOgjXAklbFBTjhiNq050LUqoXW4a+1GfOER4CCkG4d2G+AIE1PxiAktIJJ8FyrVGhs2buTuO+5k48YnuOO2NVgj8UPw0gWMBc/1CMOIpqYG/FqVKAgjqT1VKZdve+O/LHm4k05nNX97uksvKONcylILyJNOPHcw0npb4EdOGFbFjl1bzMLTxb7+/t37W1oahMVY5cZaRZG2uJ7Hrp07+e53Lufmm2/EGOgf6E+obQJrBVbEJOHY/GMIKIgs0svT1VfivrVbaahvojrUz0mHzaUgazgiRAqDqyTSWDASE6t5QVhkaiHkJcvnMtbbS0NDC7ff9ygDFYMv04RIpJIoNMIEGBPFrU/lEul4yE5IRbFcJjSWH/74J/zP/3yZ7u4eIhShcBGpDLXIIJQi0JpMLocJQxzhUCsbprRM8y+55JK/WTGwF5RxrmKVgU75/Z9dtqPqhzurlUghI93VvW7g2q/+9oS6xuyZLa15oihQjpIopcjm8xhrSaVT7Nm3l9GxUcIopH9gEIFCKoUVIoZ44kgeN54dj8BIvEIzv7nrUXqHSrhKkDZVTjhsBro6ACLCCIExBkfG421GCKyFrAQzvI+zjp9Po2fISofugVHufGAdbqEF33oIJx0TlUU8yy5dBcKiTTIC4riMlCoY6SBTaYxSqGyGkra4hXqcdJbQGpxMGt8aqkFIb08f+VyDrFYjKn70+biR0WZfNM6/Yt7Z0T7zQWOUtUZH7U2tl+3p23ZxIYdoacrhosln0oRhSH1DPUIqKrUaqUwOayEIQ4yOHYo1BmuSqlkKrFQYJ0VFCyI3z/4Rn+t/fTstU1oZ7Onh1KMXMqdVYYIRrLCESIxUk85Mg7Eoa3B0mSkFw0WnH8nwvj10tLVw/Y2/paJdTKqOqnWwrodGIV0P5cSwvZBOMhAHFT/AKpeatoRCUNUWN5cn19CAH/koaUmnUygvzbadu+ntG0GIFK6TZtnRx479reabL1DjbLMgrHRSV2E9kc8X3C07HtE9+9a/adbM1hbPiYiiqsjl0kRhQNrzaJvSDsJhrFgmiDSpVJpqrYbnOkm1TFw9KwGOS80qaiJDpnkqV15zEwNjAVnHoU74nHPCAuzoftIyxABaOMm4sMBikFYjLRCBIyAc6+Nlxy9iUWsOEQaMjozx/at+Tqqxg5rIUNUOxk1jpJvMfUiElCAVFklkLFOmTaN9+jRy9Y1kC/U0NDbhKkVQKdKYz+BJgeum+d3t9+FroSPjSk30m5csP3rzClaov8V88wVqnKsNrFAvOf7s3Vrru6T0hLAhjz9+X8vcOVMdz7VgAqZPm0pDQz2RicgV6uiYMZPWKe3MmjePXKEulouxFoHBVQJHxKSdSAhqVlHfMY3b732YG269k7YZs+nb38PFZ57A1JzA9cdwTBDPpBsFRmKTClxYjTAGJVykVHgqImNGeftrz0FXajQ01PGb39/FT2/4HQ2t07BOmkALUB4IgdYH2ptCSKTjoZVDobGF9o7ptHdMJZPJ4UiJrlSZPWUKvXu72LVtF7fffg/NbdPt/p5hAq3737zq9FoffX+ztMkXpOJHZ2er+vEN/+MfMr9z0dhY6eRsNrSDvbvEigteJloa0wyPjFKpGbq6u6mMjSCNxpOCtBTkJWx48C7mdzQzva0BXS3FojLKEGpNaB0a2udw76Nb+MwXLqdj5kx6e/o59ZAOXnf2McjRbnKiBkLHk5tW4BgAg5FRXExZhTHxWLHjuER+yJT2Dupa2rn/vodp7WjlznvXUqkFHHX0MlwvhTGWMDJoAwhFGBmEl2GoWGXbrr1I6VCplCiPDhGMDVEd7KU23Mu0pgaU0VzxvSup+QYjlFVIYUNRPHnBmT/7da/nw4YXjfOvdezevdt00unc1XfUrWl2nNbcnJ1TK/eYoDgoO088lrpsltHBXgouZE0NpzqKHRuE0QFK+7biVoc58YiFKF1B2AisJXRdRDpPpmEat9zxOJ/93x/S0NRObWSE2fUpPvKPZ5D3+0nZZDpTGqSMw7iwsaaSsBZpnWSmSCBRoBWe0ATVMebNnU0uneLBR7fQOGUad63dwEOPb6GxeQrTZ84incuDcuNJCiGw2lCXy6CrZRo8aMjAjOYsc1ryLJ09hTOOPwZXCb51+Q/YvW8/TfXNjPZ0yfe94zW2d1fPrMd277p6LLyt529VU+kFq5XUsuxs1d39JX3CEect7Onbdcr0aY12w6OPyMGe/Rx12FLmzZzOlMY8s5rzzGmro6Mxx4ymAnM7WjjykPl4KlaOy2azpAoNBNkpbNwzyle+9zN+8svf0do+ldLAMDPrHf7jnRfSkioh/VE8QjxlY5GvRJdT2Pgyx4JdItFTsnEnSIJSAkcpglCzZOlivHSO+9dupK6pkaGRMW757R3c9cBj9A4MU6lpjEiBl8OqNKlcA/MXL2HW7NksmD6V9vo8Qht69/dy0y9/w+Xf+iHDo0VaW9ro2rqZN553Imedulzv3bZXDPf7/n6/+9etbFC7/0bY7wf1/F6oxjmuTvyLr67t+MSX39fV3fUoRy+cxVDPbhrrsxx//DKWLlnItOYChXwWL52Jtdm1RusQHfmMjA4z0N/Ptp37uW/DTnbs6UGoFIV8nqHufRw3fyof/MeX0sgIptJHShhUFCGlRct4KE5agaNjwS+TjPGKRKnDWpIlBrHIglBpxkwK2TCLezb18N1rb2OgGuJm6/BDTehXCP0q6XSG1tYWMrk0ruvEcolCUq2WKZV9iqVR/DBASY+GQgHtRwz0DfLqlxzBJS85DJnK6ofWj8ivX/nAQ29707+edOvlbzerY+O0LxrnX8c8JXaVPX7Ry0507ehdRx051f72V78SdbkUKuVQrMUDZ2llaKyrx01lcF2PyFjCSBOEPmNjIwR+DW0dPFeRTaWIaiXqXLjozOWcd9JSUtVevGAYdBnHWlwk2hpCCUZJhBF4OvaUetIFl4CUKpY+tHEHyBXgC4+yzWBzHewvK3573ybuengrg0WfUCmk44EUaBt7ZiVBCoMUFoODcFI4ShLVaphaGSfwmdFU4MKzT+CkQzrQwzuxbo7BqFH/93ceVqLu6At/tv4Hv/hbrNqdF6ppLuNGtVYQho2D/9R5bDPvee3p+oQZrvP7Ox7kka378bVBZvIEOPQMV5FOhImFNbEYbBTGxmM9lA7JO4IpacNJJxzGGcvmM6NRERV3o0yUZEcKqSxWg5QOAjMuDZcIyY57A4EYF5gVMfUuMuAoiSZC6CpZERKWQzpEltefsZBzTljME9v2sXXPGLv2dTM0ViZCEGgg0W2SQoCIJRs9AU3tOeZMXciR89o5ZEYTKV1DDW8nY6tUw5ApjS3MmpZmY0/fPwO/gNV/c/fwBek5baJw9Jm3/k/rLT//xp0ffP2h849ZkLfWWhlJxc6+Cg9v62F3f5Hu/f2MjIzhB4bIxBIxjoKUa2mqz9He3MKMKc0smtHMglktFBwftzaI9EdwlCC0Hj4pBCEpDCqKC6LARijPjQF3HWt+GBkPzclYaikWVlAxK92IWJeJyEdENSQQWkFACu3mcNIFrEoRRpbISsp+iG8MxkiwAiEFKRmRyTg4joPnOaSUxVSKmPIYMqqQkhZrQqo4yMYZ+tePFNWXf7Turrddf9uZd527MFoNL3rOv/TxCT4hAHPzLavndDSqBUvmN1kVdkvtl/CMZmEux9KTZlEJYyJvtRZSM4IwihXhhDRk04JcSiEiQ8pRCF2mUtyBFhEZx+BIjSRmBXm5AkYKqsURMtg4RKtYuhCbkN5ErHMcp3UyltqWDhZFZAzGyUG6ARFWsGYY19TwCHGFTxAGWF1C4uHYuDVfLxXWkTiOh1RekijUEEREocH4GozGsXHId1yJ1SHaWlKOpVYbUnOm5/SsjvaT1n7qu8ethjtWrLhWrV79t9Nrf0Ea5+3cLgHjGfO+JXNbTDqFqVZ8Jy0iHGqYWhVdGSYjU1gTkXU9IsfDuglEYzXGD5C1CJksw5BoCq6DIdY5CqzBUQ6el+c3tz1M6GV56SlHERUHcG1CGE5kbGysNxeHehFX7gaBthZLPJHppJv4+a1PMNC1i9e98lg8R0JURkqDay3aRggR6yVjNMqCkAqCGHQRwgHHQQti/qmIs1zXkdgoVhwxWISUKCEhqDCloZnGdCDufviGLAJYfcmLHaK//LGGldbKnp4nsktmNMhsVEGFPsJECAxKgCcErohwRIiwZZxoDCccxQmHccMSKRPiWYtDvFBAKTc2Cnys8TFIasahph2qNctV1zzG9350N5HThC/SGCFR1qASfSQjbBy6x6W4FWgMES4i1cIPr76Tn/1yLW1TZiJTGSIRg/YWE3eCcFA2ZpS6QiKFRGgLJhapFSJA6CpK13BsEOOzQhOagEgEaFkDZTBSERoJoaBewMKZeeZP7fgwQvzNZZ0vOONcsWKFWgORessPD5szZ+nZTY0ZE/m+I4TBEJODLQ5WOBirsNLDIEHoRI3YIIRBKZBKICUx4SMpe0TS0nQcGU9Kas0rzjuNlR+6iJ79e+nr3Yvnxd4xxjeTVzLxiI157Vgde0XXMjTYT293Dx//0AouOP9YpK1idQUpk80a44Rj6YBw0FYSmHE9UActBNqKeBLTgiE2XikkIplxkshEW94Sw/8CR1imd7TQs39XBv72CCAv2Gr93kfvcl1pvMaGrPH9/ng7mo0QQqKTGzS+AWNib8DE4GEicz0J+JEixiplEtZtGOAgCKMSflEze1qW97/rTERUQ+hqLHto4+0X8XfZpFMkwRikA9gAG5XJZ7K8+9KXki5AOLqTjKjhODHtyCYbOSyWUBuQAiHjBQiJfkiyKRaEo2LlKGMxoYk9vlAIE0+6W3RMYhEGKS1R6NPcVEfNL+m/oaHLF3BYT2LTlvWPWV2rkPFkPIym44CKjRKB1wArQpB+vOQq0XdNOouJx7TJyyT/bpN9QBJpLcKEuPgQjoDfR4oSGSeMt7rp2NfG6FTMv7RGJPxMgdE6yR+reMIn79UwpS6yqooyNaTWE4wohEFIg1IWRTy/JEzEhPRsog1qTA1MgCTCEclyGRtPIiFdEpmHRJYRsFalM46ePWPpso+86rudq0Eniscves6/jG2uBgEDYTdC5HGVQgQmNlCSJQLWElmNdBXGBgjHTQbILFZblJPcH2MnPGo8spssJUikgaUwGO3jSYmJwtir2XgoDSkwNoIknYjNzMGa+O/xg6BxpMDaABtqUhhkZLEGjBYIJYlsnJkKKZEm0X+fwMzMuB5t7EFNkKzLTscPhohX0nhph2ro40iFNDrxxuMPHDaVSqcjovrx0L76Rc/5lz5chJBEOt7c64pk1ZSIuZDKSRFpiZYekVVYXIRMg3LjXJR4VtwKGau6WUHstxxMrPSJtQIhEoEtC8oku4Zi3AjpxMW5cmLPR0K7MxaskIm4gcWYCKzBSbifCA/hZLDSi6lyyoMEdrJCgUgML8ln4xESJ149YxW+dqnqFKGoI9vcwdbdfezp6onn4kmWcAkJCOOolOob2PMovrpt5cqV8pLVl5gXPedfriQCuxqXrA0ibYWMP6IQMUBo8UCmqVQgVajDugq/VkJIi5KxRRkTF0Y2yRZjVWKbrARUEyr/yX427HjYHk9dhYm9mk1WBJrxldYmHpSzAmMEOrLJesG4go/XCwqsFIkBxd5WWIsxgCuxBrQxMWnEjpNIYtBKOSlCLXBSrTjpBoZHqtz08/tJOWVOPm5hrBuf+CQhwPVStlj05dDI0Njnf/m24opfxiP4z/8dWaHiqLbUwnPfDf+CM84VK2D1ajh5WacTDtwjRkZLtjknicK4s22sRKkc+/uHefA3D3HCaccyb/ZsiPoJgjBePgUIzaS2o8EYEMkCLGtiQ5MiMV7MBL9LJIYipUi+Pqm0E7UQYYnniIg9MkIkntpirR8XXjbeb2kn1hI6WKmwThohFErG745XcuN7NBEefijY3e/zyLp1PP7IFubNquOVZx9DJhWiw5HEYcYG7bopxkolUl4+h2/FavEXaRjGPfsDa7qes/7nCy/nXL3arAA15cQFm+64/Gd3dg/NPnlus6f90CR9lACtS0yd3kx2Zz/f+cHvWTC3neOXz6e9vZG6+jwZz8WYECksYRRgjMVaFykkWI0wcdGD8QmDMkaHmEAhHYmSGmN9lIy7QFLIWHNJG4SxiASrxCoCK8FRhFFSiDkOrnRRqSy4ObTKxZ4+DCmNjjEw5DBW8vFrIUYbIiMIowitNeVyhb6hYbq7RyiWKtRlPU44bi7HHzmbnPLBr+C6AiMMxoZE0kW4eXbu22tbp0zdjpJ/iXJdIdGnzrnghCi0p1Rt5keP7PvJ/ucq7f1ChJJsH51i9VffO7Y8v2R0T3dJnHhIqzVyAEuIJwV+WCaVzXDKKYczc06Fxzfu4aobHwIs2XwBz5MIYYkiSxhGyca1WBMzlZa0NNfT3tpES3Oehvp6GvI5MjkXzwHhWjzXYiMNSfjViZc1WiONSHJhEG6KCEkUaYIwxDqS0K9R7qsyOFpjb08f+/b1UBoqIcIK1chghcVJjF2p8V1HlnQmTSqdYta0FmbPamJ6a572+hRZWcahRtxKioXHXM+jHKUo+Q7b9pRF12D4TaxlBSvigvL5q2f0IfKYd+rRnd9obCkwtK/2/lZ77Nn9PPDYc/GgL0ics402i0XUz536k4fWd53/spM7ZIYUUkpMVCbtOYS6SsFzWTKnjllzjqKvUqO/b5Du7j5Gi1WCwOIYQVamcJXC6DhPLNVCduzu5eHHd1ANDcqBbDqNm0mTq/PwspJCoY7W5mbqs1kKmRSuA07KBSHRgaZYqjJWrtI9METf4CDlkkYIl7FShbSN0MUyrpS0tDbS3Fhg5qIOpjTnyaVAqrgpYBIv7LoOQgqUUmRcSdqTgCbrSZQoI/DjDpIyyea5WLjWKbSbLTsrYkd3adPxy8/f9Jo1j8lVrH5e8s0VrFD/+tC18lNvfus7ouH1X3/zq4/Rhx6+MFp94+PtP7rh4S9e9q/Xnnv7qq+bNaz5+zPOpSy1CDjtnf9wx2+u+VLtwXX73LOObrN+sU/klIerAB0hTAklA1ypyOcFs3NZmDMXYwVaJ54zMoRBiI0MQWTQKGqRIMKlGkCxEjBaqrChu8jje3p449vfylApoG9klI37e6iM7cWvFqmFPvWNDUgcstkGGts6qF96OMuaG5i9eAl7123g+1/5MivOPplWt0ZLDjJpN977pn2kDVFS46U8lFR4roOSicKxSpbB6hoZJZLqX2OJX0KK8WU1WGvxrUI79fa2BzaoXMPijT9Y84WeuGh5XoxTrGa1ubaD1ODguq+/+eyZ9vh5UvTvuTd16lFt+o570y/59eXXHXofax5eyUq56lkKpBekca5ilbmUS93/+Mabu9bedstVv71r7VuPO3pO5Lq+k7aGIKriyFhaRlsfHWg86SV8IYWxcS8cV4ErMGnASqJIUA00tcBQi0LKYUguK5lal2Xa3AXsHrqds19xMdOPPi4+kaAG2gcB27dtYce2HZz10nPiIimdjiGi5Lde/tgnWDK3g4XTC4jBftxyGTdU5HI56gp5PDeNTGmUJBH6imsMYw1ifFJUGmwUY7ox+y1GWI22yT53TSRcnPpm88AT3eLex3ftmnvY+e9asWuFWv08ec3xBWXzD1l61qHtBKcc2aHs0BbVKBWOZ0WKCr/tvnYMAavsqr9PnPNbfCsSQohTXv2WD2/t1RtuumOvchrn6YrIg5dHWwerQRiDIyyYWN5Q6wrWVLCmjLWjWDsClNGmilQBhbygvTnN7I48c6cXmNWWoildoy0Vkjc17r/zTrTWBGGEVg7a8yCdx61rYP3WHZApoFMZfGPxwxphrYw1EffctYaO+jwZ49Na8Jg/rZHZ0+vpaM+SzkZItwrGx4Txn9b46KgWD9OZmOhhAKsUKAch3KRDpTDWJTIeNe1Sc+roKbr66usfkl6243NX3fk/3cl4sH2+UqpHf21z9a77yWOWdnh1TgVP+6jIkMK1hVyasw675CIsxGK1f4fGKRB2ZWen+MCqc4YWH3bWx395W494YleEzM20ZZPGqkxCAkk6OtYiDChLzP7RBhWNvzQOEQ4+KqogwzFEbYicrNKat8xoSbNoeo7jj5zHhvUPJ5pGsdZRvHddUq0F7Nqzj2SiDem4WGtwPIfRvi6Gunez/MhWprcrWpslXqoGVAl0hdD6IG2i12mT8WKLFCTtSDkxOGcAI+LCyRJvooukRyTSlEUdlcxs/uf7d7tu/XHBN751x+/AirYVz5scjVjNav2ZT3+wLUf18GWLWjClAenKmD6ohLQZz6MuV3cmQF9f39+ncQKsWrMm6qTT+cE93/5pbznzj9+84lbVOxIZla6zgQXhOlgFkTBoGwdCjUBbB0ghSCNtGmXTKCFRgLQGbDSBc2oTYUyEjarMmtnM5i0biAI/Gd21CB0/KpWST1f3AFpDGMVdIiEkQqZ59P6HCMtjzJ7SgIiKeNZHmYCUFKSlg6Ml+AapYyFZaSzSEFf+40tfrUQSIUUNCLFCx3mmcAiFS4BCFjrM96550DyxW+2aueT0pQ88dMVeEDxfisbLli1zAIb2bnzbgva8WTQlF8lgRDgqjBtd0iCJ8Jznlk2+4Fdar2FNtAzcTf59P3i0a8+bP/et36vesBBG+QZbS1S5jDYYNV5AJPmZBC3BSIGREFlDhMAoB+u4aKWIZAyo4yr8aJTF89uojvSxed0DCGOoaENVG4zWVGtlKpUSQVDFRBGhNviRBQRr19zGoTNaaUvnUKHAUVkcmUfiIrRG2YTKB0wMIzHeVI/5otLGhBBpQVkRRwBHEKKpmBQ0zrFX/XqdfnCHlee+/M2f+cI1b99+86o3hzx/E5di7tq55nPf+UVhaHjHaUtm1cuc68tIl+KWq3Gw0ojA1BirjdwG0L+mX65YsUL93RonwFps1Gk7nb5UdEUtc/gD//mt+7xdYzlDfgq+dgEPrIjHeA3xKITRWGswNsLaKAbThZhg0SklY/ltNIoIojJNGVg0Jc9vfvrTWMHOc8mks0ilGOjpZvfObWQyLrlMirzrUpfJQljjzl/dwilHLkIEfSjpozFoKdEmnsxEglXJnNHksa9x/ik6aWkBNl4hIxwn3ockM8iG2ea6W7ebWx+quotOPO9Dn179ke9cuuxS93meGRKrWa0f+sGtLQ2uPfHIRW2ElSGp3HjfkhQuRlgRGp+7tv7qGi+dZoPcEMRee6V8egT/7+JYxW52o3UkNm/deO0V3/xl++9//9DR02ZMtx2zOqgERYG1iZqcRU5wJeOIGVPMZELRPfAnSb4nhcQRLmEgmTZjAT+++hf09w1TKflU+wd5Yu2DfOO//5vd27dT7uqiWBxm5+YtPLFuHd/+zKdxi31cdMbRUOkm7amYcjfB4kwYTElvnqdZlh7T6gTI2EitFBjpUTYZVMNCe+Pvdslf39Erl5149oe+dv1nv9BJp/Oz7p89r7vVly1b5nR3d5v2oOlDc5rCk151+nStKntlVsRwV6A8dGaK+M3d68i7La86tGXpO9OluroLT3tP9qGdK7fxNMOWgr+vY6IqPalw+htd2/WDM06r1xefcyipUq9yghIZQlyTEDBELCMTt7G9+Ack/WchxERPW0mJtRqfFLowlZ1DhmtuupP+MU0mn6dcrnHY0lkcc/hSfnXzLfQNlQmExBCyZEYbrz7rJFq8Cm40EENEkY9I9hzFnXuReMzE0dnkwRBPCvEqwkqDES6+zSHr5pnfPzgiPv/927ccceLrXvODe7/yaEJlet6H2FYsXer965VX2jeedPGtbztn4amvOb1By5EtKu9mqZHG1s/k948O8bUf/orDly9hxozp7N49xsYtIJ0Z776t75qvf9x+/CDc8+/NOLFYccnSS9zVm1YHbz72nW/csf2eHyydG/JPr1yuGz1fuZUe3LCKl4xmoBIiB05C6JgcgRJep5QY4RNZiGQW6zWgso1UQ0OpXMN1PbKuIiqOkcvliJJmonIlKRtCaQjXBmhhMDrCk8SspmQdpRVJRW51rC4XD4xg7YHzsdaQsOaIhEuQamPPSCH6zNfvcRoWnPrqq+7+zrVLWeptYEPwfF7PlayUV82/39227Rb/9S/56Dm711//qw+/dbld2FgVhaCLlHLRbgu7hxxWfXE1F7/qHF56xlITRBW0Spl7Hx2037lqs+u0Ljy96VOVO1nNRIH2d2ecT0pp9Cdf/80jbvz5/3x9ybTwpHe9/nTdKgdUNhpEaR/X8TDCEukQpRyMMXhe3C4MwzBhy8sYtHcSQzISY2XCek8eCBszh8aJyhaFUWCIq9eMNCgriIQbT1ja2MEbEw+3YceZR3HbUqkDxum6LpEO0VGE47oYCTXhoFoWmG9dt17etUk++uuddy07TZwm17BG8/xKzsQnKuA/3vL1JTfdcNV3pjeMHveBt76ctnSoclEPYTBGqmE6//ml1XRMa+fS151JMLAblKUmJG7LXP3jm7fK713/+O1bw11nLGOZu5aHIiZEe/4+D91Jp/PxH73zse/deMc56/fKO1ff/ISymVbjWwc/NIyMFvEDg+NlUK4bSxEiCSODcj2EdGJISCqsTWFMCqyLawSu1mSsJmsjMtrHtQFCaaQEJTUKjSMMjhJo4RAJmWCY41xOhZAuJqHPCVy0jbd6CJGChPA8Mlair28APwpitr2JraVSjfTenhKpXOEHQgi7aFlJ/CUM8/0XfWHx4Zmj/7/fXfeVBwt264mitE/+75cvV1/56jU8vnWUwrRDuGvdbnpGh7ngFUdjyjvJywoZG5A1EdWh/eqk5TP0vCmZU/71NZ9+y1qxNkz4/sL5OzZO1rAmWrF0hXfo6e2lf3/DV9//wI1fv+exjXvk8fPyVtpQlIo1+gZ7yOZzFPIZ0ukUruviKAelFFpHaB3GHlEmYcjYhCEvsXZ8SE7EuKjVyd5JgUq4orGcoYrdazzAgUlShVgOJ549k1KhDIRRSLFSoVgsUq1VkcrS2tZELpsFa3AdSagchms+5RrMXXB4hidusbAMWPv8hPKVKyWrIPuW+Qt/dcv31i6eWs6++vzDacsbm1JWDI/5rH+im8u/fyODFcuGvb3MXDCH5roMDHURiRCjXaxwSTtZxgZG1eDQHvvwg7/77sXL3+W9+0Nf+9Hpl4iS4u/82NC/QXeCc9UTv943szBteUGWlyxfOsWYalHW5/MoN8VouUypXKJaCxgrVaj5EVpbQk08ritV3K0RYoLMi4i7NdpojIgnPJWJu1HSinhAjnj7r5IOUjox/1M5yHj9H1pDFFn8WshYqcLIyBhDwyOMjBapBSGZTJqZM6eTchVaBzgyxmoj6eLLenPXI/1KpDp+P3fnrHsyUzNibffa56V/3rZmjfwGa8zonqHPzaofPe4j7zglmFNXlnk7KJrTPk11iiOPPoTZ8xZy5bW/5Yk9vZx8zCEcOb0dUR0iUgHaZnAz7Tz48A6u+9lt4tTTTqGhUZkN6x59+R1r7jjzU++7/Jd/98YJcCyIJ6zF90t7m730W046erpJBWNSRjWydTnSDTmwhlrVx5Fp/JqhXPQpFmuMlcpUqlWK5RrVWkgQWYJQY3S8JsYgscKJGe1CHJgBkgojXAwSbQSRNtRqmmo1pFz2GRkuMTpaZmysSqlco1gsUw1qGGvJ5tM0tzXR3FSHRGN1FIs/JG2EmvUg124e3TaseovBL37a8/P7817e2z26+8+Gj1asWKFWb9hg3nPxN47av/PeL1560SK1oK7q2OG9Iq0ClKmijKZU8umYs4ThUHLP45t52XFHMKc5h4yKMf6qWnli2yjX//IO/uHil9J5zBxxyNyCPPaI9uDRxzbOvO3++wrOi6aJuBaM5zr2kBlHzqiJHuuLFBkvj6sk2IisI8g0tVFI1xjsH0VogZQOKIUxIX7FYBWUbIA1NaSMZ3QEIh7XkCoJ6ToZLEvyVATaaCIdE5OFMRhtYhZ97Ipj9ThrkUSkUoL6ugL5XBblSCBAa4tBEGiLdXIEIoXXOA2nbpZKNe3Vv737vjcsm/uawTU7fvLj5+Ni9a2OSSJ33HbL7FlNmfycWfnIL20XacfiJsC/lQol07huisH+QRwgJGJUF7FRiFUFqqHiyutu4ezTj2fJwlaK/duQSjOvZab3ypctM1//yfp3/N0b57JllzqXVDvEscG6r+3qf/xt6am+SbXPdcr7fNCQERXQAUY45OryZPI5hodGKI6VCcOYI2mEQFoVQzzCMs44N9ai4x2rKATKqhiiRCQNHZtMdsYjHcoTSK3BGoQURFFAaALSaY+O5layGRVrb5oQrCG0gqqWoDKk6+rRdW30jWnuu2sH9z5xtxwSKfve97772Ft/u+nqxVMucTd2X/NTIZYHloci8SeqKKxhDUhYP3RnsLBtps2mQmyxjOvG4hHGKeCmG/FsHdf+5Ba2bd7Nwhkd7Onp45ijZ+BrC6KO7//wRhrbmjnhxMX4o3tp9GooqSiP9tLaME2GlWH+ro1zFp3ptWsvr22SM179qvMv/qePv/mteuUHLlX/309v5S0vOxnt56mU96GoAJYwKuM4gvqWNKmsoFzxKZVqRL5GB+AkuWPM9ohXsijJxN5KRKzCkaAvE0C/ALSxRNoihUTrWEAsk81R15DD81wc1wHtE1hDhIdRHiJdh5NuZLgK92zp4vbHHmVXf5GFhxzH6z7wMc487zyRaqjXZ936iHnHWz75g7dc/OXjpHr4Xafp05z4kfnjDbQTWAOksKIumxIpxyIdi1KCCEmo06x9YBd337+LntGA1150Aet3dnHHnfcwd9ZMImO47a772LWth39/76tQ4TB5p4wnDLVIUGhupdxTJJdL/73inCvl+IjqWy7+wlHX33TVTTf99rstx518lLN94zrx0fe8i9E9O/nHl53ICYe0kBVF7Fg/kV/B6pg7qRJWEVpSq/pUqiFhEGIsRNqgTazoJkVSdSe7f+NukklWyYw3BmLyhqMEKdfF9Tyy2SwogSaWoNEIjJPFy+Rwsnn6iwGb9w1z56Nb2dhVJNc4lRPOOoPzLn4Ni45eFrcItMUPamQyGXvNj35lPvCez5mcO+Wtu0Z/8cMg8IFOJ14F/uxGunLlSsntyFVrVulOOtUasSZqsDPPP3dxyw2f/eejotTIFsezGuu6DJc91j66h0J9PR0zpzFYNIwGgt/c/hAbt3SRa6inv1zj2ENnc9lrzyBd2kqjU0HINEF6GiOmkStveoT7tjrR34RxrmSlvL0TuWbN7cAaO7m91tm50lmzZtXz2QdO5I6ss2ja+f80Vh791Hve94bmf//Epabm12Q65YE2XH355Vzz7f8P6fdz3kmLOX3RdBrzKcJaiXBsCKlDCGsoASnHQysV549GE/gBxsQGqI1B6xhAj4F5G8/8OApXuUilUI7CERZXREjpEOpY7RjXI1Iu2bo6agYGozzb9vaxdt0mtnUNYXOtHHHSKbzsotdy9AknItMpAMLQJgB/zPmMQk0qk7J33raWT370a2LTpt13zpu/7JI7H/5Cj9HQSaezhjXRs12viTQI3LkrVphdt5VeNrO+/4ZPXXZU1BTuddLUCExApHJ46Rxh6KOtoad/hOGiIRL1DI4J0s3TuPXuB2nIObzh5Z141X1kRYVC63SuX7OZfUU3enxnIDfuN5//qxrnypUr5e23Txih4cnTdxKUEESRkYD1PM+GYXiQp/uTq8xY8xzHkfr8Ez547MMb7v/xnEUdcz/y0Xdy9rmnmiDQUilDFPpI6eF6HsHwMD+77sf8/Mrv4+/fyrxpUzn60HksmTmF5qwkTYDxS0S1UixrI4j3DjkOcVfRHuiBy7hTbnTcchQqnucxJh61iOVuQLkplJsjFC7FAPYNlnli20427+xm13CNpo65HL78SF7yigs57LjjSOcak86UJfBDlCPRTuwIhZY4Joa3Al0jlcrgV0P7v1+8Unzv29cOlYfVN77y2S/9z0X/vHRwXD/iSfdEAPZ1J39smQmqx5f0gu/f8vi7K1EY8v6LP3n+1rW/uOFDr1saLW0JHKr9GGoIVxIEEdbEhR1WUq5qeod9ijUHUWjnnse7eOTRTbzr7W+goz5FebSP3/zuYfaN+vaEl14kvvHDO0pzlp4+6y9knFZ0dn5CseZ21sSe0BxgJ8SH40iEcAjDgOOX/sv8WrXY+ejONbpA3cIpbTNX+L4vvFSqd/bMmZ+79aGv/PLPO59OB9ZEqVSKRe2v/P5wed9r33zpRamPffK9oeM4Ti3whadcMBGWCKE8gsCipML1JNZUWffgo9zy8+t55N676d+1kSn1WRZMq2fB7BamtzUxtc4jl4oBdiHBlQmwbk0y6xNhJUiVyOSYcUHXmNTha0H3WMSerj527etn/6DP5j3d2FQ90xct4ZiTTuHU089g0aFLcXIFACIgCkMcMS5O6yKUILBVDAaPDDJUGDSRrIHVuG4aKVJm2+Y98utfWM2119z40EixuDL01t0chQHWIjtZKdtWbLD/fdm17qWXvvYbI8O7/2HOrCne7h3buwzphzNNLV9es+2mu5ZlWx744OuOO/K8o1u1P7xbKTee9NQ6FlmURmBDjZAOvlUMl326RwPGbBM3//5x9vWVaGyoozo6wqxZ03nV6/5BX3/rw+qG+/f9ZkPx4XPFn+sJN2w4RKxevZpE/smuXLmSVasmMUskKOEQ6YhLzvjc0T29+w995Ik7ZVNDy/G5dH3ncHWfaGrLT5nSMrW+sSnHlCktNDU1rm1t7Wh5eO3j3H/P47PKtWLH7v41vcmTbP6YdGEVqxASs3zxZUc+uOG3Hzj1+OWv/9R/vseeetoJ1tpIRtqgpBtDN2Zc3EomffG4vx33spMj9Nnw6CM8cO99PHjXGrr3djHY30PWH2Z6awNNDY3U16VpqsvRUJ8nl07hKYFyJJGN5+CL5RpjlSqjpRrDxRpDQ8PsHxqj6jXS0NBCU1srhy87huXHH8e8pYtpmzb7oM8VRfFE5QRDikRux8Twk0VjLYl6SNKXT7Q+rTFYK1DKtUD0+1vWul/4/DdYv37L1tmz5vzwvkeu/lSoNVjkped/oenxu37c/4YLlnLSYR3haM+A+/iWvdz40HZaZx+52YSjMw9rHc689bz51ozuEsIRsWBfkpQJI3CEjDthNmZyjQaa3UMRxaJLb2+FIPRpn9pE2+zFDIZ14dd+cK8bFpa86/YtV3xDPHcj3CBWr2bcCFmxYsUBen98TRJpP8t7Vny3deeerWesuf/WqiPFtNlzF7xrcKhXt7W2LE5nXC+MKn2HHbGoZdr01gdnzJxxXK7OpVCfCfPZbEynFcrRRtFY36w//bGvbLj7vvU3dY3c9u9CXCJ5zutIVihYra21UonD39BYyH3rnZe9IfXxT749cj2lwqgilHSTQTB4NiWWOPyGaG1wHYdx/SUAXSyzd+8ehrq72LdnF1s2baanezfl4UFCv4oONFbrRIcphpKk4+BlPPL1zbR3zGDugkVMnzWb9umzmDptKk6hcBDzyQ9rCAtKeUipnkSV++M4WePMeWPiZ9FxHGM09kc//Jn6+H98YcNob9jXXpj2XztKN/16QXihV8g9NPDJ956bn5EboV7UyDQ2mS3DaXX1r5/g/kce5bTFaT7ylpPwB3ehVBprTCyqy7hceXJxLWAM1nMpGZdKWWG0i5CWsjHU0tPsjXfvMXc8Vip+9EPXLDn/w3N6xFM9zYbkvT4Ba2xnZ6dYsyZJlsf1K+Pfw6UrvjVz357ty2++/5elGQ3Tl3e0Tb2wXB0wWodBR0f7MVPaW1P5pjTtU1toaWkik3VIZ+SI49rBkZGROe3trTJfKJgo0kLrUBgTjedt1hpJNluwO7f37vr0R78ru8p3zIkFXZ8L3NHp3CHWRKcue8eh9z10z793nrr8tR/79Ls4+ZSjtdFGGcLYG1rJ+DDAH7rfNqm3oyiMWfLJxVdKgeM8A8FLQ1BDh35soG4K4TjgejztVLYFooAwihAyzlOllPG2N2txlPdnGGZyPpMCjzHEOKyR1kspC2z/wn9+Z8EPr/gZ+/bte+j1579cbVv7qyPetWK5nN9YRBb3ojyBalpkRcNi+9GP/rc86ZAWXnfOQsKRPpRMY9AY4Sf6UAeI0OPcV4NFK4WxKSLjIFMZ9gxV2TWWC6/8xQ43O+XQ//rpw1d/pPPUTkcc8DJ9AtZE4wYYu+GYeP22iy8/ZPP6x6bfufnmyiHTj7pQSXV8qToY5vK5ma7rZhYumteuTXXz/PkzWubMndUs3WiwqTFXE4r2aujbUqmsarUKpXJJhKEvlJRUa2WUI63ruGLJ4sUIYTHomJ9oIZvKEkXaRkFKfP6TV1VGB6MLn+j+6W9WrFihnmUgK/bfElPnnvySjKdvvOx9r09/5OOXho4jnWqtIqQUsUqGOMBmfy7MQZ0owMWKwjYmeGiTGG0CLyQ9dKtNXBAl1zKGj4jnf6TAGht3hZJfa6whluxS8UMiJdaYpN0Zk0DCKExw1D+HSHYQEAJYajUfR3lEGtJpD8D0dg/Y73znh+qXP76GHRvv55ITl3LZipNockcJ/CLWa2X9tlGu/+mv+fC7L6TeDpDSVUQkscpiZfSMEYhEIz8wEuFl6atoemtZ/Ys7+sWd68NH3v9fPzn7Te9ZOhzTZ5Lwh4TOwy47cs1jd6VmZNsXT53a8cZtu54wwrG0NE9ZVFfIN0yf0V4wolZqn9K0a8mSxYd6Kfy6luy2tJtaHOnQViplWamWbK1WU6ViET+oIZQkncmQy2XJ5wsUCgVSqZRtb28Xa9bcwc6d2zj2uOXMnz8XT7nk8nm8lEfaS1MtV+ne3x9cfcWt3o033frZvtLDHxPiEvF0oT3ZPYS1VqXE4RdObWu64uvfWZU99+WdkSVwdKRjueqkexPfZDNRUf+hiRUzsRVDTISsg8HBKBEjFInktp0w3InnRkgSibrk6T/wWFgLRjixlzEmrugnfuKB3/tnl6p2XKwxCfHCJg+OxFqs1lbEmvZS9/V1c90Pf6huvvIHhL17OfW4hRxz1EJmT5/D5//zGxx/5GLOP2MJwch2sqKGh8BaicZOeHhrD/7/OPUVaJVi2Ld0Vz3WdZngyhv2ey0LTjjzxke+97txByQApmdf8ZZypeeCmXOaz0unsnLK1FYyWbmvbWq9XLJk8dRURvZlMqmxcrk0RzgYrUNRKpdEpVJWkYli6layccJ1PXK5vM3l8jQ3tYi6+gyZbJp0Ok02kyWdyYAVtLS0ct999/GjH13JMccs5/WvfwPVSjUm7xqDNRBFod29aze/+/X991z53Vtmdo3eNVNr80ygOtZalsx45bWNLdmLL//+Z+2hR86hGowJz02hhJcUOeNjFuP51zitzfkDxmkmOWeexlgmrY4c52TyJIxCHHhDTLxvD/g0ISe+JGYsib9Cl0RPDjpYK4gICI1PSqVQeNhqlTtvuYWfX3sdu7c8hhvUcIYH+Oi7VpCmn5QcxqOMayKEceM1h+LAB5Yy5hNaIZBGYUKHkapm96hmkNboyhu2O1uG3E9vrK792NFH/ZO7du3lIYCzoOGS9zjp6v++85/fyJyFbba+vl5nsmmEjNoiUxF+GGrX9dp27drdtq9rD9JRqlwp4zoOuVyOxsZ6M6d+lsyksxQKdaTTGXK5gkilMmQyGXI5D8eJiQ6uE4clrQ1hWCWddqivL9C1fx8joyOkvQxRZMBaLIZ0xsNLOSw6ZPYi13NLpx35/lf+bu0Xrj84tMcNQGutXdT+0tVzF0+7+Iervxy0tDW45WpFuK4DRoIST5cBTPTBn1tIPNBLmfAGidszQhz4OYKDxGQnG+W4Z5107ya8sJjU1hRP/jb4C80tqEmeNJFoFBIhM2hj8MMqmVSaUy+8kFMvvJDRvj4uOm4ZrzhyEW1ZQ2l4GCejY8VoK8YDAuNhQYpYBU+qOGUZGBymUhGMBC4mN8fcfs9+Z8+I++gH/v1L//vWj54qz1/bocdZp05ky//7zndepE/onG/7Bvc7tXBIVYdBOSikRVuBNsZaAaPFoli0aCHz5s/DcV1y2RyZdE5mMtlYUMp14qoUYiBaSaSVKBHLS48Ol/EDn8D3uenmm9myeQteWlHzKxgTId24lScQyTYLTTafEi1t9cGSJQvTdz907/w4SjTGUmqxYYqUlzYz82ddd/Tx8y/+4XVfCAsNGa9aK+F5qXjkV6pJd9ke5JueM3XpKSRyG69tScKkFPrgsd0J7yomPGuSrU68LyyTyMiTvfKkWH+Qcf651mmfwdLtAe8vQ6R1kcbBWlAyQusaJrQI5dHVs4tsKuSUY+YiivuplzVMpGOvaFMTSssHOQFr0VrjOA6O51IerSAzTfSXIvPIll6/rv3Q9731o6f2d3Z2OqsmdQOdVCG07dNbVFfPXitdQ2QtRtuJDMp10xgjxPRp01m//gl6e/t4+ctfSSadTmZjQGs96TwsgV+jWC0zNjZGcbREqVShXC4TRRGRjmhqbEIgmDlzJk3NjSxYNI+Ghkaq1SqOciBhfkfaiFQqY13lTT162YK1a9bcfXzcaLk8mXUWpFMp05haet2Rx8y6+MrrvhgWGrJuGPl4XgopVMJIt5PurfiT3ND4RO741KW1dlK+aBEmXrgaDxiMm5uZZBLJPiExyTgP/IQEaUnocXJcxkY8zx7zmSY1Dqy0sTgT0ztiQnNcgAlwnSw/v+IK5ralmdpo0f39eCmJP1HsxJ7XTArn2mikKxNkRJHLFrCihnXzekdP6JSj7Ja1W39+xyXiErV6zeqDKimnWCqW+gf6dyyeMu2IkVKPSaUzsq7QSDod54m5XJ58Po/nuWzevJmtW7cyNjpGXaGO4eFhUimP0dExisUi/f39jIyMUK1WCcN4KCyXy1JfX8+cebNobGgkl8+RzWQ58aTjJ7yB67qUy2Uc5U4EalDoyJLLFvCcATt3Qcv0ae3t82ZPfd9Lb1n7P7+BVY7rulGTs/y6I46dcfEPf/qlMJ9Pu2EQ4nqpgy+9EH92XDyAYsVVdNw7N3G4AjAJB9MeYM3Z8VQAEjrdk4qSySA6YLTGWksURTiOczD4/7xSC549PogkJGthiUz8UKVS9dz/u1u48Uc/4TPvPg8TDZBOCbRQGBHP1Mda+uMRKQ7xxhowSVFkY5JMZFyEamTT1u02nWu5Vihhn25Fl9PQ2OI88siGPfMXtTY60p25YMF829zUHktECRGrXhiD56VoaWlh06ZN/PKXv0RrzfDwMIcffjiVSgUpJQ0NDTQ0NDB37lzq6uvIZXOkUqlY2EpKoih+MCqVCqlUijAM0cYQBMFEVTexGCD5u+s5pLNp0T61zU6d2dq7cce6c4HfWGv1vNbzrpszr/niH/34q2F9XZ1bLlXwUu5fLEkbPz/f92PWUHIEQZBIcstJntYe5KnspAR0HJPGmAnc2FpwXXfi+30/lu5G/PXoD+N7Oo0UCMPEwFzKTbN7yyZefeEKjmjPMr2tgB7dlzxkCfyXwGwTVEAORKwoMiA00oVKLQKZZ2gstLWqKxrqp99BzwEt/4OMc3hw9OrtW7qODEOTMqGhWqkJXW+IQh33iF058TTPmTOHBx98kD179qCUYtq0aSxcuJDGxkZyuRxKqYNgg/Hvi6IoPvHk5nqeh068hOe6RFpPmr+2jIPtjqMwRot8fY7+geEpJ5x82JTtO3ZlrbUfPGLexVc3tLoX/3D1l8KmlnrX92uk0u6ERxPi+fU645/HcRyy2Sz33HMPN910E+vWrWN4eJgnNwhM0iac+N7EG8VrApPMzI6jBrHRTpnSwRlnnMErX/lKZsyY8RQo5i8+EjD5cU6eGAmUhod57z9dSt7zOP7wOWSlj9R+zFVFoSdSnLi4TCirsdcU45Er3o48Vq5CqsP294ayb6yy6+yXnLX/ps1Xik8sXfqUfMPRkfx5tey/eqB/dEtjU6pteGiU6dPmCOGOX5gYbgiCgMWLF/PGN76RIAhobm6moaEB13Wp1WoHKGI6Xs03bmxCxJLQ9oDrmDBMIAajJxnlgXwr+VpjyOWySGXsrHltSKeYO+bQl90Qido5P7z6m1HHjGY3CKs4TrylRCn5FI85+QabBNwef1Am//mHDtd12b17Nx/4wAf4xS9+cSDXfh6Pn//853zqU5/i/e9/P+9///txXRedPLx/ipFO/rzP7esTeqdVWK1xXZcvfOrTuJUSx8ydyfwp9Sh/FFdZpBExb3Vih8jkoi2BIKzFSomQCt/XlIMImU+Z/lKgKtb2/Ov33rD5IVCrV616ysV0esq33Ty9vrPcvXdgbkfHAlEpl20QBHipDNqEMYEgMbQwDJk/fz4AtVqNMAzxfX/iwo3fZOdJEndP51WYXJGKAwn0k0FbIcBxXAqFvGhpC5k5p61p3Yb151x33U/M4Ucudiq1EdKpzIQOJvapHZ/J0jGT/3+yl362mz8uXrB582YuuOACNm3ahFIK13Unvn+y+JtIIrqaJKogkjakTT6vEAdyTzv+EEsHIQR9fX3827/9Gw888AA/+MEPSKfTRFF0UNj/Yzz+OHllskLI039t7DK1AWs1KUexe906fnPdj3nn61dwwzVXM6tpNioqgw6xSZEjhMUKOZ5oH5xrSxUvwrOS0bESQRR72+379tlCS+vddtiKZ7ructftpArZum3rH99Wcl23V2stSqWiVUoclAOO39BarUatVpt4mieH8j/mCT2IipBsnRj3vk9i3wGSuvp6MmmXadNa7FkvOVmf/pKTpO/7pNPZmJGeaFQ+XadnsjE+nUd59ht24HO/6U1vYtOmTeRyuYOiRPyy8UoYbWKPamLoSGFj8QQ0MTwdr6HWyYoWrU1CSI5z73EjTKfT/OxnP+MDH/gAjuMcdA+e6xFFEdXqgcbGH86pSbYLC6yNU7GrLv8mC6Y0MLPOYUpW0tbgoIMaCEkQJQCZmNyEGK8IDzQXhJVERjA8UkbjMVK1dA+FYsuunuuEEHbFM+wrlnNOF7UgqK3u2defKpfKbiqVolgaFU8mCRycS9mnXKwn55rP9WKKSUb9dMYtRby1rLGuEddxOHrZkWLb1o1qbKSI4zjoKFl2aifjlgdjeOPeY/INGq+4/9ADNe7Jr7jiCu6//35yudzE9x30QCa8sHGIyZHxuG9VGwJtiSKDHxlqOtZwd5SIZ92TLcDj56y1JkoM1/M8vvOd73DnnXfied4fbZxhGLJx48aJ8/zDffnxddvgOR7FwW5uvfkGTlp2CE44wuy2FK6NkAIc5aLcFAgnVuATyeJbMS4OkfBYo3g52dhoiSDQuG7B9vXWxFjF9r7k9JeXALF05dKn/WBSCMGyw066ZnB0pNC1b7BJSs+WSmWi5IdOxsUmG9zkmzr55sqESTP++oOeVIhkmVT8esrXJySUdCpNJptl/oL5GAx33X1HrLoR2ol++TOCJwn3USlFFEVs3759Ih15Wm896bNKKfF9n+9+97sToXE8N56czkgRk5OFcFBCEkWGeR0F3vzKE1n5vtfyife/nve9+VzOO2UJeReILGlXIYUTzxmp5JqOM5GSh8IYw5VXXvmn9X6UYsOGDRNoynMxbitij6uE5PabbiYbVZnXlqVAhUUzC6iwgifiOanxVCXuAqukzSAxQmAUaGHiBoiRjIxU0MIhdDyzfySSg6Olh7/321XrO0FN5v8elHNaa8V1d3yyZ0bTiQ9u27b/5HmL59rAD4Vfi8hmM4SR/xQ0YyLPeppw+SckRU+BhcWT/l0IS2ACGprqqYU1Fi5ewK9//SvOPe+8eN3JhBYMzwgwj+d4Sikee+wxGhsbyWQyz1gRG2MmvNcjjzzCQw89NAGDPTmfjXPPCCEVQimkrrDiZct5/SuPYWpzCiKDNhEq3UzE4azbfDxfvfwGNm4fRCqFFfE6wkibpMo9+Io88MAD1Go10un0H1W9O47D6OgoXV1dLFq06DmmWSbZLQ8P3n4b0+sdCqZIvauxrVkIRxHSQ1gZM7XEgRawTVROrBQgDEEUklVpRoZ9SuUInc5TlR6P79zBIUcsl+sf2saBec6nRWSXutZYMTQ2/KOdO/aLKDJRFBnGxkZjEs0fCNHPFpKfT4DDaENDQyNSSI499jgeeOABquUKjuv8wYdj8r9LKdm7dy/79u17SoH05M81HgZ7e3uZM2cOCxYsYO7cucydO5dDDz2UJUuWkM/nk7AOmBAdVFjxipN43zsvoJApUSruoBbsw/e7qJX2UBnbxeFL2vjYR97MtPYCmBBlQYc8LcoA0NXVxejo6B8Ptyc1wdq1ayfC/B9yJtaC4yqiWo2tW7YwY2orJqohiHDihaCTmghx+D7w0sQDwhYbWTyZIdIwNDaKcTyMqqOrb1Ts2L7VDvb1Nv3n665qbGONfZKW+IHz7+xcYRDYk5efNdy1d6DW1zPgSinsyMhAvGxpUoh7rmTf552akID444XC/Pnz0Frz8MMPI6R4iqd5OkMbh3201oRhyM6dOyf+/nS52GSY6IwzzuDee+/l97//PQ8++CB333037373u5k/fz6e5xEEAY6UEBkOmdPMW159GrWRLXh2gGyqQipdJu1VcUWZukyNscGtzJ+Z53UrTkVZiyMkUjjP2DTwfZ9isfhHRyljDG1tbaxdu5ZSqYTjOAdFvWdKZ5QQDPR20bVnJ+1tTfGCLhuQSSuEMLFOqIlfB5hd8boHKSKE9hFa4Ik0g4Oj1CJD5GTQXgMPPrxFnnfWSaY+nTrm1od/t3i1xazgkqfNyeT42O1vH/ja6oH+Yu/WTbvvzmSyolQuWr9aedYP8tfqWwRBMJF/NTTUU1dXx6xZs7jl17dMhKLncqMAyuUyqVRqwjjHc87JXt9O6m9baykUCrS2tjJ9+nTGxsZ461vfyjve8Q5uuOEGRkZG4nPTFhdYcf5J1Ls1vHCEjBPhoCmPjiBNhGM1+BUaMlAa3MWJy+cztSVLPFhmnvGclVKk0+mn5PfPBUaaNWsWfX19PPbYY4RhOHEdn6lDNE7n6+3uwa+WyHoy3nEU+aQc8ZRIE6MUeqJS1zoCA2knw/BQhZFiCOkCKlvPnp4RBvqGuOQVp3PI/Eb2b3/wdSgsz7BvU44z4aMoEo7yfv3AfU8018rVbQophkeG7PjJTIaM/lTY6I/txsTe+mCvnc8XkFKyfPly1j60FhMZlFR/IFTZCTimWq3iOA7d3d0TwPqTf+fkwm4cktFas3PnTs455xxuvvlmXNed+F6ZMNdb6j0OXTAdGYzgSQuRBJ2mPBJRLRuGB4r07e9HhiEyLFOfFZx1xhEHOEGT4LTxcxZCMG3aNJqbm/9IQnHcVm1oaCCXy/H444/T1dU10TCJouhJ1zmmKo6TUUaHR8h6Hq4jkMLGO+QTxlg8hx/nxibpxgkRq+IZI3FTeQaGivQOljBOjkBkcNJZ7rrzfs446SjyjMiTl7XrGY3qTRcseeO81WBWrnzq0oL4jc4+IYSwJvJuHBupzdnf1T890prhoWFxACzmr+Y9J+ew40YSRRFhGJLJZHAcl4ULF9Lf38/mzZsPjE78gZ9njKFcLpPNZhkaGnranPTJ0Jie1MF6xzvewebNmydA8cmh32CZ2t5Ac0MaE1VwlACRQskshUwjI0MVxkoBUQA2BE8ITFhjzqwOHDm5935wOmOt5eSTTyaTyRwEYf0xOeeSJUt44IEHqFQqbN26FWMMrutOGOUBRxMLP4zzk1zXRQmZgPhOzFmVIsGVY20oiYPVkjCwKOHhuHX09I3RNzSKyuQIZI50fRsPrd1CXS7FheceQzC0U8xtj+zRiwuFoLTn35DCrlq1Sjy9ca5ZE1ms2DHwi5u6urq69u3pTltrTLFUolqtPWso+GvlnONeKggCCoUc9fX1TJ82nV/9Kg7tOtJPwVgnvIKOb0AQBNRqtQkWVBRFzxziku8d5yGuXr2a3/zmN7iuSxAEB3Vfxo075SnGxvrQugLCxFKwQpDyHAqFHNl8HZGxBEGEQNDbvZ+RkTEiC1Kpg2C7cdgrk8lw2WWX/UnRx3VdwjBk+fLl7Nmzh+7ubqrVKhs3bqRUKqGUmgSP2Qlpb4B0OhOziSCW2UlY8pOnPIRVMc0PByVT1GoRXd3D9A2WcTJZyjpCZevZtWeYhx/ZyBtfcxZZWyTPGF7YJ05c1mGLI3tOufSbD7pPx+WTk+FXx3VMXV3D2OPrN1gTgYkM5VIJpZyD+uF/7Zxzcqi11lJf3wDAkUcdyR13rJlIOw7kTQcX+4bYgIrF4kR7ddzzPTldmVwQGWNwHIcgCPjWt771FFRickSRSV96ZGSEWlBDeQrpCCyGodFByrUS9c31BFFAJpeJW3mhITKS0D7V441Hi4985CMcccQRE+SZP8Y4x39Oc3MzxxxzDNf99Dqam5uo1Sps2bKFvXv3UiqVkggVRx+RzD7lcgVqvo9UHmOVCsVSBcdLI6WDUi5KpuKxaquoVn36egfYt6eXwcEiqBTFWoRMFxga8/nFL2/nVRecxdL5rehKH4WUxQaDasHMrJ4xpW7+9v/8xEUrV66kk07naY2zs7NTGa2p+P7X93aNiOGRsiGUMaQkDELESmIiUe21/HEC439MUXWw5yN5YuOXMZDN5pFSsmTpInbt3sHGTRsRQsSLTkMfExlEEp4iDEbE+VyxWDzoPJ7tnMbzTaUUW7Zs4d577z3IaJ/u+/xAEuosI8V4FNjFZaB3lJFRn8AIHNcjX1dgYHiInuExck3T2LqzO6HYaZRySKU8jDGEYchrXvMa/vVf/3UCAnqmLt2zdeWy2SzDw8NccMEFPP74I2zbvomGxgJCwODgINu3b2fXrj0MDQ2jowipYk5mx8yZpAoNDFcChJNhX3c/e/Z20z84yshIjZGhgN79o+zv7mPv/i56B0cIAg8rPMqRQOZn0FdMceWPf8c5Z5/Imacsojy4FYcSrhB4gU+rizxiToMywcgHVn1ylUkWKjzVOE877TRjLSxbevIDPd2D/Xv39UrlunZsbIwoimIi7d/IEQQBdXV11NfX09HRwU9+8hOEiPUsxQGu6wR91pWKKIwoFouk02l8358I2U9X2E3MWCch//HHH5/oeT89LhrDL929Q1Rrlmo1YteufezeuYex0RKum4opiBaUEnT39mJxiYzL1q37kJBEpwjfD5g3bx7f+MY3+PGPf4zneX8S4WP8M9XV1SGEoLGxkVe96hI+//kvoKSL43jYZK/82OgI+/ftY8vmTWzdto2urm6E9GieOps9PcNIrxGoo1bxGB6s0tc3Qt/ACCMln9GKpWbzkG7Ddwr4so10/Xw27xziqp/8inPOOobzzzqSkb7dpKTGRaKDkJSSmKAsDj9klolqxVmffOvVhxArxsinGGfSQhK/vPPT63TI/i1bd0mjrPUDn3K5jLU85Qn+axRETzacccyyvr4eYwzHHXcs3/32d9i9exeZdC6ZwJUJrCtQNp5h3N+9fwJKGa/YnwmamcxFBdi7d+/E+/GDKp/K5hGS/mLA4EiZxuYplCoBoY5lY8bZ/o4UuK6HtopMrpG9XQPs6xnGUS4GWLRoEZdddhlf/epXOeWUU1izZg23334799xzD77v/0l5ZyaTwfM8hoaGueCVFzBv7gL+7d8+SspL09zUSj5bmIDjtI6oVGrs7+lhcHSYxUcczqNb9yFy7fi2ici2YGQDochSwaMiMviqGV+04jutOI3T8VUrN/92HbetWcvrX3sa5710AdXRHaRFBRlFEBkcKXGVIApKYtqUjJneVmj73e9+sgTgxhu71VOMczwPt4BP/6pNGzcxMjZiwjCkWDyQPP+tHKlUvNli8eLFVMtl3vKmN2GiKPGVNg7lyVrAUrHE8PDwBJw0DkhP5KlP8oTjKMH4v9dqtT8IoVkp0MC2Hd1MmTaHdKZuYtjLRJq0l8IaTUtLCzNmzqaxpYMnNu1nNARkrCQyPDzCzTffzOte9zqOOeYYzjnnHF760pfyile8gp6enmfsZj0btuu6Lvl8HikFY8UiH/jgh5k+fRZvf8e7+PHV17BvbzcZr0BTXXPUWGjWrvKQQlDxq7z8kotNf2j51YPrEe1ziBpmEBZmEjbMwDTNwDROJcq1EblN9I1E3HrHY6z+2Q2kvIgPvPsijjmsnai4j4wdwzEVhNY40kEYGzd4TIWGrBEtDb4tFvcdI5Vi7trLJyrUydYmrbVmwy1j03ZufWhFqEeOX3rEYlqaW6QQktbWloOGriYTQP4Yb/hc8Lln+7pxAocQgkqlQuD7lIaH+d1vf4unLJ1nnE0U1dAmkUOxsHv3bqp+TB2rr6/nnnvuIYoiXvaylz1tQTS54FFKceedd3Lbbbc9LVFkMvnFWEt9RnH2S46hkLVUSkWstlhpSHkOjQ31jBZLyFQDuG1cufr3dA8UsclamHK5FBdUtdpEwTaeerzzne+kqalpooh7pijzdC+tNaOjozjKJQhCOk/tZMH8Rdx953186Uv/y91r7tc9+0oOJiWbGupMfUNDoK1lytSpau6CuVzz81tYu24j2/YPsHHfALtHQ7uzf8xu3Tsotm7dy9oH19Hf009jY5ZXnn8MZ506j5xTQpd7SVPDIYxVARIST7zOM9YuJZVmpCbkuo2Ds/b5g19+YtK1dSDekLB06VJ74bEfPq9r2wPfO+/4pa3r9q6zezZvlgvnL6BWqxIEQUI8EBOz2vYAQ/WvV7uP09KEoKmpmXKpxKGHLKV37y5uXL2aI5Yu5mUr3hAbo5tm3564Ly3VgXGTgYEBWltbD/Kcz/ZATGb1P5P3Mkl5ODBUYXikQks+R0NTEwM9/RitcZUDSPbu70GkDKFbx959/TjCi6FtET2lfTn+MPypLPjxz5XL5SYYYFZbhoeGmDdvLu99z/vspnV7RHvL4l9e++Pf6u9/++cNSxcvODPd5D58+hknn3Do4fO3LD/p/CnX/OrMzPoHH2K0b0CWSjXuuONudetvbhJpWTMrTl0mLzjrBNryguamOnRtN6a8GVdIck68Wlsg0UBkQgQSRzjx3ngpEVFFzp6SjZoyovnj5375glU//udfXLviWnXJ6ku0A7B69WoD2PneoR97ZeeM1n96w2nB168Y83Zv2IR52cuIIsHY2BiZTDbOwybdICn++oVSjF1q8oU8xhjmzZ3FGjSHHXII//u5L9B51svINrSwc+9uBocG8VIxFzKMIqw1DA8Pc+SRRz6/JyUlwsLIWJGRsTKNOUG+Lo9fqTA0UMJxHaq1EG2gsaGZex/dy2ApxHHqCGxtPHF9RtTiT83dgUTcIke5UkEqhXQkYRBQLAXGVfVqWvuCn17T//mrXMele8/MozY+/PuW+9dsep/xosLyI5cvnDGz/bGjD1m6qLV+obtu6yM8vq3Wd/YrL/tl96Y7T587d+rcw5e0UO3dLsLhXjy3inItUlvQ441lGQ/NjWO5xmKNRAoQQZWpLa22uc7JPPLAmlaAr/d9XQDIpDqy717xv3Pymer8U45p1bXBTe4x86ZS7O5hbGQMz/OSIS79Z7Heny/DHPcCjlLk8zk6prTT1NCAC8xsa+HLn/00I8N97O/eH+upJxOkdYUC27fvsOvXP8H8efOf801/Lp9ZJ1IXo+WIfd0DMVM8CGlsqMNgcFyXSrWGH0bk6hpZv2FLLEFj+AOUvz/vGPe89fX1QEzNszZCm5BCvgDa5Yc/+vmuTtvpHB4e7m4c+MkjUu797ZC+67y3vPrdb3j0/t0nf+/Hn3vPt77209995tOX/+7LV/zgvHTjvOXf+vnn3l4rSz+sVrFBv5VRN3VeCYXFmBQGFyOdeNsIE+NEsSoIdmK230Qh+ZSiPudy+/ZbiogDDLqDCqKUBNf4wvgjLJ7dQr0N2P3EOlLSUqmVqEU+SkkcBBjLX2L09g8Z/HjOOX7h6+rqkdLj6KOO5vHHHubMU07krptv4IFf/4ap+UZkFIfGVCZHuRLxgQ/8m7BWMWP2TJCJStzT5GmTc8vJbcPJJOPJRiuxuJ5HBcHa9fuohHkq1ZjHmc/nQcDA0BCFwnR8P88TW3swUqBViJUmloB50jmM/54n58V/TL4/DofV19eDFZjQIIUl1BWUp8HRdqi2N7tGrInWMtesYIUyBmlNp/PF771+d390w91Slu5c33f1+ev6rz5Ti0dvvvOhL+0VQphycXQ4m3aFpxzrOulYh17EYl2JXCsoEQvdxieDNbFinyYEDI4xZIjkjHaXI6csers1VozjnXIcQvrade/dGfhi2+59Felmmk0mm2ZmRx17tmxG+1WsNfh+QPycC5RIeqz/D7znuOGEYUhTYxOOl+Lwo46iFkbU/CIvPaOT667+EcpqsJHNZeoZG61GH/rgx4Id2/bsPWbZceTzOYuw6ERr89k4oONz9eMzPk8GwY0xmMhQrfoYa7nz/ifY1z1CqAXDY0VyhToqvs/g8BhNzdPY1zVCV08RKy2hCQjDgFCbg2apJpMzgiA4qM36x4T58bw1m81SKBTAWKIwROsAqQxTp7YJzfqxcRh7dazgZ2BNtJKVMjbWFcomL+wKtYxlrrVWRGHVEVIn3t/DWDkxNyUwE9zP8bOViVBZPIMYj3M4CLRfEVNbC/jFsUVCyIn+jkwKImmNEcJr/dSvbt/JkJ83uFkOPXQxu7dvp1IsY7VkaGgMx/HQ4/QuY5/fPbTP0buOt+aUUngpj3x9HfXNTUybNYO1jz/BUccea3v6++3mbVuYMX26GOovBf/x4f922hqmds2dvWhg7rwFONK1SsT7Jp98s59cII0XFU1NTdTV1ZHP58lkMqRSqQOvtEcmm6WQLzAwVOGRxzZihaBSDUA6DPQPgVDUNzazaetOkJJcLpsYTT35XPwzM5kM2WyWXC5HoVAgl8slIflPj0TjqENba2s82aBELHQAtrGp7s5ZzS99m9aIJ1PXVrHKxMZ68Gsu8Q7NoFYlm0qjozCm2k1Of3gGrHqyyJlIRHmtobG+YB1p9b+d9/XG8R8zXhDpS4RQjwhxY8mf/sXrbnrwA2979UnRgrnTHH5/P3t3bGfJ8dMojpaoJcRaHUXxRgjMXz3nnBhDBiKjydXXUymPcPiyY3ngrjvZ0zUoNm3dz4P3b/Tr6uYG//HhLxRK5eC/zj3rhNrah9Z+7LBDDtVKeUoKB231M3pnpRTGGN75znfy6le/OhZxDUPCMMTzPFKpVLI5QyJUrDOkAFcU2XD3tfRsvZ2O5kZGx8YYGBolnWuif7DEu/7lg7xn1f9inSwWFY9FGEuoQ4IgoFqtTjQAIB63mDp16gSs9Mfm5+Pes6Ghnmw+Q7UW83QjrcWipfNP/tEPbi4ISSIJs/q5Gr49QjQHDYUcxh9Ldm8+c0/7ADw3/kUTIjwIoWU6JcKZHVOnb9//2D9Yy9cuXXbpgQHzpay01q4Sn/78N7/wqX95zRv8wS0t7377P9hZbXVix/r1HH7cKVSCgLHRUZob6yc9lf/vgHhLLPuSq8vT2+Ow+Iij+NGPVvOlr/5oyPVmqG984xebv/qVX3W1tjffvG7n9d8xV4WfW7rkcDVz5oxQKqHGk3SlDhZWGJ8LGr+5U6ZMYcqUKQf97qGhIe644w527NgRcyStxQoPow1pSuT0HqbV1aEcS1//IFZI8vlGBoYrfPt7V5FqmYVwUvEeIuEipaK5pYnly5dz2GGHPeWzjhvrH1OITtYSMMaiHIfWtla2b9sOQtgoCpkzd3oRFQ1d9vav5fu/sab6h0xz5cqVctWqVWbla75++IN3Xr4o7RqDtRObbYy1z1KJjK++UUA0AXqGYY1ctgFHVnnksXsCgLVr1x5QTI23Tkj7yf/4zKdmdLQ2ndm5yOaUlkcumMGax9dTGR4m1dDKyMgwTY15xseGBc/OpfxLtzi1MTieg5dK0dTSYWbOPUykvI7bP/dfX/ng4uMbu7/ynpvte796rv8v//LFzDe+/A33vFecPtjc2lTvuk7cdExkvp/9abfUajU8z8P3fT772c/yne98h97e3mc8v5ccOYVVH7qInt3rqFSrzJgxC5mq44kt3XzmG78mepbPdcIJJ/DBD36QCy+8cGJyctxDP/ncnivSoFQM9Le3TaGnu59ypUQQBmr2vLaeeXPmHHLnrx8+Yx2rf5nsa3pmKZPbkUDUN7xvfkt9oS2TtpEkcoQ1WDFZKfpZHpiDsGGLEoaMC00FD+30F0QUazRNrtbtqaf8zglqQ+e/4TUvdU44epGw1VGWzmrGHx1l387tOMJQrhQxJsKi0Sbi//UR743UFOrqkK5nTz71peKRR9a1LT6+cae1+O/96rn+smWXuoyRmdY+85KTTz92t3CMSmc9q3U0SWH4D3Mju7u7Offcc/nMZz5Db28vjuNMMOIdR+F6WTyvHqUUhUIdQjj09/fT2NiM52YYGhmjq3sQpRTZTBbPc/G88Z+RIpvN4jgO99xzDxdddBEf/vCHSafTTxFF+FMhvBhWcpg2fRZIV4SRj+uohYsXz85t3nuXtNaKP+Q5b19zOwB33fmrqo5GbSHnokN/QiPy6U5tMpl54lwSBTNLzHgLw5rT3JRi0Yyl/2K0UWtZG0qAlZ0rHcBOE7e+acGsttaZ7U5YGeqTjq4xvbWOprzHlg3r0WFI4NcolcdQjoPW4f8Tr3nwBwcTBTTU12F0JOctmGuydU0zLjrzPxYIgVi6dIW3du3l4VVX33DKscceP23K1LajrQhjcQss1tinnd95OgN905vexJo1a6irq5sI+xMUOmMwocYkLUeLYGhoGGMFTc3NDA4N0T5lKsWqwdeaIAyJIo3WEWEYJRuGzUFkjc9//vN84hOfOEhQ4c/BlpVSRNrQ2tpMQ109WkdYEUVHHn3I+rbM7PcLKSys/gM3NN4aPBDtT6fTQqRTCqvDRH9UPyu4OKGulyA9QqhYnc9odBSQy7kE1ZJzMPHjtDhGd8ye+nj/wKgeHYlwUmkbhUXyXsj8Oe3s2LaD0ugQNvCpjhYTIQD3D8IaTybmPv3Ftc/6erpe9kGkWiFJp9OkshnR0FJnFiyYP+vR9XccZq21mUyj/eLKa5uMa9978unHPpJKu1FdLmdiuZWnl0qcDBGNs5C+/e1v8/vf/550Ok2lUnmKgkg8um2Q1sb7xf0aw8MDNLc0UimPknIdWpubyXpx0SRJVkBbOSFwG0Uxa8r3/YmZ+c985jPcddddeJ73Z08jJOQpAGbOnIHnOlSrJXn0MYccn81l5l901hcWg7VPN88zyTSN1VYcO+f4D8/uyOOZUEgTs+KtkJNU5XiKAIcQEiUSRqMVGAxGWAQKzxoyrma02GPHazI5iS4nv3jFux4MTdPVP7punTtm6kOnvtWWqyGz58ymv3cfvfu7UVZSHC2hI4OQ8Tq9P9Rme/YWnH0Or2c2TBAYC6E25OoKKE+KJYfMRVjnMiGFXfvw5eH1t/y8ubkpe/yhR8ybHga+k8/nJ4KMkMS0tifhh+PMfykllUqFb37zmwcpfkwesdXGIJQAaf//7t47zq6qXB9/Vtl7nza9ZTLJpBcSkhCGEkKZ0BFQBB1ELFe9igW9P+UqtqvD2BULKhc1CnYEggoKSIdQAoRMIL0nM5kk08vpZ++9yu+Ptc+ZM+lAAtfv/nz2J21yyt7vXut9n/d5nweMalOx2xa04yAjBIYSKXiEoKunB7VVpXAAkKCFp2HUl0nwusUVeR4t+M1vfnOMOnIaeRORstISTJjQgGwuQxunjPPmnHhC/QuvPjYLhOhi2tqhKvX+PVucqQ3lYCIFpgmItqA1HWuceQiJIqIBqkyl7kOBgoP6PkocCtdN4uplB3aIdDOa+SvDT3947c7EX77xs6fsp9Z5JC7r9YRJM8FBsGvrDhDqYCSdQla4Rj4GR2YaHWy04fX0iA8V5IQYeeeyslIorciMWVM9JdW0t1/4penQIL29qU/OP+nE9TU1FRHKNBglpDhBOhgrqRhPffnll7Fx48aA0CwOpNgB0EKDSGPcFInYWHLJeSirnwC7ugEV0+bBHteIjGVjZtNJqK4pha99MAKwQE/eeG1x2LZdmNPPowYrVqxAMpl8gx5ERZ+WGIvChoaJqKgog2VTtvCUE3QmOXiKVpq0F9HWxoa2JhrQX7r2tqmc6aqa6rDyZIYQKgDim9JYKehAyTjf2Tq0UNuosrPwfYQcB7bFsHPZx+kBwRm0jcj63Lr3ZewZP/zFX9aM/PjXDxJPUj2tsQ67t21DLpuDC4Hh+KDJs46Qr+0vPXhgcB2Z8lXMyjlYcFLCzdy4ZatIJEyr62LbS8rDZMf29jMpZXpwqO/0K6646NScmwxHoyHjf64JSLBqHewzG9cPU7S+/PLLY2QEi4On8OApCkYpfOmirr4UWZ3G2h2bsXnvXqzdtQev7tiFNTu3omtoH2oayo3DBJHBCMwokTmXy8HzPPi+j0wmA9/30dnZicHBwdf9cBeHl1IKhAb6USCYPGkyPC9LTj1tLikJlVzLGCs20h1znNJ0CieAXvX8EydNGF/ROK42pISXpoTKAO8mYIQHBOuDbetkTAaloUER+HNKUxjZFlPtWOoTcqD5TpCvEgLgC9+84Y6f/fbH19911s7OM5rmzVR3/vN5OjzQh7LGCiTiQ6ivbDAdlv3Evg4m8HW0RNkDc9NRLPVQChVKBmrGFDQcsUGomnP2kpPx8CNPXP7uS27cvb1jw+JpM8fJbC7JSktrzUUhB3OTGFvZ5j/D8PDwmHbgQVdvSkEooKjGhCnV2L5rLSSG4blZEHBjW00ZGIYwsbECGzftNls4ZVDKTDteeM45mDt3Lurq6jAyMoJUKgUpJWKxGEpLS49BA2O0miaEQEgf4UgIFZVldNx4LU6YM3WcvS16/s6+B55obm7mBVvJ4Jja3q5WaU1OrjplzrRKqUsjnGBYBEQOAmhuVJuDmS0VaCkVr/h5++68QDelFFpoY79ItIpGSyIfOuUbM37/xNe3HcoZSjdPmhT62o8/0nVq9cJcPKNx8vyJWrhJ9O7rQllDGfycByV9MMsxjJxDBOYY94lDFEPFN3t/XaNi8sKhVk9GKYQwK11FRRn2dO3VU2eOB39KXTaS6njbhMnlT5SVRxclEtloKGQXsYDyjhfkkFs7MDqekif/HjQV4BSu8DBv/kR87FPvg1Q90DIOSgEi88wcAiUcxMINUNrBP/+5EqEIhxQKvlLYtGkTcrkcrrnmGtxwww1j3mP/a/D6KXS60Gq0uFFNrqwoA9U2FiycFVm9dk2z1vpJQq4+4AlcBijCmV5cuvDD82bVEkf7REqz/5LAoU5rWUA/Dna/8gK6RPOgEMzLUWrCuBaVZdXlIc7epTW+d+iqrLPTb21tpYPS+/Wm7UlSUT9TjZs4SW/etAHSlRCeQiaTBmX0oCz1/We6Xw8z6dA55thg0gHtTEmNaDSMSNQm4ydUk5IyHn5+5ePRK9916fm+n4tyi4GxvCYR3a8gG/v6xStkcStxf/JJftXMGxAuOOVEjCSHsLenG0PxFOLJHDKuhK8ofEnga42kl8IJC2aDhwDPF1CKQPgCu3btwpNPPonrrrsO06dPx8MPm5n8VCp1jHUDdBHEwEAZQ3VdKT3n3FNRFop+kDGq97dwDPJNXHfBl+q9dBeZPqFEw0sFZGIS/OtruNdk1H5HyeDRJYDWUhOoNHA4T73WVt3W1qbPbbru5TUbN3n3PrDarmmYgg07d+hUIke4E8VwKoHSyqpDBtPrfcoPfOLIYX9OCgXOKYQ0GvOVVRVwPQ+TpzTodCaJefPnIJNNkWg0BMb4fjaDCFZPekTa2cEeFtOBU1Bao2Z8KeKpEfzrscfAeRYaAbtdcVDC4IQs+ErDFwyOXYeJ0ydi5/quwsy4bduF77Vz505cddVVuPvuu/H2t78dvu8fB/OCQA/KfH1y1jmnihkzp1ZhW8n5O/seeKLYKW8JlrDlgGxa+ci5J0wZN2XS+IjvZ3dbUU6MhTVVMFM/5DU9I5QQ+FIWgpNRQrSWocMHZ1ubakUr/Ub7N3YsmnL1u/7x0OpvCXtwJqgI793bp0uqKpBIp4hUslBUFI/bFgthvZbVc7SToFHEKz48dkqNEACjFIQSlFdUoK+/HyedPI90d++DZVO4niwk6cW515EC8lAPGSkS5tcaUJ7GzOkzMGv6HLgiDm4Z01MQCqIZKOVmdSFAzpMgOoqamhHsRBcYM73vYrMH27aRzWbxkY98BKtWrUJjY+MxCM7iLs0o+UJpBeUpUlEd1Wc1nx57cfX/nqO1foqQJWQU31wuKWeaInfttElliDmKskxuNDsiANES+ggBSswAUYFKp2Fmr7TSoKBESCGUot2HD86AMgWAvNBx9wOU0Adu+I9bLnjw8bv+vnXLjtiJJ52AbDqLbCaHaDRagAyKLVuOLijHtrXG+vWQwxZNo6x4mFYqNVBPyHEQdkKYOX0a/pqJY/PmdZg9ew44M2oVYwOeHZbLeVRk6MDUof3Fddjw6hYwbhQ0LJuDEAWLMzNwBwKtGVzXQzKZhu+KorSIQhqRzkLKEAqFMDAwgF//+tf41re+9YYVV8wnYPvxPVHcHmXnX7oIdyy98yOM0dZR3zqzWrxr5v/E9nbdftqi+Sdpy8tQprMAZZA6DKJtWNoPzAsOdz3zOS+FJspMrWoJqZRm1OaJ5ED33Y99/U+GwH00i68Gna1m2z/87X897qbprXs7k7lk3B8m2sJIPK7zuo9v5ejw/i5tpaWlqKioQGPjRKxe3Y5QKDRGB/5Ir1VcYR5tUOSyHkaGUxjsT6K/N4F9XUPo3jeCjp2D6OoYwO6OfnR19qCvZwjZtAshJBhlEEIesJIXy3s//PDDhU7V8ZIECq4JOWnhCXLa1MbyGRVvPxcww4/NaGYgwObuB66fPqGqenpjtcilU4RTyxgcHESD/7CNGT1qr0gJgxLaKNXBgvRJYOGsj+DjXLTLbcRG0draSv902+rb167rumZgMPW3quqaz2aSaSWl5MUyhW/2bNHBvITKysowMjKCBSctxAsvvIQPflCMWXGPZFIwdnWhh31vpRQqKipx5TvfhcrKCjghC0899SSmT5+OZ599BrV11TjttDNQWVGB3t4+/PWvf8Xll78da9euxerVq0EpMbqWhyi6Ojo60N/fj/r6+uN6DX0hSDhiqyXnnR77/rpbl2h9zzOEfJ8C7b7eoyNNs+d89vSTJiNiuUwqL3C4H52G0Edx2ymhIMwIgJEABszlPFBqwfMVcq4qVGyvpeWg29o2khMaT94Xi5T0PfLgc4pStT3rujyTyehiYPqtXDkJIaCEIhwOgzKGE2bPQjKZwN69ewvOcUdz7E/2PdL71tfX4+e3/hQXXHg+TjhhDsaNq8ett/4vTjzxRFzxjivxw5t/hIaGRpSWluHCCy/C7bffjptuuumwD0qe7S+EQDqdPu7XMMB++bkXLUa5Vf4Ri79XtgSs96svueYzNXZ23Klzq4RIdtMQNw4i+dGMPFpxJCKQ1hpaGYIIJRREE3iuAIGFTE7AExpAi/G/ei3BOQcb2APtbZlcVqzJpXIXpdOJcs/LIZFIkPzWfjD1jCOdrx1MPhzERAtkkIryclRVVqGutg4rV75cKDKO5j3zfW0AqKioKPydbdsH9WciRCOVimPz5o344Q+/j8efeBSel4PrunBdF/F4HOvXb8RPfvJTXHTRJfjxj3+C0tJSzJ0717hXBCnR/timUgqhUOh1j2q8tgecwvc0OfW0BXLq7MmVE6rPO30ZoAde1KW9uzd+btFJtWis4pyJBJhWQYeNFHyHilGQw27Dwf0BzHyWlBqEWHB9QMHCPffcg9e6cmIu5kpCgIYJDY+6Xm5+X/9QrVKqIKbP2Fu3cu6fJGtoVFRUwAk5WHjyyXj55VXwfX+MtMzR5p3FzPT9NeRHbQslCNVYtOh0zJg5zawKhMD3TTrhOA7mzJmNBQsWYMmSZlAKnHDCCbj44osLgX+wh1ophSlTpqCysvJN2X2UlrCiTJ93/hkRRsS3QKE+95kPfqqUJuouOWu2rzP9xIIwtRKlANHGqEDLPDXriAirBoFQ0gzwBswsTS3kXA1mxVRLC157cC7DMqU1UB8rfai3Zzi9b3e/0hoimUoik8kcsk99pPP1XMRDr7yj22SeqHvi3Lno6+tFZ2fnURc5+X+XUuLMM8/E9OnTx2hk7t/zD4fDKImV4mMf+yjuuftvKCurQDRaCtt2EIuVYmBgAB//+HVYvHgRqqoqCz3zq6++2ph9FQV9fmXOq8tdfPHFxnOpSGX5+BRGGgF4wC95+7nKdsR5v7v1wbdt27HiY6c3jcPk2hBXmQSoNhOrihBIqgAiAKIOQF4OTTyhUMrgea7nwRUC1HaQdj1EYmUx4HUEpwn8Zt50+Xu9TMb966P/WvFXRtleSigSiYQ+8KaTt2rpHCPFUl1djaqqCuO+8RqMWPMBUVFRgf/8z/+EDIxKD1b07dvXi0996jPo7x8E5xyDg0P4j//4ENasWYff/vaP+MQnPgHL4njppRdw/vnn4cYbv4jLL78cX//61+E4zgHFJOccruuiuroa73//+98U8V4DMSsoKTBv3mwyriFG7v3TbQ+EndSki8+dDz/RQ4j0gubOKB5d4IkcxcejARZNCAWlDJmcGafmjKtEMgcB/9nglV47B6upaRZpaztXNI6f2UdV5Lz4UHqPlgTZVNpYeeXbWJoEgCw99rF3wMpb9B6aBpihyX+N6AIwZ84svPjCc0gmRozArBJFliX6IDkkKdjL5CcwTz75ZGQymcKKnF/pbNtGX18v7rjjDvT09AYqygncdded6O7ei40b1+LRRx+FEBIvvrgSL720EqFQCD09PXjkkUeQy+UK75vPa/Or9o033ojp06cXVP7ynM/jIYNubBoBX2URjtlk8RknkeUrHqRvb57Oau04eGYIDjMGBoxIUEgwzcC0DaJZ4DZs5tUPdprY12CgUERB+gQiK8A4Q45SNZJQWLfnlWWEENWEJvaaI6e9fakEAaZOnfzLZCJduXvX3skERMfjCYLDTt69qQsnWEB5C4VCkFJiwfwF6OrajY6OnfBdrxBYR8ORzNu9/PnPf8bChQsLvW7LssZ4JEUi4QK3gDFWkGm0bRuhUAic88Kce77QyY9k2LZdQAXyjsw33ngjPv/5z+OWW27BDTfcgO3btx/gaX9MV04Yh+Y8+br5nDMxvaZMLz5tIUQuiRAz1bWpfIrxeYqjXTq1RuB2Z4RrfVeCWRYEoUhkfNTTydHXu63n6w1y17++tVso8kpv73CD5/rC81wSj8eDKb/8h1Y4HqoLR1Ptk6DrkR9Cq6qqRFlZOVauXGWk9zBKHD5Ue7KYT+r7PmbPno0nnngCX/va11BfX49sNgvXdQtOypmMmTfPyxe6rgvf9wtGCXkLcNd1C3+XzWYLr+N55qE577zz8PDDD+P73/8+fN/HrFmzMHv2bDiOU2gRHxc8OS9yQBgAicVnL0ZldS3p2NMNOxyF0MIUQAU5dP26giffUfNyOfhKQxKGjKfgKYbZc07mZoduOmoQfj9IaY5NCPEmlV/wt47tPQu9c6Rl2QzJVBLlFeXQSgdVnM4Tr9/Uw6h4GI5nng+ZzWYxa9ZMrFy5Eu9//wgi0UjQtpNFD9Shj7xTW0lJCb7xjW/gk5/8JF544QWsXbsWAwMDRVW7GlO4HIxCWKy7lP/VONNNx6mnnooFCxYElb5pZ77tbW8rvJ7v+8etE2fWQ9O18YWHaEUFTj/zDLzY/gLOnHQGPKVfV8Dsv3ISSkA1QSqVBQiHr5lKu5Tv7untaTrvHXeRDcDS9qXidb3XRrQIQtowftz0+zdu2vCZfd29S2fNbPxCKpW0hZTUmCZRgMoDpP0O5/mz/8+8bgwUMORjQgvB2dfXh/nz5+Hll1ehq6sLdePGjSGnHE1/Pb+lCiFQX1+Pq666ClddddVxyanzFjN5hnyenV8sF34wTPmNbusGtmQB7xJYctEl+NkT/0TCBcosG5q4hxzN0dosSuQQ95IQAsqM65tWGm7Wh0YI1I5icMgjQ8lc+kd//0JfcfXwOo42rTXIi1uWruc8nLn/3uU9jmNv9D2fZtIZxblVsHl+KzpFeSWP/A00xlocEyZMQCQSQXtQtZtRDHXUxUWx6lt+hdz/zJt55bf3g50H+3/5M9/7LwblGWOjsjfHVXoyz8kkgT23wuJzz4NLQ+jqS4CHo5BSveb7kf/cpqmgQRhDJpODlgBlIUgaQt9IFjXjp5doPdoEpa//W8yxtFbEdeVfR4Zy7wIlLwAUqVRGE5gujaHpq+MSgIfrNNFAajqvDme8i8rAuYVZs2ahvb29AMYTgtc1OJZvLR7rc3+A/3D58PEJzUAyBgRKC0SrazDzxCa8umUnEI5AE/KaMOriYUGtFKQ2k0OpeBpaMWhigfCw6to3rIeyw7czznVLQBV7AzhPiyCEaEJCvwfUiTu27Lksl8vpeDxOpVKgFAFl/3VepdexFRaQ1cAIKy+0pbWGbTvwfA/zFyxAx65d2LlzZwB8M7zFuhDHpAA8hjkFtDICD67nA6A4ZfE52NU1CEXNLNRruan5FEUH34MzDtf1kXM9UMohBeAJqGRaEKr5FiUldjY1UQBvJL9t01oDnQMPr5+C8+S27btT4yedRLKZrPa8HGybG4i2MMmvDx13+e0/IAFTTgorLzTAqRVI36iANZ7vz3JAExCqwC0zk6KkghISbiaDkZFhxFNJZNIJuG4OUmo01NfB83Lo7OzA7BNOgPFYU6BFz+mYbIQUM54P5J2OUncNxqsDfRt9AAeOHHotCNLyURUhMuY9RoNUjnl498/9zLhKIKZFzXuOkdshhk2htZHwIYTClxKUUHOtGYVNOSgDwCjCsAAoWBEGDwRaElCwAmEYMEUnJcwMruU346KFQitjs0hAAMbAqA0vl0EOAGUaIFwPJcE7+jI9s+ec8eKqFS8T0r5KAOQNFV8aaKVC3ESmN1z09J7dPS25XC7phJySeHwEdeNqAMUDpwh9mJ6ReVLzF1ATYpQ4tCEiEBBIkaeoaChtCgUGC5RyeK6EcNMYGUkjnkojncjAdwWE5yGbSUESBcoATg1TKZnMIJvJgRGOoaFh1NbUFGSg8x+CjFnB9SGXdDImUEzPmI5iMgd+U3K4Tspovndgh40UvvuYvz3ggQkCJEgNfCWC3JECUhlndGl+3rK4oR7T0cpfSxfDA/3o3rUHq1Y8h61r27Fl61Z07dqCT191NpTvwaY0UEqRhfc0wz8KOhCHhS565gg15q6B8AWlDOm0B09pMC7BbVv3dfu0P6kTK1b8csufA079G1w5gWY8TQkhYv6kdzy+fs32BZdfuThmO7xkZGRE19TUECU1CNOH3wY0AM2KvpAuxAQJWl2Uq0LxIqRELpdFYiSFVCoDN+dB+DkI6cKTChZ3wKmNkBNC2OaQyoUnJDIZD7379uLOu+/B2Wctwbhx49Hf24fa6lpoJc1KF6xeggT6zQT5Zz7wg9hvRS1uTiluAOrDbc+H3Q51UX8634NWQc0ayH8XBSJBvipWhWunoCCUhFQyWM0ARTRsZoNSa+y67XkYGRjAnl07sHHtK9i8bh32dXaia/s6+G4OE6rKMG1yPcpyI6ioH4ezFsyD7n0lIDwbkgfBfv10PaqHVNhRCDEiC4yDaYZs1kMqmYVtWfAUgaIWtnfu0xMnz8ps3b6NklGNoDcWnMuxXBBCcP1X7v/jLd8695bdHT0ls0+cpLJuhnqeB5sf2QfdXFgV9FuJETyA0d10PQ9uLoNs1hBLkskEPN8V0KBKKMqZBcYZOLNBNRB1jBZPJpFAT28f+vbtxa4dm7BnTx927+vD7j1duPzKd+JTH/0QFGUoKSsB4wysMLpgtnit8vPVeXhlFKzNL1YaZAy5lhKZXyqC9u1+C6BmRwBHCBRRxWg4ADra/YOGzL+ucZYOdIfyHSPjTsH3ewuZyyA9OIjufd3o3LULOzZvQOf27djXsQO9ndvBhUBFjKMsFsaJUybive9ZgpqaKKKWRllpFfb2CXzju79E367dmFLCIX0z80/HzCKZFGKsA6UuSmcIpASYZWMkPgQpAOY48BWFq7jqHZZ8KDFyK6FENaOZL4eZl+dvPH/W9BOfZH5NbOF92zd3vX/GrMnEIznkMmlEKqohtF9w4SgepaUFiAFGTlEK5HIu0ukM0imzKqbTae35rtTC44wxcGohFivjSmkwhyjbYiqVzmJwIEUSQz1s76716Nq+BSP9/UgN9aIyGkNdeQQTIDG+MYo5dbOQ6tqET3zwPaisn4jq+lqcesYizD7hRDQ2TkZdXR1Ckagpkg5EOQ9Y6ZQaXekkhFmBg+4YOeBGyaKdmhQKt9GbSEE0N0oktOhGF73OQR0wtY9cOoXe3j707etHT9de9HTtRk/XbiSHBtGzuxM9ezugtUTEYggTH9XlUcybUIvLLlqA8bVlqCoJIxbisAmgvTR8txckm0YyvheV0WmY3jAO69ZuxtxL5yE9mACjxkjW5LijD1Ih1ww+PAkeLMoYoBg8TyKVckGZAykoNC/V+0Z82jmY7J+z4OyVrz7zPJZgiVoe2Gm84eBsampi7e3tyvPoE3v3JD6QSWWHqmsqK1KpFKmuqoH2tXmiOc/PVJruh+cjlU4hnUkimRhCOpNBNusq6SuAMKqVAucOqSyr4blsWoRD0eFcxo/4OXL73j39pw/2Dp/e2dFJe/t6kIwn0bn5ZUyvs9A0axwuWDwTjXVnoKbEQZkNjMRHMJRx0Z1IIc0d1M+ej81dPdi8uwsP/fNO/P1eBTebAzRQVlaJ8Q0TUVldh9raKpRXVqOyshqVFVUoq6hARXkFSspKEApFwDgHSD5o7WPAcTHECSUE0pkMUqk04okRDA0NYWhoCImRQQwN9mJoeBiDg4MY6O/FcP8AEkMDsKgFRwmodBoRKhBlBOOry3FqTSlKJ01CJGyhNMxR4nCEHAshCyiJ2uAkA6ri0EkXjBlZH4cJcOpDSwlKszh5wTSseGkNkupkMCsEaNeQRIL0x2DKhuwzJtUhAJTpoXPLwcjgCDxPglphSM1A7FLd0e/SjAx33fnsT9YBIMFQ5bEJzssvv1y2t7dj0UlndXR2rh8e7EttqK2tPTseH9aUTia2ZXSJfDeHeDyOZCoF13WRTqXhea6SWhLGGKGUIWyVUOrYEELEKbWsTCY3mBzKPbN1854Ln3zypb+VhCs+sW7D1gv9tKwKR/i6ru4dL5w0fx6ZOXn8tFwnP+8LH7lKzW1wqEoNws+mwfwR0HQG1RSIhjVCVGCEUUyuB+omNOLMc2ZDcxvC13AzAvGRJIZH4hgaHkF392a0b+tHKp1DNqvh+TrQMPIACti2AyccQyxajlA4AidUAicUQihkw3GMKy8hLHBbNqdWGkIqKCnhCx8i6LVnczm4uSxSiSF4uTSyuSQ8PwvGbDgOhxOywQiDxaQJsvIS1NTWYOqCeoyrmYeycATVZaUY2Loeib0dKLNtcM+FJXMIEQGHK3DuIcQlQkyCWR6gJSxBobQPKTw4FgeRBIIws9opAQoN4cZx4txGPPzkCnR2JzGzOgqZccEoN3pLMl+xEyhoM6whVQF5MF0hCl8KDA8nQZgFBQpfMUgSVVs6emlK4aetX2+lT7c9TfNb+jEJzkA+EQ+/+JPlU2uXJLZu3T1r8ozxe0Og4zs7dmqpFBmJx5FOZyCVMLqelEJDIxKJUEItSKmzFBaVUu/q6R/465pXttTu2r73rL7B/hNefXn9gimT5tQmksmzuEj8uXbCpBU5lXvqc9f+YPcHf1yffmFzByr0uU+dOGUcplc5Ort3PSyVhk0oGCGgVMAipriojDJUVJegoT6MEaEwlB1B2peALxAiQKiSYXJDBSirA6VzzYVUGr4v4LnSEDQ8gUzGhespZLI+XE9ACAXXFfA8Hzl3CML1IbI6aNMVyyUa3SfOORzOEbEYQrEQnFAJLFYGyxqHcNhGKGQhGnMQjTmIREOwLY5QyILNuDGdDZobwndBpIByXUR4EtRKwlYjKIWDWJghQjkswmBZ1PA0IaBVChAG/oGm0ErCohxMUWP/xyVALFBFwSGRzQyhsrYGEyeMw9q1WzHv0tnI5GgA0itj+QMKEgQoCKApLRR/WgOUMgwOxOF5PqgdMz16HkJXfwKDCYWmhecPt7W1qebmZpo3yDomwRnU7by1dYn689KX7nngvmenXHLpabysrPydnV27JMCY0oBj2wjxMKTSgmrmKQlnZCSxsXvPyNRtW7v29nT31/d0D4zf3dH3noqqssbdnXv+Nb6x4RknFP7NlKknZ+5/4qbNhBC1w0yE4IM/+iOa0GStcleppmj99He/fzG410cckgNjEr7yQEDACYPUApxx2EQhm03C4RK1VaUoRamhcAmNbCYD1/WQyWWRSQ/BlxLZnBfI+VFY1EaYccRKbVSVcFBmgfG87hIt9N7zbcb8PBUJxjVAVEBGGZVtMWC3UTVGMFejtYJQftAezYCqFGRWIpkxKmyEmP56OGzDsSxEohYiNIyIZSPWF0FlpgwllgPi+YAIlKe1BJQyeS9RoCwvpqDBqGUKFgVQyqHgB0BOgH3qHKifxMK5k/HMc+uR8+cA1IIUObAiBEODFqC3AinNRCZ8qTE8kgK3o/AVIKFBnYjauSvDEi7d/OFPtCy/5/kf0eXLl4+BRI5JcLa01Oq2tjZ16uSPPDCs1IPrXt12+0mnzuwKR0rrpVC+kpq4WYmuvl62b+8gf/ml9b8KhSLX79y2e0Iyker2XLmrNFq5aygxeOv0ybNHliy6rOvbv3135/COtQCAfzy5HoS0oQlNVjumKmCOvq6pmy1tXyounHTJpeMqrOq508qESnVzLjwD5BNiCi0BaEahATiaIZvxkE2mwcqi8JWCrRlsSsFLoyhBFForKCULMoSu5xqhLVdBCgUhshBCQfkKvqeMFZMKxPf1wcYUihnjxVI9BjTLz6azQDaQMRN8FmOgNoVtWQiFYrBsDuYwMMJhUQZNiSk0tERIAdRX8HNJaHhQvgRXCooISBpQ1KQGA4GCVVB4IzRPlFHBDPkotisJhSIEFgPgxXHClAl46MGXsacvi4aqGLR0QZQfQEocioziviSYLRJKwOIcAwPD8KVx89CBSI8fDqt1ewe5b5f94AMfWJQIjBLUMQ9Oo6fTSld1tj1z4sR3v/j3ZS99xs1Z6eqaGr59y9ZVvX39XjKRWzwylMLurq4nwqGqBRr6f1Lp7PNN80/b9dALP+rcmzKv1bvxBTy/8bcAmoPPtly1ohVtuEm3g/hAOwBguL2FgEB3DXacc9lJDaHa0ogv+3OQECBaQ3NSaJkpw3AFYxaoVkgNj6BqQh04ZSCKQEoFX+oCfY4GsFYsGkM0GoGUCowYjSXTtNKQIhiFVTrwCjPbeEEkVY0NUD1GRtzg5PleuvmVgDI9hkPKGCsEi4LxdGd6FKkSSgBCwNeALTSEL4w7cT4PpNT4LJFRYOBgQr6c8bE80TwPl2poLeHJNKoqJmLi+DqsX7cdky86CX4uCUJ9MEICpGHUtU0xAq0IbB5CNusjPpKEZUXhCwlm2aDc1n1DGdI/lBk6ee6S1Wt6HydzWudotB34WB+rpiwBCP1Uyz3hl1Y//Ie+gd0TKCMukeClJdG+tXvW/vTcky7OPfXqL1Yg6Gjmb6DRggSAWt0CYE7rHJ3PZQ/D7tK/+MrjDbff+tkNn7hqSun588tgp3aSsHRBKYOgCoQBTDuGWKwFCHeQphSirhKNi06Bx6lZ9aQG5XlJbREEDwkYOHnfW5rvMRZg+TEkDDIqq2jGXsde2oJUdwFjNls0JabLorQRks0TefPa6jrY8oMwAg1WZ0UMwE61RkQTqGQGe15aiWg2B0tIMGXKk+KVM2/tt7+P5phg1RIEVvAgCVCbIu1xRKpn47Hlm7Bl80588qNvh5fYjQjPgkg/qNiV2amIhhAAoyEQWNizpwc5V0ATBxI2MpKAVtXLx1b10xWb1YvL+1YubtFgy4ADBAX4sQtO09O6bdnVKQBjSI4kaS72U6/+Aka5rEiFB3P08uVthQptGYD9n6D9j+uaruNL25f6Tz7yl3eNK+dl86ZU+Mj1WxY1NsoFw/kARDdeQ8zcGCmRHRqBSqdBY1FIanBFpQ7sW5tmRUC42K+NmYdO8iJUJkANvqk0CcZeD8K11KMmDIajSYLgVKBUj0WV9Njn0YzfcsOZLMiCEzBFkUunoX0BKQQcYrZ7Tcd6pY1iqwfOxxsxCtM710GngRDj1MeZBT83gqmTK7Hy5Y0YiudQysOQ2jVgvA7sMrUAZSywDGRIxXNwsxKUWfC0kX+EE8NghmHzzjSprJ3/J/SuJIdyjjuGwVm8qrXQ/OwxlgHL1DIALWhpyacAb+zY0r5Fa63pnND0qiXzy1FfxogcTkAzAUIZiKZgQU6ntYbUZhVRvgfHdmBJiezQMErKSpGWEqAERI4qyzFKoLU8iJe8Hkv8CIi1ZstUheJHKWk0hIpXKKgi6osOYkQXCLqUFAP3YyTrCwN4FAQk6J9rQsE5BZWmqemnMnBTaTjQYI4FBQLGqFmRx3JvxmzpxSunChSHTb9cgygV5JAKfi6BcTWV8LVAd38SlZNCkNmgoVIYd+CQWiHkRJBNavT1DYEyCwKAYhwKIcCpUFs7fDKUs7e1XHXFH/i6P9P9c83jGZwaWCaXHfAgLMOyZccm+AMsjNWVlXxq3rRyWDLNKISREvSNpXJxAVIg5VBjPU2EQLy3H6WTJpmpwOJODRD0tI+CorefIl6x6h05aCZykJmqMRSosSi+lKrQ0h1DRNFG/IBoCg4NSInk0AiE66G0shJ+JgOLEAgp825LBReLI2k/FmsQKwJwZgGawPVdlFVaaJg4ETs792LBrDkwFprEGF4VWiwKUjH09w6B0RCkllCUQlALikWRVlG9bvseRu2qmz/ddnWqGc0cWH7Qq03xb3p89OIfl2WTPZjRWKG1lwAlZq5bEwpJqCFsBFuo0uZCE0oBpeBQBi+ZhMpkTAVbYMLvT77Yny2036lZoWdOQAPcMC8zmP85ul/LJP9nMpqqF0465jSUwNE/SxWMBFPDV4WWYIRA5lzs6diF0mgUytj/QkhRkOZ5jZrDhUYPAAilDY9AS3heDjV1lejo2gNQaqx+zDIODQ6tORgLoWdfPzxPQCkKwjkIZ/A1AbOjcve+BNm5b2TbJRd/6q4WtLC8t/r/E8F5XdN1HACG+zZ+fEbjxOq6cltAuYQE1TIILdqOCVDM7g6wN5sSeMk0MkMjsBgrPPOaHJLtVnTn8oETVNjB/HqeLKcLM1PsIPQ3uh8NrvjPdMxJwAyTiPJgnNaA2SRgBQkpoKUG1xQ9OztAXA8Ry4bwPVAC2LY1SgHUB3JRDpWR6QCzVcHzYvBWBZtRQPloGF+BTFYhnckEA4wkYB4RUGojHk8hk/VAmQ1CqRFEI4BmFjzYeGH1LkrCJT/84h3vTB6JWv5vF5zt7QZKWvXq/en6Co4SxwKRHmzGwAkzhQpTAGHQ4FDQhu6mFWRQpVhaw/FdxPftBRcKVEpoLaCogg7yNCiTc2kdZIv5FaxoWzdnAK4HnAEzZqEx6hCnoLU0FDetDOQSFGuMUDBisEsWGGXlT2gFpfyAnmY6QkRp41ZBFbQSsDWDN5zB3o1bMT4aBvczYNqHhoBQPqAEmFZgWpkdgSgQjD0p0UVnETqhzYNoMFgNpgWQGUZDdRhZH+gbycBipuEgqPFwT6dz6B0YgiQMknAQxmAzY8hghyvV+t1psmOYbj/nbd/7y8FwzX//4ES70lpbjeOmXFBZaiNkU0rGgIrFmxgZs0blRR+UEIhYDkZ6euHFE7CQX/0MVU5pDcIICDXeQgdnKR3HmZODfpcgXQyI2VQDDmHYvm4DtJtD1LahpIC5FqN+nsdqxpACkL6PaMSClDn0D6Zh2RFkch4oM9I5vT0DUMoCiA1NCCQAQRnglCGtYnrFuj4aqxh/8813nJXsa+4jR7o4/27BSQBI9MGpiJRcPKGhDFDZQE2PHv4eq1F8kYECQoL4En2798DSFMqXgA6mDhmFVApSKShhztdPKTyW3z4YUVFAmNtIjSSwbf16VJWUQbhe0BV7bWIHRy2qFgh9MKIRiUQwNOxCwQJjIeSyEj29/SbPJyEoWNCEQlECj1kQTrl6af0A64tHdn3mkz/5Swta2NPLn5ZH80D82x0/+PL9JJ3qTlVXhEBUFiwQ1z3ktGLRImTQWAUqFWLcQs/2XUj2DSDEQ6ZI16aA0gH+SaghkLwOnuuB2vVvePky+KkSgM3DWP/SKkQIQZgSEF8A6ji8535ZssMpxtVVoXdgBIqE4UmK7n2D8F0RMPUNlKeJgqSAz0MY8cP6xbW9iFXN+PY7v3hCsg99hBzFmv5vGZxfvOOdGemnSVVFBByiCA468jaZ77hQrWEpDT+ewNMPPg4LHFzk6V5vvHU2hlx9GOGGo1m1CpOXWhtZTFjIDqWwfe0WNFZWgwsBm9HCA3qw1y88n/ubpB5xsnM0NPPjKtFYGMMjGeQEQ9feAfgeBaVWQDgGKNWQWsInFDRcI55ZtZf0pty/PLTpN7c3NTVZxbS4/2eCsxWthBDgmubrFtZWlTmlUa48NwP2WubONcBAQJQC8QXqK6qwd9t2dK7dgkgoCppfPfF/b2LYBBRBLFKKzeu2QibTKLVtUCkKfe1j0efLd9YCFmrh7wBAeTmURC0MJ7LY1xtHztMAdUYhK6LhiRwEYZChKmzpFvTVrSl68snv/FYrWunU9qlHnSP9WwVnd1M30xootcItNZWVEYszSfQR5sZQgOIKI2EaGoxQUKXBtcakunqsfOZ5qJwECQoOM7ETrDqKHGXg6OMo7BrcMM1AiYVNazehrqIKEUrBA3mX4/lQmGJSQwkX4QjBSMrDSCoLUAta0oKwl+dLUDuCLCLIqCr56PP7qArVf+33K36wcWPLRrIMR98h/Lfc1pOJRNqyGRxuHWR891DhGXTHiSEAE6VBFUC1RnVZORJ9wyaHs0OvTz3tGATn4V6DEOOsa3ELif4h9O/di9qKMkjPB9HydSuXHFVgFrBiw1iKRI0+qZDB3+gCZQCacqSEhh2tlc+u3k32xdmuJ7se/LZSki5btuw1VZb/ZsFpMM6B3n3UZgrQXgB+H6jgNvZmm04OUwREUYByqIBJE1ISMQ3URsuwpv1VZLIeHCcMqtloyh6IoxDCgz/sp31+NHgN0QWs8VDnARI7moKCg4IDikMRCzazkOztQ6nWqHIsMEgooiFpXrwAhz2DxLRw6iLAyuwwypwoWEgb3IoaK2xGJGIhBmYRpKWCJgBjBD6xkJUEPjgQqtQb92XJ8xuG6ewTL7jIuFC3ELzGTOnfcuXMZVJgRAUUs0N/40KgkuJkynSClEGZwYlCmGiUUQs8p/Dg3f9AWEVApANoOyDOFntkmmxUBa3EvDjVcdrEAwwnH7AMjFnIjoygLMRhUwBKQJP8rP9xzpKJIVeHLAdSAFKZvr9SGpLYEDQEn8SQ8kvkv57eRqsnnPDt3z3/7e0tLS0EeO2EH/rvt24COS9n1CoY24+AcZgA3W+bN+ptBs/knIIrgcZYNTpXduLe2x9DabQRvh+CECygz8lAmF8CRIIxjApwEXZ89YxI/mYRQGkM9HQjZDuglEEec7PWwx9CEXAeMnm4r8GpBYBDEgdZbQGR8d7DT3fyhBv7/d/X3vk/Ugj+eplob3ZwBuuWfkNXU3ieIeBKfVBjrgODZOzmRcgobU1KiXDYQjTCoFMuTp+xAE/+/Rn84+7HUVEzCYpFITQLaHcoMNo1RmeCNI6/2JbWGoxy6KyLkYFBhDg3rPO8ZGJhhuf49kBIwFFg1OweUkp4iiGjLdjl9fKh57baHcPhvf/9lVvbWtDCWlpa9BvZN47fN0ErbWq6zgKaghOajAITHGiymtBktbS0HJ0Xcvvox8635w7mGnbwwqJ4TGKUT0kJAKrBbQIKBepKnL94Me5Yehf+9dBTiJXVQrMwuBVGQRSXECgZ9LmNkf0Y04M3WnwUywaO2QGkRiaRhJ/JgQfpYNFc2Wt6j4M1C47urkowrkE5oJmEZBwpxUFi9fLZNXtY+9ahjlmLLmi+4guLds3BHP1G+LvHIThbaVNTU0CJaVPt7Ut9oN0H2n2ttfPHH/fV33bz9loQCKDdb0e7H3wBbaqN1kN/pqb8b0z/WwUkBXJYMPzAlXPMSczrhGIhaHjQKovKMMNlZ52C275/Gx795xPwshxujoHzUoCEARYCoRxAXqOTjgL8xzLjHOPADNjcQnokAe36cBgftZMGRhXlXkeAHm1TwdA2Jail4SkNn1CktAVSNlGv2pJgy1fHsyecfMGNP7/vazuua7rOKhZIeD0HP5ZBCbQBpE21r4Zqqr8uUtNYNT3rJv9j8/a1JJ4awvT6S8+NRErnCeFlS+jJv2XgXn1dIx0/YeKr9WXjH/7zE1/o07oN0GAtLfdgzpwNB50l4qEQJIxkn1AS9n7k3rEDXAdOPhagmbzvulKIOSFwNgyKDKhgmF1VBpx2Cu64+fcQn1I48eQZCIUVysojYFpAcwrpZ6GVhFIieM1jq9VerDOvpQK1LWRTGXBFwAkxwHvwMwwESpPDIgf5DtFr8WLaf1Pnwby7AEVahVBRUiPXbBhS9z66ZU+OlV/2zNO3bdlONvKl7Uv9N/r9j11wkjbFKAWRZ58SJdl3JvnO92x75ZmpUkkq4YI5QFffy/BUDgCNOazkM5Ra2N0/hF3dq1FV1tA/Z8K7/r5h944fMrpm27JlVx9k4WxCO9pRWVkJXwyZuZ/DXODDW6KQQoBSRWAzjliYI5tLIQwNmVRYUDcO5LTFuONn9+Cq/7wMZyw+GenUICoqHZSWhsBDgPDdIP5p0cNwjPJMZVo1lAaBJyV81zNyhuIAyVAcLVZTHKBH+4AEZSQobAhBoZmFkupGtbljH1uxaoBNW7Dkv+5b/dtNVxPClgPimOwcb2itbG2lzc2tXGvtVJWcf6ojF/7povNmr7j55zd+tfnCudNZeIhasWGhaJ9Iu7t9Tw0oIAUgoV25V2T9DpGRu7yZc8vUuElyX1mlbrxg8enrHL7w5++97OcX73lVzwSAlpZ7xixJpeUVJJn1kHMVOHWK6isjmEXy2OFRcsDNHJBCNBKBVgqcEFgQ8If6ML82hvctOQX333E/Hr3vGVDhYN/eBDo6epHNSlDKi3zQJTR8gLigzIcmwmhyHtBnDwb8NB3LhN8vN1YQBVFWytioUAExPMzRViMzmk2UHZYAAxzJAHD/tKfY48qw/AEKTwA6HFHrO9L0zgc27SmdMPMzf2+/4xHg4FOUb8HK2cLa2tpkKBRSZ500tH18fXnDN27/Ki8pBzZsWCve+/4rWNu3vgylBO/q6sLq1avx/PPP44knnkBJSQlpajqFL158BhYvPgMzZk6D78kFDz74SEPnrgFn9rypn17xbPunP/mFb220bXvusmVXy+IHqaZhgtq7/hWkMgKlsI3MS8HmzhQqedmJIy0OhBBoCggtEAlHQUkangKklnAsApHsxfSSGP7z0ovw538+jo5tnfjgJ66F60rs3NGPaESjojKMcMgGt7hR8AgmOYVSoNQCZ8xQ75QCZcyMX5D8ZxvlXuoCHptf4UwlroPuECwKRSkkiAlGqcF5IA0T9MAOSyAZTcIPtpyiQBQtHiEpNsHSBBoUinLd0T2ANZ1rO10+/W1/eeV3m/5CfveaQfYjHa8rSWpubuadnQ/J6z/wy1NeWL3iu4tOmx/72/2/aNi+a43o6upk17z3PXTu3LmkpCRGSktLMWHCBJx66ql417vehdNOOw3nnXcevvKVL+P000/H+PENCDk2IpGwPumkk6ITJtRpKXNi5qzJ9Pnnl2/levxnr7/2a489237fEMY3se7udjWu/ITNXdtevu7802dEyu2c5jpLxozuBoP++ijxT0IZpAQcJ4JsNoec64MEOqGggBQKnHAsPGku1qzbjr8/8CwmTpqCxomNyKQzGOwfRDKTglQalDggNARKbdjMNsrBOr+am3klIwHJRqW7CyOcZLTwADHyMMqQPQAGx4oh2Z/Avm2diFCG0mgIjkMgpR9oyBbBW68L/8znrMWzKqMdOK0JYFdg54BSq7Zm2TkXXnXlP9p/s+ozl3zGWbl9pcAxPthrD8xWvnz578VFTZ877dHHH3jqy1/51Knf/cnn1G9/t7Rs/Pg6+t5rryXcIoGlCQJDUWOLkr9Y27dvx9y5c5HNZoMtUUApQYT0dE1NDZk7bwZLZ4fJtBm1pLQkPPO+vz3wzok1Z97/6ubfDgJAPf8vKXIv33DanNrwhCqA+hkyJthAiniN5KCLxZifJxRQFMxyIKVEOpUBIbwIptKg0uR6C+bNA6E2/nTng9i1uw9Tps/WteMmyXQuSwaH42QknkEu5waDZqaLRUmgNsIs817BXDsJxBe0JoXePwnmxcecoIZjKm0888TL6OnoxvjqasQcBpsbMoZFKUDxhrFWXaQXmn9Y8sGpFECcarmlR7OHX9j25LL2f3z3gbY2dt/2ld7xwCL5a93Kly9vE3MmvPe0NRtXPvHzX7ZFz7noRP8nP/75hPe9rwXTps0kvkiBUQ5QDkJYIBxrgiQ/DJZMJkEIgW3bQQ5GA30jECGyAIALLzwXGzdunKiULyaMH9945+8fefray358rh95ofPb//0h+5Mtf7B2dQ3i9JnjIVJ9cNioEPVoYbKf+u7hoBWiIXwXsWgEA2wESvug1IKGmUO3mAKXSbhDEmfNrMekhkvxp0dW4GPXf59cfNlF/ILzT8TM6bNlMtlP+4f7yEh8AJYlYHOOsBNCJFYKywnDsixYlg3OeCE4C6un0oGisoJUMrAkFMhmssikXcSi9ejuT2B3dxwnTZuBrJ9BNGQUjglRYJSOkeZ+4wypogAPHnJqcx1Pp+HmaIIQ4jcfn/Hy1xqcLQxYpt53+c2nPvPcI0988Wufivk0ob72tZusm2/+rq6uqSKum4XjRMYEBiEMvu+Dc14QrSqGSPIFAqUMlDCIYCTCdV3MmTNHd+3ex++//6eiclyocUX7Iw/v6X985gUXtGc7Bzp/tae35r8FC0lGGNfabJdjcjhNjrKONV0jKVyEwiWIRB2k015hSwch8CFgQSIsPaQHsqitmqpPmDYNu0ec4Yef2PH8I0+uvviCsxbY5104HzNnTpe+N0BzmSGiFKAUQcbNAsQFoaarZVsWKKOjJlKBT4/ZcQSEMN6YJJCMVJqCWwKN0yZj7bMbkPIJYtAglIOyQA5GkwO+5eszcS0O8LwVg7lPkhAMxFOoHT8ptnHvbkA3A8W6hceYWXCUx07a0tJCn3z+n99jkVTs3vt/Jz70kRbqeh6qa6pILueDMieYcR59aqWUYIwVTEfLy8uxefNmZDIZ2LYNKUUhx1KKgDELjFngzIbwNWk65RRs3rKRP/PivaJnYNv0uspzv/nxj5/ij6tuHBpMC2SEpQmzi+RbyAE1qdHFPHQHRwd6l5RqSOWhJBaBlCJQnAu4PpQDEID0QCCQTCblhvX7yIwpp922c2D9OxqrTjv54Ud2/uamr/09c8uPn2YdHTYpKZsnLXuSFroaUkbBSBQUUUifIZVykYinkYinMDKcwPBwEiPDcaRSaeRyOQhhkADOLWM+oBSSyTjGNUzAcNbDQCKLtC/M6Eagu6SPST1CDlTL0/nhaQpPUtI3mEKssnrD8W6WHlVwmhZkuz/YOe6r2dzgebt71okVLz3NOWNIpIbhSx+EFRw/igJBglKCbDaLUCiEjo4OfOADH8Ctt96Kt7/97Xjqqadg2w4AQMo8kG3+n1QeCBUoKXEwc+YsEAIuVL/URPzPFVd89+0nLzxl096+hN87lCUssDOEJgdu6cF2tH8uNiZYtQKBBGUaUvmwQ8bWWSsF27IKrUMpGTzNgVCZ3rkvxYYypKdh6om3NmlYT23664bd2U0fa2w497Rnnxn8zdf+5770bT9/hu3tZiRWNkmGwtXa8wDpUzAaAmcOOHfAmANCLTBqwbbD4MwOwHwz9akVYEzHGKSWiJaEUF5die6+ERBmIZvzABghCUKOQcNP7zfzX3AINtcw44H09KX0A2v//ksAqD2EWsebFZzk8vZ6+eUP31Ozq2PDZ5LuPkWIYKFQCEICicQQlBKgRENIP4BSzKy2lKZyjMViuPfee7Fo0SLcd999YIzhqaeewqWXXoovfvFG+L4Py3Lg+0bWOr+S+dKF44RRW1ttFIEtQXoHtqgtG174wU/vv/mfOYnU5p19nNglWmgz1pvH/vSY3YkcnpgR+OQYnVUJzilKSiIQwjefRQPKl9CKwCccgsdkZ59L4mk88rO7v9pr+qqtVCvNHllz24aOzMsfa2w4e9Hyp3b++utf+0Pq5z9/iHXu8UhlzRTpxKp1VlB4kkGBQwX4odIanudCSB9aqTEkX0O0IGBaglvA5OmTsX13FzQPI531zWw5IYHggj5y/vgaw0NDGicPbmMk5UHICLlm4fUxc5Fb3rqVs7m5mbWhTT3w1J0f7x3cWa11WgOKCOECkMikshCuhMVthGwHlmUZEytmEn/GOL773e/immuuQX9/P0KhEIQQcBwHvu/jBz+4GZdeejm2bduGUCgM2w6BcxuWFQbRFoaHh6GJcRvThDCNpO7Zt2P2pz5w87W14yauWbO1W2etMu0xCxpGRMC4rmhIoiCJwebM1j56jlXYYIC2oFSgi0mBcNgGZaZAkVobaIkSCKqQlJJ09ecwfebp/dBArDmmYfrIshWtVEnNHlv7y/Xb02uvmz/vqjOWPzOy9Ott9yVvvuVhtn5rhkTLJvmx8glK6gh8waCUBcZsAzcpDSgKaA5oHkjbGKcKpgSUTKNxRhUGcwJJl8OXITDqgCjD0iI0MFEgzHzv4DQSjfRwLINAwodAE230j7ShCyriwYeEsmO6P56F7zvxxaeemwJgdDWP08GOUMaSzg9/WH/wsh81bNq+7o6RTGeIckECZ2copZHOZFBRUYH169dj3bp12LNnD4aHhyGlRG9vLz760Y/itttug+OYwPU8L9jGDbTkOA62b9+Oe+65BxMnTkAqlcLKlSuxYsUKrFixAjt37sS27duwft16MMqgCdXCpySXztU0nzz3ga0b11/UNLtGxMKSMZ0DN4beRRJeRgOTQB+SVlcQUeWGHCWlhmU7SCQykCrfsyYAA3xiI6VL6WMvdWBz19B7kuhLdHZ2FiCB5Wab061opU/rp+nanc/1DntdD7z3ys//c9WLG9gzT786a8umveGQHSPjxjfI0tJSCCXgeTlClZFqLGh8BqJFJOggUcohtUYsWoUXnm7H1HHVqAwDZWEzh2+Y7fpIvbDDn1oH5GUKoikIJAhVEIrCjlbJV3dm2APPrPn779p/96tmNPPfL/+9fGuCsw0UWK79TOWpA0N7PuWqATCuaV7zUggfN7W24tOf/jSqq6sRjUaRy+XQ1dWF7du345vf/CYeffRROI6Zzit28c3nM0IIhMNhjIyM4NVX16C5uRmVlZWYP38+Fi1ahEWLFmHJuefhb3/9GwYH+2FZFvF8AS/nj1ty5nl3vLpm1Xnjy3l0+uQqiNwICQUWYhpmhMD0Tw5G/CBFfebRrT+vKcS5g3QmB99XZuViAQ+eR9GXsrBpj8KsOeffunHvCyOtaCXL98u9ioP0KfUUfeGVh3v3JXY9cP0HfnL/v+5/bPVTz7w8ed263fX9/SMkWlZOqitr/Wi4TIM6xJcSQgmitAyYVwEQzxh8TVFSUoU1L29CjDFMqovAJh5syqCLxyRfd86ZTzupscrUAmDa5NpOtXry1UGaEBP2bBvZ8efJzZNpZ2enemuCE2BApyqPzvzJUKJzlqYJJZVPGeNw3Ryuuuqd+PnPbwWlFJWVlWhoaMCMGTOwYMECLFy4ENlsFg8//HBBwF8V5VLFQZL/9/e+97347Gc/i0mTJqGiogLhcBhKKUQiEdRWV+LBBx+E0pooDUkUtbkd3RGGE04O7pl8ysnTFPHilEOCSAMcBj2Xg8JIxQ+JAbsBJQ2bwnweDSE1MlkXoAxKawgFwC7Dzj6B3cMhvO3yj97y4PO/H1nSuoQsX37wwqAQpK2t9OmnniZPrlzWN+jvfSWhkr+sjczfsXVL/4zHHm+PbtrUG+7ZF6eKRIgdLiex0jI/HI0pOxTRYA4hzAZhDkDDiEVrMdibxo6N68m8mfXgMomoEwoeSFVoQrxm1lHQOTUrJwHXxKj3MSCnHORoFe56bJv27XHf2TaweU1n52kE2PjWFUStrU/xnoHOEFiOgApTNUqBxsZJuOUnPx5zs1WA0+VXyMsvvxxVVVXwfX9UmL/I5H4MJUxrnHfeeVBKwfM8E8xSgTGGRDKO+QsW4O2XXwbfc8G41mASK155hi0+7ZIfb9vn6119rvKtEng6sBoJAo4WoPlDdYeMWKpWKhBwVcZkFBqxWBSMEUjlQSFgQBEGKQkItVA+rvyoL3RA/VOtra20Gc1cCh/Pbb3vT+t7V84/r/mGk3u7K76w9Pbnfvy97z82/MUv35X80U+es371m3broYf38hdXxcnWnZT09NlkaMQhff2EVNVMIn0jOZ0WGhkpoJkKLGAOLqqwP4x2KFhtjH4tMTLcSmlQpxR7h3wykg3RuIw8CwCtmHNcuff8CKC7eOZvDzRRoi7IiSHlOIRrReD5Hm66qQ0TG6dASgHG+AF5nBACjY2NOPPMM3HffffBtu1C8O5PqJVSor6+HmeeeWYw28PG+E1msxl4vocPvf/DePChx+BJ3/JUAhMqpn/2vZ/+r1vue/B3619c0ztv5iUTlfRTVEkBFgyj6WAwjOzXOSkOUpIXdg303qVWkEog5ITAOUXO98BtG76iYJxBag9Svz7YJh+keY7C8uXLxc/+8pFtAH7IOMOvP9H5tRt+flXlji36Ixs7VmoOEZ05Y/4nPDfFCEnCsjiBZDpGrZiIE9Kb9HUkyogrFBzOIKR/mLr8YF2z/UZcdN4NmBZat57QoKWlauemNBlIe69c9cH3pJ/77p30Jtyk246kkX68Vk4C4IVNTziTpjSyKZMmwnU9eL6L8857Gz74wQ/C87IHKLDtzxVsCfS3hRAHbOtaa1iWBaUUzjjjDNTV1cH3/QIDPB9QvnAxMjyMxolTcO45F0J4LqRwkUyk7O8sbY+LSPn3Vm/qkxnPkpqFoAk3E5YkbyOtDtlbJ2RUE8lMVQoUS2OHw45ZWaWCVhKe70JpEfhbvLFj+XIjy9IajLNIIdk72khm+9Df97zYcd83EmTPN4dp75f+8MdHGi88/bMTKtgZE6rCiyb2jUyZ0HLNf51ZUjYns31nQksS1fGUMJQ2/UZV7dRYAh2l8BWFpI7s7E6SnEs2fvW7V/TOwRxOjpmG3WsOzj5CKDBj4rwvXPPeq/Diyuf0F268AePrG/ClL94Ixg6e1xRblUgpsWTJEjQ0NATVMB+dWAwMpfLHhRdeeMiHfDgRL9DQzlx0Jk479XT84rZbYVlcL136zorrvnLzsq7ueM/mHT2WHY4qoY0qJwlYNkqrojFedQg+59iKlXMGz3cRDjkFmxRGDAPICVmgVCOXyx2Tm9BWGGeBzH+IpqbrrCbdZGml+cxFJPH9ZVfHH9+5NP7gul8M7xxeFv/4t9+7QpDYHzv2uFSRmBoaycHzjeox9OsX8ipk6iTY+hUBs8NIe2Drt3eo+gmTX4TWZCM2Khzngx6pk5VJxkttS6O2thY/+P6P8ONbfgYNGQg2HdTHtpBfep6H8ePH4/LLL4eUEq7rQkozsSeEgBACuVwOVVVVeMc73hG4Q9BC21NrDdd1kRxOAlQjp5KIVdq49tprcf6SS1ASrQAwwD95/Wl+RcXUJ599aQ+kU6Yll2akQNqwFAUPXCLyJykes1N6lPhLGEAMIUMrDS0lHE4QYaY4gKYI2RwhB7CJAnLH5Z5oALq9fanfjnbf9EzH4j3XNV1ntba20lh1w32DmRD6kkTnFJDIudDENoIRSpstWgvjrJGfONXKWAEiQDICqMqcFFpbIIGgBAGBAINiMewbFHQwZdPBXPZvBVXc43wckfjhC19EI+FCi3HBggV44MF/4KKLzg/oXvoA25D9iQbz58/HBz7wAUyaNKlAAim24HNdt/D/8q9FA2eKeDwON5szZgOcYGC4F5MmTkEikUAoFAKQI0oA9XUzl+0baP9A94jU40IlUJl0YENCikqiwzHji0T3jeE7GOWwLRvhkINUFqAKEFoj7NhQMo2Rng68SceYD720fanf2g56yhfue/7unz66tmegfF51rSMHh4dYaSwCKSQci4FABsrItPAi5ICXJGN+r4vMG0zjg8OOVOpdG0eIq/jW//zIZ9Wn2x6nWmt9vOfljxicxi4EheCcOmUS0ukkunu6Ma5u3AHjq/mg830f4XAYGzZsAKUUf/jDHw5NKdm5E3fddRc+//nPw/d9hEKhwso5MDBgcEdmqHYjwyM4+6xGuJ4XjIyHJCE5nP++657903c/vX3NlsS0cadVKTeXNQQyRQ5iQnBwHuNYaUAj2W12AQItJSzHhoJGxHYg3H5sfvXV/L78ph9tAPDDdyYvGHcG6e1Lkdl1YYicj6HhOKrKy+D7OTg2N3NI1IDz5IACqPhhpYG/kQHdje8Igy8IGI+KPd39Viajn/502+U9czDHJoR4b+22DiBkR51UMlW4gbbNMWPGDLz04ovBzLY6KJxkWRbS6TT+9a9/4corr4Tv+0in03BdF67rjnpLui6mTp2KaDSK559/Ho7jQAgBSil838fw8AgYZbAsB/v2dcO2HVRWVEF4iqRSOQpUKwD48A0LRzpTye++vLaP+DSqBCGQUJCB6WhBA4gEHRCy3/jOQYSz8p5C0WgYjGpzsZRCNGRB+y42bN5Gg5wRb8WhlSYlVePWd/UkIWgY1IpiaDiFnCfBrTB8gcAPnhojgvzIx0FP49VESP4EFGHQVgwDSUXXb+1Wc+aetQMAqWmuUW/G9ztMcNZqABjIbPh5T09/IGph8sGzzz4bW7ZsKeCXQohCYOa3asYY7r//fsybNw91dXVQSiEUCsGyLNi2XejB56v1q6++Gk899RR83y+sxgMDA8hkMvA8D7ZtY8uWLZg8eap2nAji8fh2L6ezZ5/2H3Yw/kIa6+Z39Qz76B1Mg9ohKEoBZoHQPLGXFiy192cnoRCftGCRAihQBkQiDmyHgBMNphUiDgenEs/F/5YFeUviEi1oIYQS/eT6J5eOpCRcxbXQDJpw9PaPwBcEGhYULPjScEpJgKyMwTiDDpnhjCozch3wNwmhYE4EPcMZFs+C6vC4OwDo5cuXv9XBaW5Wf3zPrh3bu0xDizDkXB8TGyagtq4W69atLwRaHmDPF0O7du1Cd3c3LrroooB1ZB1UOibfZ6+qqsKCBQtw3333wbJModXf14+yslI0NExAJpNBR0cnZs86AdAMu3f3OlLpjivfcWUuEGLQi049NWRbFnq6e5EaSRs3CGYVDOgNMY5AauMbCUZBGD2IUxspClYFxgHbplDSB4OCRaWsrSzF+xd96jpooLW59a3RnNLARHtWVBMbEhSaWFCaQwiCPV198H2AEgcWjwCaQymzgmpKQRgHYRyKUEhNjMy4xaEJg5mCp5AasCIR3TsYhxWLdv/X+z/JAJDW1tY35evxQ3eG5ui2NpB5E97jd+3eN7yva7Bs/MQqrbQkUilcftmluOWWW7Fp00ZMnToVtbW1qKqqQllZGQghuP/++3HZZZcdADMdrH3JGIOUEhdffDFuvfVW7NmzB7lcDhs2bkBX1x50dXVi/Ya1WLz4TFSUVxGldXzDmh3hgXTfQzd87ZTuRRNawhfvaXU3bX/F0yKBEI1ipH8EkgPMJoiEbYRsC5ZlFazzQAKXXGIgIqIPLBkINTNEjDGEQhzJZAbECoMTqUtjNnYM9MwBQB5IPfAWrZ8A55YCPAQD7tCKgTALwnfR2zuMaDSESNSBHeKjBBeLQgpZcIiTSkILDcrMVCgNrBKhNQjVfjbr2qt2rbz9jI+N650D2G1tbd5bGpxtbW2qGc38mX1L15Wy+S+/+OKqi66aeLFQSnGtNWpqarFq1Up85zvfBmMMsVgM9fX1aGxsBGMM5513HmbPng3P88A5P2SfN58G5AuoBQsW4Nxzz0Uul0Nvby98f1Q44pJLLgGhFF5OWM88/8LgwtlnDLywdh18mSVtaFMnbJtbe1KdjxLHAk8TZHM5KMtHPC5gEQrHcWA7FjincEIWHMc2uZVSRgjrkDuIgm0zcA74WoJRjfLSCLauXDMEQI9qOL35h3B9qpSC1NIUjrYDz/dhUwtC+IjHU0gkk7BsimjEgW0DnDFwywJjFJbFYMGGEH7wbI66zwVj01zAx0mTmq751m+evOX0C8uGTaFO9FsWnIa0UKsJgFCE/+W+ex6+6KqWiwmBhm3ZSCbj2LZtawGXjMfjiMfj2Lx5MwAgHo/j+uuvH5UpPCRCYnrbeUD+V7/6FbZv316AkxhjYJxC+AoWjahYtIy8+urmtYODIw1nXrTolriYY7dvfCDz/et+e/6/7vrhrafPKVPlEcW4isKmJSCOMJQ5AQAeOA0o+9SA9AwiAOrpmEnDwq95ixMrBPAMtBIgnstqy4ieMKH6os9/4tb6j//P23rfrBs2ehgj0Q65OjmNTIZDAC40KJWjXp6MghPjbOG6HjzPBSWmB29xBoszcM7g2OZBdRwHYBoCBhcmVIMKj9aVlyLE/OnrVq9zAKibyE0Ub4Km3eFzpdY5WitgyaK3P/3i82vcde2bicUZtFaIx5OIxxOFlS+/PVuWhVAohBUrVuCuu+6CbdsFHPNADDRwqIVpY959993429/+VsBBdR5zJARaaXBt0Vi4XP7rn8+ePBKP/+JXd7YNbty40fvCFW3nP37/r//ZfFpp6TsvmEeqY5yMq61CZVUpykoiiMXCiJaEURINI+QwhB0bjmVDKQPC00IsjiWEoEBM0aDMgmbMWE8Lj1SX2QhzTH3iwX9VBTfsTd3alwGaUIqmmc3XlpVbsBklVClwqsGIBmcEjJvA9H0XlALcsmDbIZSUliIWK0UoHIFl2QZs933k0ml4uTSkVIFIg4RIJzChukKnkwPygXv/EnszsTN6BJaCApr5XQ/ftDuTpX/58Q9+RyhjglKKeDwOz/PHAOfFLUJCCL7zne+gp6cHtm2PgZvyvXPzcyYwOzp24Utf+vJ+DBrDYpfCFC0lZRG9bVMHf/qx55I5sfmHTsjR5069+FtPP/arfy45jYY/+J4FCv4gob6C9j1okQZ8D8rzIEXW5FYwMzlaClAASjEItZ+MtvG+hdayYB+olLEGpFpDK4Gy0hiyubi654WfjYC8NXCShoYbT59dX1cBTpRpKcOI4VKqIf0cNAQiMRtV1eUYP74WdfXVqKoqR1VVOSory1BRUYaqqkqUl1cgVhJD2LHBGTWdVC2hhIv62hI5Y2IlSw1u/6rWmjzQ1MTe+uAE0Nq6RBFC1CWLr/nBow+9TL564/dIT3ePjsXCxig039EJtvc8CJ9nuH/7298G57zQuiyGnhhj8H2Jvr5e3HDD59DRsavw/wtKE8qkEVJLMDsk/viHu6God9ttn1266PTyWY+Wkp1f/cwHTgq9+5IZGrl9NEwViAr0iuCCawUS+EFqQkzVHgy1sUBqRRUYRnmNotH58bwkjO+b9islGr6XQciGGldTTs+c8bZ35qGdNzs4V61U1vBAR66uPAymcoDyQaEACAg/h1hJCA0NNWgYX4vS0hAsS4NS8+9Se1BaQEgPnpeDkL6BzrQCkQJaBX6d0oNDPL7opAbkRjre//P/vnNWe3u739p6/BGKIz4By5cv181o5vftuLWvrvTEvk0bNr+9otqRO3duJ3//233QWpE8Ha4wg01IYSR47dq1OPfcczFt2jQwxkZddglBX18fBgb6cccdv8GvfvVrWBYvquoRzHc7yLkpVFaNQyRSwda++greduYZpz7816XXLZoRmvbJa04Vk8c5jPs+GehKINE/gPraGKRMgZJgZIMBQlP4ioPbYWilwAKJGBm0N2lA0dPQZvJSmweEUA4CikTSRTyRgsVseL4GjVaonYOa7umRem9y5501qGGd6HxT8D8jB9QpaYe8lHg9nztjTqmsYB63VA4OB6TwUF1dhpqactiOcWSU0kNej9RwQxS00qA0GM3QGgwaSvpmDJqOplw5T2JcQ6PYun03W/XKzpLtI9v/cdv1t/GN/RvlWxqcANCJTg0NOpjesuZnP7j7HePq6se/++orSXVNNXl51Upks5nC1l0MFzHGkMvlsHHjBlRWVmDdunXYuHEj1q5dg1deWY01a9Ziw4Z1+NGPfgTPdeE4IcMFlRKMcXBmwfUymDf7RHz0w9fh0YceRl2ZhV2rH7GuvmAaPvC2BZKm+zlAsGt7Ek8/3I5TF85AyMlBIwuAQ4NBMQs+wrAj1eja0w9AIhqhUMqHBDdkj7z4BkUQqAxaU1h2CFIQ9PaNAISCEQ5NLOhQudra69KVG3evTmDwr5Mxmb5ZwTm507yXuy83vy6aec/ZJ9WosEhRGz58kUVFeSmqqkqhtQcoWeBo5FWcdb5rMYb8ZVTrGGXwtA40DBUYjKU1sxwajjhq5Sud8155NvmnO1b8bKAVrXT5WzwaXGAJEEJEdfX4827/9b2b773r8Z1f+/qXh/7yl7swbdo0uK5bqMwJMWb1nuehpqYGn/vcZzFlymRMnz4NJ5wwGzNmTEdNTTUaJ07AwoUL8enPXA8FDeF7ZqYoFDYsJi+D91/7QfzwuzfjgWX3gMZ7gH2b8IX3n40rzpysk307WMQJoafHx71/fRJvu+Qs1NWWQQkXFMQEJmEQCMOKjsOmnUN48vktsMNl5naRQJEuENIiNGDnE2NfTSgHFENf/zB8oUGZbYbdAHi+B8Y5lFRvOgC/HMsltzgmT538+bISoDTEKFcCkD6i0RAqq8ogpAut8uohPigJTGcRqIwcRC9fEw2pCQizAWoZBEMDNgSQ7sWpJ9TipNlRvmX9Q7/X3Tq6ERuPhRPjG1s5R79FK9nT/5MMC0+551+P/uN8i4bnvvPKi8SSc5fQeDyOdWvXFVZO3/exePFi3H33X3D++Reirq4W5eXlcBwHSilYloVINALGKBYuPAnj6urw5FPLQQiB67qorqnGd79zM9797hbc8NkbkBnoQWPYxxevPR9N4224g/sItcLIkDB+fccjWHzGiTj91DrkkrvhQIOBg2gGpRkkjSHu2rj9d4/gwovPQ0NdGZQ3DMaE6R+DBsWPHgXiKYPFQujtGUIqmQWzw/CEADQgJIF0ytT63Wm6d0ivH/S7730zV05DGKKYXDLxv6fUyuq5E8PayqUJoz7q6qvBKYVWPiyLQ2sJRrnxoqcm3yaEFHibuniMRREIqZH2fHhKIuTYgPDB8sQYAtIwY5p46dUdk//xYPv2u/f8aXUzmvnx+t6v8alvU0ALS6ef658//+Rrv//NX6xr/cotvDRW49/8vZ/gm9/8BsJhG5ZF8clPXoff//4OlJaWYc2rq7Hq5VVYvbodmzdvwr59+5DLZpHJZOD7Pgb7B/COK96BH9z8PVDKcdWV1+DZp192JzZMli1XXK0j4Bgfobj+3Uswt4ZDDO2FwylilXV4dPl6UIvjnLNPQHJkF5hOgUGCKAJfA5JysFg1HnjsFZSUV2D2rInwhQfGHYDwwGc9uFGKQAojLAbNsHdfD1KpNCi14HkanBh7FZ9QSG5jOJHV1VUT+Fthkqm1Rjo1IhzHgtIKrsoiEnUQshmU8ox8p5KBuh1HMpVBJuOBU16QmxntrwNMA1ASdjSKPUM5rN7UD2KXAISBEg2H+aDuCCZVg5yxsFru3PLyjTf/9x+igeIH+T8QnACwTGrdwtau/Xvf9Vd/u/n+ZSte/cJ//cRa9eJm+Z6W98tly5bhox/7EK77+EcxMNSP7u69SKVSQB7iIBrRSKiQbENqQEpkM2kQQnHbrb9RP/3Rr+WPvrN09Wc+8SV24eJLSJmWOH9+A06bWgKd7ga3AN+ysHPvEF58aRvOPmsmLJKArSQsLaGUC1cJCGbDZxxb9w5i7ba9mDd/IkJWClQnoZUhSRQcMYtGgrM5hd1dvUgmXVAeMt47xIYN4wSnQlH0ZUA7e9IEPHwrACzBEvVmB6iQHiHUMn11phArCZkKm2hIbdZEqTQUGAaGUxgaSoGxULA5aGNfE4hMUG1WUx8MiNbjpQ1xDOcs+GDQlBm3YGjoeC+7+MyZqImp2S8sf+59ywhkC1ro/5HgNAEKtLDv3Xn58K9//svmFc+v/fRXbryF/eDbv2URe5xuedeH5AMPPCLDTlSHQiEwi8KXPnzha18JZHIZuL4LpSVAKKKxSv38c6uk9ByZTlj0HZd8hD36j+dj77jgvV8osUu6RWoYb7voLO3mRkCohicYBgdcrFu7A5QyzJ7VCC+XAOUm9TdEBgc5F9izdxB9fYOQwsWkxgZk3DQoJQiM2QLkwHTtFIC+gQHs6doH19MADcP1OAgNA0zCVQIuwoiUT5EvvbpX+ap0oOXqazcBoDfhpjd9/eQ8oikNAZLDoRGEnBg8SeDnxRkIh4IFTWykswLxVBZSU2hmVEGMQC6FIhSCUChmwVMM4DZ6+tOIJzWoXQJf2fAVA+EWmK9QEw3hpLmTdOfOLe8r7la9qe3LIwcoyKUfmJmgDP+7oPb6l/5533NfeuG5de+au2By18TGcuvOP9zXcMVVl3lV1XXU931KiKZSygLOLoTQA71x/PJ/b+fdPUNMexFsWt/5alVp7c2diafvJYR4i2rOOeWi0+e8p7KES5Vzedbz0N2bQxol2L0ngcrqCpSGQ7CkBfgMlIQAOEilNfYOxiGpBc9lyGY0ykoqQWTKyKwQIxpGCYcGQTwZx/BICp7QUDxqxhOCG0cIYDlh0EiJtp169diqfWxbh4O58xb/9LPfvaL3uqbrLNJO/DczMAkliMYqnJH4MCgvge1wgADC90E5wCmDL4RhZAmNXNYDZRSu54MQBQURqHmwgkKf0gC4BTCOnC8xOJhEY3mpca2jAgoalpTwcyN03sxK/cTKgRP/5/2/X/itP/7Hq62trfRgzidvUXDmsxVNlCR0+Sv/u4oyvHtu5edOW/tyx5fbX1xf74vMuPv+9ry98OQT0TipEdl08n7KaZ1lhRbt2bMXvT296OtJontvf7quvmG9A//WntSTdxJKFCF385Z7Wtja92yj1eVTVSbtIz6YRnYkCV+XQoerkVK7wGOA50qItEBpyEFOAPFkFv3DLrRdAjAHmayC8DWyGR8qwiB9AqKM7HUylUIyIeFLwFVhs3poBsktaNtRxLLhCa2GkwKDw4pv3radre9wE40nnP373z75re+lr97Kli5b6r/JiyaB1trm9o6+oeHpOVmByjABIS4Y9cEJMap9UoIxCl+4yGQzsC0bfs6FZQlQ4gLKMN4JeCC3w6Ah4XoKlFAIz4fveog6DBIaRPtwKIcQCTJpQo2qqbAqN21urwSgN27cSP8PrZyF66QByBa0sGUSeLL9JysZJ1dKoXHpWV86/dU17bXL/vZw9dxpC/8/N5edqKF1WUnlmp7evU/tGX75idNOvJpf/4lPb/vOzy7doJQGIX8G0MKaUEGWXb1UnDO+pWTrzgSdMbnS5bJOs5IK5LwQsijFsKSwmWKDaUUyPUkStl0o3wx5IVIBxR3NLFtHKy04sRA6untpMpFChHhgUkNpF4AN0BLQSFRzZmufOhCKyj39KdaT8GhXTy8GhjI0LUPIZaxhx6n748xTmm6746mvb7mT3HzMRfqPEoSny5cvV4PJkaWC45IR15PjyxyqqAClEiAajBmte8IochkBV2pQTpDOeCiPGd4GN7cuaMRxI2IR5shkMlCKwA7ZSMRHEK2NQWkZ5OYSEj6YpSB1SvV3bfeP185+zCST8ybvLS0tbNmyZboVrWh7ru0lAKAM2Lx7x28L1WGf6T4QqrBy/VKsXL80yH9bCLBMAcvk5a2tur0NWHDSqb9c0/74CV096ydVRzSEP4yMZMiIEBLZUijVj/VdHhqrp/tJmYQdBTzFkPUJ0jlt5RIeyfgc/YKjc0SKuinTaCY1TJiCpowQbkeV61mqZyjFB4dydGdXNwaTnPYkfCRzdEt51cSRPT2dP1xy7hV03slnvHrdNy/cis770YIWtgzLJN6CY/nypyVAyPwzz1n1/MN/6Owa1BNnTqxSGTVMuVajfoPEgRAOeuJxJFUUICXoHZEgnKOqtBRSpEEJMQRlEOQUA7cqsGtvF6LlFeDRcgxnEwhlJErKyiAVhS8IXBJGymWQOkYnTZvtvNDzkFFCXHast4fjeLS0tLC+ZX15kSt94Hs3k+ZmYMmSJeoQ+QoBoFfco8PfvenTV3dtWwuwDErKK1HbMA2Tpk4l69a/+LnB3VumzJrUUMJIDoCCJy1kJUffUH9cSn84UloOymxLpoYaTjqhHA01ZeCwkMqk0D+QRjzJsXcoASjaESmt2S19544Z804Z+d9HWu+nlEL4Y3Zt1opW/Uat844JRk0gz55yxZM1rOPcmz55oVeCvbbMDQY23ASMRzCYFDrjMrV+c5eqq6qmFQ6lVI2QxrowIrY0YhHgcJWCYFF4sUn6O/97jzzhxLPIkoWNVA1vgk18Ei7hiIZKwUBBK8epJzak9Q9+s2rb1R/63Lm47cN9bdDHQEXsTQzOY3G0opUeLhAYY/joFT+aMbBry/m7dq5TWhMaq6zTkyfNI5FQ7cNLH/10B2UUwvdCF86+9uNUJW5IjvRbHLaKlZTQnOe/arOKf8xY0NT1i4e+9iClBL7njbk+zWhmS5qXAEugjnXS/0buXQtaaPbMioahra+8cvqMaOX73znbqy1nVIFCao3B4Rx5qX0L27K9H4MJiVjIRtOcCWio5qKmTNOaUocyCkhQ2OEoPFai/vrkVnr3Iy9i1vSTMbmGYFoNR2WpJcMlto6GSlBdWYUhn+KWO17ife74+57uuPfK47WL/J8PzvznbG5uZVj+dJB0BcgigLblba/J/0ZrTYu/t+04sigYC8SK2trrdWDO9X/5oADUhy/84pUrVz/XNqkkPW/GhFKAhpDJSfT2J+Epu6+yuv75SCj2zJbNm05jzLuqro47jZUWGhuiqKkuhQJHIu3qlat3kx3doeyEqRPuGOwdqueEnDnQ24nSSKyuoiyKSMwBHAd7ezMArX3+vCUt17THZfeyZS0Kx0Ga5t8lOI+4unY3dbP2wrxEE5oA1LfXy6JVlzQ3N7O8PlHxNWhquo5PnXqB+jcIxoOkTvewZcuulr/70SsNT/71Nx9/fsUDSoCS6mg9WbDw9PTty358K59op6XwwW0Lrdfevnhl+8MXd+xYPauupuo9I/E+BWLBCcVA4Nx77kUf/ME3/3Bdu23ZcN1c6Mb/vN/y+zd8JjU8EEqkhqVmlFZVTd5y+1PfutP3j+8o0f8PqFEEqVfs6u8AAAAASUVORK5CYII=',
  clipboard: 'data:image/png;base64,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',
  side: 'data:image/png;base64,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',
};
const _coachImgCache = {};   // pose -> canvas ya limpio (fondo transparente + sin texto)
let _coachFrame = 0, _coachAnimT = 0, _coachBob = 0, _coachPose = 'clipboard';

// Carga una pose, le quita el fondo blanco y recorta el texto inferior. Cachea el resultado.
function loadCoachPose(pose, cb){
  if(_coachImgCache[pose]){ cb && cb(_coachImgCache[pose]); return; }
  const url = COACH_POSES[pose]; if(!url){ cb && cb(null); return; }
  const img = new Image();
  img.onload = ()=>{
    try{
      // las imágenes ya vienen recortadas y con fondo transparente: solo cachear
      const out = document.createElement('canvas');
      out.width = img.naturalWidth; out.height = img.naturalHeight;
      out.getContext('2d').drawImage(img, 0, 0);
      _coachImgCache[pose] = out; cb && cb(out);
    }catch(e){ cb && cb(null); }
  };
  img.onerror = ()=>{ cb && cb(null); };
  img.src = url;
}
function drawCoachPose(){
  const cv = document.getElementById('coachCanvas'); if(!cv) return;
  // canvas de tamaño FIJO cuadrado (no medir el rect: la rotación del rotor lo deforma)
  const S = 220;
  if(cv.width !== S || cv.height !== S){ cv.width = S; cv.height = S; }
  const ctx = cv.getContext('2d'); ctx.clearRect(0,0,S,S);
  const c = _coachImgCache[_coachPose];
  if(!c){ loadCoachPose(_coachPose, ()=>drawCoachPose()); return; }
  // encajar el dino COMPLETO (contain) dentro del cuadrado, centrado, con leve bob
  const pad = 8, availW = S-pad*2, availH = S-pad*2;
  const s = Math.min(availW/c.width, availH/c.height);
  const w = c.width*s, h = c.height*s;
  const bob = Math.sin(_coachBob*3)*3;
  const x = (S-w)/2, y = (S-h)/2 + bob;
  ctx.drawImage(c, x, y, w, h);
}
function pxCoachSay(es, en, opts){
  opts = opts || {};
  const wrap = document.getElementById('coachWrap');
  const txt = document.getElementById('coachTalk');
  const name = document.getElementById('coachName');
  const nextBtn = document.getElementById('coachNext');
  if(!wrap || !txt) return;
  if(name) name.textContent = (LANG==='en'?'COACH':'PROFE');
  txt.innerHTML = (LANG==='en'? en : es);
  // elegir pose según el contenido del mensaje
  if(opts.pose) _coachPose = opts.pose;
  else {
    const s = (es+en).toLowerCase();
    if(/tip|truco|chanfle|curve|offside/.test(s)) _coachPose='glasses';
    else if(/gol|goal|patear|shoot|tirar|kick/.test(s)) _coachPose='cross';
    else if(/listo|done|✅|jugar|play/.test(s)) _coachPose='side';
    else _coachPose='clipboard';
  }
  // ENTRADA suave desde la izquierda (reset total de animaciones previas)
  wrap.classList.remove('leave','enter');
  wrap.classList.add('show');
  void wrap.offsetWidth;          // forzar reflow → resetea a posición normal
  wrap.classList.add('enter');
  drawCoachPose();
  // botón CONTINUAR siempre visible (idioma); al tocar, sale cartoon y avanza
  if(nextBtn){
    nextBtn.style.display='inline-block';
    nextBtn.textContent = (LANG==='en'?'CONTINUE ▶':'CONTINUAR ▶');
  }
}
function pxCoachHide(){
  const w=document.getElementById('coachWrap'); if(!w) return;
  if(!w.classList.contains('show')) return;
  // SALIDA suave hacia la izquierda (fade + slide)
  w.classList.remove('enter');
  void w.offsetWidth;
  w.classList.add('leave');
  setTimeout(()=>{ w.classList.remove('show','leave'); }, 500);
}
function tickCoach(dt){
  const w = document.getElementById('coachWrap');
  if(!w || !w.classList.contains('show')) return;
  _coachBob += dt;
  _coachAnimT += dt;
  if(_coachAnimT > 0.1){ _coachAnimT = 0; drawCoachPose(); }   // redibuja para el bob
}

function startFieldTutorial(){
  if(!player || !player.root){ maybeStartKickoff(); return; }
  // ESPERAR a que el jugador elija idioma: si el modal de idioma sigue abierto, reintentar
  const lm = document.getElementById('langModal');
  if(lm && lm.classList.contains('show')){
    setTimeout(startFieldTutorial, 400);
    return;
  }
  stopMusic(); startBg('tut');   // pista sci-fi del tutorial (en vez del himno)
  fieldTut = { step:0, kicked:false, passed:false, _t:0 };
  kickoffActive = false; setPiece = null; celebrating = false; kickoffPending = false;
  cameraMode = 'player';
  giveBallAtCenter();
  parkAwayForTutorial();
  fieldTut._start = player.root.position.clone();
  const sk = document.getElementById('tutSkipBtn'); if(sk) sk.classList.add('show');
  tutShow('🕹️ ¡Hola! Soy tu profe. Movete con el <b>joystick</b> para correr por la cancha.',
          '🕹️ Hi! I\'m your coach. Use the <b>joystick</b> to run around the pitch.','clipboard');
}
function setupPassStep(){
  giveBallAtCenter();
  // buscar un compañero que NO sea el propio jugador
  let mate = null;
  for(const tm of teammates){ if(tm && tm !== player && tm.root){ mate = tm; break; } }
  // si no hay ninguno (todos ocultos/inexistentes), usar el arquero como receptor de práctica
  if(!mate && goalkeepers){
    for(const gk of goalkeepers){ if(gk && gk.team === 'us' && gk.root){ mate = gk; break; } }
  }
  fieldTut._mate = mate;
  if(mate && mate.root){
    mate.root.visible = true; mate._tutHidden = false;
    mate._walkTo = null;   // que no se vaya caminando a su formación
    const base = (player && player.root) ? player.root.position.clone() : getFieldCenter();
    const fwd = fieldFwd || new THREE.Vector3(0,0,1);
    const side = fieldSide || new THREE.Vector3(1,0,0);
    const sp = base.clone().addScaledVector(fwd, 7).addScaledVector(side, 2.5);
    clampField(sp); sp.y = fieldGroundY;
    mate.root.position.copy(sp);
    if(theirGoalPos) faceTowardsGoal(mate, theirGoalPos);
    playerSetAnim(mate, 'idle');
    passReceiver = mate;
  }
}
function tutShow(es, en, pose){
  fieldTut._waiting = true;          // esperando que toque CONTINUAR
  fieldTut._acting = false;
  fieldTut._t = 0;                   // resetear el cronómetro del paso
  fieldTut._grace = 0;               // gracia tras reanudar (evita saltos)
  fieldTut._shownFor = fieldTut.step;// recordar para qué paso ya se mostró
  tutBanner(es, en, pose?{pose:pose}:undefined);
}
function fieldTutTick(dt){
  if(!fieldTut) return;
  fieldTut._t += dt;
  const st = fieldTut.step;
  // mientras el coach habla (esperando CONTINUAR), no corre la lógica de acción
  if(fieldTut._waiting) return;
  // GRACIA: tras tocar CONTINUAR, esperar un toque antes de evaluar (evita saltos en cadena)
  if(fieldTut._grace !== undefined && fieldTut._grace < 0.45){ fieldTut._grace += dt; return; }
  // RESET DE PELOTA EN EL TUTORIAL: la pelota nunca debe salir de la cancha.
  // Si se sale de los límites, o (en pasos sin tiro) se aleja/frena, vuelve a su lugar.
  if(ballModel && !ballOwner && !passInFlight){
    let out = false;
    if(fieldLimits){
      const bx = ballModel.position.x, bz = ballModel.position.z;
      if(bx < fieldLimits.minX || bx > fieldLimits.maxX || bz < fieldLimits.minZ || bz > fieldLimits.maxZ) out = true;
    }
    const shootingStep = (st === 1 || st === 1.5);
    let strayed = false;
    if(!shootingStep){
      const away = player && player.root ? player.root.position.distanceTo(ballModel.position) : 0;
      const slow = Math.hypot(ballVelocity.x, ballVelocity.z) < 1.0;
      if(away > 6 || (slow && away > 2.5)) strayed = true;
    }
    if(out || strayed){
      // si ya hizo el gol del paso, no robar la pelota del festejo
      if(!fieldTut._scored){
        ballOwner = player; ballVelocity.set(0,0,0); ballSpin = 0;
        if(player && player.root) ballModel.position.copy(player.root.position);
      }
    }
  }
  if(st === 0){
    if(fieldTut._start && player.root.position.distanceTo(fieldTut._start) > 2.5){
      fieldTut.step = 0.5; fieldTut._t = 0;
      tutShow('💨 ¡Bien! Ahora mantené <b>SPRINT</b> mientras te movés.',
              '💨 Nice! Now hold <b>SPRINT</b> while you move.','glasses');
    }
  } else if(st === 0.5){
    if(buttons && buttons.sprint && Math.hypot(joystickState.vx, joystickState.vy) > 0.3){
      fieldTut._sprintT = (fieldTut._sprintT || 0) + dt;
    }
    if((fieldTut._sprintT || 0) > 0.8){
      fieldTut.step = 1; fieldTut._scored = false; fieldTut._retry = 0; fieldTut._t = 0; giveBallForShot();
      tutShow('⚽ Tocá <b>PATEAR</b> para disparar. ¡Metéla en el arco para seguir!',
              '⚽ Tap <b>KICK</b> to fire. Score in the goal to continue!','cross');
    }
  } else if(st === 1){
    if(fieldTut._scored){
      if(fieldTut._t > 1.2){
        fieldTut.step = 1.5; fieldTut._t = 0; fieldTut._scored = false; fieldTut._retry = 0; fieldTut._curved = false; giveBallForShot();
        tutShow('🌀 El <b>CHANFLE</b>: mantené <b>PATEAR</b> y mientras carga mové el joystick a izq/der. ¡Soltá rápido y la pelota se curva!',
                '🌀 The <b>CURVE</b>: hold <b>KICK</b> and move the joystick left/right while it charges. Release fast and the ball bends!','glasses');
      }
    } else if(tutGoalScored()){
      fieldTut._scored = true; fieldTut._t = 0;
      try{ sfxGoal(); }catch(e){}
      const fl = document.getElementById('goalFlash'); if(fl){ fl.classList.add('on'); setTimeout(() => fl.classList.remove('on'), 200); }
      ballOwner = null; ballVelocity.set(0, 0, 0);
      tutShow('⚽🎉 ¡GOOOL! Así se marca.', "⚽🎉 GOOOAL! That's how you score.",'cross');
    } else if(!ballOwner){
      fieldTut._retry = (fieldTut._retry || 0) + dt;
      const stopped = Math.hypot(ballVelocity.x, ballVelocity.z) < 0.6;
      if(fieldTut._retry > 1.5 && stopped){ fieldTut._retry = 0; giveBallForShot(); }
    }
  } else if(st === 1.5){
    // avanza al hacer GOL (idealmente con chanfle). Si la pelota se frena sin gol, devolverla.
    if(tutGoalScored()){
      try{ sfxGoal(); }catch(e){} ballOwner=null; ballVelocity.set(0,0,0);
      fieldTut.step = 2; fieldTut.passed = false; fieldTut._t = 0; setupPassStep();
      tutShow('👟 El <b>PASE</b>: apuntá el joystick a tu compañero y tocá <b>PASE</b>.',
              '👟 The <b>PASS</b>: aim the joystick at your teammate and tap <b>PASS</b>.','clipboard');
    } else if(!ballOwner){
      fieldTut._retry = (fieldTut._retry || 0) + dt;
      const stopped = Math.hypot(ballVelocity.x, ballVelocity.z) < 0.6;
      if(fieldTut._retry > 1.6 && stopped){ fieldTut._retry = 0; giveBallForShot(); }
    }
  } else if(st === 2){
    if(fieldTut.passed){
      fieldTut.step = 3; fieldTut._t = 0;
      tutShow('✅ ¡Listo! Ya sabés correr, esprintar, tirar, hacer chanfles y pasar. ¡A jugar!',
              "✅ Done! You can run, sprint, shoot, curve and pass. Let's play!",'side');
    }
  } else if(st === 3){
    // último mensaje: al tocar CONTINUAR (que pone _endAfter), termina
    if(fieldTut._endAfter) endFieldTutorial();
  }
}
function endFieldTutorial(){
  fieldTut = null; tutHide(); pxCoachHide(); tutorialSeen = true;
  const sk = document.getElementById('tutSkipBtn'); if(sk) sk.classList.remove('show');
  try{ localStorage.setItem('rezonaTutDone','1'); }catch(e){}
  restoreEntitiesAfterTutorial();
  if(tutorialIntro){ tutorialIntro = false; exitGame(); }   // tutorial de bienvenida → al menú (exitGame pone música de menú)
  else { stopBg(); startMusic(); startKickoff(); }            // tutorial en partido → himno + arranca
}

// === FESTEJO DE GOL (explosión nuclear + cámara lenta + "GOL" 3D) ===
function triggerGoalCelebration(goalPos, scoringTeam){
  celebrating = true;
  celebTimer = 0;
  sfxGoal();
  // El equipo que metió el gol festeja con emotes variados
  if(scoringTeam === 'us'){ for(const e of [player, ...teammates]){ if(e && e.root) playRandomEmote(e, 0.9, 1.3); } }
  else if(scoringTeam === 'them'){ for(const e of rivals){ if(e && e.root) playRandomEmote(e, 0.9, 1.3); } }
  celebGoalPos = goalPos.clone();
  slowmo = 0.28;  // cámara lenta
  // flash
  const fl = document.getElementById('goalFlash');
  if(fl){ fl.classList.add('on'); setTimeout(() => fl.classList.remove('on'), 180); }
  // grupo de la explosión + palabra
  celebGroup = new THREE.Group();
  scene.add(celebGroup);
  buildNuke(goalPos);
  buildGolWord(goalPos);
  // luz intensa del estallido
  celebLight = new THREE.PointLight(0xffd9a0, 0, 60);
  celebLight.position.copy(goalPos); celebLight.position.y += 3;
  scene.add(celebLight);
  playWhistle();
  // fin del festejo → saque del centro (~2.6s reales)
  setTimeout(() => { endCelebration(); }, 2600);
}
// Geometrías y materiales COMPARTIDOS de la explosión (se crean una sola vez).
// Crear ~50 geometrías nuevas en el frame del gol causaba el freeze; ahora se reúsan.
let _nukeAssets = null;
function getNukeAssets(){
  if(_nukeAssets) return _nukeAssets;
  _nukeAssets = {
    coreGeo: new THREE.SphereGeometry(0.7, 14, 10),
    fireGeo: new THREE.SphereGeometry(1, 16, 12),
    stemGeo: new THREE.CylinderGeometry(0.5, 1.2, 1, 12, 1, true),
    ringGeo: new THREE.RingGeometry(0.6, 1.0, 32),
    debGeo: new THREE.SphereGeometry(0.22, 6, 5),
    sparkGeo: new THREE.SphereGeometry(0.09, 5, 4),
    debMat: new THREE.MeshStandardMaterial({ color: 0xff8a30, emissive: 0xff5a10, emissiveIntensity: 1.3 }),
    sparkMat: new THREE.MeshBasicMaterial({ color: 0xffe070, transparent: true, opacity: 1 })
  };
  return _nukeAssets;
}
function precacheNuke(){ try{ getNukeAssets(); }catch(e){} }
function buildNuke(pos){
  const y0 = pos.y + 0.5;
  const A = getNukeAssets();
  // núcleo de destello (material propio porque su opacity se anima)
  const core = new THREE.Mesh(A.coreGeo, new THREE.MeshBasicMaterial({ color: 0xfff4c0, transparent: true, opacity: 1 }));
  core.position.set(pos.x, y0 + 1, pos.z); core.name = 'core';
  celebGroup.add(core);
  // bola de fuego
  const fire = new THREE.Mesh(A.fireGeo, new THREE.MeshStandardMaterial({ color: 0xff7a10, emissive: 0xff5a00, emissiveIntensity: 2.4, roughness: 1, transparent: true, opacity: 1 }));
  fire.position.set(pos.x, y0 + 1, pos.z); fire.name = 'fire';
  celebGroup.add(fire);
  // tallo (hongo)
  const stem = new THREE.Mesh(A.stemGeo, new THREE.MeshStandardMaterial({ color: 0xffa030, emissive: 0xff6a10, emissiveIntensity: 1.4, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
  stem.position.set(pos.x, y0, pos.z); stem.name = 'stem';
  celebGroup.add(stem);
  // DOS anillos de choque desfasados
  for(let r = 0; r < 2; r++){
    const ring = new THREE.Mesh(A.ringGeo, new THREE.MeshBasicMaterial({ color: r === 0 ? 0xfff0c0 : 0xffaa40, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(pos.x, y0 - 0.4 + r * 0.15, pos.z);
    ring.name = 'ring'; ring.userData.delay = r * 0.18;
    celebGroup.add(ring);
  }
  // escombros (geo y material compartidos; la escala da variedad de tamaño)
  for(let i = 0; i < 14; i++){
    const deb = new THREE.Mesh(A.debGeo, A.debMat);
    deb.position.set(pos.x, y0 + 1, pos.z);
    deb.scale.setScalar(0.7 + Math.random() * 0.9);
    const a = Math.random() * Math.PI * 2, sp = 5 + Math.random() * 9;
    deb.userData.vel = new THREE.Vector3(Math.cos(a) * sp, 7 + Math.random() * 7, Math.sin(a) * sp);
    deb.name = 'deb';
    celebGroup.add(deb);
  }
  // chispas brillantes (geo compartida; material compartido porque su opacity NO se anima por-spark)
  for(let i = 0; i < 20; i++){
    const sp2 = new THREE.Mesh(A.sparkGeo, A.sparkMat);
    sp2.position.set(pos.x, y0 + 1, pos.z);
    sp2.scale.setScalar(0.7 + Math.random());
    const a = Math.random() * Math.PI * 2, el = Math.random() * Math.PI - Math.PI/2, sp = 9 + Math.random() * 12;
    sp2.userData.vel = new THREE.Vector3(Math.cos(a)*Math.cos(el)*sp, Math.abs(Math.sin(el))*sp + 4, Math.sin(a)*Math.cos(el)*sp);
    sp2.name = 'spark';
    celebGroup.add(sp2);
  }
}
// Cache de la textura de la palabra (GOL / GOAL) — se crea UNA vez por idioma
// para no subir una textura grande a la GPU en el frame del gol (eso causaba el freeze).
const _golWordCache = {};
function getGolWordMaterial(){
  const txt = (LANG === 'en') ? 'GOAL!' : '¡GOL!';
  if(_golWordCache[txt]) return _golWordCache[txt];
  const cw = 1024, ch = 320;
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const cx = cv.getContext('2d');
  cx.clearRect(0, 0, cw, ch);
  cx.font = '900 220px Arial Black, Arial, sans-serif';
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  const grad = cx.createLinearGradient(0, 40, 0, ch - 40);
  grad.addColorStop(0, '#fff3b0');
  grad.addColorStop(0.5, '#ffcf40');
  grad.addColorStop(1, '#ff7a10');
  cx.lineWidth = 18; cx.strokeStyle = '#5a1500'; cx.lineJoin = 'round';
  cx.strokeText(txt, cw/2, ch/2);
  cx.fillStyle = grad;
  cx.fillText(txt, cw/2, ch/2);
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 2;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
  _golWordCache[txt] = { mat, aspect: cw / ch };
  return _golWordCache[txt];
}
// Pre-cachear ambas palabras al cargar (en idle, sin bloquear el arranque)
function precacheGolWords(){
  const prev = LANG;
  try{ LANG = 'es'; getGolWordMaterial(); LANG = 'en'; getGolWordMaterial(); }catch(e){}
  LANG = prev;
}
function buildGolWord(pos){
  const { mat, aspect } = getGolWordMaterial();
  const h = 1.7, w = h * aspect;
  const word = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  word.name = 'gol';
  word.position.set(pos.x, pos.y + 4.2, pos.z);   // bien arriba de la bola de fuego
  word.scale.setScalar(0.01);
  word.renderOrder = 999;                          // se dibuja al final → siempre encima
  word.userData.billboard = true;
  celebGroup.add(word);
}
function updateCelebration(dt){
  if(!celebrating || !celebGroup) return;
  celebTimer += dt;
  const t = celebTimer;
  // cámara lenta que se va recuperando al final
  slowmo = (t > 2.0) ? Math.min(1, 0.28 + (t - 2.0) * 1.2) : 0.28;
  // luz del estallido (pico al inicio)
  if(celebLight) celebLight.intensity = Math.max(0, 8 * (1 - t / 1.2));
  for(const o of celebGroup.children){
    if(o.name === 'core'){
      const s = 1 + t * 6;
      o.scale.setScalar(s);
      o.position.y += dt * 2.2;
      o.material.opacity = Math.max(0, 1 - t / 0.9);   // destello breve e intenso
    } else if(o.name === 'fire'){
      const s = 1 + t * 4.5;
      o.scale.setScalar(s);
      o.position.y += dt * 2.2;     // sube
      o.material.opacity = Math.max(0, 1 - t / 2.2);
      o.material.transparent = true;
    } else if(o.name === 'stem'){
      o.scale.set(1 + t * 0.5, 1 + t * 6, 1 + t * 0.5);
      o.material.opacity = Math.max(0, 0.9 - t / 2.0);
    } else if(o.name === 'ring'){
      const td = Math.max(0, t - (o.userData.delay || 0));
      const s = 1 + td * 16;
      o.scale.setScalar(s);
      o.material.opacity = Math.max(0, 0.9 - td / 1.6);
    } else if(o.name === 'deb'){
      o.userData.vel.y -= 14 * dt;  // gravedad
      o.position.addScaledVector(o.userData.vel, dt);
    } else if(o.name === 'spark'){
      o.userData.vel.y -= 18 * dt;  // gravedad fuerte
      o.position.addScaledVector(o.userData.vel, dt);
      const k = Math.max(0, 1 - t / 1.3);
      o.scale.setScalar(Math.max(0.001, 1.2 * k));  // se encoge hasta desaparecer
    } else if(o.name === 'gol'){
      // pop elástico al aparecer, flotando hacia arriba, billboard a la cámara
      let s;
      if(t < 0.45){ s = (t/0.45) * 1.7; }               // crece rápido pasándose
      else if(t < 0.7){ s = 1.7 - (t-0.45)/0.25 * 0.45; } // rebota hacia abajo
      else { s = 1.25; }                                  // se asienta
      if(t > 2.0) s = Math.max(0, 1.25 - (t - 2.0) * 2.2);// se achica al final
      o.scale.setScalar(Math.max(0.001, s));
      o.position.y += dt * 0.9;                           // flota hacia arriba
      o.lookAt(camera.position.x, o.position.y, camera.position.z);
    }
  }
  // cámara enfocando la explosión
  const gp = celebGoalPos;
  const camOff = new THREE.Vector3(gp.x * 0.4, gp.y + 5, gp.z * 0.4);
  camera.position.lerp(new THREE.Vector3(gp.x + (0 - gp.x) * 0.55, gp.y + 5.5, gp.z + (0 - gp.z) * 0.55), Math.min(1, dt * 2));
  camera.lookAt(gp.x, gp.y + 2, gp.z);
}
function endCelebration(){
  slowmo = 1;
  celebrating = false;
  if(celebGroup){ scene.remove(celebGroup); celebGroup = null; }
  if(celebLight){ scene.remove(celebLight); celebLight = null; }
  document.getElementById('goalFlash').classList.remove('on');
  startKickoff();
}

// === SAQUE DEL CENTRO ===
// El jugador tiene la pelota en el centro; nadie se mueve hasta que pasás a un compañero.
// === EDITOR DEV DE ARCOS ===
function devFocusGoal(){
  const g = goalAreas[devSel];
  if(g) devCamTarget.copy(g.center);
  else devCamTarget.copy(getFieldCenter());
}
// Cámara LIBRE en DEV: orbitá (arrastrando) y zoom (pellizco) alrededor del arco
function updateDevCamera(){
  const t = devCamTarget;
  const sy = Math.sin(cameraOrbit.yaw), cy = Math.cos(cameraOrbit.yaw);
  const hp = Math.cos(cameraOrbit.pitch) * cameraOrbit.distance;
  const vp = Math.sin(cameraOrbit.pitch) * cameraOrbit.distance;
  camera.position.set(t.x + sy * hp, t.y + vp, t.z + cy * hp);
  camera.lookAt(t);
}
function toggleDev(){
  devMode = !devMode;
  document.getElementById('devBtn').classList.toggle('on', devMode);
  document.getElementById('devPanel').classList.toggle('show', devMode);
  if(devMode){
    cameraView = 'tps';            // soltar la cámara FIFA fija
    cameraOrbit.pitch = 0.55;
    cameraOrbit.distance = 14;
    devFocusGoal();                // apuntar al arco seleccionado
    showFoulBanner(LANG==='en'?'Free camera: drag to rotate · pinch to zoom':'Cámara libre: arrastrá para girar · pellizcá para zoom', 2600);
  }
  devRefresh();
}
function devRefresh(){
  for(const h of devHelpers){ scene.remove(h); if(h.geometry) h.geometry.dispose(); }
  devHelpers = [];
  if(!devMode || !goalAreas.length) return;
  for(let i = 0; i < goalAreas.length; i++){
    const color = (i === devSel) ? 0xffe000 : 0x00e0ff;
    const h = new THREE.Box3Helper(goalAreas[i].bbox, color);
    if(h.material){ h.material.depthTest = false; h.material.transparent = true; h.material.linewidth = 2; }
    h.renderOrder = 999;
    scene.add(h);
    devHelpers.push(h);
  }
  devReadout();
}
function devReadout(){
  const el = document.getElementById('devReadout'); if(!el) return;
  const g = goalAreas[devSel]; if(!g){ el.textContent = ''; return; }
  const s = new THREE.Vector3(); g.bbox.getSize(s);
  el.textContent = 'arco ' + (devSel + 1) + ' (' + (g.teamForGoal || '?') + ')  c(' +
    g.center.x.toFixed(2) + ',' + g.center.y.toFixed(2) + ',' + g.center.z.toFixed(2) + ')  s(' +
    s.x.toFixed(2) + ',' + s.y.toFixed(2) + ',' + s.z.toFixed(2) + ')';
}
function devEdit(kind, axis, sign){
  const g = goalAreas[devSel]; if(!g) return;
  const d = 0.25 * sign, bb = g.bbox;
  if(kind === 'move'){ bb.min[axis] += d; bb.max[axis] += d; }
  else {
    const c = (bb.min[axis] + bb.max[axis]) / 2;
    let half = Math.max(0.2, (bb.max[axis] - bb.min[axis]) / 2 + d);
    bb.min[axis] = c - half; bb.max[axis] = c + half;
  }
  bb.getCenter(g.center);
  devCamTarget.copy(g.center);   // la cámara libre sigue al cubo
  devRefresh();
  devSaveLocal();
}
function devSaveLocal(){
  try{
    const data = goalAreas.map(g => {
      const s = new THREE.Vector3(); g.bbox.getSize(s);
      return { team: g.teamForGoal,
        c: [+g.center.x.toFixed(3), +g.center.y.toFixed(3), +g.center.z.toFixed(3)],
        s: [+s.x.toFixed(3), +s.y.toFixed(3), +s.z.toFixed(3)] };
    });
    localStorage.setItem('rezonaGoals', JSON.stringify(data));
  }catch(e){}
}
function devCopy(){
  const data = goalAreas.map(g => {
    const s = new THREE.Vector3(); g.bbox.getSize(s);
    return { team: g.teamForGoal,
      c: [+g.center.x.toFixed(2), +g.center.y.toFixed(2), +g.center.z.toFixed(2)],
      s: [+s.x.toFixed(2), +s.y.toFixed(2), +s.z.toFixed(2)] };
  });
  const str = JSON.stringify(data);
  try{ navigator.clipboard.writeText(str); }catch(e){}
  try{ localStorage.setItem('rezonaGoals', str); }catch(e){}
  console.log('[DEV goals] ' + str);
  showFoulBanner('Arcos copiados ✓', 1500);
}
function devResetGoals(){
  try{ localStorage.removeItem('rezonaGoals'); }catch(e){}
  showFoulBanner(LANG==='en'?'Restart the match to see auto goals':'Reiniciá el partido para ver arcos auto', 1800);
}
// Aplica arcos guardados (DEV) sobre los detectados; se llama tras construir goalAreas
function applySavedGoals(){
  try{
    const saved = localStorage.getItem('rezonaGoals');
    if(!saved) return;
    const arr = JSON.parse(saved);
    if(!Array.isArray(arr) || arr.length !== goalAreas.length) return;
    for(let i = 0; i < arr.length; i++){
      const a = arr[i];
      const c = new THREE.Vector3(a.c[0], a.c[1], a.c[2]);
      const s = new THREE.Vector3(a.s[0], a.s[1], a.s[2]);
      goalAreas[i].bbox.setFromCenterAndSize(c, s);
      goalAreas[i].center.copy(c);
    }
    console.log('[goals] aplicados arcos ajustados en DEV ✓');
  }catch(e){}
}
// Arcos alineados a mano en DEV (sobre el modelo real). Son los valores por defecto.
const HARDCODED_GOALS = [
  { team: 'us',   c: [-12.20, 0.51, 6.33], s: [1.20, 2.00, 4.05] },
  { team: 'them', c: [ 11.95, 0.76, 6.33], s: [1.20, 1.90, 3.55] }
];
function bakeHardcodedGoals(){
  if(!goalAreas.length) return;
  for(const hg of HARDCODED_GOALS){
    const g = goalAreas.find(x => x.teamForGoal === hg.team);
    if(!g) continue;
    const c = new THREE.Vector3(hg.c[0], hg.c[1], hg.c[2]);
    const s = new THREE.Vector3(hg.s[0], hg.s[1], hg.s[2]);
    g.bbox.setFromCenterAndSize(c, s);
    g.center.copy(c);
  }
  console.log('[goals] arcos fijos aplicados (alineados en DEV) ✓');
}
function getFieldCenter(){
  if(!fieldLimits) return new THREE.Vector3(0, fieldGroundY, 0);
  return new THREE.Vector3((fieldLimits.minX + fieldLimits.maxX) / 2, fieldGroundY,
                           (fieldLimits.minZ + fieldLimits.maxZ) / 2);
}
// Pone a todos en 'idle' (saques / tiros libres): evita que queden con la anim de correr
function freezeFormationIdle(){
  if(player && player.currentAnim !== 'kick') playerSetAnim(player, 'idle');
  for(const tm of teammates) if(tm.currentAnim !== 'kick') playerSetAnim(tm, 'idle');
  for(const r of rivals) if(r.currentAnim !== 'kick') playerSetAnim(r, 'idle');
  for(const gk of goalkeepers) if(gk.currentAnim !== 'kick') playerSetAnim(gk, 'idle');
}
function faceTowardsGoal(ent, goalPos){
  if(!goalPos || !ent || !ent.root) return;
  const fx = goalPos.x - ent.root.position.x, fz = goalPos.z - ent.root.position.z;
  const L = Math.hypot(fx, fz) || 1;
  ent.root.rotation.y = Math.atan2(fx / L, fz / L) + Math.PI;
}
// Reposiciona compañeros (nuestra mitad) y rivales (su mitad) en el saque del centro
function placeKickoffFormation(c){
  if(!fieldFwd || !fieldSide) return;
  const span = (theirGoalPos && ourGoalPos) ? theirGoalPos.distanceTo(ourGoalPos) : 24;
  const H = span * 0.5;
  const spot = (ff, ss) => { const p = c.clone().addScaledVector(fieldFwd, ff * H).addScaledVector(fieldSide, ss); clampField(p); p.y = fieldGroundY; return p; };
  const tmSpots = [spot(-0.45, -6), spot(-0.45, 6), spot(-0.62, 0)];
  for(let i = 0; i < teammates.length; i++){
    if(!teammates[i].root) continue;
    teammates[i].root.position.copy(tmSpots[i % tmSpots.length]);
    faceTowardsGoal(teammates[i], theirGoalPos);
    playerSetAnim(teammates[i], 'idle');
  }
  const rvSpots = [spot(0.25, 0), spot(0.5, -6), spot(0.5, 6)];
  for(let i = 0; i < rivals.length; i++){
    if(!rivals[i].root) continue;
    rivals[i].root.position.copy(rvSpots[i % rvSpots.length]);
    faceTowardsGoal(rivals[i], ourGoalPos);
    playerSetAnim(rivals[i], 'idle');
  }
}
function startKickoff(){
  if(!player || !player.root) return;
  // ¿hay compañeros de campo? si no (1v1), el botón dice START
  const hasMates = teammates.some(tm => tm && tm.root && !tm.isKeeper);
  setKickLabel(false);
  if(!hasMates) setStartLabel(true);   // 1v1 → "START"
  else setStartLabel(false);            // con equipo → "PASE"
  passInFlight = false; passReceiver = null;
  kickoffActive = true;
  kickoffPending = false;
  const c = getFieldCenter();
  player.root.position.set(c.x, c.y, c.z);   // CENTRO real de la cancha
  faceTowardsGoal(player, theirGoalPos);
  placeKickoffFormation(c);
  ballOwner = player;
  lastTouchTeam = 'us';
  ballVelocity.set(0, 0, 0);
  if(ballModel) ballModel.position.copy(player.root.position);
  cameraMode = 'player';
  playerSetAnim(player, 'idle');
  stealGrace = 3;
  const msg = hasMates
    ? t('Saque del centro · ¡PASE para empezar!')
    : (LANG === 'en' ? 'Kick-off · press START' : 'Saque del centro · tocá START');
  showFoulBanner(msg, 2600);
}
// Cambia el botón PASE ↔ START (para 1v1)
function setStartLabel(on){
  const b = document.getElementById('btnPass'); if(!b) return;
  b.textContent = on ? (LANG === 'en' ? 'START' : 'START') : t('PASE');
  b._isStart = on;
}
function maybeStartKickoff(){
  if(kickoffPending) startKickoff();
}

// ===== SAQUES (lateral / esquina / saque de arco) =====
function nearestFieldPlayer(team, pos){
  const pool = (team === 'us') ? [player, ...teammates] : rivals;
  let best = null, bd = 1e9;
  for(const e of pool){
    if(!e || !e.root || e.isKeeper) continue;
    const d = e.root.position.distanceTo(pos);
    if(d < bd){ bd = d; best = e; }
  }
  return best;
}
function attackGoalFor(team){ return (team === 'us') ? theirGoalPos : ourGoalPos; }

// Arranca un saque: coloca al ejecutor con la pelota; si es tu equipo lo controlás vos,
// si es la IA "piensa" ~4s y se la pasa a un compañero.
// Durante el saque: primero CAMINAN a su posición (_walkTo), después hacen jockey leve
function setPieceJockey(dt){
  const taker = setPiece ? setPiece.taker : null;
  for(const e of [...teammates, ...rivals]){
    if(!e || !e.root || e === taker || e.isKeeper){ if(e && e.root && e.currentAnim !== 'kick') playerSetAnim(e, 'idle'); continue; }
    // PRIORIDAD: si tiene destino de caminata asignado (retreat/reposition), caminar hasta ahí
    if(e._walkTo){
      const reached = moveNPCTowards(e, e._walkTo, 3.6, dt);
      playerSetAnim(e, reached ? 'idle' : 'walk', 1.0);
      if(reached){ e._walkTo = null; e._jockBase = e.root.position.clone(); }
      continue;
    }
    if(e._jock){
      e._jockTimer = (e._jockTimer || 0) - dt;
      if(!e._jockBase) e._jockBase = e.root.position.clone();
      if(e._jockTimer <= 0 || !e._jockTarget){
        e._jockTimer = 1.2 + Math.random() * 1.6;
        e._jockTarget = e._jockBase.clone()
          .addScaledVector(fieldSide, (Math.random() - 0.5) * 5)
          .addScaledVector(fieldFwd, (Math.random() - 0.5) * 4);
        clampField(e._jockTarget); e._jockTarget.y = fieldGroundY;
      }
      const reached = moveNPCTowards(e, e._jockTarget, 1.8, dt);
      playerSetAnim(e, reached ? 'idle' : 'walk', 1.0);
    } else if(e.currentAnim !== 'kick'){
      playerSetAnim(e, 'idle');
    }
  }
  // el player, si tiene _walkTo y no es el ejecutor, también camina
  if(player && player !== taker){
    if(player._walkTo){
      const reached = moveNPCTowards(player, player._walkTo, 3.6, dt);
      playerSetAnim(player, reached ? 'idle' : 'walk', 1.0);
      if(reached) player._walkTo = null;
    } else if(player.currentAnim !== 'kick'){
      playerSetAnim(player, 'idle');
    }
  }
}
// === SAQUES CON APUNTADO (manos en lateral/esquina, pies en saque de arco) ===
function setKickLabel(throwMode){
  const b = document.getElementById('btnKick'); if(!b) return;
  b.textContent = throwMode ? (LANG === 'en' ? 'THROW' : 'TIRAR') : t('PATEAR');
}
function aimForward(){ const y = cameraOrbit.yaw; return new THREE.Vector3(-Math.sin(y), 0, -Math.cos(y)); }
function aimRight(){ const y = cameraOrbit.yaw; return new THREE.Vector3(-Math.cos(y), 0, Math.sin(y)); }
// Mantener la pose de "lanzamiento con manos" un ratito (se aplica después del mixer)
function applyThrowPose(p){
  if(!p || !p.root) return;
  const la = p.root.getObjectByName('LeftArm'), ra = p.root.getObjectByName('RightArm');
  const lf = p.root.getObjectByName('LeftForeArm'), rf = p.root.getObjectByName('RightForeArm');
  try{
    if(la){ la.rotation.z = -2.5; la.rotation.x = 0.3; }
    if(ra){ ra.rotation.z = 2.5; ra.rotation.x = 0.3; }
    if(lf){ lf.rotation.z = -0.5; }
    if(rf){ rf.rotation.z = 0.5; }
  }catch(e){}
}
function throwBall(){   // saque lateral / esquina: con las MANOS hacia donde apuntás
  if(!setPiece || ballOwner !== player || !ballModel) return;
  const fwd = aimForward();
  player.root.rotation.y = cameraOrbit.yaw;
  player._throwT = 0.55;   // dispara la pose de manos
  setPiece = null; setKickLabel(false);
  ballOwner = null; lastTouchTeam = 'us'; sfxKick();
  lastKicker = player; lastKickerTimer = 0.4;
  ballVelocity.set(fwd.x * 9, 5.5, fwd.z * 9);   // arco alto = lanzamiento de manos
  stealGrace = 1.5;
}
function goalKickLong(){   // saque de arco: patadón con los PIES hacia donde apuntás
  if(!setPiece || ballOwner !== player || !ballModel) return;
  const fwd = aimForward();
  player.root.rotation.y = cameraOrbit.yaw;
  playerSetAnim(player, 'kick', 1.4);
  setPiece = null; setKickLabel(false);
  ballOwner = null; lastTouchTeam = 'us'; sfxKick();
  lastKicker = player; lastKickerTimer = 0.4;
  const power = 12 + Math.random() * 3;
  ballVelocity.set(fwd.x * power, 4, fwd.z * power);
  stealGrace = 1.5;
}
function goalKickPass(){   // saque de arco: PASE al compañero más alineado con la mira
  if(!setPiece || ballOwner !== player || !ballModel) return;
  const fwd = aimForward();
  let best = null, bestDot = -1;
  for(const tm of teammates){
    if(!tm || !tm.root || tm.isKeeper) continue;
    const dx = tm.root.position.x - player.root.position.x, dz = tm.root.position.z - player.root.position.z;
    const L = Math.hypot(dx, dz) || 1; const dot = (dx * fwd.x + dz * fwd.z) / L;
    if(dot > bestDot){ bestDot = dot; best = tm; }
  }
  playerSetAnim(player, 'kick', 1.4);
  setPiece = null; setKickLabel(false);
  ballOwner = null; lastTouchTeam = 'us'; sfxKick();
  lastKicker = player; lastKickerTimer = 0.4;
  if(best){
    const dx = best.root.position.x - player.root.position.x, dz = best.root.position.z - player.root.position.z;
    const L = Math.hypot(dx, dz) || 1; const power = Math.max(7, Math.min(13, L * 1.2));
    ballVelocity.set(dx / L * power, 3, dz / L * power);
    passInFlight = true; passReceiver = best; passOffside = false; passTimer = 0; cameraMode = 'ball'; cameraBallTimer = 2.2;
  } else {
    ballVelocity.set(fwd.x * 11, 3.5, fwd.z * 11);
  }
  stealGrace = 1.5;
}
// Movimiento lateral limitado (saque de arco): izquierda-derecha sin salir del rango
function aimLateralMove(dt){
  if(!setPiece || !setPiece.spot) return;
  const right = aimRight();
  const vx = joystickState.vx || 0;
  if(Math.abs(vx) > 0.15){
    player.root.position.addScaledVector(right, vx * 3.0 * dt);
    const off = new THREE.Vector3().subVectors(player.root.position, setPiece.spot);
    const lat = Math.max(-3.5, Math.min(3.5, off.dot(right)));
    player.root.position.copy(setPiece.spot).addScaledVector(right, lat);
    player.root.position.y = fieldGroundY; clampField(player.root.position);
    playerSetAnim(player, 'walk', 1.0);
  } else {
    playerSetAnim(player, 'idle');
  }
}
function beginSetPiece(type, team, pos, taker){
  // === MODO APUNTAR (saques de tu equipo) ===
  // helpers definidos arriba en el módulo
  if(!taker || !taker.root){ ballOwner = null; if(ballModel) ballModel.position.copy(getFieldCenter()); return; }
  setPiece = { type, team, taker, think: 4.0 };
  taker.root.position.set(pos.x, fieldGroundY, pos.z);
  faceTowardsGoal(taker, attackGoalFor(team));
  ballOwner = taker;
  lastTouchTeam = team;
  ballVelocity.set(0, 0, 0);
  if(ballModel) ballModel.position.copy(taker.root.position);
  cameraMode = 'player';
  // SAQUE DE ARCO: el equipo que NO saca (incluido vos si te toca) retrocede tras la línea (Ley 16)
  if(type === 'goalkick'){
    const kickGoal = (team === 'us') ? ourGoalPos : theirGoalPos;
    retreatBehindLine((team === 'us') ? 'them' : 'us', kickGoal);
  }
  // Algunos NPC se moverán aleatoriamente durante el saque y otros no
  for(const e of [...teammates, ...rivals]){ if(e){ e._jock = Math.random() < 0.45; e._jockBase = null; e._jockTimer = 0; } }
  const names = { throwin: 'Saque lateral', corner: 'Saque de esquina', goalkick: 'Saque de arco', penalty: 'Penal' };
  if(team === 'us'){
    switchControlTo(taker);
    stealGrace = 3.5;   // tras sacar, los rivales te dan unos segundos antes de presionar/robar
    // === MODO APUNTAR: cámara cerca, no te movés (lateral/esquina) o solo izq-der (arco) ===
    if(type === 'throwin' || type === 'corner' || type === 'goalkick'){
      setPiece.aim = true;
      setPiece.foot = (type === 'goalkick');   // arco = con los pies; lateral/esquina = con las manos
      setPiece.spot = taker.root.position.clone();
      // mirá hacia el arco rival por defecto
      const g = attackGoalFor(team) || getFieldCenter();
      const fwd = new THREE.Vector3().subVectors(g, taker.root.position); fwd.y = 0;
      if(fwd.lengthSq() > 0.001){ fwd.normalize(); cameraOrbit.yaw = Math.atan2(-fwd.x, -fwd.z); }
      setKickLabel(!setPiece.foot);   // manos → "TIRAR/THROW"; pies → "PATEAR"
    }
    // Fade + reposicionar compañeros en posiciones estratégicas para recibir
    const fade = document.getElementById('setFade');
    if(fade){
      fade.classList.add('on');
      setTimeout(() => { repositionForSetPiece(taker); fade.classList.remove('on'); }, 360);
    } else {
      repositionForSetPiece(taker);
    }
    let hint;
    if(type === 'penalty') hint = t('¡PATEÁ al arco!');
    else if(type === 'goalkick') hint = (LANG === 'en' ? 'Aim & PASS / KICK' : 'Apuntá y PASE / PATEAR');
    else if(setPiece.aim) hint = (LANG === 'en' ? 'Aim with camera & THROW' : 'Apuntá girando la cámara y TIRAR');
    else hint = t('¡PASE!');
    showFoulBanner(t(names[type]) + ' · ' + hint, 2600);
  } else {
    showFoulBanner(t(names[type]) + ' (' + t('rival') + ')', 2200);
    // CÓRNER DEL RIVAL: tu equipo baja a DEFENDER en tu área (se ubican entre el arco y la pelota)
    if(type === 'corner'){
      const myGoal = ourGoalPos;
      if(myGoal){
        const defenders = [player, ...teammates].filter(e => e && e.root && !e.isKeeper);
        let k = 0;
        for(const e of defenders){
          // repartirlos en un arco delante de tu arco (zona de defensa del área)
          const off = (k - (defenders.length-1)/2);
          const p = myGoal.clone();
          if(fieldFwd) p.addScaledVector(fieldFwd, -3.5 - (k%2)*1.8);   // un poco por delante del arco
          if(fieldSide) p.addScaledVector(fieldSide, off * 2.6);
          clampField(p); p.y = fieldGroundY;
          e._walkTo = p.clone();   // caminan a defender (sin teletransporte)
          k++;
        }
      }
    }
  }
}
// Manda al equipo indicado (incluido el player si es 'us') detrás de una línea, lejos del arco del saque.
// AHORA CAMINAN hasta la posición (sin teletransporte): se asigna _walkTo y los lleva updateSetPieceWalk.
function retreatBehindLine(team, kickGoal){
  if(!kickGoal || !fieldFwd) return;
  const dir = new THREE.Vector3().subVectors(getFieldCenter(), kickGoal); dir.y = 0;
  if(dir.lengthSq() < 0.001) dir.set(1, 0, 0); else dir.normalize();
  const LINE = 9.5;   // distancia mínima desde el arco del saque
  const list = (team === 'us') ? [player, ...teammates] : rivals;
  let k = 0;
  for(const e of list){
    if(!e || !e.root || e.isKeeper) continue;
    const p = kickGoal.clone()
      .addScaledVector(dir, LINE + (k % 2) * 2.5)
      .addScaledVector(fieldSide, (k % 2 ? 1 : -1) * 4.5);
    clampField(p); p.y = fieldGroundY;
    e._walkTo = p.clone();     // ← caminar, no teletransportar
    k++;
  }
}
// Coloca a los compañeros (no al ejecutor) en posiciones abiertas para recibir el saque (CAMINANDO)
function repositionForSetPiece(taker){
  const base = taker.root.position.clone();
  const opts = [
    base.clone().addScaledVector(fieldFwd, 6).addScaledVector(fieldSide, -5),
    base.clone().addScaledVector(fieldFwd, 9).addScaledVector(fieldSide, 6),
    base.clone().addScaledVector(fieldFwd, 4).addScaledVector(fieldSide, 7)
  ];
  let k = 0;
  for(const tm of teammates){
    if(!tm.root || tm.isKeeper) continue;
    const p = opts[k % opts.length].clone();
    clampField(p); p.y = fieldGroundY;
    tm._walkTo = p.clone();    // ← caminar, no teletransportar
    k++;
  }
}
// Sistema que CAMINA a los jugadores con _walkTo asignado (usado en saques)
function updateSetPieceWalk(dt){
  const all = [player, ...teammates, ...rivals];
  for(const e of all){
    if(!e || !e.root || !e._walkTo) continue;
    if(e === player && e === (setPiece && setPiece.taker)) { e._walkTo = null; continue; }
    const reached = moveNPCTowards(e, e._walkTo, 3.6, dt);
    playerSetAnim(e, reached ? 'idle' : 'walk', 1.0);
    if(reached) e._walkTo = null;
  }
}
// (función vieja, ya integrada arriba)
function _oldRepositionForSetPiece(taker){
  const base = taker.root.position.clone();
  const opts = [
    base.clone().addScaledVector(fieldFwd, 6).addScaledVector(fieldSide, -5),
    base.clone().addScaledVector(fieldFwd, 9).addScaledVector(fieldSide, 6),
    base.clone().addScaledVector(fieldFwd, 4).addScaledVector(fieldSide, 7)
  ];
  let k = 0;
  for(const tm of teammates){
    if(!tm.root || tm.isKeeper) continue;
    const p = opts[k % opts.length].clone();
    clampField(p); p.y = fieldGroundY;
    tm.root.position.copy(p);
    faceTowardsGoal(tm, attackGoalFor('us'));
    k++;
  }
}
function triggerThrowIn(pos){
  const team = (lastTouchTeam === 'us') ? 'them' : 'us';
  const wAxis = (fieldAxis === 'x') ? 'z' : 'x';
  const p = pos.clone();
  if(wAxis === 'x') p.x = (pos.x < (fieldLimits.minX + fieldLimits.maxX) / 2) ? fieldLimits.minX : fieldLimits.maxX;
  else              p.z = (pos.z < (fieldLimits.minZ + fieldLimits.maxZ) / 2) ? fieldLimits.minZ : fieldLimits.maxZ;
  beginSetPiece('throwin', team, p, nearestFieldPlayer(team, p));
}
function triggerEndLineOut(lowEnd, pos){
  const mAxis = fieldAxis;
  const goal = goalAreas.find(g => {
    const cm = (mAxis === 'x') ? g.center.x : g.center.z;
    const fc = (mAxis === 'x') ? (fieldLimits.minX + fieldLimits.maxX) / 2 : (fieldLimits.minZ + fieldLimits.maxZ) / 2;
    return lowEnd ? (cm < fc) : (cm > fc);
  });
  if(!goal){ ballOwner = null; if(ballModel) ballModel.position.copy(getFieldCenter()); return; }
  const attackTeam = goal.teamForGoal;
  const defendTeam = (attackTeam === 'us') ? 'them' : 'us';
  if(lastTouchTeam === attackTeam){
    const gk = goalkeepers.find(k => k.team === defendTeam && k.root);
    beginSetPiece('goalkick', defendTeam, gk ? gk.root.position.clone() : goal.center.clone(), gk);
  } else {
    const wAxis = (mAxis === 'x') ? 'z' : 'x';
    const corner = goal.center.clone();
    if(wAxis === 'x') corner.x = (pos.x < (fieldLimits.minX + fieldLimits.maxX) / 2) ? fieldLimits.minX : fieldLimits.maxX;
    else              corner.z = (pos.z < (fieldLimits.minZ + fieldLimits.maxZ) / 2) ? fieldLimits.minZ : fieldLimits.maxZ;
    beginSetPiece('corner', attackTeam, corner, nearestFieldPlayer(attackTeam, corner));
  }
}
function updateSetPiece(dt){
  if(!setPiece) return;
  if(ballOwner === setPiece.taker) playerSetAnim(setPiece.taker, 'idle');
  if(setPiece.team === 'us') return;

  // ESPERAR EL ACOMODAMIENTO: no sacar hasta que todos llegaron a su posición
  // (ningún jugador con corrida automática _walkTo pendiente). Primero se forman, luego saca.
  const stillArranging = [player, ...teammates, ...rivals].some(e => e && e.root && e._walkTo);
  if(stillArranging){
    if(setPiece.taker) playerSetAnim(setPiece.taker, 'idle');
    return;   // congela el conteo del saque hasta que todos estén ubicados
  }

  setPiece.think -= dt;
  if(setPiece.think <= 0){
    const taker = setPiece.taker;
    if(setPiece.type === 'penalty'){
      if(ballOwner === taker) npcKick(taker, 12);   // penal: disparo directo al arco
      setPiece = null;
      return;
    }
    // CÓRNER: centrar al ÁREA rival (pase elevado al centro del área donde esperan los
    // compañeros). NUNCA disparar directo al arco desde la esquina (eso causaba el "autogol").
    if(setPiece.type === 'corner'){
      const attackGoal = attackGoalFor(taker.team);   // arco que ATACA el que saca
      const pool = (taker.team === 'us') ? [player, ...teammates] : rivals;
      const mates = pool.filter(e => e && e.root && e !== taker && !e.isKeeper);
      // objetivo: un compañero dentro del área rival; si no hay, el centro del área
      let target = null, bestD = 1e9;
      if(attackGoal){
        for(const m of mates){
          const dGoal = m.root.position.distanceTo(attackGoal);
          if(dGoal < 14 && dGoal < bestD){ bestD = dGoal; target = m; }   // el más metido en el área
        }
      }
      if(target && ballOwner === taker){
        npcPassTo(taker, target);             // centro al compañero en el área
      } else if(ballOwner === taker && attackGoal){
        centerToArea(taker, attackGoal);      // centro al punto de penal
      }
      setPiece = null;
      return;
    }
    // Lateral / otros: pase a un compañero (preferir uno hacia adelante, no hacia atrás)
    const attackGoal = attackGoalFor(taker.team);
    const pool = (taker.team === 'us') ? [player, ...teammates] : rivals;
    const mates = pool.filter(e => e && e.root && e !== taker && !e.isKeeper);
    let tgt = null;
    if(mates.length && attackGoal){
      // elegir el que más adelante esté (más cerca del arco rival) y razonablemente cerca
      let bestScore = -1e9;
      for(const m of mates){
        const d = m.root.position.distanceTo(taker.root.position);
        if(d < 3 || d > 22) continue;
        const prog = taker.root.position.distanceTo(attackGoal) - m.root.position.distanceTo(attackGoal);
        if(prog > bestScore){ bestScore = prog; tgt = m; }
      }
      if(!tgt) tgt = mates[0];
    } else if(mates.length){ tgt = mates[0]; }
    if(tgt && ballOwner === taker) npcPassTo(taker, tgt);
    setPiece = null;
  }
}

// Centro al área: pase elevado hacia el punto de penal del arco que se ataca
function centerToArea(taker, attackGoal){
  if(ballOwner !== taker || !ballModel) return;
  playerSetAnim(taker, 'kick', 1.6);
  // punto objetivo: un poco por delante del arco (punto de penal)
  const toGoal = new THREE.Vector3().subVectors(attackGoal, taker.root.position); toGoal.y = 0;
  const len = toGoal.length() || 1; toGoal.normalize();
  const targetPt = attackGoal.clone().addScaledVector(toGoal, -3);   // ~3m delante del arco
  const dir = new THREE.Vector3().subVectors(targetPt, taker.root.position); dir.y = 0;
  const dl = dir.length() || 1; dir.normalize();
  taker.root.rotation.y = Math.atan2(dir.x, dir.z) + Math.PI;
  ballOwner = null; lastKicker = taker; lastKickerTimer = 0.6; lastTouchTeam = taker.team;
  const power = Math.max(9, Math.min(15, dl * 1.0));
  ballVelocity.set(dir.x * power, 5.5, dir.z * power);   // elevado, centro al área
}

// --- COMPAÑEROS: reciben la pelota y a los 2s te la devuelven ---
// (usan exactamente las mismas animaciones que el jugador: idle / kick)
function npcPassTo(npc, target){
  if(ballOwner !== npc || !ballModel || !target || !target.root) return;
  if(npc.team && target.team && npc.team !== target.team) return;   // jamás pasar al equipo contrario
  playerSetAnim(npc, 'kick', 1.6);

  // Mirar al objetivo (misma convención que el movimiento: atan2(dir.x,dir.z)+PI)
  const dx = target.root.position.x - npc.root.position.x;
  const dz = target.root.position.z - npc.root.position.z;
  const len = Math.hypot(dx, dz) || 1;
  const fx = dx / len, fz = dz / len;
  npc.root.rotation.y = Math.atan2(fx, fz) + Math.PI;

  // Potencia del pase escalada por distancia
  const power = Math.max(7, Math.min(13, len * 1.3));
  setTimeout(() => {
    if(!ballModel || ballOwner !== npc || !target.root) return;
    ballOwner = null;
    sfxKick();
    lastKicker = npc; lastKickerTimer = 0.5;
    lastTouchTeam = npc.team;
    // EXACTO y SUAVE: recalcular a la posición ACTUAL del receptor (pase controlable, no un misil)
    let lx = target.root.position.x - npc.root.position.x;
    let lz = target.root.position.z - npc.root.position.z;
    if(target._vel){ lx += target._vel.x * 0.18; lz += target._vel.z * 0.18; }
    const ll = Math.hypot(lx, lz) || 1;
    const pw = Math.max(5.5, Math.min(10.5, ll * 1.05));
    ballVelocity.set(lx / ll * pw, 2.2, lz / ll * pw);
    // PASE GUIADO: la pelota se dirige sola al aliado y nadie la intercepta (no falla)
    ballHomingTarget = target; ballHomingTimer = 3.0;
    // La cámara solo se reorienta si el pase es HACIA vos (para verlo llegar)
    if(target === player){
      cameraMode = 'ball';
      cameraBallTimer = 2.5;
    }
  }, 200);
}

// ════════════════════════════════════════════════════════════════════
//  IA DE FÚTBOL · SISTEMA BUCKLAND ("Simple Soccer")
//  Capas: (1) estado de equipo Atacando/Defendiendo según posesión.
//         (2) roles por jugador: controlador, perseguidor, soporte, resto.
//         (3) "best support spot": el mejor lugar para recibir/rematar.
//         (4) steering suave + separación (no se amontonan).
//  Equilibrado: pases y tiros pueden fallar; defensa presiona pero no es perfecta.
// ════════════════════════════════════════════════════════════════════

const AI = {
  supportCD: 0,        // recalcular el mejor spot de soporte cada cierto tiempo
  bestSpotUs: null,
  bestSpotThem: null,
};

// helpers geométricos en el plano XZ
function _v(x, z){ return new THREE.Vector3(x, 0, z); }
function _dist(a, b){ return Math.hypot(a.x - b.x, a.z - b.z); }
function _ballPos(){ return ballModel ? ballModel.position : (player ? player.root.position : _v(0,0)); }

// ¿hay un oponente entre 'from' y 'to' que pueda interceptar un pase? (cono)
function passIsSafe(from, to, opponents, radius){
  const dx = to.x - from.x, dz = to.z - from.z;
  const len = Math.hypot(dx, dz) || 1;
  const ux = dx / len, uz = dz / len;
  for(const o of opponents){
    if(!o || !o.root) continue;
    const ox = o.root.position.x - from.x, oz = o.root.position.z - from.z;
    const proj = ox * ux + oz * uz;            // proyección sobre la línea de pase
    if(proj < 0.5 || proj > len - 0.5) continue;
    const perp = Math.abs(ox * uz - oz * ux);  // distancia perpendicular
    if(perp < (radius || 1.6)) return false;   // hay un rival tapando la línea
  }
  return true;
}

// ¿qué tan buena es una posición para ATACAR? (más cerca del arco rival + ángulo de tiro libre)
function spotScore(pos, attackGoal, opponents, passer){
  if(!attackGoal) return -1e9;
  let score = 0;
  // 1) cercanía al arco (cuanto más cerca, mejor, pero no pegado)
  const dGoal = _dist(pos, attackGoal);
  score += Math.max(0, 30 - dGoal) * 1.2;
  // 2) ¿se puede patear al arco desde acá sin un rival muy cerca tapando?
  if(passIsSafe(pos, attackGoal, opponents, 1.4)) score += 18;
  // 3) ¿el pase desde el portador llega seguro?
  if(passer && passer.root){
    if(passIsSafe(passer.root.position, pos, opponents, 1.6)) score += 14;
    else score -= 12;
    const dPass = _dist(passer.root.position, pos);
    if(dPass < 4 || dPass > 26) score -= 10;   // ni muy cerca ni imposible
  }
  // 4) espacio: penalizar si hay rivales encima del spot
  for(const o of opponents){
    if(!o || !o.root) continue;
    const d = _dist(pos, o.root.position);
    if(d < 3) score -= (3 - d) * 5;
  }
  return score;
}

// Calcula el MEJOR spot de soporte para un equipo (sampleando puntos alrededor del arco rival)
function computeBestSupportSpot(team){
  const attackGoal = (team === 'us') ? theirGoalPos : ourGoalPos;
  if(!attackGoal || !fieldLimits) return null;
  const opponents = (team === 'us') ? rivals.concat(goalkeepers.filter(g=>g.team==='them'))
                                    : [player, ...teammates].concat(goalkeepers.filter(g=>g.team==='us'));
  const passer = ballOwner && ballOwner.team === team ? ballOwner : null;
  const cx = (fieldLimits.minX + fieldLimits.maxX) / 2;
  const cz = (fieldLimits.minZ + fieldLimits.maxZ) / 2;
  let best = null, bestS = -1e9;
  // grilla de muestreo en la mitad de ataque
  const stepsX = 6, stepsZ = 6;
  for(let i = 0; i <= stepsX; i++){
    for(let j = 0; j <= stepsZ; j++){
      const px = fieldLimits.minX + (fieldLimits.maxX - fieldLimits.minX) * (i / stepsX);
      const pz = fieldLimits.minZ + (fieldLimits.maxZ - fieldLimits.minZ) * (j / stepsZ);
      const pos = _v(px, pz);
      // solo en la mitad de ataque (más cerca del arco rival que del propio)
      const ownGoal = (team === 'us') ? ourGoalPos : theirGoalPos;
      if(ownGoal && _dist(pos, attackGoal) > _dist(pos, ownGoal) + 6) continue;
      const s = spotScore(pos, attackGoal, opponents, passer);
      if(s > bestS){ bestS = s; best = pos; }
    }
  }
  return best;
}

// ── ORQUESTADOR PRINCIPAL: corre cada frame, ambos equipos ──
function updateTeamAI(dt){
  if(matchOver || freeKickPause > 0 || fieldTut) return;
  if(!fieldLimits) return;
  // Durante un saque (setPiece) la IA NO mueve a los jugadores: lo hace setPieceJockey
  // (acomodamiento + jockey). Evita que ambos sistemas peleen y dejen animaciones raras.
  if(setPiece) return;
  AI.supportCD -= dt;
  if(AI.supportCD <= 0){
    AI.bestSpotUs = computeBestSupportSpot('us');
    AI.bestSpotThem = computeBestSupportSpot('them');
    AI.supportCD = 0.25;
  }
  // detectar TRANSICIÓN: si cambió el equipo en posesión → arrancar contraataque
  AI._recoverTimer = AI._recoverTimer || { us: 0, them: 0 };
  const ownerTeam = ballOwner ? ballOwner.team : null;
  if(ownerTeam && ownerTeam !== AI._lastOwnerTeam){
    AI._recoverTimer[ownerTeam] = 1.6;   // 1.6s de pique al espacio tras recuperar
    AI._lastOwnerTeam = ownerTeam;
  }
  AI._recoverTimer.us = Math.max(0, AI._recoverTimer.us - dt);
  AI._recoverTimer.them = Math.max(0, AI._recoverTimer.them - dt);

  // LÍNEA DEFENSIVA COMÚN: profundidad (sobre el eje de ataque del que defiende) a la que
  // se alinean los defensores. Sube si la pelota está lejos del arco propio (presión alta),
  // baja si el rival se acerca. Da una línea ordenada y habilita el offside trap.
  AI._defLine = AI._defLine || { us: null, them: null };
  for(const team of ['us','them']){
    const defendGoal = (team === 'us') ? ourGoalPos : theirGoalPos;
    const attackGoal = (team === 'us') ? theirGoalPos : ourGoalPos;
    if(!defendGoal || !attackGoal) continue;
    const tf = _v(attackGoal.x - defendGoal.x, 0, attackGoal.z - defendGoal.z);
    const l = Math.hypot(tf.x, tf.z) || 1; tf.x/=l; tf.z/=l;
    const ball = _ballPos();
    const ballAlong = (ball.x-defendGoal.x)*tf.x + (ball.z-defendGoal.z)*tf.z;
    // la línea se ubica una distancia por detrás de la pelota (más atrás si la pelota está cerca)
    const target = Math.max(6, Math.min(l*0.55, ballAlong - 6));
    // suavizar (la línea se mueve gradual, no salta)
    if(AI._defLine[team] == null) AI._defLine[team] = target;
    else AI._defLine[team] += (target - AI._defLine[team]) * Math.min(1, dt*2.5);
  }

  aiTeam('us', dt);
  aiTeam('them', dt);
}

// ── FORMACIÓN: slots relativos (forward, side) normalizados -1..1 por rol ──
// fwd: -1 = nuestra área, +1 = área rival.  side: -1 izq, +1 der.
function teamFormation(n){
  // devuelve n slots {fwd, side, role} según cantidad de jugadores de campo
  if(n <= 1) return [{fwd:-0.1, side:0, role:'mid'}];
  if(n === 2) return [{fwd:-0.45, side:0, role:'def'}, {fwd:0.35, side:0, role:'fwd'}];
  if(n === 3) return [{fwd:-0.58, side:0, role:'def'},
                      {fwd:-0.05, side:-0.45, role:'mid'},
                      {fwd:0.48, side:0.30, role:'fwd'}];
  if(n === 4) return [{fwd:-0.6, side:-0.35, role:'def'}, {fwd:-0.6, side:0.35, role:'def'},
                      {fwd:0.0, side:0, role:'mid'}, {fwd:0.5, side:0, role:'fwd'}];
  // 5+: 2 def, 2 medios, 1 punta (formación tipo 2-2-1)
  return [{fwd:-0.62, side:-0.35, role:'def'}, {fwd:-0.62, side:0.35, role:'def'},
          {fwd:-0.05, side:-0.4, role:'mid'}, {fwd:-0.05, side:0.4, role:'mid'},
          {fwd:0.55, side:0, role:'fwd'}];
}

// Posición mundial de un slot dado el "ancla" del equipo (centro del bloque) y la orientación.
function slotToWorld(slot, anchor, teamFwdVec, halfLen, halfWide){
  const p = anchor.clone();
  p.addScaledVector(teamFwdVec, slot.fwd * halfLen);
  // side: perpendicular a teamFwd
  const sideVec = _v(-teamFwdVec.z, 0, teamFwdVec.x);
  p.addScaledVector(sideVec, slot.side * halfWide);
  p.y = 0;
  return p;
}

function aiTeam(team, dt){
  const fieldMates = (team === 'us') ? [player, ...teammates] : rivals;
  const mates = fieldMates.filter(m => m && m.root && !m.isKeeper);
  const opponents = (team === 'us') ? rivals.filter(o=>o&&o.root) : [player, ...teammates].filter(o=>o&&o.root);
  const attackGoal = (team === 'us') ? theirGoalPos : ourGoalPos;
  const defendGoal = (team === 'us') ? ourGoalPos : theirGoalPos;
  if(!attackGoal || !defendGoal || mates.length === 0) return;

  const ball = _ballPos();
  const weAttack = !!(ballOwner && ballOwner.team === team);
  const rivalAttack = !!(ballOwner && ballOwner.team !== team);
  const ballLoose = !ballOwner;

  // dirección de ataque del equipo (hacia su arco rival)
  const teamFwd = _v(attackGoal.x - defendGoal.x, 0, attackGoal.z - defendGoal.z);
  const tl = Math.hypot(teamFwd.x, teamFwd.z) || 1; teamFwd.x/=tl; teamFwd.z/=tl;
  const fieldSpan = _dist(attackGoal, defendGoal) || 40;
  const halfLen = fieldSpan * 0.42;
  const halfWide = (fieldLimits ? (fieldLimits.maxZ - fieldLimits.minZ) : 30) * 0.30;

  // === BLOQUE DE EQUIPO: el ancla (centro de la formación) se desplaza según
  // dónde está la pelota sobre el eje largo. Sube en ataque, baja en defensa. ===
  const mid = _v((attackGoal.x + defendGoal.x)/2, 0, (attackGoal.z + defendGoal.z)/2);
  // proyección de la pelota sobre el eje de ataque (cuánto avanzó, -1..1)
  const bRel = _v(ball.x - mid.x, 0, ball.z - mid.z);
  let ballProj = (bRel.x * teamFwd.x + bRel.z * teamFwd.z) / (fieldSpan/2);
  ballProj = Math.max(-1, Math.min(1, ballProj));
  // el bloque sigue la pelota pero amortiguado (compacidad): media línea adelante de su zona
  const blockShift = weAttack ? 0.30 : (rivalAttack ? -0.10 : 0.08);
  const anchor = mid.clone().addScaledVector(teamFwd, (ballProj * 0.55 + blockShift) * (fieldSpan/2));

  // === PRESSING DE A UNO: elegir UN presser (más cercano con buen ángulo) y UN cover ===
  let presser = null, pd = 1e9, cover = null, cd = 1e9;
  if(!weAttack){
    for(const m of mates){
      if(m === player) continue;        // vos no sos presser automático
      const d = _dist(m.root.position, ball);
      if(d < pd){ cd = pd; cover = presser; pd = d; presser = m; }
      else if(d < cd){ cd = d; cover = m; }
    }
  }
  // claim global: marcar quién presiona (para que los demás respeten "ya voy yo")
  AI._presser = AI._presser || {};
  AI._presser[team] = presser;

  // ordenar mates por avance para asignar slots (los de más atrás = defensores)
  const slots = teamFormation(mates.length);
  const ordered = mates.slice().sort((a,b)=>{
    const pa = (a.root.position.x-defendGoal.x)*teamFwd.x + (a.root.position.z-defendGoal.z)*teamFwd.z;
    const pb = (b.root.position.x-defendGoal.x)*teamFwd.x + (b.root.position.z-defendGoal.z)*teamFwd.z;
    return pa - pb;   // menor avance primero (defensores)
  });

  // perseguidor de pelota suelta (solo uno)
  let looseChaser = null;
  if(ballLoose){
    let bd = 1e9;
    for(const m of mates){ if(m===player) continue; const d=_dist(m.root.position,ball); if(d<bd){bd=d;looseChaser=m;} }
  }

  for(let i = 0; i < ordered.length; i++){
    const m = ordered[i];
    m._aiTimer = (m._aiTimer || 0) - dt;
    m._slot = slots[Math.min(i, slots.length-1)];
    if(ballOwner !== m) m._holdTime = 0;   // solo acumula tenencia el que tiene la pelota

    if(m === player) continue;   // humano: lo movés vos
    if(m._walkTo) continue;      // está cumpliendo un retroceso obligado (lo mueve updateSetPieceWalk)

    // 1) tiene la pelota → CONTROLADOR
    if(ballOwner === m){ aiCarrier(m, team, fieldMates, opponents, attackGoal, dt); continue; }

    // 2) pelota suelta y soy el más cercano → ir por ella
    if(ballLoose && m === looseChaser){ aiChase(m, ball, team, dt); continue; }

    // 3) defendemos y soy el presser → presionar la pelota (de a uno)
    if(rivalAttack && m === presser){ aiChase(m, ball, team, dt); continue; }

    // 4) soy el cover → respaldar al presser a media distancia (entre pelota y arco)
    if(rivalAttack && m === cover){
      const cv = _v(ball.x + (defendGoal.x-ball.x)*0.35, 0, ball.z + (defendGoal.z-ball.z)*0.35);
      moveToTactical(m, team, cv, mates, 4.4, dt);
      continue;
    }

    // GIVE-AND-GO: si acabo de pasar, pico a un hueco adelante para la pared
    m._goRun = Math.max(0, (m._goRun || 0) - dt);
    if(weAttack && m._goRun > 0){
      const hole = attackGoal.clone();
      const sideVec = _v(-teamFwd.z, 0, teamFwd.x);
      hole.addScaledVector(sideVec, (m._goSide || 1) * halfWide * 0.5);
      hole.addScaledVector(teamFwd, -halfLen * 0.2);
      applySeparation(m, team, hole); clampField(hole);
      moveNPCTowards(m, hole, 5.2, dt);
      playerSetAnim(m, 'run', 1.25);
      continue;
    }

    // CONTRAATAQUE: si recién recuperamos y soy delantero, pico al espacio
    if(weAttack && m._slot.role === 'fwd' && AI._recoverTimer && AI._recoverTimer[team] > 0){
      const space = attackGoal.clone().addScaledVector(teamFwd, -halfLen*0.1);
      applySeparation(m, team, space); clampField(space);
      moveNPCTowards(m, space, 5.4, dt);
      playerSetAnim(m, 'run', 1.3);
      continue;
    }

    // 5) resto → MANTENER SLOT DE FORMACIÓN (bloque compacto). En ataque, el slot
    //    se proyecta hacia adelante; en defensa, se repliega. Esto evita el enjambre.
    let slotPos = slotToWorld(m._slot, anchor, teamFwd, halfLen, halfWide);
    // === DEFENSA ZONAL + LÍNEA COORDINADA ===
    // Cada defensor cubre al atacante rival MÁS CERCANO A SU ZONA (no todos al mismo).
    // Y todos los defensores comparten una misma profundidad de línea (suben/bajan juntos),
    // lo que arma una línea ordenada y permite el offside trap.
    if(m._slot.role === 'def' && rivalAttack){
      // atacante de mi zona (más cercano a mi slot, no al arco)
      let mark = null, md = 1e9;
      for(const o of opponents){
        if(!o || !o.root || o.isKeeper) continue;
        const d = _dist(o.root.position, slotPos);
        if(d < md){ md = d; mark = o; }
      }
      if(mark){
        // marcar manteniéndome del lado del arco (entre el atacante y mi arco)
        slotPos.x = slotPos.x*0.5 + (mark.root.position.x + (defendGoal.x-mark.root.position.x)*0.22)*0.5;
        slotPos.z = slotPos.z*0.5 + (mark.root.position.z + (defendGoal.z-mark.root.position.z)*0.22)*0.5;
      }
      // LÍNEA COORDINADA: proyectar la profundidad común de los defensores sobre el eje de ataque
      if(AI._defLine && AI._defLine[team] != null){
        const along = (slotPos.x-defendGoal.x)*teamFwd.x + (slotPos.z-defendGoal.z)*teamFwd.z;
        const corr = (AI._defLine[team] - along) * 0.5;   // tirar hacia la línea común
        slotPos.x += teamFwd.x * corr; slotPos.z += teamFwd.z * corr;
      }
    }
    clampField(slotPos);
    moveToTactical(m, team, slotPos, mates, weAttack ? 4.2 : 3.8, dt);
  }
}

// mover a una posición táctica con separación y animación, sin "vibrar" cuando ya llegó
function moveToTactical(m, team, tgt, mates, speed, dt){
  applySeparation(m, team, tgt);
  clampField(tgt);
  const d = _dist(m.root.position, tgt);
  // HISTÉRESIS anti-vibración: si ya está "colocado" (quieto), no se mueve hasta que el
  // objetivo se aleje un buen tramo. Evita el temblor de marcaje/separación.
  if(m._settled){
    if(d < 2.6){ playerSetAnim(m, 'idle'); return; }   // sigue colocado
    m._settled = false;                                 // el objetivo se alejó: re-posicionarse
  }
  if(d < 1.0){ m._settled = true; playerSetAnim(m, 'idle'); return; }
  const reached = moveNPCTowards(m, tgt, speed, dt);
  playerSetAnim(m, reached ? 'idle' : 'run', 1.1);
}

function nearestOpponentToGoal(opponents, goal, exclude){
  let best = null, bd = 1e9;
  for(const o of opponents){
    if(!o || !o.root || o.isKeeper) continue;
    const d = _dist(o.root.position, goal);
    if(d < bd){ bd = d; best = o; }
  }
  return best;
}

function aiCarrier(c, team, mates, opponents, attackGoal, dt){
  c.kickCooldown = Math.max(0, (c.kickCooldown || 0) - dt);
  c._fwdPassCD = Math.max(0, (c._fwdPassCD || 0) - dt);
  // tiempo que lleva con la pelota (se resetea cuando la pierde, ver más abajo)
  c._holdTime = (c._holdTime || 0) + dt;
  const distGoal = _dist(c.root.position, attackGoal);
  let nearOpp = 1e9, nearO = null;
  for(const o of opponents){ if(o && o.root){ const d = _dist(c.root.position, o.root.position); if(d < nearOpp){ nearOpp = d; nearO = o; } } }
  const pressured = nearOpp < 2.4;
  const reallyPressured = nearOpp < 1.6;

  // 1) TIRO al arco — RIVALES respetan una distancia/área máxima (no disparan de lejos).
  //    'them' (rival): solo dentro de ~10m del arco. 'us' (tus compas): rango algo mayor.
  const shootRange = (team === 'them') ? 10 : 12;
  const desperateRange = (team === 'them') ? 12 : 15;
  const canShoot = distGoal < shootRange && passIsSafe(c.root.position, attackGoal, opponents, 1.3);
  if(c.kickCooldown <= 0 && (canShoot || (reallyPressured && distGoal < desperateRange && Math.random() < 0.4))){
    npcKick(c, distGoal < 8 ? 13 : 15); c.kickCooldown = 1.6; c._holdTime = 0; return;
  }

  // 2) PASE — solo si: (a) lleva un mínimo conduciendo (asentó la pelota), o (b) está realmente presionado.
  //    Esto corta el ping-pong: no pasan apenas reciben, primero conducen.
  const settled = c._holdTime > 1.3;             // asentar + conducir ~1.3s antes de pensar el pase
  const wantsPass = reallyPressured || (settled && c._fwdPassCD <= 0);

  // 2a) THROUGH BALL (pase filtrado): si un compañero pica al espacio por delante y el
  //     hueco entre defensores está abierto, mandarle un pase filtrado adelante suyo.
  if(c.kickCooldown <= 0 && settled && c._fwdPassCD <= 0){
    for(const m of mates){
      if(!m || m === c || !m.root || m.isKeeper) continue;
      if(!(m._goRun > 0 || m._slot && m._slot.role === 'fwd')) continue;   // está picando o es punta
      const adv = _dist(c.root.position, attackGoal) - _dist(m.root.position, attackGoal);
      if(adv < 4) continue;                          // tiene que estar más adelantado
      // punto de destino: delante del que pica, hacia el arco
      const lead = m.root.position.clone();
      const toGoal = _v(attackGoal.x - m.root.position.x, 0, attackGoal.z - m.root.position.z);
      const gl = Math.hypot(toGoal.x, toGoal.z) || 1;
      lead.x += (toGoal.x/gl) * 5; lead.z += (toGoal.z/gl) * 5;
      if(passIsSafe(c.root.position, lead, opponents, 1.3)){
        npcKick(c, Math.min(16, 9 + adv*0.4));       // pase fuerte al espacio
        c.kickCooldown = 1.2; c._fwdPassCD = 2.2; c._holdTime = 0;
        return;
      }
    }
  }
  if(c.kickCooldown <= 0 && wantsPass){
    let best = null, bestGain = reallyPressured ? -3 : 4;   // exige más ganancia para pasar (menos pases laterales)
    for(const m of mates){
      if(!m || m === c || !m.root || m.isKeeper) continue;
      const d = _dist(c.root.position, m.root.position);
      if(d < 6 || d > 24) continue;               // pases más largos y con sentido (no al de al lado)
      if(!passIsSafe(c.root.position, m.root.position, opponents, 1.6)) continue;
      const gain = distGoal - _dist(m.root.position, attackGoal);
      const bonus = (m === player) ? 2 : 0;
      if(gain + bonus > bestGain){ bestGain = gain + bonus; best = m; }
    }
    if(best){
      npcPassTo(c, best);
      if(best === player){ passReceiver = player; passInFlight = true; passTimer = 0; }
      c.kickCooldown = 1.2; c._fwdPassCD = 2.2;   // cooldown de pase MÁS LARGO (menos seguidos)
      c._holdTime = 0;
      c._goRun = 1.2; c._goSide = (Math.random() < 0.5 ? -1 : 1);
      return;
    }
  }

  // 3) CONDUCIR hacia el arco (lo que hace la mayor parte del tiempo: lleva la pelota)
  const tgt = _v(attackGoal.x, attackGoal.z);
  if(pressured && nearO){
    const ax = c.root.position.x - nearO.root.position.x;
    const az = c.root.position.z - nearO.root.position.z;
    const al = Math.hypot(ax, az) || 1;
    tgt.x += (ax/al) * 4; tgt.z += (az/al) * 4;
  }
  clampField(tgt);
  moveNPCTowards(c, tgt, pressured ? 4.6 : 4.2, dt);
  playerSetAnim(c, 'run', 1.15);
}

function aiChase(m, ball, team, dt){
  if(!m._aiTarget) m._aiTarget = new THREE.Vector3();
  m._aiTarget.set(ball.x, 0, ball.z);
  // INTERCEPCIÓN: anticipar hacia dónde va la pelota (punto de corte), no perseguir el punto actual
  if(typeof ballVelocity !== 'undefined' && (!ballOwner || ballHomingTarget)){
    const lead = ballHomingTarget ? 0.45 : 0.3;   // si es un pase guiado, anticipar más
    m._aiTarget.x += ballVelocity.x * lead;
    m._aiTarget.z += ballVelocity.z * lead;
  }
  clampField(m._aiTarget);
  const reached = moveNPCTowards(m, m._aiTarget, 5.0, dt);
  playerSetAnim(m, reached ? 'idle' : 'run', 1.2);
}

function aiSupport(m, team, bestSpot, attackGoal, opponents, dt){
  if(!m._aiTarget) m._aiTarget = new THREE.Vector3();
  let tgt;
  if(bestSpot){ tgt = bestSpot.clone(); }
  else {
    const side = (m._sideSign || (m._sideSign = (Math.random() < 0.5 ? -1 : 1)));
    tgt = attackGoal.clone();
    if(fieldSide) tgt.addScaledVector(fieldSide, side * 7);
    if(fieldFwd) tgt.addScaledVector(fieldFwd, -5);
  }
  applySeparation(m, team, tgt);
  clampField(tgt);
  const reached = moveNPCTowards(m, tgt, 4.4, dt);
  playerSetAnim(m, reached ? 'idle' : 'run', 1.1);
}

function aiDefend(m, team, ball, defendGoal, opponents, idx, dt){
  const t = 0.45 + (idx % 3) * 0.12;
  const cover = _v(ball.x + (defendGoal.x - ball.x) * t, ball.z + (defendGoal.z - ball.z) * t);
  if(idx === 0){
    let mark = null, md = 1e9;
    for(const o of opponents){
      if(!o || !o.root || o.isKeeper) continue;
      const d = _dist(o.root.position, defendGoal);
      if(d < md){ md = d; mark = o; }
    }
    if(mark){
      cover.set(mark.root.position.x + (defendGoal.x - mark.root.position.x) * 0.25, 0,
                mark.root.position.z + (defendGoal.z - mark.root.position.z) * 0.25);
    }
  }
  applySeparation(m, team, cover);
  clampField(cover);
  const reached = moveNPCTowards(m, cover, 4.6, dt);
  playerSetAnim(m, reached ? 'idle' : 'run', 1.1);
}

function applySeparation(m, team, tgt){
  const mates = (team === 'us') ? [player, ...teammates] : rivals;
  const myIdx = mates.indexOf(m);
  for(let oi = 0; oi < mates.length; oi++){
    const o = mates[oi];
    if(!o || o === m || !o.root) continue;
    const d = _dist(m.root.position, o.root.position);
    if(d < 2.6 && d > 0.01){
      // SOLO el de mayor índice cede el paso (rompe la simetría que hacía vibrar a ambos)
      if(myIdx < oi) continue;
      const ax = (m.root.position.x - o.root.position.x) / d;
      const az = (m.root.position.z - o.root.position.z) / d;
      tgt.x += ax * (2.6 - d) * 0.7; tgt.z += az * (2.6 - d) * 0.7;
    }
  }
}

function updateBallCarrierAI(dt){
  if(matchOver || freeKickPause > 0) return;
  const c = ballOwner;
  if(!c || !c.root || c === player || c.isKeeper) return;  // al jugador lo controlás vos

  c.kickCooldown = Math.max(0, (c.kickCooldown || 0) - dt);

  // Arco que ataca este NPC: 'us' (jugador+compañeros) ataca theirGoalPos; rivales atacan ourGoalPos
  const attackGoal = (c.team === 'us') ? theirGoalPos : ourGoalPos;
  if(!attackGoal) return;
  const distGoal = c.root.position.distanceTo(attackGoal);

  // ¿Acorralado? oponente cerca
  const opponents = (c.team === 'us') ? rivals : [player, ...teammates];
  let nearestOpp = 1e9;
  for(const o of opponents){
    if(o && o.root){ const d = o.root.position.distanceTo(c.root.position); if(d < nearestOpp) nearestOpp = d; }
  }
  const isRival = (c.team === 'them');
  const pressured = nearestOpp < (isRival ? 2.7 : 2.2);

  // DISPARO al arco: el rival busca el gol apenas tiene una ventana
  const shootNear = isRival ? 8.5 : 9;
  const shootPressured = isRival ? 10 : 14;
  if(c.kickCooldown <= 0 && (distGoal < shootNear || (pressured && distGoal < shootPressured))){
    npcKick(c, isRival ? 11 : 14);
    c.kickCooldown = isRival ? 1.6 : 1.3;
    return;
  }

  const mates = (c.team === 'us') ? [player, ...teammates] : rivals;
  c._fwdPassCD = Math.max(0, (c._fwdPassCD || 0) - dt);

  // PASE AL JUGADOR: si un compañero (us) tiene la pelota y VOS estás libre, a veces te la pasa.
  if(c.team === 'us' && player && player.root && c.kickCooldown <= 0 && c._fwdPassCD <= 0){
    const dToYou = player.root.position.distanceTo(c.root.position);
    let youCovered = false;
    for(const o of rivals){ if(o && o.root && o.root.position.distanceTo(player.root.position) < 2.0){ youCovered = true; break; } }
    if(dToYou > 4 && dToYou < 22 && !youCovered && Math.random() < 0.04){   // chance por frame
      npcPassTo(c, player); c.kickCooldown = 0.9; c._fwdPassCD = 1.5;
      passReceiver = player; passInFlight = true; passTimer = 0;
      return;
    }
  }

  // PASE DE PROGRESIÓN: si un compañero LIBRE está más cerca del arco, se la das para avanzar (combinan)
  if(c.kickCooldown <= 0 && c._fwdPassCD <= 0){
    let best = null, bestGain = isRival ? 1.4 : 3;
    for(const m of mates){
      if(!m || m === c || !m.root || m.isKeeper) continue;
      const d = m.root.position.distanceTo(c.root.position);
      if(d < 4 || d > 24) continue;
      const gain = distGoal - m.root.position.distanceTo(attackGoal);   // cuánto más cerca del arco queda
      let covered = false;
      for(const o of opponents){ if(o && o.root && o.root.position.distanceTo(m.root.position) < 1.8){ covered = true; break; } }
      if(!covered && gain > bestGain){ bestGain = gain; best = m; }
    }
    if(best){ npcPassTo(c, best); c.kickCooldown = isRival ? 0.7 : 0.9; c._fwdPassCD = 1.2; return; }
  }

  // PASE de emergencia si lo acorralan
  if(pressured && c.kickCooldown <= 0){
    const minD = isRival ? 1.6 : 2;
    let best = null, bestD = 1e9;
    for(const m of mates){
      if(!m || m === c || !m.root || m.isKeeper) continue;
      const d = m.root.position.distanceTo(c.root.position);
      if(d > minD && d < bestD){ bestD = d; best = m; }
    }
    if(best){ npcPassTo(c, best); c.kickCooldown = isRival ? 0.8 : 1.0; return; }
  }

  // GAMBETA: avanzar con la pelota hacia el arco (el rival empuja más)
  const tgt = new THREE.Vector3(attackGoal.x, 0, attackGoal.z);
  clampField(tgt);
  moveNPCTowards(c, tgt, isRival ? 4.1 : 4.2, dt);
  playerSetAnim(c, 'run', isRival ? 1.15 : 1.15);
}

// Clampea un target a los límites de la cancha
function clampField(v){
  if(!fieldLimits) return v;
  const m = 1.0;
  v.x = Math.max(fieldLimits.minX + m, Math.min(fieldLimits.maxX - m, v.x));
  v.z = Math.max(fieldLimits.minZ + m, Math.min(fieldLimits.maxZ - m, v.z));
  return v;
}

// --- COMPAÑEROS: te dan soporte siguiéndote (defensa y ataque) ---
function updateTeammateSupport(dt){
  if(fieldTut) return;
  if(matchOver || freeKickPause > 0 || !player) return;
  const ballPos = ballModel ? ballModel.position : player.root.position;
  const rivalHasBall = !!(ballOwner && ballOwner.team === 'them');
  const ballLoose = !ballOwner && !!ballModel;

  // Presionan al rival con la pelota en CUALQUIER zona (para robar y atacar ellos mismos).
  const ballNearOurGoal = true;
  const chasers = new Set();
  if(ballLoose){
    // pelota suelta: el más cercano la va a buscar (en cualquier lado)
    const order = teammates.filter(t => t.root && ballOwner !== t)
      .map(t => ({ t, d: t.root.position.distanceTo(ballPos) })).sort((a, b) => a.d - b.d);
    if(order.length) chasers.add(order[0].t);
  } else if(rivalHasBall){
    // rival con pelota: el/los compañeros más cercanos van a robar, donde sea
    const order = teammates.filter(t => t.root && ballOwner !== t)
      .map(t => ({ t, d: t.root.position.distanceTo(ballPos) })).sort((a, b) => a.d - b.d);
    for(let k = 0; k < Math.min(2, order.length); k++) chasers.add(order[k].t);
  }

  for(let i = 0; i < teammates.length; i++){
    const tm = teammates[i];
    if(!tm.root) continue;
    if(ballOwner === tm) continue;  // si la tiene, la maneja updateBallCarrierAI
    if(!tm._aiTarget) tm._aiTarget = new THREE.Vector3();

    // Los compañeros NUNCA le sacan la pelota al rival: solo se acercan a presionar.
    // El robo es exclusivo del JUGADOR (lo hacés vos).
    tm._stealThink = null;

    if(chasers.has(tm)){
      // PRESIÓN: se acerca un poco pero se queda a ~1.0 m (NO roba); si está suelta, sí va a buscarla
      tm._aiTarget.set(ballPos.x, 0, ballPos.z);
      clampField(tm._aiTarget);
      const dToBall = tm.root.position.distanceTo(tm._aiTarget);
      if(ballLoose || dToBall > 1.0){
        moveNPCTowards(tm, tm._aiTarget, ballLoose ? 5.2 : 4.4, dt);
        playerSetAnim(tm, 'run', 1.15);
      } else {
        playerSetAnim(tm, 'idle');   // a distancia de presión, acompaña sin robar
      }
      continue;
    }

    // SOPORTE: flanco al lado del jugador, un poco adelante (hacia el arco rival).
    // Como sigue al jugador, retrocede en defensa y avanza en ataque automáticamente.
    const sideSign = (i === 0) ? -1 : 1;
    tm._aiTarget.copy(player.root.position)
      .addScaledVector(fieldSide, sideSign * 4.0)
      .addScaledVector(fieldFwd, 2.5);
    clampField(tm._aiTarget);

    const dist = tm.root.position.distanceTo(tm._aiTarget);
    if(dist > 1.0){
      const spd = dist > 6 ? 5.0 : 3.2;
      moveNPCTowards(tm, tm._aiTarget, spd, dt);
      playerSetAnim(tm, dist > 6 ? 'run' : 'walk', dist > 6 ? 1.1 : 1.0);
    } else {
      playerSetAnim(tm, 'idle');
    }
  }
}

// --- RIVALES: se mueven aleatorio, pero defienden su arco si te acercás ---
let playerStealCD = 0;
// ROBO EXCLUSIVO DEL JUGADOR: solo vos podés sacarle la pelota al rival (al contacto)
function updatePlayerSteal(dt){
  playerStealCD = Math.max(0, playerStealCD - dt);
  if(!player || !player.root || !ballModel || playerStealCD > 0) return;
  if(ballOwner && ballOwner.team === 'them' && !ballOwner.isKeeper){
    const d = player.root.position.distanceTo(ballOwner.root.position);
    if(d < 0.95){
      // SLIDE TACKLE si venías esprintando; si no, robo normal
      const sliding = buttons && buttons.sprint && player.actions && player.actions.slide;
      ballOwner = player; lastTouchTeam = 'us'; ballVelocity.set(0, 0, 0);
      playerSetAnim(player, sliding ? 'slide' : 'idle', sliding ? 1.2 : 1.0);
      stealGrace = 1.0;       // breve gracia: el rival no te la roba al instante
      playerStealCD = sliding ? 0.9 : 0.6;
    }
  }
}

// ROBO UNIVERSAL AL CONTACTO: si alguien de un equipo pasa muy cerca del que tiene la
// pelota (de otro equipo), se la quita. Cubre rival↔vos, NPC↔NPC, vos↔rival, etc.
let _universalStealCD = 0;
function updateUniversalSteal(dt){
  _universalStealCD = Math.max(0, _universalStealCD - dt);
  if(matchOver || fieldTut || setPiece || kickoffActive || celebrating || freeKickPause > 0) return;
  if(!ballOwner || ballOwner.isKeeper) return;       // arqueros no se roban así
  if(_universalStealCD > 0) return;
  const carrier = ballOwner;
  if(!carrier.root) return;
  const STEAL_DIST = 1.05;                            // pasar "por encima"
  // candidatos: todos los jugadores del equipo CONTRARIO al portador
  const everyone = [player, ...teammates, ...rivals];
  let robber = null, best = STEAL_DIST;
  for(const e of everyone){
    if(!e || !e.root || e === carrier) continue;
    if(e.team === carrier.team) continue;            // solo rivales del portador roban
    if(e.isKeeper) continue;
    const d = e.root.position.distanceTo(carrier.root.position);
    if(d < best){ best = d; robber = e; }
  }
  if(robber){
    ballOwner = robber;
    lastTouchTeam = robber.team;
    if(typeof ballVelocity !== 'undefined') ballVelocity.set(0,0,0);
    ballHomingTarget = null;
    playerSetAnim(robber, 'idle');
    _universalStealCD = 0.5;                          // evita rebote instantáneo
    stealGrace = 0.6;
  }
}
function updateRivalDefense(dt){
  if(fieldTut) return;
  if(matchOver || freeKickPause > 0 || !theirGoalPos || !player) return;
  stealGrace = Math.max(0, stealGrace - dt);
  const ballPos = ballModel ? ballModel.position : player.root.position;
  const weHaveBall = !!(ballOwner && ballOwner.team === 'us');   // jugador o compañero la tiene
  const ourKeeperHasBall = !!(ballOwner && ballOwner.isKeeper && ballOwner.team === 'us');  // tu arquero la tiene
  const ballLoose = !ballOwner && !!ballModel;
  const goalSpan = ourGoalPos ? theirGoalPos.distanceTo(ourGoalPos) : 24;
  // ¿Estás cerca de SU zona? recién ahí presionan para robar; si no, defienden parados.
  const playerNearZone = player.root.position.distanceTo(theirGoalPos) < 17;

  const chasers = new Set();
  if(ballLoose){
    // Pelota suelta: el más cercano va por ella
    const order = rivals.filter(r => r.root).map(r => ({ r, d: r.root.position.distanceTo(ballPos) })).sort((a,b)=>a.d-b.d);
    if(order.length) chasers.add(order[0].r);
  } else if(weHaveBall && !ourKeeperHasBall && stealGrace <= 0){
    // Tenemos la pelota (NO el arquero): los rivales más cercanos presionan en cualquier lado
    const order = rivals.filter(r => r.root && ballOwner !== r).map(r => ({ r, d: r.root.position.distanceTo(ballPos) })).sort((a,b)=>a.d-b.d);
    if(order.length) chasers.add(order[0].r);
    if(order.length > 1 && order[1].d < 7) chasers.add(order[1].r);
  }

  for(let i = 0; i < rivals.length; i++){
    const r = rivals[i];
    if(!r.root) continue;
    if(ballOwner === r) continue;  // si la tiene, la maneja updateBallCarrierAI
    if(!r._aiTarget) r._aiTarget = new THREE.Vector3();
    if(r._aiTimer === undefined) r._aiTimer = 0;
    r._aiTimer -= dt;

    // TU ARQUERO TIENE LA PELOTA: todos los rivales SALEN CORRIENDO a su zona (no presionan, no autogol)
    if(ourKeeperHasBall && ourGoalPos){
      const away = new THREE.Vector3().subVectors(getFieldCenter(), ourGoalPos); away.y = 0;
      if(away.lengthSq() < 0.001) away.set(1, 0, 0); else away.normalize();
      r._aiTarget.copy(ourGoalPos).addScaledVector(away, 17 + (i % 2) * 4).addScaledVector(fieldSide, (i - 1) * 5);
      clampField(r._aiTarget);
      const reached = moveNPCTowards(r, r._aiTarget, 5.2, dt);
      playerSetAnim(r, reached ? 'idle' : 'run', 1.2);
      r._stealThink = null;
      continue;
    }

    // ROBO: cuando el rival te ALCANZA de verdad (contacto), te saca la pelota. No mágico desde lejos:
    // tiene que estar encima ~0.35s. Si te le escapás (sprint), no puede.
    if(weHaveBall && !ourKeeperHasBall && ballModel && stealGrace <= 0){
      const dBall = Math.hypot(r.root.position.x - ballModel.position.x,
                               r.root.position.z - ballModel.position.z);
      if(dBall < 0.55){
        // SE TE PASÓ POR LA PELOTA: si el rival la pisa/cruza, te la saca al instante
        ballOwner = r; lastTouchTeam = "them";
        ballVelocity.set(0, 0, 0); r._stealThink = 0.5;
        playerStealCD = 1.3;   // no se la podés robar de vuelta al instante: el rival la juega
        console.log('[ball] robada por rival (se cruzó por la pelota)');
        continue;
      } else if(dBall < 0.95){
        r._stealThink = (r._stealThink == null ? 0.35 : r._stealThink) - dt;
        if(r._stealThink <= 0){
          ballOwner = r; lastTouchTeam = "them";
          ballVelocity.set(0, 0, 0);
          r._stealThink = 0.5;
          playerStealCD = 1.3;   // gracia: el rival se la lleva, no rebota al toque
          console.log('[ball] robada por rival (te alcanzó)');
          continue;
        }
      } else {
        r._stealThink = 0.35;   // se reinicia el "amague" si te alejás
      }
    } else {
      r._stealThink = null;
    }

    if(chasers.has(r)){
      // PERSEGUIR al que tiene la pelota para sacársela (un toque más rápido que tu carrera)
      r._aiTarget.set(ballPos.x, 0, ballPos.z);
      clampField(r._aiTarget);
      moveNPCTowards(r, r._aiTarget, 4.7, dt);
      playerSetAnim(r, 'run', 1.2);
    } else if(i === 0 && stealGrace <= 0){
      // DELANTERO RIVAL: se queda adelantado en tu mitad, listo para atacar/contraatacar
      const toOur = new THREE.Vector3().subVectors(ourGoalPos, getFieldCenter()); toOur.y = 0;
      if(toOur.lengthSq() < 0.001) toOur.set(1, 0, 0); else toOur.normalize();
      r._aiTarget.copy(getFieldCenter())
        .addScaledVector(toOur, goalSpan * 0.24)
        .addScaledVector(fieldSide, Math.sin(performance.now() * 0.0006) * 5);
      clampField(r._aiTarget);
      const reached = moveNPCTowards(r, r._aiTarget, 3.3, dt);
      playerSetAnim(r, reached ? 'idle' : 'run', 1.05);
    } else if(player.root.position.distanceTo(theirGoalPos) < 13 || weHaveBall){
      // DEFENSA: en frente de SU arco, entre la pelota y el arco
      const rel = new THREE.Vector3().subVectors(ballPos, theirGoalPos);
      let depth = -rel.dot(fieldFwd);
      depth = Math.max(3, Math.min(goalSpan * 0.5, depth - 2));
      const sideOff = rel.dot(fieldSide) + (i - 1) * 2.4;
      r._aiTarget.copy(theirGoalPos)
        .addScaledVector(fieldFwd, -depth)
        .addScaledVector(fieldSide, sideOff);
      clampField(r._aiTarget);
      const reached = moveNPCTowards(r, r._aiTarget, 3.6, dt);
      playerSetAnim(r, reached ? 'idle' : 'run', 1.1);
    } else {
      // ALEATORIO pero SIEMPRE delante de su arco (en su mitad), nunca detrás
      if(r._aiTimer <= 0){
        r._aiTimer = 2 + Math.random() * 2.5;
        const depth = 3 + Math.random() * (goalSpan * 0.4);
        const sideOff = (Math.random() - 0.5) * 12;
        r._aiTarget.copy(theirGoalPos)
          .addScaledVector(fieldFwd, -depth)
          .addScaledVector(fieldSide, sideOff);
        clampField(r._aiTarget);
      }
      const reached = moveNPCTowards(r, r._aiTarget, 2.6, dt);
      playerSetAnim(r, reached ? 'idle' : 'walk', 1.0);
    }
  }
}

// === LOOP ===
const _moveDir = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
let _camFocusX, _camFocusZ;   // foco suavizado de la cámara broadcast
let _chargeCamActive = false; // cámara cinemática de chanfle activa
const _camOffset = new THREE.Vector3();
const _camDesiredPos = new THREE.Vector3();
const _ballSpin = new THREE.Vector3();
let kickCooldown = 0;
let isKicking = false;

// ===== POST-FX: outline estilo anime (edge detection por profundidad) + bloom neón =====
let composer = null, _depthRT = null, _outlinePass = null, _bloomPass = null, _fxEnabled = true, _fxLowCount = 0;
function setupPostFX(){
  try{
    const W = LW(), H = LH();
    _depthRT = new THREE.WebGLRenderTarget(W, H);
    _depthRT.depthTexture = new THREE.DepthTexture(W, H);
    _depthRT.depthTexture.type = THREE.UnsignedShortType;

    composer = new EffectComposer(renderer);
    composer.setSize(W, H);
    composer.setPixelRatio(Math.min(devicePixelRatio, 2));
    composer.addPass(new RenderPass(scene, camera));

    // (outline anime removido — dejaba líneas gruesas sobre el piso)

    // bloom neón ÚNICO y sutil (strength 0.28)
    _bloomPass = new UnrealBloomPass(new THREE.Vector2(W, H), 0.28, 0.55, 0.9);
    composer.addPass(_bloomPass);
  }catch(e){ composer = null; _fxEnabled = false; console.warn('PostFX off:', e); }
}
function resizePostFX(){
  if(!composer) return;
  const W = LW(), H = LH();
  composer.setSize(W, H);
  if(_depthRT) _depthRT.setSize(W, H);
  if(_outlinePass) _outlinePass.uniforms.resolution.value.set(W, H);
  if(_bloomPass) _bloomPass.setSize(W, H);
}
function animate(){
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());
  const sdt = dt * slowmo;   // tiempo escalado (cámara lenta en el festejo)
  // === RED: enviar inputs al server (la sincronización visual la hace netUpdate) ===
  if(window.NET && window.NET.active){
    try{ netSendInput(dt); }catch(e){}
  }
  // medidor de carga PATEAR/PASE (mantener apretado)
  if(charging){ chargeT += dt; const _ce = document.getElementById(charging);
    if(_ce && _ce._ring){ const c = Math.min(1, chargeT / CHARGE_FULL);
      _ce._ring.style.background = 'conic-gradient(#fff8d0 ' + (c*360) + 'deg, rgba(255,255,255,.14) 0deg)'; }
    // "ding" una sola vez al llegar al tope de carga
    if(chargeT >= CHARGE_FULL && !_chargePinged){ _chargePinged = true; try{ sfxChargeReady(); }catch(e){} }
    // CHANFLE: si está cargando el PATEAR, el joystick izq/der define hacia dónde curva
    if(charging === 'btnKick'){
      const jvx = joystickState.vx || 0;
      // lateral del joystick en mundo respecto a la cámara
      const cy = Math.cos(cameraOrbit.yaw), sy = Math.sin(cameraOrbit.yaw);
      const jvy = joystickState.vy || 0;
      const jwx = jvx * cy + jvy * sy;
      // signo del componente horizontal → dirección del chanfle (suavizado)
      const targetSpin = Math.max(-1, Math.min(1, jwx * 1.4));
      window._chargeSpin = (window._chargeSpin||0) * 0.7 + targetSpin * 0.3;
    } } else { _chargePinged = false; }

  // contador de FPS + draw calls + triángulos (debug)
  _fpsFrames++; _fpsAccum += dt;
  if(_fpsAccum >= 0.5){
    const fps = Math.round(_fpsFrames / _fpsAccum);
    const el = document.getElementById('fps');
    if(el && renderer){
      const info = renderer.info.render;
      el.textContent = fps + ' fps · ' + info.calls + ' calls · ' + Math.round(info.triangles / 1000) + 'k tris';
    }
    // si el postFX hace caer el FPS por debajo de ~38 sostenido, lo apaga solo
    if(_fxEnabled && composer){
      if(fps < 38){ _fxLowCount = (_fxLowCount||0) + 1; } else { _fxLowCount = 0; }
      if(_fxLowCount >= 4){ _fxEnabled = false; console.warn('PostFX auto-off (fps bajo)'); }
    }
    _fpsFrames = 0; _fpsAccum = 0;
  }
  
  if(player && matchOver && matchEndCine){
    updateEndCine(dt);
  } else if(window.NET && window.NET.active){
    // ===== MODO RED: todo lo dibuja el server =====
    netUpdate(dt);
    updateCamera(dt);
  } else if(player && !matchOver){
    if(celebrating){
      updateCelebration(dt);     // la explosión corre en tiempo real (se ve lenta igual)
    } else if(halftimeActive){
      updateHalftime(dt);        // cinemática de entretiempo (corte + cambio de lado + saque central)
    } else if(cinematicActive){
      updateCinematic(dt);
    } else if(tutorialActive){
      updateCamera(dt);   // mantené la cámara viva, pero congelá el juego
    } else if(kickoffActive){
      updateCamera(dt);
      updateBallPossession(dt);   // la pelota queda pegada al jugador
      freezeFormationIdle();
    } else if(setPiece){
      if(setPiece.team === 'us' && setPiece.aim){
        // APUNTAR: cámara cerca; en saque de arco te movés izq-der, en lateral/esquina quieto
        updateCamera(dt);
        if(setPiece.type === 'goalkick') aimLateralMove(dt);
        else playerSetAnim(player, 'idle');
        updateBallPossession(dt);
        setPieceJockey(dt);
      } else if(setPiece.type === 'goalkick'){
        setPieceJockey(dt);         // saque de arco rival
        updateCamera(dt);
        updateBallPossession(dt);
        updateSetPiece(dt);
      } else {
        // saque rival (lateral / esquina): la IA piensa y pasa
        updateCamera(dt);
        updateBallPossession(dt);
        updateSetPiece(dt);
        setPieceJockey(dt);
      }
    } else {
      if(freeKickPause > 0) freezeFormationIdle();   // tiro libre: todos quietos
      updatePlayerMovement(dt);
      updateAimLine();
      updateCamera(dt);
      updateBall(dt);
      updateNPCCooldowns(dt);
      updateBallPickup(dt);
      updatePlayerSteal(dt);   // solo el jugador puede robar (al contacto)
      updateUniversalSteal(dt); // robo al contacto entre cualquiera
      // CAMBIO SUAVE AUTOMÁTICO: si un compañero tiene la pelota, paso a controlarlo
      // (con transición suave camSwitchT, sin corte de escena).
      if(ballOwner && ballOwner.team === 'us' && ballOwner !== player && !ballOwner.isKeeper){
        if(passInFlight && passOffside && ballOwner === passReceiver){
          flagOffside(ballOwner.root.position.clone());   // pase en offside → tiro libre rival
          passInFlight = false; passOffside = false;
        } else {
          passInFlight = false;   // el pase llegó
          switchControlTo(ballOwner);   // cambio suave al que tiene la pelota
        }
      }
      // PASE en vuelo interceptado por rival: paso a controlar al compañero que iba a recibir
      if(passInFlight){
        passTimer += dt;
        if(ballOwner && ballOwner.team === 'them'){
          if(passReceiver && passReceiver.team === 'us' && !passReceiver.isKeeper && passReceiver !== player){
            switchControlTo(passReceiver);
          }
          passInFlight = false;
        }
        else if(passTimer > 3){ passInFlight = false; }
      }
      // CAMBIO SUAVE POR DISTANCIA: si la pelota se aleja demasiado de mi jugador y un
      // compañero está más cerca, paso a controlarlo (transición suave). Como la cámara
      // sigue la pelota, el cambio no se nota brusco. Con cooldown para no oscilar.
      _autoSwitchCD = Math.max(0, (_autoSwitchCD || 0) - dt);
      if(_autoSwitchCD <= 0 && player && player.root && ballModel && !passInFlight
         && ballOwner !== player && !setPiece && !kickoffActive){
        const myDist = player.root.position.distanceTo(ballModel.position);
        if(myDist > 9){   // la pelota se alejó bastante de mí
          let best = null, bd = myDist - 2;   // el compa tiene que estar claramente más cerca
          for(const tm of teammates){
            if(!tm || !tm.root || tm.isKeeper) continue;
            const d = tm.root.position.distanceTo(ballModel.position);
            if(d < bd){ bd = d; best = tm; }
          }
          if(best){ switchControlTo(best); _autoSwitchCD = 1.2; }
        }
      }
      updateTeamAI(dt);          // ← SISTEMA BUCKLAND (roles, soporte, FSM de equipo)
      updateSetPieceWalk(dt);    // jugadores con retroceso pendiente caminan (tras atajada)
      updateBallPossession(dt);
      updateGoals(dt);
      updateGoalkeepers(dt);
      updateFreeKick(dt);
      updateMatchClock(dt);
      if(fieldTut){ fieldTutTick(dt); tickCoach(dt); }
    }
  }
  
  // Simulación de redes de arcos
  updateNets(dt);
  
  // Mixer aplica las animaciones (en cámara lenta durante el festejo)
  if(player && player.mixer) player.mixer.update(sdt);
  // Pose de "lanzamiento con manos" (se aplica DESPUÉS del mixer para que se vea)
  if(player && player._throwT > 0){ player._throwT -= dt; applyThrowPose(player); }
  
  // Compañeros
  for(const tm of teammates){
    if(tm.mixer) tm.mixer.update(sdt);
  }
  // Rivales
  for(const r of rivals){
    if(r.mixer) r.mixer.update(sdt);
  }
  // Porteros
  for(const gk of goalkeepers){
    if(gk.mixer) gk.mixer.update(dt);
  }
  
  // Flecha roja sobre el jugador controlado
  if(player && player.root){
    if(!controlArrow){
      const cg = new THREE.ConeGeometry(0.32, 0.55, 4);
      cg.rotateX(Math.PI);   // punta hacia abajo
      controlArrow = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ color: 0xff2222 }));
      controlArrow.renderOrder = 999;
      scene.add(controlArrow);
    }
    const pp = player.root.position;
    controlArrow.visible = true;
    controlArrow.position.set(pp.x, fieldGroundY + 2.7 + Math.sin(performance.now() * 0.005) * 0.12, pp.z);
    controlArrow.rotation.y += dt * 2.5;
  } else if(controlArrow){
    controlArrow.visible = false;
  }

  // No renderizar el estadio si no hay partido activo (el menú lo tapa) → ahorro grande
  if(player){
    if(devMode) updateDevCamera();   // cámara libre cuando el editor DEV está activo
    // Sombras throttleadas en calidad media (se actualizan 1 de cada 3 frames)
    if(renderer.shadowMap.enabled && !renderer.shadowMap.autoUpdate){
      shadowTick = (shadowTick + 1) % 3;
      renderer.shadowMap.needsUpdate = (shadowTick === 0);
    }
    if(composer && _fxEnabled){
      // 1) pasada a depth RT (captura profundidad para el outline)
      renderer.setRenderTarget(_depthRT);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      // 2) composer: escena + outline anime + bloom neón
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }
}

// ===== LÍNEA GUÍA DEL CHANFLE (curva hacia donde irá el tiro) =====
let _aimLine = null, _aimDots = null;
function ensureAimLine(){
  if(_aimLine) return;
  const N = 24;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N*3), 3));
  const mat = new THREE.LineBasicMaterial({ color:0xffd24a, transparent:true, opacity:0.9, depthTest:false });
  _aimLine = new THREE.Line(geo, mat);
  _aimLine.renderOrder = 999; _aimLine.visible = false; _aimLine.frustumCulled = false;
  _aimLine._N = N;
  scene.add(_aimLine);
  // punta (esfera) que marca el destino
  const dotGeo = new THREE.SphereGeometry(0.32, 12, 12);
  const dotMat = new THREE.MeshBasicMaterial({ color:0xffa030, transparent:true, opacity:0.95, depthTest:false });
  _aimDots = new THREE.Mesh(dotGeo, dotMat); _aimDots.renderOrder = 1000; _aimDots.visible = false; _aimDots.frustumCulled = false;
  scene.add(_aimDots);
}
// Cancela el estado de carga del chanfle (por ejemplo si te roban la pelota mientras cargás)
function cancelCharge(){
  if(!charging) return;
  const el = document.getElementById(charging);
  if(el){ el.classList.remove('charging'); if(el._ring) el._ring.style.background = 'transparent'; }
  charging = null; chargeT = 0; window._chargeSpin = 0; _chargePinged = false;
  if(_aimLine) _aimLine.visible = false;
  if(_aimDots) _aimDots.visible = false;
}
function updateAimLine(){
  // Si estabas cargando el tiro y perdiste la pelota → cancelar (evita carga colgada y línea fantasma)
  if(charging === 'btnKick' && ballOwner !== player){ cancelCharge(); }
  // mostrar solo si estás cargando PATEAR MÁS DE 0.3s y tenés la pelota
  const active = (charging === 'btnKick' && chargeT > 0.3 && ballOwner === player && player && player.root);
  ensureAimLine();
  if(!active){ if(_aimLine) _aimLine.visible=false; if(_aimDots) _aimDots.visible=false; return; }
  const N = _aimLine._N;
  // dirección hacia donde mira el jugador
  const a = player.root.rotation.y;
  const dirX = -Math.sin(a), dirZ = -Math.cos(a);
  // perpendicular (lado) para curvar
  const perpX = -dirZ, perpZ = dirX;
  const spin = Math.max(-1, Math.min(1, window._chargeSpin || 0));
  const start = player.root.position;
  const len = 12;                  // largo de la guía
  const curve = spin * 4.5;        // cuánto se desvía al final
  const pos = _aimLine.geometry.attributes.position.array;
  let endX=0, endZ=0, endY=0;
  for(let i=0;i<N;i++){
    const t = i/(N-1);
    // avance recto + desvío lateral creciente (curva tipo parábola lateral)
    const lateral = curve * t * t;
    const px = start.x + dirX*len*t + perpX*lateral;
    const pz = start.z + dirZ*len*t + perpZ*lateral;
    const py = fieldGroundY + 0.15 + Math.sin(t*Math.PI)*1.2;  // leve arco vertical
    pos[i*3]=px; pos[i*3+1]=py; pos[i*3+2]=pz;
    endX=px; endY=py; endZ=pz;
  }
  _aimLine.geometry.attributes.position.needsUpdate = true;
  _aimLine.visible = true;
  // color según lado del chanfle
  _aimLine.material.color.setHex(Math.abs(spin)<0.1 ? 0xffd24a : (spin<0 ? 0x4ab8ff : 0xff7a3a));
  _aimDots.position.set(endX, endY, endZ); _aimDots.visible = true;
  _aimDots.material.color.copy(_aimLine.material.color);
}
function updatePlayerMovement(dt){
  if(!player) return;
  // En modo red, el server manda la posición del jugador (no la física local)
  if(window.NET && window.NET.active) return;

  // Congelar al jugador durante la pausa de tiro libre (o fin de partido)
  if(freeKickPause > 0 || matchOver){
    playerSetAnim(player, 'idle');
    return;
  }

  // === JOYSTICK EN SAQUES AUTOMÁTICOS DEL RIVAL ===
  // Solo se bloquea el joystick si el jugador está en una CORRIDA AUTOMÁTICA obligada
  // (retroceso fuera del área en saques). Si no, te podés mover libremente aunque el
  // rival esté sacando — no más quedarte clavado con el joystick muerto.
  const autoRunning = !!player._walkTo;   // el jugador está caminando solo a su posición
  if(autoRunning){
    // la corrida automática (updateSetPieceWalk / setPieceJockey) lo mueve;
    // acá solo evitamos que el input del joystick interfiera.
    return;
  }

  // === MODO TIRO (cargando PATEAR): el joystick NO mueve, solo apunta el chanfle ===
  if(charging === 'btnKick'){
    if(ballOwner !== player){ cancelCharge(); }   // te robaron mientras cargabas → liberar
    else { playerSetAnim(player, 'idle'); return; }
  }
  
  kickCooldown = Math.max(0, kickCooldown - dt);
  
  // Decrementar timers
  speedMultiplierTimer = Math.max(0, speedMultiplierTimer - dt);
  if(speedMultiplierTimer <= 0) speedMultiplier = 1.0;
  
  // Velocidades (ritmo pausado y realista)
  const walkSpeed = 1.5;
  const runSpeed = 2.9;
  const sprintSpeed = 4.4;
  
  const inputMag = Math.hypot(joystickState.vx, joystickState.vy);
  let speed = 0;
  let animName = 'idle';
  let animTimeScale = 0.5;
  
  if(inputMag > 0.1){
    if(buttons.sprint){
      speed = sprintSpeed * inputMag;
      animName = 'sprint';
      animTimeScale = 1.4;
    } else if(inputMag > 0.6){
      speed = runSpeed * inputMag;
      animName = 'run';
      animTimeScale = 1.1;
    } else {
      speed = walkSpeed * inputMag;
      animName = 'walk';
      animTimeScale = 1.0;
    }
    
    // Aplicar speedMultiplier (kick reduce velocidad temporal)
    speed *= speedMultiplier;
    
    // Forward de la cámara desde el yaw orbital
    // Cuando yaw=PI, la cámara está al sur del jugador mirando al norte (forward = +Z)
    // El joystick: vy negativo (arriba) → adelante (alejarse de la cámara)
    // vx positivo (derecha del joystick) → strafe a la derecha de la cámara
    const camForwardX = -Math.sin(cameraOrbit.yaw);
    const camForwardZ = -Math.cos(cameraOrbit.yaw);
    // Right = forward rotado 90° clockwise (visto desde arriba)
    const camRightX = -camForwardZ;
    const camRightZ = camForwardX;
    
    _moveDir.set(
      camForwardX * (-joystickState.vy) + camRightX * joystickState.vx,
      0,
      camForwardZ * (-joystickState.vy) + camRightZ * joystickState.vx
    );
    _moveDir.normalize();
    
    // Rotar el personaje hacia la dirección de movimiento (suave)
    const targetRotation = Math.atan2(_moveDir.x, _moveDir.z) + Math.PI;
    let currentRot = player.root.rotation.y;
    // Diferencia angular wrap
    let diff = targetRotation - currentRot;
    while(diff > Math.PI) diff -= Math.PI*2;
    while(diff < -Math.PI) diff += Math.PI*2;
    const turnSpeed = 10;
    player.root.rotation.y = currentRot + diff * Math.min(1, turnSpeed * dt);
    
    // Mover con colisiones
    const moveX = _moveDir.x * speed * dt;
    const moveZ = _moveDir.z * speed * dt;
    
    // Probar movimiento eje por eje (para deslizar contra obstáculos)
    const newX = player.root.position.x + moveX;
    const newZ = player.root.position.z + moveZ;
    
    if(canMoveTo(newX, player.root.position.z)){
      // Verificar step máximo: no escalar paredes verticales
      const groundHere = getGroundHeight(newX, player.root.position.z);
      const stepDiff = groundHere - player.root.position.y;
      if(stepDiff < 0.6){  // step máximo de 60cm (escalones, rampas)
        player.root.position.x = newX;
      }
    }
    if(canMoveTo(player.root.position.x, newZ)){
      const groundHere = getGroundHeight(player.root.position.x, newZ);
      const stepDiff = groundHere - player.root.position.y;
      if(stepDiff < 0.6){
        player.root.position.z = newZ;
      }
    }
  }
  
  // Ajustar Y del jugador al suelo del estadio (gravedad simple)
  const groundY = getGroundHeight(player.root.position.x, player.root.position.z);
  // Lerp suave hacia la altura del suelo
  const dy = groundY - player.root.position.y;
  if(Math.abs(dy) > 0.01){
    player.root.position.y += dy * Math.min(1, dt * 12);  // bajar/subir rápido pero suave
  } else {
    player.root.position.y = groundY;
  }
  
  // Aplicar animación: si está corriendo kick no cambiar, sino sí
  // Consideramos kick "casi terminado" al 70% del clip (corta el final innecesario)
  const isKickingAnim = player.currentAnim === 'kick' &&
    player.actions.kick && player.actions.kick.isRunning() &&
    player.actions.kick.time < player.actions.kick.getClip().duration * 0.7;
  
  if(!isKickingAnim){
    playerSetAnim(player, animName, animTimeScale);
  }
}

function canMoveTo(x, z){
  const playerRadius = 0.35;
  
  // Colisión contra árboles
  for(const t of trees){
    const dx = x - t.pos.x, dz = z - t.pos.z;
    const totalR = t.radius + playerRadius;
    if(dx*dx + dz*dz < totalR*totalR) return false;
  }
  
  // Límite CUADRADO de la cancha
  if(fieldLimits){
    if(x < fieldLimits.minX || x > fieldLimits.maxX) return false;
    if(z < fieldLimits.minZ || z > fieldLimits.maxZ) return false;
  }
  return true;
}

// Raycaster global para detectar altura del suelo bajo cualquier punto
const _groundRaycaster = new THREE.Raycaster();
let fieldGroundY = 0, fieldGroundReady = false;   // altura fija del césped (plano) - evita raycast por frame
const _rayDown = new THREE.Vector3(0, -1, 0);
const _rayOrigin = new THREE.Vector3();

// Devuelve la Y del primer mesh del estadio justo debajo de (x, z)
// IGNORA hits demasiado altos (gradas, bancos) → solo quiere el suelo real
function getGroundHeight(x, z){
  // La cancha es plana: devolvemos la altura cacheada (sin raycast por frame → muchísima CPU ahorrada)
  if(fieldGroundReady) return fieldGroundY;
  if(courtRaycastMeshes.length === 0) return 0;
  _rayOrigin.set(x, 20, z);
  _groundRaycaster.set(_rayOrigin, _rayDown);
  _groundRaycaster.far = 25;
  const hits = _groundRaycaster.intersectObjects(courtRaycastMeshes, false);
  if(hits.length === 0) return 0;
  let lowest = hits[0].point.y;
  for(const h of hits){ if(h.point.y < lowest) lowest = h.point.y; }
  if(lowest > 1.5) return 0;
  return lowest;
}

// Calcula UNA vez la altura del césped (centro de la cancha) y la cachea
function sampleGroundOnce(){
  fieldGroundY = 0;
  if(fieldLimits && courtRaycastMeshes.length){
    const cx = (fieldLimits.minX + fieldLimits.maxX) / 2;
    const cz = (fieldLimits.minZ + fieldLimits.maxZ) / 2;
    _rayOrigin.set(cx, 20, cz);
    _groundRaycaster.set(_rayOrigin, _rayDown);
    _groundRaycaster.far = 25;
    const hits = _groundRaycaster.intersectObjects(courtRaycastMeshes, false);
    let lowest = null;
    for(const h of hits){ if(lowest === null || h.point.y < lowest) lowest = h.point.y; }
    if(lowest !== null && lowest < 1.5) fieldGroundY = lowest;
  }
  fieldGroundReady = true;
  console.log('[ground] altura fija del césped:', fieldGroundY.toFixed(3));
}

function updateCamera(dt){
  if(!player) return;
  if(camSwitchT > 0) camSwitchT = Math.max(0, camSwitchT - dt);   // transición de cámara

  // === CÁMARA CERCA AL APUNTAR (saques de tu equipo): girás para apuntar ===
  if(setPiece && setPiece.aim && setPiece.team === 'us'){
    const pp = player.root.position;
    const yaw = cameraOrbit.yaw;
    player.root.rotation.y = yaw;   // el jugador mira a donde apuntás
    const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const dist = 5.2, height = 2.7;
    _camDesiredPos.set(pp.x - fwd.x * dist, pp.y + height, pp.z - fwd.z * dist);
    const lf = 1 - Math.pow(0.0025, dt);
    camera.position.lerp(_camDesiredPos, lf);
    _camTarget.set(pp.x + fwd.x * 3.5, pp.y + 1.1, pp.z + fwd.z * 3.5);
    camera.lookAt(_camTarget);
    return;
  }

  // === CÁMARA CINEMÁTICA DE CHANFLE (al mantener KICK con la pelota) ===
  // Tercera persona cercana detrás del jugador. El jugador queda desplazado a la DERECHA
  // del encuadre para que la línea de trayectoria (que sale al frente/izquierda) se luzca.
  if(charging === 'btnKick' && chargeT > 0.3 && ballOwner === player){
    const pp = player.root.position;
    const yaw = player.root.rotation.y;            // hacia donde mira el jugador
    const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const dist = 4.2, height = 2.4, sideShift = 2.0;  // detrás, arriba y corrido al costado
    // cámara detrás-arriba y desplazada a la IZQUIERDA del mundo → el jugador se ve a la derecha
    _camDesiredPos.set(
      pp.x - fwd.x * dist - right.x * sideShift,
      pp.y + height,
      pp.z - fwd.z * dist - right.z * sideShift
    );
    const lf = 1 - Math.pow(0.004, dt);            // acercamiento suave
    camera.position.lerp(_camDesiredPos, lf);
    // mira un poco adelante del jugador (hacia la trayectoria), también corrido
    _camTarget.set(pp.x + fwd.x * 5 - right.x * 1.2, pp.y + 1.0, pp.z + fwd.z * 5 - right.z * 1.2);
    camera.lookAt(_camTarget);
    _chargeCamActive = true;
    return;
  }
  // al soltar el chanfle, marcar transición suave de vuelta
  if(_chargeCamActive){ _chargeCamActive = false; camSwitchT = 0.5; }


  // Elevada y a distancia, orientación fija alineada al eje de la cancha (como TV).
  // El foco es la PELOTA (con un leve sesgo hacia el jugador controlado para no perderlo).
  if(cameraView === 'fifa'){
    const pp = player.root.position;
    const fwd = fieldFwd || new THREE.Vector3(0, 0, -1);
    // orientación FIJA al eje de ataque (no gira con el jugador → estable como broadcast)
    const targetYaw = Math.atan2(-fwd.x, -fwd.z);
    let diff = targetYaw - cameraOrbit.yaw;
    while(diff > Math.PI) diff -= Math.PI * 2;
    while(diff < -Math.PI) diff += Math.PI * 2;
    cameraOrbit.yaw += diff * Math.min(1, 4 * dt);

    const pitch = 0.62, distance = 15.0;   // más alta y lejos: muestra la acción alrededor de la pelota
    // FOCO EN LA PELOTA (sesgo leve al jugador para que siempre se vea a quién controlás)
    let fx, fz;
    if(ballModel){
      const bw = 0.7;   // 70% pelota, 30% jugador
      fx = ballModel.position.x * bw + pp.x * (1 - bw);
      fz = ballModel.position.z * bw + pp.z * (1 - bw);
    } else { fx = pp.x; fz = pp.z; }
    // suavizar el foco para que la cámara no tiemble con la pelota
    if(_camFocusX === undefined){ _camFocusX = fx; _camFocusZ = fz; }
    _camFocusX += (fx - _camFocusX) * Math.min(1, 5 * dt);
    _camFocusZ += (fz - _camFocusZ) * Math.min(1, 5 * dt);

    _camTarget.set(_camFocusX, 0.8, _camFocusZ);
    const sy = Math.sin(cameraOrbit.yaw), cy = Math.cos(cameraOrbit.yaw);
    const hp = Math.cos(pitch) * distance, vp = Math.sin(pitch) * distance;
    _camDesiredPos.set(_camFocusX + sy * hp, 1.0 + vp, _camFocusZ + cy * hp);
    const lf = 1 - Math.pow(camSwitchT > 0 ? 0.2 : 0.004, dt);
    camera.position.lerp(_camDesiredPos, lf);
    camera.lookAt(_camTarget);
    return;
  }

  // Decrementar timer del modo ball
  if(cameraMode === 'ball'){
    cameraBallTimer -= dt;
    if(cameraBallTimer <= 0){
      cameraMode = 'player';
    }
  }
  
  const focusEntity = player;
  const playerPos = focusEntity.root.position;
  
  // ESTILO FIFA: durante el pase la cámara SIGUE LA PELOTA (foco en la pelota en viaje),
  // no en el jugador que pateó. El control pasa al receptor cuando la recibe.
  if(cameraMode === 'ball' && ballModel && passInFlight){
    // foco que sigue la pelota
    _camTarget.set(ballModel.position.x, ballModel.position.y + 1.0, ballModel.position.z);
    // orientar la cámara en el sentido del viaje de la pelota
    const bx = ballModel.position.x - playerPos.x;
    const bz = ballModel.position.z - playerPos.z;
    if(Math.hypot(bx, bz) > 0.3){
      const targetYaw = Math.atan2(-bx, -bz);
      let diff = targetYaw - cameraOrbit.yaw;
      while(diff > Math.PI) diff -= Math.PI * 2;
      while(diff < -Math.PI) diff += Math.PI * 2;
      cameraOrbit.yaw += diff * Math.min(1, 3 * dt);
    }
    // posicionar la cámara detrás de la pelota
    const cosY = Math.cos(cameraOrbit.yaw), sinY = Math.sin(cameraOrbit.yaw);
    const cosP = Math.cos(cameraOrbit.pitch), sinP = Math.sin(cameraOrbit.pitch);
    const hD = cameraOrbit.distance * cosP, vD = cameraOrbit.distance * sinP;
    _camDesiredPos.set(
      _camTarget.x + sinY * hD,
      _camTarget.y + vD,
      _camTarget.z + cosY * hD
    );
    camera.position.lerp(_camDesiredPos, Math.min(1, 6 * dt));
    camera.lookAt(_camTarget);
    return;   // no correr la cámara normal (centrada en el jugador) este frame
  }
  
  // En modo 'ball' sin pase activo (te pasaron la pelota): mantener al JUGADOR centrado
  // pero girar para que la pelota quede a la vista.
  if(cameraMode === 'ball' && ballModel){
    const bx = ballModel.position.x - playerPos.x;
    const bz = ballModel.position.z - playerPos.z;
    if(Math.hypot(bx, bz) > 0.3){
      const targetYaw = Math.atan2(-bx, -bz);  // cámara detrás del jugador mirando hacia la pelota
      let diff = targetYaw - cameraOrbit.yaw;
      while(diff > Math.PI) diff -= Math.PI * 2;
      while(diff < -Math.PI) diff += Math.PI * 2;
      cameraOrbit.yaw += diff * Math.min(1, 4 * dt);  // giro suave
    }
  }
  
  // MODO PLAYER (siempre): cámara orbital centrada en el jugador
  _camTarget.set(playerPos.x, playerPos.y + 1.0, playerPos.z);
  
  const cosYaw = Math.cos(cameraOrbit.yaw);
  const sinYaw = Math.sin(cameraOrbit.yaw);
  const cosPitch = Math.cos(cameraOrbit.pitch);
  const sinPitch = Math.sin(cameraOrbit.pitch);
  
  const horizDist = cameraOrbit.distance * cosPitch;
  const vertDist = cameraOrbit.distance * sinPitch;
  
  _camDesiredPos.set(
    playerPos.x + sinYaw * horizDist,
    playerPos.y + 1.0 + vertDist,
    playerPos.z + cosYaw * horizDist
  );
  
  const lerpFactor = 1 - Math.pow(camSwitchT > 0 ? 0.2 : 0.001, dt);   // más lento al cambiar de cámara
  camera.position.lerp(_camDesiredPos, lerpFactor);
  camera.lookAt(_camTarget);
}

const ballVelocity = new THREE.Vector3();
let ballSpin = 0;   // chanfle: giro lateral que curva la pelota en el aire
function floorYForSpin(p){ return getGroundHeight(p.x, p.z) + 0.095; }
let ballSpinRate = new THREE.Vector3();

function updateBall(dt){
  if(!ballModel) return;
  if(lastKickerTimer > 0){ lastKickerTimer -= dt; if(lastKickerTimer <= 0) lastKicker = null; }
  
  // Física simple de la pelota: gravedad, fricción al rodar
  const ballPos = ballModel.position;
  
  // Aplicar velocidad
  ballPos.x += ballVelocity.x * dt;
  ballPos.y += ballVelocity.y * dt;
  ballPos.z += ballVelocity.z * dt;

  // CHANFLE (efecto Magnus): si la pelota lleva spin lateral y está en el aire,
  // se curva perpendicular a su dirección. ballSpin decae con el tiempo.
  if(typeof ballSpin === 'number' && Math.abs(ballSpin) > 0.01 && !ballOwner){
    const vh = Math.hypot(ballVelocity.x, ballVelocity.z);
    if(vh > 1.5){
      // perpendicular horizontal a la dirección de viaje
      const px = -ballVelocity.z / vh, pz = ballVelocity.x / vh;
      const airborne = (ballPos.y > floorYForSpin(ballPos) + 0.15) ? 1 : 0.35;  // más curva en el aire
      ballVelocity.x += px * ballSpin * airborne * dt;
      ballVelocity.z += pz * ballSpin * airborne * dt;
    }
    ballSpin *= Math.pow(0.55, dt);   // el efecto se va disipando
    if(Math.abs(ballSpin) < 0.05) ballSpin = 0;
  }
  
  // Gravedad
  ballVelocity.y -= 9.8 * dt;
  
  // Suelo: rebote / asentamiento (usa altura real del estadio)
  const ballRadius = 0.095;
  const groundY = getGroundHeight(ballPos.x, ballPos.z);
  const floorY = groundY + ballRadius;
  if(ballPos.y < floorY){
    ballPos.y = floorY;
    if(ballVelocity.y < 0){
      ballVelocity.y = -ballVelocity.y * 0.4;
      if(Math.abs(ballVelocity.y) < 0.5) ballVelocity.y = 0;
    }
    ballVelocity.x *= Math.pow(0.3, dt);
    ballVelocity.z *= Math.pow(0.3, dt);
    if(Math.abs(ballVelocity.x) < 0.05) ballVelocity.x = 0;
    if(Math.abs(ballVelocity.z) < 0.05) ballVelocity.z = 0;
  }

  // PASE GUIADO (NPC/arquero): dirige la pelota al aliado para que SIEMPRE llegue
  if(ballHomingTarget && ballHomingTarget.root && !ballOwner){
    ballHomingTimer -= dt;
    if(ballHomingTimer <= 0){ ballHomingTarget = null; }
    else {
      const dx = ballHomingTarget.root.position.x - ballPos.x;
      const dz = ballHomingTarget.root.position.z - ballPos.z;
      const dist = Math.hypot(dx, dz) || 1;
      const spd = Math.max(6, Math.min(11, dist * 2.2));
      const k = 1 - Math.pow(0.0006, dt);   // redirección fuerte
      ballVelocity.x += (dx / dist * spd - ballVelocity.x) * k;
      ballVelocity.z += (dz / dist * spd - ballVelocity.z) * k;
      if(ballPos.y <= floorY + 0.03 && ballVelocity.y < 0.2) ballVelocity.y = 0;   // rasante
    }
  } else if(ballHomingTarget && ballOwner){ ballHomingTarget = null; }
  
  // Rotación visual (rueda)
  const speed = Math.hypot(ballVelocity.x, ballVelocity.z);
  if(speed > 0.05){
    // Eje de rotación perpendicular al movimiento
    const axis = new THREE.Vector3(ballVelocity.z, 0, -ballVelocity.x).normalize();
    const angSpeed = speed / ballRadius;
    ballModel.rotateOnWorldAxis(axis, angSpeed * dt);
  }
  
  // Límites de la cancha. En los EXTREMOS hay arcos: la pelota solo pasa por la BOCA (gol).
  // Si sale por un lateral → saque lateral. Si sale por el fondo (fuera de la boca) → arco/esquina.
  if(fieldLimits && !fieldTut && !ballOwner && !setPiece && !kickoffActive && !celebrating && !matchOver){
    const mainAxis = fieldAxis || 'x';
    const widthAxis = (mainAxis === 'x') ? 'z' : 'x';
    let inGoalMouth = false;
    for(const g of goalAreas){
      const cW = (widthAxis === 'x') ? g.center.x : g.center.z;
      const halfMouth = (((widthAxis === 'x') ? (g.bbox.max.x - g.bbox.min.x) : (g.bbox.max.z - g.bbox.min.z))) / 2;
      if(Math.abs(ballPos[widthAxis] - cW) <= halfMouth && ballPos.y <= g.bbox.max.y){ inGoalMouth = true; break; }
    }
    const M = 1.3;   // margen amplio: la pelota tiene que salir bastante para cobrar saque (menos interrupciones)
    const wMin = ((widthAxis === 'x') ? fieldLimits.minX : fieldLimits.minZ) - M;
    const wMax = ((widthAxis === 'x') ? fieldLimits.maxX : fieldLimits.maxZ) + M;
    const mMin = ((mainAxis === 'x') ? fieldLimits.minX : fieldLimits.minZ) - M;
    const mMax = ((mainAxis === 'x') ? fieldLimits.maxX : fieldLimits.maxZ) + M;
    const wPos = ballPos[widthAxis], mPos = ballPos[mainAxis];
    if(wPos < wMin || wPos > wMax){
      triggerThrowIn(ballPos.clone());                 // SAQUE LATERAL
    } else if(!inGoalMouth && (mPos < mMin || mPos > mMax)){
      triggerEndLineOut(mPos < mMin, ballPos.clone());  // SAQUE DE ARCO o ESQUINA
    } else if(mPos < mMin - 2.2 || mPos > mMax + 2.2){
      // Pasó por la boca del arco pero NO fue gol (tiro alto/al palo/desviado):
      // no la dejamos volar infinito → frenamos y cobramos saque de arco / esquina.
      ballVelocity.set(0, 0, 0);
      triggerEndLineOut(mPos < mMin, ballPos.clone());
    }
  }

  // CLAMP DURO: la pelota NUNCA puede salirse físicamente de la cancha.
  // Aplica SIEMPRE (también en el tutorial, saques, etc). Si toca un borde, rebota suave
  // hacia adentro. En el eje de los ARCOS, deja pasar por la boca (para que entren los goles).
  if(fieldLimits){
    const HB = 0.6;   // margen físico: la pelota se frena un poco antes del borde visible
    const mainAxis = fieldAxis || 'x';            // eje donde están los arcos
    const widthAxis = (mainAxis === 'x') ? 'z' : 'x';
    // límites por eje
    const lim = {
      x: { min: fieldLimits.minX + HB, max: fieldLimits.maxX - HB },
      z: { min: fieldLimits.minZ + HB, max: fieldLimits.maxZ - HB }
    };
    // ¿la pelota está alineada con una boca de arco? (entonces no frenamos en el eje principal)
    let inGoalMouth = false;
    for(const g of goalAreas){
      const cW = (widthAxis === 'x') ? g.center.x : g.center.z;
      const halfMouth = (((widthAxis === 'x') ? (g.bbox.max.x - g.bbox.min.x) : (g.bbox.max.z - g.bbox.min.z))) / 2;
      if(Math.abs(ballPos[widthAxis] - cW) <= halfMouth + 0.3 && ballPos.y <= g.bbox.max.y + 0.3){ inGoalMouth = true; break; }
    }
    // EJE ANCHO (laterales): clamp SIEMPRE
    {
      const a = widthAxis, L = lim[a];
      if(ballPos[a] < L.min){ ballPos[a] = L.min; if(ballVelocity[a] < 0) ballVelocity[a] = -ballVelocity[a] * 0.35; }
      else if(ballPos[a] > L.max){ ballPos[a] = L.max; if(ballVelocity[a] > 0) ballVelocity[a] = -ballVelocity[a] * 0.35; }
    }
    // EJE PRINCIPAL (fondos con arcos): clamp solo si NO está en la boca del arco
    if(!inGoalMouth){
      const a = mainAxis, L = lim[a];
      if(ballPos[a] < L.min){ ballPos[a] = L.min; if(ballVelocity[a] < 0) ballVelocity[a] = -ballVelocity[a] * 0.35; }
      else if(ballPos[a] > L.max){ ballPos[a] = L.max; if(ballVelocity[a] > 0) ballVelocity[a] = -ballVelocity[a] * 0.35; }
    }
  }
}

// power=14 → patada potente (hacia adelante)
// power=7 → pase (hacia compañero más cercano)
function kickBall(power = 14){
  if(!player || !ballModel) return;
  // SAQUES con apuntado: el botón PATEAR lanza (manos) o patea largo (pies)
  if(setPiece && setPiece.aim && setPiece.team === 'us'){
    if(setPiece.type === 'goalkick') goalKickLong(); else throwBall();
    return;
  }
  if(kickCooldown > 0) return;
  
  const isMoving = Math.hypot(joystickState.vx, joystickState.vy) > 0.1;
  const kickSpeed = isMoving ? 2.0 : 1.4;
  playerSetAnim(player, 'kick', kickSpeed);
  kickCooldown = 0.3;
  
  // Solo patea si el jugador TIENE la pelota
  if(ballOwner !== player) return;
  const wasSetPiece = (kickoffActive || !!setPiece);
  const spType = setPiece ? setPiece.type : null;
  if(kickoffActive) kickoffActive = false;   // patear durante el saque también arranca el juego
  if(setPiece) setPiece = null;
  if(wasSetPiece && spType !== 'penalty') power = 7;   // saques = pase; el PENAL se patea fuerte
  lastTouchTeam = 'us';
  sfxKick(power);
  
  // Auto-freno reducido al 50%
  if(isMoving){
    speedMultiplier = 0.5;
    speedMultiplierTimer = 0.3;
  }
  
  const isPass = (power < 10);  // power 7 = pase corto, power 14 = patada
  
  // Determinar dirección
  let fx, fz, finalPower, verticalBoost;
  if(isPass){
    // PASE → al receptor ya elegido por la mira (passReceiver). Si no hay, el más
    // cercano en la dirección hacia donde mira el jugador (NO un eje Z fijo).
    let bestTeam = (passReceiver && passReceiver.team === 'us' && !passReceiver.isKeeper && passReceiver.root) ? passReceiver : null;
    if(!bestTeam){
      const a0 = player.root.rotation.y;
      const lookX = -Math.sin(a0), lookZ = -Math.cos(a0);   // hacia donde mira
      let bestScore = -Infinity;
      for(const tm of teammates){
        if(!tm.root || tm.isKeeper) continue;
        const ddx = tm.root.position.x - player.root.position.x;
        const ddz = tm.root.position.z - player.root.position.z;
        const d = Math.hypot(ddx, ddz);
        if(d < 1.5) continue;  // muy cerca
        const dot = (ddx * lookX + ddz * lookZ) / (d || 1);   // alineado con la mira
        const score = dot * 2 - d * 0.04;
        if(score > bestScore){ bestScore = score; bestTeam = tm; }
      }
    }
    if(bestTeam){
      const ddx = bestTeam.root.position.x - player.root.position.x;
      const ddz = bestTeam.root.position.z - player.root.position.z;
      const d = Math.hypot(ddx, ddz) || 1;
      fx = ddx / d;
      fz = ddz / d;
      // PASE GUIADO: la pelota persigue al receptor para que SIEMPRE le llegue
      ballHomingTarget = bestTeam; ballHomingTimer = 1.6;
      passReceiver = bestTeam;
      // Potencia proporcional a la distancia
      finalPower = Math.min(13, 4 + d * 0.7);
      verticalBoost = 1.3;
    } else {
      // Sin compañeros: pase corto hacia adelante (hacia donde mira)
      const a = player.root.rotation.y;
      fx = -Math.sin(a);
      fz = -Math.cos(a);
      finalPower = 6;
      verticalBoost = 1.3;
    }
  } else {
    // PATADA potente → hacia donde mira el jugador (hacia +Z)
    // El root tiene rotación +PI por la compensación CMU, pero el cuerpo visualmente
    // mira a -sin(angle)/-cos(angle)
    const a = player.root.rotation.y;
    fx = -Math.sin(a);
    fz = -Math.cos(a);
    finalPower = 14;
    verticalBoost = 5;
  }
  
  // CHANFLE NUEVO: mantené KICK y mové el joystick izq/der mientras carga.
  // _chargeSpin guarda hacia dónde curvar (-1 izq … +1 der), capturado al soltar.
  let spinAtKick = 0;
  if(finalPower >= 10){   // solo en tiros potentes (no pases cortos)
    // 1) si venías cargando con el joystick lateral, usar eso (mecánica nueva)
    if(typeof window._chargeSpin === 'number' && Math.abs(window._chargeSpin) > 0.05){
      spinAtKick = Math.max(-1, Math.min(1, window._chargeSpin)) * 11;
    } else {
      // 2) fallback: componente lateral del joystick en el momento del disparo
      const jvx = joystickState.vx || 0, jvy = joystickState.vy || 0;
      const jmag = Math.hypot(jvx, jvy);
      if(jmag > 0.25){
        const cy = Math.cos(cameraOrbit.yaw), sy = Math.sin(cameraOrbit.yaw);
        const jwx = jvx * cy + jvy * sy;
        const jwz = -jvx * sy + jvy * cy;
        const lateral = (-fz) * jwx + (fx) * jwz;
        spinAtKick = Math.max(-1, Math.min(1, lateral)) * 9;
      }
    }
  }
  window._chargeSpin = 0;   // limpiar para el próximo tiro
  
  // Impulso después de un pequeño delay (coincide con contacto)
  const impulseDelay = isMoving ? 60 : 100;
  setTimeout(() => {
    if(!ballModel || !player) return;
    if(ballOwner !== player) return;  // perdió la pelota mientras pateaba
    ballOwner = null;  // soltar pelota
    lastKicker = player; lastKickerTimer = 0.5;   // que no la re-agarre al instante
    ballVelocity.set(fx * finalPower, verticalBoost, fz * finalPower);
    ballSpin = spinAtKick;   // aplicar el chanfle calculado
    if(Math.abs(spinAtKick) > 2.5) sfxCurveKick(spinAtKick);   // whoosh si fue un chanfle marcado
    // FRENO tras pasar/patear: el jugador NO debe quedar derivando solo
    speedMultiplier = 0; speedMultiplierTimer = 0.25;
    playerSetAnim(player, 'idle');
    // la cámara sigue al jugador (no a la pelota) para no desorientar el control
  }, impulseDelay);
}

// Verifica si la trayectoria predicha de la pelota va hacia algún compañero
// Si es así → cambia cámara al modo 'ball' por unos segundos
function checkBallToTeammate(){
  if(!ballModel || teammates.length === 0) return;
  
  const ballPos = ballModel.position.clone();
  const ballDir = new THREE.Vector3(ballVelocity.x, 0, ballVelocity.z);
  const ballSpeed = ballDir.length();
  if(ballSpeed < 1) return;  // muy lenta, no es un pase
  ballDir.normalize();
  
  // Para cada compañero, calcular distancia perpendicular del rayo de la pelota a su pos
  let bestMatch = null;
  let bestScore = Infinity;
  for(const tm of teammates){
    const toTm = new THREE.Vector3(
      tm.root.position.x - ballPos.x,
      0,
      tm.root.position.z - ballPos.z
    );
    const forwardDist = toTm.dot(ballDir);  // distancia a lo largo del rayo
    if(forwardDist < 1 || forwardDist > 30) continue;  // compañero detrás o muy lejos
    
    const proj = ballDir.clone().multiplyScalar(forwardDist);
    const perpVec = toTm.clone().sub(proj);
    const perpDist = perpVec.length();
    
    // Si la pelota pasa a < 3m del compañero, asumimos que es un pase para él
    if(perpDist < 3){
      const score = perpDist + forwardDist * 0.1;  // priorizar cerca + alineado
      if(score < bestScore){
        bestScore = score;
        bestMatch = tm;
      }
    }
  }
  
  if(bestMatch){
    // Activar cámara seguidora de pelota por 2.5s
    cameraMode = 'ball';
    cameraBallTimer = 2.5;
    console.log('[cam] pase detectado a', bestMatch.root.position);
  }
}

// === INPUT: JOYSTICK + DRAG CÁMARA ===
const joystickEl = document.getElementById('joystick');
const knobEl = document.getElementById('joystickKnob');
let joystickTouchId = null;
const joystickCenter = { x: 0, y: 0 };
const joystickRadius = 50;

// Track de touches activos para drag de cámara (cualquier touch fuera del joystick)
const cameraTouches = {};  // {touchId: {x, y}}

function getJoystickRect(){
  const r = joystickEl.getBoundingClientRect();
  joystickCenter.x = r.left + r.width/2;
  joystickCenter.y = r.top + r.height/2;
}

function isOnJoystick(x, y){
  getJoystickRect();
  const dx = x - joystickCenter.x;
  const dy = y - joystickCenter.y;
  return (dx*dx + dy*dy) <= 100*100;  // dentro de 100px del centro del joystick
}

function isOnUIButton(target){
  if(!target) return false;
  // Es un botón de UI si tiene la clase actBtn, btn o es btn de UI
  return target.closest && (
    target.closest('.actBtn') ||
    target.closest('#exitBtn') ||
    target.closest('#hud') ||
    target.closest('#cancelBtn') ||
    target.closest('#playBtn') ||
    target.closest('.teamCard')
  );
}

function joystickStart(touch){
  if(joystickTouchId !== null) return false;
  if(!isOnJoystick(touch.clientX, touch.clientY)) return false;
  joystickTouchId = touch.identifier;
  joystickState.active = true;
  joystickMove(touch);
  return true;
}

function joystickMove(touch){
  if(joystickTouchId !== touch.identifier) return;
  // delta en coords de PANTALLA
  let dx = touch.clientX - joystickCenter.x;
  let dy = touch.clientY - joystickCenter.y;
  // si la app está rotada 90° (pantalla vertical), remapear a coords LÓGICAS
  if(isPortraitScreen()){ const t = dx; dx = dy; dy = -t; }
  const dist = Math.hypot(dx, dy);
  const max = joystickRadius;
  let nx = dx, ny = dy;
  if(dist > max){
    nx = (dx/dist) * max;
    ny = (dy/dist) * max;
  }
  knobEl.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
  joystickState.vx = nx / max;
  joystickState.vy = ny / max;
}

function joystickEnd(touchId){
  if(joystickTouchId !== touchId) return;
  joystickTouchId = null;
  joystickState.active = false;
  joystickState.vx = 0;
  joystickState.vy = 0;
  knobEl.style.transform = 'translate(-50%, -50%)';
}

// === CAMERA DRAG ===
function cameraTouchStart(touchId, x, y){
  cameraTouches[touchId] = {x, y};
}

function cameraTouchMove(touchId, x, y){
  const prev = cameraTouches[touchId];
  if(!prev) return;
  let dx = x - prev.x;
  let dy = y - prev.y;
  // remapear a coords LÓGICAS si la app está rotada
  if(isPortraitScreen()){ const t = dx; dx = dy; dy = -t; }
  
  // Sensibilidad
  const yawSens = 0.005;
  const pitchSens = 0.004;
  
  cameraOrbit.yaw -= dx * yawSens;
  cameraOrbit.pitch = Math.max(0.05, Math.min(1.4, cameraOrbit.pitch + dy * pitchSens));
  
  cameraTouches[touchId] = {x, y};
}

function cameraTouchEnd(touchId){
  delete cameraTouches[touchId];
}

// Touch global handlers
addEventListener('touchstart', e => {
  for(const t of e.changedTouches){
    // Si el target es un botón de UI, lo dejamos pasar normal (no manejamos como cámara)
    if(isOnUIButton(t.target)) continue;
    // Probar joystick primero
    const onJoy = joystickStart(t);
    if(!onJoy){
      // Si no es el joystick y no es un botón → drag de cámara
      cameraTouchStart(t.identifier, t.clientX, t.clientY);
    }
  }
}, {passive: true});

addEventListener('touchmove', e => {
  for(const t of e.changedTouches){
    if(joystickTouchId === t.identifier){
      joystickMove(t);
    } else if(cameraTouches[t.identifier]){
      cameraTouchMove(t.identifier, t.clientX, t.clientY);
    }
  }
}, {passive: true});

addEventListener('touchend', e => {
  for(const t of e.changedTouches){
    if(joystickTouchId === t.identifier){
      joystickEnd(t.identifier);
    } else if(cameraTouches[t.identifier]){
      cameraTouchEnd(t.identifier);
    }
  }
}, {passive: true});

addEventListener('touchcancel', e => {
  for(const t of e.changedTouches){
    joystickEnd(t.identifier);
    cameraTouchEnd(t.identifier);
  }
}, {passive: true});

// === MOUSE para desktop ===
let mouseJoystickActive = false;
let mouseCameraActive = false;
let mouseLast = {x: 0, y: 0};

addEventListener('mousedown', e => {
  if(isOnUIButton(e.target)) return;
  if(isOnJoystick(e.clientX, e.clientY)){
    mouseJoystickActive = true;
    joystickState.active = true;
    joystickTouchId = 'mouse';
    joystickMove({identifier:'mouse', clientX:e.clientX, clientY:e.clientY});
  } else {
    mouseCameraActive = true;
    mouseLast.x = e.clientX;
    mouseLast.y = e.clientY;
  }
});

addEventListener('mousemove', e => {
  if(mouseJoystickActive){
    joystickMove({identifier:'mouse', clientX:e.clientX, clientY:e.clientY});
  } else if(mouseCameraActive){
    const dx = e.clientX - mouseLast.x;
    const dy = e.clientY - mouseLast.y;
    cameraOrbit.yaw -= dx * 0.005;
    cameraOrbit.pitch = Math.max(0.05, Math.min(1.4, cameraOrbit.pitch + dy * 0.004));
    mouseLast.x = e.clientX;
    mouseLast.y = e.clientY;
  }
});

addEventListener('mouseup', () => {
  if(mouseJoystickActive){
    mouseJoystickActive = false;
    joystickEnd('mouse');
  }
  mouseCameraActive = false;
});

// Botones de acción
// Botones de acción - usar touchstart Y click para que funcione tanto mobile como desktop
function bindActionButton(id, handler){
  const el = document.getElementById(id);
  let touchFired = false;
  el.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    touchFired = true;
    handler();
    setTimeout(() => { touchFired = false; }, 300);
  }, {passive: false});
  el.addEventListener('click', (e) => {
    if(touchFired) return;  // evitar doble disparo
    handler();
  });
}
// ===== MANTENER PARA CARGAR potencia (PATEAR / PASE) =====
let charging = null, chargeT = 0, _chargePinged = false;
const CHARGE_FULL = 0.8;   // segundos para potencia máxima
function bindChargeButton(id, onRelease, trackSpin){
  const el = document.getElementById(id);
  const ring = document.createElement('span'); ring.className = 'chgRing'; el.appendChild(ring);
  el._ring = ring;
  const start = (e) => { if(e){ e.stopPropagation(); if(e.cancelable) e.preventDefault(); } if(charging) return; charging = id; chargeT = 0; el.classList.add('charging'); if(trackSpin) window._chargeSpin = 0; };
  const end = (e) => { if(charging !== id) return; if(e) e.stopPropagation(); const c = Math.min(1, chargeT / CHARGE_FULL); charging = null; el.classList.remove('charging'); el._ring.style.background = 'transparent'; onRelease(c); };
  el.addEventListener('touchstart', start, {passive:false});
  el.addEventListener('touchend', end, {passive:false});
  el.addEventListener('touchcancel', end, {passive:false});
  el.addEventListener('mousedown', start);
  el.addEventListener('mouseup', end);
}
// PATEAR: mantener para cargar potencia + chanfle (joystick izq/der), soltar dispara
bindChargeButton('btnKick', (c) => {
  if(window.NET && window.NET.active){ window._netKick = true; return; }
  if(fieldTut && fieldTut.step === 1) fieldTut.kicked = true;
  // destello de la línea guía si venías cargando un chanfle
  if(_aimLine && _aimLine.visible && Math.abs(window._chargeSpin||0) > 0.1){
    _aimLine.material.opacity = 1; 
    if(_aimDots) _aimDots.scale.setScalar(1.8);
    setTimeout(()=>{ if(_aimDots) _aimDots.scale.setScalar(1); }, 120);
  }
  const power = 14 + c * 10;   // toque=14, carga llena=24
  kickBall(power);
}, true);
bindActionButton('btnPass', () => {
  if(window.NET && window.NET.active){ window._netPass = true; return; }
  // En el tutorial (paso 2): pase GUIADO directo al compañero, sin depender del joystick
  if(fieldTut && fieldTut.step === 2){
    const mate = fieldTut._mate;
    if(mate && mate.root && ballOwner === player){
      faceTowardsGoal(player, mate.root.position);   // mirar al compañero
      passReceiver = mate; passInFlight = true; passTimer = 0;
      npcPassTo(player, mate);                    // pase directo y guiado
      fieldTut.passed = true;
    }
    return;
  }
  passOrSwitch(1.6);
});

document.getElementById('btnSprint').addEventListener('touchstart', () => { buttons.sprint = true; }, {passive:true});
document.getElementById('btnSprint').addEventListener('touchend', () => { buttons.sprint = false; }, {passive:true});
document.getElementById('btnSprint').addEventListener('mousedown', () => { buttons.sprint = true; });
document.getElementById('btnSprint').addEventListener('mouseup', () => { buttons.sprint = false; });

// Coach: botón CONTINUAR oculta el coach (sale suave) y reanuda la acción; SKIP salta todo
(function(){
  const ok = document.getElementById('coachNext');
  if(ok) ok.addEventListener('click', () => {
    if(!fieldTut || !fieldTut._waiting) return;   // evita doble toque / saltos
    try{ if(typeof sfxKick==='function') sfxKick(2); }catch(e){}
    pxCoachHide();                                 // el dino se va con fade suave
    setTimeout(()=>{                               // reanudar recién al terminar de salir
      if(!fieldTut) return;
      fieldTut._waiting = false;
      fieldTut._grace = 0;
      if(fieldTut.step === 3) fieldTut._endAfter = true;  // último mensaje → termina
    }, 480);
  });
  const sk = document.getElementById('tutSkipBtn');
  if(sk) sk.addEventListener('click', () => { pxCoachHide(); if(fieldTut) endFieldTutorial(); });
})();

// === NAV BUTTONS ===
document.getElementById('langBtn').addEventListener('click', () => {
  LANG = (LANG === 'es') ? 'en' : 'es';
  applyLang();
  if(document.getElementById('playerViewer').classList.contains('show')) pvRenderStats();
});
// Prompt de idioma en el PRIMER arranque (antes del tutorial)
(function initLangPrompt(){
  let chosen=false; try{ chosen = !!localStorage.getItem('rezonaLang'); }catch(e){}
  const modal=document.getElementById('langModal');
  if(!modal) return;
  if(!chosen){ modal.classList.add('show'); }
  modal.querySelectorAll('.langPick').forEach(b=>{
    b.addEventListener('click', ()=>{
      LANG = b.dataset.l==='en' ? 'en' : 'es';
      applyLang();
      try{ localStorage.setItem('rezonaLang', LANG); }catch(e){}
      modal.classList.remove('show');
    });
  });
})();
document.getElementById('muteBtn').addEventListener('click', () => {
  const m = toggleMute();
  document.getElementById('muteBtn').textContent = m ? '🔇' : '🔊';
});
// === COACHMARK: tutorial de UNA sola vez por pantalla (en idioma) ===
let _coachQueue = [];
function _coachShowNext(){
  if(!_coachQueue.length){ document.getElementById('coach').classList.remove('show'); return; }
  const item = _coachQueue[0];
  document.getElementById('coachText').innerHTML = (LANG === 'en') ? item.en : item.es;
  document.getElementById('coachOk').textContent = (LANG === 'en') ? 'GOT IT' : 'ENTENDIDO';
  document.getElementById('coach').classList.add('show');
}
function showCoach(key, es, en){
  try{ if(localStorage.getItem('rezonaCoach_' + key)) return; }catch(e){}
  try{ localStorage.setItem('rezonaCoach_' + key, '1'); }catch(e){}
  _coachQueue.push({ es, en });
  if(_coachQueue.length === 1) _coachShowNext();
}
document.getElementById('coachOk').addEventListener('click', () => { _coachQueue.shift(); _coachShowNext(); });

document.getElementById('figBtn').addEventListener('click', () => {
  if(window.openFig) window.openFig();
  // tutorial de stickers (una sola vez)
  setTimeout(() => showCoach('fig',
    '🎴 <b>Figuritas</b>: ganá monedas jugando y abrí <b>sobres</b> para coleccionar jugadores de 24 países. Los repetidos te sirven, y a los que sacás los podés <b>meter en tu equipo</b> con REORDENAR.',
    '🎴 <b>Stickers</b>: earn coins by playing and open <b>packs</b> to collect players from 24 countries. The ones you pull can be <b>added to your team</b> with REORDER.'), 300);
});
// La música arranca con el primer toque (los navegadores exigen un gesto)
addEventListener('pointerdown', function _startAudioOnce(){
  ensureAudio();
  const ui = document.getElementById('gameUI');
  // En el menú suena la pista sci-fi; el himno es solo del partido
  if(ui && ui.classList.contains('show')) startMusic(); else startBg('menu');
  removeEventListener('pointerdown', _startAudioOnce);
}, { once: true });
document.getElementById('playBtn').addEventListener('click', () => {
  document.getElementById('playScreen').classList.add('hide');
  setTimeout(() => {
    document.getElementById('modeSelect').classList.add('show');
    startModeFx();
  }, 400);
});

// === CANVAS FX del menú GOTY: luces de estadio + partículas flotantes ===
let _modeFxRAF = null, _modeFxParts = null;
function startModeFx(){
  const cv = document.getElementById('modeFx'); if(!cv) return;
  const ctx = cv.getContext('2d');
  function resize(){ cv.width = cv.clientWidth * (window.devicePixelRatio||1); cv.height = cv.clientHeight * (window.devicePixelRatio||1); }
  resize();
  if(!_modeFxParts){
    _modeFxParts = [];
    for(let i=0;i<46;i++) _modeFxParts.push({
      x:Math.random(), y:Math.random(), r:1+Math.random()*2.5,
      vy:0.01+Math.random()*0.03, vx:(Math.random()-0.5)*0.01,
      a:0.15+Math.random()*0.4, hue:Math.random()<0.5?28:265
    });
  }
  let t=0;
  function frame(){
    if(!document.getElementById('modeSelect').classList.contains('show')){ _modeFxRAF=null; return; }
    t+=0.016;
    const W=cv.width, H=cv.height;
    ctx.clearRect(0,0,W,H);
    // haces de luz tipo reflector (parte superior)
    for(let i=0;i<3;i++){
      const cx = W*(0.2+0.3*i) + Math.sin(t*0.4+i)*W*0.05;
      const g = ctx.createLinearGradient(cx,0,cx+ (i-1)*W*0.15, H*0.8);
      g.addColorStop(0,'rgba(255,150,70,0.10)'); g.addColorStop(1,'rgba(255,150,70,0)');
      ctx.fillStyle=g; ctx.beginPath();
      ctx.moveTo(cx-30,0); ctx.lineTo(cx+30,0);
      ctx.lineTo(cx+(i-1)*W*0.15+W*0.18,H*0.85); ctx.lineTo(cx+(i-1)*W*0.15-W*0.18,H*0.85);
      ctx.closePath(); ctx.fill();
    }
    // partículas flotantes
    for(const p of _modeFxParts){
      p.y -= p.vy*0.01; p.x += p.vx*0.01;
      if(p.y<-0.05){ p.y=1.05; p.x=Math.random(); }
      const px=p.x*W, py=p.y*H;
      const col = p.hue===28 ? '255,170,90' : '150,110,255';
      ctx.beginPath(); ctx.arc(px,py,p.r*(window.devicePixelRatio||1),0,Math.PI*2);
      ctx.fillStyle='rgba('+col+','+(p.a*(0.6+0.4*Math.sin(t*2+p.x*10)))+')'; ctx.fill();
    }
    _modeFxRAF = requestAnimationFrame(frame);
  }
  if(!_modeFxRAF) frame();
  window.addEventListener('resize', resize, {passive:true});
}
// ===== SELECCIÓN DE MODO (1v1 / 2v2) =====
window.selectedMode = '1v1';   // por defecto
document.querySelectorAll('#modeSelect .modeCard').forEach(card => {
  card.addEventListener('click', () => {
    window.selectedMode = card.dataset.mode;   // '1v1' o '2v2'
    document.getElementById('modeSelect').classList.remove('show');
    buildTeamCards();
    setTimeout(() => { document.getElementById('teamSelect').classList.add('show'); }, 250);
  });
});
document.getElementById('modeBack').addEventListener('click', () => {
  document.getElementById('modeSelect').classList.remove('show');
  document.getElementById('playScreen').classList.remove('hide');
});
// ===== MENÚ FC: tiles, toast COMING SOON, monedas =====
function fcToast(msg){
  const t = document.getElementById('fcToast'); if(!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(fcToast._t); fcToast._t = setTimeout(() => t.classList.remove('show'), 1500);
}
function openFiguritas(){ const fb = document.getElementById('figBtn'); if(fb) fb.click(); }
document.querySelectorAll('#fcMenu [data-soon]').forEach(el => {
  el.addEventListener('click', () => fcToast(LANG === 'en' ? 'Coming soon ⚽' : 'Próximamente ⚽'));
});
['navMarket','railGems'].forEach(id => {
  const el = document.getElementById(id); if(el) el.addEventListener('click', openFiguritas);
});
const _dailyTileEl = document.getElementById('dailyTile');
if(_dailyTileEl) _dailyTileEl.addEventListener('click', () => { if(window.openFig) window.openFig(); if(window.openDaily) window.openDaily(); });
const _openVia = (fn) => { if(window.openFig) window.openFig(); if(window[fn]) window[fn](); };
[['navQuests','openQuests'],['railQuests','openQuests'],['navLeagues','openLeagues'],['railLeagues','openLeagues'],
 ['navStore','openStore'],['railStore','openStore'],['navDaily2','openDaily']].forEach(([id,fn])=>{
  const el=document.getElementById(id); if(el) el.addEventListener('click', ()=>_openVia(fn));
});
function fcUpdateCoins(){
  const c = document.getElementById('fcCoins'); if(c) c.textContent = '🪙 ' + (window.getCoins ? window.getCoins() : 0);
  const b = document.getElementById('dailyBadge'); if(b) b.classList.toggle('hide', !(window.dailyAvailable && window.dailyAvailable()));
}
fcUpdateCoins(); setInterval(fcUpdateCoins, 1500);

document.getElementById('cancelBtn').addEventListener('click', () => {
  document.getElementById('teamSelect').classList.remove('show');
  document.getElementById('modeSelect').classList.add('show');
});

function hx(c){ return '#' + ('000000' + c.toString(16)).slice(-6); }
function buildTeamCards(){
  const grid = document.getElementById('teamGrid');
  if(!grid) return;
  grid.innerHTML = '';
  for(const key of Object.keys(TEAMS)){
    const t2 = TEAMS[key];
    const card = document.createElement('div');
    card.className = 'teamCard';
    card.dataset.team = key;
    const c1 = hx(t2.color);
    card.style.background = 'linear-gradient(160deg,' + c1 + ' 0%, rgba(0,0,0,0.85) 130%)';
    card.style.borderColor = t2.accentHex || c1;
    let tg='';
    try{ const ps=t2.players||[]; if(ps.length){ let tot=0,n=0; ps.forEach(pl=>{ const s=pl.stats||{}; tot+=((s.vel||0)+(s.tiro||0)+(s.pase||0)+(s.def||0)+(s.fis||0))/5; n++; });
      const ovr=Math.round(tot/n), g=window.gradeOf?window.gradeOf(ovr):''; const gc=window.gradeColor?window.gradeColor(g):'#fff';
      tg='<span class="tgChip" style="color:'+gc+';border-color:'+gc+'">'+g+'</span> '; } }catch(e){}
    card.innerHTML = '<canvas class="tcFlag" width="44" height="29"></canvas>' +
                     '<div class="teamName">' + tg + t(t2.name) + '</div>' +
                     '<div class="teamMeta">★ ' + t(t2.strength || (key === 'rezona' ? 'Ataque total' : 'Defensa férrea')) + '</div>';
    grid.appendChild(card);
    (function(c, nm){ requestAnimationFrame(()=>{ const fc=c.querySelector('.tcFlag'); if(!fc) return;
      const ok = window.drawCountryFlag ? window.drawCountryFlag(fc, nm) : false;
      if(!ok) fc.style.display='none'; }); })(card, t2.name);
  }
}
document.getElementById('teamGrid').addEventListener('click', e => {
  const card = e.target.closest('.teamCard');
  if(card && card.dataset.team) openPlayerViewer(card.dataset.team);
});

// Arrastre manual de scroll (funciona aunque la pantalla esté rotada)
function enableDragScroll(el, axis){
  if(!el || el._ds) return; el._ds = 1;
  let active=false, moved=false, lx=0, ly=0;
  const port = () => window.innerHeight > window.innerWidth;
  const apply = (dx,dy) => {
    if(!moved && Math.hypot(dx,dy)>3) moved=true;
    if(moved){
      if(axis==='x') el.scrollLeft -= port()? dy : dx;
      else el.scrollTop += port()? dx : -dy;
    }
  };
  el.addEventListener('touchstart', e => { const t=e.touches[0]; active=true; moved=false; lx=t.clientX; ly=t.clientY; }, {passive:true});
  el.addEventListener('touchmove', e => { if(!active) return; const t=e.touches[0];
    const dx=t.clientX-lx, dy=t.clientY-ly; lx=t.clientX; ly=t.clientY; apply(dx,dy);
    if(moved && e.cancelable) e.preventDefault(); }, {passive:false});
  const end = () => { active=false; };
  el.addEventListener('touchend', end); el.addEventListener('touchcancel', end);
  // fallback mouse (PC/preview)
  el.addEventListener('mousedown', e => { active=true; moved=false; lx=e.clientX; ly=e.clientY; });
  window.addEventListener('mousemove', e => { if(!active) return; const dx=e.clientX-lx, dy=e.clientY-ly; lx=e.clientX; ly=e.clientY; apply(dx,dy); });
  window.addEventListener('mouseup', end);
  el.addEventListener('click', e => { if(moved){ e.stopPropagation(); e.preventDefault(); moved=false; } }, true);
}
window.enableDragScroll = enableDragScroll;
enableDragScroll(document.getElementById('teamGrid'), 'x');

document.getElementById('exitBtn').addEventListener('click', exitGame);

// === EDITOR DEV ===
addEventListener('wheel', e => {
  if(!devMode) return;
  cameraOrbit.distance = Math.max(3, Math.min(45, cameraOrbit.distance + (e.deltaY > 0 ? 2 : -2)));
}, { passive: true });
document.getElementById('devBtn').addEventListener('click', toggleDev);
document.getElementById('devClose').addEventListener('click', toggleDev);
document.getElementById('devCopy').addEventListener('click', devCopy);
document.getElementById('devReset').addEventListener('click', devResetGoals);
document.getElementById('devPanel').addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  if(b.dataset.sel !== undefined){
    devSel = parseInt(b.dataset.sel, 10);
    document.querySelectorAll('.devSel').forEach(x => x.classList.toggle('on', x === b));
    devFocusGoal();
    devRefresh();
  } else if(b.dataset.k){
    devEdit(b.dataset.k, b.dataset.a, parseInt(b.dataset.s, 10));
  } else if(b.dataset.cam){
    const cm = b.dataset.cam;
    if(cm === 'zoomin') cameraOrbit.distance = Math.max(3, cameraOrbit.distance - 2);
    else if(cm === 'zoomout') cameraOrbit.distance = Math.min(45, cameraOrbit.distance + 2);
    else if(cm === 'up') cameraOrbit.pitch = Math.min(1.5, cameraOrbit.pitch + 0.12);
    else if(cm === 'down') cameraOrbit.pitch = Math.max(0.05, cameraOrbit.pitch - 0.12);
  }
});

// Tutorial
document.getElementById('tutBtn').addEventListener('click', () => {
  if(tutIndex < TUT_STEPS.length - 1){ tutIndex++; showTutorialStep(); }
  else closeTutorial();
});
document.getElementById('tutSkip').addEventListener('click', closeTutorial);
document.getElementById('helpBtn').addEventListener('click', openTutorial);
document.getElementById('camBtn').addEventListener('click', () => {
  cameraView = (cameraView === 'fifa') ? 'tps' : 'fifa';
  camSwitchT = 1.0;   // transición suave entre cámaras
  document.getElementById('camBtn').textContent = (cameraView === 'fifa') ? '📷 FIFA' : '📷 CERCA';
  showFoulBanner(cameraView === 'fifa' ? t('Cámara FIFA') : t('Cámara cercana'), 900);
});
addEventListener('resize', () => { if(tutorialActive) positionTutRing(); });

// === GRÁFICOS / RESOLUCIÓN ===
let gfxQuality = 'media';
function gfxPixelRatio(q){
  if(q === 'alta') return Math.min(devicePixelRatio, 1.5);
  if(q === 'baja') return 0.6;
  return 1.0;  // media (por defecto): 1x, mucho más liviano en pantallas densas
}
// ===================== OPTIMIZACIÓN DE RENDER =====================
const optLights = [];          // luces opcionales (fill/rim) que se apagan en media/baja
let shadowTick = 0;            // throttle de actualización de sombras
let _fpsFrames = 0, _fpsAccum = 0;   // contador de FPS
const stadiumMeshes = [];            // meshes del estadio ya fusionados
let controlArrow = null;             // flecha roja sobre el jugador controlado

function texBudget(q){ return q === 'alta' ? 512 : (q === 'baja' ? 128 : 256); }

// Baja la resolución de una textura a maxSize (redibujada en un canvas más chico)
function downscaleTexture(tex, maxSize){
  if(!tex) return;
  const img = tex.image;
  if(!img || !img.width || !img.height){ tex.anisotropy = 1; return; }
  const m = Math.max(img.width, img.height);
  if(m > maxSize){
    const s = maxSize / m;
    const cw = Math.max(1, Math.round(img.width * s));
    const ch = Math.max(1, Math.round(img.height * s));
    const cv = document.createElement('canvas');
    cv.width = cw; cv.height = ch;
    try {
      cv.getContext('2d').drawImage(img, 0, 0, cw, ch);
      tex.image = cv;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.generateMipmaps = true;
      tex.needsUpdate = true;
    } catch(e){ /* textura no dibujable, se deja igual */ }
  }
  tex.anisotropy = 1;           // sin filtrado anisotrópico (caro en móvil)
}

// Optimiza un material: baja texturas y saca mapas caros según calidad
function optimizeMaterial(mat, q){
  if(!mat) return;
  const list = Array.isArray(mat) ? mat : [mat];
  const maxS = texBudget(q);
  for(const m of list){
    if(!m) continue;
    ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap','bumpMap','specularMap','lightMap']
      .forEach(k => { if(m[k]) downscaleTexture(m[k], maxS); });
    if(q !== 'alta'){
      // sacar normal/AO ahorra MUCHO (menos cálculo por píxel)
      if(m.normalMap){ m.normalMap = null; }
      if(m.aoMap){ m.aoMap = null; }
      if(q === 'baja'){
        if(m.roughnessMap){ m.roughnessMap = null; m.roughness = 0.85; }
        if(m.metalnessMap){ m.metalnessMap = null; m.metalness = 0.0; }
        if(m.emissiveMap){ m.emissiveMap = null; }
      }
      m.needsUpdate = true;
    }
  }
}

// Recorre la escena pesada (estadio + pelota) y aplica todo
function optimizeScene(q){
  if(courtModel) courtModel.traverse(o => { if(o.isMesh) optimizeMaterial(o.material, q); });
  for(const m of stadiumMeshes) optimizeMaterial(m.material, q);   // meshes ya fusionados
  if(ballModel) ballModel.traverse(o => { if(o.isMesh) optimizeMaterial(o.material, q); });
  for(const L of optLights) L.visible = (q === 'alta');   // menos luces en media/baja
  if(renderer){
    renderer.shadowMap.autoUpdate = (q === 'alta');       // en media: sombras throttleadas; en baja: apagadas
    renderer.shadowMap.needsUpdate = true;
  }
}

// Fusiona las mallas VISIBLES (cerca de la cancha) por material → menos draw calls.
// Seguro ahora que la altura del piso es constante (no raycastea geometría).
function mergeVisibleStadium(){
  if(!courtModel || !BufferGeometryUtils || !BufferGeometryUtils.mergeGeometries) return;
  try {
    courtModel.updateMatrixWorld(true);
    const groups = new Map();
    const toRemove = [];
    courtModel.traverse(o => {
      if(!o.isMesh || !o.geometry || !o.visible) return;          // solo visibles (post-cull)
      if(Array.isArray(o.material)) return;                        // saltea multi-material
      const src = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      if(!src.attributes.position) return;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', src.attributes.position.clone());
      if(src.attributes.normal) g.setAttribute('normal', src.attributes.normal.clone());
      if(src.attributes.uv) g.setAttribute('uv', src.attributes.uv.clone());
      else g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(src.attributes.position.count * 2), 2));
      if(!g.attributes.normal) g.computeVertexNormals();
      g.applyMatrix4(o.matrixWorld);
      if(!groups.has(o.material.uuid)) groups.set(o.material.uuid, { mat: o.material, geoms: [] });
      groups.get(o.material.uuid).geoms.push(g);
      toRemove.push(o);
    });
    if(toRemove.length < 4) return;   // no vale la pena
    let made = 0;
    for(const { mat, geoms } of groups.values()){
      let geo = null;
      try { geo = BufferGeometryUtils.mergeGeometries(geoms, false); } catch(e){ geo = null; }
      if(!geo) continue;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = false; mesh.receiveShadow = true;
      scene.add(mesh); stadiumMeshes.push(mesh); made++;
    }
    if(made > 0){ for(const o of toRemove){ if(o.parent) o.parent.remove(o); } }
    console.log('[merge] visibles:', toRemove.length, '→', made, 'draw calls');
  } catch(e){ console.warn('[merge] falló:', e); }
}

// Oculta gradas, asientos y estructuras lejanas (lo más pesado en triángulos y draw calls).
// Mantiene la cancha, el piso y lo cercano al campo de juego.
function cullStadium(){
  if(!courtModel || !fieldLimits) return;
  courtModel.updateMatrixWorld(true);
  const margin = 7;   // metros de tolerancia alrededor del césped que se mantienen
  const minX = fieldLimits.minX - margin, maxX = fieldLimits.maxX + margin;
  const minZ = fieldLimits.minZ - margin, maxZ = fieldLimits.maxZ + margin;
  let hidden = 0, kept = 0;
  courtModel.traverse(o => {
    if(!o.isMesh || !o.geometry) return;
    if(!o.visible) return;   // ya oculto (red simulada)
    const name = (o.name || '').toLowerCase();
    const seatName = /seat|chair|stand|grada|tribun|bleach|crowd|spectator|asiento|public|fan|techo|roof|stair|escaler/.test(name);
    const bb = new THREE.Box3().setFromObject(o);
    // ¿toca la zona de juego ampliada (en planta X/Z)?
    const touches = bb.max.x >= minX && bb.min.x <= maxX && bb.max.z >= minZ && bb.min.z <= maxZ;
    if(seatName || !touches){ o.visible = false; hidden++; }
    else kept++;
  });
  console.log('[cull] estadio: ocultas', hidden, '· visibles', kept);
}

function setGraphics(q){
  gfxQuality = q;
  const pr = gfxPixelRatio(q);
  const shadows = (q === 'alta');   // sombras solo en ALTA (media/baja sin sombras = más fluido)
  if(renderer){
    renderer.setPixelRatio(pr);
    renderer.shadowMap.enabled = shadows;
    renderer.shadowMap.needsUpdate = true;
  }
  if(menuRenderer) menuRenderer.setPixelRatio(pr);
  optimizeScene(q);   // baja texturas / mapas / luces según calidad
  document.querySelectorAll('.gfxOpt').forEach(b => b.classList.toggle('active', b.dataset.q === q));
  console.log('[gfx]', q, '· pixelRatio', pr.toFixed(2), '· sombras', shadows, '· texMax', texBudget(q));
}
document.querySelectorAll('.gfxOpt').forEach(b => {
  b.addEventListener('click', () => setGraphics(b.dataset.q));
});

// === PERSONAJE 3D DEL MENÚ (gira lento) ===
let menuRenderer = null, menuScene = null, menuCamera = null, menuChar = null, menuClock = null, menuRAF = 0;
function resizeMenu(){
  if(!menuRenderer) return;
  const canvas = document.getElementById('menuChar');
  const w = canvas.clientWidth || innerWidth;
  const h = canvas.clientHeight || Math.round(innerHeight * 0.72);
  menuRenderer.setPixelRatio(gfxPixelRatio(gfxQuality));
  menuRenderer.setSize(w, h, false);
  if(menuCamera){ menuCamera.aspect = w / Math.max(1, h); menuCamera.updateProjectionMatrix(); }
}
function initMenuCharacter(){
  const canvas = document.getElementById('menuChar');
  if(!canvas || menuRenderer) return;
  menuRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  menuRenderer.outputColorSpace = THREE.SRGBColorSpace;
  menuRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  menuRenderer.toneMappingExposure = 1.25;
  menuRenderer.shadowMap.enabled = false;
  menuScene = new THREE.Scene();
  menuCamera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  menuCamera.position.set(0, 0.95, 4.3);
  menuCamera.lookAt(0, 0.85, 0);
  menuScene.add(new THREE.HemisphereLight(0xbfe0ff, 0x40300a, 1.0));
  const key = new THREE.DirectionalLight(0xffe6c0, 2.3); key.position.set(3, 5, 4); menuScene.add(key);
  const rim = new THREE.DirectionalLight(0xff8a40, 1.3); rim.position.set(-3.5, 3, -4); menuScene.add(rim);
  menuScene.add(new THREE.AmbientLight(0x8090b0, 0.4));
  try{
    menuChar = buildPlayer('rezona', TEAMS.rezona.players[0]);   // CAPITÁN #10
    menuScene.add(menuChar.root);
    buildPlayerAnimations(menuChar);
    playerSetAnim(menuChar, 'idle');
    // Aplicar el idle una vez para no medir en T-pose
    if(menuChar.mixer) menuChar.mixer.update(0.1);
    // Encuadre automático según la altura real del personaje
    menuChar.root.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(menuChar.root);
    const c = new THREE.Vector3(); bb.getCenter(c);
    const sz = new THREE.Vector3(); bb.getSize(sz);
    const dist = sz.y * 1.8 + 0.5;
    menuCamera.position.set(0, c.y, dist);
    menuCamera.lookAt(0, c.y, 0);
    menuChar._focusY = c.y;
  }catch(e){ console.warn('[menuChar] no se pudo construir:', e); }
  resizeMenu();
  addEventListener('resize', resizeMenu);
  menuClock = new THREE.Clock();
  const loop = () => {
    menuRAF = requestAnimationFrame(loop);
    const dt = Math.min(0.05, menuClock.getDelta());
    const ps = document.getElementById('playScreen');
    const visible = ps && !ps.classList.contains('hide') && menuRenderer;
    if(!visible) return;  // ahorro: no renderizar el menú si no se ve
    if(menuChar){
      menuChar.root.rotation.y += dt * 0.5;
      if(menuChar.mixer) menuChar.mixer.update(dt);
    }
    menuRenderer.render(menuScene, menuCamera);
  };
  loop();
}

// === VISOR DE JUGADORES (modelo 3D rotable + stats) ===
let pvRenderer = null, pvScene = null, pvCamera = null, pvChar = null, pvClock = null, pvRAF = 0;
let pvTeam = 'rezona', pvIndex = 0, pvDragYaw = Math.PI, pvDragging = false, pvLastX = 0, pvVel = 0;
let chosenPlayerIndex = 0;

function pvResize(){
  if(!pvRenderer) return;
  const canvas = document.getElementById('pvCanvas');
  const w = canvas.clientWidth || innerWidth;
  const h = canvas.clientHeight || Math.round(innerHeight * 0.64);
  pvRenderer.setPixelRatio(gfxPixelRatio(gfxQuality));
  pvRenderer.setSize(w, h, false);
  pvCamera.aspect = w / Math.max(1, h);
  pvCamera.updateProjectionMatrix();
}
function pvEnsureRenderer(){
  if(pvRenderer) return;
  const canvas = document.getElementById('pvCanvas');
  pvRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  pvRenderer.outputColorSpace = THREE.SRGBColorSpace;
  pvRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  pvRenderer.toneMappingExposure = 1.25;
  pvScene = new THREE.Scene();
  pvCamera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  pvScene.add(new THREE.HemisphereLight(0xbfe0ff, 0x40300a, 1.0));
  const key = new THREE.DirectionalLight(0xffe6c0, 2.3); key.position.set(3, 5, 4); pvScene.add(key);
  const rim = new THREE.DirectionalLight(0xff8a40, 1.3); rim.position.set(-3.5, 3, -4); pvScene.add(rim);
  pvScene.add(new THREE.AmbientLight(0x8090b0, 0.4));
  pvClock = new THREE.Clock();
  // Arrastrar para girar
  canvas.addEventListener('pointerdown', e => { pvDragging = true; pvLastX = e.clientX; pvVel = 0; try{ canvas.setPointerCapture(e.pointerId); }catch(_){} });
  canvas.addEventListener('pointermove', e => { if(!pvDragging) return; const dx = e.clientX - pvLastX; pvLastX = e.clientX; pvDragYaw -= dx * 0.012; pvVel = -dx * 0.012; });
  canvas.addEventListener('pointerup', () => { pvDragging = false; });
  canvas.addEventListener('pointercancel', () => { pvDragging = false; });
  addEventListener('resize', pvResize);
  const loop = () => {
    pvRAF = requestAnimationFrame(loop);
    const dt = Math.min(0.05, pvClock.getDelta());
    const scr = document.getElementById('playerViewer');
    if(!scr || !scr.classList.contains('show') || !pvRenderer) return;
    if(!pvDragging){
      pvDragYaw += (pvVel + 0.12) * dt * 6;   // inercia + giro lento automático
      pvVel *= Math.pow(0.08, dt);
    }
    if(pvChar){
      pvChar.root.rotation.y = pvDragYaw;
      if(pvChar.mixer) pvChar.mixer.update(dt);
    }
    pvRenderer.render(pvScene, pvCamera);
  };
  loop();
}
function pvBuild(){
  if(!pvScene) return;
  if(pvChar){ pvScene.remove(pvChar.root); if(pvChar.mixer) pvChar.mixer.stopAllAction(); pvChar = null; }
  const pdata = pvRoster(pvTeam)[pvIndex];
  try{
    pvChar = buildPlayer(pvTeam, pdata);
    pvScene.add(pvChar.root);
    buildPlayerAnimations(pvChar);
    playerSetAnim(pvChar, 'idle');
    if(pvChar.mixer) pvChar.mixer.update(0.1);
    pvChar.root.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(pvChar.root);
    const c = new THREE.Vector3(); bb.getCenter(c);
    const sz = new THREE.Vector3(); bb.getSize(sz);
    // cámara más atrás: cuerpo completo, centrado, con aire arriba (libre del botón)
    pvCamera.position.set(0, c.y + sz.y * 0.05, sz.y * 2.6 + 0.8);
    pvCamera.lookAt(0, c.y, 0);
  }catch(e){ console.warn('[pv] build', e); }
  pvDragYaw = Math.PI;
  pvRenderStats();
}
function pvRenderStats(){
  const p = pvRoster(pvTeam)[pvIndex];
  const isField = pvIndex < TEAMS[pvTeam].players.length;
  const rb = document.getElementById('pvReorder');
  if(rb){ rb.style.display = isField ? 'block' : 'none'; rb.textContent = '🔄 ' + t('REORDENAR'); }
  document.getElementById('pvNum').textContent = p.num;
  document.getElementById('pvName').textContent = p.name;
  document.getElementById('pvPos').textContent = t(p.pos || '');
  (function(){ const s=p.stats||{}; const ovr=Math.round(((s.vel||0)+(s.tiro||0)+(s.pase||0)+(s.def||0)+(s.fis||0))/5);
    const g=window.gradeOf?window.gradeOf(ovr):''; const ge=document.getElementById('pvGrade');
    if(ge){ ge.textContent=g; ge.style.color=window.gradeColor?window.gradeColor(g):'#fff'; ge.style.borderColor=ge.style.color; }
    if(window.powerTier){ const tt=window.powerTier(ovr); const pp=document.getElementById('pvPos');
      if(pp) pp.innerHTML = t(p.pos||'') + ' · <span style="color:'+tt.col+';font-weight:900">'+tt.emb+' '+window.tierName(tt)+'</span>'; } })();
  const dots = document.getElementById('pvDots'); dots.innerHTML = '';
  for(let i = 0; i < pvRoster(pvTeam).length; i++){
    const d = document.createElement('span'); d.className = 'pvDot' + (i === pvIndex ? ' on' : ''); dots.appendChild(d);
  }
  const labels = { vel: t('Velocidad'), tiro: t('Tiro'), pase: t('Pase'), def: t('Defensa'), fis: t('Físico') };
  const bars = document.getElementById('pvBars'); bars.innerHTML = '';
  const s = p.stats || {};
  for(const k of ['vel', 'tiro', 'pase', 'def', 'fis']){
    const v = s[k] || 0;
    const lab = document.createElement('div'); lab.className = 'pvBarLabel'; lab.textContent = labels[k];
    const track = document.createElement('div'); track.className = 'pvBarTrack';
    const fill = document.createElement('div'); fill.className = 'pvBarFill'; fill.style.width = '0%';
    track.appendChild(fill);
    const val = document.createElement('div'); val.className = 'pvBarVal'; val.textContent = v;
    bars.appendChild(lab); bars.appendChild(track); bars.appendChild(val);
    requestAnimationFrame(() => { fill.style.width = v + '%'; });
  }
}
function openPlayerViewer(teamKey){
  pvTeam = teamKey; pvIndex = 0;
  document.getElementById('pvTopName').textContent = t(TEAMS[teamKey].name);
  document.getElementById('teamSelect').classList.remove('show');
  document.getElementById('playerViewer').classList.add('show');
  pvEnsureRenderer();
  requestAnimationFrame(() => { pvResize(); pvBuild(); });
  showCoach('pv',
    '👥 Acá ves a los jugadores del país: deslizá con las <b>flechas</b> para verlos y giralos arrastrando. Con <b>🔄 REORDENAR</b> los cambiás por figuritas que sacaste de los sobres. Tocá <b>INICIAR PARTIDO</b> para jugar.',
    '👥 Here you see the country\'s players: use the <b>arrows</b> to browse and drag to rotate them. With <b>🔄 REORDER</b> you swap them for stickers you pulled from packs. Tap <b>START MATCH</b> to play.');
}
function closePlayerViewer(){
  document.getElementById('playerViewer').classList.remove('show');
  document.getElementById('teamSelect').classList.add('show');
}
function pvCycle(dir){
  const n = pvRoster(pvTeam).length;
  pvIndex = (pvIndex + dir + n) % n;
  pvBuild();
}
document.getElementById('pvBack').addEventListener('click', closePlayerViewer);
document.getElementById('pvPrev').addEventListener('click', () => pvCycle(-1));
document.getElementById('pvNext').addEventListener('click', () => pvCycle(1));

// === REORDENAR: cambiar el jugador del slot por uno coleccionado del MISMO país ===
function pvOpenPicker(){
  const fieldCount = TEAMS[pvTeam].players.length;
  if(pvIndex >= fieldCount){ showFoulBanner ? null : 0; return; }   // arquero no se cambia
  // guardar plantel original una vez (para poder volver al "Original")
  const team = TEAMS[pvTeam];
  if(!team._origPlayers) team._origPlayers = team.players.map(p => Object.assign({}, p));
  const owned = (window.ownedByCountry ? window.ownedByCountry(team.name) : []) || [];
  document.getElementById('pvPickTitle').textContent = t('TU PLANTEL');
  const grid = document.getElementById('pvPickGrid');
  grid.innerHTML = '';
  const rarCol = { comun:'#3a82f7', raro:'#9b5cf6', legendario:'#f5b50a', mitico:'#e0115f' };
  const rarTxt = { comun:'COMÚN', raro:'RARO', legendario:'LEGENDARIO', mitico:'MÍTICO' };
  // opción Original
  const orig = team._origPlayers[pvIndex];
  const mk = (label, sub, ovr, col, onClick) => {
    const d = document.createElement('div'); d.className = 'pvPick';
    if(col) d.style.borderColor = col;
    d.innerHTML = '<div class="pn">' + label + '</div><div class="pp">' + sub + '</div>' +
                  (ovr != null ? '<div class="po">' + ovr + '</div>' : '');
    d.addEventListener('click', onClick); grid.appendChild(d);
  };
  const oOvr = orig.stats ? Math.round((orig.stats.vel+orig.stats.tiro+orig.stats.pase+orig.stats.def+orig.stats.fis)/5) : null;
  mk('★ ' + t('Original'), t(orig.pos || ''), oOvr, '#3a4560', () => { pvApplyPlayer(Object.assign({}, orig)); });
  if(!owned.length){
    const e = document.createElement('div'); e.style.cssText = 'grid-column:1/-1;color:#9fb0c8;text-align:center;font-size:13px;padding:14px';
    e.textContent = t('No tenés figuritas de este país todavía'); grid.appendChild(e);
  }
  for(const c of owned){
    const col = rarCol[c.rar] || '#3a4560';
    const sub = t(c.pos) + ' · ' + t(rarTxt[c.rar] || '');
    mk('#' + c.num + '  ' + c.name, sub, c.ovr, col, () => {
      pvApplyPlayer({ num:c.num, name:c.name, pos:c.pos, stats:c.stats, look:c.look });
    });
  }
  document.getElementById('pvPicker').classList.add('show');
}
function pvApplyPlayer(pdata){
  TEAMS[pvTeam].players[pvIndex] = pdata;
  document.getElementById('pvPicker').classList.remove('show');
  pvBuild();   // reconstruye el modelo + stats del slot
}
document.getElementById('pvReorder').addEventListener('click', pvOpenPicker);
document.getElementById('pvPickClose').addEventListener('click', () => document.getElementById('pvPicker').classList.remove('show'));

document.getElementById('pvPlay').addEventListener('click', () => {
  // El arquero es solo para ver specs: si está seleccionado, arranca con el capitán
  const fieldCount = TEAMS[pvTeam].players.length;
  const idx = (pvIndex < fieldCount) ? pvIndex : 0;
  chosenPlayerIndex = idx;
  document.getElementById('playerViewer').classList.remove('show');
  // MULTIJUGADOR: conectar a una sala del modo elegido
  // MODO BOTS LOCAL: arranca el juego de siempre (IA local), sin conexión al server.
  // El modo (1v1/2v2) queda guardado en window.selectedMode para uso futuro.
  startGame(pvTeam, idx);
});

// Pantalla de FIN DE PARTIDO
document.getElementById('ftReplay').addEventListener('click', restartMatch);
document.getElementById('ftExit').addEventListener('click', () => {
  matchOver = false;
  document.getElementById('fullTime').classList.remove('show');
  exitGame();
});

// === LOADING UI ===
function setLoadProgress(pct){
  document.getElementById('loadingFill').style.width = pct + '%';
}

// === INIT ===
(async () => {
  try{
    setupLogos();
    initScene();
    animate();
    
    setLoadProgress(10);
    
    // Cargar todo en paralelo
    await Promise.all([
      loadCourt(),
      loadBall(),
    ]);
    
    // Bosque (depende de courtBounds, así que después)
    buildForest();
    setLoadProgress(60);
    
    // BVH en paralelo
    bvhClipsRef = await loadBVHPack();
    console.log('[bvh] OK', Object.keys(bvhClipsRef).length, 'clips');
    setLoadProgress(100);

    // Personaje 3D del menú (ya hay pack BVH para animarlo) + gráficos por defecto
    initMenuCharacter();
    setGraphics('media');
    applyLang();
    
    setTimeout(() => {
      document.getElementById('loadingMsg').classList.add('hide');
      // Primera vez: TUTORIAL EN CANCHA literalmente antes del menú (sin cinemática)
      if(!tutorialSeen){
        tutorialIntro = true;
        document.getElementById('playScreen').classList.add('hide');
        const firstTeam = Object.keys(TEAMS)[0] || 'rezona';
        startGame(firstTeam, 0, false);   // monta la escena sin cinemática
        startFieldTutorial();              // arranca el tutorial al toque
      }
    }, 300);
  }catch(e){
    document.getElementById('loadingMsg').textContent = 'ERROR: '+e.message;
    console.error('FATAL', e);
  }
})();


// ════════════════════════════════════════════════════════════════════
//  MÓDULO DE RED · MULTIJUGADOR (Parte 3: conexión + tu jugador)
// ════════════════════════════════════════════════════════════════════
const NET_SERVER_URL = "wss://rezona-server-kymm.onrender.com";
window.NET = {
  active: false, room: null, client: null,
  sessionId: null, mode: "1v1",
  // estado crudo del server por jugador: { id: {x,z,rot,anim,team,hasBall,...} }
  serverPlayers: {}, serverBall: { x:0, y:0.11, z:0 },
};

async function netStartMatchmaking(teamKey, playerIdx){
  const mode = window.selectedMode || "1v1";
  window.NET.mode = mode;
  const teamData = TEAMS[teamKey];
  const pdata = (teamData.players[playerIdx]) || teamData.players[0];
  const country = teamData.name || teamKey;
  const num = pdata && pdata.num ? pdata.num : 10;

  // mostrar pantalla de búsqueda
  const mm = document.getElementById('mmScreen');
  mm.classList.add('show');
  setMM('BUSCANDO RIVAL…', (LANG==='en'?'Connecting to server…':'Conectando al servidor…'));

  // primero un ping http para despertar el server (Render free)
  try{
    const httpUrl = NET_SERVER_URL.replace(/^wss:/,'https:').replace(/^ws:/,'http:');
    setMM('BUSCANDO RIVAL…', (LANG==='en'?'Waking server (up to 30s)…':'Despertando server (hasta 30s)…'));
    await fetch(httpUrl, { method:'GET' });
  }catch(e){ /* seguimos igual; el join reintenta */ }

  try{
    setMM('BUSCANDO RIVAL…', (LANG==='en'?'Joining a room…':'Entrando a una sala…'));
    const client = new Colyseus.Client(NET_SERVER_URL);
    const room = await client.joinOrCreate("match", {
      mode, name: (country||'Jugador'), country, num
    });
    window.NET.client = client;
    window.NET.room = room;
    window.NET.sessionId = room.sessionId;
    netHookRoom(room, teamKey, playerIdx);
    const need = (mode==='2v2') ? 4 : 2;
    setMM('BUSCANDO RIVAL…', (LANG==='en'?('Waiting players 1/'+need):('Esperando jugadores 1/'+need)));
  }catch(err){
    setMM('ERROR', (LANG==='en'?'Could not connect: ':'No se pudo conectar: ') + (err.message||err));
  }
}

function setMM(title, info){
  const t = document.getElementById('mmTitle'); if(t) t.textContent = title;
  const i = document.getElementById('mmInfo'); if(i) i.textContent = info;
}
function renderMMPlayers(state){
  const box = document.getElementById('mmPlayers'); if(!box) return;
  box.innerHTML = '';
  state.players.forEach((p)=>{
    const tag = document.createElement('div');
    tag.className = 'mmTag ' + (p.team==='us'?'us':'them');
    tag.textContent = (p.country||p.name||'?');
    box.appendChild(tag);
  });
}

function netHookRoom(room, teamKey, playerIdx){
  let started = false;

  room.onStateChange((state)=>{
    // copiar estado del server a NET (para que el loop lo use)
    const sp = {};
    state.players.forEach((p, id)=>{
      sp[id] = { x:p.x, z:p.z, rot:p.rot, anim:p.anim, team:p.team,
                 hasBall:p.hasBall, country:p.country, name:p.name, num:p.num };
    });
    window.NET.serverPlayers = sp;
    window.NET.serverBall = { x:state.ball.x, y:state.ball.y, z:state.ball.z };

    if(window.NET.active) return;   // ya arrancó: solo actualizar datos

    // todavía en sala de espera
    const need = state.needed || 2;
    const have = state.players.size;
    renderMMPlayers(state);
    setMM('BUSCANDO RIVAL…',
      (LANG==='en'?('Waiting players '+have+'/'+need):('Esperando jugadores '+have+'/'+need)));

    // cuando el server marca "playing" → arrancar la escena 3D una sola vez
    if(state.phase === 'playing' && !started){
      started = true;
      document.getElementById('mmScreen').classList.remove('show');
      window.NET.active = true;
      // montar la escena 3D normal (sin cinemática para entrar rápido)
      startGame(teamKey, playerIdx, false);
    }
  });

  room.onLeave(()=>{
    window.NET.active = false;
    window.NET.room = null;
  });
  room.onError((code, msg)=>{
    setMM('ERROR', 'cod ' + code + ' · ' + (msg||''));
  });
}

// ── CALIBRACIÓN: coordenadas del server ↔ tu cancha 3D real ──
// Server: x ∈ [-30,30] (largo), z ∈ [-18,18] (ancho). "us" ataca a +x.
const SRV = { halfLong: 30, halfWide: 18 };
function netToWorld(sx, sz){
  // normalizar a [-1,1]
  const nl = sx / SRV.halfLong;     // largo
  const nw = sz / SRV.halfWide;     // ancho
  if(!fieldLimits){ return { x: sx*0.4, z: sz*0.4 }; }
  const cxF = (fieldLimits.minX + fieldLimits.maxX)/2;
  const czF = (fieldLimits.minZ + fieldLimits.maxZ)/2;
  const halfX = (fieldLimits.maxX - fieldLimits.minX)/2;
  const halfZ = (fieldLimits.maxZ - fieldLimits.minZ)/2;
  if(fieldAxis === 'x'){
    // largo = X de la cancha, ancho = Z
    return { x: cxF + nl * halfX, z: czF + nw * halfZ };
  } else {
    // largo = Z de la cancha, ancho = X
    return { x: cxF + nw * halfX, z: czF + nl * halfZ };
  }
}
// rotación del server (atan2(mx,mz)) → rotación visual del modelo en tu cancha
function netRotToWorld(srot){
  // el modelo del juego mira con compensación +PI (clips CMU)
  // mapeamos el rumbo del server al eje de tu cancha
  // server: dir = (sin(srot)=X, cos(srot)=Z) en espacio server
  const dsx = Math.sin(srot), dsz = Math.cos(srot);
  let wx, wz;
  if(fieldAxis === 'x'){ wx = dsx; wz = dsz * (SRV.halfWide/SRV.halfLong)*0 + dsz; }
  else { wx = dsz; wz = dsx; }
  // normalizar dirección en mundo
  const m = Math.hypot(wx, wz) || 1; wx/=m; wz/=m;
  return Math.atan2(wx, wz) + Math.PI;
}

// Enviar inputs al server ~25Hz (joystick relativo a la CÁMARA)
let _netInputAcc = 0;
function netSendInput(dt){
  if(!window.NET.active || !window.NET.room) return;
  _netInputAcc += dt;
  if(_netInputAcc < 0.03) return;   // ~33Hz (más responsivo)
  _netInputAcc = 0;

  const vx = joystickState.vx || 0;
  const vy = joystickState.vy || 0;
  // dirección deseada en MUNDO, relativa a la cámara (igual que el juego local)
  let wmx = 0, wmz = 0;
  if(Math.hypot(vx, vy) > 0.05 && typeof camera !== 'undefined'){
    // vector forward/right de la cámara proyectado al plano
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir); camDir.y = 0; camDir.normalize();
    const camRight = new THREE.Vector3(camDir.z, 0, -camDir.x);   // perpendicular
    // joystick: vy<0 = arriba = adelante (camDir), vx>0 = derecha (camRight)
    wmx = camDir.x * (-vy) + camRight.x * vx;
    wmz = camDir.z * (-vy) + camRight.z * vx;
  }
  // convertir esa dirección de MUNDO a ejes del SERVER (inverso de netToWorld)
  let smx = 0, smz = 0;
  if(fieldAxis === 'x'){ smx = wmx; smz = wmz; }
  else { smx = wmz; smz = wmx; }   // largo=Z, ancho=X → intercambiar
  // NO invertimos por equipo: la dirección es absoluta en el mundo y el server
  // la aplica tal cual (cada jugador se mueve hacia donde apunta su joystick).

  window.NET.room.send("input", {
    mx: smx, mz: smz,
    kick: !!window._netKick,
    pass: !!window._netPass,
    sprint: !!(typeof buttons!=='undefined' && buttons.sprint),
  });
  window._netKick = false; window._netPass = false;
}

// Mapear país (TEAMS[].name) → teamKey
function netTeamKeyForCountry(country){
  if(!country) return Object.keys(TEAMS)[0];
  for(const k in TEAMS){ if((TEAMS[k].name||'').toLowerCase() === String(country).toLowerCase()) return k; }
  return Object.keys(TEAMS)[0];
}

// Crear (una vez) el modelo 3D de un jugador remoto
function netSpawnRemote(id, p){
  const teamKey = netTeamKeyForCountry(p.country);
  const team = TEAMS[teamKey];
  const pdata = (team.players && team.players[0]) ? team.players[0] : { num: p.num||10, look:{} };
  let model;
  try{ model = buildPlayer(teamKey, pdata); }
  catch(e){ return null; }
  model.root.scale.multiplyScalar(0.6);
  model.team = p.team;
  model.isRemote = true;
  model.root.position.set(p.x, (typeof fieldGroundY!=='undefined'?fieldGroundY:0.11), p.z);
  model.root.rotation.y = p.rot || 0;
  scene.add(model.root);
  try{ buildPlayerAnimations(model); }catch(e){}
  return model;
}

function netUpdate(dt){
  if(!window.NET.active) return;
  const sp = window.NET.serverPlayers || {};
  const models = window.NET.models || (window.NET.models = {});
  const k = 0.45;   // factor de interpolación (más firme, menos elástico)

  // 1) recorrer jugadores del server
  for(const id in sp){
    const p = sp[id];
    const w = netToWorld(p.x, p.z);          // → posición en tu cancha real
    const wy = (typeof fieldGroundY !== 'undefined' ? fieldGroundY : 0);
    const wrot = netRotToWorld(p.rot);
    if(id === window.NET.sessionId){
      // MI jugador: PREDICCIÓN LOCAL para que se sienta instantáneo (sin lag)
      if(player && player.root){
        const vx = joystickState.vx || 0, vy = joystickState.vy || 0;
        const mag = Math.hypot(vx, vy);
        if(mag > 0.08 && typeof camera !== 'undefined'){
          // mover ya hacia donde apunta el joystick (relativo a cámara)
          const camDir = new THREE.Vector3(); camera.getWorldDirection(camDir); camDir.y=0; camDir.normalize();
          const camRight = new THREE.Vector3(camDir.z,0,-camDir.x);
          let mxw = camDir.x*(-vy) + camRight.x*vx;
          let mzw = camDir.z*(-vy) + camRight.z*vx;
          const ml = Math.hypot(mxw,mzw)||1; mxw/=ml; mzw/=ml;
          const spd = 6.5 * ((typeof buttons!=='undefined'&&buttons.sprint)?1.5:1);
          player.root.position.x += mxw * spd * dt;
          player.root.position.z += mzw * spd * dt;
          player.root.rotation.y = Math.atan2(mxw, mzw) + Math.PI;
          playerSetAnim(player, 'run', 1.1);
          // corrección suave hacia el server (reconciliación leve, evita drift)
          player.root.position.x += (w.x - player.root.position.x) * 0.06;
          player.root.position.z += (w.z - player.root.position.z) * 0.06;
        } else {
          // quieto: seguir al server normal
          player.root.position.x += (w.x - player.root.position.x) * 0.25;
          player.root.position.z += (w.z - player.root.position.z) * 0.25;
          playerSetAnim(player, p.anim === 'run' ? 'run' : 'idle', 1.1);
        }
        player.root.position.y = wy;
      }
      continue;
    }
    // jugador remoto: crear si no existe
    if(!models[id]){
      const m = netSpawnRemote(id, p);
      if(m){ const w0 = netToWorld(p.x, p.z); m.root.position.set(w0.x, wy, w0.z); models[id] = m; }
      continue;
    }
    const m = models[id];
    if(!m || !m.root) continue;
    m.root.position.x += (w.x - m.root.position.x) * k;
    m.root.position.z += (w.z - m.root.position.z) * k;
    m.root.position.y = wy;
    let d = wrot - m.root.rotation.y;
    while(d>Math.PI)d-=Math.PI*2; while(d<-Math.PI)d+=Math.PI*2;
    m.root.rotation.y += d * k;
    playerSetAnim(m, p.anim === 'run' ? 'run' : 'idle', 1.1);
  }

  // 2) limpiar modelos de jugadores que ya no están
  for(const id in models){
    if(!sp[id]){
      try{ scene.remove(models[id].root); }catch(e){}
      delete models[id];
    }
  }

  // 3) pelota
  if(ballModel){
    const b = window.NET.serverBall;
    const wb = netToWorld(b.x, b.z);
    const by = (typeof fieldGroundY !== 'undefined' ? fieldGroundY : 0) + Math.max(0, b.y - 0.11) + 0.11;
    ballModel.position.x += (wb.x - ballModel.position.x) * 0.4;
    ballModel.position.z += (wb.z - ballModel.position.z) * 0.4;
    ballModel.position.y += (by - ballModel.position.y) * 0.4;
  }

  // 4) marcador
  if(window.NET.room && window.NET.room.state){
    const st = window.NET.room.state;
    const el = document.getElementById('hudScore');
    if(el) el.textContent = st.scoreUs + ' - ' + st.scoreThem;
  }
}

window.netStartMatchmaking = netStartMatchmaking;
window.netSendInput = netSendInput;
window.netUpdate = netUpdate;

// cancelar búsqueda
document.getElementById('mmCancel').addEventListener('click', ()=>{
  try{ if(window.NET.room) window.NET.room.leave(); }catch(e){}
  window.NET.active = false; window.NET.room = null;
  document.getElementById('mmScreen').classList.remove('show');
  document.getElementById('playerViewer').classList.add('show');
});
