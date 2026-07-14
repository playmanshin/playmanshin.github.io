// v7 스모크: 저장/이어하기, 봉인 3택1, 명복, 음소거, 튜토리얼 훅
const fs=require('fs');
const noop=()=>{};
const ctxStub=new Proxy({},{get:(t,p)=>{if(p==='createLinearGradient'||p==='createRadialGradient')return()=>({addColorStop:noop});return noop;},set:()=>true});
function mkEl(){return {classList:{add:noop,remove:noop,toggle:noop},style:{},textContent:'',innerHTML:'',disabled:false,addEventListener:noop,appendChild:noop,isConnected:false,width:0,height:0,tabIndex:0,setAttribute:noop,getContext:()=>ctxStub,getBoundingClientRect:()=>({left:0,top:0,width:360,height:640})};}
const els={}; const store=new Map();
global.document={getElementById:id=>els[id]||(els[id]=mkEl()),createElement:()=>mkEl()};
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
    // 셋업
    party=[{sp:'bari',lv:1,wh:0}];
    deck=[]; relics=['salt']; tokens=['yeot']; uidSeq=1;
    for(let i=0;i<7;i++)addCard('bujeok');
    teamMax=80; teamHP=44; act=1; depth=8; coins=77; sinwi=3; gongdeok=5;
    genMap();
    // 저장/복원 라운드트립
    saveRun();
    const snap={hp:teamHP,coins,deckN:deck.length,act,tok:tokens.join()};
    teamHP=1; coins=0; deck=[]; tokens=[]; act=0;
    const ok=loadRun();
    console.log('[저장] load='+ok);
    assert.equal(ok,true); assert.equal(teamHP,snap.hp); assert.equal(coins,snap.coins); assert.equal(deck.length,snap.deckN); assert.equal(tokens.join(),snap.tok);
    // 봉인 풀킷 + 출전 슬롯 규칙 (v9)
    const before=deck.length;
    const slotFree=activeGhostCount()<2;
    party.push({sp:'cheonyeo',lv:1,wh:2,active:slotFree});
    SPIRITS.cheonyeo.cards.forEach(c=>addCard(c,'cheonyeo'));
    console.log('[봉인풀킷] 카드 +'+(deck.length-before)+' 출전='+slotFree);
    assert.equal(deck.length-before,3); assert.equal(slotFree,true);
    // 명복: 다음 전투 축복 — 난이도 프로필별 수치 검증
    assert.equal(DIFF.story.blessBlock,8); assert.equal(DIFF.story.blessStr,1);
    assert.equal(DIFF.bongut.blessBlock,6); assert.equal(DIFF.bongut.blessStr,0);
    diffMode='bongut';
    nextBless=true;
    startBattle('mulgwisin');
    await sleep(1000);
    console.log('[명복] block='+player.block+' str='+player.str);
    assert.ok(player.block>=dprof().blessBlock); assert.equal(nextBless,false);
    inBattle=false; stopDrone();
    // 음소거 무예외
    muted=true; snd.gong(); snd.jingle(); startDrone();
    console.log('[음소거] tone/드론 무예외');
    // 튜토리얼 훅 존재
    console.log('[튜토리얼] tutStep 정의='+(typeof tutStep!=='undefined'));
    // 패배 시 저장 삭제
    inBattle=true; enemy={rev:false,sp:'dalgyal'}; player.revive=false;
    defeat();
    assert.equal(localStorage.getItem('ms_run'),null);
    console.log('[삭제] OK');
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
