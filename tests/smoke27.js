// P2 스모크 (v0.10): 동행(적립·벤치 보존·신기/굿거리 성숙·개전 예산 연동·저장 왕복)·점괘 이지선다·합굿 도감
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
    const G=(sp,act)=>({sp,lv:1,wh:0,active:act!==false});
    // ---- 1) 동행 적립 — 출전만, 벤치 보존 ----
    party=[G('janggun'),G('cheonyeo'),G('yeommae'),G('dokkaebi',false)];
    deck=[]; relics=[]; tokens=[]; uidSeq=1; boons=[];
    let msgs=accrueBond();
    assert.equal(party[1].bond,1,'출전 귀신 적립');
    assert.equal(party[2].bond,1);
    assert.equal(party[3].bond||0,0,'대기 귀신은 미적립');
    assert.ok(msgs.some(s=>s.includes('동행(同行)')),'첫 적립 = 온보딩 설명 (v10.14 시퀀서)');
    assert.equal(hasLearn('donghaeng'),true,'동행 학습 기록');
    msgs=accrueBond();
    assert.equal(msgs.length,0,'학습 후 임계 전에는 무음');
    party[1].bond=1; party[2].bond=1;   // 임계 테스트를 위해 되감기
    party[1].bond=2;
    msgs=accrueBond();
    assert.equal(party[1].bond,3);
    assert.ok(msgs.some(s=>s.includes('정이 들었다')),'동행 3 임계 안내');
    party[1].bond=5;
    msgs=accrueBond();
    assert.ok(msgs.some(s=>s.includes('무르익었다')),'동행 6 임계 안내');
    console.log('[동행] 적립·벤치 보존·임계 안내 OK');
    // ---- 2) 동행 3: 주축 소합급 개전 보너스 + 개전 恨 예산 연동 ----
    // 처녀(恨, bond6)+염매(恨, bond0) — 대합 恨4 + 동행 恨2 = 6 (예산 내 정확)
    party=[G('janggun'),Object.assign(G('cheonyeo'),{bond:6}),G('yeommae')];
    deck=[]; for(let i=0;i<8;i++)addCard('bujeok');
    teamMax=80; teamHP=80; act=0; depth=0; coins=0;
    genMap();
    startBattle('gaekgwi'); await sleep(950);
    assert.equal(enemy.han,6,'대합 4 + 동행 2 = 6');
    inBattle=false; stopDrone();
    // 예산 초과 시나리오: 길잡이2 + 대합4 + 동행2 시도 → 6 클램프
    party=[G('bari'),Object.assign(G('cheonyeo'),{bond:3}),G('imugi')];
    boons=['giljabi'];
    deck=[]; for(let i=0;i<8;i++)addCard('bujeok');
    startBattle('gaekgwi'); await sleep(950);
    assert.equal(enemy.han,6,'동행 포함 모든 개전 恨이 예산 6 공유');
    boons=[];
    inBattle=false; stopDrone();
    // 방어 축 동행: 어둑시니 bond3 → 개전 방어 +3 (이월 캡 12 불변식 무간섭)
    party=[G('janggun'),Object.assign(G('eoduksini'),{bond:3}),G('dokkaebi')];
    deck=[]; for(let i=0;i<8;i++)addCard('bujeok');
    startBattle('gaekgwi'); await sleep(950);
    assert.equal(player.block,3,'동행 방어 +3');
    inBattle=false; stopDrone();
    // 동티 축 동행: 허깨비 bond3 → 개전 동티 1장 (염매 듀엣과 별개 적층)
    party=[G('janggun'),Object.assign(G('heokkaebi'),{bond:3}),G('yeommae')];
    deck=[]; for(let i=0;i<8;i++)addCard('bujeok');
    startBattle('gaekgwi'); await sleep(950);
    assert.equal(discard.filter(c=>c.id==='dongti').length,2,'저주받이 듀엣 1 + 동행 1');
    inBattle=false; stopDrone();
    console.log('[동행3] 주축 개전 보너스·예산 클램프·듀엣 적층 OK');
    // ---- 3) 동행 6: 굿거리 성숙 ×1.25 반올림 (타수 불변, 듀엣 위에 얹힘) ----
    party=[G('janggun'),Object.assign(G('cheonyeo'),{bond:6}),G('songaksi')];
    assert.equal(gutFxOf('cheonyeo').fx.dot,8,'곡성 6 → 성숙 8 (듀엣 없음)');
    party=[G('janggun'),Object.assign(G('cheonyeo'),{bond:6}),Object.assign(G('mongdal'),{bond:6})];
    assert.equal(gutFxOf('cheonyeo').fx.dot,11,'사혼 9 → 성숙 round(11.25)=11 (듀엣 위에 중첩)');
    assert.ok(gutFxOf('cheonyeo').note.includes('恨 +11'),'노트 수치 = 최종 fx (표시=실제 파리티)');
    party=[G('janggun'),Object.assign(G('songaksi'),{bond:6})];
    assert.equal(gutFxOf('songaksi').fx.hits,4,'천침 타수 불변 — 다단×배율 금지');
    assert.equal(gutFxOf('songaksi').fx.dmg,4,'천침 타당 3 → 4');
    party=[G('janggun'),G('songaksi')];
    assert.equal(gutFxOf('songaksi').fx.dmg,3,'동행 미달 — 기본값');
    // 적대 검증 회귀: 신력은 성숙 제외(자원 루프 채널), round는 +25% 상한 준수, 이진 굿은 성숙 표시 없음
    party=[Object.assign(G('chilseong'),{}),Object.assign(G('dalgyal'),{bond:6})];
    const dg=gutFxOf('dalgyal');
    assert.equal(dg.fx.energy,1,'무면 신력 성숙 제외 — 1 유지');
    assert.equal(dg.fx.draw,5,'듀엣 4 → 성숙 5');
    assert.ok(dg.note.includes('드로우 5'),'듀엣 노트도 성숙 수치 반영');
    party=[G('janggun'),Object.assign(G('mongdal'),{bond:6})];
    assert.equal(gutFxOf('mongdal').fx.strDown,1,'대곡 힘감 1 → round(1.25)=1 (배증 금지)');
    party=[G('janggun'),Object.assign(G('dokkaebi'),{bond:6})];
    assert.equal(gutFxOf('dokkaebi').note,null,'이진 굿(씨름)은 성숙 무보상 — 거짓 표기 없음');
    assert.equal(gutFxOf('dokkaebi').fx.skipTurn,true);
    party=[G('janggun'),Object.assign(G('jeoseungsaja'),{bond:6})];
    assert.equal(gutFxOf('jeoseungsaja').fx.pctDmg,0.25,'명부 집행 성숙 0.2→0.25 (상한 18 유지)');
    console.log('[동행6] 굿거리 성숙(round·신력 제외·노트 파리티·이진 무보상) OK');
    // ---- 4) 동행 저장 왕복 + runStats bonds ----
    party=[G('janggun'),Object.assign(G('cheonyeo'),{bond:4})];
    deck=[]; addCard('bujeok');
    genMap(); mapPos=-1; mapCur=0;
    initRunStats();
    saveRun();
    party=[];
    assert.equal(loadRun(),true);
    assert.equal(party[1].bond,4,'bond 저장 왕복 (mapVersion 불변)');
    rsFinal();
    assert.ok(runStats.final.bonds.includes('cheonyeo:4'),'runStats 동행 분포');
    console.log('[저장] bond 왕복·계측 OK');
    // ---- 5) 점괘 이지선다 ----
    party=[G('janggun')];
    deck=[]; for(let i=0;i<8;i++)addCard('bujeok');
    startBattle('gaekgwi'); await sleep(950);
    enemy.hp=500; enemy.max=500;
    // 파묻기: 덱탑 3장이 버린 더미로
    hand.length=0; energy=3;
    drawPile=[{uid:9001,id:'bujeok',owner:null},{uid:9002,id:'bangul',owner:null},{uid:9003,id:'sinkal',owner:null},{uid:9004,id:'geumjul',owner:null}];
    const disc0=discard.length;
    const jg={uid:uidSeq++,id:'jeomgwae',owner:null}; hand.push(jg);
    let p=playCard(jg,null);
    for(let i=0;i<40&&!scryResolver;i++)await sleep(30);   // 연출 sleep 뒤 선택창이 열릴 때까지 폴링
    assert.ok(scryResolver,'선택 대기 중');
    resolveScry(true);
    await p;
    // 파묻은 3장(geumjul,sinkal,bangul) + 낸 점괘 자신 = 버린 더미 +4, 드로우는 새 덱탑(bujeok 9001)
    assert.equal(discard.length-disc0,4,'덱탑 3장 파묻힘 + 점괘 자신');
    assert.ok(discard.some(c=>c.uid===9004)&&discard.some(c=>c.uid===9003)&&discard.some(c=>c.uid===9002),'파묻힌 카드 정확');
    assert.ok(hand.some(c=>c.uid===9001),'파묻은 뒤 새 덱탑에서 드로우');
    // 유지: 덱 순서 보존
    hand.length=0; energy=3;
    drawPile=[{uid:9101,id:'bujeok',owner:null},{uid:9102,id:'bangul',owner:null}];
    const jg2={uid:uidSeq++,id:'jeomgwae',owner:null}; hand.push(jg2);
    p=playCard(jg2,null);
    for(let i=0;i<40&&!scryResolver;i++)await sleep(30);
    resolveScry(false); await p;
    assert.ok(hand.some(c=>c.uid===9102),'유지 시 원래 덱탑에서 드로우');
    assert.equal(drawPile.length,1,'나머지 순서 보존');
    // 빈 덱: 선택 없이 진행 (행 멈춤 없음)
    hand.length=0; energy=3; drawPile=[]; discard=[];
    const jg3={uid:uidSeq++,id:'jeomgwae',owner:null}; hand.push(jg3);
    await playCard(jg3,null);
    assert.equal(scryResolver,null,'빈 덱 — 선택 미발생');
    // hideAll 보험: 대기 중 강제 닫힘이 행 멈춤을 만들지 않는다 (적대 검증 회귀)
    hand.length=0; energy=3;
    drawPile=[{uid:9201,id:'bujeok',owner:null}];
    const jg4={uid:uidSeq++,id:'jeomgwae',owner:null}; hand.push(jg4);
    p=playCard(jg4,null);
    for(let i=0;i<40&&!scryResolver;i++)await sleep(30);
    assert.ok(scryResolver,'선택 대기 진입');
    hideAll();
    assert.equal(scryResolver,null,'hideAll이 유지로 자동 응답');
    await p;
    assert.equal(busy,false,'playCard 정상 종료 — busy 해제');
    inBattle=false; stopDrone();
    console.log('[점괘] 파묻기·유지·빈 덱·hideAll 보험 OK');
    // ---- 6) 합굿 도감 ----
    localStorage.removeItem('ms_duet');
    party=[G('janggun'),G('cheonyeo'),G('yeommae'),G('dokkaebi',false)];
    let rec=recordDuets();
    assert.equal(rec.total,2,'출전 2조합 기록 (대기 제외)');
    assert.equal(rec.fresh,2,'첫 기록');
    rec=recordDuets();
    assert.equal(rec.fresh,0,'재클리어는 새 인연 아님');
    const dd=JSON.parse(localStorage.getItem('ms_duet'));
    assert.equal(dd['janggun:cheonyeo'],1,'금제0 클리어 = 1');
    localStorage.setItem('ms_geumje','2');
    recordDuets();
    assert.equal(JSON.parse(localStorage.getItem('ms_duet'))['janggun:cheonyeo'],3,'상위 금제로 갱신');
    localStorage.setItem('ms_geumje','0');
    recordDuets();
    assert.equal(JSON.parse(localStorage.getItem('ms_duet'))['janggun:cheonyeo'],3,'하위 클리어로 후퇴하지 않음');
    // 손상 저장 자가 복구 (적대 검증 회귀)
    localStorage.setItem('ms_duet','{');
    rec=recordDuets();
    assert.equal(rec.total,2,'손상 JSON — 리셋 후 이번 기록은 살린다');
    assert.equal(JSON.parse(localStorage.getItem('ms_duet'))['janggun:cheonyeo'],1,'다음 승리부터 정상 누적');
    console.log('[도감] 조합 기록·금제 최고치·후퇴 방지·손상 복구 OK');
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
