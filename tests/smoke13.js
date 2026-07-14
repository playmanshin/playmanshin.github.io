// v9 스모크: 출전 체계(덱 필터·슬롯 캡), 막간 강화 훅, 저장 v3
const fs=require('fs');
const noop=()=>{};
const ctxStub=new Proxy({},{get:(t,p)=>{if(p==='createLinearGradient'||p==='createRadialGradient')return()=>({addColorStop:noop});return noop;},set:()=>true});
function mkEl(){return {classList:{add:noop,remove:noop,toggle:noop},style:{},textContent:'',innerHTML:'',disabled:false,addEventListener:noop,appendChild:noop,prepend:noop,remove:noop,isConnected:false,width:0,height:0,tabIndex:0,setAttribute:noop,getContext:()=>ctxStub,getBoundingClientRect:()=>({left:0,top:0,width:360,height:640,bottom:640})};}
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
    // 셋업: 장군신 + 봉인 3위 (셋째는 대기여야)
    party=[{sp:'janggun',lv:1,wh:0,active:true}];
    deck=[]; relics=[]; tokens=[]; pendingHaewon=[]; boons=[]; uidSeq=1;
    for(let i=0;i<4;i++)addCard('bujeok');
    SPIRITS.janggun.cards.forEach(c=>addCard(c,'janggun'));
    teamMax=80; teamHP=80; act=0; depth=0; coins=50;
    // 봉인 시뮬 (보상 핸들러와 동일 규칙)
    const sealSim=sp=>{
      const slotFree=activeGhostCount()<2;
      party.push({sp,lv:1,wh:SPIRITS[sp].wh,active:slotFree});
      SPIRITS[sp].cards.forEach(c=>addCard(c,sp));
      return slotFree;
    };
    console.log('[슬롯] 처녀='+sealSim('cheonyeo')+' 도깨비='+sealSim('dokkaebi')+' 야광귀='+sealSim('yagwanggwi')+' (true,true,false 기대)');
    console.log('[출전] activeMembers='+activeMembers().length+' 야광귀 활성='+isActiveSp('yagwanggwi'));
    assert.equal(activeMembers().length,3); assert.equal(isActiveSp('yagwanggwi'),false);
    // 전투 덱: 대기(야광귀) 카드 제외
    const bd=battleDeck();
    const hasBench=bd.some(c=>c.owner==='yagwanggwi');
    console.log('[전투덱] 전체='+deck.length+' 유효='+bd.length);
    assert.equal(hasBench,false);
    // 편성 교체: 도깨비 대기 → 야광귀 출전
    memberOf('dokkaebi').active=false; memberOf('yagwanggwi').active=true;
    console.log('[교체] 야광귀 카드 포함='+battleDeck().some(c=>c.owner==='yagwanggwi')+' 도깨비 제외='+(!battleDeck().some(c=>c.owner==='dokkaebi')));
    // 막간 강화: 선봉+사기+길잡이
    boons=['seonbong','sagi','giljabi'];
    genMap();
    startBattle('gaekgwi');
    await sleep(1000);
    enemy.hp=500;enemy.max=500;
    console.log('[길잡이] 전투 시작 적 恨='+enemy.han+' (3 기대)');
    const ehp=enemy.hp;
    const a1={uid:9001,id:'bujeok',owner:null};hand.push(a1);energy=3;
    await playCard(a1,null);
    console.log('[선봉] 첫 공격 피해='+(ehp-enemy.hp));
    assert.equal(ehp-enemy.hp,12);
    const ehp2=enemy.hp;
    const a2={uid:9002,id:'bujeok',owner:null};hand.push(a2);energy=3;
    await playCard(a2,null);
    console.log('[선봉 1회] 둘째 공격='+(ehp2-enemy.hp));
    assert.equal(ehp2-enemy.hp,8);
    const s0=player.str;
    const gc={uid:9003,id:'janggun2',owner:'janggun'};hand.push(gc);energy=3;
    await playCard(gc,null);   // 군령 str2 + 사기1
    console.log('[사기] 힘 '+s0+'→'+player.str);
    assert.equal(player.str,s0+3);
    // 저승길: 恨 절반
    boons.push('jeoseunggil');
    const hp0=teamHP; player.han=0;
    dotPlayer(6);
    console.log('[저승길] 恨 6 → 실제 '+(hp0-teamHP));
    assert.equal(hp0-teamHP,3);
    inBattle=false; stopDrone();
    // 저장 v3 라운드트립 (active/boons 포함)
    mapPos=1; mapCur=0;
    saveRun();
    const snapshot={boons:boons.join(),act3:isActiveSp('yagwanggwi')};
    boons=[]; party.forEach(m=>m.active=false);
    const ok=loadRun();
    console.log('[저장v3] load='+ok);
    assert.equal(ok,true); assert.equal(boons.join(),snapshot.boons); assert.equal(isActiveSp('yagwanggwi'),snapshot.act3);
    // v2 저장 거부
    localStorage.setItem('ms_run',JSON.stringify({mapVersion:2,party:[{sp:'janggun'}],deck:[]}));
    assert.equal(loadRun(),false);
    console.log('[v2거부] OK');
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
