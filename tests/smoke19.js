// 막별 전략 스모크: 4막 상위 패턴(patUp)·위험 태그 동기화·구미호 2페이즈 패턴 교체·지네각시 백족 급증
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
    party=[{sp:'janggun',lv:1,wh:0,active:true}]; deck=[]; relics=[]; tokens=[]; uidSeq=1;
    for(let i=0;i<7;i++)addCard('bujeok');
    teamMax=90; teamHP=90; coins=0; boons=[]; kills=0; seals=0; sendoffs=0; sinwi=0; gongdeok=0;
    diffMode='bongut'; localStorage.setItem('ms_geumje','0');
    // 1) 상위 패턴 계층: 1막에서는 기본, 4막에서는 patUp
    act=0; depth=0; startBattle('cheonyeo');
    assert.equal(enemy.pat[0].d,undefined,'1막 처녀귀신 첫 수는 기본 패턴(w:2)');
    assert.equal(enemy.pat.length,3);
    inBattle=false; stopDrone();
    act=3; depth=21; startBattle('cheonyeo');
    assert.equal(enemy.pat.length,4,'4막은 상위 패턴');
    assert.equal(enemy.pat[0].d,2,'상위 패턴 첫 수: 약화+저주 조합');
    assert.ok(enemy.pat[1].a>12,'상위 패턴 공격에도 막 스케일 반영');
    inBattle=false; stopDrone();
    console.log('[상위패턴] 1막 기본 / 4막 patUp OK');
    // 2) 위험 태그가 실제 사용 패턴과 동기화
    act=0; assert.ok(!riskTags('imugi').includes('흡혈'),'1막 이무기: 흡혈 없음');
    act=3; assert.ok(riskTags('imugi').includes('흡혈'),'4막 이무기: 흡혈 예고');
    assert.ok(riskTags('samokgu').includes('관통'),'4막 삼목구: 관통 예고');
    assert.ok(riskTags('bulgasari').includes('반사'),'4막 불가사리: 반사 예고');
    console.log('[태그동기화] OK');
    // 3) 구미호 2페이즈: 전용 패턴 교체 + 의도 즉시 갱신 + pi 리셋
    act=3; startBattle('gumiho',{boss:true});
    const preStr=enemy.str, prePat0=JSON.stringify(enemy.pat[0]);
    enemy.armor=0; enemy.block=0;
    dmgEnemy(Math.ceil(enemy.max*0.55),'#fff',true,true);   // 50% 이하로
    assert.equal(enemy.phase2,true);
    assert.equal(enemy.str,preStr+2,'본색 힘 +2');
    assert.equal(enemy.pi,0,'패턴 처음부터');
    assert.notEqual(JSON.stringify(enemy.pat[0]),prePat0,'전용 2페이즈 패턴으로 교체');
    assert.equal(enemy.pat[0].h,3,'본색 첫 수: 3연타');
    assert.ok(enemy.pat.some(m=>m.dr),'본색 패턴에 흡혈 수 존재');
    inBattle=false; stopDrone();
    console.log('[구미호] 2페이즈 전용 패턴 OK');
    // 4) 지네각시: 체력 50%에서 백족 단계 즉시 +1 (1회만)
    act=2; depth=14; startBattle('jineegaksi',{boss:true});
    const h0=enemy.pat.filter(m=>m.h).map(m=>m.h).join();
    enemy.armor=0; enemy.block=0;
    dmgEnemy(Math.ceil(enemy.max*0.55),'#fff',true,true);
    assert.equal(enemy.centiSurge,true);
    const h1=enemy.pat.filter(m=>m.h).map(m=>m.h).join();
    assert.notEqual(h0,h1,'다단히트 단계 상승');
    const h1v=enemy.pat.filter(m=>m.h).map(m=>m.h);
    dmgEnemy(3,'#fff',true,true);                            // 한 번 더 맞아도 재발동 없음
    assert.deepEqual(enemy.pat.filter(m=>m.h).map(m=>m.h),h1v,'급증은 1회만');
    inBattle=false; stopDrone();
    console.log('[지네각시] 50% 백족 급증 OK');
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
