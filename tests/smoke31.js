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
    // ---- 1) 배치: 부정거리(1막)는 조사 노드 정확 1개 (재추첨 보장), 전투·정예 비치환 ----
    for(let k=0;k<300;k++){
      act=0; genMap();
      const inv=[]; let rest5=false;
      for(let r=0;r<mapRows.length;r++)mapRows[r].forEach(n=>{
        if(n.t==='investigate')inv.push(r);
        if(r===mapRows.length-2&&n.t==='rest')rest5=true;
      });
      assert.equal(inv.length,1,'막당 정확 1개 (재추첨 보장 — Codex 교차 리뷰)');
      assert.ok(inv[0]>=1&&inv[0]<=4,'행1~4에만');
      assert.ok(rest5,'행5 고정 당산목 잔존 (보스 전 회복 접점 보존)');
    }
    // 치환 우선순위 — 순수 함수 직접 검증 (기연 > 장터 > 당산목)
    const fx=[[{t:'battle'}],[{t:'battle'},{t:'rest'}],[{t:'shop'},{t:'battle'}],[{t:'event'},{t:'battle'}],[{t:'battle'}]];
    const tgt=pickInvestigateTarget(fx);
    assert.equal(fx[tgt.r][tgt.i].t,'event','기연 우선 치환');
    assert.equal(pickInvestigateTarget([[{t:'battle'}],[{t:'battle'}],[{t:'battle'}]]),null,'후보 없음 → null');
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
    const patTail=JSON.stringify(enemy.pat.slice(1));
    inBattle=false; stopDrone();
    caseState=null;
    startBattle('jangsanbeom',{boss:true}); await sleep(950);
    assert.equal(enemy.pat[0].m,1,'무단서 — 보스 정상 (조사 비필수)');
    assert.equal(JSON.stringify(enemy.pat.slice(1)),patTail,'이후 주기는 원본과 동일 (deepEqual — 항진식 단언 교체)');
    inBattle=false; stopDrone();
    caseState={act:0,clues:['박힌 흰 털','바뀐 발자국'],picked:['jangseung','jipsin']};
    startBattle('jangsanbeom',{boss:true}); await sleep(950);
    assert.equal(enemy.pat[0].m,1,'방울 없는 단서 2개 — 보스 정상');
    inBattle=false; stopDrone();
    console.log('[장산범] 단서 반응·무단서 정상 OK');
    // ---- 5) 장면 재개: 픽 1회 후 재접속 시 남은 선택권 복구 (Codex 교차 리뷰) ----
    act=0; depth=2; genMap(); mapPos=-1; mapCur=0;
    initRunStats();
    assert.equal(runStats.v,4,'runStats v4 (조사 기록 세대)');
    party=[G('janggun')]; deck=[]; addCard('bujeok');
    caseState=null;
    openInvestigate();
    assert.equal(caseState.open,true,'장면 열림 기록');
    investigatePick('bell');
    saveRun();
    caseState=null; hideAll();
    assert.equal(loadRun(),true);
    assert.equal(caseState.open,true,'재접속 — 장면 복구');
    assert.equal(caseState.picked.length,1,'첫 선택 유지');
    assert.equal(investigatePick('jangseung'),true,'남은 선택권 살아있음 (몰수 없음)');
    caseState.open=false;
    saveRun(); caseState=null;
    assert.equal(loadRun(),true);
    assert.equal(caseState.open,false,'닫힌 장면은 재개하지 않음');
    console.log('[재개] 중간 재접속 선택권 복구 OK');
    // ---- 6) 복이 초상 아트 존재 (블록 문법) ----
    assert.equal(typeof ART.boki,'function','ART.boki 등록');
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
