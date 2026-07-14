// v6 스모크: 소멸/보존+담금질/신령부/낙인/X소모/콤보/제물/점괘/관통
const fs=require('fs');
const noop=()=>{};
const ctxStub=new Proxy({},{
  get:(t,p)=>{
    if(p==='createLinearGradient'||p==='createRadialGradient')return()=>({addColorStop:noop});
    return noop;
  },
  set:()=>true
});
function mkEl(){
  return {classList:{add:noop,remove:noop,toggle:noop},style:{},textContent:'',innerHTML:'',disabled:false,
    addEventListener:noop,appendChild:noop,prepend:noop,remove:noop,setAttribute:noop,tabIndex:0,isConnected:false,width:0,height:0,
    getContext:()=>ctxStub,
    getBoundingClientRect:()=>({left:0,top:0,width:360,height:640})};
}
const els={}; const store=new Map();
global.document={getElementById:id=>els[id]||(els[id]=mkEl()),createElement:()=>mkEl()};
global.window={devicePixelRatio:1};
global.addEventListener=noop;
global.innerWidth=800; global.innerHeight=900;
global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))};
global.requestAnimationFrame=noop;

const src=fs.readFileSync(__dirname+'/_game.js','utf8');
const test=`
(async()=>{
  const assert=require('node:assert/strict');
  try{
    const inHand=id=>{const i={uid:uidSeq++,id,owner:null};hand.push(i);return i;};
    party=[{sp:'janggun',lv:1,wh:0}];
    deck=[]; relics=[]; tokens=[]; uidSeq=1;
    for(let i=0;i<8;i++)addCard('bujeok');
    teamMax=80; teamHP=80; act=0; depth=0; coins=50;
    genMap();
    startBattle('gaekgwi');
    await sleep(950);
    enemy.hp=500; enemy.max=500;   // 테스트 중 조기 사망 방지
    // 소멸: 폭살부 → 버림더미에 없어야
    energy=3; const pok=inHand('poksalbu');
    const disc0=discard.length, ehp0=enemy.hp;
    await playCard(pok,null);
    console.log('[소멸] 피해='+(ehp0-enemy.hp)+' 버림더미증가='+(discard.length-disc0));
    assert.equal(ehp0-enemy.hp,18); assert.equal(discard.length-disc0,0);
    // 낙인: 낙인부2 → 부적던지기 적중 시 +2 추가
    energy=3; await playCard(inHand('nakinbu'),null);
    console.log('[낙인] enemy.mark='+enemy.mark);
    assert.equal(enemy.mark,4);
    const ehp1=enemy.hp; energy=3;
    await playCard(inHand('bujeok'),null);
    console.log('[낙인발동] 총피해='+(ehp1-enemy.hp));
    assert.equal(ehp1-enemy.hp,12);
    // 철갑 위에서 낙인은 관통
    enemy.armor=4; const ehp2=enemy.hp; energy=3;
    await playCard(inHand('bujeok'),null);
    console.log('[낙인관통] 총피해='+(ehp2-enemy.hp));
    assert.equal(ehp2-enemy.hp,8);
    enemy.armor=0;
    // X소모: 신명풀이 (신력 3 → 7x3타 + 힘2x3)
    energy=3; const ehp3=enemy.hp;
    await playCard(inHand('sinmyeongpuri'),null);
    console.log('[X소모] 피해='+(ehp3-enemy.hp)+' 남은신력='+energy);
    assert.equal(ehp3-enemy.hp,31); assert.equal(energy,0);   // 3타×9 + 낙인4(카드당 1회)
    // 콤보: cardsPlayed 리셋 후 2장 내고 3장째 삼재풀이
    cardsPlayed=0; energy=3;
    const jp=playCard(inHand('jeomgwae'),null);   // 점괘 — 이지선다 대기 (v0.10)
    for(let i=0;i<40&&!scryResolver;i++)await sleep(30);
    resolveScry(false); await jp;
    await playCard(inHand('suhobu'),null);
    const ehp4=enemy.hp;
    await playCard(inHand('samjaepuri'),null);
    console.log('[콤보] 3장째 피해='+(ehp4-enemy.hp));
    assert.equal(ehp4-enemy.hp,20);   // 14+힘2+낙인4
    // 제물: 혈서 체력 지불
    const hp0=teamHP; energy=1;
    await playCard(inHand('hyeolseo'),null);
    console.log('[제물] 체력 '+hp0+'→'+teamHP);
    assert.equal(hp0-teamHP,3);
    // 신령부: 신장기 → 다음 턴 힘 +1
    energy=3; const str0=player.str;
    await playCard(inHand('sinjanggi'),null);
    console.log('[신령부] powers='+powers.length);
    assert.equal(powers.length,1);
    // 보존+담금질: 비장의 부적이 턴 넘김에 살아남고 ramp
    const bj=inHand('bijang');
    await endTurn(); await sleep(200);
    const alive=hand.includes(bj);
    console.log('[보존] 손에 남음='+alive+' 담금질='+(bj.ramp||0)+' 신령부 힘 '+str0+'→'+player.str);
    assert.equal(alive,true); assert.equal(bj.ramp,2); assert.equal(player.str,str0+1);
    inBattle=false; stopDrone();
    // 관통 공격 (저승사자 3번째 수)
    act=1; depth=9;
    startBattle('jeoseungsaja',{elite:true});
    await sleep(950);
    player.block=99; enemy.pi=2;   // {a:10,pc:1}
    const hp1=teamHP;
    await endTurn(); await sleep(200);
    console.log('[관통] 방어99에도 체력 '+hp1+'→'+teamHP);
    assert.ok(hp1-teamHP>0,'관통이 방어를 뚫어야 한다');
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
