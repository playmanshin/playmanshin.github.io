// 귀신 킷 리워크 스모크 (v0.9): 조건부 보너스(v.cond) 11종·신규 payoff 3장·오라 전환 3건
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
    party=[{sp:'janggun',lv:1,wh:0,active:true}];
    deck=[]; relics=[]; tokens=[]; uidSeq=1; boons=[];
    for(let i=0;i<8;i++)addCard('bujeok');
    teamMax=80; teamHP=80; act=0; depth=0; coins=0;
    genMap();
    startBattle('gaekgwi');
    await sleep(950);
    enemy.hp=500; enemy.max=500; player.str=0;
    const play=async(id,en)=>{
      const i={uid:uidSeq++,id,owner:null}; hand.push(i);
      energy=(en===undefined?3:en);
      const e0=enemy.hp+enemy.block;
      await playCard(i,null);
      return e0-(enemy.hp+enemy.block);
    };
    // ---- 1) v.cond 11종 ----
    assert.equal(await play('bul1'),9,'lowHP 미충족');
    teamHP=40; assert.equal(await play('bul1'),15,'lowHP 충족 +6');
    player.block=0; await play('bul2'); assert.equal(player.block,13,'lostHP 40 → min(5,8)=5, 8+5');
    teamHP=80; player.block=0; await play('bul2'); assert.equal(player.block,8,'lostHP 0');
    turnCardCount=0; assert.equal(await play('yagwang2'),3,'turnCards 첫 장 +0');
    turnCardCount=3; assert.equal(await play('yagwang2'),6,'먼저 낸 3장 +3');
    turnCardCount=10; assert.equal(await play('yagwang2'),7,'turnCards 캡 +4');
    player.block=0; await play('yagwang3'); assert.equal(player.block,6,'energyLeft 충족 3+3');
    player.block=0; await play('yagwang3',0); assert.equal(player.block,3,'신력 0 — 보너스 없음');
    enemy.block=5; assert.equal(await play('dokkaebi1'),14,'enemyBlock +5 (총손실 기준)');
    enemy.block=0; assert.equal(await play('dokkaebi1'),9,'적 방어 없음');
    player.block=9; assert.equal(await play('eoduk3'),9,'myBlock3: 6+min(4,3)');
    player.block=0; assert.equal(await play('eoduk3'),6);
    enemy.weak=2; player.block=0; await play('mul3'); assert.equal(player.block,11,'enemyWeak 7+4');
    enemy.weak=0; player.block=0; await play('mul3'); assert.equal(player.block,7);
    enemy.pi=0; player.block=0; await play('mongdal3'); assert.equal(player.block,6,'intentAtk: 다음 수 공격 3+3');
    enemy.pi=1; player.block=0; await play('mongdal3'); assert.equal(player.block,3,'다음 수 비공격');
    enemy.pi=0;
    player.turnAtk=false; assert.equal(await play('sam1'),11,'firstAtk +4');
    assert.equal(await play('sam1'),7,'둘째 공격부터 미발동');
    enemy.han=0; assert.equal(await play('saja1'),13,'enemyHan 없음');
    enemy.han=3; assert.equal(await play('saja1'),19,'enemyHan 있음 +6');
    enemy.han=0;
    player.block=5; assert.equal(await play('jang1'),13,'myBlock5 충족 +5');
    player.block=4; assert.equal(await play('jang1'),8,'방어 4 — 미충족');
    player.block=0;
    console.log('[cond] 조건부 보너스 11종 경계 전수 OK');
    // ---- 2) 신규 payoff 3장 ----
    battleHealTotal=9; assert.equal(await play('mjdanggi'),8,'명줄: 회복 9 → +3');
    battleHealTotal=60; assert.equal(await play('mjdanggi'),15,'명줄 캡 +10');
    await play('nakinhwaro');
    assert.equal(powers.filter(p=>p.k==='markAuto').length,1,'낙인화로 설치');
    enemy.mark=0; turnAtkCards=0;
    assert.equal(await play('bujeok'),7,'첫 공격: 6 + 자동낙인 즉발 1');
    assert.equal(enemy.mark,1,'낙인 1 각인');
    assert.equal(await play('bujeok'),7,'둘째 공격: 6 + 낙인틱 1 (신규 각인 없음)');
    assert.equal(enemy.mark,1,'턴당 1장 한정');
    player.nextAtk=0;
    drawPile=[{uid:uidSeq++,id:'bujeok',owner:null}];
    await play('cheongi');
    assert.equal(player.nextAtk,6,'천기: 덱탑 공격 → 공수 +6');
    assert.equal(drawPile.length,1,'공개만 — 뽑지 않음');
    player.nextAtk=0;
    drawPile=[{uid:uidSeq++,id:'bangul',owner:null}];
    const h0=hand.length;
    await play('cheongi');
    assert.equal(player.nextAtk,0,'덱탑 비공격 — 공수 없음');
    assert.equal(hand.length,h0+1,'대신 드로우 1 (헬퍼가 넣은 1장은 내며 상쇄, 드로우로 +1)');
    assert.equal(drawPile.length,0,'공개한 덱탑을 뽑아왔다');
    console.log('[신규] 명줄 당기기·낙인화로·천기누설 OK');
    // ---- 3) 오라 전환 3건 ----
    assert.equal(SPIRITS.mongdal.aura.id,'sadSong');
    assert.equal(SPIRITS.bulgasari.aura.id,'ironEater');
    assert.equal(SPIRITS.myogwi.aura.id,'gratitude');
    enemy.mark=0; powers=[];                                    // 낙인화로 정리
    setChannel('mongdal',true);
    enemy.weak=2; assert.equal(await play('bujeok'),9,'서러운 곡: 약화 적 +3');
    enemy.weak=0; assert.equal(await play('bujeok'),6,'약화 없음 — 미발동');
    setChannel('bulgasari',true);
    enemy.han=0; enemy.weak=0; enemy.pi=0;                      // 다음 수 {a:6} — 적 자힐 없는 수
    player.block=13; busy=false;
    let e1=enemy.hp;
    await endTurn(); await sleep(300);
    assert.equal(e1-enemy.hp,2,'쇠먹기: 13 − 적 공격 6 = 잔여 7 → min(5,2)=2');
    assert.equal(player.block,0,'이월 없음 — 전량 소멸');
    player.block=27; enemy.pi=0; busy=false;                    // 27 − 6 = 21 → floor 7 → 캡 5
    e1=enemy.hp;
    await endTurn(); await sleep(300);
    assert.equal(e1-enemy.hp,5,'쇠먹기 캡 5');
    console.log('[오라] 서러운 곡·쇠먹기(캡·이월 제외)·보은(smoke8) OK');
    // 신규 카드 u: 완비
    assert.equal(cardVals({id:'mjdanggi',up:true}).healSyn,12);
    assert.equal(cardVals({id:'nakinhwaro',up:true}).power.v,2);
    assert.equal(cardVals({id:'cheongi',up:true}).peekAtk,9);
    inBattle=false; stopDrone();
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
