// 온보딩 시퀀서 스모크 (v10.14) — P3 완료 조건: 학습 전 예고 숨김·효과=설명 동시·팁/해금 분리·기학습 소급·안내 런 난이도 비영구·표기 계약
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
    // ---- 1) 신규 플레이어: 학습 전 예고 UI 전부 숨김 (완료 조건 1) ----
    assert.equal(hasLearn('hap'),false); assert.equal(hasLearn('chiseong'),false);
    assert.equal(hasLearn('donghaeng'),false); assert.equal(hasLearn('meta'),false);
    assert.equal(axChipsTxt('pat'),'','축 라벨 숨김');
    assert.equal(rarMark('pitgap'),'','희귀도 별 숨김');
    party=[G('janggun'),G('samokgu')];
    const dv=cardVals({id:'saja1'});
    assert.equal(dv._duetOn,true,'듀엣 자체는 작동 (효과 은닉 아님)');
    party=[G('janggun')];
    const dormant=cardDesc(cardVals({id:'saja1'}),false,CARDS.saja1);
    assert.ok(!dormant.includes('합(대기)'),'휴면 듀엣 절은 학습 전 미표기');
    console.log('[숨김] 축·희귀도·휴면 듀엣 예고 게이트 OK');
    // ---- 2) 효과가 설명보다 먼저 발동하지 않음 (완료 조건 2) — 첫 합 발동 = 학습 ----
    party=[G('janggun'),G('cheonyeo'),G('yeommae')];
    deck=[]; relics=[]; tokens=[]; uidSeq=1; boons=[];
    for(let i=0;i<8;i++)addCard('bujeok');
    teamMax=80; teamHP=80; act=0; depth=0; coins=0;
    genMap();
    startBattle('gaekgwi'); await sleep(950);
    assert.equal(enemy.han,4,'대합 효과 발동');
    assert.equal(hasLearn('hap'),true,'발동과 동시에 학습 기록 (인과 보장)');
    assert.ok(axChipsTxt('pat').length>0,'학습 후 축 라벨 공개');
    inBattle=false; stopDrone();
    // 듀엣 활성 절은 학습과 무관하게 항상 표기 (카드 위 설명 = 효과의 설명)
    party=[G('janggun'),G('samokgu')];
    localStorage.removeItem('ms_learn_hap'); delete learnCache['hap'];
    const activeDesc=cardDesc(cardVals({id:'saja1'}),false,CARDS.saja1);
    assert.ok(activeDesc.includes('「합」'),'활성 듀엣 절은 학습 전에도 카드에 표기');
    console.log('[인과] 합 발동=학습 동시·활성 듀엣 상시 표기 OK');
    // ---- 3) 치성: 첫 승리엔 없고 첫 당산목에서 공개 (완료 조건 6) ----
    assert.equal(hasLearn('chiseong'),false,'첫 승리 시점 — 치성 미학습(보상에서 숨김)');
    openRest();
    assert.equal(hasLearn('chiseong'),true,'첫 당산목 — 치성 공개');
    console.log('[치성] 당산목 공개 게이트 OK');
    // ---- 4) 팁 초기화 ≠ 해금 초기화 / 이어하기 유지 (완료 조건 3·4) ----
    resetTips();
    assert.equal(hasLearn('chiseong'),true,'팁 초기화가 해금을 되돌리지 않는다');
    assert.equal(hasLearn('hap'),false,'미학습 항목은 그대로 미학습');
    party=[G('janggun')]; deck=[]; addCard('bujeok');
    genMap(); mapPos=-1; mapCur=0; initRunStats();
    saveRun();
    assert.equal(loadRun(),true);
    assert.equal(hasLearn('chiseong'),true,'이어하기 후 온보딩 단계 복구 (메타 귀속)');
    console.log('[분리/복구] 팁·해금 분리, 이어하기 유지 OK');
    // ---- 5) 안내 런 = 이야기, 설정 비영구 (완료 조건 7) ----
    localStorage.removeItem('ms_run');
    localStorage.setItem('ms_diff','bongut');
    beginGuidedRun();
    assert.equal(diffMode,'story','안내 런은 이야기 난이도');
    assert.equal(localStorage.getItem('ms_diff'),'bongut','저장된 취향은 불변');
    showTitle();
    assert.equal(diffMode,'bongut','타이틀 복귀 시 원 난이도 복원');
    console.log('[안내런] 이야기 적용·비영구·복원 OK');
    // ---- 6) 기학습자 소급 (규칙 ③) — 1회성 마이그레이션 ----
    ['chiseong','donghaeng','hap','meta'].forEach(id=>{localStorage.removeItem('ms_learn_'+id);delete learnCache[id];});
    localStorage.setItem('ms_wins','1');
    localStorage.removeItem('ms_learn_seeded');   // 업데이트 직후 최초 실행 재현
    seedLearnsForVeterans();
    ['chiseong','donghaeng','hap','meta'].forEach(id=>assert.equal(hasLearn(id),true,'소급: '+id));
    // 적대 검증 회귀: 마커가 있으면 재시딩 금지 — 신규 플레이어가 리로드로 시퀀서를 무력화할 수 없다
    ['chiseong','donghaeng','hap','meta'].forEach(id=>{localStorage.removeItem('ms_learn_'+id);delete learnCache[id];});
    localStorage.setItem('ms_wins','0');
    localStorage.setItem('ms_run','{"fake":1}');   // 새 굿 저장 후 리로드 상황
    seedLearnsForVeterans();
    assert.equal(hasLearn('chiseong'),false,'마커 이후 리로드 — 재시딩 없음 (시퀀서 유지)');
    localStorage.removeItem('ms_run');
    console.log('[소급] 1회성 마이그레이션·리로드 무력화 차단 OK');
    // ---- 6-1) 굿거리 듀엣 첫 발동 = 합 학습 (제3의 트리거) ----
    party=[G('samsinhalmi'),G('gaekgwi')];
    deck=[]; for(let i=0;i<8;i++)addCard('bujeok');
    teamMax=80; teamHP=60;
    genMap();
    startBattle('jangseung'); await sleep(950);
    enemy.hp=500; enemy.max=500;
    assert.equal(hasLearn('hap'),false,'객귀 engine ≠ 삼신 heal — 합 미발동, 미학습');
    setChannel('gaekgwi',true);
    sinmyeong=5; gutCastTurn=false; busy=false;
    await castGut();
    assert.equal(hasLearn('hap'),true,'굿거리 듀엣(제삿밥) 첫 발동 = 학습');
    inBattle=false; stopDrone();
    console.log('[굿듀엣 학습] 발동=설명 인과 OK');
    // ---- 6-2) 정예 드래프트 부제 — meta 학습 전 ★ 참조 금지 ----
    localStorage.removeItem('ms_learn_meta'); delete learnCache['meta'];
    enemy={sp:'dokkaebi',elite:true}; inBattle=false;
    initRunStats();
    showDraft();
    assert.ok(!document.getElementById('draftSub').textContent.includes('★'),'학습 전 부제에 ★ 없음');
    console.log('[드래프트 부제] 매달린 ★ 참조 제거 OK');
    // ---- 7) 소스 계약: 몸주신 3+3(전원 선택 가능)·怨/恨 표기·카드 확대 z (완료 조건 5·8) ----
    const html=require('fs').readFileSync(__dirname+'/../index.html','utf8');
    assert.ok(html.includes('다른 몸주신을 살펴본다'),'접힌 3위 진입로 존재');
    assert.ok(/STARTERS\\.forEach\\(\\(sp,si\\)=>/.test(html),'6위 전원 렌더 (선택권 유지)');
    assert.ok(html.includes('怨 원한'),'신단 원한 = 怨 글리프');
    assert.ok(/add\\('恨 '\\+o\\.han,'#b48fe0'\\)/.test(html),'전투 恨 = 보라 고정');
    assert.ok(/#handArea\\{[^}]*z-index:12/.test(html),'확대 카드가 판단 스트립 위 (v10.14)');
    console.log('[계약] 3+3·표기·카드 z OK');
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
