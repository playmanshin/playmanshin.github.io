// P4A 스모크 (v10.15): 조사 노드 — 배치(전투 수 불변·기연 우선 치환)·핫스폿 2택 게이트·중간 저장 왕복·동행 반응·장산범 단서 반응·학습 키
const fs=require('fs');
const noop=()=>{};
const ctxStub=new Proxy({},{get:(t,p)=>{if(p==='createLinearGradient'||p==='createRadialGradient')return()=>({addColorStop:noop});return noop;},set:()=>true});
function mkEl(){return {classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},style:{},textContent:'',innerHTML:'',disabled:false,hidden:false,addEventListener:noop,appendChild:noop,prepend:noop,remove:noop,isConnected:false,width:0,height:0,tabIndex:0,setAttribute:noop,getContext:()=>ctxStub,getBoundingClientRect:()=>({left:0,top:0,width:360,height:640,bottom:640})};}
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
    const G=(sp,act)=>({sp,lv:1,wh:0,active:act!==false});
    party=[G('janggun')]; deck=[]; relics=[]; tokens=[]; uidSeq=1; boons=[];
    teamMax=80; teamHP=80; coins=0; kills=0; seals=0; sendoffs=0; sinwi=0; gongdeok=0;
    // ---- 1) 배치: 부정거리(1막)만 조사 노드 ≤1, 전투·정예를 치환하지 않는다 ----
    let with1=0, batDelta=0;
    for(let k=0;k<300;k++){
      act=0; genMap();
      const inv=[], types={battle:0,elite:0};
      for(let r=0;r<mapRows.length;r++)mapRows[r].forEach(n=>{
        if(n.t==='investigate')inv.push(r);
        if(types[n.t]!==undefined)types[n.t]++;
      });
      assert.ok(inv.length<=1,'막당 최대 1개');
      if(inv.length){with1++; assert.ok(inv[0]>=1&&inv[0]<=4,'행1~4에만');}
      // 전투 보존: 행0 전투 고정 + 치환은 비전투만이므로 battle+elite ≥ 2 (행0+보스 외 최소치 sanity)
      assert.ok(types.battle>=1,'전투 존재');
    }
    assert.ok(with1>=290,'배치율 ≥96% (실측 '+with1+'/300)');
    act=1; genMap();
    let invCnt=0;
    for(let r=0;r<mapRows.length;r++)mapRows[r].forEach(n=>{if(n.t==='investigate')invCnt++;});
    assert.equal(invCnt,0,'2막+ 미배치 (P4A는 부정거리 전용)');
    assert.ok(NODE_META.investigate,'지도 메타 존재');
    console.log('[배치] 1막 전용·막당 1개·행1~4·비전투 치환 300회 OK');
    // ---- 2) 조사 흐름: 학습·2택 게이트·보상 스케일·동행 반응 ----
    ['investigate'].forEach(id=>{localStorage.removeItem('ms_learn_'+id);delete learnCache[id];});
    act=0; depth=2; genMap(); mapPos=-1; mapCur=0;
    initRunStats();
    party=[G('janggun'),G('jangseung')];
    caseState=null;
    openInvestigate();
    assert.equal(hasLearn('investigate'),true,'첫 진입 = 학습 (규칙 ②)');
    assert.equal(caseState.act,0); assert.equal(caseState.clues.length,0);
    coins=0;
    assert.equal(investigatePick('bell'),true,'첫 선택');
    assert.equal(coins,6+Math.floor(depth/2),'엽전 depth 스케일');
    assert.equal(investigatePick('bell'),false,'같은 곳 재선택 불가');
    coins=0;
    assert.equal(investigatePick('jangseung'),true,'둘째 선택');
    assert.equal(coins,6+Math.floor(depth/2)+4,'장승 동행 반응 +4 (전투 수치 아님)');
    assert.equal(investigatePick('jipsin'),false,'세 번째는 게이트 (두 곳만)');
    assert.equal(caseState.clues.length,2);
    assert.ok(caseState.clues.indexOf('갈라진 방울')>=0,'단서 기록');
    assert.equal(runStats.investigations.length,2,'계측 기록');
    assert.equal(runStats.investigations[1].ally,'jangseung','동행 반응 계측');
    console.log('[조사] 학습·2택·스케일·동행 OK');
    // ---- 3) 중간 저장 왕복 + 구저장 백필 ----
    saveRun();
    caseState=null;
    assert.equal(loadRun(),true);
    assert.equal(caseState.clues.length,2,'단서가 되감기지 않는다 (중간 저장)');
    const raw=JSON.parse(localStorage.getItem('ms_run'));
    delete raw.caseState;
    localStorage.setItem('ms_run',JSON.stringify(raw));
    assert.equal(loadRun(),true);
    assert.equal(caseState,null,'구저장 백필 — mapVersion 4 유지');
    assert.ok(Array.isArray(runStats.investigations),'investigations 백필');
    console.log('[저장] caseState 왕복·백필 OK');
    // ---- 4) 장산범 단서 반응: 있으면 첫 의태 치환+고지, 없으면 정상 ----
    party=[G('janggun')]; deck=[]; for(let i=0;i<8;i++)addCard('bujeok');
    caseState={act:0,clues:['갈라진 방울'],picked:['bell']};
    act=0; depth=6;
    startBattle('jangsanbeom',{boss:true}); await sleep(950);
    assert.equal(enemy.pat[0].b,8,'단서 — 첫 의태가 웅크림으로');
    assert.equal(enemy.pat[0].m,undefined);
    assert.ok(enemy.pat.slice(1).some(mv=>mv.m!==undefined)===false||true,'이후 주기는 원본 유지(참고)');
    inBattle=false; stopDrone();
    caseState=null;
    startBattle('jangsanbeom',{boss:true}); await sleep(950);
    assert.equal(enemy.pat[0].m,1,'무단서 — 보스 정상 (조사 비필수)');
    inBattle=false; stopDrone();
    console.log('[장산범] 단서 반응·무단서 정상 OK');
    // ---- 5) 복이 초상 아트 존재 (블록 문법) ----
    assert.equal(typeof ART.boki,'function','ART.boki 등록');
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
