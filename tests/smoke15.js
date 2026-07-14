// v10.1 회귀: 예상피해=실제피해 패리티, 소문 도달성, 덱 분리, 사기 일원화
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
    // ---------- 패리티: 예상 = 실제 (핏빛달 + 약화 + 불퇴) ----------
    party=[{sp:'sansin',lv:1,wh:0,active:true}];   // 산신: 피해감소 신기 없음(회복만)
    deck=[]; relics=[]; tokens=[]; pendingHaewon=[]; boons=['bultoe']; uidSeq=1;
    for(let i=0;i<6;i++)addCard('bujeok');
    teamMax=80; teamHP=80; act=1; depth=8; coins=50;
    genMap();
    startBattle('mulgwisin',{field:'bloodmoon'});
    await sleep(1000);
    enemy.weak=2; player.block=0; player.han=0;
    const mv=enemy.pat[enemy.pi%enemy.pat.length];   // {a:8+보정}
    const predicted=calcIncomingHit(mv.a+enemy.str)*(mv.h||1);
    const hp0=teamHP;
    await endTurn(); await sleep(200);
    const actual=hp0-teamHP-(0);   // 산신 신기: 턴시작 회복2가 이후에 붙음 → 회복 반영 보정
    // 회복 2가 플레이어 턴 시작에 발생하므로 실제 피해 = hp0 - teamHP + 회복분
    const healed=2;   // 산의 가호
    console.log('[패리티] 예상='+predicted+' 실제='+(hp0-teamHP+healed));
    assert.equal(predicted,hp0-teamHP+healed);
    inBattle=false; stopDrone();
    // ---------- 소문 도달성: 선택한 갈림길의 후손에만 배치 ----------
    act=1; genMap();
    // 한 걸음 진행: 0행 선택
    mapPos=0; mapCur=0; mapRows[0][0].chosen=true;
    const ds=descendantSet(0,0);
    tokens=[]; pendingHaewon=[];
    tokens.push('cheongsil'); ensureHaewonTarget('cheongsil');   // 손각시
    let placedIn=null, outOfPath=false;
    for(let r=1;r<mapRows.length;r++)mapRows[r].forEach((n,i)=>{
      if(n.enemy&&n.enemy.sp==='songaksi'){placedIn=r+'-'+i;if(!ds.has(r+'-'+i))outOfPath=true;}
    });
    console.log('[소문] 배치='+(placedIn||'pending')+' 경로밖='+outOfPath);
    assert.ok(placedIn,'후손 경로에 배치돼야 한다'); assert.equal(outOfPath,false);
    // ---------- 덱 분리 ----------
    party.push({sp:'cheonyeo',lv:1,wh:2,active:true},{sp:'dokkaebi',lv:1,wh:2,active:false});
    SPIRITS.cheonyeo.cards.forEach(c=>addCard(c,'cheonyeo'));
    SPIRITS.dokkaebi.cards.forEach(c=>addCard(c,'dokkaebi'));
    const bd=battleDeck(), bench=deck.filter(c=>!bd.includes(c));
    openDeck();
    console.log('[덱분리] 전투='+bd.length+' 대기='+bench.length);
    assert.equal(bench.length,3); assert.equal(bd.length+bench.length,deck.length);
    // ---------- 사기 일원화: 명복·호랑이눈에도 적용 (명복의 힘은 이야기 프로필에만 있음) ----------
    diffMode='story';
    boons=['sagi']; relics=['tigereye']; nextBless=true;
    startBattle('gaekgwi');
    await sleep(1000);
    // v0.7.1: 사기는 턴마다 처음 힘을 얻을 때만 +1 (장군신 후반 폭주 1차 조정)
    // tigereye 1+사기1, 명복 1+사기0(같은 턴 두 번째) = 3
    console.log('[사기] 전투 시작 힘='+player.str);
    assert.equal(player.str,3);
    // ---------- 다단히트 임계 스냅샷: 첫 타격이 50% 경계를 넘겨도 예상=실제 ----------
    inBattle=false; stopDrone();
    boons=['bultoe']; relics=[]; nextBless=false;
    teamMax=80; teamHP=41;                              // 첫 타격 후 50% 아래로 떨어지는 지점
    startBattle('mulgwisin');
    await sleep(1000);
    enemy.pi=2;                                          // {a:*,h:2} 다단히트 차례
    enemy.weak=0; player.block=0; player.han=0;
    const mv2=enemy.pat[2];
    const pred2=calcIncomingHit(mv2.a+enemy.str)*(mv2.h||1);
    const hpA=teamHP;
    await endTurn(); await sleep(200);
    const actual2=hpA-teamHP+2;                          // 산신 가호(턴 시작 회복 2) 보정
    console.log('[다단히트 임계] 예상='+pred2+' 실제='+actual2);
    assert.equal(pred2,actual2);
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
