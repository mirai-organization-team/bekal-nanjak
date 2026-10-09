/* Bekal Nanjak: logika dan tampilan aplikasi. Membutuhkan data.js. */
/* ===================== BAHASA ===================== */
let S;
const L=(id,en)=>S&&S.lang==="en"?en:id;
const LOC=()=>S.lang==="en"?"en-GB":"id-ID";

const term=(k,txt)=>`<button type="button" class="term" data-act="term" data-k="${k}">${txt||L(...GLOSS[k][0])}</button>`;

/* ===================== STATE ===================== */
const KEY="bekal-nanjak:v3", HKEY="bekal-nanjak:history";
const pad=n=>String(n).padStart(2,"0");
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const addDays=(s,n)=>{const d=new Date(s+"T00:00:00");d.setDate(d.getDate()+n);return ymd(d)};
const todayStr=()=>ymd(new Date());
const dmy=v=>{ if(!v) return "--/--/----"; const [y,m,d]=v.split("-"); return `${d}/${m}/${y}`; };
const dateField=(attrs,v)=>`<span class="dwrap"><span class="dval">${dmy(v)}</span><input type="date" ${attrs} value="${v||""}"></span>`;
const timeField=(attrs,v)=>`<span class="dwrap"><span class="dval">${v||"--:--"}</span><input type="time" ${attrs} value="${v||""}"></span>`;
const fullDate=v=>!!v&&+v.slice(0,4)>=1900;
function defaults(){const st=addDays(todayStr(),7);return{
  view:"welcome", step:0, lang:"id", pid:null,
  prov:"", mountain:"", route:"", base:"", peakManual:"", upManual:"", downManual:"",
  type:"multi", start:st, end:addDays(st,1), startTime:"08:00", pace:"slow",
  sex:"m", age:25, height:168, weight:62, load:12, cold:true, light:false, veg:false,
  meals:{}, custom:{}, ownFoods:{}, prices:{}, kcalOv:{}, snackShift:{}, waterSrc:"unknown", instant:false, prep:{}, costs:{ticket:0,transport:0,other:0}, saver:false, helpTab:"how", people:1, got:{}, shareMode:"list", members:[], assign:{}, recipeOf:{}, taskM:0, sent:{}, avoid:{}, trail:{done:{},water:{}}, trailDay:null, bcPhone:"", adjFood:1, adjWater:1, noteFor:null, reserve:"meal", tipsOpen:false, editPrice:false, edit:null, term:null, exp:"first", tab:"sum"
}}
S=defaults();
try{const s=JSON.parse(localStorage.getItem(KEY)||"null"); if(s&&typeof s==="object") S={...defaults(),...s,view:"welcome",edit:null,term:null,confirm:null};}catch(e){}
if(!S.seenIntro){S.view="intro";S.introI=0;}
applyKcal();
let HIST=[]; try{HIST=JSON.parse(localStorage.getItem(HKEY)||"[]")||[]}catch(e){HIST=[]}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function saveHist(){try{localStorage.setItem(HKEY,JSON.stringify(HIST))}catch(e){}}

/* ===================== UTIL ===================== */
const $=s=>document.querySelector(s);
const nf=(n,o)=>Number(n).toLocaleString(LOC(),o);
const fmt=n=>nf(Math.round(n));
const dec=n=>nf(Math.round(n*2)/2);
const kg=g=>nf(g/1000,{maximumFractionDigits:1})+" kg";
const rp=n=>"Rp"+nf(Math.round(n/100)*100);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const food=id=>FOODS[id]||S.ownFoods[id];
const fname=id=>{const f=food(id);return f?(Array.isArray(f.n)?L(f.n[0],f.n[1]):f.n):"?"};
const funit=id=>{const f=food(id);return f?(Array.isArray(f.u)?L(f.u[0],f.u[1]):f.u):""};
const fprice=id=>id in S.prices?+S.prices[id]:(food(id)?food(id).p||0:0);
function qty(id,q){ if(id==="garam") return L("secukupnya","to taste");const u=funit(id);return /^\d/.test(u)?(q>1?`${q} × ${u}`:u):`${q} ${u}`}
const nut=list=>list.reduce((a,[id,q])=>{const f=food(id); if(f){a.pr+=(f.pr||0)*q; a.fb+=(f.fb||0)*q; a.g[f.c]=1;} return a},{pr:0,fb:0,g:{}});
const kOf=list=>list.reduce((a,[id,q])=>a+(food(id)?food(id).k*q:0),0);
const days=()=>S.type==="oneday"?1:Math.max(2,Math.round((new Date(S.end+"T00:00:00")-new Date(S.start+"T00:00:00"))/864e5)+1||2);
const durLabel=n=>n===1?L("Tektok 1 hari","Day hike"):L(`${n} hari ${n-1} malam`,`${n} days ${n-1} night${n>2?"s":""}`);
function dayDate(i,long=true){
  const d=new Date(S.start+"T00:00:00"); if(isNaN(d)) return "";
  d.setDate(d.getDate()+i);
  return d.toLocaleDateString(LOC(),long?{weekday:"long",day:"numeric",month:"long"}:{day:"numeric",month:"short",year:"numeric"});
}
const mt=()=>MT[S.mountain];
const routesOf=k=>ROUTES[k]||[];
const isManual=()=>S.route==="manual";
const route=()=>{if(!S.mountain||!S.route) return null; if(isManual()) return {id:"manual",n:L("Jalur lain","Other trail")}; return routesOf(S.mountain).find(r=>r.id===S.route)||null};
function routeData(){
  const m=mt(), r=route(); if(!m||!r) return null;
  if(isManual()){
    const base=+S.base, peak=+S.peakManual||m.peak, up=+S.upManual, down=+S.downManual;
    if(!(base>0&&peak>base&&up>0&&down>0)) return null;
    return {base,peak,up,down};
  }
  const f=PACE[S.pace]||1;
  return {base:r.base,peak:r.peak||m.peak,up:r.up*f,down:r.down*f};
}
const BACK='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
const CHEV='<svg class="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
const TOPO='<svg class="topo" aria-hidden="true"><use href="#topo"/></svg>';
const LOGO='<svg class="logo" aria-hidden="true"><use href="#logo"/></svg>';

/* ===================== PERHITUNGAN ===================== */
function slotsOfDay(i,n){const o=ORDER.filter(s=>!(s==="malam"&&i===n-1)); if(n>1&&i===n-1&&S.summitAtk!==false) o.splice(1,0,"summit"); return o;}
function defaultMealOn(i,slot,n){
  const h=parseInt(S.startTime,10); const startH=isFinite(h)?h:8;
  if(n===1) return slot==="cemilan"||(slot==="siang"&&startH<13);
  if(slot==="malam"&&i===n-1) return false;
  if(i===0){ if(slot==="sarapan") return false; if(slot==="siang") return startH<14; return true; }
  if(i===n-1){ if(slot==="siang") return false; return true; }
  return true;
}
function mealOn(i,slot){const k=`d${i}-${slot}`;return (k in S.meals)?S.meals[k]:defaultMealOn(i,slot,days())}
function hoursPerDay(rd,n){
  if(n===1) return [{up:rd.up,down:rd.down,downC:0}];
  const sa=S.summitAtk!==false;
  return Array.from({length:n},(_,i)=>i<n-1?{up:rd.up*0.8/(n-1),down:0,downC:0}:{up:rd.up*0.2,down:rd.down,downC:sa?rd.up*0.2*0.6:0});
}
const SNACK_CAP=180;
// kemasan beli yang umum di minimarket: [label, label EN, isi (dalam satuan makan)]
const BUY={beras:["kantong 1 kg","1 kg bag",10],kentang:["kg","kg",6],oat:["kotak isi 8 sachet","box of 8",8],roti:["bungkus ±16 lembar","loaf of ~16 slices",8],
  abon:["bungkus 100 g","100 g pack",3],tempe:["bungkus 150 g","150 g pack",3],teri:["bungkus 100 g","100 g pack",3],kurma:["kotak 250 g (±25 butir)","250 g box (~25)",5],
  kismis:["kotak 150 g","150 g box",5],kacang:["bungkus 150 g","150 g bag",5],aren:["keping 250 g","250 g block",8],biskuitkelapa:["bungkus 300 g","300 g pack",10],
  crackers:["bungkus 250 g","250 g pack",10],keripikpisang:["bungkus 150 g","150 g bag",5],pisangsale:["bungkus 250 g","250 g pack",5],dodol:["bungkus 250 g","250 g pack",8],
  tingting:["bungkus 150 g","150 g pack",6],permen:["bungkus isi 50","bag of 50",10],permenjahe:["bungkus isi 50","bag of 50",10],kejustik:["bungkus 150 g","150 g pack",5],
  gummy:["bungkus 100 g","100 g bag",4],cokelatkoin:["bungkus 100 g","100 g bag",4],kacangatom:["bungkus 150 g","150 g bag",5],biskuit:["bungkus 250 g","250 g pack",4],keripik:["bungkus 70 g","70 g bag",2],
  madu:["kotak isi 12","box of 12",12],kopi:["renceng isi 10","strip of 10",10],teh:["renceng isi 10","strip of 10",10],jahe:["renceng isi 10","strip of 10",10],
  energen:["renceng isi 10","strip of 10",10],skm:["renceng isi 6","strip of 6",6],susububuk:["renceng isi 10","strip of 10",10],elektrolit:["kotak isi 5","box of 5",5],
  minyak:["botol 250 ml","250 ml bottle",17],gula:["bungkus 250 g","250 g pack",25],kecap:["renceng isi 10","strip of 10",10],saussambal:["renceng isi 10","strip of 10",10],
  sambal:["renceng isi 10","strip of 10",10],kaldu:["renceng isi 10","strip of 10",10],saustiram:["renceng isi 10","strip of 10",10],
  bawangmerah:["±100 g (±20 siung)","~100 g (~20 cloves)",20],bawangputih:["±100 g (±25 siung)","~100 g (~25 cloves)",25],cabai:["±50 g (±15 buah)","~50 g (~15)",15],
  sayurmix:["paket sayur 300 g","300 g veg pack",2],sawi:["ikat ±250 g","bunch ~250 g",2],daunbawang:["ikat (±5 batang)","bunch (~5)",5],pisang:["sisir (±8 buah)","hand (~8)",8],
  tepungbumbu:["bungkus 80 g","80 g pack",1.6],sosis:["pak isi 10","pack of 10",5],tahu:["bungkus isi 10","pack of 10",5],tempementah:["papan 250 g","250 g slab",2.5],
  keju:["pak isi 10 lembar","pack of 10",10],selaikacang:["toples 170 g","170 g jar",5],selaicoklat:["toples 170 g","170 g jar",5],granola:["bungkus 250 g","250 g bag",5],
  spaghetti:["bungkus 450 g","450 g pack",4.5],makaroni:["bungkus 250 g","250 g pack",2.5],bihun:["bungkus 200 g","200 g pack",2],telurmentah:["pak isi 10","pack of 10",10],
  garam:["bungkus kecil","small pack",9999]};
function gQ(R,id,q0){ const P=S.people||1; return P===1?q0:Math.max(1,Math.round(q0*(R.GF||P))); }
function buyRow(R,id,q0){ const use=gQ(R,id,q0), b=BUY[id];
  if(b){ const packs=Math.max(1,Math.ceil(use/b[2]-1e-9)); return {use,packs,label:`${packs} × ${L(b[0],b[1])}`,cost:id==="garam"?2000:packs*Math.round(b[2]*fprice(id)/100)*100,b}; }
  return {use,packs:use,label:qty(id,use),cost:use*fprice(id),b:null}; }
function buyTotal(R){ return Object.entries(R.shop).reduce((a,[id,q])=>a+buyRow(R,id,q).cost,0); }
function snackStops(trekH){ const I=(S.snackEvery||60)/60; return Math.max(0,Math.floor((trekH-0.25)/I)); }
const SNACK_PACKS=[
  [["kurma",1],["waferkaramel",1],["permenjahe",1],["aren",1],["coklat",1]],
  [["biskuitkelapa",1],["pisangsale",1],["cokelatkoin",1],["kismis",1],["permen",1]],
  [["serealbar",1],["dodol",1],["gummy",1],["crackers",1],["jelly",1]],
  [["kurma",1],["energybar",1],["wafer",1],["aren",1],["kacang",1]]
];
const HEAVY_SNACK=["keripik","keripikpisang","kejustik","kacangatom","tingting","biskuit"];
const PACK_NAME=[["Paket klasik","Classic pack"],["Paket manis gurih","Sweet and savoury pack"],["Paket renyah","Crunchy pack"],["Paket energi","Energy pack"]];
function cookExtra(pr){
  const has=id=>pr.items.some(([x])=>x===id), any=a=>a.some(has);
  const home=[], fire=[], vari=[];
  if(any(["bawangmerah","bawangputih","cabai","tomat"])) home.push(L("Iris atau ulek bawang dan cabai di rumah, simpan di ziplock kecil.","Slice or pound the shallots, garlic, and chillies at home and keep them in a small zip bag."));
  if(has("beras")) home.push(L("Takar beras per masak di ziplock. Rendam 30 menit sebelum dimasak supaya cepat matang.","Measure rice per meal into zip bags. Soak 30 minutes before cooking so it cooks faster."));
  if(any(["sayurmix","sawi","daunbawang"])) home.push(L("Cuci dan keringkan sayur, potong saat akan dimasak.","Wash and dry the vegetables; cut them just before cooking."));
  if(any(["ayamungkep","tempegoreng","tahubacem"])) home.push(L("Masak lauk sampai kering, dinginkan, lalu bekukan semalaman.","Cook the sides dry, cool them, and freeze overnight."));
  if(has("tepungbumbu")) home.push(L("Bawa tepung bumbu kering, tambahkan air saat akan menggoreng.","Bring the seasoned flour dry and add water just before frying."));
  if(has("beras")) fire.push(L("Nasi: 1 bagian beras, 1,5 bagian air. Api besar sampai mendidih, kecilkan, tutup 15 menit, lalu diamkan 5 menit tanpa dibuka.","Rice: 1 part rice to 1.5 parts water. High heat to a boil, then low, covered, for 15 minutes; rest 5 minutes unopened."));
  if(any(["mie","spaghetti","makaroni","bihun"])) fire.push(L("Didihkan air dulu, baru masukkan. Tambah 2–3 menit dari petunjuk kemasan.","Bring water to a boil first, then add. Allow 2–3 minutes more than the pack says."));
  if(has("minyak")) fire.push(L("Goreng dengan api sedang di wajan kecil. Minyak secukupnya saja supaya hemat.","Fry on medium heat in a small pan, with just enough oil."));
  if(has("kentang")) fire.push(L("Potong kentang kecil supaya cepat empuk.","Cut potatoes small so they soften faster."));
  if(any(["beras","mie","spaghetti","nasiinstan"])&&!S.veg) vari.push(L("Tambah sosis, teri, atau telur untuk protein ekstra.","Add sausage, anchovies, or egg for extra protein."));
  if(any(["beras","mie","spaghetti","nasiinstan"])&&S.veg) vari.push(L("Tambah tempe, tahu, atau telur untuk protein ekstra.","Add tempeh, tofu, or egg for extra protein."));
  return {home,fire,vari};
}
function howtoHTML(pr){
  const X=cookExtra(pr), ul=a=>`<ul class="mini">${a.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>`;
  const lab=t=>`<p class="sub2">${t}</p>`;
  return `<p class="hint" style="margin:4px 0">±${pr.mins} ${L("menit","min")}, ${esc(L(...pr.tool))}</p>
    ${X.home.length?lab(L("Siapkan di rumah","Prepare at home"))+ul(X.home):""}
    ${lab(L("Langkah","Steps"))}<ol>${pr.steps.map(st=>`<li>${esc(L(...st))}</li>`).join("")}</ol>
    ${X.fire.length?lab(L("Takaran dan api","Amounts and heat"))+ul(X.fire):""}
    ${pr.tool[0]!=="Tanpa masak"&&pr.tool[0]!=="Dibuat di rumah"?lab(L("Tips di ketinggian","At altitude"))+ul([L("Air mendidih di bawah 100°C (±90°C di 3.000 mdpl), jadi masakan lebih lama matang.","Water boils below 100°C (about 90°C at 3,000 m), so food takes longer."),L("Selalu tutup panci dan pakai penahan angin supaya hemat gas.","Always cover the pot and use a windshield to save gas.")]):""}
    ${X.vari.length?lab(L("Variasi","Variations"))+ul(X.vari):""}
    ${pr.tip?`<p class="note">${esc(L(...pr.tip))}</p>`:""}`;
}
function templateRecipe(slot,i){
  const veg=S.veg, light=S.light;
  if(S.instant){ if(slot==="sarapan") return "bubur"; if(slot==="malam") return veg?null:"nasiinstankari"; return null; }
  if(slot==="sarapan") return light?"oatpisang":(i<=2?"nasgorkampung":"rotiselai");
  if(slot==="malam"){ if(light) return null; if(veg) return i===0?"bacem":(i===1?"tempeorek":null); return i===0?"ayamsambal":(i===1?"teluresop":"liwet"); }
  return null;
}
function template(slot,i){
  const veg=S.veg, light=S.light, rid=templateRecipe(slot,i);
  if(rid){
    const pr=PRESETS.find(p=>p.id===rid);
    const kb=pr.items.find(([id])=>FOODS[id].c==="karbo"); const flexId=kb?kb[0]:pr.items[0][0];
    const drink=slot==="sarapan"?(rid==="nasgorkampung"?"jahe":"kopi"):(i===0?"jahe":i===1?"coklatpanas":"teh");
    const out=pr.items.map(([id,q])=>[id,q,id===flexId?1:0]);
    if(slot==="malam"&&rid==="ayamsambal") out.push(["tahubacem",1,0]);
    if(slot==="sarapan"&&rid==="rotiselai") out.push(["skm",1,0]);
    return out.concat([[drink,1,0]]);
  }
  switch(slot){
    case "siang": return (i===0&&!light)?[[veg?"nasibtempe":"nasibayam",1,0],["pisang",1,0]]:[["rotisi",2,1],[veg?"tempe":"abon",1,0],["jeruk",1,0]];
    case "malam": if(S.instant) return [["nasiinstan",1,1],["tempe",1,0],["sop",1,0],["jahe",1,0]]; return light?[["mie",1,1],[veg?"tempe":"abon",1,0],["sop",1,0],["jahe",1,0]]:[["beras",1,1],["tempe",1,0],["sop",1,0],["sambal",1,0],["teh",1,0]];
    case "sarapan": return [["oat",2,1],["pisang",1,0],["kopi",1,0]];
    case "cemilan": return light?[["kacang",3,1],["coklat",2,1],["kurma",2,1],["energybar",1,1]]:SNACK_PACKS[(S.snackShift&&S.snackShift["d"+i]||0)+i&3].map(([id,q])=>[id,q,1]);
    case "cadangan": return [["mie",1,0],["biskuit",1,1],["coklat",1,1],["aren",1,1]];
    case "summit": return [["coklat",1,1],["kurma",1,1],["aren",1,1],["energybar",1,1],["elektrolit",1,0]];
  }
  return [];
}
function mealRecipes(key,slot,i){ if(S.custom[key]) return (S.recipeOf&&S.recipeOf[key])||[]; const r=templateRecipe(slot,i); return r?[r]:[]; }
const TAGS={
  nuts:["kacang","selaikacang","kacangatom","tingting"],
  seafood:["sarden","teri","tuna","saustiram"],
  dairy:["kopisusukemasan","keju","susububuk","skm","coklatpanas","energen","kejustik","susuuht"],
  egg:["telur","telurmentah","nasibtelur"],
  sugar:["juskotak","tehkotak","kacanghijau","kopisusukemasan","aren","gula","madu","permen","jelly","skm","selaicoklat","teh","jahe","coklatpanas","energen","gummy","dodol","permenjahe","waferkaramel"],
  fiber:["sayurmix","sawi","kismis","oat","kacang","apel","jeruk","pisangsale","granola","keripikpisang","kurma"],
  meat:["abon","sosis","sarden","kornet","rendang","dendeng","ayamungkep","teri","tuna","nugget","saustiram","karipouch","semurpouch","nasibayam"]
};
const AVOID_LBL={fiber:["Kurangi serat","Less fibre"],nuts:["Tanpa kacang","No nuts"],seafood:["Tanpa seafood","No seafood"],dairy:["Tanpa susu","No dairy"],egg:["Tanpa telur","No eggs"],sugar:["Kurangi gula","Less sugar"]};
const ALT={sayur:["sop","tomat","pisang"],karbo:["beras","roti","bubur"],protein:["tempe","tempegoreng","tahubacem","abon","ayamungkep","telurmentah","sosis","kornet"],camilan:["kurma","biskuitkelapa","crackers","keripikpisang","pisangsale","serealbar","kismis","biskuit","energybar","pisang","coklat","wafer"],minum:["kopi","elektrolit"],karbo:["beras","oat","roti"]};
function avoidTags(){ const t=Object.keys(S.avoid||{}).filter(k=>S.avoid[k]); if(S.veg) t.push("meat"); return t; }
function avoidedBy(id){ return avoidTags().filter(t=>TAGS[t].includes(id)); }
const isAvoided=id=>avoidedBy(id).length>0;
function filterAvoid(t){
  const present=new Set(t.map(x=>x[0])); let out=[];
  t.forEach(([id,q,f])=>{
    if(!isAvoided(id)){ out.push([id,q,f]); return; }
    const alt=(ALT[FOODS[id].c]||[]).find(a=>!isAvoided(a)&&!present.has(a));
    if(alt){ present.add(alt); out.push([alt,q,f]); } else if(f) out.push(["beras",1,1]);
  });
  if(out.length&&!out.some(x=>x[2])) out[0][2]=1;
  return out;
}
const avoidNote=id=>{const t=avoidedBy(id); return t.length?t.map(k=>k==="meat"?L("daging","meat"):L(...AVOID_LBL[k]).replace(/^(Tanpa |Kurangi |No |Less )/,"").toLowerCase()).join(", "):"";};
function suggest(slot,i,target){
  const t=filterAvoid(template(slot,i)); let fixed=0,flexK=0;
  t.forEach(([id,q,f])=>{if(f) flexK+=FOODS[id].k*q; else fixed+=FOODS[id].k*q});
  const remain=Math.max(0,target-fixed);
  return t.map(([id,q,f])=>f?[id,capQ(id,Math.max(1,Math.round(remain*(FOODS[id].k*q/flexK)/FOODS[id].k)),slot==="cemilan"||slot==="cadangan")]:[id,q]);
}
function itemsFor(key,slot,i,target,stops){
  if(S.custom[key]) return S.custom[key].filter(([id,q])=>food(id)&&q>0);
  const it=suggest(slot,i,target);
  if(slot==="cemilan"&&stops){
    let units=it.reduce((a,[,q])=>a+q,0); const fill=["kurma","aren","permen","kismis","biskuit"].filter(x=>!isAvoided(x)); let f=0; if(!fill.length) fill.push("kurma");
    while(units<stops){ const id=fill[f++%fill.length]; const x=it.find(y=>y[0]===id); if(x) x[1]++; else it.push([id,1]); units++; }
  }
  return it;
}
function calc(){
  const rd=routeData(); if(!rd) return null;
  const n=days(), gain=Math.max(100,rd.peak-rd.base);
  const bmr=10*S.weight+6.25*S.height-5*S.age+(S.sex==="m"?5:-161);
  const pf=isManual()?1:(PACE[S.pace]||1);
  const metUp=clamp(5.5+(gain/Math.max(.5,rd.up/pf))/120,5.5,9.5);
  const coldF=S.cold?1.3:1.2;
  const D=hoursPerDay(rd,n).map((h,i)=>{
    const trekH=h.up+h.down+(h.downC||0);
    const coef=(metUp*h.up+4.5*(h.down+(h.downC||0)))/pf, restH=Math.max(0,24-trekH);
    const trekK=coef*(S.weight+S.load), restK=bmr/24*restH*coldF;
    const need=trekK+restK;
    const campW=n>1?((i<n-1?1.0:0)+(i>0?0.4:0)):0.3;
    const water=Math.round((trekH*0.6+campW)*(S.adjWater||1)*2)/2;
    const adj=S.adjFood||1, stops=snackStops(trekH);
    const T={}; ORDER.concat(["summit"]).forEach(sl=>{ const raw=need*SLOTS[sl].share; T[sl]=sl==="cemilan"?Math.min(raw,Math.max(150,stops*SNACK_CAP)):sl==="summit"?Math.min(raw,450):Math.min(raw,CAP[sl]); });
    const extra=Math.max(0,need*SLOTS.cemilan.share-T.cemilan);
    const recv=["siang","malam"].filter(sl=>slotsOfDay(i,n).includes(sl)&&mealOn(i,sl));
    recv.forEach(sl=>{ T[sl]=Math.min(sl==="siang"?1000:1200,T[sl]+extra/recv.length); });
    const meals=slotsOfDay(i,n).map(slot=>{
      const key=`d${i}-${slot}`, on=mealOn(i,slot), target=T[slot]*adj;
      return {key,slot,on,target,custom:!!S.custom[key],items:on?itemsFor(key,slot,i,target,slot==="cemilan"?stops:0):[]};
    });
    const packed=meals.reduce((a,m)=>a+kOf(m.items),0);
    const home=need*ORDER.filter(sl=>!meals.some(m=>m.slot===sl&&m.on)).reduce((a,sl)=>a+SLOTS[sl].share,0);
    return {i,trekH,need,trekK,water,meals,up:h.up,down:h.down,downC:h.downC||0,packed,home,gap:Math.max(0,need-packed-home),coef,restH};
  });
  // kebutuhan tiap anggota rombongan dibanding kebutuhanmu
  const PP=S.people||1, myNeed=D.reduce((a,d)=>a+d.need,0);
  const factors=Array.from({length:PP},(_,m)=>{ const b=m>0&&S.mbody&&S.mbody[m]; if(!b) return 1;
    const w=+b.weight||S.weight, age=+b.age||S.age, sex=b.sex||S.sex, bm=10*w+6.25*(sex==="f"?158:168)-5*age+(sex==="m"?5:-161);
    return D.reduce((a,d)=>a+d.coef*(w+S.load)+bm/24*d.restH*coldF,0)/myNeed; });
  const GF=factors.reduce((a,x)=>a+x,0);
  const rT=S.reserve==="none"?0:S.reserve==="day"?bmr*1.6:750;
  const reserve={key:"reserve",target:rT,custom:!!S.custom.reserve,items:S.reserve==="none"?[]:itemsFor("reserve","cadangan",0,rT)};
  const shop={}; const add=l=>l.forEach(([id,q])=>{shop[id]=(shop[id]||0)+q});
  D.forEach(d=>d.meals.forEach(m=>add(m.items))); add(reserve.items);
  let K=0,G=0,P=0; for(const [id,q] of Object.entries(shop)){const f=food(id);K+=f.k*q;G+=f.g*q;P+=fprice(id)*q}
  const need=D.reduce((a,d)=>a+d.need,0), trekH=D.reduce((a,d)=>a+d.trekH,0);
  const snackK=D.reduce((a,d)=>a+d.meals.filter(m=>m.slot==="cemilan"&&m.on).reduce((b,m)=>b+kOf(m.items),0),0);
  return {rd,n,D,reserve,shop,K,G,P,need,factors,GF,perDay:need/n,water:D.reduce((a,d)=>a+d.water,0),snackPerHour:trekH?Math.round(snackK/trekH/10)*10:0};
}

/* ===================== KOMPONEN ===================== */
const langToggle=()=>`<div class="lang" role="group" aria-label="Language"><button data-act="lang" data-v="id" aria-pressed="${S.lang==="id"}">ID</button><button data-act="lang" data-v="en" aria-pressed="${S.lang==="en"}">EN</button></div>`;
function header(title,sub,meta){
  const st=S.view==="plan"&&S.step<=4?S.step:0;
  return `<header class="top">${TOPO}<div class="wrap">
    <div class="hdr-row"><button class="hbtn" data-act="back">${BACK} ${L("Kembali","Back")}</button>
      <div class="hdr-right">${S.view!=="help"?`<button class="ibtn" data-act="help" aria-label="${L("Panduan","Guide")}" title="${L("Panduan","Guide")}">${IC.book}</button>`:""}${S.view!=="history"?`<button class="ibtn" data-act="history" aria-label="${L("Riwayat","History")}" title="${L("Riwayat","History")}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg></button>`:""}${langToggle()}</div></div>
    <p class="hdr-step">${st?L(`Langkah ${st} dari 4`,`Step ${st} of 4`)+", ":""}${esc(sub)}</p><h1>${esc(title)}</h1>${meta?`<p class="hdr-meta">${meta}</p>`:""}
    ${st?`<div class="progress">${[1,2,3,4].map(k=>`<i class="${k<=st?"on":""}"></i>`).join("")}</div>`:""}
  </div></header>`;
}
const bar=(label,ok=true)=>`<div class="bar"><div class="wrap"><button class="btn ghost" data-act="back">${L("Kembali","Back")}</button><button class="btn" data-act="next" ${ok?"":"disabled"}>${label}</button></div></div>`;

/* ===================== HALAMAN ===================== */
const IL={
  plan:`<svg viewBox="0 0 240 200" aria-hidden="true"><circle cx="120" cy="104" r="88" fill="#FFF4E8"/>
    <path d="M64 150l38-58 18 26 14-18 42 50z" fill="#1F4D3A"/><path d="M102 92l10 15-6-2-5 4-5-4z" fill="#fff"/>
    <rect x="128" y="96" width="52" height="58" rx="10" fill="#E2642A"/><path d="M180 108a14 14 0 0 1 0 28" fill="none" stroke="#E2642A" stroke-width="7"/>
    <rect x="128" y="108" width="52" height="5" fill="#FFD6BE"/><path d="M142 86c-4-6 4-10 0-16M156 86c-4-6 4-10 0-16" stroke="#1F4D3A" stroke-width="4" fill="none" stroke-linecap="round"/>
    <rect x="44" y="40" width="54" height="40" rx="8" fill="#fff" stroke="#E2E8E1" stroke-width="2"/><path d="M53 54l5 5 9-10M53 68h34M72 54h15" stroke="#2F7356" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  menu:`<svg viewBox="0 0 240 200" aria-hidden="true"><circle cx="120" cy="104" r="88" fill="#FFF4E8"/>
    <ellipse cx="112" cy="132" rx="58" ry="18" fill="#1F4D3A"/><rect x="166" y="124" width="46" height="10" rx="5" fill="#1F4D3A"/>
    <ellipse cx="112" cy="126" rx="50" ry="13" fill="#2F7356"/><circle cx="96" cy="124" r="13" fill="#fff"/><circle cx="96" cy="124" r="6" fill="#F0B429"/>
    <circle cx="124" cy="121" r="5" fill="#E2642A"/><circle cx="136" cy="128" r="4" fill="#E2642A"/><path d="M115 130h14" stroke="#9FD3B2" stroke-width="4" stroke-linecap="round"/>
    <path d="M96 100c-5-8 5-12 0-20M114 98c-5-8 5-12 0-20M132 100c-5-8 5-12 0-20" stroke="#E2642A" stroke-width="4" fill="none" stroke-linecap="round"/>
    <rect x="150" y="38" width="48" height="60" rx="8" fill="#fff" stroke="#E2E8E1" stroke-width="2"/><path d="M160 54h28M160 66h28M160 78h18" stroke="#56655C" stroke-width="4" stroke-linecap="round"/></svg>`,
  sched:`<svg viewBox="0 0 240 200" aria-hidden="true"><circle cx="120" cy="104" r="88" fill="#FFF4E8"/>
    <path d="M40 160 C70 150 90 120 112 104 S150 60 168 52 C182 70 196 110 210 160Z" fill="#E3F3E9"/>
    <path d="M40 160 C70 150 90 120 112 104 S150 60 168 52 C182 70 196 110 210 160" fill="none" stroke="#2F7356" stroke-width="5" stroke-linecap="round"/>
    <circle cx="70" cy="148" r="7" fill="#E2642A" stroke="#fff" stroke-width="3"/><circle cx="100" cy="116" r="7" fill="#E2642A" stroke="#fff" stroke-width="3"/>
    <circle cx="134" cy="84" r="7" fill="#E2642A" stroke="#fff" stroke-width="3"/><circle cx="190" cy="110" r="7" fill="#E2642A" stroke="#fff" stroke-width="3"/>
    <circle cx="66" cy="62" r="24" fill="#fff" stroke="#1F4D3A" stroke-width="5"/><path d="M66 48v14l9 6" stroke="#1F4D3A" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`,
  team:`<svg viewBox="0 0 240 200" aria-hidden="true"><circle cx="120" cy="104" r="88" fill="#FFF4E8"/>
    <g fill="#1F4D3A"><circle cx="78" cy="68" r="10"/><path d="M62 96c2-15 30-15 32 0z"/><circle cx="162" cy="68" r="10"/><path d="M146 96c2-15 30-15 32 0z"/></g>
    <circle cx="120" cy="58" r="11" fill="#2F7356"/><path d="M102 90c2-17 34-17 36 0z" fill="#2F7356"/>
    <path d="M80 106h80l-9 52H89z" fill="#E2642A"/><path d="M96 106c0-18 48-18 48 0" fill="none" stroke="#1F4D3A" stroke-width="6" stroke-linecap="round"/>
    <path d="M104 128l9 9 18-20" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  begin:`<svg viewBox="0 0 240 200" aria-hidden="true"><circle cx="120" cy="104" r="88" fill="#FFF4E8"/>
    <path d="M60 64h56v86H60a10 10 0 0 1-10-10V74a10 10 0 0 1 10-10z" fill="#1F4D3A"/><path d="M116 64h56a10 10 0 0 1 10 10v66a10 10 0 0 1-10 10h-56z" fill="#2F7356"/>
    <path d="M66 86h36M66 100h36M66 114h24M130 86h36M130 100h28" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <circle cx="176" cy="54" r="22" fill="#E2642A"/><text x="176" y="63" text-anchor="middle" font-size="26" font-weight="700" fill="#fff" font-family="Barlow,Arial,sans-serif">?</text>
    <path d="M150 140l18-8 18 8v14c0 10-8 18-18 22-10-4-18-12-18-22z" fill="#fff" stroke="#1F4D3A" stroke-width="4"/><path d="M160 152l6 6 10-11" stroke="#2F7356" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`
};
const INTRO=[
  {il:"plan",t:["Bekal yang pas untuk pendakianmu","The right food for your hike"],d:["Tahu berapa banyak yang harus dibawa, kapan dimakan, dan berapa biayanya, dalam 4 langkah.","Know how much to bring, when to eat it, and what it costs, in 4 steps."]},
  {il:"menu",t:["Menu ala pendaki, lengkap dengan resep","Hiker-style meals, with recipes"],d:["Puluhan resep, dari nasi goreng kampung sampai wedang jahe, lengkap dengan bahan, bumbu, dan cara masak.","Dozens of recipes, from village fried rice to ginger tea, with ingredients, seasoning, and steps."]},
  {il:"sched",t:["Kapan ngemil, di ketinggian berapa","When to snack, and at what height"],d:["Jadwal per jam memberi tahu kapan makan dan apa yang dimakan, supaya tidak lemas di jalur.","An hourly schedule tells you when and what to eat, so you don't run out of energy on the trail."]},
  {il:"team",t:["Belanja dan bagi tugas rombongan","Shop and split tasks as a group"],d:["Checklist belanja, biaya per orang, dan kirim tugas ke setiap anggota lewat WhatsApp.","A shopping checklist, cost per person, and tasks sent to each member by WhatsApp."]},
  {il:"begin",t:["Mudah dipakai siapa saja","Easy for anyone"],d:["Istilah dijelaskan, alurnya singkat, dan data tetap di HP-mu.","Terms are explained, the flow is short, and your data stays on your phone."]}
];
function vIntro(){
  const i=clamp(S.introI||0,0,INTRO.length-1), it=INTRO[i], last=i===INTRO.length-1;
  return `<section class="ob intro" id="intro">${TOPO}<div class="wrap">
    <div class="hdr-row"><span style="display:flex;align-items:center;gap:10px;font-weight:600">${LOGO} Bekal Nanjak</span>
      <span class="hdr-right">${langToggle()}${last?"":`<button class="hbtn" data-act="introSkip">${L("Lewati","Skip")}</button>`}</span></div>
    <div class="intro-body" aria-live="polite">
      <div class="intro-il">${IL[it.il]}</div>
      <p class="intro-n">${i+1} / ${INTRO.length}</p>
      <h1>${esc(L(...it.t))}</h1>
      <p class="lead">${esc(L(...it.d))}</p>
    </div>
    <div class="dots" role="tablist" aria-label="${L("Layar perkenalan","Intro screens")}">${INTRO.map((_,k)=>`<button role="tab" aria-selected="${k===i}" aria-label="${L("Layar","Screen")} ${k+1}" data-act="introGo" data-v="${k}" class="${k===i?"on":""}"></button>`).join("")}</div>
    <div class="intro-acts">${i>0?`<button class="btn ghost" data-act="introPrev">${L("Kembali","Back")}</button>`:""}
      ${last?`<button class="btn light" data-act="introStart">${L("Mulai rencana","Start planning")}</button>`:`<button class="btn light" data-act="introNext">${L("Lanjut","Next")}</button>`}</div>
  </div></section>`;
}
function vRoute(){
  const m=mt(), rs=m?routesOf(m.k):[];
  const provOpts=PROV.map(([p])=>`<option value="${esc(p)}" ${p===S.prov?"selected":""}>${esc(p)}</option>`).join("");
  const list=S.prov?(PROV.find(([p])=>p===S.prov)||[,[]])[1]:[];
  const mOpts=list.map(([k,n,pk])=>`<option value="${k}" ${k===S.mountain?"selected":""}>${esc(n)}, ±${fmt(pk)} mdpl${ROUTES[k]?" ✓":""}</option>`).join("");
  const rOpts=rs.map(r=>`<option value="${r.id}" ${r.id===S.route?"selected":""}>${esc(r.n)}</option>`).join("")+`<option value="manual" ${isManual()?"selected":""}>${L("Jalur lain, isi sendiri","Other trail, enter manually")}</option>`;
  const r=route();
  let detail="";
  if(m&&r&&!isManual()){
    detail=`<div class="est"><div class="elev"><span><small>${L("Basecamp, titik mulai","Basecamp, start")}</small><b>${fmt(r.base)} ${term("mdpl")}</b></span><span class="arr" aria-hidden="true">→</span><span><small>${L("Puncak","Summit")}</small><b>${fmt(r.peak||m.peak)} ${term("mdpl")}</b></span></div>
      <p class="hint" style="margin:8px 0 0">${L(`Total tanjakan ±${fmt((r.peak||m.peak)-r.base)} meter. Waktu jalan pendaki rata-rata: naik ±${dec(r.up)} jam, turun ±${dec(r.down)} jam. Angka perkiraan.`,`Total climb ±${fmt((r.peak||m.peak)-r.base)} metres. Average walking time: up ±${dec(r.up)} h, down ±${dec(r.down)} h. Estimates only.`)}</p></div>`;
  } else if(m&&isManual()){
    detail=`<p class="alert">${L(`Data jalur gunung ini belum tersedia. Tanyakan ketinggian ${term("basecamp","basecamp")} dan perkiraan jam naik-turun ke pengelola atau pendaki yang pernah ke sana. Kalau ini pendakian pertamamu, gunung bertanda ✓ lebih mudah direncanakan.`,`We don't have trail data for this mountain yet. Ask the park office or someone who has hiked it for the ${term("basecamp","basecamp")} height and hours up and down. For a first hike, mountains marked ✓ are easier to plan.`)}</p>
      <div class="row2"><label class="field"><span>${L("Basecamp (mdpl)","Basecamp (m)")}</span><input type="number" inputmode="numeric" data-k="base" value="${esc(S.base)}" placeholder="1500"></label>
      <label class="field"><span>${L("Puncak (mdpl)","Summit (m)")}</span><input type="number" inputmode="numeric" data-k="peakManual" value="${esc(S.peakManual||m.peak)}"></label></div>
      <div class="row2"><label class="field"><span>${L("Jam naik","Hours up")}</span><input type="number" step="0.5" inputmode="decimal" data-k="upManual" value="${esc(S.upManual)}" placeholder="6"></label>
      <label class="field"><span>${L("Jam turun","Hours down")}</span><input type="number" step="0.5" inputmode="decimal" data-k="downManual" value="${esc(S.downManual)}" placeholder="4"></label></div>
      <p class="hint" style="margin:0">${L("Jam naik dan turun adalah total waktu berjalan dari basecamp ke puncak dan sebaliknya, tanpa waktu menginap.","Hours up and down are the total walking time from basecamp to the summit and back, excluding overnight stops.")}</p>`;
  }
  return header(L("Mau naik ke mana?","Where are you hiking?"),L("Rencana pendakian","Trip plan"))+`<main class="wrap">
    <div class="card"><h2>${L("Gunung dan jalur","Mountain and trail")}</h2><p class="hint">${L("Pilih provinsi dulu, lalu gunung dan jalurnya. Gunung bertanda ✓ sudah punya data jalur, jadi lebih mudah untuk pemula.","Pick a province first, then the mountain and trail. Mountains marked ✓ have trail data, which makes them easier for beginners.")}</p>
      <label class="field"><span>${L("Provinsi","Province")}</span><select data-k="prov"><option value="">${L("Pilih provinsi","Choose a province")}</option>${provOpts}</select></label>
      <label class="field"><span>${L("Gunung","Mountain")}</span><select data-k="mountain" ${S.prov?"":"disabled"}><option value="">${L("Pilih gunung","Choose a mountain")}</option>${mOpts}</select></label>
      ${m?`<label class="field"><span>${L("Jalur","Trail")}</span><select data-k="route"><option value="">${L("Pilih jalur","Choose a trail")}</option>${rOpts}</select></label>`:""}
      ${detail}
      ${m&&route()?`<p class="sub2" style="margin-top:14px">${L("Sumber air di jalur?","Water sources on the trail?")}</p>
      <div class="seg" style="--n:3">${[["yes","Ada","Yes"],["no","Tidak ada","None"],["unknown","Belum tahu","Not sure"]].map(([v,a,b])=>`<button data-act="waterSrc" data-v="${v}" aria-pressed="${(S.waterSrc||"unknown")===v}">${L(a,b)}</button>`).join("")}</div>`:""}
    </div></main>`+bar(L("Lanjut","Next"),!!routeData());
}

function planError(){
  if(!fullDate(S.start)) return L("Pilih tanggal naik.","Choose a start date.");
  if(S.start<todayStr()) return L("Tanggal naik sudah lewat. Pilih hari ini atau setelahnya.","The start date has passed. Choose today or later.");
  if(S.type==="multi"){
    if(!fullDate(S.end)) return L("Pilih tanggal turun.","Choose an end date.");
    if(S.end<=S.start) return L("Tanggal turun minimal 1 hari setelah tanggal naik.","The end date must be at least 1 day after the start date.");
    if(days()>10) return L("Rencana makan dibatasi sampai 10 hari.","Meal plans are limited to 10 days.");
  }
  return "";
}
function vSchedule(){
  const r=route(), multi=S.type==="multi", n=days(), err=planError(), rd=routeData();
  const paceBtn=(v,id,en)=>`<button data-act="pace" data-v="${v}" aria-pressed="${S.pace===v}">${L(id,en)}</button>`;
  return header(L("Kapan dan berapa lama?","When and how long?"),L("Jadwal pendakian","Schedule"))+`<main class="wrap">
    <div class="card"><h2>${L("Tipe pendakian","Trip type")}</h2>
      ${r&&r.days?`<p class="hint">${L(`Jalur ini umumnya ${durLabel(r.days)}.`,`This trail usually takes ${durLabel(r.days).toLowerCase()}.`)}</p>`:""}
      <div class="seg"><button data-act="type" data-v="oneday" aria-pressed="${!multi}">${L("Tektok (1 hari)","Day hike")}</button><button data-act="type" data-v="multi" aria-pressed="${multi}">${L("Ngecamp","Camping")}</button></div>
      <p class="hint" style="margin-top:-6px">${multi?L(`${term("menginap","Ngecamp")}: bermalam di gunung, lalu lanjut atau turun keesokan harinya.`,`${term("menginap","Camping")}: one or more nights on the mountain.`):L(`${term("tektok","Tektok")}: naik dan turun di hari yang sama.`,`${term("tektok","Day hike")}: up and down on the same day.`)}</p>
      <div class="row2"><label class="field"><span>${multi?L("Naik","Start"):L("Tanggal","Date")}</span>${dateField(`data-k="start" min="${todayStr()}" aria-label="${L("Tanggal naik","Start date")}"`,S.start)}</label>
        ${multi?`<label class="field"><span>${L("Turun","End")}</span>${dateField(`data-k="end" min="${addDays(S.start||todayStr(),1)}" aria-label="${L("Tanggal turun","End date")}"`,S.end)}</label>`
               :`<label class="field"><span>${L("Jam mulai","Start time")}</span>${timeField(`data-k="startTime" aria-label="${L("Jam mulai","Start time")}"`,S.startTime)}</label>`}</div>
      ${multi?`<div class="dur"><button data-act="dstep" data-v="-1" aria-label="${L("Kurangi satu hari","One day less")}">−</button><span>${durLabel(n)}</span><button data-act="dstep" data-v="1" aria-label="${L("Tambah satu hari","One day more")}">+</button></div>
        <p class="sub2" style="margin-top:14px">${L("Jam mulai jalan","Start times")}</p>
        <div class="times"><label class="field"><span>${L("Hari 1","Day 1")}</span>${timeField(`data-k="startTime" aria-label="${L("Jam mulai","Start time")}"`,S.startTime)}</label>
          ${Array.from({length:Math.max(0,n-2)},(_,k)=>k+1).map(i=>`<label class="field"><span>${L("Hari","Day")} ${i+1}</span>${timeField(`data-daystart="${i}"`,(S.dayStart&&S.dayStart[i])||"06:00")}</label>`).join("")}
          ${S.summitAtk!==false?`<label class="field"><span>${L(`Hari ${n}, summit attack`,`Day ${n}, summit push`)}</span>${timeField(`data-k="summitTime"`,S.summitTime||"03:00")}</label>`:`<label class="field"><span>${L("Hari","Day")} ${n}</span>${timeField(`data-daystart="${n-1}"`,(S.dayStart&&S.dayStart[n-1])||"06:00")}</label>`}</div>
        ${S.summitAtk!==false?`<p class="sub2">${L("Waktu di camp setelah summit","Time at camp after the summit")}</p><div class="seg" style="--n:4">${[1.5,2,2.5,3].map(v=>`<button data-act="campStop" data-v="${v}" aria-pressed="${(+(S.campStop||2))===v}">${nf(v)} ${L("jam","h")}</button>`).join("")}</div>`:""}
        <button class="switch first" role="switch" data-act="toggle" data-k="summitAtk" aria-checked="${S.summitAtk!==false}"><span><b>${L(`Summit attack dini hari di hari ${n}`,`Early summit push on day ${n}`)}</b><small>${L("Naik ke puncak dari camp, kembali sarapan, lalu turun.","Climb from camp to the summit, back for breakfast, then descend.")}</small></span><span class="sw"></span></button>`:""}
      <p class="err" role="status">${err}</p>
      ${!multi&&rd&&rd.up+rd.down>12?`<p class="alert" style="margin:10px 0 0">${L(`Jalur ini butuh ±${dec(rd.up+rd.down)} jam jalan kalau tektok. Untuk pemula, sebaiknya pilih Ngecamp.`,`This trail takes about ${dec(rd.up+rd.down)} hours of walking as a day hike. Beginners should choose Camping.`)}</p>`:""}</div>
    <div class="card"><h2>${L("Siapa yang ikut?","Who's coming?")}</h2>
      <div class="seg"><button data-act="solo" data-v="1" aria-pressed="${(S.people||1)===1}">${L("Sendiri","Just me")}</button><button data-act="solo" data-v="0" aria-pressed="${(S.people||1)>1}">${L("Berkelompok","A group")}</button></div>
      ${(S.people||1)>1?`<div class="dur"><button data-act="people" data-v="-1" aria-label="${L("Kurangi orang","Fewer people")}">−</button><span>${S.people} ${L("orang","people")}</span><button data-act="people" data-v="1" aria-label="${L("Tambah orang","More people")}">+</button></div>
      <p class="hint" style="margin:10px 0 0">${L("Menu dihitung per orang. Belanja, alat masak, dan bagi tugas dihitung untuk rombongan.","Meals are per person. Shopping, cooking gear, and tasks are for the whole group.")}</p>`:""}</div>
    <div class="card"><h2>${L("Pengalaman mendaki","Hiking experience")}</h2>
      <p class="hint">${L("Dipakai untuk memperkirakan kecepatan jalan dan memilih tips yang cocok.","Used to estimate your walking pace and pick the right tips.")}</p>
      <div class="seg" style="--n:3">${[["first","Pertama kali","First time"],["some","Beberapa kali","A few times"],["often","Sering","Often"]].map(([v,a,b])=>`<button data-act="exp" data-v="${v}" aria-pressed="${S.exp===v}">${L(a,b)}</button>`).join("")}</div>
      ${!isManual()&&rd?`<div class="est">${L("Perkiraan waktu jalan","Estimated walking time")}: <b>${L(`naik ±${dec(rd.up)} jam, turun ±${dec(rd.down)} jam`,`±${dec(rd.up)} h up, ±${dec(rd.down)} h down`)}</b><br><span class="hint" style="margin:0">${S.exp==="first"?L("Untuk pendaki pemula, kami pakai waktu yang lebih longgar. ","For first-timers we use more generous times. "):""}${L("Belum termasuk waktu menginap di camp.","Overnight time at camp is not included.")}</span></div>`:""}</div>
  </main>`+bar(L("Lanjut","Next"),!err);
}

function vBody(){
  const sl=(k,label,min,max,unit)=>`<div class="slider"><div class="sr"><span>${label}</span><output>${S[k]}<small>${unit}</small></output></div><input type="range" min="${min}" max="${max}" value="${S[k]}" data-k="${k}" aria-label="${label}"></div>`;
  const sw=(k,b,s,first)=>`<button class="switch${first?" first":""}" role="switch" data-act="toggle" data-k="${k}" aria-checked="${S[k]}"><span><b>${b}</b><small>${s}</small></span><span class="sw"></span></button>`;
  return header(L("Tentang kamu","About you"),L("Data tubuh","Body data"))+`<main class="wrap">
    <div class="card"><p class="hint">${L("Kebutuhan energi tiap orang berbeda, tergantung tubuh dan beban yang dibawa. Data ini hanya disimpan di HP-mu.","Energy needs depend on your body and what you carry. This data stays on your phone.")}</p><div class="seg"><button data-act="sex" data-v="m" aria-pressed="${S.sex==="m"}">${L("Laki-laki","Male")}</button><button data-act="sex" data-v="f" aria-pressed="${S.sex==="f"}">${L("Perempuan","Female")}</button></div>
      ${sl("age",L("Usia","Age"),14,70,L("th","yrs"))}${sl("height",L("Tinggi badan","Height"),140,200,"cm")}${sl("weight",L("Berat badan","Weight"),35,130,"kg")}${sl("load",L("Berat carrier","Pack weight"),0,30,"kg")}<p class="hint" style="margin:10px 0 0">${L(`Berat ${term("carrier","carrier")} beserta isinya. Belum tahu? Untuk menginap biasanya 10–15 kg.`,`Weight of your ${term("carrier","backpack")} with everything inside. Not sure? Overnight packs are usually 10–15 kg.`)}</p></div>
    <div class="card"><h2>${L("Preferensi","Preferences")}</h2>
      ${sw("cold",L("Malam di bawah 10°C","Nights below 10°C"),L("Tubuh butuh lebih banyak energi untuk tetap hangat.","Your body needs more energy to stay warm."),true)}
      ${sw("instant",L("Utamakan siap saji","Prefer ready-to-eat"),L("Cukup air panas. Hemat gas, tapi lebih mahal dan sampahnya lebih banyak.","Just add hot water. Saves gas, but costs more and makes more packaging waste."))}
      ${sw("light",L("Utamakan carrier ringan","Keep the pack light"),L("Lebih banyak makanan padat kalori, tanpa nasi bungkus.","More calorie-dense food, no packed rice meals."))}
      <div class="avoid"><b>${L("Alergi dan pantangan","Allergies and avoids")}</b><small>${L("Menu saran otomatis menghindari bahan ini.","Suggested menus will avoid these.")}</small>
        ${S.avoid&&S.avoid.fiber?`<small class="hint" style="margin-bottom:6px">${L("Kurangi serat: untuk yang tidak nyaman BAB di gunung. Tetap minum cukup supaya tidak sembelit.","Less fibre: for those who'd rather not need the toilet on the mountain. Keep drinking to avoid constipation.")}</small>`:""}
        <div class="pills">${Object.keys(AVOID_LBL).map(k=>`<button class="pill" data-act="avoid" data-v="${k}" aria-pressed="${!!(S.avoid&&S.avoid[k])}">${L(...AVOID_LBL[k])}</button>`).join("")}</div></div>
      ${sw("veg",L("Vegetarian","Vegetarian"),L("Tanpa daging, lauk diganti kering tempe.","No meat; sides are swapped for crispy tempeh."))}</div>
  </main>`+bar(L("Lanjut","Next"));
}

function whyOff(i,slot,n){
  const t=S.startTime||"08:00";
  if(slot==="sarapan") return L(`Jangan lupa sarapan di rumah atau basecamp ±1 jam sebelum mulai jalan pukul ${t}.`,`Don't forget breakfast at home or basecamp before you start at ${t}.`);
  if(slot==="siang"&&i===0) return L(`Makan siang dulu sebelum mulai jalan pukul ${t}.`,`Have lunch before you start at ${t}.`);
  if(slot==="siang") return L("Makan siang setelah sampai basecamp.","Have lunch once you're back at basecamp.");
  if(slot==="malam") return L("Kamu sudah turun, jadi makan malam di rumah atau warung basecamp.","You'll be down by then, so have dinner at home or a basecamp stall.");
  return L("Nyalakan kalau kamu ingin membawanya.","Switch on if you want to pack it.");
}
function vMeals(){
  const R=calc(); if(!R) return vRoute();
  const D=R.D.map(d=>`<div class="card day"><h3>${L("Hari","Day")} ${d.i+1}</h3>
    <p class="dmeta">${esc(dayDate(d.i))}${d.trekH?`, ±${dec(d.trekH)} ${L("jam jalan","h walking")}`:""}</p>
    ${d.meals.map((m,j)=>`<button class="switch${j===0?" first":""}" role="switch" data-act="meal" data-key="${m.key}" aria-checked="${m.on}">
      <span><b>${L(...SLOTS[m.slot].n)}</b><small>${m.on?L(...SLOTS[m.slot].t):L("Tidak dibawa","Not packed")}</small>${!m.on&&!(m.key in S.meals)?`<small class="why">${whyOff(d.i,m.slot,R.n)}</small>`:""}</span>
      <span class="sw-wrap"><span class="kcal-tag">${m.on?fmt(m.target)+" "+L("kkal","kcal"):""}</span><span class="sw"></span></span></button>`).join("")}
  </div>`).join("");
  const rv=[["none",L("Tidak bawa","None"),L("Tidak disarankan","Not recommended")],["meal",L("1 kali makan","1 meal"),L("±750 kkal, kalau tertahan beberapa jam","±750 kcal, if delayed for a few hours")],["day",L("1 hari penuh","1 full day"),L("Untuk cuaca buruk atau tertahan semalam","For bad weather or an unplanned night")]];
  return header(L("Rencana makan","Meal plan"),L("Waktu makan","Meals"),L(`Waktu makan sudah diatur otomatis. Matikan yang tidak perlu dibawa, misalnya sarapan di ${term("basecamp","basecamp")}.`,`Meals are set automatically. Switch off any you won't pack, such as breakfast at the ${term("basecamp","basecamp")}.`))+`<main class="wrap">${D}
    <div class="card"><h2>${L("Ngemil di jalur","Trail snacks")}</h2><p class="hint">${L("Sedikit saja, beberapa suap. Pilih jaraknya.","Just a few bites. Choose how often.")}</p>
      <div class="seg" style="--n:3">${[45,60,90].map(v=>`<button data-act="snackEvery" data-v="${v}" aria-pressed="${(S.snackEvery||60)===v}">${L(`Tiap ${v} menit`,`Every ${v} min`)}</button>`).join("")}</div></div>
    <div class="card"><h2>${L("Makanan cadangan","Emergency food")}</h2><p class="hint">${L(`${term("cadangan","Makanan cadangan")} disimpan terpisah dan hanya dibuka saat darurat, misalnya cuaca buruk atau tertahan di jalur.`,`${term("cadangan","Emergency food")} is kept separately and only opened in an emergency, such as bad weather or being delayed.`)}</p>
      <div class="opts">${rv.map(([v,b,s])=>`<button class="opt" data-act="reserve" data-v="${v}" aria-pressed="${S.reserve===v}"><span><b>${b}</b><small>${s}</small></span><span class="check"></span></button>`).join("")}</div></div>
  </main>`+bar(L("Lihat rencana bekal","See food plan"));
}

function planName(){const m=mt(),r=route();return m?(r&&!isManual()?`${m.n} via ${r.n.split(",")[0]}`:m.n):L("Pendakian","Hike")}
/* ===================== JADWAL DI JALUR ===================== */
const hhmm=h=>{h=((h%24)+24)%24;const m=Math.round(h*60);return `${pad(Math.floor(m/60)%24)}:${pad(m%60)}`};
const hm=t=>{const a=(t||"").split(":"); const h=parseInt(a[0],10), m=parseInt(a[1],10)||0; return isFinite(h)?h+m/60:null;};
function dayPlan(R,d){
  const rd=R.rd, gain=Math.max(100,rd.peak-rd.base), n=R.n;
  const before=R.D.slice(0,d.i).reduce((a,x)=>a+x.up,0);
  const e0=rd.base+gain*(rd.up?before/rd.up:0), eTop=e0+gain*(rd.up?d.up/rd.up:0);
  const sAtk=d.downC>0, summit=d.down>0;
  const upT=d.up, dcT=d.downC||0, dT=d.down, walk=upT+dcT+dT;
  const start=d.i===0?(hm(S.startTime)??8):(sAtk?(hm(S.summitTime)??3):(hm(S.dayStart&&S.dayStart[d.i])??6));
  const elev=t=>{ if(t<=upT){const p=upT?t/upT:1; return e0+(eTop-e0)*(1-Math.pow(1-p,1.25));}
    if(t<=upT+dcT){const p=dcT?(t-upT)/dcT:1; return eTop-(eTop-e0)*p;}
    const from=sAtk?e0:eTop, p=dT?(t-upT-dcT)/dT:1; return from-(from-rd.base)*Math.pow(p,1.1); };
  const has=slot=>d.meals.find(m=>m.slot===slot);
  const lunch=has("siang"); let tL=null;
  const campStop=+(S.campStop||2);
  const pauses=[]; if(sAtk){ pauses.push([upT,0.5]); pauses.push([upT+dcT,campStop]); }
  const clock0=t=>start+t+pauses.filter(([a])=>t>a).reduce((s,[,x])=>s+x,0);
  if(lunch&&lunch.on&&walk>0){ const c12=12; for(let t=0;t<walk;t+=0.05){ if(clock0(t)>=c12){ if(t>0.3&&t<walk-0.3) tL=t; break; } } }
  if(tL!=null) pauses.push([tL,0.5]);
  const clock=t=>start+t+pauses.filter(([a])=>t>a).reduce((s,[,x])=>s+x,0);
  const I=(S.snackEvery||60)/60, snackM=has("cemilan"), stops=[];
  for(let t=I;t<walk-0.25;t+=I){ if(pauses.some(([a])=>Math.abs(t-a)<0.4)) continue; if(sAtk&&has("summit")&&has("summit").on&&t<upT+dcT) continue; stops.push(t); }
  const bins=stops.map(()=>({k:0,it:{}}));
  if(snackM&&snackM.on&&bins.length){
    const units=[]; snackM.items.forEach(([id,q])=>{for(let u=0;u<q;u++) units.push(id)});
    units.sort((a,b)=>food(b).k-food(a).k).forEach(id=>{const bn=bins.reduce((m,x)=>x.k<m.k?x:m,bins[0]); bn.k+=food(id).k; bn.it[id]=(bn.it[id]||0)+1;});
  }
  const listTxt=it=>Object.entries(it).map(([id,q])=>`${fname(id)} ${qty(id,q)}`).join(", ");
  const mealTxt=m=>m&&m.on?listTxt(Object.fromEntries(m.items)):"";
  const ev=[], arrive=clock(walk);
  const meal=(m,time,e,where)=>ev.push({kind:"meal",slot:m.slot,time,e,label:L(...SLOTS[m.slot].n),on:m.on,where,what:mealTxt(m),k:m.on?kOf(m.items):0});
  const sar=has("sarapan");
  if(sAtk){
    ev.push({kind:"meal",slot:"pre",time:start-0.25,e:e0,label:L("Minuman hangat dan camilan ringan","Warm drink and a light snack"),on:true,where:L("sebelum summit attack","before the summit push"),what:L("Teh atau jahe hangat, 1–2 camilan kecil. Jangan makan berat.","Hot tea or ginger, 1–2 small snacks. Nothing heavy."),k:0});
    const sm=has("summit"); if(sm&&sm.on){ meal(sm,start-0.1,e0,L("dibawa, dimakan sedikit-sedikit sampai puncak","carried, eaten bit by bit to the top")); ev[ev.length-1].what+=", "+L("air ±0,5–1 L","water ±0.5–1 L"); }
    ev.push({kind:"start",time:start,e:e0,label:L("Mulai summit attack","Start the summit push")});
    ev.push({kind:"peak",t:upT,time:clock(upT),e:eTop,label:L("Puncak","Summit")});
    const back=clock(upT+dcT);
    ev.push({kind:"start",time:back,e:e0,label:L("Kembali ke camp","Back at camp")});
    if(sar){ meal(sar,back+0.1,e0,L("di camp, setelah summit","at camp, after the summit")); ev[ev.length-1].label=L("Makan besar","Big meal"); }
    ev.push({kind:"start",time:back+Math.min(1,campStop*0.5),e:e0,label:L("Packing dan bongkar tenda","Pack up and strike the tent")});
    ev.push({kind:"start",time:back+Math.min(campStop-0.25,campStop*0.8),e:e0,label:L("Istirahat dan persiapan turun","Rest and get ready to descend")});
    ev.push({kind:"start",time:back+campStop,e:e0,label:L("Mulai turun","Start the descent")});
  } else {
    if(sar) meal(sar,start-1,e0,(d.i===0?L("di basecamp","at basecamp"):L("di camp","at camp"))+", "+L("±1 jam sebelum jalan supaya perut tidak kram","about 1 h before walking so you don't cramp"));
    if(lunch&&walk>0&&start>=12) meal(lunch,Math.max(11.5,start-1),e0,L("sebelum jalan","before hiking"));
    ev.push({kind:"start",time:start,e:e0,label:d.i===0?L("Mulai dari basecamp","Leave basecamp"):L("Mulai jalan dari camp","Leave camp")});
    if(summit) ev.push({kind:"peak",t:upT,time:clock(upT),e:eTop,label:L("Puncak","Summit")});
  }
  stops.forEach((t,ix)=>{const bn=bins[ix]; ev.push({kind:"snack",k:bn.k,t,time:clock(t),e:elev(t),label:bn.k?L("Break","Snack break"):L("Break, minum","Drink break"),what:bn.k?L("Ngemil: ","Snack: ")+listTxt(bn.it):""})});
  if(tL!=null){ meal(lunch,clock(tL),elev(tL),L("di jalur","on the trail")); ev[ev.length-1].t=tL; }
  ev.push({kind:"end",time:arrive,e:summit?rd.base:eTop,label:summit?L("Sampai basecamp","Back at basecamp"):L("Sampai camp, perkiraan","Reach camp, estimated")});
  if(lunch&&lunch.on&&walk>0&&tL==null&&start<12) meal(lunch,Math.max(arrive+.25,12),summit?rd.base:eTop,summit?L("di basecamp","at basecamp"):L("di camp","at camp"));
  const din=has("malam"); if(din&&!summit) meal(din,Math.max(arrive+1,18),eTop,L("di camp","at camp"));
  ev.sort((a,b)=>a.time-b.time);
  ev.forEach((x,ix)=>x.id=`d${d.i}-${x.kind}-${x.slot||ix}-${Math.round(x.time*60)}`);
  return {start,walk,elev,clock,tL,ev,e0,eTop,summit,sAtk};
}
function profileSVG(P){
  if(!P.walk) return "";
  const W=320,H=128,l=6,r=6,top=20,bot=22, total=Math.max(0.5,P.clock(P.walk)-P.start);
  const emin=Math.min(P.e0,P.summit?P.ev.find(e=>e.kind==="end").e:P.e0), emax=P.eTop, span=Math.max(80,emax-emin);
  const X=t=>l+(P.clock(t)-P.start)/total*(W-l-r), Y=e=>top+(1-(e-emin)/span)*(H-top-bot);
  let dpath=""; const N=60; for(let k=0;k<=N;k++){const t=P.walk*k/N; dpath+=(k?"L":"M")+X(t).toFixed(1)+" "+Y(P.elev(t)).toFixed(1)}
  const dots=P.ev.filter(e=>e.kind==="snack").map(e=>`<circle cx="${X(e.t).toFixed(1)}" cy="${Y(e.e).toFixed(1)}" r="4.2" fill="var(--blaze)" stroke="var(--surface)" stroke-width="1.5"/>`).join("");
  const lunch=P.ev.find(e=>e.kind==="meal"&&e.t!=null);
  const lm=lunch?(()=>{const x=X(lunch.t),y=Y(lunch.e);return `<rect x="${(x-5).toFixed(1)}" y="${(y-5).toFixed(1)}" width="10" height="10" transform="rotate(45 ${x.toFixed(1)} ${y.toFixed(1)})" fill="var(--pine2)" stroke="var(--surface)" stroke-width="1.5"/>`})():"";
  const pk=P.summit?`<text x="${X(P.ev.find(e=>e.kind==="peak").t).toFixed(1)}" y="12" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)">${fmt(P.eTop)} mdpl</text>`:`<text x="${(W-r).toFixed(1)}" y="12" text-anchor="end" font-size="11" font-weight="700" fill="var(--ink)">${L("Camp","Camp")} ±${fmt(P.eTop)} mdpl</text>`;
  return `<svg class="prof" viewBox="0 0 ${W} ${H}" role="img" aria-label="${L("Profil ketinggian dan jadwal ngemil","Elevation profile and snack schedule")}">
    <path d="${dpath}L${X(P.walk).toFixed(1)} ${H-bot}L${X(0).toFixed(1)} ${H-bot}Z" fill="var(--greenbg)"/>
    <path d="${dpath}" fill="none" stroke="var(--pine2)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}${lm}${pk}
    <text x="${l}" y="${H-6}" font-size="11" fill="var(--muted)">${hhmm(P.start)}</text>
    <text x="${W-r}" y="${H-6}" font-size="11" fill="var(--muted)" text-anchor="end">${hhmm(P.clock(P.walk))}</text>
  </svg>`;
}
function scheduleHTML(R,d){
  const P=dayPlan(R,d); if(!P.walk) return "";
  const rows=P.ev.map(e=>`<div class="tl ${e.kind}${e.on===false?" off":""}"><span class="tm">${hhmm(e.time)}</span><span class="mk"></span><span class="ac"><b>${esc(e.label)}</b>${e.where?` <small>${esc(e.where)}${e.on===false?", "+L("tidak dibawa","not packed"):""}</small>`:""}${e.what?`<small class="what">${esc(e.what)}</small>`:""}${e.kind==="snack"?`<small class="what drink">${L("Minum ±250 ml","Drink ±250 ml")}</small>`:""}</span><span class="el">${fmt(e.e)} m</span></div>`).join("");
  return `<div class="sched">${profileSVG(P)}
    <div class="legend"><span><i class="ld"></i>${L("Break","Break")}</span><span><i class="lm"></i>${L("Makan siang","Lunch")}</span><span>${L("Jam dan ketinggian perkiraan","Times and heights are estimates")}</span></div>
    <details class="tld" open><summary>${L("Jadwal per jam","Hourly schedule")}</summary><p class="note" style="margin:0 0 6px">${L("Ngemil cukup beberapa suap. Kalau perut terasa penuh, lewati satu titik dan cukup minum. Di antara titik, teguk sedikit tiap 15–20 menit.","Snacks are just a few bites. If you feel full, skip one and just drink. Sip every 15–20 minutes in between.")}</p><div class="tlist">${rows}</div></details></div>`;
}

const PACK=[
  {c:"karbo",t:["Nasi, roti, dan karbohidrat","Rice, bread, and carbs"],tips:[
    ["Takar beras per sekali masak dan simpan di ziplock terpisah, supaya mudah dan tidak tumpah.","Measure rice per cooking and keep each portion in its own zip bag."],
    ["Nasi matang sebaiknya dimakan dalam ±4–6 jam. Nasi bungkus hanya untuk makan siang hari pertama.","Cooked rice is best eaten within about 4–6 hours. Packed rice meals are for day-one lunch only."],
    ["Roti cepat berjamur di udara lembap. Simpan di wadah kering dan habiskan dalam 2 hari.","Bread moulds quickly in damp air. Keep it dry and finish it within 2 days."]]},
  {c:"protein",t:["Lauk, daging, dan telur","Meat, eggs, and protein"],tips:[
    ["Lauk matang seperti ayam ungkep, tempe, dan tahu bacem: masak sampai kering, dinginkan dulu, lalu simpan di wadah tertutup. Makan di hari pertama.","Cooked sides like spiced chicken or braised tempeh: cook them dry, let them cool, then seal them. Eat on day one."],
    ["Bekukan lauk matang semalaman sebelum berangkat. Lauk beku ikut menjadi pendingin alami dan lebih tahan.","Freeze cooked sides overnight before you leave. They act as an ice pack and keep longer."],
    ["Telur mentah dibawa di kotak telur atau dibungkus kain, taruh di bagian atas carrier.","Carry raw eggs in an egg box or wrapped in cloth, near the top of your pack."],
    ["Untuk hari ketiga dan seterusnya, pakai lauk awet seperti teri goreng kering, abon, kornet, atau sarden kaleng.","From day three on, use long-life sides like dry anchovies, meat floss, or canned fish and meat."],
    ["Kalau lauk berbau asam, berlendir, atau rasanya berubah, jangan dimakan.","If a side smells sour, feels slimy, or tastes off, don't eat it."]]},
  {c:"sayur",t:["Sayur dan buah","Vegetables and fruit"],tips:[
    ["Pilih sayur yang tahan lama: wortel, kol, buncis, dan kentang. Sayur daun seperti sawi sebaiknya untuk hari pertama.","Choose hardy veg: carrots, cabbage, beans, and potatoes. Leafy greens are best on day one."],
    ["Cuci dan keringkan sayur di rumah, lalu bungkus koran atau kertas. Plastik kedap membuat sayur cepat busuk.","Wash and dry veg at home, then wrap it in paper. Airtight plastic makes it rot faster."],
    ["Pisang mudah memar, taruh di bagian paling atas. Jeruk dan apel lebih tahan banting.","Bananas bruise easily, so put them on top. Oranges and apples travel better."]]},
  {c:"bumbu",t:["Bumbu, minyak, dan olesan","Seasoning, oil, and spreads"],tips:[
    ["Bawa minyak di botol kecil yang rapat, lalu bungkus dua lapis plastik supaya tidak tumpah ke pakaian.","Carry oil in a small sealed bottle inside two plastic bags so it can't leak onto clothes."],
    ["Bawang dan cabai utuh lebih tahan daripada yang sudah diiris. Sambal sachet lebih praktis daripada botol.","Whole shallots and chillies keep longer than sliced. Sachet chilli sauce is easier than a jar."]]},
  {c:"camilan",t:["Camilan","Snacks"],tips:[
    ["Bagi camilan per hari dalam ziplock, taruh di hip belt atau saku depan supaya mudah diambil sambil jalan.","Split snacks by day in zip bags and keep them in your hip belt or front pocket."],
    ["Cokelat bisa meleleh di kendaraan yang panas. Simpan di tengah carrier selama perjalanan.","Chocolate can melt in a hot vehicle. Keep it in the middle of your pack while travelling."]]},
  {c:"minum",t:["Minuman","Drinks"],tips:[
    ["Kumpulkan kopi, teh, jahe, dan susu sachet dalam satu wadah supaya mudah dicari saat di camp.","Keep coffee, tea, ginger, and milk sachets together so they're easy to find at camp."]]},
  {c:null,t:["Menata carrier","Packing your backpack"],tips:[
    ["Makanan berat seperti beras dan kaleng taruh di tengah, dekat punggung. Yang mudah hancur di bagian atas.","Put heavy food like rice and cans in the middle, close to your back. Fragile items go on top."],
    ["Kelompokkan makanan per hari atau per waktu makan, jadi tidak perlu membongkar semua isi carrier.","Group food by day or by meal so you don't have to unpack everything."],
    ["Siapkan satu kantong sampah. Kurangi kemasan di rumah supaya sampah yang dibawa turun lebih sedikit.","Bring a trash bag and cut down packaging at home so there's less to carry back down."]]}
];
/* ===================== BAGI TUGAS ===================== */
const isPersonal=id=>food(id).c==="camilan";
function memberName(i){ const n=(S.members&&S.members[i]||"").trim(); return n||L(`Orang ${i+1}`,`Person ${i+1}`); }
function splitTasks(R){
  const P=S.people||1, out={};
  Object.keys(R.shop).forEach(id=>{ if(isPersonal(id)){ out[id]="each"; return; } const a=S.assign[id]; out[id]=(a!=null&&a!=="auto"&&(a==="each"||+a<P))?a:null; });
  return out;
}
function autoAssign(R){
  const P=S.people||1, A=splitTasks(R), load=Array(P).fill(0), CP=cookPlan(R);
  S.assignGear=S.assignGear||{};
  Object.entries(R.shop).forEach(([id,q])=>{ const a=A[id]; if(a!=null&&a!=="each") load[+a]+=food(id).g*gQ(R,id,q); });
  gearTypes(R).forEach(g=>{ const a=S.assignGear[g.k]; if(a!=null&&+a<P) load[+a]+=g.w*g.q*1000; });
  if(CP.waterPP&&S.assignWater!=null&&+S.assignWater<P) load[+S.assignWater]+=CP.waterPP*P*1000;
  const units=[];
  Object.entries(R.shop).filter(([id])=>A[id]==null).forEach(([id,q])=>units.push(["item",id,food(id).g*gQ(R,id,q)]));
  gearTypes(R).filter(g=>S.assignGear[g.k]==null||+S.assignGear[g.k]>=P).forEach(g=>units.push(["gear",g.k,g.w*g.q*1000]));
  if(CP.waterPP&&(S.assignWater==null||+S.assignWater>=P)) units.push(["water","w",CP.waterPP*P*1000]);
  units.sort((a,b)=>b[2]-a[2]).forEach(([k,key,w])=>{ let m=0; for(let x=1;x<P;x++) if(load[x]<load[m]) m=x; load[m]+=w;
    if(k==="item") S.assign[key]=m; else if(k==="gear") S.assignGear[key]=m; else S.assignWater=m; });
}
function memberLists(R){
  const P=S.people||1, A=splitTasks(R);
  return Array.from({length:P},(_,m)=>{
    const items=[]; let p=0;
    Object.entries(R.shop).forEach(([id,q])=>{ const a=A[id];
      if(a==="each"){ const qq=Math.max(1,Math.round(q*((R.factors&&R.factors[m])||1))); items.push([id,qq,true]); p+=qq*fprice(id); }
      else if(a!=null&&+a===m){ const br=buyRow(R,id,q); items.push([id,br.use,false,br]); p+=br.cost; } });
    return {m,name:memberName(m),items,g:items.reduce((s,[id,q])=>s+food(id).g*q,0),p};
  });
}
function memberText(R,ml){
  const Ls=[L(`Hai ${ml.name}, ini bagian belanjamu untuk naik *${planName()}*, ${durLabel(R.n)}, mulai ${dayDate(0)}:`,`Hi ${ml.name}, here's your shopping for *${planName()}*, ${durLabel(R.n)}, from ${dayDate(0)}:`),""];
  const sh=ml.items.filter(x=>!x[2]), own=ml.items.filter(x=>x[2]);
  if(sh.length){ Ls.push(`_${L("Dibeli dan dibawa untuk rombongan","Buy and carry for the group")}_`); sh.forEach(([id,q])=>Ls.push(`☐ ${fname(id)}, ${qty(id,q)}`)); Ls.push(""); }
  if(own.length){ Ls.push(`_${L("Untuk dirimu sendiri","For yourself")}_`); own.forEach(([id,q])=>Ls.push(`☐ ${fname(id)}, ${qty(id,q)}`)); Ls.push(""); }
  Ls.push(`${L("Perkiraan berat","Estimated weight")}: ±${kg(ml.g)}, ${L("biaya","cost")}: ±${rp(ml.p)}`,"",L("Terima kasih! Dibuat dengan Bekal Nanjak","Thanks! Made with Bekal Nanjak"));
  return Ls.join("\n");
}
const COOK_MIN={beras:20,mie:5,spaghetti:12,makaroni:12,bihun:5,bubur:3,oat:3,kentang:20,telurmentah:5,tempementah:8,tahu:8,nugget:8,sayurmix:5,sawi:3,tepungbumbu:10,energen:2,teh:2,jahe:2,kopi:2,coklatpanas:2,susububuk:2};
const COOK_WATER={beras:.15,mie:.4,spaghetti:.6,makaroni:.6,bihun:.3,bubur:.15,oat:.15,kentang:.5,energen:.2,teh:.2,jahe:.2,kopi:.2,coklatpanas:.2,susububuk:.2,sayurmix:.3,sop:.25,supkrim:.25};
const FRY=["minyak"];
function cookPlan(R){
  const P=S.people||1; let mins=0, water=0, fry=false, meals=0;
  R.D.forEach(d=>d.meals.forEach(m=>{ if(!m.on) return;
    const ids=m.items.map(([id])=>id); const recs=mealRecipes(m.key,m.slot,d.i).map(r=>PRESETS.find(p=>p.id===r)).filter(Boolean).filter(pr=>pr.tool[0]!=="Tanpa masak"&&pr.tool[0]!=="Dibuat di rumah");
    let mm=recs.length?recs.reduce((a,pr)=>a+pr.mins,0):ids.reduce((a,id)=>a+(COOK_MIN[id]||0),0);
    m.items.forEach(([id,q])=>{ if(COOK_WATER[id]) water+=COOK_WATER[id]*q; if(FRY.includes(id)) fry=true; });
    mm=Math.min(mm,40); if(mm>0){ mins+=mm*(1+0.25*(P-1)); meals++; }
  }));
  const canisters=mins>0?Math.max(1,Math.ceil(mins*1.25/100)):0;
  const sets=Math.max(1,Math.ceil(P/4));
  const maxWater=Math.max(...R.D.map(d=>d.water));
  const gear=[];
  if(mins>0){
    gear.push([L("Kompor portabel","Portable stove"),`${sets}`]);
    gear.push([L("Gas kaleng 230 g","230 g gas canister"),`${canisters}`]);
    gear.push([L("Nesting atau panci","Cook pot set"),`${sets}`]);
    if(fry) gear.push([L("Wajan kecil","Small frying pan"),`${sets}`]);
    gear.push([L("Spatula dan sendok sayur","Spatula and ladle"),"1"]);
    gear.push([L("Pisau lipat dan talenan kecil","Folding knife and small board"),"1"]);
    gear.push([L("Korek api atau pemantik, plus cadangan","Lighter, plus a spare"),"2"]);
  }
  gear.push([L("Piring atau mangkuk dan sendok","Plate or bowl and spoon"),`${P}`]);
  gear.push([L("Botol air 1,5 L","1.5 L water bottle"),`${clamp(Math.ceil(maxWater/2/1.5),1,3)*P}`]);
  gear.push([L("Kantong sampah","Trash bag"),`${Math.max(2,Math.ceil(P/2))}`]);
  return {mins:Math.round(mins),canisters,meals,waterPP:Math.round(water*10)/10,gear,P};
}
function todayIdx(n){ const t=new Date(todayStr()+"T00:00:00"), st=new Date(S.start+"T00:00:00"); const k=Math.round((t-st)/864e5); return (k>=0&&k<n)?k:null; }
function nowH(){ const d=new Date(); return d.getHours()+d.getMinutes()/60; }
const SOS=[
  {t:["Hipotermia","Hypothermia"],s:["Menggigil hebat, bicara cadel, bingung, gerakan kikuk, sangat mengantuk.","Strong shivering, slurred speech, confusion, clumsiness, extreme drowsiness."],
   a:["Pindahkan ke tempat terlindung dari angin dan hujan.","Ganti pakaian basah dengan yang kering, lalu selimuti atau masukkan ke sleeping bag.","Beri minuman hangat manis dan makanan berenergi bila masih sadar dan bisa menelan.","Jangan beri alkohol dan jangan menggosok kulit dengan keras."],
   ae:["Move them out of wind and rain.","Replace wet clothes with dry ones, then wrap them or put them in a sleeping bag.","Give a warm sweet drink and energy food if they're awake and can swallow.","No alcohol, and don't rub the skin hard."],
   h:["Berhenti menggigil tapi tetap bingung, tidak sadar, atau napas melemah.","Stops shivering but stays confused, becomes unresponsive, or breathing weakens."]},
  {t:["Dehidrasi","Dehydration"],s:["Sangat haus, mulut kering, urine sedikit dan gelap, pusing, lemas.","Strong thirst, dry mouth, little dark urine, dizziness, weakness."],
   a:["Istirahat di tempat teduh.","Minum sedikit-sedikit tapi sering.","Tambahkan oralit atau minuman elektrolit."],
   ae:["Rest in the shade.","Drink small amounts often.","Add oral rehydration salts or an electrolyte drink."],
   h:["Tidak bisa minum, muntah terus, bingung, atau pingsan.","Can't keep fluids down, keeps vomiting, is confused, or faints."]},
  {t:["Kehabisan tenaga (gula darah turun)","Running out of energy (low blood sugar)"],s:["Lemas mendadak, gemetar, keringat dingin, lapar, sulit fokus.","Sudden weakness, trembling, cold sweat, hunger, poor focus."],
   a:["Berhenti dan duduk.","Makan sumber gula cepat: gula aren, permen, madu, atau jelly.","Setelah 15 menit, lanjut makan camilan yang lebih mengenyangkan."],
   ae:["Stop and sit down.","Eat fast sugar: palm sugar, candy, honey, or jelly.","After 15 minutes, follow with a more filling snack."],
   h:["Tidak membaik setelah makan, pingsan, atau memiliki diabetes.","No improvement after eating, fainting, or the person has diabetes."]},
  {t:["Kram otot","Muscle cramps"],s:["Otot tiba-tiba mengencang dan nyeri, sering di betis atau paha.","Sudden painful tightening, often in the calf or thigh."],
   a:["Hentikan langkah dan regangkan otot perlahan.","Pijat ringan.","Minum air dengan elektrolit."],
   ae:["Stop and stretch the muscle slowly.","Massage gently.","Drink water with electrolytes."],
   h:["Kram tidak hilang, disertai bengkak, atau sangat nyeri.","Cramp won't ease, with swelling, or severe pain."]},
  {t:["Mabuk ketinggian","Altitude sickness"],s:["Sakit kepala, mual, pusing, sangat lelah, sulit tidur, biasanya di atas ±2.500 mdpl.","Headache, nausea, dizziness, fatigue, poor sleep, usually above about 2,500 m."],
   a:["Istirahat dan jangan naik lebih tinggi sampai membaik.","Minum cukup.","Kalau memburuk, turun ke tempat yang lebih rendah."],
   ae:["Rest and don't go higher until it improves.","Drink enough.","If it gets worse, go down."],
   h:["Sesak napas saat istirahat, bingung, atau jalan sempoyongan: segera turun dan cari bantuan.","Breathless at rest, confused, or staggering: descend now and get help."]},
  {t:["Keracunan makanan","Food poisoning"],s:["Mual, muntah, sakit perut, atau diare setelah makan.","Nausea, vomiting, stomach pain, or diarrhoea after eating."],
   a:["Hentikan makanan yang dicurigai.","Minum oralit sedikit-sedikit.","Istirahat."],
   ae:["Stop eating the suspected food.","Sip oral rehydration salts.","Rest."],
   h:["Ada darah, demam tinggi, atau tidak bisa minum sama sekali.","Blood, high fever, or unable to drink at all."]}
];
function vSos(){
  const card=(x,i)=>`<details class="card sosc"${i===0?" open":""}><summary><h2>${esc(L(...x.t))}</h2>${CHEV}</summary>
    <p class="sub2">${L("Tanda-tanda","Signs")}</p><p class="note" style="color:var(--ink)">${esc(L(...x.s))}</p>
    <p class="sub2">${L("Yang dilakukan","What to do")}</p><ol>${(S.lang==="en"?x.ae:x.a).map(t=>`<li>${esc(t)}</li>`).join("")}</ol>
    <p class="sub2 red">${L("Segera cari bantuan bila","Get help right away if")}</p><p class="note" style="color:var(--ink)">${esc(L(...x.h))}</p></details>`;
  return header(L("Panduan darurat","Emergency guide"),L("Bisa dibuka tanpa sinyal","Works offline"))+`<main class="wrap">
    <div class="card"><h2>${L("Nomor darurat","Emergency numbers")}</h2>
      <div class="sosn"><a href="tel:112"><b>112</b><small>${L("Darurat umum","General emergency")}</small></a><a href="tel:115"><b>115</b><small>Basarnas (SAR)</small></a><a href="tel:119"><b>119</b><small>${L("Ambulans","Ambulance")}</small></a></div>
      <label class="field" style="margin-top:12px"><span>${L("Nomor basecamp atau pengelola","Basecamp or park office number")}</span><input data-k="bcPhone" inputmode="tel" value="${esc(S.bcPhone||"")}" placeholder="08…"></label>
      ${S.bcPhone?`<a class="btn" href="tel:${esc(S.bcPhone.replace(/[^0-9+]/g,""))}" style="text-decoration:none">${L("Telepon basecamp","Call basecamp")}</a>`:""}
      <p class="note" style="margin:10px 0 0">${L("Sinyal di gunung sering tidak ada. Catat lokasi pos terakhir dan beri tahu rombongan atau pendaki lain.","There's often no signal on mountains. Note the last post you passed and tell your group or other hikers.")}</p></div>
    ${SOS.map(card).join("")}
    <p class="note">${L("Panduan pertolongan pertama dasar, bukan pengganti tenaga medis.","Basic first aid only; not a substitute for medical care.")}</p>
  </main>`;
}
function tips(R){
  const t=[], multi=R.n>1;
  if(R.snackPerHour) t.push(L(`Ngemil sekitar <b>${fmt(R.snackPerHour)} kkal tiap jam jalan</b>, misalnya 2 kurma dan setengah bungkus cokelat. Jangan tunggu sampai lapar atau lemas.`,`Snack about <b>${fmt(R.snackPerHour)} kcal per hour of walking</b>, such as 2 dates and half a pack of chocolate. Don't wait until you feel hungry or weak.`));
  t.push(L(`Minum sedikit tapi sering, kira-kira 0,5–0,75 liter per jam jalan. Tambahkan minuman ${term("elektrolit","elektrolit")} kalau banyak berkeringat.`,`Drink little and often, about 0.5–0.75 litres per hour of walking. Add an ${term("elektrolit","electrolyte")} drink if you sweat a lot.`));
  t.push(L("Tanyakan ke basecamp di mana sumber air terakhir, lalu isi penuh botol dari sana.","Ask the basecamp where the last water source is, and fill up there."));
  if(multi){
    t.push(L(`Tetap sarapan sebelum ${term("summit","summit attack")} walaupun belum lapar. Minuman hangat manis membantu tubuh cepat bertenaga.`,`Eat breakfast before the ${term("summit","summit push")} even if you're not hungry. A warm, sweet drink gives quick energy.`));
    t.push(L("Masak di luar tenda atau di teras tenda yang terbuka. Kompor di dalam tenda tertutup berisiko kebakaran dan keracunan gas.","Cook outside the tent or in an open vestibule. A stove inside a closed tent risks fire and gas poisoning."));
    t.push(L("Nasi bungkus dan lauk basah hanya untuk hari pertama. Hari berikutnya pakai makanan kering yang tidak mudah basi.","Packed rice meals and moist sides are for day one only. After that, use dry food that keeps."));
    t.push(L("Simpan makanan rapat di dalam tenda pada malam hari supaya tidak didatangi hewan.","Seal food inside the tent at night so animals don't get to it."));
  } else t.push(L("Untuk tektok, pilih makanan yang bisa dimakan tanpa dimasak supaya tidak perlu membawa kompor.","For a day hike, choose food you can eat without cooking so you can leave the stove at home."));
  t.push(L("Pindahkan makanan ke plastik ziplock dan buang kemasan berlebih di rumah. Carrier lebih ringan dan sampah lebih sedikit.","Repack food into zip bags and remove extra packaging at home. Your pack gets lighter and there's less trash."));
  t.push(L("Pisahkan camilan per hari dan taruh di kantong yang mudah dijangkau, misalnya hip belt atau saku depan.","Split snacks by day and keep them in easy-to-reach pockets, like the hip belt or a front pocket."));
  t.push(S.reserve!=="none"?L("Makanan cadangan sebaiknya disisihkan, bukan untuk camilan sehari-hari. Gunanya untuk berjaga kalau perjalanan lebih lama dari rencana.","Keep the spare food aside rather than snacking on it. It's there in case the trip takes longer than planned."):L("Kamu tidak membawa makanan cadangan. Pertimbangkan minimal sebungkus biskuit dan cokelat untuk keadaan darurat.","You're not packing emergency food. Consider at least a pack of biscuits and some chocolate."));
  if(S.exp==="first"){
    t.unshift(L("Untuk pendakian pertama, pilih jalur yang ramai, naik bersama orang yang sudah berpengalaman, dan rencanakan sudah selesai jalan sebelum gelap.","For your first hike, choose a busy trail, go with someone experienced, and plan to finish walking before dark."));
    t.push(L(`Kedinginan dan kurang makan bisa memicu ${term("hipotermia","hipotermia")}. Ganti baju basah, makan, dan minum minuman hangat saat sampai di camp.`,`Cold and too little food can lead to ${term("hipotermia","hypothermia")}. Change out of wet clothes, eat, and have a warm drink when you reach camp.`));
  }
  t.push(L("Kalau naik berkelompok, bagi tugas: satu orang membawa kompor dan gas, yang lain membawa beras atau lauk bersama. Camilan tetap dibawa masing-masing.","In a group, split the load: one person carries the stove and gas, others carry shared rice or sides. Everyone keeps their own snacks."));
  t.push(L("Bawa turun semua sampah, termasuk bungkus kecil dan sisa makanan.","Carry all trash back down, including small wrappers and leftovers."));
  return t;
}

function vGlossary(){ S.helpTab="terms"; return vHelp(); }
function vHistory(){
  const nTxt=n=>!n?"":[n.food&&L({less:"bekal kurang",ok:"bekal pas",more:"bekal sisa"}[n.food],{less:"food short",ok:"food right",more:"food left"}[n.food]),n.water&&L({less:"air kurang",ok:"air pas",more:"air lebih"}[n.water],{less:"water short",ok:"water right",more:"too much water"}[n.water]),n.pack&&L({light:"carrier ringan",ok:"carrier pas",heavy:"carrier berat"}[n.pack],{light:"light pack",ok:"pack fine",heavy:"heavy pack"}[n.pack])].filter(Boolean).join(", ");
  const rows=HIST.slice().sort((a,b)=>b.saved-a.saved).map(h=>`<div class="hist"><div class="info"><b>${esc(h.name)}</b>${h.note?`<small class="green">✓ ${esc(nTxt(h.note))}</small>`:""}<small>${esc(h.when)}, ${esc(h.dur)}</small><small>${esc(h.sum)}</small></div>
    <div class="acts"><button class="edit" data-act="reuse" data-pid="${h.pid}">${L("Pakai lagi","Reuse")}</button><button class="edit" data-act="note" data-pid="${h.pid}">${h.note?L("Catatan","Notes"):L("Isi catatan","Add notes")}</button><button class="edit" data-act="open" data-pid="${h.pid}">${L("Buka","Open")}</button><button class="rm" data-act="delHist" data-pid="${h.pid}" aria-label="${L("Hapus","Delete")} ${esc(h.name)}">×</button></div></div>`).join("");
  return header(L("Riwayat rencana","Plan history"),"Bekal Nanjak",L("Rencana tersimpan di HP ini. Buka lagi tanpa perlu mengisi ulang.","Plans are saved on this phone. Reopen them without filling everything in again."))+`<main class="wrap">
    <div class="card">${rows||`<p class="empty">${L("Belum ada rencana. Rencana otomatis tersimpan saat kamu membuka hasilnya.","No plans yet. Plans are saved automatically when you open the results.")}</p>`}</div>
    ${HIST.length?`<button class="linkbtn" data-act="exportAll">${L("Simpan semua riwayat ke file","Save all history to a file")}</button>`:""}
  </main><div class="bar"><div class="wrap"><button class="btn" data-act="new">${L("Buat rencana baru","Start a new plan")}</button></div></div>`;
}

/* ===================== EDITOR MENU ===================== */
function editorData(key){
  const R=calc(); if(!R) return null;
  if(key==="reserve") return {slot:"cadangan",title:L("Makanan cadangan","Emergency food"),target:R.reserve.target,items:R.reserve.items};
  for(const d of R.D) for(const m of d.meals) if(m.key===key) return {slot:m.slot,title:`${L(...SLOTS[m.slot].n)}, ${L("Hari","Day")} ${d.i+1}`,target:m.target,items:m.items};
  return null;
}
function vNote(){
  const h=HIST.find(x=>x.pid===S.noteFor); if(!h) { S.noteFor=null; return ""; }
  const n=h.note||{}; const q=(k,opts)=>`<div class="seg" style="--n:3">${opts.map(([v,a,b])=>`<button data-act="noteSet" data-k="${k}" data-v="${v}" aria-pressed="${n[k]===v}">${L(a,b)}</button>`).join("")}</div>`;
  return `<div class="sheet-bg" data-act="noteClose"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ntT" data-stop="1">
    <h2 id="ntT">${L("Catatan pendakian","Trip notes")}</h2><p class="hint">${esc(h.name)}, ${esc(h.when)}. ${L("Jawabanmu dipakai untuk menyesuaikan rencana berikutnya.","Your answers adjust your next plan.")}</p>
    <p class="sub2">${L("Bekal makanan","Food")}</p>${q("food",[["less","Kurang","Not enough"],["ok","Pas","Just right"],["more","Sisa banyak","Lots left"]])}
    <p class="sub2">${L("Air minum","Water")}</p>${q("water",[["less","Kurang","Not enough"],["ok","Pas","Just right"],["more","Berlebih","Too much"]])}
    <p class="sub2">${L("Berat carrier","Pack weight")}</p>${q("pack",[["light","Ringan","Light"],["ok","Pas","Fine"],["heavy","Berat","Heavy"]])}
    <label class="field"><span>${L("Catatan lain","Other notes")}</span><input id="noteTxt" maxlength="200" value="${esc(n.text||"")}" placeholder="${L("Contoh: bawa lebih banyak kopi","e.g. bring more coffee")}"></label>
    <div class="sheet-acts"><button class="btn ghost" data-act="noteClose">${L("Batal","Cancel")}</button><button class="btn" data-act="noteSave">${L("Simpan catatan","Save notes")}</button></div></div></div>`;
}
function vSheet(){
  if(S.msg) return `<div class="sheet-bg" data-act="msgClose"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="msgT" data-stop="1">
    <h2 id="msgT">${esc(S.msg.t)}</h2><p class="hint">${L("Ubah dulu kalau perlu, lalu kirim.","Edit if needed, then send.")}</p>
    <textarea id="msgTxt" class="msgbox" aria-label="${L("Isi pesan","Message")}">${esc(S.msg.x)}</textarea>
    <p class="toast" id="msgToast" role="status"></p>
    <div class="sheet-acts"><button class="btn ghost" data-act="msgCopy">${L("Salin","Copy")}</button><button class="btn" data-act="msgShare">${L("Kirim","Send")}</button></div>
    <button class="linkbtn" data-act="msgClose" style="width:100%">${L("Tutup","Close")}</button></div></div>`;
  if(S.noteFor) return vNote();
  if(S.confirm){ const c=S.confirm;
    return `<div class="sheet-bg" data-act="noConfirm"><div class="sheet confirm" role="alertdialog" aria-modal="true" aria-labelledby="cfT" aria-describedby="cfD" data-stop="1">
      <h2 id="cfT">${esc(c.title)}</h2><p id="cfD">${esc(c.msg)}</p>
      <div class="sheet-acts"><button class="btn ghost" data-act="noConfirm">${L("Batal","Cancel")}</button><button class="btn" data-act="yesConfirm" style="${c.danger?"background:var(--red)":""}">${esc(c.yes)}</button></div></div></div>`; }
  if(S.term&&GLOSS[S.term]){ const g=GLOSS[S.term];
    return `<div class="sheet-bg" data-act="closeTerm"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="tmT" data-stop="1">
      <h2 id="tmT">${esc(L(...g[0]))}</h2><p style="margin:8px 0 0">${esc(L(...g[1]))}</p>
      <div class="sheet-acts"><button class="btn ghost" data-act="glossary">${L("Semua istilah","All terms")}</button><button class="btn" data-act="closeTerm">${L("Mengerti","Got it")}</button></div></div></div>`; }
  if(!S.edit) return "";
  return editorHTML();
}
function setItems(key,items){
  S.recipeOf=S.recipeOf||{};
  if(!S.custom[key]&&!S.recipeOf[key]){ const [d,slot]=key==="reserve"?[0,"cadangan"]:key.slice(1).split("-"); const rid=templateRecipe(slot,+d); S.recipeOf[key]=rid?[rid]:[]; }
  S.custom[key]=items.filter(([,q])=>q>0);
}

/* ===================== IKON KECIL ===================== */
const IC={
  one:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 15-5 16 0"/></svg>',
  grp:'<svg width="17" height="15" viewBox="0 0 28 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="8" r="4"/><path d="M2 21c1-5 15-5 16 0"/><circle cx="20" cy="7" r="3"/><path d="M19 14c4 0 7 2 7 6"/></svg>',
  book:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 5c3-1 6-1 10 1v14c-4-2-7-2-10-1z"/><path d="M22 5c-3-1-6-1-10 1v14c4-2 7-2 10-1z"/></svg>'
};
const scope=(grp,n)=>`<span class="scope">${grp?IC.grp:IC.one} ${grp?L(`Rombongan ${n} orang`,`Group of ${n}`):L("Per orang","Per person")}</span>`;
const PLAY_URL=""; // isi setelah rilis, contoh: https://play.google.com/store/apps/details?id=com.miraiteam.bekalnanjak
const APP_URL=()=>location.origin+location.pathname;

/* ===================== AIR ===================== */
function waterPlan(R){
  const P=S.people||1, CP=cookPlan(R);
  const days=R.D.map(d=>{
    const walk=Math.round(d.trekH*0.6*10)/10;
    const camp=Math.max(0,Math.round((d.water-walk)*10)/10);
    return {i:d.i,walk,camp,drink:d.water};
  });
  const sanit=0.75*R.n, drinkTrip=days.reduce((a,x)=>a+x.drink,0);
  const cookG=CP.waterPP*P, washG=0.5*CP.meals;
  const total=drinkTrip*P+sanit*P+cookG+washG;
  const maxDrink=Math.max(...days.map(x=>x.drink));
  let carry, carryTxt;
  if(S.waterSrc==="no"){ carry=drinkTrip+sanit+(cookG+washG)/P; carryTxt=L(`Tidak ada sumber air: bawa semua dari basecamp, ±${dec(carry)} L per orang.`,`No water on the trail: carry it all from basecamp, about ${dec(carry)} L per person.`); }
  else if(S.waterSrc==="yes"){ carry=Math.min(3,maxDrink); carryTxt=L(`Ada sumber air: bawa ±${dec(carry)} L per orang, lalu isi ulang di sumber air.`,`Water on the trail: carry about ${dec(carry)} L per person and refill.`); }
  else { carry=Math.min(3,maxDrink); carryTxt=L("Belum tahu soal sumber air? Tanyakan ke basecamp. Kalau ragu, bawa semua dari bawah.","Not sure about water? Ask the basecamp. If in doubt, carry it all from the bottom."); }
  return {days,sanit,cookG,washG,total,carry,carryTxt,P};
}

/* ===================== GAMBARAN PERJALANAN ===================== */
const GEAR_W=[["kompor",.3],["gas",.37],["nesting",.6],["wajan",.35]];
function gearUnits(R){
  const CP=cookPlan(R), P=S.people||1, sets=Math.max(1,Math.ceil(P/4)), u=[];
  if(!CP.mins) return u;
  const fry=CP.gear.some(([n])=>/Wajan|pan/i.test(n));
  for(let k=0;k<sets;k++){ u.push(["kompor",L("Kompor portabel","Portable stove"),.3]); u.push(["nesting",L("Nesting atau panci","Cook pot set"),.6]); if(fry) u.push(["wajan",L("Wajan kecil","Small frying pan"),.35]); }
  for(let k=0;k<CP.canisters;k++) u.push(["gas",L("Gas kaleng 230 g","230 g gas canister"),.37]);
  return u;
}
function tripTotals(R){
  const P=S.people||1, W=waterPlan(R);
  const gearKg=gearUnits(R).reduce((a,x)=>a+x[2],0)/P;
  const foodKg=R.G/1000, waterKg=W.carry;
  const carryKg=foodKg+waterKg+gearKg;
  const c=S.costs||{}; const extraPP=(+c.ticket||0)+(+c.transport||0)+((+c.other||0)/P);
  const costPP=R.P+extraPP;
  const fresh=["sayur"]; let packs=0;
  Object.entries(R.shop).forEach(([id,q])=>{ const f=food(id); if(!f) return; if(f.c==="sayur"||["telurmentah","beras","minyak","garam"].includes(id)) return; packs+=q; });
  return {foodKg,waterKg,gearKg,carryKg,costPP,costG:buyTotal(R)+((+c.ticket||0)+(+c.transport||0))*P+(+c.other||0),packs:packs*P,trashG:packs*P*6,P};
}

/* ===================== GANTI MENU CEPAT ===================== */
const NB=[["nb-ayam",["Nasi bungkus ayam goreng","Packed rice, fried chicken"],[["nasibayam",1],["pisang",1]]],["nb-telur",["Nasi bungkus telur balado","Packed rice, chilli eggs"],[["nasibtelur",1],["pisang",1]]],["nb-tempe",["Nasi bungkus tempe orek","Packed rice, sweet tempeh"],[["nasibtempe",1],["pisang",1]]]];
function lateFor(id,i,slot){ const f=food(id); return f&&f.keep!=null&&f.keep<i+(slot==="malam"?0.75:slot==="siang"?0.5:0.25); }
function altsFor(slot,key,i){
  const cur=mealRecipes(key,slot,i), shift=(S.altShift&&S.altShift[key])||0;
  let list=[];
  if(slot==="cemilan"||slot==="cadangan"||slot==="summit") list=SNACK_PACKS.map((p,k)=>({id:"pack"+k,n:PACK_NAME[k],items:p}));
  else {
    if(slot==="siang"&&i===0) list=NB.map(([id,n,items])=>({id,n,items}));
    list=list.concat(PRESETS.filter(pr=>pr.for.includes(slot)).map(pr=>({id:pr.id,n:pr.n,items:pr.items})));
  }
  list=list.filter(a=>!cur.includes(a.id)&&!a.items.some(([id])=>isAvoided(id)||lateFor(id,i,slot)));
  if(!list.length) return [];
  const out=[]; for(let k=0;k<Math.min(3,list.length);k++) out.push(list[(shift+k)%list.length]);
  return out;
}
const MAXQ={mie:2,miecup:2,beras:2,nasiinstan:2,spaghetti:2,makaroni:2,bihun:2,roti:3,rotisi:3,oat:3,bubur:3,granola:3,kentang:3,tortilla:3};
const capQ=(id,q,snack)=>Math.min(q,snack?3:(MAXQ[id]||q));
function scaleItems(items,target,slot){
  const snack=slot==="cemilan"||slot==="cadangan"||slot==="summit";
  const kb=items.find(([id])=>FOODS[id]&&FOODS[id].c==="karbo");
  let t=filterAvoid(items.map(([id,q])=>[id,q,snack?1:(kb&&id===kb[0]?1:0)]));
  let fixed=0,flexK=0; t.forEach(([id,q,f])=>{ if(f) flexK+=FOODS[id].k*q; else fixed+=FOODS[id].k*q; });
  if(!flexK) return t.map(([id,q])=>[id,q]);
  const remain=Math.max(0,target-fixed);
  return t.map(([id,q,f])=>f?[id,capQ(id,Math.max(1,Math.round(remain*(FOODS[id].k*q/flexK)/FOODS[id].k)),snack)]:[id,q]);
}
function applyAlt(key,slot,i,target,alt){
  setItems(key,scaleItems(alt.items,target,slot));
  S.recipeOf=S.recipeOf||{}; S.recipeOf[key]=PRESETS.some(p=>p.id===alt.id)?[alt.id]:[];
  S.altShift=S.altShift||{}; S.altShift[key]=((S.altShift[key]||0)+1);
}

/* ===================== HALAMAN HASIL ===================== */
function vResult(){
  const R=calc(); if(!R) return vRoute();
  const P=S.people||1, grp=P>1;
  const TABS=[["sum","Ringkasan","Summary"],["menu","Menu","Menu"],["shop","Belanja","Shopping"]].concat(grp?[["team","Rombongan","Group"]]:[]).concat([["road","Di Jalur","On the trail"]]);
  let tab=S.tab||"sum"; if(!TABS.some(t=>t[0]===tab)) tab="sum";
  const chips=(list,day,slot)=>list.length?`<div class="items">${list.map(([id,q])=>{const late=day!=null&&lateFor(id,day,slot); const av=avoidNote(id); const hv=slot==="cemilan"&&HEAVY_SNACK.includes(id); return `<span class="${late||av?"late":""}">${esc(fname(id))}, ${esc(qty(id,q))}${late?` <em>${L("cepat basi","spoils fast")}</em>`:""}${av?` <em>${L("mengandung","contains")} ${esc(av)}</em>`:""}${hv?` <em>${L("untuk istirahat panjang","for longer breaks")}</em>`:""}</span>`}).join("")}</div>`:`<p class="note">${L("Belum ada makanan.","No food yet.")}</p>`;
  const balance=(list,slot)=>{ if(slot==="cemilan") return ""; const N=nut(list); const tag=(ok,txt)=>`<span class="bal ${ok?"ok":"no"}">${ok?"✓":"–"} ${txt}</span>`;
    return `<div class="balrow">${tag(N.g.karbo,L("Karbo","Carbs"))}${tag(N.g.protein||N.pr>=10,L("Protein","Protein"))}${tag(N.g.sayur,L("Sayur/buah","Veg/fruit"))}</div>`; };
  const howto=(x,d)=>mealRecipes(x.key,x.slot,d.i).map(rid=>PRESETS.find(p=>p.id===rid)).filter(pr=>pr&&pr.items.some(([id])=>FOODS[id].c!=="bumbu"&&x.items.some(([j])=>j===id))).map(pr=>`<details class="howto"><summary>${L("Cara masak","How to cook")}: ${esc(L(...pr.n))}</summary>${howtoHTML(pr)}</details>`).join("");
  const tabsHTML=`<div class="tabs"><div class="seg" style="--n:${TABS.length}" role="tablist">${TABS.map(([v,a,b])=>`<button role="tab" data-act="tab" data-v="${v}" aria-selected="${tab===v}" aria-pressed="${tab===v}">${L(a,b)}</button>`).join("")}</div></div>`;
  let body="";
  if(tab==="sum"){
    const W=waterPlan(R), TT=tripTotals(R), CP=cookPlan(R);
    const alerts=[];
    const late=R.D.map(d=>({d,PL:dayPlan(R,d)})).find(x=>x.PL.walk&&x.PL.clock(x.PL.walk)>17.5);
    if(late) alerts.push(L(`Hari ${late.d.i+1} baru selesai jalan ±${hhmm(late.PL.clock(late.PL.walk))}. Mulai lebih pagi atau ngecamp, dan bawa ${term("headlamp","headlamp")}.`,`Day ${late.d.i+1} ends around ${hhmm(late.PL.clock(late.PL.walk))}. Start earlier or camp, and bring a ${term("headlamp","headlamp")}.`));
    if(R.n===1&&R.D[0].trekH>12) alerts.unshift(L(`Tektok ini butuh ±${dec(R.D[0].trekH)} jam jalan. Sebaiknya ngecamp.`,`This day hike needs about ${dec(R.D[0].trekH)} hours of walking. Consider camping.`));
    if(TT.carryKg+6>S.weight*0.3) alerts.push(L("Bawaan berisiko terlalu berat. Pertimbangkan carrier ringan atau bagi beban dengan rombongan.","Your load may be too heavy. Consider the light pack option or sharing with the group."));
    if((S.adjFood||1)!==1||(S.adjWater||1)!==1) alerts.push(L(`Disesuaikan dari catatan pendakianmu sebelumnya.`,`Adjusted from your previous trip notes.`)+` <button class="linkbtn" data-act="adjReset">${L("Kembalikan","Reset")}</button>`);
    const plates=Math.round(R.perDay/650);
    const done=PREP.filter(([k])=>S.prep&&S.prep[k]).length;
    const prevH=HIST.filter(h=>h.note&&h.pid!==S.pid).sort((a,b)=>((b.data&&b.data.mountain===S.mountain)?1:0)-((a.data&&a.data.mountain===S.mountain)?1:0)||b.saved-a.saved)[0];
    const prevC=prevH?`<div class="card prevc"><b>${L("Dari pendakian sebelumnya","From your last trip")}</b><small>${esc(prevH.name)}</small>
      <p class="note" style="margin:6px 0 0;color:var(--ink)">${esc([prevH.note.food&&L({less:"Bekal kurang",ok:"Bekal pas",more:"Bekal sisa banyak"}[prevH.note.food],{less:"Food ran short",ok:"Food was right",more:"Lots of food left"}[prevH.note.food]),prevH.note.water&&L({less:"air kurang",ok:"air pas",more:"air berlebih"}[prevH.note.water],{less:"water ran short",ok:"water was right",more:"too much water"}[prevH.note.water])].filter(Boolean).join(", "))}${prevH.note.text?`. "${esc(prevH.note.text)}"`:""}</p>
      ${(S.adjFood||1)!==1||(S.adjWater||1)!==1?`<small>${L("Penyesuaian sudah diterapkan ke rencana ini.","Adjustments are applied to this plan.")}</small>`:""}</div>`:"";
    body=prevC+`<details class="card prepc"${done<4?" open":""}><summary><span><b>${L("Persiapan","Preparation")} ${done}/4</b></span>${CHEV}</summary>
        ${PREP.map(([k,o,t])=>{const dn=!!(S.prep&&S.prep[k]); return `<div class="prow${dn?" got":""}"><button class="ck" data-act="prep" data-v="${k}" role="checkbox" aria-checked="${dn}" aria-label="${esc(L(...t))}"></button><span>${L(...t)}${prepTight(k,o)&&!dn?` <em class="tight">${L("Mepet","Tight")}</em>`:""}</span>${o===0?`<small>${new Date(S.start+"T00:00:00").toLocaleDateString(LOC(),{day:"numeric",month:"short"})}</small>`:dateField(`data-prepdate="${k}" max="${S.start}" aria-label="${L("Tanggal","Date")}"`,prepDate(k,o))}</div>`}).join("")}</details>
      <div class="hero">${TOPO}
        <div class="hrow">${scope(false)}</div>
        <div class="big3"><div><small>${L("Bekal","Food")}</small><b>${kg(R.G)}</b></div><div><small>${L("Biaya bekal","Food cost")}</small><b>${rp(R.P)}</b></div><div><small>${L("Air minum/hari","Water/day")}</small><b>±${dec(Math.max(...R.D.map(d=>d.water)))} L</b></div></div>
        ${grp?`<div class="hrow" style="margin-top:12px">${scope(true,P)}</div>
        <div class="big3"><div><small>${L("Belanja","Shopping")}</small><b>${rp(buyTotal(R))}</b></div><div><small>${L("Gas","Gas")}</small><b>${CP.canisters} ${L("kaleng","cans")}</b></div><div><small>${L("Air dibawa/orang","Water carried each")}</small><b>±${dec(W.carry)} L</b></div></div>`:""}</div>
      ${alerts.map(a=>`<p class="alert">${a}</p>`).join("")}
      <details class="card why"><summary><span><b>${L(`±${fmt(R.perDay)} kkal per hari, setara ±${plates} piring nasi lengkap`,`±${fmt(R.perDay)} kcal a day, about ${plates} full plates of rice`)}</b><small>${L("Kenapa sebanyak ini?","Why so much?")}</small></span>${CHEV}</summary>
        <p>${L(`Mendaki naik-turun berjam-jam sambil membawa beban membakar sekitar ${nf(R.perDay/2000,{maximumFractionDigits:1})}× energi hari biasa. Angka ini untuk seharian penuh. Sebagian ditutup dari makan di rumah atau basecamp, dan saat berjalan tubuh hanya bisa mencerna ±200–300 kkal per jam, jadi porsi bekal sengaja dibuat masuk akal.`,`Hiking up and down for hours with a load burns about ${nf(R.perDay/2000,{maximumFractionDigits:1})}× a normal day's energy. This covers the whole day. Some comes from meals at home or basecamp, and while walking you can only digest about 200–300 kcal an hour, so the packed portions are kept realistic.`)}</p></details>
      <div class="card"><h2>${L("Perjalanan","The trip")}</h2>
        <div class="kv"><span>${L("Bawaan per orang","Load per person")}</span><b>±${nf(TT.carryKg,{maximumFractionDigits:1})} kg</b></div>
        <p class="note" style="margin:0 0 8px">${L(`Bekal ${nf(TT.foodKg,{maximumFractionDigits:1})} kg, air dibawa ${nf(TT.waterKg,{maximumFractionDigits:1})} kg${TT.gearKg?`, alat masak ${nf(TT.gearKg,{maximumFractionDigits:1})} kg`:""}. Belum termasuk tenda dan perlengkapan lain.`,`Food ${nf(TT.foodKg,{maximumFractionDigits:1})} kg, water ${nf(TT.waterKg,{maximumFractionDigits:1})} kg${TT.gearKg?`, cooking gear ${nf(TT.gearKg,{maximumFractionDigits:1})} kg`:""}. Tent and other gear not included.`)}</p>
        <div class="kv"><span>${L("Total biaya per orang","Total cost per person")}</span><b>${rp(TT.costPP)}</b></div>
        ${grp?`<div class="kv"><span>${L("Total rombongan","Group total")}</span><b>${rp(TT.costG)}</b></div>`:""}
        <details class="mini-d"><summary>${L("Tambah biaya lain","Add other costs")}</summary>
          <div class="row2" style="margin-top:8px"><label class="field"><span>${L("Tiket/SIMAKSI per orang","Permit per person")}</span><input type="number" inputmode="numeric" data-cost="ticket" value="${(S.costs&&S.costs.ticket)||""}" placeholder="0"></label>
          <label class="field"><span>${L("Transport per orang","Transport per person")}</span><input type="number" inputmode="numeric" data-cost="transport" value="${(S.costs&&S.costs.transport)||""}" placeholder="0"></label></div>
          <label class="field"><span>${L("Lainnya untuk rombongan (porter, parkir)","Other for the group (porter, parking)")}</span><input type="number" inputmode="numeric" data-cost="other" value="${(S.costs&&S.costs.other)||""}" placeholder="0"></label></details>
        <div class="kv" style="margin-top:6px"><span>${L("Sampah dibawa turun","Trash to carry down")}</span><b>±${TT.packs} ${L("kemasan","wrappers")}</b></div></div>
      <div class="card"><h2>${L("3 hal terpenting","3 things that matter")}</h2><ol class="key">
        <li><span><b>${L("Ngemil sedikit tapi rutin","Small, regular snacks")}</b>${L(`Beberapa suap tiap ${S.snackEvery||60} menit. Kalau perut penuh, cukup minum.`,`A few bites every ${S.snackEvery||60} minutes. If you feel full, just drink.`)}</span></li>
        <li><span><b>${L("Minum sedikit tapi sering","Drink little and often")}</b>${L("±250 ml tiap jam, plus teguk tiap 15–20 menit.","About 250 ml an hour, plus sips every 15–20 minutes.")}</span></li>
        <li><span><b>${L("Sisihkan makanan cadangan","Set aside spare food")}</b>${L("Untuk berjaga kalau perjalanan lebih lama.","In case the trip takes longer.")}</span></li></ol></div>
      <details class="card about"><summary><h2 style="font-size:1.15rem;color:var(--ink)">${L("Ini hanya saran","This is only a suggestion")}</h2>${CHEV}</summary>
        <p>${L("Sesuaikan dengan pola makan, alergi, dan kondisi kesehatanmu. Jika hamil atau menyusui, menjalani diet khusus, atau punya kondisi seperti diabetes, gangguan jantung, ginjal, atau riwayat gangguan makan, diskusikan dulu dengan tenaga kesehatan. Angka kalori, harga, dan data jalur adalah perkiraan.","Adjust to your diet, allergies, and health. If pregnant or breastfeeding, on a special diet, or with conditions such as diabetes, heart or kidney disease, or a history of eating disorders, talk to a health professional first. Calories, prices, and trail data are estimates.")}</p></details>`;
  } else if(tab==="menu"){
    body=`<p class="note" style="margin:0 0 10px">${scope(false)} ${L("Porsi tidak harus habis sekaligus.","Portions don't have to be eaten at once.")}</p>
      ${R.D.map(d=>`<div class="card day"><div class="dayband c${d.i%2}"><span><b>${L("Hari","Day")} ${d.i+1}</b><small>${esc(dayDate(d.i))}${d.trekH?`, ±${dec(d.trekH)} ${L("jam jalan","h walking")}`:""}</small></span><button class="edit" data-act="shuffleDay" data-v="${d.i}">${L("Acak variasi","Shuffle")}</button></div>
        <details class="why2"><summary>${L(`Energi seharian ${fmt(d.need)} kkal, dari bekal ${fmt(d.packed)} kkal`,`Day's energy ${fmt(d.need)} kcal, from packed food ${fmt(d.packed)} kcal`)}</summary><p>${L("Sisanya dari makan di rumah atau basecamp. Saat berjalan tubuh hanya bisa mencerna ±200–300 kkal per jam, jadi kekurangan sesaat itu wajar.","The rest comes from meals at home or basecamp. While walking you can only digest about 200–300 kcal an hour, so a short shortfall is normal.")}</p></details>
        ${d.meals.map(x=>{ if(!x.on) return `<div class="meal off"><div class="meal-h"><b>${L(...SLOTS[x.slot].n)}</b><button class="edit" data-act="meal" data-key="${x.key}">${L("Bawa","Pack it")}</button></div><p class="note">${whyOff(d.i,x.slot,R.n)}</p></div>`;
          const alts=altsFor(x.slot,x.key,d.i).filter(a=>!x.items.some(([j])=>j===a.items[0][0])), hasNB=x.items.some(([id])=>/^nasib/.test(id));
          return `<div class="meal"><div class="meal-h"><b>${L(...SLOTS[x.slot].n)}${x.custom?`<span class="badge">${L("diubah","edited")}</span>`:""}</b><span class="r"><span class="kcal-tag">${fmt(kOf(x.items))} ${L("kkal","kcal")}</span><button class="edit" data-act="edit" data-key="${x.key}">${L("Atur","Edit")}</button></span></div>
            ${chips(x.items,d.i,x.slot)}${balance(x.items,x.slot)}
            ${hasNB?`<p class="note">${L("Pilih lauk kering: ayam goreng, telur balado, atau tempe orek. Sambal dibungkus terpisah. Hindari santan dan sayur berkuah.","Pick dry sides: fried chicken, chilli eggs, or sweet tempeh. Keep the chilli separate. Avoid coconut-milk dishes and soupy vegetables.")}</p>`:""}
            ${alts.length?`<div class="alts"><span>${L("Ganti:","Swap:")}</span>${alts.map(a=>`<button class="chip sm" data-act="useAlt" data-key="${x.key}" data-alt="${a.id}">${esc(L(...a.n))}</button>`).join("")}</div>`:""}
            ${howto(x,d)}</div>`}).join("")}
        </div>`).join("")}
      ${S.reserve!=="none"?`<div class="card"><div class="meal-h"><h3>${L("Makanan cadangan","Spare food")}</h3><span class="r"><span class="kcal-tag">${fmt(kOf(R.reserve.items))} ${L("kkal","kcal")}</span><button class="edit" data-act="edit" data-key="reserve">${L("Atur","Edit")}</button></span></div>${chips(R.reserve.items)}</div>`:""}`;
  } else if(tab==="shop"){
    const row=([id,q0])=>{const br=buyRow(R,id,q0); const got=!!S.got[id]; return `<div class="sr${got?" got":""}"><b><button class="ck" data-act="got" data-id="${id}" role="checkbox" aria-checked="${got}" aria-label="${esc(fname(id))}"></button>${esc(fname(id))}</b>
      <span class="p">${S.editPrice?"":rp(br.cost)}</span><em>${esc(br.b?L("Beli","Buy")+" "+br.label:br.label)}${br.b&&id!=="garam"?`, ${L("dipakai","uses")} ${esc(qty(id,br.use))}`:""}</em><span></span>
      ${S.editPrice?`<div class="edrow"><label>${L("Harga per","Price per")} ${esc(funit(id))}<input type="number" inputmode="numeric" data-price="${id}" value="${fprice(id)}"></label><label>${L("Kalori","kcal")}<input type="number" inputmode="numeric" data-kcal="${id}" value="${food(id).k}"></label></div>`:""}</div>`};
    const groups=Object.keys(CATS).map(c=>{const it=Object.entries(R.shop).filter(([id])=>food(id).c===c); if(!it.length) return "";
      return `<div class="sgh">${esc(L(...CATS[c]))}<span>${rp(it.reduce((a,[id,q])=>a+buyRow(R,id,q).cost,0))}</span></div>${it.map(row).join("")}`}).join("");
    const nGot=Object.keys(R.shop).filter(id=>S.got[id]).length, nAll=Object.keys(R.shop).length, CP=cookPlan(R);
    body=`<div class="card"><div class="row-h"><h2>${L("Daftar belanja","Shopping list")}</h2><button class="linkbtn" data-act="editPrice">${S.editPrice?L("Selesai","Done"):L("Ubah harga & kalori","Edit prices & kcal")}</button></div>
      <p class="note" style="margin:0 0 10px">${scope(grp,P)} ${grp?`<button class="linkbtn" data-act="goto" data-step="2">${L("Ubah jumlah","Change")}</button>`:""} ${L(`Sudah dibeli ${nGot}/${nAll}.`,`${nGot}/${nAll} bought.`)}</p>
      ${S.editPrice?`<p class="hint">${L("Sesuaikan dengan label dan harga di tempatmu.","Match the label and your local price.")}</p>`:""}
      <div class="shop">${groups}<div class="tot"><span>${L("Total belanja","Shopping total")}</span><span>${rp(buyTotal(R))}</span></div></div>
      ${buyTotal(R)>R.P*(R.GF||1)*1.15?`<p class="note" style="margin:8px 0 0">${L(`Lebih besar dari yang dipakai (±${rp(R.P*(R.GF||1))}) karena dibeli per kemasan. Sisanya bisa dipakai untuk pendakian berikutnya.`,`Higher than what's used (about ${rp(R.P*(R.GF||1))}) because items come in whole packs. Leftovers keep for the next trip.`)}</p>`:""}
      <div class="row2" style="margin:12px 0 0"><button class="btn" data-act="share">${L("Bagikan","Share")}</button><button class="btn ghost" style="color:var(--ink);border-color:var(--line)" data-act="copy">${L("Salin","Copy")}</button></div>
      <p class="toast" id="toast" role="status"></p><textarea id="copybox" readonly hidden aria-label="${L("Daftar belanja","Shopping list")}"></textarea></div>
      <div class="card" id="alat"><h2>${L("Alat masak dan gas","Cooking gear and gas")}</h2><p class="note" style="margin:0 0 8px">${scope(grp,P)}</p>
        <div class="shop">${CP.gear.map(([n,q])=>`<div class="sr"><b>${esc(n)}</b><span class="p">${esc(q)}</span></div>`).join("")}</div>
        ${CP.mins?`<p class="note" style="margin:8px 0 0">${L(`Kompor menyala ±${fmt(CP.mins)} menit. Gas sudah ditambah cadangan untuk angin dan dingin.`,`Stove time about ${fmt(CP.mins)} minutes, with a margin for wind and cold.`)}</p>`:""}</div>
      <div class="card" id="packing"><h2>${L("Tips packing","Packing tips")}</h2>
        ${PACK.filter(g=>!g.c||Object.keys(R.shop).some(id=>food(id).c===g.c)).map((g,gi)=>`<details class="pk"${gi===0?" open":""}><summary>${esc(L(...g.t))}${CHEV}</summary><ul class="tips">${g.tips.map(t=>`<li><span>${esc(L(...t))}</span></li>`).join("")}</ul></details>`).join("")}</div>`;
  } else if(tab==="team"){
    const ML=teamLists(R), A=splitTasks(R), PT=patungan(R), CP=cookPlan(R);
    const names=ML.map(m=>m.name);
    const pick=(kind,key,cur)=>`<div class="who2">${names.map((n,m)=>`<button class="chip sm${String(cur)===String(m)?" on":""}" data-act="assign" data-kind="${kind}" data-key="${key}" data-v="${m}" aria-pressed="${String(cur)===String(m)}">${esc(n)}</button>`).join("")}${kind==="item"?`<button class="chip sm${cur==="each"?" on":""}" data-act="assign" data-kind="item" data-key="${key}" data-v="each" aria-pressed="${cur==="each"}">${L("Masing-masing","Each")}</button>`:""}</div>`;
    const shared=Object.entries(R.shop).filter(([id])=>A[id]!=="each"||!isPersonal(id)).filter(([id])=>!isPersonal(id));
    const GT=gearTypes(R);
    const total=shared.length+GT.length+(CP.waterPP?1:0);
    const doneN=shared.filter(([id])=>A[id]!=null).length+GT.filter(g=>S.assignGear&&S.assignGear[g.k]!=null).length+(CP.waterPP&&S.assignWater!=null?1:0);
    body=`<div class="card"><div class="row-h"><h2>${L("Anggota","Members")}</h2><button class="linkbtn" data-act="goto" data-step="2">${P} ${L("orang","people")}</button></div>
        ${ML.map(m=>{ const b=m.m>0&&S.mbody&&S.mbody[m.m]; return `<div class="mbr"><input data-member="${m.m}" maxlength="20" value="${esc((S.members||[])[m.m]||"")}" placeholder="${esc(m.m===0?L("Kamu","You"):L(`Orang ${m.m+1}`,`Person ${m.m+1}`))}" aria-label="${L("Nama anggota","Member name")} ${m.m+1}">
          ${m.m===0?`<small>${L("Data dari langkah 3","Data from step 3")}</small>`:`<div class="seg mtog" style="--n:2;margin:0"><button data-act="mbSet" data-m="${m.m}" data-v="same" aria-pressed="${!b}">${L("Sama dengan saya","Same as me")}</button><button data-act="mbSet" data-m="${m.m}" data-v="own" aria-pressed="${!!b}">${L("Data sendiri","Own data")}</button></div>`}
          ${b?`<div class="mbd"><div class="seg" style="--n:2;margin:0"><button data-act="mbSex" data-m="${m.m}" data-v="m" aria-pressed="${(b.sex||"m")==="m"}">L</button><button data-act="mbSex" data-m="${m.m}" data-v="f" aria-pressed="${b.sex==="f"}">P</button></div>
            <label>${L("Usia","Age")}<input type="number" inputmode="numeric" data-mb="age" data-m="${m.m}" value="${b.age||""}"></label><label>${L("Berat (kg)","Weight (kg)")}<input type="number" inputmode="numeric" data-mb="weight" data-m="${m.m}" value="${b.weight||""}"></label></div>`:""}</div>`}).join("")}</div>
      <div class="card"><div class="row-h"><h2>${L("Bagi barang bersama","Split shared items")}</h2><span class="kcal-tag">${doneN}/${total}</span></div>
        <p class="note" style="margin:0 0 6px">${L("Ketuk nama yang membeli dan membawa.","Tap who buys and carries it.")} <button class="linkbtn" data-act="autoSplit">${L("Bagi otomatis","Auto-split")}</button>${doneN?` <button class="linkbtn" data-act="clearSplit">${L("Kosongkan","Clear")}</button>`:""}</p>
        ${shared.map(([id,q])=>`<div class="arow${A[id]==null?" open":""}"><span><b>${esc(fname(id))}</b><small>${esc(buyRow(R,id,q).label)}</small></span>${pick("item",id,A[id])}</div>`).join("")}
        ${GT.map(g=>`<div class="arow${S.assignGear&&S.assignGear[g.k]!=null?"":" open"}"><span><b>${esc(g.n)}</b><small>${g.q}</small></span>${pick("gear",g.k,S.assignGear&&S.assignGear[g.k])}</div>`).join("")}
        ${CP.waterPP?`<div class="arow${S.assignWater!=null?"":" open"}"><span><b>${L("Air untuk masak","Cooking water")}</b><small>±${dec(CP.waterPP*P)} L</small></span>${pick("water","w",S.assignWater)}</div>`:""}
        <p class="note" style="margin:8px 0 0">${L("Setiap orang membawa sendiri: camilan, makanan cadangan, alat makan, dan botol air.","Everyone brings their own snacks, spare food, cutlery, and water bottle.")}</p></div>
      <div class="card"><h2>${L("Per anggota","Per member")}</h2>
        ${ML.map(m=>`<div class="mrow"><span><b>${S.sent&&S.sent[m.m]?"✓ ":""}${esc(m.name)}</b><small>±${kg(m.g)}, ${L("belanja","spends")} ${rp(m.p)}</small></span><button class="edit" data-act="shareMember" data-m="${m.m}">${L("Kirim","Send")}</button></div>`).join("")}</div>
      <div class="card"><h2>${L("Patungan","Cost split")}</h2>
        <div class="kv"><span>${L("Belanja bersama","Shared shopping")}</span><b>${rp(PT.shared)}</b></div>
        <div class="kv"><span>${L("Per orang","Per person")}</span><b>${rp(PT.share)}</b></div>
        ${PT.open?`<p class="note">${L(`${rp(PT.open)} belum dibagi.`,`${rp(PT.open)} not assigned yet.`)}</p>`:""}
        ${PT.tr.length?[...new Set(PT.tr.map(t=>t[1]))].map(b=>`<label class="field acct"><span>${L("Rekening atau e-wallet","Bank or e-wallet")} ${esc(memberName(b))}</span><input data-acct="${b}" maxlength="60" value="${esc((S.accounts&&S.accounts[b])||"")}" placeholder="${L("Contoh: BCA 1234567 a.n. ","e.g. BCA 1234567 ")}${esc(memberName(b))}"></label>`).join(""):""}
        ${PT.tr.length?PT.tr.map(([a,b,x])=>{const k=a+"-"+b, paid=!!(S.paidT&&S.paidT[k]), billed=!!(S.billed&&S.billed[k]); return `<div class="trw${paid?" got":""}"><button class="ck" data-act="paidT" data-v="${k}" role="checkbox" aria-checked="${paid}" aria-label="${L("Lunas","Paid")}"></button><span><b>${esc(memberName(a))} → ${esc(memberName(b))}</b><small>${paid?L("Lunas","Paid"):rp(x)}</small></span>${paid?"":`<button class="edit" data-act="bill" data-a="${a}" data-b="${b}" data-x="${Math.round(x)}">${billed?L("Ingatkan lagi","Remind"):L("Tagih","Request")}</button>`}</div>`}).join(""):(PT.open?"":`<p class="note">${L("Sudah seimbang.","Already even.")}</p>`)}</div>
      <div class="card"><h2>${L("Kirim ke grup","Send to the group")}</h2>
        <div class="jump"><button class="opt" data-act="shareGroup"><span><b>${L("Siapa membawa apa","Who brings what")}</b><small>${L("Lihat dan ubah dulu sebelum dikirim","Preview and edit before sending")}</small></span>›</button>
        <button class="opt" data-act="sharePrep"><span><b>${L("Jadwal persiapan","Prep schedule")}</b><small>${L("Lihat dan ubah dulu sebelum dikirim","Preview and edit before sending")}</small></span>›</button></div></div>`;
  } else {
    const W=waterPlan(R);
    body=`<button class="trailbtn" data-act="trail"><span><b>${L("Mulai Mode Pendakian","Start hiking mode")}</b><small>${L("Pengingat ngemil, minum, dan centang makan","Snack and water reminders, meal ticks")}</small></span>›</button>
      <div class="card" id="air"><h2>${L("Rencana air","Water plan")}</h2>
        <div class="wrow"><span>${scope(false)}</span></div>
        <div class="kv"><span>${L("Minum saat berjalan","Drinking while walking")}<small class="sub">${L("0,5–0,75 L per jam","0.5–0.75 L per hour")}</small></span><b>±${dec(W.days.reduce((a,x)=>a+x.walk,0))} L</b></div>
        <div class="kv"><span>${L("Minum di camp","Drinking at camp")}</span><b>±${dec(W.days.reduce((a,x)=>a+x.camp,0))} L</b></div>
        <div class="kv"><span>${L("Sanitasi dan BAB","Toilet and hygiene")}</span><b>±${dec(W.sanit)} L</b></div>
        ${W.cookG?`<div class="wrow"><span>${scope(W.P>1,W.P)}</span></div>
        <div class="kv"><span>${L("Memasak","Cooking")}</span><b>±${dec(W.cookG)} L</b></div>
        <div class="kv"><span>${L("Cuci alat makan","Washing up")}</span><b>±${dec(W.washG)} L</b></div>`:""}
        <div class="kv tot2"><span>${L("Total dipakai, bukan dibawa","Total used, not carried")}</span><b>±${fmt(W.total)} L</b></div>
        <div class="kv hl"><span>${L("Dibawa per orang","Carried per person")}</span><b>±${dec(W.carry)} L</b></div>
        <p class="alert" style="margin:10px 0 0">${esc(W.carryTxt)}</p>
        <details class="mini-d"><summary>${L("Tips sanitasi","Hygiene tips")}</summary><ul class="mini">
          <li>${L("BAB di lubang sedalam 15–20 cm, minimal 60 meter dari sumber air, lalu timbun kembali.","Dig a hole 15–20 cm deep, at least 60 m from water, and cover it after.")}</li>
          <li>${L("Tisu dan pembalut dibawa turun di kantong sampah tertutup.","Carry used tissue and pads down in a sealed bag.")}</li>
          <li>${L("Jangan mencuci dengan sabun langsung di sumber air.","Don't wash with soap directly in the water source.")}</li></ul></details></div>
      ${R.D.map(d=>`<div class="card day"><div class="dayband c${d.i%2}"><span><b>${L("Hari","Day")} ${d.i+1}</b><small>${esc(dayDate(d.i))}${d.trekH?`, ±${dec(d.trekH)} ${L("jam jalan","h walking")}`:""}</small></span><span class="dbw">${L("minum","drink")} ±${dec(d.water)} L</span></div>${scheduleHTML(R,d)}</div>`).join("")}`;
  }
  const ix=TABS.findIndex(t=>t[0]===tab), nx=TABS[ix+1];
  return header(planName(),L("Rencana bekal","Food plan"),`${durLabel(R.n)}, ${L("mulai","from")} ${esc(dayDate(0))}${grp?`, ${P} ${L("orang","people")}`:""}`)+`<main class="wrap">${tabsHTML}${body}
    <footer><p>Bekal Nanjak, ${L("pendamping Siap Nanjak.","a companion to Siap Nanjak.")} <a href="privacy.html">${L("Kebijakan privasi","Privacy policy")}</a></p></footer>
  </main><div class="bar"><div class="wrap"><button class="btn ghost" data-act="goto" data-step="1">${L("Ubah rencana","Edit plan")}</button>${nx?`<button class="btn" data-act="tab" data-v="${nx[0]}">${L("Lanjut","Next")}: ${L(nx[1],nx[2])}</button>`:`<button class="btn" data-act="finish">${L("Selesai","Done")}</button>`}</div></div>`;
}

/* ===================== ROMBONGAN ===================== */
const GAS_PRICE=30000;
function gearTypes(R){ const c={}; gearUnits(R).forEach(([k,n,w])=>{ c[k]=c[k]||{k,n,w,q:0}; c[k].q++; }); return Object.values(c); }
function teamLists(R){
  const P=S.people||1, ML=memberLists(R), CP=cookPlan(R);
  ML.forEach(m=>{m.gear=[]; m.water=0;});
  gearTypes(R).forEach(g=>{ const a=S.assignGear&&S.assignGear[g.k]; if(a!=null&&+a<P){ ML[+a].gear.push(g); ML[+a].g+=g.w*g.q*1000; if(g.k==="gas") ML[+a].p+=GAS_PRICE*g.q; } });
  const wa=S.assignWater; if(CP.waterPP&&wa!=null&&+wa<P){ ML[+wa].water=CP.waterPP*P; ML[+wa].g+=CP.waterPP*P*1000; }
  return ML;
}
function gearTxt(g){ return g.map(x=>`${x.n} ${x.q}`).join(", "); }
function patungan(R){
  const P=S.people||1, A=splitTasks(R), paid=Array(P).fill(0); let shared=0, open=0;
  Object.entries(R.shop).forEach(([id,q])=>{ if(A[id]==="each") return; const c=buyRow(R,id,q).cost; shared+=c; if(A[id]==null) open+=c; else paid[+A[id]]+=c; });
  gearTypes(R).filter(g=>g.k==="gas").forEach(g=>{ const c=GAS_PRICE*g.q; shared+=c; const a=S.assignGear&&S.assignGear.gas; if(a!=null&&+a<P) paid[+a]+=c; else open+=c; });
  const share=shared/P, bal=paid.map(x=>x-share), deb=[], cre=[];
  bal.forEach((b,m)=>{ if(b<-500) deb.push([m,-b]); else if(b>500) cre.push([m,b]); });
  const tr=[]; let i=0,j=0; while(i<deb.length&&j<cre.length){ const x=Math.min(deb[i][1],cre[j][1]); tr.push([deb[i][0],cre[j][0],x]); deb[i][1]-=x; cre[j][1]-=x; if(deb[i][1]<500) i++; if(cre[j][1]<500) j++; }
  return {shared,share,paid,tr,open};
}
function teamText(R,ml){
  const sh=ml.items.filter(x=>!x[2]), own=ml.items.filter(x=>x[2]);
  const Ls=[L(`Hai ${ml.name}, ini bagianmu untuk naik *${planName()}*, mulai ${dayDate(0)}:`,`Hi ${ml.name}, here's your part for *${planName()}*, from ${dayDate(0)}:`),""];
  if(sh.length){ Ls.push(`_${L("Beli dan bawa untuk rombongan","Buy and carry for the group")}_`); sh.forEach(([id,q,,br])=>Ls.push(`☐ ${fname(id)}, ${br?br.label:qty(id,q)}`)); Ls.push(""); }
  if(ml.gear.length){ Ls.push(`_${L("Alat bersama","Shared gear")}_`); Ls.push("☐ "+gearTxt(ml.gear)); Ls.push(""); }
  if(ml.water){ Ls.push(`☐ ${L("Air untuk masak","Cooking water")} ±${dec(ml.water)} L`,""); }
  if(own.length){ Ls.push(`_${L("Untuk dirimu sendiri","For yourself")}_`); own.forEach(([id,q])=>Ls.push(`☐ ${fname(id)}, ${qty(id,q)}`)); Ls.push(""); }
  Ls.push(`${L("Perkiraan berat","Estimated weight")} ±${kg(ml.g)}, ${L("biaya","cost")} ±${rp(ml.p)}`,"",APP_URL());
  return Ls.join("\n");
}
function groupText(R){
  const ML=teamLists(R);
  const Ls=[`*${L("Pembagian bawaan","Who brings what")}: ${planName()}*`,`${durLabel(R.n)}, ${L("mulai","from")} ${dayDate(0)}`,""];
  ML.forEach(m=>{ const sh=m.items.filter(x=>!x[2]).map(([id,q,,br])=>`${fname(id)} ${br?br.label:qty(id,q)}`); if(m.gear.length) sh.push(gearTxt(m.gear)); if(m.water) sh.push(`${L("air masak","cooking water")} ${dec(m.water)} L`); Ls.push(`*${m.name}* (±${kg(m.g)}): ${sh.join(", ")||"-"}`); });
  const A=splitTasks(R), un=Object.keys(R.shop).filter(id=>A[id]==null);
  if(un.length) Ls.push("",`_${L("Belum dibagi","Not assigned yet")}_: ${un.map(fname).join(", ")}`);
  const PT=patungan(R); Ls.push("",`*${L("Patungan","Cost split")}*: ${rp(PT.share)} ${L("per orang","per person")}`); PT.tr.forEach(([a,b,x])=>Ls.push(`• ${memberName(a)} → ${memberName(b)}: ${rp(x)}`));
  Ls.push("",L("Setiap orang membawa sendiri: camilan, makanan cadangan, alat makan, dan botol air.","Everyone brings their own snacks, spare food, cutlery, and water bottle."),APP_URL());
  return Ls.join("\n");
}
const prepDate=(k,o)=>{ if(S.prepDate&&S.prepDate[k]) return S.prepDate[k]; if(o===0) return S.start; const d=addDays(S.start,o), t=todayStr(); return d<t?(t<S.start?t:S.start):d; };
const prepTight=(k,o)=>!(S.prepDate&&S.prepDate[k])&&o<0&&addDays(S.start,o)<todayStr();
const PREP=[["h7",-7,["Cek info basecamp dan sumber air","Check basecamp info and water"]],["h3",-3,["Belanja bekal","Buy the food"]],["h1",-1,["Masak dan bekukan lauk, lalu packing","Cook and freeze sides, then pack"]],["h0",0,["Sarapan, lalu mulai Mode Pendakian","Breakfast, then start hiking mode"]]];
function prepText(){
  const Ls=[`*${L("Jadwal persiapan","Prep schedule")}: ${planName()}*`];
  PREP.forEach(([k,o,t])=>{ const d=new Date(prepDate(k,o)+"T00:00:00"); Ls.push(`• ${d.toLocaleDateString(LOC(),{weekday:"short",day:"numeric",month:"short"})}: ${L(...t)}${o===0?` (${L("mulai jalan","start")} ${S.startTime})`:""}`); });
  Ls.push("",APP_URL()); return Ls.join("\n");
}

/* ===================== MODE PENDAKIAN ===================== */
const CHEERS=[["Kerja bagus! Puncak makin dekat.","Nice work! The summit's getting closer."],["Mantap, tetap jaga ritme.","Great, keep your pace."],["Tenaga terisi, lanjut pelan-pelan.","Energy topped up. Keep it steady."],["Kamu hebat, jangan lupa minum.","You're doing great. Don't forget to drink."]];
function alarmLink(h){ h=((h%24)+24)%24; const H=Math.floor(h), M=Math.round((h-H)*60); return `intent:#Intent;action=android.intent.action.SET_ALARM;i.android.intent.extra.alarm.HOUR=${H};i.android.intent.extra.alarm.MINUTES=${M};S.android.intent.extra.alarm.MESSAGE=${encodeURIComponent("Summit attack - Bekal Nanjak")};end`; }
function beep(){ try{ const A=new (window.AudioContext||window.webkitAudioContext)(); [0,0.35,0.7].forEach(t=>{ const o=A.createOscillator(), g=A.createGain(); o.frequency.value=880; o.connect(g); g.connect(A.destination); g.gain.setValueAtTime(0.2,A.currentTime+t); o.start(A.currentTime+t); o.stop(A.currentTime+t+0.2); }); }catch(e){} try{navigator.vibrate&&navigator.vibrate([300,150,300,150,300])}catch(e){} }
function vTrail(){
  const R=calc(); if(!R) return vWelcome();
  S.trail=S.trail||{done:{},water:{}};
  const ti=todayIdx(R.n); const di=clamp(S.trailDay!=null?S.trailDay:(ti!=null?ti:0),0,R.n-1); const d=R.D[di];
  const PL=dayPlan(R,d), isToday=ti===di, now=nowH(), last=di===R.n-1;
  const can=e=>(e.kind==="snack"&&e.k)||e.kind==="meal";
  const eat=PL.ev.filter(can);
  const next=eat.find(e=>!S.trail.done[e.id]&&(!isToday||e.time>=now-0.75))||eat.find(e=>!S.trail.done[e.id]);
  const eaten=eat.filter(e=>S.trail.done[e.id]).reduce((a,e)=>a+(e.k||0),0), planned=eat.reduce((a,e)=>a+(e.k||0),0);
  const wml=S.trail.water["d"+di]||0, wT=d.water*1000;
  const late=isToday&&next&&next.time<now-0.1;
  const tabs=R.n>1?`<div class="seg" style="--n:${Math.min(R.n,5)}">${R.D.map(x=>`<button data-act="trailDay" data-v="${x.i}" aria-pressed="${x.i===di}">${L("Hari","Day")} ${x.i+1}${ti===x.i?" •":""}</button>`).join("")}</div>`:"";
  return `<header class="top">${S.saver?"":TOPO}<div class="wrap">
    <div class="hdr-row"><button class="hbtn" data-act="trailExit">${BACK} ${L("Rencana","Plan")}</button><div class="hdr-right"><button class="hbtn sos" data-act="sos">${L("Darurat","SOS")}</button>${langToggle()}</div></div>
    <p class="hdr-step">${L("Mode Pendakian","Hiking mode")}</p><h1>${esc(planName())}</h1><p class="hdr-meta">${esc(dayDate(di))}${isToday?`, ${L("hari ini","today")}`:""}</p></div></header>
  <main class="wrap">${tabs}
    ${next?`<div class="nextc${late?" late":""}"><small>${late?L("Sudah lewat","Past time"):L("Berikutnya","Up next")}, ${hhmm(next.time)}</small><b>${esc(next.label)}</b>${next.what?`<p>${esc(next.what)}</p>`:""}${next.kind==="snack"?`<p>${L("Minum ±250 ml","Drink about 250 ml")}</p>`:""}
      <button class="btn light" data-act="eat" data-id="${next.id}">${L("Sudah","Done")}</button></div>`
     :`<div class="nextc"><b>${L("Semua sudah dicentang","All ticked off")}</b><p>${L("Tetap minum dan jaga kehangatan.","Keep drinking and stay warm.")}</p></div>`}
    ${(()=>{ const WP=waterPlan(R), cap=WP.carry*1000, bot=S.trail.bottle&&S.trail.bottle["d"+di]!=null?S.trail.bottle["d"+di]:cap;
      const walkW=WP.days[di].walk*1000, campW=WP.days[di].camp*1000, aT=PL.clock(PL.walk);
      const exp=!isToday?null:(now<PL.start?0:now<aT?walkW*Math.min(1,(now-PL.start)/Math.max(.5,aT-PL.start)):walkW+campW*Math.min(1,(now-aT)/4));
      const msg=exp==null?L("Ketuk setiap kali minum.","Tap each time you drink."):wml>=exp-200?L("Mantap, minummu sudah sesuai. Lanjutkan!","Nice, you're drinking enough. Keep it up!"):L(`Seharusnya sudah ±${dec(exp/1000)} L, kamu baru ${dec(wml/1000)} L. Yuk, teguk sedikit sekarang.`,`You should be at about ${dec(exp/1000)} L and you're at ${dec(wml/1000)} L. Take a few sips now.`);
      return `<div class="card"><div class="row-h"><h2>${L("Air minum","Water")}</h2><span class="kcal-tag">${dec(wml/1000)} / ${dec(wT/1000)} L</span></div>
      <div class="meter"><i style="width:${Math.min(100,wml/wT*100)}%"></i></div>
      <p class="note" style="margin:6px 0 0">${msg}</p>
      <div class="row3"><button class="btn sm ghost" data-act="water" data-v="-250">− 250</button><button class="btn sm" data-act="water" data-v="250">+ 250 ml</button><button class="btn sm" data-act="water" data-v="500">+ 500 ml</button></div>
      <div class="kv" style="margin-top:8px"><span>${L("Sisa di botol","Left in bottle")}${bot<500?`<small class="sub warnt">${L("Air menipis. Isi ulang di sumber air atau hemat.","Running low. Refill or ration.")}</small>`:""}</span><b>±${dec(Math.max(0,bot)/1000)} L <button class="edit" data-act="refill">${L("Isi ulang","Refill")}</button></b></div></div>`; })()}
    <div class="card"><h2>${L("Istirahat dan timer","Breaks and timer")}</h2>
      <div class="kv"><span>${S.walkT?L(`Sudah jalan <b id="walkMin">${Math.floor((Date.now()-S.walkT)/60000)}</b> menit`,`Walking for <b id="walkMin">${Math.floor((Date.now()-S.walkT)/60000)}</b> min`):L(`Pengingat istirahat tiap ${S.snackEvery||60} menit`,`Break reminder every ${S.snackEvery||60} min`)}</span><b>${S.walkT?`<button class="edit" data-act="walkReset">${L("Lanjut jalan","Keep going")}</button> <button class="edit" data-act="walkStop">${L("Berhenti","Stop")}</button>`:`<button class="edit" data-act="walkStart">${L("Mulai jalan","Start walking")}</button>`}</b></div>
      <div class="kv"><span>${L("Timer masak","Cooking timer")}${S.timerEnd?` <b id="timerTxt">${(()=>{const l=Math.max(0,S.timerEnd-Date.now()); return `${Math.floor(l/60000)}:${pad(Math.floor(l/1000)%60)}`;})()}</b>`:""}</span><b>${S.timerEnd?`<button class="edit" data-act="timerStop">${L("Stop","Stop")}</button>`:[5,10,15,20].map(m=>`<button class="edit" data-act="timer" data-v="${m}">${m}'</button>`).join(" ")}</b></div>
      ${PL.sAtk&&R.n>1?`<div class="kv"><span>${L("Bangun untuk summit attack","Wake up for the summit")}<small class="sub">${hhmm(PL.start-0.5)}</small></span><b><a class="edit" href="${alarmLink(PL.start-0.5)}">${L("Pasang alarm di HP","Set phone alarm")}</a></b></div>`:""}
      <p class="note" style="margin:6px 0 0">${L("Pengingat dan timer bekerja selama aplikasi terbuka.","Reminders and the timer work while the app is open.")}</p></div>
    ${S.cheer?`<p class="cheer">${esc(S.cheer)}</p>`:""}
    <div class="card"><div class="row-h"><h2>${L("Hari ini","Today")}</h2><span class="kcal-tag">${fmt(eaten)} / ${fmt(planned)} ${L("kkal","kcal")}</span></div>
      ${PL.ev.map(e=>{const c=can(e), done=!!S.trail.done[e.id];
        return `<div class="tl ${e.kind}${done?" got":""}"><span class="tm">${hhmm(e.time)}</span>${c?`<button class="ck" data-act="eat" data-id="${e.id}" role="checkbox" aria-checked="${done}" aria-label="${esc(e.label)}"></button>`:`<span class="mk"></span>`}<span class="ac"><b>${esc(e.label)}</b>${e.what?`<small class="what">${esc(e.what)}</small>`:""}${e.kind==="snack"?`<small class="what drink">${L("Minum ±250 ml","Drink ±250 ml")}</small>`:""}</span><span class="el">${fmt(e.e)} m</span></div>`}).join("")}</div>
    <button class="switch" role="switch" data-act="awake" aria-checked="${!!S.awake}"><span><b>${L("Layar tetap menyala","Keep screen on")}</b><small>${L("Otomatis menyala selama timer masak berjalan.","Turns on automatically while the cooking timer runs.")}</small></span><span class="sw"></span></button>
    <button class="linkbtn" data-act="saver">${S.saver?L("Matikan hemat baterai","Turn off battery saver"):L("Nyalakan hemat baterai","Turn on battery saver")}</button>
    <div id="remind" class="remind" role="status" hidden></div>
  </main><div class="bar"><div class="wrap"><button class="btn" data-act="${last?"trailFinish":"trailNextDay"}">${last?L("Selesai pendakian","Finish the hike"):L("Selesai hari ini","Done for today")}</button></div></div>`;
}

/* ===================== SELESAI, CETAK ===================== */
function gcalLink(title,dayStr,hour,details){
  const d=new Date(dayStr+"T00:00:00"); d.setHours(Math.floor(hour),Math.round((hour%1)*60));
  const e=new Date(d.getTime()+30*60000), f=x=>`${x.getFullYear()}${pad(x.getMonth()+1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${f(d)}/${f(e)}&ctz=Asia/Jakarta&details=${encodeURIComponent(details)}`;
}
function reminders(){
  const st=parseInt(S.startTime,10)||8, base=APP_URL(), p=S.pid;
  const now=new Date();
  return [
    [L("Belanja bekal","Buy the food")+": "+planName(),prepDate("h3",-3),19,base+"?buka=belanja&p="+p],
    [L("Packing dan siapkan lauk","Pack and prepare sides")+": "+planName(),prepDate("h1",-1),19,base+"?buka=packing&p="+p],
    [L("Buka Mode Pendakian","Open hiking mode")+": "+planName(),S.start,Math.max(0,st-1),base+"?buka=pendakian&p="+p]].filter(([t,ds,h])=>{ const d=new Date(ds+"T00:00:00"); d.setHours(Math.floor(h),Math.round((h%1)*60)); return d>now; });
}
function icsFile(){
  const f=(ds,h)=>{const d=new Date(ds+"T00:00:00"); d.setHours(Math.floor(h),Math.round((h%1)*60)); return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;};
  const ev=reminders().map(([t,ds,h,u],k)=>["BEGIN:VEVENT",`UID:${S.pid}-${k}@bekal-nanjak`,`DTSTAMP:${f(todayStr(),0)}`,`DTSTART:${f(ds,h)}`,`DTEND:${f(ds,h+0.5)}`,`SUMMARY:${t}`,`DESCRIPTION:${u}`,"BEGIN:VALARM","TRIGGER:-PT0M","ACTION:DISPLAY",`DESCRIPTION:${t}`,"END:VALARM","END:VEVENT"].join("\r\n"));
  return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Bekal Nanjak//ID",...ev,"END:VCALENDAR"].join("\r\n");
}
/* ===================== URUNGKAN, LAYAR MENYALA, STATUS OFFLINE ===================== */
let UNDO=null;
function showUndo(msg,fn){
  UNDO={fn}; let el=document.getElementById("undoBar");
  if(!el){ el=document.createElement("div"); el.id="undoBar"; el.className="undo"; el.setAttribute("role","status"); document.body.appendChild(el); }
  el.innerHTML=`<span>${esc(msg)}</span><button data-act="undo">${L("Urungkan","Undo")}</button>`; el.hidden=false;
  clearTimeout(showUndo.t); showUndo.t=setTimeout(()=>{ el.hidden=true; UNDO=null; },6000);
}
let WAKE=null;
async function keepAwake(on){
  const nb=window.BekalAndroid; if(nb&&nb.keepAwake){ try{ nb.keepAwake(!!on); }catch(e){} }
  try{ if(on&&!WAKE&&navigator.wakeLock){ WAKE=await navigator.wakeLock.request("screen"); WAKE.addEventListener("release",()=>{WAKE=null;}); }
       if(!on&&WAKE){ await WAKE.release(); WAKE=null; } }catch(e){}
}
const needAwake=()=>S.view==="trail"&&(!!S.timerEnd||!!S.awake);
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible"&&needAwake()) keepAwake(true); });
let OFFLINE_OK=null;
function checkOffline(){
  if(!("serviceWorker" in navigator)||!window.caches){ OFFLINE_OK=false; return paintOffline(); }
  navigator.serviceWorker.ready.then(()=>caches.keys()).then(k=>{ OFFLINE_OK=!!navigator.serviceWorker.controller&&k.some(x=>x.startsWith("bekal-nanjak-")); paintOffline(); }).catch(()=>{ OFFLINE_OK=false; paintOffline(); });
  setTimeout(()=>{ if(OFFLINE_OK===null){ OFFLINE_OK=false; paintOffline(); } },3000);
}
function paintOffline(){ const el=document.getElementById("offl"); if(!el||OFFLINE_OK===null) return;
  el.className="offl"+(OFFLINE_OK?" ok":""); el.textContent=OFFLINE_OK?L("✓ Siap dipakai tanpa sinyal","✓ Ready to use offline"):L("Buka sekali saat ada sinyal supaya bisa dipakai tanpa sinyal","Open once with signal so it works offline"); }
function backupDue(){ if(!HIST.length) return false; const now=Date.now();
  if(S.backupSnooze&&S.backupSnooze>now) return false; if(S.lastBackup&&now-S.lastBackup<30*864e5) return false;
  const act=activePlan(); const soon=act&&Math.round((new Date(S.start+"T00:00:00")-new Date(todayStr()+"T00:00:00"))/864e5)<=3;
  return HIST.length>=3||!!soon; }

/* ===== Jembatan ke aplikasi Android (WebView + AdMob) =====
   Shell Android menyuntikkan objek window.BekalAndroid. Semua fungsi opsional. */
const NB_=()=>window.BekalAndroid||null;
function adSlot(){ return !S.edit&&!S.msg&&!S.noteFor&&!S.confirm&&!S.term&&(S.view==="history"||(S.view==="plan"&&S.step===5&&S.tab==="shop")); }
function syncBanner(){ const nb=NB_(); const on=!!(nb&&nb.setBannerVisible)&&adSlot();
  document.body.classList.toggle("ad-on",on); try{ nb&&nb.setBannerVisible&&nb.setBannerVisible(adSlot()); }catch(e){} }
function downloadFile(name,mime,text){
  const nb=NB_(); if(nb&&nb.saveFile){ try{ nb.saveFile(name,mime,text); return; }catch(e){} }
  try{ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([text],{type:mime})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},500); }catch(e){}
}
function vDone(){
  const R=calc(); if(!R) return vWelcome();
  const rem=reminders();
  return `<header class="top">${TOPO}<div class="wrap"><div class="hdr-row"><span style="display:flex;align-items:center;gap:10px;font-weight:600">${LOGO} Bekal Nanjak</span>${langToggle()}</div></div></header>
  <main class="wrap"><div class="done-hero">${TOPO}<div class="check-big" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></div>
      <h2>${L("Rencana siap","Plan ready")}</h2><p style="position:relative;margin:0;opacity:.9">${esc(planName())}, ${esc(dayDate(0))}. ${L("Tersimpan di Riwayat.","Saved in History.")}</p></div>
    <div class="card"><h2>${L("Ingatkan saya","Remind me")}</h2><p class="hint">${L("Supaya tidak lupa belanja, packing, dan membuka Mode Pendakian.","So you don't forget to shop, pack, and open hiking mode.")}</p>
      ${rem.length?"":`<p class="note">${L("Pendakiannya sudah dekat, jadi tidak perlu pengingat kalender. Buka Mode Pendakian di hari H.","Your hike is very soon, so no calendar reminders are needed. Open hiking mode on the day.")}</p>`}
      <div class="jump">${rem.map(([t,ds,h,u])=>`<a class="opt" target="_blank" rel="noopener" href="${gcalLink(t,ds,h,u)}" style="text-decoration:none;color:inherit"><span><b>${esc(t.split(":")[0])}</b><small>${new Date(ds+"T00:00:00").toLocaleDateString(LOC(),{weekday:"long",day:"numeric",month:"short"})}, ${hhmm(h)}</small></span>+</a>`).join("")}</div>
      <button class="linkbtn" data-act="ics">${L("Atau unduh semua ke kalender (.ics)","Or download all to calendar (.ics)")}</button></div>
    <div class="card"><h2>${L("Cadangan","Backup")}</h2>
      <div class="row2" style="margin:0"><button class="btn ghost" style="color:var(--ink);border-color:var(--line)" data-act="print">${L("Cetak / PDF","Print / PDF")}</button><button class="btn ghost" style="color:var(--ink);border-color:var(--line)" data-act="exportPlan">${L("Simpan file","Save file")}</button></div>
      <p class="note" style="margin:8px 0 0">${L("Berguna kalau baterai habis atau ganti HP.","Handy if your battery dies or you change phones.")}</p></div>
    <div class="jump">
      <a class="opt" href="https://mirai-organization-team.github.io/" style="text-decoration:none;color:inherit"><span><b>${L("Siapkan perlengkapan di Siap Nanjak","Pack your gear with Siap Nanjak")}</b></span>›</a>
      <a class="opt" href="${feedbackLink()}" style="text-decoration:none;color:inherit"><span><b>${L("Kirim masukan","Send feedback")}</b></span>›</a>
      <a class="opt" href="mailto:contact@mirai.co.id" style="text-decoration:none;color:inherit"><span><b>${L("Hubungi kami","Contact us")}</b><small>contact@mirai.co.id</small></span>›</a>
      ${PLAY_URL?`<a class="opt" href="${PLAY_URL}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><span><b>${L("Beri rating","Rate us")}</b></span>›</a>`:""}</div>
  </main><div class="bar"><div class="wrap"><button class="btn" data-act="home">${L("Ke menu utama","Main menu")}</button></div></div>`;
}
function feedbackLink(kind){ const sub=kind==="data"?L("Koreksi data Bekal Nanjak","Bekal Nanjak data correction"):L("Masukan Bekal Nanjak","Bekal Nanjak feedback"); return `mailto:contact@mirai.co.id?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent((S.mountain?planName()+"\n":"")+L("Tulis masukanmu di sini:","Write your feedback here:")+"\n")}`; }
function vPrint(){
  const R=calc(); if(!R) return vWelcome(); const P=S.people||1, W=waterPlan(R);
  const it=l=>l.map(([id,q])=>`${fname(id)} ${qty(id,q)}`).join(", ");
  return `<div class="printv"><div class="noprint" style="padding:12px"><button class="btn" data-act="printBack">${L("Kembali","Back")}</button></div>
  <h1>${esc(planName())}</h1><p>${durLabel(R.n)}, ${esc(dayDate(0))}, ${P} ${L("orang","people")}</p>
  <h2>${L("Menu per orang","Menu per person")}</h2>${R.D.map(d=>`<h3>${L("Hari","Day")} ${d.i+1}, ${esc(dayDate(d.i))}</h3><ul>${d.meals.filter(x=>x.on).map(x=>`<li><b>${L(...SLOTS[x.slot].n)}:</b> ${esc(it(x.items))}</li>`).join("")}</ul>`).join("")}
  <h2>${L("Daftar belanja","Shopping list")} (${P} ${L("orang","people")})</h2><ul>${Object.entries(R.shop).map(([id,q])=>`<li>☐ ${esc(fname(id))}, ${esc(buyRow(R,id,q).label)}</li>`).join("")}</ul>
  <h2>${L("Jadwal","Schedule")}</h2>${R.D.map(d=>{const PL=dayPlan(R,d); return `<h3>${L("Hari","Day")} ${d.i+1}</h3><ul>${PL.ev.map(e=>`<li>${hhmm(e.time)} ${esc(e.label)}${e.what?`: ${esc(e.what)}`:""}${e.kind==="snack"?`, ${L("minum ±250 ml","drink ±250 ml")}`:""} (${fmt(e.e)} m)</li>`).join("")}</ul>`}).join("")}
  <h2>${L("Air","Water")}</h2><p>${esc(W.carryTxt)} ${L("Total","Total")} ±${fmt(W.total)} L.</p>
  <h2>${L("Darurat","Emergency")}</h2><p>112, Basarnas 115, ${L("Ambulans","Ambulance")} 119${S.bcPhone?`, Basecamp ${esc(S.bcPhone)}`:""}</p></div>`;
}

/* ===================== BANTUAN ===================== */
function vHelp(){
  const t=S.helpTab||"how";
  const seg=`<div class="seg" style="--n:4">${[["how","Cara pakai","How to"],["feat","Fitur","Features"],["terms","Istilah","Terms"],["faq","Tanya jawab","FAQ"]].map(([v,a,b])=>`<button data-act="helpTab" data-v="${v}" aria-pressed="${t===v}">${L(a,b)}</button>`).join("")}</div>`;
  let body="";
  if(t==="how") body=`<ol class="key">${[["Pilih gunung dan jalur","Pick mountain and trail"],["Atur tanggal dan siapa yang ikut","Set dates and who's coming"],["Isi data tubuh dan preferensi","Enter body data and preferences"],["Cek waktu makan","Check the meals"],["Lihat hasil: menu, belanja, rombongan, di jalur","See results: menu, shopping, group, trail"],["Saat mendaki, buka Mode Pendakian","On the hike, open hiking mode"],["Setelah pulang, isi catatan","After the hike, add notes"]].map(([a,b])=>`<li><span><b>${L(a,b)}</b></span></li>`).join("")}</ol>`;
  else if(t==="feat") body=`${S.helpMsg?`<p class="alert">${L("Buat rencana dulu supaya fitur ini bisa dibuka.","Create a plan first to open this.")} <button class="linkbtn" data-act="new">${L("Buat rencana","Create a plan")}</button></p>`:""}<div class="jump">${[["menu","Menu dan resep","Menus and recipes","Ganti menu sekali ketuk, cara masak lengkap","One-tap swaps, full recipes"],["shop","Belanja","Shopping","Checklist, alat masak, packing","Checklist, gear, packing"],["team","Rombongan","Group","Bagi tugas dan kirim ke anggota","Split tasks and send"],["road","Di Jalur","On the trail","Jadwal makan, minum, dan rencana air","Meal, water, and schedule"],["trail","Mode Pendakian","Hiking mode","Pengingat dan centang di jalur","Reminders and ticks on the trail"],["sos","Panduan darurat","Emergency guide","Bisa dibuka tanpa sinyal","Works offline"],["history","Riwayat dan catatan","History and notes","Rencana tersimpan dan catatan pulang","Saved plans and trip notes"]].map(([k,a,b,c,d])=>`<button class="opt" data-act="helpGo" data-v="${k}"><span><b>${L(a,b)}</b><small>${L(c,d)}</small></span>›</button>`).join("")}</div>`;
  else if(t==="terms") body=`<div class="card">${Object.keys(GLOSS).map(k=>`<div class="gl"><b>${esc(L(...GLOSS[k][0]))}</b><p>${esc(L(...GLOSS[k][1]))}</p></div>`).join("")}</div>`;
  else body=[["Kenapa bekalnya lebih kecil dari kebutuhan?","Why is the food less than I need?","Sebagian energi ditutup dari makan di rumah atau basecamp, dan saat berjalan tubuh hanya bisa mencerna ±200–300 kkal per jam.","Some energy comes from meals at home or basecamp, and while walking you can only digest about 200–300 kcal an hour."],["Data saya disimpan di mana?","Where is my data stored?","Hanya di HP ini, tanpa login. Simpan file cadangan dari halaman Selesai.","Only on this phone, no login. Save a backup file from the Done page."],["Bisa dipakai tanpa sinyal?","Does it work offline?","Bisa, setelah dibuka sekali dengan internet.","Yes, after opening it once online."],["Kalori di aplikasi beda dengan label?","Calories differ from the label?","Ubah di tab Belanja lewat Ubah harga & kalori.","Change them in Shopping with Edit prices & kcal."],["Pengingat tidak muncul saat aplikasi ditutup?","No reminders when the app is closed?","Pakai tombol Ingatkan saya di halaman Selesai untuk menambah pengingat ke kalender.","Use Remind me on the Done page to add calendar reminders."]].map(([a,b,c,d])=>`<details class="card"><summary><b>${L(a,b)}</b>${CHEV}</summary><p class="note" style="margin:8px 0 0;color:var(--ink)">${L(c,d)}</p></details>`).join("");
  return header(L("Panduan","Guide"),"Bekal Nanjak")+`<main class="wrap">${seg}${body}
    <div class="jump" style="margin-top:14px">${PLAY_URL?`<a class="opt" href="${PLAY_URL}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><span><b>${L("Beri rating di Play Store","Rate us on Play Store")}</b></span>›</a>`:""}
    <a class="opt" href="mailto:contact@mirai.co.id" style="text-decoration:none;color:inherit"><span><b>${L("Hubungi kami","Contact us")}</b><small>contact@mirai.co.id</small></span>›</a>
    <a class="opt" href="${feedbackLink()}" style="text-decoration:none;color:inherit"><span><b>${L("Kirim masukan","Send feedback")}</b></span>›</a>
    <a class="opt" href="${feedbackLink("data")}" style="text-decoration:none;color:inherit"><span><b>${L("Laporkan koreksi data jalur atau kalori","Report a trail or calorie correction")}</b></span>›</a>
    <a class="opt" href="privacy.html" style="text-decoration:none;color:inherit"><span><b>${L("Kebijakan privasi","Privacy policy")}</b></span>›</a></div>
    <div class="card dz"><h2>${L("Data di HP ini","Data on this phone")}</h2>
      <p class="hint">${L("Semua rencana, riwayat, dan catatan hanya tersimpan di HP ini. Simpan cadangan dulu kalau masih ingin memakainya.","All plans, history, and notes are stored only on this phone. Save a backup first if you want to keep them.")}</p>
      <div class="row2" style="margin:0">${HIST.length?`<button class="btn ghost" style="color:var(--ink);border-color:var(--line)" data-act="exportAll">${L("Simpan cadangan","Save backup")}</button>`:""}<button class="btn danger" data-act="wipeAll">${L("Hapus semua data","Delete all data")}</button></div></div>
  </main><div class="bar"><div class="wrap"><button class="btn" data-act="back">${L("Kembali","Back")}</button></div></div>`;
}

/* ===================== HALAMAN PEMBUKA ===================== */
function activePlan(){ const h=S.pid&&HIST.find(x=>x.pid===S.pid); if(!h) return null; const en=S.type==="oneday"?S.start:S.end; return todayStr()<=en?h:null; }
function vWelcome(){
  const hasLast=S.pid&&HIST.some(h=>h.pid===S.pid), act=activePlan();
  let cd="";
  if(act){ const left=Math.round((new Date(S.start+"T00:00:00")-new Date(todayStr()+"T00:00:00"))/864e5);
    const when=left>1?L(`${left} hari lagi`,`in ${left} days`):left===1?L("besok","tomorrow"):L("hari ini","today");
    const done=PREP.filter(([k])=>S.prep&&S.prep[k]).length, nx=PREP.find(([k])=>!(S.prep&&S.prep[k]));
    cd=`<div class="cd"><div class="row-h"><b>${esc(planName())}</b><span>${when}</span></div>
      <p class="cdp">${L("Persiapan","Prep")} ${done}/4${nx?`, ${L("berikutnya","next")}: ${L(...nx[2])}, ${new Date(prepDate(nx[0],nx[1])+"T00:00:00").toLocaleDateString(LOC(),{weekday:"short",day:"numeric",month:"short"})}`:""}</p>
      <div class="row2" style="margin:10px 0 0">${left<=0?`<button class="btn light" data-act="trail">${L("Mode Pendakian","Hiking mode")}</button>`:`<button class="btn light" data-act="open" data-pid="${S.pid}">${L("Buka rencana","Open plan")}</button>`}<button class="btn ghost" data-act="new">${L("Rencana baru","New plan")}</button></div></div>`; }
  const past=HIST.find(h=>!h.note&&h.data&&((h.data.type==="oneday"?h.data.start:h.data.end)||"9999")<todayStr());
  return `<section class="ob">${TOPO}<div class="wrap">
    <div class="hdr-row"><span style="display:flex;align-items:center;gap:10px;font-weight:600">${LOGO} Bekal Nanjak</span><span class="hdr-right"><button class="ibtn" data-act="help" aria-label="${L("Panduan","Guide")}" title="${L("Panduan","Guide")}">${IC.book}</button>${langToggle()}</span></div>
    <div class="grow"></div>
    ${cd||`<h1>Bekal Nanjak</h1><p class="lead">${L("Bekal yang pas, dari basecamp sampai turun lagi.","The right food, from basecamp and back.")}</p>`}
    ${past?`<button class="notep" data-act="note" data-pid="${past.pid}"><b>${L(`Bagaimana pendakian ${esc(past.name)}?`,`How was ${esc(past.name)}?`)}</b><small>${L("Isi catatan singkat","Add quick notes")}</small></button>`:""}
    ${cd?"":`<button class="btn light" data-act="new">${L("Buat rencana baru","Start a new plan")}</button>
    ${hasLast?`<button class="btn ghost" data-act="open" data-pid="${S.pid}">${L("Lanjutkan rencana terakhir","Continue last plan")}</button>`:""}`}
    ${HIST.length?`<button class="btn ghost" data-act="history">${L("Riwayat","History")} (${HIST.length})</button>`:""}
    ${backupDue()?`<div class="bkp"><b>${L("Simpan cadangan rencanamu","Back up your plans")}</b><small>${L("Data hanya ada di HP ini. Simpan file supaya tidak hilang saat ganti HP atau data browser dihapus.","Your data only lives on this phone. Save a file so it isn't lost if you change phones or clear browser data.")}</small>
      <div class="row2" style="margin:8px 0 0"><button class="btn light" data-act="exportAll">${L("Simpan","Save")}</button><button class="btn ghost" data-act="backupLater">${L("Nanti","Later")}</button></div></div>`:""}
    <p id="offl" class="offl"></p>
    <div class="wl-links"><button class="linkbtn" data-act="showIntro">${L("Lihat perkenalan","Introduction")}</button><button class="linkbtn" data-act="importPlan">${L("Pulihkan dari file","Restore from file")}</button></div>
    <p class="disc" style="margin:12px 0 0">${L("Saran umum, bukan saran medis.","General suggestions, not medical advice.")}</p>
    <input type="file" id="importFile" accept=".json,application/json" hidden>
  </div></section>`;
}

/* ===================== EDITOR ===================== */
const PREF_CATS={summit:["camilan","minum"],cemilan:["camilan","minum"],cadangan:["camilan","karbo"],sarapan:["karbo","protein","minum","sayur"],siang:["karbo","protein","sayur"],malam:["karbo","protein","sayur","bumbu","minum"]};
function editorHTML(){
  const E=editorData(S.edit); if(!E){S.edit=null;return ""}
  const cur=kOf(E.items), pct=E.target?Math.min(100,cur/E.target*100):0, gap=Math.round(E.target-cur);
  const dayN=S.edit==="reserve"?null:(+S.edit.slice(1).split("-")[0])+1;
  const pref=PREF_CATS[E.slot]||Object.keys(CATS);
  const chip=id=>`<button class="fchip${isAvoided(id)?" warn":""}" data-act="addFood" data-id="${id}" data-name="${esc((fname(id)+" "+id).toLowerCase().replace(/cokelat/g,"coklat"))}">${esc(fname(id))}<small>${esc(funit(id))}, ${fmt(food(id).k)}</small></button>`;
  const ids=c=>c==="own"?Object.keys(S.ownFoods||{}):Object.keys(FOODS).filter(id=>FOODS[id].c===c&&!/^nasib$/.test(id));
  const others=Object.keys(CATS).filter(c=>!pref.includes(c));
  const alts=altsFor(E.slot,S.edit,dayN?dayN-1:0).filter(a=>!E.items.some(([j])=>j===a.items[0][0]));
  return `<div class="sheet-bg" data-act="closeEdit"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="edTitle" data-stop="1">
    <h2 id="edTitle">${L("Ubah","Edit")} ${esc(E.title.toLowerCase())}</h2>
    <p class="saveinfo">${dayN?L(`Tersimpan otomatis ke Menu Hari ${dayN}, daftar belanja, dan jadwal Di Jalur.`,`Saves automatically to Day ${dayN} menu, shopping list, and trail schedule.`):L("Tersimpan otomatis ke menu dan daftar belanja.","Saves automatically to the menu and shopping list.")} <span id="edToast" class="green"></span></p>
    <p class="estep">1. ${L("Isi sekarang","Current")}</p>
    <p class="hint" style="margin:0">${L(`${fmt(cur)} dari saran ${fmt(E.target)} kkal`,`${fmt(cur)} of suggested ${fmt(E.target)} kcal`)}${gap>80?L(`, kurang ±${fmt(gap)}`,`, about ${fmt(gap)} short`):gap<-150?L(`, lebih ±${fmt(-gap)}`,`, about ${fmt(-gap)} over`):""}</p>
    <div class="meter"><i style="width:${pct}%"></i></div>
    ${E.items.map(([id,q])=>`<div class="ed-row"><div class="nm"><b>${esc(fname(id))}</b><small>${esc(funit(id))}, ${fmt(food(id).k)} ${L("kkal","kcal")}${avoidNote(id)?`, ⚠ ${esc(avoidNote(id))}`:""}</small></div>
      <div class="step"><button data-act="qty" data-id="${id}" data-v="-1" aria-label="${L("Kurangi","Less")}">−</button><span>${q}</span><button data-act="qty" data-id="${id}" data-v="1" aria-label="${L("Tambah","More")}">+</button></div>
      <button class="rm" data-act="qty" data-id="${id}" data-v="-999" aria-label="${L("Hapus","Remove")} ${esc(fname(id))}">×</button></div>`).join("")||`<p class="note">${L("Masih kosong. Tambah di langkah 2 atau ganti di langkah 3.","Empty. Add in step 2 or swap in step 3.")}</p>`}
    <p class="estep">2. ${L("Tambah makanan","Add food")}</p>
    <input id="edSearch" class="search" type="search" placeholder="${L("Cari, misalnya cokelat","Search, e.g. chocolate")}" aria-label="${L("Cari makanan","Search food")}">
    <div class="fchips" id="fchips">${pref.map(c=>ids(c).map(chip).join("")).join("")}${ids("own").map(chip).join("")}</div>
    <details class="mini-d"><summary>${L("Kelompok lain","Other groups")}</summary><div class="fchips">${others.filter(c=>c!=="own").map(c=>ids(c).map(chip).join("")).join("")}</div></details>
    ${alts.length?`<p class="estep">3. ${L("Atau ganti sekaligus","Or swap it all")}</p>
    ${alts.map(a=>{const pr=PRESETS.find(p=>p.id===a.id); return `<div class="preset"><div class="pr-h"><span><b>${esc(L(...a.n))}</b><small>±${fmt(kOf(a.items))} ${L("kkal","kcal")}${pr?`, ±${pr.mins} ${L("menit","min")}`:""}</small></span><button class="edit" data-act="useAlt" data-key="${S.edit}" data-alt="${a.id}" data-in="sheet">${L("Pakai","Use")}</button></div>
      <small class="ing">${esc(a.items.map(([id,q])=>`${fname(id)} ${qty(id,q)}`).join(", "))}</small>${pr?`<details class="steps"><summary>${L("Cara masak","How to cook")}</summary>${howtoHTML(pr)}</details>`:""}</div>`}).join("")}
    <button class="linkbtn" data-act="moreAlt" data-key="${S.edit}">${L("Pilihan lain","More options")}</button>`:""}
    <details class="own"><summary style="font-weight:600;cursor:pointer">${L("Makanan lain yang tidak ada di daftar","Food not on the list")}</summary>
      <label class="field" style="margin-top:10px"><span>${L("Nama makanan","Food name")}</span><input id="ownN" maxlength="40"></label>
      <div class="row2"><label class="field"><span>${L("Disebut per","Counted as")}</span><select id="ownU">${[["bungkus","pack"],["buah","piece"],["potong","slice"],["sachet","sachet"],["porsi","serving"],["kotak","carton"],["botol","bottle"],["kaleng","can"],["cup","cup"],["lembar","sheet"],["sdm","tbsp"]].map(([a,b])=>`<option value="${L(a,b)}">${L(a,b)}</option>`).join("")}</select></label>
        <label class="field"><span>${L("Berat","Weight")}</span><select id="ownGsel">${[10,20,25,30,40,50,60,75,100,150,200,250].map(g=>`<option value="${g}" ${g===50?"selected":""}>${g} g</option>`).join("")}<option value="custom">${L("Isi sendiri","Other")}</option></select></label></div>
      <label class="field" id="ownGwrap" hidden><span>${L("Berat (gram)","Weight (grams)")}</span><input id="ownG" type="number" inputmode="numeric"></label>
      <div class="row2"><label class="field"><span>${L("Kalori","Calories")}</span><input id="ownK" type="number" inputmode="numeric" placeholder="kkal"></label><label class="field"><span>${L("Harga (Rp)","Price (Rp)")}</span><input id="ownP" type="number" inputmode="numeric"></label></div>
      <button class="btn sm ghost" style="color:var(--ink);border-color:var(--line);width:100%" data-act="addOwn">${L("Simpan dan tambahkan","Save and add")}</button><p class="err" id="ownErr"></p></details>
    <div class="sheet-acts"><button class="btn ghost" data-act="resetEdit">${L("Kembalikan ke saran","Reset")}</button><button class="btn" data-act="closeEdit">${L("Simpan dan tutup","Save and close")}</button></div>
  </div></div>`;
}
function flashSaved(){ const t=$("#edToast"); if(t){ t.textContent="✓ "+L("Tersimpan","Saved"); } }

/* ===================== KONTROL ===================== */
const VIEWS={help:vHelp,print:vPrint,trail:vTrail,sos:vSos,intro:vIntro,welcome:vWelcome,history:vHistory,glossary:vGlossary,done:vDone,plan:()=>[null,vRoute,vSchedule,vBody,vMeals,vResult][S.step]()};
function render(){
  document.body.classList.toggle("trailv",S.view==="trail");
  if(S.view==="trail"&&S.saver){ document.documentElement.dataset.theme="dark"; document.body.classList.add("saver"); } else { delete document.documentElement.dataset.theme; document.body.classList.remove("saver"); }
  if(S.view==="print") setTimeout(()=>{ const nb=NB_(); try{ if(nb&&nb.print) nb.print(); else window.print(); }catch(e){} },500);
  document.documentElement.lang=S.lang;
  setTimeout(syncBanner,0);
  setTimeout(()=>{ if(S.view==="welcome") paintOffline(); keepAwake(needAwake()); },0);
  const keepY=window.scrollY;
  $("#app").innerHTML=VIEWS[S.view]();
  window.scrollTo(0,keepY);
  const sg=document.querySelector(".tabs .seg"), at=sg&&sg.querySelector('[aria-selected="true"]'); if(sg&&at) sg.scrollLeft=at.offsetLeft-sg.clientWidth/2+at.clientWidth/2;
  renderSheet();
  paintRanges();
}
function renderSheet(){ $("#sheet").innerHTML=vSheet(); document.body.classList.toggle("lock",!!(S.msg||S.noteFor||S.edit||S.term||S.confirm));  syncBanner(); }

function paintRanges(){document.querySelectorAll("input[type=range]").forEach(el=>{const p=(el.value-el.min)/(el.max-el.min)*100;el.style.background=`linear-gradient(to right,var(--pine2) ${p}%,var(--line) ${p}%)`})}
function snapshot(){const s={...S};delete s.msg;delete s.noteFor;delete s.confirm;delete s.view;delete s.step;delete s.edit;delete s.term;delete s.editPrice;delete s.tab;return s}
function storeHistory(){
  const R=calc(); if(!R) return;
  if(!S.pid) S.pid="p"+Date.now().toString(36);
  const old=HIST.find(x=>x.pid===S.pid);
  const h={note:old&&old.note,pid:S.pid,saved:Date.now(),name:planName(),when:dayDate(0,false),dur:durLabel(R.n),sum:`${fmt(R.K)} ${L("kkal","kcal")}, ${kg(R.G)}, ${rp(R.P)}`,data:snapshot()};
  HIST=HIST.filter(x=>x.pid!==S.pid); HIST.unshift(h); HIST=HIST.slice(0,30); saveHist();
}
let PREV=null;
function go(view,step){
  if((view==="glossary"||view==="help")&&S.view!=="help"&&S.view!=="glossary") PREV={view:S.view,step:S.step};
  S.view=view; if(step!=null) S.step=step; S.edit=null; S.term=null;
  if(view==="plan"&&S.step===5){ if(step!=null&&PREV===null&&S.view==="plan") {} storeHistory(); }
  save(); render(); window.scrollTo(0,0);
}
function back(){
  if(S.edit||S.term){S.edit=null;S.term=null;return renderSheet()}
  if(S.view==="glossary"&&PREV) {const p=PREV; PREV=null; return go(p.view,p.step);}
  if(S.view==="sos") return go("trail");
  if(S.view==="help"){ if(PREV){const p=PREV; PREV=null; return go(p.view,p.step);} return go("welcome"); }
  if(S.view==="print") return go("done");
  if(S.view==="trail") return go("plan",5);
  if(S.view!=="plan") return go("welcome");
  if(S.step<=1) return go("welcome");
  go("plan",S.step-1);
}
function newPlan(){
  const keep={lastBackup:S.lastBackup,backupSnooze:S.backupSnooze,accounts:S.accounts,kcalOv:S.kcalOv,people:S.people,members:S.members,instant:S.instant,avoid:S.avoid,bcPhone:S.bcPhone,adjFood:S.adjFood,adjWater:S.adjWater,seenIntro:true,lang:S.lang,sex:S.sex,age:S.age,height:S.height,weight:S.weight,load:S.load,veg:S.veg,light:S.light,cold:S.cold,prices:S.prices,ownFoods:S.ownFoods,tipsOpen:S.tipsOpen};
  S={...defaults(),...keep}; go("plan",1);
}

document.addEventListener("click",e=>{
  const b=e.target.closest("[data-act]");
  if(!b) return;
  if(b.classList.contains("sheet-bg")&&e.target.closest("[data-stop]")) return;
  if(b.disabled) return;
  const a=b.dataset.act, v=b.dataset.v;
  switch(a){
    case "lang": S.lang=v; save(); return render();
    case "paidT": S.paidT=S.paidT||{}; S.paidT[v]=!S.paidT[v]; save(); storeHistory(); return render();
    case "bill": { const a2=+b.dataset.a, b2=+b.dataset.b, x=+b.dataset.x, acct=(S.accounts&&S.accounts[b2])||"";
      S.billed=S.billed||{}; S.billed[a2+"-"+b2]=true; save();
      S.msg={t:L("Tagih patungan","Request payment"),x:L(`Hai ${memberName(a2)}, patungan bekal ${planName()} ${rp(x)}. Transfer ke ${acct||memberName(b2)} ya. Terima kasih!`,`Hi ${memberName(a2)}, your share for ${planName()} is ${rp(x)}. Please transfer to ${acct||memberName(b2)}. Thanks!`)}; render(); return renderSheet(); }
    case "campStop": S.campStop=+v; save(); return render();
    case "snackEvery": S.snackEvery=+v; save(); return render();
    case "mbSet": { const m=+b.dataset.m; S.mbody=S.mbody||[]; if(v==="same") S.mbody[m]=null; else if(!S.mbody[m]) S.mbody[m]={sex:S.sex,age:S.age,weight:S.weight}; save(); storeHistory(); return render(); }
    case "mbSex": { const m=+b.dataset.m; S.mbody=S.mbody||[]; S.mbody[m]=S.mbody[m]||{}; S.mbody[m].sex=v; save(); return render(); }
    case "waterSrc": S.waterSrc=v; save(); return render();
    case "solo": S.people=+v===1?1:Math.max(2,S.people||2); S.sent={}; save(); return render();
    case "avoid": S.avoid=S.avoid||{}; S.avoid[v]=!S.avoid[v]; save(); return render();
    case "trail": S.trailDay=null; return go("trail");
    case "trailExit": return go("plan",5);
    case "trailDay": S.trailDay=+v; save(); return render();
    case "eat": { S.trail=S.trail||{done:{},water:{}}; const id=b.dataset.id; S.trail.done[id]=!S.trail.done[id]; if(S.trail.done[id]){ const c=CHEERS[Math.floor(Math.random()*CHEERS.length)]; S.cheer=L(...c); } else S.cheer=""; save(); storeHistory(); return render(); }
    case "water": { S.trail=S.trail||{done:{},water:{}}; const R=calc(); const ti=todayIdx(R.n); const di=clamp(S.trailDay!=null?S.trailDay:(ti!=null?ti:0),0,R.n-1); const k="d"+di; S.trail.water[k]=Math.max(0,(S.trail.water[k]||0)+(+v)); S.trail.bottle=S.trail.bottle||{}; const cap=waterPlan(R).carry*1000; S.trail.bottle[k]=Math.max(0,(S.trail.bottle[k]!=null?S.trail.bottle[k]:cap)-(+v)); save(); storeHistory(); return render(); }
    case "sos": return go("sos");
    case "refill": { const R=calc(); const ti=todayIdx(R.n); const di=clamp(S.trailDay!=null?S.trailDay:(ti!=null?ti:0),0,R.n-1); S.trail.bottle=S.trail.bottle||{}; S.trail.bottle["d"+di]=waterPlan(R).carry*1000; save(); return render(); }
    case "walkStart": case "walkReset": S.walkT=Date.now(); S.walkAlert=0; save(); return render();
    case "walkStop": S.walkT=null; save(); return render();
    case "timer": S.timerEnd=Date.now()+(+v)*60000; save(); keepAwake(true); return render();
    case "timerStop": S.timerEnd=null; save(); keepAwake(needAwake()); return render();
    case "note": S.noteFor=b.dataset.pid; return renderSheet();
    case "reuse": { const h=HIST.find(x=>x.pid===b.dataset.pid); if(!h) return; const n0=Math.max(1,Math.round((new Date(h.data.end+"T00:00:00")-new Date(h.data.start+"T00:00:00"))/864e5)+1), st=addDays(todayStr(),7);
      S={...defaults(),...h.data,lang:S.lang,seenIntro:true,pid:null,start:st,end:addDays(st,(h.data.type==="oneday"?1:n0)-1),trail:{done:{},water:{}},got:{},sent:{},prep:{},prepDate:{},tab:"sum"}; applyKcal(); return go("plan",2); }
    case "noteClose": S.noteFor=null; return renderSheet();
    case "noteSet": { const h=HIST.find(x=>x.pid===S.noteFor); if(!h) return; h.note=h.note||{}; const txt=$("#noteTxt"); if(txt) h.note.text=txt.value; h.note[b.dataset.k]=v; return renderSheet(); }
    case "noteSave": { const h=HIST.find(x=>x.pid===S.noteFor); if(h){ h.note=h.note||{}; const txt=$("#noteTxt"); if(txt) h.note.text=txt.value.trim(); h.note.at=Date.now();
        S.adjFood={less:1.1,ok:1,more:0.9}[h.note.food]||S.adjFood||1; S.adjWater={less:1.15,ok:1,more:0.9}[h.note.water]||S.adjWater||1; saveHist(); }
      S.noteFor=null; save(); return render(); }
    case "adjReset": S.adjFood=1; S.adjWater=1; save(); return render();
    case "introNext": S.introI=Math.min(INTRO.length-1,(S.introI||0)+1); return render();
    case "introPrev": S.introI=Math.max(0,(S.introI||0)-1); return render();
    case "introGo": S.introI=+v; return render();
    case "introSkip": S.seenIntro=true; return go("welcome");
    case "introStart": S.seenIntro=true; return newPlan();
    case "showIntro": S.introI=0; return go("intro");
    case "new": if(S.view==="plan"&&S.step>=2){ S.confirm={title:L("Buat rencana baru?","Start a new plan?"),msg:L("Rencana yang sekarang tetap tersimpan di Riwayat. Kamu akan mulai lagi dari memilih gunung.","Your current plan stays in History. You'll start again by choosing a mountain."),yes:L("Buat baru","Start new"),run:{a:"new"}}; return renderSheet(); } return newPlan();
    case "history": return go("history");
    case "goto": return go("plan",+b.dataset.step);
    case "next": if(S.step===4) S.tab="sum"; return go("plan",Math.min(5,S.step+1));
    case "back": return back();
    case "open": { const h=HIST.find(x=>x.pid===b.dataset.pid); if(!h) return; S={...defaults(),...h.data,lang:S.lang,tab:"sum"}; return go("plan",5); }
    case "delHist": { const h=HIST.find(x=>x.pid===b.dataset.pid); if(!h) return;
      S.confirm={title:L("Hapus rencana ini?","Delete this plan?"),msg:L(`"${h.name}" akan dihapus dari riwayat dan tidak bisa dikembalikan.`,`"${h.name}" will be removed from history and can't be restored.`),yes:L("Hapus","Delete"),danger:true,run:{a:"delHist",pid:h.pid}}; return renderSheet(); }
    case "noConfirm": S.confirm=null; return renderSheet();
    case "yesConfirm": { const r=S.confirm&&S.confirm.run; S.confirm=null; if(!r) return renderSheet();
      if(r.a==="delHist"){ const ix=HIST.findIndex(x=>x.pid===r.pid), h=HIST[ix], wasCur=S.pid===r.pid;
        HIST=HIST.filter(x=>x.pid!==r.pid); if(wasCur) S.pid=null; saveHist(); save(); render();
        if(h) showUndo(L("Rencana dihapus.","Plan deleted."),()=>{ HIST.splice(Math.max(0,ix),0,h); if(wasCur) S.pid=h.pid; saveHist(); save(); render(); });
        return; }
      if(r.a==="resetEdit"){delete S.custom[S.edit]; if(S.recipeOf) delete S.recipeOf[S.edit]; save(); return renderSheet();}
      if(r.a==="new"){return newPlan();}
      if(r.a==="wipeAll"){ const lang=S.lang; try{ localStorage.removeItem(KEY); localStorage.removeItem(HKEY); }catch(e){} HIST=[]; S={...defaults(),lang,view:"intro",introI:0}; save(); render(); window.scrollTo(0,0); return; }
      if(r.a==="clearSplit"){ S.assign={}; S.assignGear={}; S.assignWater=null; S.sent={}; save(); storeHistory(); return render(); }
      if(r.a==="trailGo"){ S.trailDay=null; return go("trail"); }
      if(r.a==="select"){ applySelect(r.k,r.v); return render(); }
      if(r.a==="removeItem"){ const E=editorData(S.edit); setItems(S.edit,E.items.filter(([id])=>id!==r.id)); save(); return renderSheet(); }
      return renderSheet(); }
    case "type": S.type=v; if(v==="multi"&&(!S.end||S.end<=S.start)) S.end=addDays(S.start,1); S.meals={}; save(); return render();
    case "dstep": { const n=clamp(days()+(+v),2,10); S.end=addDays(S.start,n-1); S.meals={}; save(); return render(); }
    case "exp": S.exp=v; S.pace=EXP[v]||"normal"; save(); return render();
    case "tab": S.tab=v; save(); render(); window.scrollTo(0,0); return;
    case "glossary": S.helpTab="terms"; return go("help");
    case "help": S.helpTab=S.helpTab||"how"; return go("help");
    case "helpTab": S.helpTab=v; S.helpMsg=false; save(); return render();
    case "helpGo": { if(v==="history") return go("history");
      if(!route()||!S.pid){ const h=HIST.slice().sort((x,y)=>y.saved-x.saved)[0]; if(h){ S={...defaults(),...h.data,lang:S.lang,seenIntro:true,helpTab:"feat"}; applyKcal(); } else { S.helpMsg=true; return render(); } } if(v==="trail") return go("trail"); if(v==="sos") return go("sos"); S.tab=v; return go("plan",5); }
    case "shuffleDay": { const R=calc(); const d=R.D[+v]; d.meals.filter(m=>m.on).forEach(m=>{ const al=altsFor(m.slot,m.key,d.i); if(al.length){ applyAlt(m.key,m.slot,d.i,m.target,al[Math.floor(Math.random()*al.length)]); } }); save(); storeHistory(); return render(); }
    case "useAlt": case "moreAlt": { const key=b.dataset.key; const R=calc(); let m=null, di=0; if(key==="reserve"){ m={slot:"cadangan",target:R.reserve.target}; } else { for(const d of R.D) for(const x of d.meals) if(x.key===key){ m=x; di=d.i; } } if(!m) return;
      if(a==="moreAlt"){ S.altShift=S.altShift||{}; S.altShift[key]=(S.altShift[key]||0)+3; save(); return renderSheet(); }
      const al=altsFor(m.slot,key,di).find(x=>x.id===b.dataset.alt); if(!al) return; applyAlt(key,m.slot,di,m.target,al); save();
      if(b.dataset.in==="sheet"){ renderSheet(); return flashSaved(); } storeHistory(); return render(); }
    case "shareGroup": S.msg={t:L("Siapa membawa apa","Who brings what"),x:groupText(calc())}; return renderSheet();
    case "sharePrep": S.msg={t:L("Jadwal persiapan","Prep schedule"),x:prepText()}; return renderSheet();
    case "trailNextDay": { const R=calc(); const ti=todayIdx(R.n); const di=clamp(S.trailDay!=null?S.trailDay:(ti!=null?ti:0),0,R.n-1); S.trailDay=Math.min(R.n-1,di+1); save(); storeHistory(); render(); window.scrollTo(0,0); return; }
    case "trailFinish": { storeHistory(); const pid=S.pid; go("welcome"); S.noteFor=pid; return renderSheet(); }
    case "saver": S.saver=!S.saver; save(); return render();
    case "ics": return downloadFile("bekal-nanjak.ics","text/calendar",icsFile());
    case "print": return go("print");
    case "printBack": return go("done");
    case "exportPlan": { S.lastBackup=Date.now(); save(); storeHistory(); const h=HIST.find(x=>x.pid===S.pid); return downloadFile(`bekal-nanjak-${(planName()||"rencana").toLowerCase().replace(/[^a-z0-9]+/g,"-")}.json`,"application/json",JSON.stringify({app:"bekal-nanjak",v:1,plans:[h]},null,1)); }
    case "wipeAll": S.confirm={title:L("Hapus semua data?","Delete all data?"),msg:L(`Semua rencana (${HIST.length}), catatan, dan pengaturan akan dihapus dari HP ini dan tidak bisa dikembalikan.`,`All plans (${HIST.length}), notes, and settings will be deleted from this phone and can't be recovered.`),yes:L("Hapus semua","Delete all"),danger:true,run:{a:"wipeAll"}}; return renderSheet();
    case "backupLater": S.backupSnooze=Date.now()+7*864e5; save(); return render();
    case "undo": { const u=UNDO; UNDO=null; const el=document.getElementById("undoBar"); if(el) el.hidden=true; if(u&&u.fn) u.fn(); return; }
    case "awake": S.awake=!S.awake; save(); keepAwake(needAwake()); return render();
    case "exportAll": S.lastBackup=Date.now(); save(); setTimeout(render,50); return downloadFile("bekal-nanjak-riwayat.json","application/json",JSON.stringify({app:"bekal-nanjak",v:1,plans:HIST},null,1));
    case "importPlan": { const f=$("#importFile"); if(f) f.click(); return; }
    case "prep": S.prep=S.prep||{}; S.prep[v]=!S.prep[v]; save(); storeHistory(); return render();
    case "term": S.term=b.dataset.k; return renderSheet();
    case "closeTerm": S.term=null; return renderSheet();
    case "sex": S.sex=v; save(); return render();
    case "toggle": if(b.dataset.k==="summitAtk"){ S.summitAtk=S.summitAtk===false; } else S[b.dataset.k]=!S[b.dataset.k]; save(); return render();
    case "meal": { const k=b.dataset.key,[d,slot]=k.slice(1).split("-"); S.meals[k]=!mealOn(+d,slot); save(); return render(); }
    case "reserve": S.reserve=v; save(); return render();
    case "editPrice": S.editPrice=!S.editPrice; save(); return render();
    case "copy": return copyList(false);
    case "share": return copyList(true);
    case "people": S.people=clamp((S.people||1)+(+v),1,20); S.sent={}; save(); return render();
    case "taskM": S.taskM=+v; save(); render(); { const t=$("#tugas"); if(t) t.scrollIntoView({block:"start"}); } return;
    case "assign": { const k=b.dataset.kind, key=b.dataset.key, val=v==="each"?"each":+v;
      if(k==="item"){ S.assign[key]=(S.assign[key]===val)?null:val; } else if(k==="gear"){ S.assignGear=S.assignGear||{}; S.assignGear[key]=(S.assignGear[key]===val)?null:val; } else { S.assignWater=(S.assignWater===val)?null:val; }
      S.sent={}; save(); storeHistory(); return render(); }
    case "clearSplit": S.confirm={title:L("Kosongkan pembagian?","Clear the split?"),msg:L("Semua barang kembali belum dibagi.","All items go back to unassigned."),yes:L("Kosongkan","Clear"),danger:true,run:{a:"clearSplit"}}; return renderSheet();
    case "msgShare": return copyList(true,$("#msgTxt").value,"#msgToast");
    case "msgCopy": return copyList(false,$("#msgTxt").value,"#msgToast");
    case "msgClose": S.msg=null; return renderSheet();
    case "autoSplit": autoAssign(calc()); S.sent={}; save(); storeHistory(); render(); { const t=$("#tugas"); if(t) t.scrollIntoView({block:"start"}); } return;
    case "shareMember": { const R=calc(); const m=+b.dataset.m; const ml=teamLists(R)[m]; S.sent=S.sent||{}; S.sent[m]=true; save(); render(); S.msg={t:L("Tugas","Tasks for")+" "+ml.name,x:teamText(R,ml)}; return renderSheet(); }
    case "got": S.got[b.dataset.id]=!S.got[b.dataset.id]; save(); return render();
    case "clearGot": S.got={}; save(); return render();
    case "finish": storeHistory(); return go("done");
    case "home": return go("welcome");
    case "edit": S.edit=b.dataset.key; return renderSheet();
    case "closeEdit": S.edit=null; save(); storeHistory(); render(); return;
    case "resetEdit": if(!S.custom[S.edit]) return; S.confirm={title:L("Kembalikan ke saran?","Go back to the suggestion?"),msg:L("Semua perubahan di menu ini akan hilang dan diganti menu saran.","All changes to this meal will be replaced by the suggested menu."),yes:L("Kembalikan","Reset"),danger:true,run:{a:"resetEdit"}}; return renderSheet();
    case "addPreset": { const pr=PRESETS.find(x=>x.id===b.dataset.id); if(!pr) return; const E=editorData(S.edit); const items=E.items.map(x=>x.slice()); pr.items.forEach(([id,q])=>{const f=items.find(x=>x[0]===id); if(f) f[1]+=q; else items.push([id,q])}); setItems(S.edit,items); const rl=S.recipeOf[S.edit]=S.recipeOf[S.edit]||[]; if(!rl.includes(pr.id)) rl.push(pr.id); save(); return renderSheet(); }
    case "qty": { const E=editorData(S.edit);
      if(+v<=-999){ const key=S.edit, before=E.items.map(x=>x.slice()), wasCustom=!!S.custom[key];
        setItems(key,E.items.filter(([id])=>id!==b.dataset.id)); save(); renderSheet(); flashSaved();
        showUndo(L(`${fname(b.dataset.id)} dihapus.`,`${fname(b.dataset.id)} removed.`),()=>{ if(wasCustom) setItems(key,before); else delete S.custom[key]; save(); if(S.edit) renderSheet(); else render(); });
        return; }
      if(false){ S.confirm={title:L("Hapus makanan ini?","Remove this food?"),msg:L(`${fname(b.dataset.id)} akan dihapus dari menu ini.`,`${fname(b.dataset.id)} will be removed from this meal.`),yes:L("Hapus","Remove"),danger:true,run:{a:"removeItem",id:b.dataset.id}}; return renderSheet(); }
      const items=E.items.map(([id,q])=>[id,id===b.dataset.id?Math.max(1,q+(+v)):q]); setItems(S.edit,items); save(); renderSheet(); return flashSaved(); }
    case "addFood": { const id=b.dataset.id; if(!id) return; const E=editorData(S.edit); const items=E.items.slice(); const f=items.find(x=>x[0]===id); if(f) f[1]++; else items.push([id,1]); setItems(S.edit,items); save(); renderSheet(); return flashSaved(); }
    case "addOwn": {
      const gs=$("#ownGsel")?$("#ownGsel").value:"custom";
      const n=$("#ownN").value.trim(), g=gs==="custom"?(+$("#ownG").value||0):+gs, u0=$("#ownU").value.trim()||L("porsi","serving"), u=g?`${u0} ${g} g`:u0, k=+$("#ownK").value, p=+$("#ownP").value||0;
      if(!n||!(k>0)){ $("#ownErr").textContent=L("Isi nama makanan dan kalorinya.","Enter the food name and calories."); return; }
      const id="own_"+Date.now().toString(36); S.ownFoods[id]={n,u,k,g,p,c:"own",pr:0,fb:0,keep:999};
      const E=editorData(S.edit); setItems(S.edit,E.items.concat([[id,1]])); save(); return renderSheet();
    }
  }
});
document.addEventListener("change",e=>{
  if(e.target.dataset&&(e.target.dataset.member!=null||e.target.dataset.cost||e.target.dataset.kcal||e.target.dataset.mb||e.target.dataset.daystart!=null)) { storeHistory(); render(); return; }
  if(e.target.id==="ownGsel"){ const w=$("#ownGwrap"); if(w) w.hidden=e.target.value!=="custom"; return; }
  if(e.target.id==="importFile"&&e.target.files&&e.target.files[0]){ const rd=new FileReader(); rd.onload=()=>{ try{ const j=JSON.parse(rd.result); const plans=(j&&j.plans)||[]; let n=0; plans.forEach(h=>{ if(h&&h.pid&&h.data){ HIST=HIST.filter(x=>x.pid!==h.pid); HIST.unshift(h); n++; } }); saveHist(); alert(L(`${n} rencana dipulihkan.`,`${n} plan(s) restored.`)); render(); }catch(err){ alert(L("File tidak bisa dibaca.","Couldn't read that file.")); } }; rd.readAsText(e.target.files[0]); }
});
let TX=null;
document.addEventListener("touchstart",e=>{ if(S.view==="intro") TX=e.touches[0].clientX; },{passive:true});
document.addEventListener("touchend",e=>{ if(S.view!=="intro"||TX==null) return; const dx=e.changedTouches[0].clientX-TX; TX=null;
  if(Math.abs(dx)<50) return; S.introI=clamp((S.introI||0)+(dx<0?1:-1),0,INTRO.length-1); render(); },{passive:true});
document.addEventListener("keydown",e=>{ if(S.view==="intro"&&(e.key==="ArrowRight"||e.key==="ArrowLeft")){ S.introI=clamp((S.introI||0)+(e.key==="ArrowRight"?1:-1),0,INTRO.length-1); render(); } });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"){ if(S.confirm){S.confirm=null;return renderSheet()} if(S.edit||S.term){S.edit=null;S.term=null;renderSheet()} } });
document.addEventListener("toggle",e=>{ if(e.target.id==="tips"){S.tipsOpen=e.target.open;save()} if(e.target.id==="names"){S.namesOpen=e.target.open;save()} },true);
function applySelect(k,v){
  S[k]=v;
  if(k==="prov"){S.mountain="";S.route="";S.custom={}}
  if(k==="mountain"){S.route=""; const rs=routesOf(S.mountain); if(rs.length===1) S.route=rs[0].id; else if(!rs.length&&S.mountain) S.route="manual"; S.peakManual=""; S.custom={};}
  if(k==="route"){const r=route(); if(r&&r.days){S.type="multi";S.end=addDays(S.start,r.days-1);} S.meals={}; S.custom={};}
  save();
}
document.addEventListener("input",e=>{
  const el=e.target;
  if(el.id==="edSearch"){ const q=el.value.trim().toLowerCase().replace(/cokelat/g,"coklat"); document.querySelectorAll(".sheet .fchip").forEach(c=>{ c.hidden=!!q&&!c.dataset.name.includes(q); }); const od=document.querySelector(".sheet details.mini-d"); if(od&&q) od.open=true; return; }
  if(el.dataset.prepdate){ const sp=el.parentElement&&el.parentElement.querySelector(".dval"); if(sp) sp.textContent=dmy(el.value); if(fullDate(el.value)){ S.prepDate=S.prepDate||{}; S.prepDate[el.dataset.prepdate]=el.value; save(); storeHistory(); } return; }
  if(el.type==="time"){ const sp=el.parentElement&&el.parentElement.querySelector(".dval"); if(sp) sp.textContent=el.value||"--:--"; }
  if(el.dataset.acct!=null){ S.accounts=S.accounts||{}; S.accounts[el.dataset.acct]=el.value; save(); return; }
  if(el.dataset.daystart!=null){ S.dayStart=S.dayStart||{}; S.dayStart[el.dataset.daystart]=el.value; save(); return; }
  if(el.dataset.mb){ const m=+el.dataset.m; S.mbody=S.mbody||[]; S.mbody[m]=S.mbody[m]||{}; S.mbody[m][el.dataset.mb]=+el.value||""; save(); return; }
  if(el.dataset.cost){ S.costs=S.costs||{}; S.costs[el.dataset.cost]=+el.value||0; save(); return; }
  if(el.dataset.kcal){ const v=+el.value; if(v>0){ S.kcalOv=S.kcalOv||{}; S.kcalOv[el.dataset.kcal]=v; FOODS[el.dataset.kcal]&&(FOODS[el.dataset.kcal].k=v); save(); } return; }
  if(el.dataset.member!=null){ S.members=S.members||[]; S.members[+el.dataset.member]=el.value; save(); return; }
  if(el.dataset.assign){ S.assign[el.dataset.assign]=el.value; S.sent={}; save(); render(); return; }
  if(el.dataset.price){ const v=+el.value; if(isFinite(v)&&v>=0){S.prices[el.dataset.price]=v; save();} return; }
  const k=el.dataset.k; if(!k) return;
  if(el.type==="range"){ S[k]=+el.value; el.closest(".slider").querySelector("output").firstChild.nodeValue=el.value; paintRanges(); save(); return; }
  if(el.tagName==="SELECT"){
    if(["prov","mountain","route"].includes(k)&&Object.keys(S.custom).length&&el.value!==S[k]){
      S.confirm={title:L("Ganti tujuan pendakian?","Change destination?"),msg:L("Menu yang sudah kamu ubah akan dikembalikan ke menu saran.","Meals you've edited will go back to the suggested menu."),yes:L("Ganti","Change"),run:{a:"select",k,v:el.value}};
      el.value=S[k]; return renderSheet();
    }
    applySelect(k,el.value); return render();
  }
  if(el.type==="date"){ if(el.value&&!fullDate(el.value)) return; S[k]=el.value;
    if(k==="start"&&S.type==="multi"&&fullDate(S.start)){ const n=days(); if(!S.end||S.end<=S.start) S.end=addDays(S.start,1); }
    S.meals={}; save(); return render(); }
  S[k]=el.value; if(k==="startTime") S.meals={};
  save();
  if(S.view==="plan"&&S.step===1){ const nb=document.querySelector('.bar [data-act="next"]'); if(nb) nb.disabled=!routeData(); }
});
document.addEventListener("click",e=>{const inp=e.target.closest("input[type=date],input[type=time]");if(inp&&inp.showPicker){try{inp.showPicker()}catch(err){}}});

function shareText(){
  const R=calc(); if(!R) return "";
  const P=S.people||1, full=false;
  const it=l=>l.map(([id,q])=>`${fname(id)} ${qty(id,q)}`).join(", ");
  const Ls=[`*${L("Bekal","Food for")} ${planName()}*`,`${durLabel(R.n)}, ${L("mulai","from")} ${dayDate(0)}${P>1?`, ${P} ${L("orang","people")}`:""}`,""];
  if(full){
    Ls.push(`*${L("Menu per orang","Menu per person")}*`);
    R.D.forEach(d=>{Ls.push(`_${L("Hari","Day")} ${d.i+1}, ${dayDate(d.i)}_`); d.meals.filter(x=>x.on).forEach(x=>Ls.push(`• ${L(...SLOTS[x.slot].n)}: ${it(x.items)}`)); });
    if(R.reserve.items.length) Ls.push(`• ${L("Cadangan","Spare food")}: ${it(R.reserve.items)}`);
    Ls.push("");
  }
  const A=P>1?splitTasks(R):{};
  Ls.push(`*${L("Daftar belanja","Shopping list")}*`);
  Object.keys(CATS).forEach(c=>{const items=Object.entries(R.shop).filter(([id])=>food(id).c===c); if(!items.length) return;
    Ls.push(`_${L(...CATS[c])}_`); items.forEach(([id,q])=>Ls.push(`${S.got[id]?"☑":"☐"} ${fname(id)}, ${buyRow(R,id,q).label}${P>1&&A[id]!=null?` (${A[id]==="each"?L("masing-masing","each"):memberName(+A[id])})`:""}`)); });
  Ls.push("",`${L("Perkiraan biaya","Estimated cost")}: ${rp(buyTotal(R))}${P>1?` (±${rp(buyTotal(R)/P)} ${L("per orang","per person")})`:""}`,`${L("Air","Water")}: ±${dec(Math.max(...R.D.map(d=>d.water)))} L ${L("per orang per hari, isi ulang di sumber air","per person per day, refill at water sources")}`,"",L("Dibuat dengan Bekal Nanjak","Made with Bekal Nanjak"));
  return Ls.join("\n");
}
function copyList(viaShare,txt,toastSel){
  const text=txt||shareText(); if(!text) return;
  const box=$("#copybox")||$("#msgTxt"), toast=$(toastSel||"#toast")||{set textContent(v){}};
  const fallbackCopy=()=>(navigator.clipboard?navigator.clipboard.writeText(text):Promise.reject())
    .then(()=>{toast.textContent=L("Disalin. Tempel ke grup rombonganmu.","Copied. Paste it into your group chat."); box.hidden=true})
    .catch(()=>{if(box){box.value=text; box.hidden=false; box.select();} toast.textContent=L("Pilih teks di bawah lalu salin.","Select the text below and copy it.")});
  if(viaShare&&NB_()&&NB_().share){ try{ NB_().share(text); return; }catch(e){} }
  if(viaShare){
    if(navigator.share){ navigator.share({title:"Bekal Nanjak",text}).catch(err=>{ if(err&&err.name!=="AbortError") fallbackCopy(); }); return; }
    window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank","noopener"); return;
  }
  fallbackCopy();
}

let LAST_REMIND="";
setInterval(()=>{
  if(S.timerEnd){ const left=S.timerEnd-Date.now(), t=$("#timerTxt");
    if(left<=0){ S.timerEnd=null; save(); beep(); keepAwake(needAwake()); const el=$("#remind"); if(el){ el.hidden=false; el.textContent=L("Timer selesai. Cek masakanmu supaya tidak gosong.","Timer done. Check your food so it doesn't burn."); } if(S.view==="trail") render(); }
    else if(t) t.textContent=`${Math.floor(left/60000)}:${pad(Math.floor(left/1000)%60)}`; }
  if(S.walkT&&S.view==="trail"){ const mins=Math.floor((Date.now()-S.walkT)/60000), wm=$("#walkMin"); if(wm) wm.textContent=mins;
    const every=S.snackEvery||60, cyc=Math.floor(mins/every);
    if(cyc>0&&cyc>(S.walkAlert||0)){ S.walkAlert=cyc; save(); const el=$("#remind"); if(el){ el.hidden=false; el.textContent=L(`Sudah ${mins} menit jalan. Waktunya break: istirahat sebentar, minum, dan ngemil.`,`${mins} minutes of walking. Time for a break: rest, drink, and snack.`); } try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){} } }
},1000);
setInterval(()=>{ if(S.view!=="trail") return; const R=calc(); if(!R) return; const ti=todayIdx(R.n); if(ti==null) return;
  const di=clamp(S.trailDay!=null?S.trailDay:ti,0,R.n-1); if(di!==ti) return;
  const P=dayPlan(R,R.D[di]), now=nowH();
  const due=P.ev.find(e=>((e.kind==="snack"&&e.k)||(e.kind==="meal"&&e.on))&&!(S.trail&&S.trail.done[e.id])&&e.time<=now&&e.time>now-0.25);
  const el=$("#remind"); if(!el) return;
  if(due&&LAST_REMIND!==due.id){ LAST_REMIND=due.id; el.hidden=false; el.textContent=L(`Waktunya ${due.label.toLowerCase()}`,`Time for: ${due.label}`)+(due.what?`: ${due.what}`:""); try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){} }
},30000);
(function boot(){
  try{ const q=new URLSearchParams(location.search), b=q.get("buka"), pid=q.get("p");
    if(b&&pid){ const h=HIST.find(x=>x.pid===pid); if(h){ S={...defaults(),...h.data,lang:S.lang,seenIntro:true}; applyKcal(); if(b==="pendakian"){ S.view="trail"; S.trailDay=null; } else { S.view="plan"; S.step=5; S.tab="shop"; } } history.replaceState(null,"",location.pathname); }
  }catch(e){}
  render(); checkOffline();
  try{ if(S.view==="welcome"&&S.pid&&HIST.some(h=>h.pid===S.pid)){ const t=todayStr(), en=S.type==="oneday"?S.start:S.end;
      if(t>=S.start&&t<=en&&S.promptDay!==t){ S.promptDay=t; save(); S.confirm={title:L("Hari ini kamu mendaki","You're hiking today"),msg:planName(),yes:L("Mulai Mode Pendakian","Start hiking mode"),run:{a:"trailGo"}}; renderSheet(); } } }catch(e){}
  if(location.hash==="#packing"){ setTimeout(()=>{ const el=document.getElementById("packing"); if(el) el.scrollIntoView(); },300); }
})();
if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{})})}

