// 난이도 프로필(이야기/본굿) 스모크: 회복 경제 수치·적 능력치 불변·금제 게이트·저장 귀속
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
    party=[{sp:'sansin',lv:1,wh:0,active:true}]; deck=[]; relics=[]; tokens=[]; uidSeq=1;
    for(let i=0;i<7;i++)addCard('bujeok');
    teamMax=100; teamHP=50; act=0; depth=0; coins=50; boons=[];
    kills=0; seals=0; sendoffs=0; sinwi=0; gongdeok=0;
    // 1) 회복 경제: 본굿은 이야기보다 명확히 인색해야 한다 (천도는 sendApply 단일 경로)
    diffMode='story';
    assert.equal(restHealAmt(),45); assert.equal(actHealAmt(),40);
    const sa=sendApply(); assert.equal(sa.newMax,103,'이야기: 최대 100→103'); assert.equal(sa.heal,31,'회복은 새 최대치 103 기준(31)');
    assert.equal(shopHealAmt(),45);
    assert.equal(dprof().shopHealCost,30); assert.equal(dprof().gearDraft,0.5);
    assert.equal(evHealAmt(10),10); assert.equal(dprof().sendMax,3);
    diffMode='bongut';
    assert.equal(restHealAmt(),30); assert.equal(actHealAmt(),15);
    const sb=sendApply(); assert.equal(sb.newMax,102); assert.equal(sb.heal,20,'본굿: 102 기준 20');
    assert.equal(shopHealAmt(),30);
    assert.equal(dprof().shopHealCost,35); assert.equal(dprof().gearDraft,0.3);
    assert.equal(evHealAmt(10),5); assert.equal(dprof().sendMax,2);
    console.log('[회복경제] 본굿 = 당산목30%/막종료15%/천도20%+2/명다리30%·35전/드래프트30%/기연 절반 OK');
    // 2) 본굿의 무보상 거절: evHeal0은 이야기에서만 회복
    teamHP=50; diffMode='bongut'; evHeal0(10);
    assert.equal(teamHP,50,'본굿 거절은 무보상');
    diffMode='story'; evHeal0(10);
    assert.equal(teamHP,60,'이야기 거절은 기존 회복');
    console.log('[무보상거절] OK');
    // 3) 적 능력치는 난이도 프로필과 무관 (이 단계에서 적 HP 일괄 증가 금지)
    localStorage.setItem('ms_geumje','0');
    diffMode='story';  startBattle('mulgwisin'); const hpStory=enemy.max, atkStory=enemy.pat.filter(m=>m.a!==undefined).map(m=>m.a).join();
    inBattle=false; stopDrone();
    diffMode='bongut'; startBattle('mulgwisin'); const hpBongut=enemy.max, atkBongut=enemy.pat.filter(m=>m.a!==undefined).map(m=>m.a).join();
    inBattle=false; stopDrone();
    assert.equal(hpStory,hpBongut,'적 HP 불변'); assert.equal(atkStory,atkBongut,'적 공격 불변');
    console.log('[적불변] HP='+hpBongut+' OK');
    // 4) 금제는 본굿 위에서만 (이야기에서는 0으로 게이트)
    localStorage.setItem('ms_geumje','3');
    diffMode='story';  assert.equal(geumje(),0);
    diffMode='bongut'; assert.equal(geumje(),3);
    localStorage.setItem('ms_geumje','0');
    console.log('[금제게이트] OK');
    // 5) 난이도는 런 저장에 귀속
    diffMode='story'; act=0; genMap(); initRunStats();
    assert.equal(runStats.diff,'story');
    saveRun(); diffMode='bongut'; runStats=null;
    assert.equal(loadRun(),true);
    assert.equal(diffMode,'story','저장된 런의 난이도 복원');
    console.log('[난이도귀속] OK');
    inBattle=false; stopDrone();
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
