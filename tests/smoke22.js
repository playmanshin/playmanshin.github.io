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
    // ---- 4) 축 payoff 카드 (v0.8) ----
    const inHand=id=>{const i={uid:uidSeq++,id,owner:null};hand.push(i);return i;};
    party=[{sp:'janggun',lv:1,wh:0,active:true}];
    deck=[]; relics=[]; tokens=[]; boons=[];
    for(let i=0;i<8;i++)addCard('bujeok');
    teamMax=80; teamHP=80; act=0; depth=0; coins=0;
    genMap();
    startBattle('gaekgwi');
    await sleep(950);
    enemy.hp=500; enemy.max=500;
    assert.equal(exhaustPile.length,0,'전투 시작 시 소멸 더미 비움');
    assert.equal(battleSelfAcc,0,'전투 시작 시 제물 누적 0');
    // 소멸 더미 + 제물(hpCost): 혈서
    hand.length=0; energy=1;
    await playCard(inHand('hyeolseo'),null);
    assert.equal(exhaustPile.length,1,'혈서가 소멸 더미에');
    assert.equal(battleSelfAcc,3,'혈서 체력 3이 제물로');
    // 핏값: 제물 바친 턴 힘 +1, 턴당 1회 (사기 전례)
    energy=3;
    await playCard(inHand('pitgap'),null);
    assert.equal(powers.filter(p=>p.k==='sac').length,1,'핏값 신령부 설치');
    assert.equal(exhaustPile.length,2,'핏값도 소멸 더미에');
    player.block=0;
    await playCard(inHand('dueok3'),null);   // 포악: 힘+1, 자해1
    assert.equal(player.str,4,'광기1 + 핏값1 = 2→4');
    assert.equal(battleSelfAcc,4,'자해 1 누적');
    await playCard(inHand('dueok3'),null);
    assert.equal(player.str,5,'핏값은 턴당 1회 — 카드 힘만 +1');
    assert.equal(battleSelfAcc,5);
    // 제물은 실제 잃은 체력만: 방어가 흡수하면 안 센다
    player.block=5;
    await playCard(inHand('dueok3'),null);
    assert.equal(battleSelfAcc,5,'방어 흡수 자해는 제물이 아니다');
    player.block=0;
    console.log('[제물] 혈서/자해 누적·핏값 턴당 1회·방어 흡수 제외 OK');
    // 넋오름: 소멸 더미 1장당 +3 (최대 4장)
    player.str=2; energy=3;
    let ehp=enemy.hp;
    await playCard(inHand('neokoreum'),null);
    assert.equal(ehp-enemy.hp,12,'4 + 소멸2×3 + 힘2 = 12');
    exhaustPile.length=0; for(let i=0;i<9;i++)exhaustPile.push({id:'x'});
    energy=3; ehp=enemy.hp;
    await playCard(inHand('neokoreum'),null);
    assert.equal(ehp-enemy.hp,18,'소멸 9장도 4장 캡 — 4+12+2=18');
    console.log('[넋오름] 소멸 더미 참조·4장 캡 OK');
    // 지신밟기: 지닌 방어만큼 (최대 12), 방어는 소모하지 않음
    player.str=2; player.block=20; energy=3; ehp=enemy.hp;
    await playCard(inHand('jisin'),null);
    assert.equal(ehp-enemy.hp,14,'min(12,20) + 힘2 = 14');
    assert.equal(player.block,20,'방어 비소모');
    player.block=0;
    console.log('[지신밟기] 방어 참조 상한 12 OK');
    // 신벌: 恨 12 경계·증가분 캡 +16·恨 불변
    player.str=2; enemy.han=11; energy=3; ehp=enemy.hp;
    await playCard(inHand('sinbeol'),null);
    assert.equal(ehp-enemy.hp,11,'恨 11 — 미발동 (9+2)');
    enemy.han=12; energy=3; ehp=enemy.hp;
    await playCard(inHand('sinbeol'),null);
    assert.equal(ehp-enemy.hp,22,'恨 12 — ×2 발동 (11×2)');
    assert.equal(enemy.han,12,'신벌은 恨을 건드리지 않는다');
    player.str=30; energy=3; ehp=enemy.hp;
    await playCard(inHand('sinbeol'),null);
    assert.equal(ehp-enemy.hp,55,'증가분 캡: min(39×2, 39+16) = 55');
    console.log('[신벌] 문턱 경계·증가분 캡·恨 무간섭 OK');
    // 작두 타기: 제물 1당 +2 (상한 +12)
    player.str=2; battleSelfAcc=7; energy=3; ehp=enemy.hp;
    await playCard(inHand('jakdu'),null);
    assert.equal(ehp-enemy.hp,26,'12 + min(12,7×2) + 힘2 = 26');
    assert.equal(battleSelfAcc,10,'작두 자해 3 재누적');
    console.log('[작두] 제물 스케일·상한 +12 OK');
    // 지전/소지: 토큰 생성, 신명 미적립, 소멸 처리, 풀 외
    hand.length=0; sinmyeong=0; energy=3;
    await playCard(inHand('jijeon'),null);
    assert.equal(sinmyeong,1,'지전은 신명을 채운다');
    assert.equal(hand.filter(x=>x.id==='soji').length,2,'소지 2장 생성');
    player.str=2; ehp=enemy.hp;
    const sj=hand.find(x=>x.id==='soji');
    await playCard(sj,null);
    assert.equal(ehp-enemy.hp,5,'소지 3 + 힘2');
    assert.equal(sinmyeong,1,'소지는 신명을 채우지 않는다');
    assert.ok(exhaustPile.some(x=>x.id==='soji'),'소지는 소멸된다');
    assert.ok(!GEAR_POOL.includes('soji'),'소지는 드래프트 풀 밖');
    ['neokoreum','jijeon','jisin','pitgap','sinbeol','jakdu'].forEach(id=>assert.ok(GEAR_POOL.includes(id),id+' 풀 포함'));
    assert.ok(deck.every(c=>c.id!=='soji'),'소지는 덱에 남지 않는다');
    // 손 가득: 8장에서 지전 → 1장만
    hand.length=0; for(let i=0;i<7;i++)inHand('bujeok');
    const jj=inHand('jijeon'); energy=3;
    await playCard(jj,null);
    assert.equal(hand.filter(x=>x.id==='soji').length,1,'손 상한 8 — 소지 1장만');
    console.log('[지전/소지] 토큰 생성·신명 게이트·손 상한 OK');
    inBattle=false; stopDrone();
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
