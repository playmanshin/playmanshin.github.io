// 지도 UX 개편(항상 미리보기·버튼 확정·미래 노드 열람·위험 태그) + runStats 계측 스모크
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
    party=[{sp:'janggun',lv:1,wh:0,active:true}]; deck=[]; relics=[]; tokens=[]; uidSeq=1;
    for(let i=0;i<7;i++)addCard('bujeok');
    teamMax=80; teamHP=80; act=0; depth=0; coins=15;
    kills=0; seals=0; sendoffs=0; sinwi=0; gongdeok=0; boons=[];
    initRunStats();
    genMap();
    mapNodeEls=mapRows.map(r=>r.map(()=>document.createElement('button')));
    // 1) 탭은 언제나 미리보기 — 상태를 바꾸지 않는다
    mapNodeTap(0,0);
    assert.ok(mapSel&&mapSel.r===0&&mapSel.i===0);
    assert.equal(inBattle,false); assert.equal(mapPos,-1);
    mapNodeTap(0,0);                                    // 같은 노드 재탭도 확정 아님
    assert.equal(inBattle,false); assert.equal(mapPos,-1);
    console.log('[미리보기] 재탭 확정 제거 OK');
    // 2) 미래 노드: 미리보기 가능, 확정 불가
    mapNodeTap(2,0);
    assert.ok(mapSel&&mapSel.r===2);
    assert.equal(inBattle,false);
    confirmNode(2,0);                                   // 닿지 않는 곳 — chooseNode 실행 금지
    assert.equal(mapPos,-1); assert.equal(inBattle,false);
    console.log('[미래노드] 열람만 가능 OK');
    // 3) 위험 태그 유도
    const tg=sp=>riskTags(sp);
    assert.ok(tg('jangsanbeom').includes('거울')&&tg('jangsanbeom').includes('성장'));
    assert.ok(tg('jeoseungsaja').includes('관통')&&tg('jeoseungsaja').includes('저주'));
    assert.ok(tg('bulgasari').includes('철갑'));
    assert.ok(tg('songaksi').includes('반사'));
    assert.ok(tg('geusundae').includes('성장'),'escalate → 성장');
    assert.ok(tg('jineegaksi').includes('연타'),'centi → 연타');
    assert.ok(tg('mulgwisin').includes('연타')&&tg('mulgwisin').includes('저주'));
    assert.ok(riskTags('cheonyeo','hungry').includes('흡혈'),'변종 굶주림 → 흡혈');
    console.log('[위험태그] 8종 유도 OK');
    // 4) 확정 버튼 경로로만 chooseNode
    confirmNode(0,0);
    await sleep(1000);
    assert.equal(inBattle,true); assert.equal(mapPos,0);
    assert.equal(Object.values(runStats.paths).reduce((a,b)=>a+b,0),1,'경로 계측 1회');
    console.log('[확정] confirmNode → 전투 OK');
    // 5) 계측 누적 + 저장 라운드트립 (mapVersion 4)
    player.block=0; dmgPlayer(7);
    assert.equal(runStats.dmgTaken>=7,true);
    inBattle=false; healPlayer(5);
    assert.ok(runStats.outHeal>=5,'전투 외 회복 계측');
    inBattle=true;
    runStats.chiseong=2;
    saveRun();
    const snap=JSON.stringify(runStats);
    runStats=null;
    assert.equal(loadRun(),true);
    assert.equal(JSON.stringify(runStats),snap,'runStats 라운드트립');
    console.log('[계측] 저장/복원 OK');
    // 6) 구버전(v3 이하) 저장 폐기
    localStorage.setItem('ms_run',JSON.stringify({mapVersion:3,party:[{sp:'janggun'}],deck:[]}));
    assert.equal(loadRun(),false);
    assert.equal(localStorage.getItem('ms_run'),null);
    console.log('[저장v4] 구버전 폐기 OK');
    inBattle=false; stopDrone();
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
