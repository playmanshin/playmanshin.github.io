// 몸주신 성장 형평 스모크: 6명 막간 강화 완비·사기 턴당 1회·방어→공격 전환 훅·회복 전환 훅·runStats v2
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
    // 1) 6 몸주신 전원 막간 강화 3단계×2택 + ID 전역 유일
    const seen=new Set();
    for(const sp of STARTERS){
      const pool=BOONS[sp];
      assert.ok(pool&&pool.length===3,sp+': 3단계');
      pool.forEach(pair=>{
        assert.equal(pair.length,2,sp+': 2택');
        pair.forEach(b=>{
          assert.ok(b.id&&b.n&&b.d,sp+': 강화 필드');
          assert.ok(!seen.has(b.id),'중복 id: '+b.id);
          seen.add(b.id);
        });
      });
    }
    assert.equal(seen.size,36,'6명 × 6강화 = 36종');
    console.log('[강화완비] 6명 × 3단계 × 2택, id 36종 유일 OK');
    // 2) 사기: 턴마다 처음 힘을 얻을 때만 +1
    party=[{sp:'janggun',lv:1,wh:0,active:true}]; deck=[]; relics=[]; tokens=[]; uidSeq=1;
    for(let i=0;i<7;i++)addCard('bujeok');
    teamMax=90; teamHP=90; act=0; depth=0; coins=0; kills=0; seals=0; sendoffs=0; sinwi=0; gongdeok=0;
    boons=['sagi']; player={str:0}; sagiTurnUsed=false;
    assert.equal(gainStr(1),2,'턴 첫 힘 +1');
    assert.equal(gainStr(1),1,'같은 턴 두 번째는 보정 없음');
    sagiTurnUsed=false;
    assert.equal(gainStr(1),2,'다음 턴은 다시 +1');
    console.log('[사기] 턴당 1회 OK');
    // 3) 전투 시작 강화 묶음 (용신 방어·산신 힘·삼신 점지·칠성 드로우)
    boons=['gipeunso','bawideung','horangi','jeomji','bukdu'];
    initRunStats(); startBattle('cheonyeo');
    assert.equal(player.block,11,'깊은 소 6 + 바위 등 5');
    assert.ok(player.str>=1,'호랑이 걸음');
    assert.equal(enemy.han,2,'점지 恨 +2');
    assert.equal(hand.length,7,'북두 드로우 +2');
    assert.ok(rsCombat&&rsCombat.enemy==='cheonyeo'&&rsCombat.type==='normal','rsCombat 시작 기록');
    inBattle=true;
    // 4) 회복 전환 훅 (산울림·강보·생기·삼신끈·탯줄)
    enemy.hp=200; enemy.max=200; enemy.armor=0; enemy.block=0; enemy.han=0;
    boons=['sanullim','gangbo','saenggi','samsinkkeun','taetjul'];
    battleHealAcc=0; player.nextAtk=0; player.block=0;
    teamHP=teamMax;                                     // 초과 회복 상황
    const eh0=enemy.hp;
    healPlayer(5);                                      // 전부 초과
    assert.equal(enemy.hp,eh0-4,'산울림: 초과분 피해 (최대 4)');
    assert.equal(player.block,Math.min(6,5),'강보: 초과분 방어');
    teamHP=teamMax-20;
    healPlayer(13);                                     // 실회복 13
    assert.equal(player.nextAtk,1,'생기: 회복 시 공수 +1');
    assert.equal(enemy.han,1,'삼신끈: 회복 시 恨 +1');
    assert.ok(player.str>=2,'탯줄: 누적 12 도달 시 힘 +1');
    console.log('[회복전환] 산울림·강보·생기·삼신끈·탯줄 OK');
    // 5) 용틀임: 방어 카드 → 공수 +1 (playCard 경유)
    boons=['yongteullim']; player.nextAtk=0; busy=false; energy=3;
    hand=[{uid:900,id:'bangul',owner:null}];
    await playCard(hand[0]);
    assert.equal(player.nextAtk,1,'용틀임 공수 +1');
    console.log('[용틀임] OK');
    // 6) 새벽별: 매 턴 첫 카드 신력 −1
    boons=['saebyeok']; turnCardCount=0; channeled=null; firstCardPlayed=true;
    assert.equal(effCost({uid:1,id:'janggun3',owner:null}),1,'2코스트가 첫 카드엔 1');
    turnCardCount=1;
    assert.equal(effCost({uid:1,id:'janggun3',owner:null}),2,'둘째 카드부터 정가');
    console.log('[새벽별] OK');
    // 7) 유성: 매 턴 첫 공격 카드 +3 (피해 검증)
    boons=['yuseong']; player.str=0; player.nextAtk=0; player.weak=0; player.turnAtk=false;
    enemy.hp=200; enemy.block=0; enemy.armor=0; enemy.field=null; enemy.thorns=0; enemy.mark=0;
    busy=false; energy=3; turnCardCount=0;
    hand=[{uid:901,id:'bujeok',owner:null}];
    const hp0=enemy.hp;
    await playCard(hand[0]);
    assert.equal(hp0-enemy.hp,9,'부적 6 + 유성 3');
    console.log('[유성] 첫 공격 +3 OK');
    // 8) 비늘 이월: 턴이 바뀔 때 방어 최대 5 유지
    boons=['bineul']; channeled=null; player.block=9; busy=false;
    enemy.pat=[{w:1}]; enemy.pi=0; enemy.hp=200; enemy.skipTurn=false;
    await endTurn();
    assert.equal(player.block,5,'비늘 이월 5 (신기 이월 상한 12 불변식과 별개 경로)');
    console.log('[비늘이월] OK');
    // 9) runStats v2: 전투·보상·최종 스냅샷
    if(rsCombat){player.block=0; dmgPlayer(3);}
    assert.ok(rsCombat.dmg>=3,'전투별 피해 누적');
    rsEndCombat(true);
    const c0=runStats.combats[runStats.combats.length-1];
    assert.ok(c0.enemy==='cheonyeo'&&c0.win===true&&c0.turns>=1&&c0.endMax===teamMax,'전투 기록 필드');
    rsReward('seal','cheonyeo'); rsReward('chiseong','janggun');
    assert.equal(runStats.rewards.length,2);
    assert.equal(runStats.rewards[1].target,'janggun');
    rsFinal();
    assert.ok(runStats.final&&runStats.final.deckSize===deck.length&&Array.isArray(runStats.final.activeSpirits),'최종 스냅샷');
    // v1 저장 호환: combats 없는 runStats 로드 시 배열 백필
    genMap(); saveRun();
    const raw=JSON.parse(localStorage.getItem('ms_run'));
    delete raw.runStats.combats; delete raw.runStats.rewards;
    localStorage.setItem('ms_run',JSON.stringify(raw));
    runStats=null;
    assert.equal(loadRun(),true);
    assert.ok(Array.isArray(runStats.combats)&&Array.isArray(runStats.rewards),'v1 백필');
    console.log('[계측v2] 전투/보상/최종/백필 OK');
    inBattle=false; stopDrone();
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
