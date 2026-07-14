// 빌드 다양성 P0 스모크: 무소속 무구 인스턴스 강화(isUp)·저장 직렬화·runStats 집계
const fs=require('fs');
const noop=()=>{};
const ctxStub=new Proxy({},{get:(t,p)=>{if(p==='createLinearGradient'||p==='createRadialGradient')return()=>({addColorStop:noop});return noop;},set:()=>true});
function mkEl(){return {classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},style:{},textContent:'',innerHTML:'',disabled:false,addEventListener:noop,appendChild:noop,prepend:noop,remove:noop,isConnected:false,width:0,height:0,tabIndex:0,setAttribute:noop,getContext:()=>ctxStub,getBoundingClientRect:()=>({left:0,top:0,width:360,height:640,bottom:640})};}
const els={}; const store=new Map();
global.document={getElementById:id=>els[id]||(els[id]=mkEl()),createElement:()=>mkEl(),createElementNS:()=>mkEl()};
global.window={devicePixelRatio:1};
global.addEventListener=noop;
global.innerWidth=800; global.innerHeight=900;
global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
global.requestAnimationFrame=noop;
const src=fs.readFileSync(__dirname+'/_game.js','utf8');
const test=`
(async()=>{
  const assert=require('node:assert/strict');
  try{
    diffMode='bongut'; localStorage.setItem('ms_geumje','0');
    // ---- 1) isUp: 무소속 무구는 인스턴스 up 플래그로 강화 ----
    party=[{sp:'janggun',lv:1,wh:0,active:true}];
    deck=[]; relics=[]; tokens=[]; uidSeq=1; boons=[];
    const plain={uid:uidSeq++,id:'geumjul',owner:null};
    const upped={uid:uidSeq++,id:'geumjul',owner:null,up:true};
    assert.equal(isUp(plain),false,'무강화 무구는 false');
    assert.equal(isUp(upped),true,'up 플래그 무구는 true');
    assert.equal(cardVals(plain).block,16,'기본값 v: 적용');
    assert.equal(cardVals(upped).block,20,'강화값 u: 적용');
    console.log('[isUp] 무소속 무구 up 플래그 → u: 값 적용 OK');
    // 신령 카드의 치성(lv2) 경로는 그대로 (회귀)
    const owned={uid:uidSeq++,id:'janggun1',owner:'janggun'};
    assert.equal(isUp(owned),false,'lv1 신령 카드는 false');
    party[0].lv=2;
    assert.equal(isUp(owned),true,'lv2 치성 후 true');
    assert.equal(cardVals(owned).dmg,12,'치성 강화값 적용');
    party[0].lv=1;
    console.log('[isUp] 치성(lv2) 경로 회귀 OK');
    // ---- 2) 저장 직렬화: up 플래그가 saveRun/loadRun을 왕복 ----
    deck=[plain,upped,owned];
    teamHP=70; teamMax=80; act=0; depth=0; coins=10;
    kills=0; seals=0; sendoffs=0; sinwi=0; gongdeok=0;
    genMap(); mapPos=-1; mapCur=0;
    initRunStats('janggun');
    saveRun();
    const saved=JSON.parse(localStorage.getItem('ms_run'));
    assert.equal(saved.deck.filter(c=>c.up).length,1,'저장에 up 1장');
    deck=[];
    assert.equal(loadRun(),true,'이어하기 성공');
    assert.equal(deck.length,3,'덱 복원');
    assert.equal(deck.filter(c=>isUp(c)&&!c.owner).length,1,'복원 후에도 무구 강화 유지');
    console.log('[저장] up 플래그 saveRun/loadRun 왕복 OK');
    // ---- 3) runStats 최종 스냅샷: 강화 수가 isUp 기준 (무구 강화 + 치성 모두 집계) ----
    party[0].lv=2;
    rsFinal();
    assert.equal(runStats.final.upgradedCards,2,'치성 1 + 무구 up 1 = 2');
    party[0].lv=1;
    rsFinal();
    assert.equal(runStats.final.upgradedCards,1,'치성 해제 시 무구 up만 1');
    console.log('[runStats] upgradedCards가 isUp 단일 기준 OK');
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
