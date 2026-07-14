// 메뉴·튜토리얼·용어 스모크: tip ID 시스템·새 굿 덮어쓰기 게이트·보상 미리보기(이중 표기)·원한/恨 분리·도움말 무부작용
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
    // 1) 팁 시스템: 1회 노출·초기화
    assert.equal(tipSeen('gut_ready'),false);
    assert.equal(tip('gut_ready','x'),true,'첫 노출');
    assert.equal(tip('gut_ready','x'),false,'재노출 안 함');
    assert.equal(tipSeen('gut_ready'),true);
    resetTips();
    assert.equal(tipSeen('gut_ready'),false,'초기화 후 다시 볼 수 있다');
    assert.ok(TIP_IDS.includes('map_preview')&&TIP_IDS.includes('wonhan_threshold'));
    console.log('[팁] 1회 노출·초기화 OK');
    // 2) 새 굿 덮어쓰기 게이트: 저장이 있으면 첫 탭은 확정하지 않는다
    party=[{sp:'janggun',lv:1,wh:0,active:true}]; deck=[]; relics=[]; tokens=[]; uidSeq=1;
    for(let i=0;i<6;i++)addCard('bujeok');
    teamMax=80; teamHP=70; act=0; depth=0; coins=9; boons=[];
    kills=0; seals=0; sendoffs=0; sinwi=0; gongdeok=0;
    diffMode='bongut'; initRunStats(); genMap(); saveRun();
    assert.ok(localStorage.getItem('ms_run'));
    const hpBefore=teamHP;
    assert.equal(newRunGate(),false,'첫 탭은 경고만');
    assert.ok(localStorage.getItem('ms_run'),'저장 유지');
    assert.equal(teamHP,hpBefore,'상태 불변');
    assert.equal(newRunGate(),true,'두 번째 탭에서만 새 굿');
    console.log('[새굿게이트] 2단 확인 OK');
    // 3) 보상 미리보기: 이중 표기 + 실제 변화량 (원한/동티·체력 전후)
    party=[{sp:'janggun',lv:1,wh:0,active:true},{sp:'cheonyeo',lv:1,wh:3,active:true}];
    relics=[]; teamMax=100; teamHP=31;
    diffMode='bongut';
    const sp=sealPreviewTxt(SPIRITS.yeommae);           // wh 3 → 원한 3→6
    assert.ok(sp.includes('신단 원한 3→6'),sp);
    assert.ok(sp.includes('동티 0→1장'),sp);
    const sd=sendPreviewTxt();                          // 회복 20% of 100 = 20
    assert.ok(sd.includes('체력 31→51'),sd);
    assert.ok(sd.includes('최대체력 +2'),sd);
    assert.ok(sd.includes('방어 6'),sd);
    diffMode='story';
    assert.ok(sendPreviewTxt().includes('힘 1'),'이야기 프로필은 명복에 힘 표기');
    diffMode='bongut';
    console.log('[보상미리보기] 봉인/천도 수치 OK');
    // 4) 도움말 열고 닫아도 진행 상태 불변
    const snap=JSON.stringify({teamHP,teamMax,act,coins,deckN:deck.length});
    show('helpOv'); hide('helpOv');
    assert.equal(JSON.stringify({teamHP,teamMax,act,coins,deckN:deck.length}),snap);
    console.log('[도움말] 무부작용 OK');
    // 5) 필살굿 이중 표기: 준비되면 버튼에 '필살굿' 노출
    party=[{sp:'janggun',lv:1,wh:0,active:true}];
    inBattle=true; busy=false; channeled='janggun'; sinmyeong=5; gutCastTurn=false;
    updateGutBtn();
    assert.ok(document.getElementById('btnGut').textContent.includes('필살굿'));
    inBattle=false; sinmyeong=0; updateGutBtn();
    assert.ok(document.getElementById('btnGut').textContent.includes('신명'));
    console.log('[이중표기] 필살굿/신명 OK');
    // 6) 드래프트 없는 승리 경로: showReward 진입만으로 전투 상태가 정리된다
    party=[{sp:'janggun',lv:1,wh:0,active:true}];
    teamMax=100; teamHP=40; player={block:0,str:0,weak:0,han:0};
    channeled=Object.keys(SPIRITS).find(s=>SPIRITS[s].aura&&SPIRITS[s].aura.id==='healBlock')||null;
    inBattle=true; enemy={sp:'yeommae',hp:0,max:26};
    runStats.outHeal=0;
    showReward();
    assert.equal(inBattle,false,'보상 진입 시 exitBattleUI');
    const blk=player.block;
    healPlayer(10);
    assert.equal(player.block,blk,'전투 신기(포대기)가 보상 회복에 발동하지 않음');
    assert.ok(runStats.outHeal>=10,'보상 회복이 전투 외 회복으로 계측');
    console.log('[전투정리] showReward=exitBattleUI OK');
    // 7) 계측 정확성: busy 재탭 무시·패배 전투 기록
    rsBattleTurns=0; inBattle=true; busy=true; endTurn();
    assert.equal(rsBattleTurns,0,'busy 중 턴 종료 재탭은 카운트 불변');
    busy=false; inBattle=false; endTurn();
    assert.equal(rsBattleTurns,0,'전투 밖 호출 무시');
    const b0=runStats.battles, t0=runStats.turns;
    inBattle=true; enemy={rev:false,sp:'dalgyal'}; player.revive=false; player.nineUsed=true; channeled=null;
    rsBattleTurns=2; teamHP=0;
    defeat();
    assert.equal(runStats.battles,b0+1,'패배한 마지막 전투도 계측');
    assert.equal(runStats.turns,t0+3,'패배 전투 턴 수(2+진행 중 1) 기록');
    assert.equal(runStats.win,false); assert.equal(runStats.deathAct,act);
    console.log('[계측정확성] busy 가드·패배 기록 OK');
    // 8) 미리보기 = 실제 적용 (teamMax 86 본굿 경계, 금제 동티 포함)
    diffMode='bongut'; teamMax=86; teamHP=40; relics=[];
    const ap=sendApply();
    assert.equal(ap.heal,Math.round(88*0.2),'천도 회복은 최대체력 증가 후 기준(18)');
    assert.ok(sendPreviewTxt().includes('체력 40→'+ap.after),'미리보기=적용');
    localStorage.setItem('ms_geumje','1');
    assert.equal(battleCurseCount(4),2,'원한4 동티1 + 금제1 = 2');
    localStorage.setItem('ms_geumje','0');
    console.log('[미리보기일치] 천도/금제 동티 OK');
    // 9) 이야기 난이도에서는 금제 버튼 숨김 (UI=규칙)
    localStorage.setItem('ms_wins','1');
    diffMode='story'; updateGeumjeBtn();
    assert.equal(document.getElementById('btnGeumje').style.display,'none');
    diffMode='bongut'; updateGeumjeBtn();
    assert.equal(document.getElementById('btnGeumje').style.display,'block');
    localStorage.setItem('ms_wins','0');
    console.log('[금제게이트UI] OK');
    inBattle=false; stopDrone();
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
