// 강신 2탭 스모크 (v10.13): 첫 탭 미리보기(무비용)·둘째 탭 강신·프리뷰 전환·빙의 칩 재탭·busy 가드·턴 리셋·신기 줄 배치
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
    party=[G('janggun'),G('cheonyeo'),G('dalgyal')];
    deck=[]; relics=[]; tokens=[]; uidSeq=1; boons=[];
    for(let i=0;i<8;i++)addCard('bujeok');
    teamMax=80; teamHP=80; act=0; depth=0; coins=0;
    genMap();
    startBattle('gaekgwi');
    await sleep(950);
    enemy.hp=500; enemy.max=500;
    assert.equal(pendChannel,null,'개전 시 미리보기 없음');
    // 첫 탭: 미리보기만 — 비용·전환 없음
    energy=3;
    tapChannel('cheonyeo');
    assert.equal(pendChannel,'cheonyeo','첫 탭 — 살펴보기 상태');
    assert.equal(channeled,'janggun','전환되지 않음');
    assert.equal(energy,3,'비용 없음');
    const peek=document.getElementById('channelPeek');
    assert.equal(peek.hidden,false,'미리보기 패널 표시');
    assert.ok(peek.innerHTML.includes('서린 한'),'신기 이름 표시');
    assert.ok(peek.innerHTML.includes('곡성'),'필살굿 표시');
    assert.ok(peek.innerHTML.includes('한 번 더 탭'),'확정 안내');
    // 다른 칩 탭: 미리보기 이동 (여전히 무전환)
    tapChannel('dalgyal');
    assert.equal(pendChannel,'dalgyal');
    assert.equal(channeled,'janggun'); assert.equal(energy,3);
    // 둘째 탭: 강신 실행
    tapChannel('dalgyal');
    assert.equal(channeled,'dalgyal','둘째 탭 — 강신');
    assert.equal(energy,2,'신력 1 지불');
    assert.equal(pendChannel,null,'미리보기 종료');
    assert.equal(peek.hidden,true,'패널 닫힘');
    // 빙의 중 칩 재탭: 정보 열고 닫기만 — 무비용
    tapChannel('dalgyal');
    assert.equal(pendChannel,'dalgyal');
    assert.ok(peek.innerHTML.includes('지금 빙의 중'),'빙의 중 안내');
    tapChannel('dalgyal');
    assert.equal(pendChannel,null); assert.equal(channeled,'dalgyal'); assert.equal(energy,2,'재탭 무비용');
    // busy 가드
    busy=true; tapChannel('cheonyeo');
    assert.equal(pendChannel,null,'busy 중 무반응');
    busy=false;
    // 무료 전환 표기
    gutSwapFree=true;
    assert.equal(channelCostTxt(),'무료','맞이굿 무료 표기');
    gutSwapFree=false;
    assert.equal(channelCostTxt(),'신력 1');
    // 턴이 넘어가면 미리보기 리셋
    tapChannel('cheonyeo');
    assert.equal(pendChannel,'cheonyeo');
    enemy.pi=0; busy=false;
    await endTurn(); await sleep(300);
    assert.equal(pendChannel,null,'턴 시작 시 미리보기 리셋');
    console.log('[강신2탭] 미리보기·확정·재탭·busy·턴 리셋 OK');
    // 신기 줄이 칩 위(첫 자식)로 이동 — 판단 스트립과 겹침 원천 제거 (DOM 순서 검증)
    const html=require('fs').readFileSync(__dirname+'/../index.html','utf8');
    const bar=html.slice(html.indexOf('<div id="spiritBar">'),html.indexOf('</div>',html.indexOf('<div id="spiritBar">'))+6);
    assert.ok(html.indexOf('id="auraTxt"')<html.indexOf('id="spiritChips"'),'auraTxt가 칩보다 먼저 (겹침 방지 배치)');
    // 신단 바 고정 높이 금지 — 내용이 바를 넘치면 flex가 자식을 쥐어짜 겹침이 재발한다 (v10.13.1 회귀)
    const sbCss=html.match(/#spiritBar\\{[^}]*\\}/s)[0];
    assert.ok(!/height\\s*:/.test(sbCss),'spiritBar는 auto 높이');
    assert.ok(/flex:none/.test(html.match(/#auraTxt\\{[^}]*\\}/s)[0]),'auraTxt 축소 금지');
    inBattle=false; stopDrone();
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
