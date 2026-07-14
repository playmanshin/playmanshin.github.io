// 호러 아트 스모크: 막별 원경 징조·블록 의식문양·체형별 유휴 모션·모션 감소
const fs=require('fs');
const noop=()=>{};
const calls={fillRect:0,arc:0,ellipse:0};
const ctxStub=new Proxy({},{get:(t,p)=>{
  if(p==='fillRect'||p==='arc'||p==='ellipse')return()=>{calls[p]++;};
  if(p==='createLinearGradient'||p==='createRadialGradient')return()=>({addColorStop:noop});
  if(p==='getImageData')return()=>({data:new Uint8ClampedArray(4)});
  return noop;
},set:()=>true});
function mkEl(){
  return {classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},style:{},textContent:'',innerHTML:'',hidden:false,
    disabled:false,addEventListener:noop,appendChild:noop,prepend:noop,remove:noop,isConnected:false,width:0,height:0,tabIndex:0,
    setAttribute:noop,getContext:()=>ctxStub,getBoundingClientRect:()=>({left:0,top:0,width:360,height:640,bottom:640})};
}
const els={},store=new Map();
global.document={getElementById:id=>els[id]||(els[id]=mkEl()),createElement:()=>mkEl(),createElementNS:()=>mkEl()};
global.window={devicePixelRatio:1};
global.addEventListener=noop;
global.innerWidth=800;global.innerHeight=900;
global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
global.requestAnimationFrame=noop;
const src=fs.readFileSync(__dirname+'/_game.js','utf8');
const test=`
(()=>{
  const assert=require('node:assert/strict');
  try{
    // 1) 체형마다 다른 유휴 자세를 쓰고, 모션 감소에서는 모두 중립 자세로 고정한다.
    const w=hauntPose('wraith',0,0,false);
    const b=hauntPose('beast',0.6,0.4,false);
    const g=hauntPose('giant',0.6,0.4,false);
    assert.equal(w.tear,true,'원혼은 짧은 잔상 구간을 가짐');
    assert.notEqual(b.sqx,1,'요괴는 호흡으로 가로 스케일 변화');
    assert.ok(g.sqx>=1&&g.sqx<=1.0181,'거대귀 압박 팽창 상한');
    assert.notDeepEqual({bob:b.bob,sqx:b.sqx,sqy:b.sqy},{bob:g.bob,sqx:g.sqx,sqy:g.sqy},'요괴/거대귀 자세 분리');
    ['wraith','beast','giant'].forEach(m=>assert.deepEqual(hauntPose(m,7.2,2.1,true),
      {bob:0,dx:0,alpha:1,sqx:1,sqy:1,tear:false},m+' 모션 감소 중립'));
    console.log('[귀신모션] 원혼·요괴·거대귀 분리 / 감소 설정 OK');

    // 2) 막별 징조는 결정적이며, 모두 실제 블록 실루엣을 그린다.
    assert.deepEqual(omenState('hanok',3.25,false),omenState('hanok',3.25,false),'징조 계산 결정성');
    assert.notEqual(omenState('jangseung',0,false).phase,omenState('mounds',0,false).phase,'막별 위상 분리');
    ACTS.forEach((A,i)=>{
      calls.fillRect=0;calls.arc=0;calls.ellipse=0;
      drawOmenLayer(A,[0,6,15,2][i]);
      assert.ok(calls.fillRect>=4,A.prop+' 징조 블록 수');
      assert.equal(calls.arc,0,A.prop+' 징조는 arc 금지');
      assert.equal(calls.ellipse,0,A.prop+' 징조는 ellipse 금지');
    });
    console.log('[원경징조] 장승 눈·창호 그림자·봉분 손·귀문 머리발 OK');

    // 3) 새 전경 장식은 캐릭터 아트 규칙과 같은 fillRect 블록 문법만 쓴다.
    calls.fillRect=0;calls.arc=0;calls.ellipse=0;
    drawRitualMarks(2.2,true);
    assert.ok(calls.fillRect>=30,'무당/귀신 의식문양 밀도');
    drawPossessionMarks(2.2,'#9a6fd0');
    ['wraith','beast','giant'].forEach(m=>drawMotionTell(m,ENEMY_POS[0],2.2));
    assert.ok(calls.fillRect>=61,'빙의 부적·체형별 바닥 흔적');
    assert.equal(calls.arc,0,'새 전경 장식 arc 금지');
    assert.equal(calls.ellipse,0,'새 전경 장식 ellipse 금지');
    console.log('[블록문법] 의식문양·빙의 부적·바닥 흔적 OK');

    // 4) 렌더 경로가 공용 모션 시계와 샘플 시간을 실제로 사용한다.
    assert.ok(src.includes('const mt=REDUCED?0:animT'));
    assert.ok(src.includes('const pose=hauntPose(meta.motion,mt,enemyFx.seed,REDUCED)'));
    assert.ok(src.includes('sampleT===undefined?animT:sampleT'));
    console.log('[렌더배선] 배경·스프라이트 공용 모션 감소 시계 OK');
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
