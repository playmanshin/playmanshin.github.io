// UI/UX 폴리시 스모크: 시작 메뉴 정보 위계·전투 판단 스트립·행동 결합형 튜토리얼·카드 역할 문양
const fs=require('fs');
const noop=()=>{};
const ctxStub=new Proxy({},{get:(t,p)=>{
  if(p==='createLinearGradient'||p==='createRadialGradient')return()=>({addColorStop:noop});
  if(p==='getImageData')return()=>({data:new Uint8ClampedArray(4)});
  return noop;
},set:()=>true});
function mkEl(){
  const classes=new Set(), attrs={};
  return {classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),
      toggle:(x,on)=>{if(on===undefined)on=!classes.has(x);on?classes.add(x):classes.delete(x);return on;},contains:x=>classes.has(x)},
    style:{},textContent:'',innerHTML:'',hidden:false,disabled:false,addEventListener:noop,appendChild:noop,prepend:noop,remove:noop,
    isConnected:false,width:0,height:0,tabIndex:0,setAttribute:(k,v)=>{attrs[k]=String(v);},getAttribute:k=>attrs[k],
    getContext:()=>ctxStub,getBoundingClientRect:()=>({left:0,top:0,width:360,height:640,bottom:640})};
}
const els={}, store=new Map();
global.document={getElementById:id=>els[id]||(els[id]=mkEl()),createElement:()=>mkEl(),createElementNS:()=>mkEl()};
global.window={devicePixelRatio:1};
global.addEventListener=noop;
global.innerWidth=800; global.innerHeight=900;
global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
global.requestAnimationFrame=noop;
const src=fs.readFileSync(__dirname+'/_game.js','utf8');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const test=`
(()=>{
  const assert=require('node:assert/strict');
  try{
    // 1) 시작 메뉴: 설정은 기본 접힘, 첫 행동은 저장 유무에 따라 하나만 primary
    assert.ok(html.includes('id="titleSettings" hidden'),'설정 패널 기본 접힘');
    assert.ok(html.includes('id="btnSettings" aria-expanded="false"'),'설정 공개 버튼');
    localStorage.removeItem('ms_run'); showTitle();
    assert.equal(document.getElementById('btnCont').style.display,'none');
    assert.equal(document.getElementById('btnLearn').classList.contains('primary'),true,'첫 방문은 처음 배우기가 primary');
    localStorage.setItem('ms_run','{}'); showTitle();
    assert.equal(document.getElementById('btnCont').style.display,'block');
    assert.equal(document.getElementById('btnLearn').classList.contains('primary'),false,'저장 시 이어하기만 primary');
    assert.equal(document.getElementById('titleSettings').hidden,true);
    console.log('[시작메뉴] 행동 위계·설정 접기 OK');

    // 2) 전투 판단 스트립: calcIncomingHit 단일 경로 + 다단·방어·관통·은폐·스킵
    localStorage.removeItem('ms_run'); boons=[]; relics=[]; teamHP=80; teamMax=80; dmgTurnAcc=0;
    inBattle=true; player={block:5,str:0,weak:0,han:0,nextAtk:0};
    enemy={hp:30,max:30,str:0,weak:0,field:null,skipTurn:false,pi:0,pat:[{a:8,h:2}]};
    let f=incomingForecast();
    assert.equal(f.per,8); assert.equal(f.total,16); assert.equal(f.guarded,5); assert.equal(f.hpLoss,11);
    enemy.pat=[{a:8,h:2,pc:true}]; f=incomingForecast();
    assert.equal(f.guarded,0); assert.equal(f.hpLoss,16,'관통은 방어 무시');
    enemy.field='moonless'; assert.equal(incomingForecast().kind,'hidden','그믐밤 수치 누설 금지');
    enemy.field=null; enemy.skipTurn=true; assert.equal(incomingForecast().kind,'skip');
    enemy.skipTurn=false; enemy.pat=[{m:1}]; dmgTurnAcc=14; f=incomingForecast();
    assert.equal(f.kind,'mirror'); assert.equal(f.total,14,'거울도 현재 피해 누계 반영');
    console.log('[판단스트립] 표시=실행·다단·관통·은폐·스킵 OK');

    // 3) 스트립 문구: 체력 손실과 전부 막음을 즉시 구분
    enemy.pat=[{a:8,h:2}]; dmgTurnAcc=0; player.block=5; updateCombatLedger();
    assert.equal(document.getElementById('ledgerResult').textContent,'체력 −11');
    assert.ok(document.getElementById('btnEnd').textContent.includes('−11'));
    player.block=20; updateCombatLedger();
    assert.equal(document.getElementById('ledgerResult').textContent,'전부 막음');
    assert.equal(document.getElementById('combatLedger').classList.contains('safe'),true);
    console.log('[판단문구] 위험/안전 구분 OK');

    // 4) 카드 역할은 색만이 아니라 한자 문양과 라벨을 함께 쓴다
    assert.deepEqual(cardVisualKind({}, {dmg:6}),{cls:'attack',mark:'殺',label:'공격'});
    assert.deepEqual(cardVisualKind({}, {block:6}),{cls:'guard',mark:'守',label:'방어'});
    assert.deepEqual(cardVisualKind({}, {heal:3}),{cls:'bless',mark:'生',label:'회복'});
    assert.deepEqual(cardVisualKind({}, {power:{k:'str'}}),{cls:'ritual',mark:'陣',label:'지속'});
    assert.deepEqual(cardVisualKind({curse:true}, {}),{cls:'curse',mark:'祟',label:'동티'});
    console.log('[카드문양] 역할 5종 OK');

    // 5) 튜토리얼은 일회성 토스트가 아니라 행동 대상에 붙고, 일반 판단 스트립과 자리를 교대한다
    tutStep=1; showBattleCoach('1 / 3','부적 살피기','부적을 탭한다.','handArea');
    assert.equal(document.getElementById('battleCoach').hidden,false);
    assert.equal(document.getElementById('combatLedger').hidden,true);
    assert.equal(document.getElementById('handArea').classList.contains('coach-focus'),true);
    hideBattleCoach();
    assert.equal(document.getElementById('battleCoach').hidden,true);
    assert.equal(document.getElementById('combatLedger').hidden,false);
    assert.equal(document.getElementById('handArea').classList.contains('coach-focus'),false);
    assert.ok(src.includes("showBattleCoach('2 / 3','귀신 수 읽기'")&&src.includes("showBattleCoach('3 / 3','차례 넘기기'"));
    console.log('[전투코치] 행동 대상 결합·3단계 배선 OK');

    // 6) 카드를 낸 순간 이름/역할을 전투 장면에 남긴다
    showActionBanner('살풀이','공격','#8a1a14');
    assert.equal(document.getElementById('actionName').textContent,'살풀이');
    assert.equal(document.getElementById('actionKind').textContent,'공격');
    assert.equal(document.getElementById('actionBanner').classList.contains('on'),true);
    clearTimeout(actionTimer);
    assert.ok(src.includes("el.addEventListener('keydown'")&&src.includes("$('intentChip').addEventListener('keydown'"),'키보드 조작 배선');
    console.log('[피드백/접근성] 시전 배너·키보드 조작 OK');

    inBattle=false;
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
