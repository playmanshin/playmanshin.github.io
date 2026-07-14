// v10 스모크: 지도 2탭, 의도 상세, 무구 접기, 구미호 2페이즈 아트, 태그
const fs=require('fs');
const noop=()=>{};
const ctxStub=new Proxy({},{get:(t,p)=>{if(p==='createLinearGradient'||p==='createRadialGradient')return()=>({addColorStop:noop});return noop;},set:()=>true});
function mkEl(){const el={classList:{_s:new Set(),add(c){this._s.add(c)},remove(c){this._s.delete(c)},toggle:noop,contains(c){return this._s.has(c)}},style:{},textContent:'',innerHTML:'',disabled:false,addEventListener:noop,appendChild:noop,prepend:noop,remove:noop,isConnected:false,width:0,height:0,tabIndex:0,setAttribute:noop,getContext:()=>ctxStub,getBoundingClientRect:()=>({left:0,top:0,width:360,height:640,bottom:640})};return el;}
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
    party=[{sp:'janggun',lv:1,wh:0,active:true}];
    deck=[]; relics=[]; tokens=[]; pendingHaewon=[]; boons=[]; uidSeq=1;
    for(let i=0;i<6;i++)addCard('bujeok');
    teamMax=80; teamHP=80; act=0; depth=0; coins=50;
    genMap();
    // 지도 2탭: 첫 탭 = 선택, 둘째 탭 = 확정(전투 시작)
    mapNodeEls=mapRows.map(r=>r.map(()=>mkishBtn()));
    function mkishBtn(){return document.createElement('button');}
    mapNodeTap(0,0);
    console.log('[지도2탭] 첫 탭 선택='+(mapSel?mapSel.r+','+mapSel.i:'없음'));
    assert.ok(mapSel&&mapSel.r===0&&mapSel.i===0); assert.equal(inBattle,false);
    mapNodeTap(0,0);
    await sleep(1000);
    console.log('[지도2탭] 둘째 탭 전투='+inBattle);
    assert.equal(inBattle,true);
    // 후손 집합
    const ds=descendantSet(0,0);
    console.log('[경로집합] 후손 수='+ds.size);
    assert.ok(ds.size>=mapRows.length,'시작 노드에서 모든 행에 닿아야 한다');
    // 의도 상세 — 무작위 적의 첫 수가 공격이 아닐 수 있으므로 패턴을 고정해 결정적으로 검증
    enemy.hp=500; enemy.max=500; enemy.weak=1;
    enemy.pat=[{a:8,h:2}]; enemy.pi=0;
    const d=intentDetail();
    console.log('[의도상세] 길이='+d.length);
    assert.ok(d.length>10); assert.ok(d.includes('예상')||d.includes('약화'));
    // 노드 요약 (변종·판효과 포함)
    const fakeNode={t:'battle',enemy:{sp:'cheonyeo',variant:'old'},field:'bloodmoon'};
    const sum=nodeSummary(fakeNode);
    console.log('[노드요약] OK 검증');
    assert.ok(sum.includes('처녀귀신')); assert.ok(sum.includes('묵음')); assert.ok(sum.includes('핏빛'));
    inBattle=false; stopDrone();
    // 무구 접기: 5개 → 최근 3 + 요약 칩
    relics=['salt','mirrorR','gutsang','jipsin','inju']; tokens=['yeot'];
    renderRelics(); openGear();
    console.log('[무구접기] 무예외');
    assert.equal(relics.length,5); assert.equal(tokens.length,1);
    // 구미호 2페이즈 아트 (전역 enemy 참조 경로)
    const g=new Proxy({},{get:(t,p)=>{if(p==='createLinearGradient')return()=>({addColorStop:()=>{}});return ()=>{};},set:()=>true});
    enemy={sp:'gumiho',phase2:false}; ART.gumiho(g,1.0);
    enemy={sp:'gumiho',phase2:true}; ART.gumiho(g,1.0);
    enemy=null; ART.gumiho(g,1.0);
    console.log('[구미호 2페이즈] 세 상태 모두 무예외');
    // 성향 태그
    assert.equal(typeof STARTER_TAGS,'object'); assert.equal(STARTER_TAGS.janggun[0],'공격');
    console.log('[태그] OK');
    // 한자 노드 아이콘
    assert.equal(NODE_META.battle[0],'鬼'); assert.equal(NODE_META.elite[0],'凶'); assert.equal(NODE_META.boss[0],'門');
    console.log('[아이콘] OK');
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
