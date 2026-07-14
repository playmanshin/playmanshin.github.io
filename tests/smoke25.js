// 듀엣·합(合) 스모크 (v0.9): 카드 듀엣 8건(cardVals 경유)·굿거리 듀엣 4건·오라 확장·개전 동티·합 보너스·개전 恨 공유 예산 6
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
    // ---- 1) 카드 듀엣 8건 — cardVals 단일 경유 (표시=실제 파리티 자동) ----
    deck=[]; relics=[]; tokens=[]; uidSeq=1; boons=[];
    party=[G('janggun'),G('cheonyeo'),G('samokgu'),G('yagwanggwi'),G('dalgyal'),G('jangseung'),G('dokkaebi')];
    let v;
    v=cardVals({id:'songak3'}); assert.equal(v.dot,4,'원한의 혼례: 처녀 동행 恨+4'); assert.equal(v._duetOn,true);
    v=cardVals({id:'saja1'});   assert.equal(v.dmg,17,'명부 호명: 삼목구 동행 +4');
    v=cardVals({id:'eoduk2'});  assert.equal(v.cost,0,'야습: 야광귀 동행 0코');
    v=cardVals({id:'gaek2'});   assert.equal(v.draw,3); assert.equal(v.block,3,'구걸: 달걀 동행');
    v=cardVals({id:'dueok2'});  assert.equal(v.firstHit,4,'광란: 장군 몸주 첫 타 +4 (타수 증가 금지 원칙)');
    v=cardVals({id:'bul3'});    assert.equal(v.str,1,'우걱우걱: 장승 동행 힘+1');
    v=cardVals({id:'yagwang1'});assert.equal(v.dmg,7,'신발 훔치기: 도깨비 동행 7');
    party=[G('yongsin')];
    v=cardVals({id:'imu3'});    assert.equal(v.selfDmg,0); assert.equal(v.dmg,17,'승천 발버둥: 용신 몸주');
    party=[G('sansin')];
    v=cardVals({id:'saja1'});   assert.equal(v.dmg,13,'듀엣 조건 미충족 — 기본값'); assert.equal(v._duetOn,false);
    assert.ok(v._duet,'대기 중에도 합 조건은 카드에 표기');
    console.log('[듀엣] 카드 8건 on/off·파리티 경유 OK');
    // ---- 2) firstHit 전투 반영 ----
    party=[G('janggun'),G('dueoksini')];
    deck=[]; for(let i=0;i<8;i++)addCard('bujeok');
    teamMax=80; teamHP=80; act=0; depth=0; coins=0;
    genMap();
    startBattle('gaekgwi');
    await sleep(950);
    enemy.hp=500; enemy.max=500; player.str=0;
    assert.equal(player.nextAtk,3,'장군×두억시니 소합(힘 축) — 개전 공수 +3');
    player.nextAtk=0;   // 광란 자체 검증을 위해 소합 공수는 소거
    const dk={uid:uidSeq++,id:'dueok2',owner:null}; hand.push(dk); energy=3;
    const e0=enemy.hp;
    await playCard(dk,null);
    assert.equal(e0-enemy.hp,14,'광란: (5+4)+5 — 첫 타만 +4');
    console.log('[광란] 첫 타 가산 전투 반영·소합 공수 확인 OK');
    inBattle=false; stopDrone();
    // ---- 3) 굿거리 듀엣 4건 (gutFxOf) ----
    party=[G('bari'),G('cheonyeo'),G('mongdal')];
    assert.equal(gutFxOf('cheonyeo').fx.dot,9,'사혼: 곡성 6→9');
    assert.equal(gutFxOf('mongdal').fx.weak,4,'사혼: 대곡 약화 4');
    assert.equal(gutFxOf('mongdal').fx.dot,3,'사혼: 대곡 恨 3');
    assert.equal(gutFxOf('jeoseungsaja').fx.pctDmg,0.25,'바리 몸주: 명부 집행 25%');
    party=[G('samsinhalmi')];
    assert.equal(gutFxOf('gaekgwi').fx.heal,16,'삼신 몸주: 걸신들림 16');
    party=[G('chilseong')];
    assert.equal(gutFxOf('dalgyal').fx.draw,4,'칠성 몸주: 무면 드로 4');
    party=[G('janggun')];
    assert.equal(gutFxOf('cheonyeo').fx.dot,6,'조건 미충족 — 기본 6');
    assert.equal(gutFxOf('cheonyeo').note,null);
    console.log('[굿듀엣] 사혼·저승길·제삿밥·별세기 OK');
    // castGut 실경로: 사혼 곡성 恨 9
    party=[G('bari'),G('cheonyeo'),G('mongdal')];
    deck=[]; for(let i=0;i<8;i++)addCard('bujeok');
    startBattle('gaekgwi');
    await sleep(950);
    enemy.hp=500; enemy.max=500; enemy.han=0;
    setChannel('cheonyeo',true);
    sinmyeong=5; gutCastTurn=false; busy=false;
    await castGut();
    assert.equal(enemy.han,9,'곡성 듀엣 실발동 (바리 hanNoDecay와 무관, 개전 아님 — 예산 미적용)');
    console.log('[castGut] 사혼 곡성 실경로 OK');
    inBattle=false; stopDrone();
    // ---- 4) 오라 확장 #11: 몽달 빙의 × 물귀신 동행 ----
    party=[G('janggun'),G('mongdal'),G('mulgwisin')];
    deck=[]; for(let i=0;i<8;i++)addCard('bujeok');
    startBattle('gaekgwi');
    await sleep(950);
    enemy.hp=500; enemy.max=500;
    setChannel('mongdal',true);
    enemy.weak=0; enemy.pi=0; busy=false;
    await endTurn(); await sleep(300);
    assert.equal(enemy.weak,1,'턴 시작 약화 +1 (곡이 물안개를 부른다)');
    console.log('[오라확장] 몽달×물귀신 OK');
    inBattle=false; stopDrone();
    // ---- 5) 개전 동티 (염매×허깨비) + 합 보너스 + 개전 恨 예산 ----
    party=[G('janggun'),{sp:'yeommae',lv:1,wh:3,active:true},{sp:'heokkaebi',lv:1,wh:1,active:true}];
    deck=[]; for(let i=0;i<8;i++)addCard('bujeok');
    startBattle('gaekgwi');
    await sleep(950);
    assert.equal(discard.filter(c=>c.id==='dongti').length,1,'저주받이 — 개전 동티 1장 (2→1 적대 검토 조정)');
    inBattle=false; stopDrone();
    // 대합 han: 처녀+염매 (둘 다 주축 恨)
    party=[G('janggun'),G('cheonyeo'),G('yeommae')];
    deck=[]; for(let i=0;i<8;i++)addCard('bujeok');
    startBattle('gaekgwi'); await sleep(950);
    assert.equal(enemy.han,4,'대합 恨 +4 (소합 없음 — 장군 주축은 힘)');
    inBattle=false; stopDrone();
    // 예산 6: 길잡이 2 + 대합 4 + 소합 2 → 6에서 클램프
    party=[G('bari'),G('cheonyeo'),G('imugi')];
    boons=['giljabi'];
    deck=[]; for(let i=0;i<8;i++)addCard('bujeok');
    startBattle('gaekgwi'); await sleep(950);
    assert.equal(enemy.han,6,'개전 恨 공유 예산 6 — 카드 0장 자동승 차단 (적대 검토 처방)');
    boons=[];
    inBattle=false; stopDrone();
    // 합 block: 어둑시니+장승 대합 6 + 용신 소합 3
    party=[G('yongsin'),G('eoduksini'),G('jangseung')];
    deck=[]; for(let i=0;i<8;i++)addCard('bujeok');
    startBattle('gaekgwi'); await sleep(950);
    assert.equal(player.block,9,'대합 방어 6 + 소합 방어 3');
    inBattle=false; stopDrone();
    // 합 engine: 달걀+야광귀 대합 드로+1 + 칠성 소합 드로+1
    party=[G('chilseong'),G('dalgyal'),G('yagwanggwi')];
    deck=[]; for(let i=0;i<10;i++)addCard('bujeok');
    startBattle('gaekgwi'); await sleep(950);
    assert.equal(hand.length,7,'개전 드로우 5+2');
    inBattle=false; stopDrone();
    console.log('[합] 대합·소합·개전 예산 6·드로/방어 보너스 OK');
    // 편성 화면 합 예고 렌더 무예외
    openAltar(false);
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
