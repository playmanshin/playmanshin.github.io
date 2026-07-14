// v8.1 회귀: ① 신명 5 도달 시 굿거리 버튼 활성 ② 신물 해원 대상 보장 배치
const fs=require('fs');
const noop=()=>{};
const ctxStub=new Proxy({},{get:(t,p)=>{if(p==='createLinearGradient'||p==='createRadialGradient')return()=>({addColorStop:noop});return noop;},set:()=>true});
function mkEl(){return {classList:{add:noop,remove:noop,toggle:noop},style:{},textContent:'',innerHTML:'',disabled:true,addEventListener:noop,appendChild:noop,prepend:noop,remove:noop,isConnected:false,width:0,height:0,tabIndex:0,setAttribute:noop,getContext:()=>ctxStub,getBoundingClientRect:()=>({left:0,top:0,width:360,height:640,bottom:640})};}
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
    // ---------- 테스트 1: 신명 5 도달 → 버튼 즉시 활성 ----------
    party=[{sp:'janggun',lv:1,wh:0}];
    deck=[]; relics=[]; tokens=[]; pendingHaewon=[]; uidSeq=1;
    for(let i=0;i<8;i++)addCard('bujeok');
    teamMax=80; teamHP=80; act=0; depth=0; coins=50;
    genMap();
    startBattle('gaekgwi');
    await sleep(1000);
    enemy.hp=500; enemy.max=500;
    sinmyeong=4;
    const inst={uid:9001,id:'bujeok',owner:null}; hand.push(inst); energy=3;
    await playCard(inst,null);   // 신명 4→5, 애니메이션 종료 후
    const btn=document.getElementById('btnGut');
    console.log('[굿버튼] 신명='+sinmyeong+' busy='+busy+' disabled='+btn.disabled);
    assert.equal(sinmyeong,5); assert.equal(busy,false); assert.equal(btn.disabled,false);
    inBattle=false; stopDrone();
    // ---------- 테스트 2a: 신물 획득 → 같은 지도 앞길에 대상 보장 ----------
    act=1; genMap(); mapPos=0; mapCur=0;   // 둘째 밤, 시작 직후
    tokens=[];
    tokens.push('cheongsil'); ensureHaewonTarget('cheongsil');   // 손각시
    const placed=futureBattleNodes().some(n=>n.enemy&&n.enemy.sp==='songaksi');
    console.log('[신물배치] 손각시 앞길 배치='+placed);
    assert.equal(placed,true);
    // ---------- 테스트 2b: 앞길에 전투 없음 → pending → 다음 막 지도에 배치 ----------
    act=2; genMap(); mapPos=mapRows.length-1; mapCur=0;   // 막 끝 (앞길 없음)
    tokens=[]; pendingHaewon=[];
    console.log('[말미 게이트] 앞길 전투=0에서 haewonPlaceable(yeot)='+haewonPlaceable('yeot')+' (다음 막 있으므로 true)');
    tokens.push('yeot'); ensureHaewonTarget('yeot');   // 염매 — 배치 불가 → pending
    console.log('[pending] 등록='+JSON.stringify(pendingHaewon)+' (yeommae 기대)');
    act=3; genMap();   // 다음 막 생성 시 소화
    let found=false;
    for(let r=0;r<mapRows.length;r++)mapRows[r].forEach(n=>{if(n.enemy&&n.enemy.sp==='yeommae')found=true;});
    console.log('[막 이월 배치] 염매='+found+' pending 잔량='+pendingHaewon.length);
    assert.equal(found,true); assert.equal(pendingHaewon.length,0);
    // ---------- 테스트 2c: 최종 막 말미 — 배치 불가 신물은 판매/지급 차단 ----------
    mapPos=mapRows.length-1; tokens=[]; pendingHaewon=[]; party=[{sp:'janggun',lv:1,wh:0}];
    assert.equal(haewonPlaceable('kkotsin'),false);
    console.log('[최종 차단] OK');
    // 신단에 있는 미해원 귀신의 신물은 여전히 유효 (해원굿)
    party.push({sp:'yagwanggwi',lv:1,wh:1});
    assert.equal(haewonPlaceable('kkotsin'),true);
    console.log('[신단 예외] OK');
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
