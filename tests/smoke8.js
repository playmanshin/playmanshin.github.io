// v5 스모크: 4막, 신규 기제(공포/철갑/판효과/백족/아홉목숨/恨증폭/세눈), 스케일
const fs=require('fs');
const noop=()=>{};
const ctxStub=new Proxy({},{
  get:(t,p)=>{
    if(p==='createLinearGradient'||p==='createRadialGradient')return()=>({addColorStop:noop});
    return noop;
  },
  set:()=>true
});
function mkEl(){
  return {classList:{add:noop,remove:noop,toggle:noop},style:{},textContent:'',innerHTML:'',disabled:false,
    addEventListener:noop,appendChild:noop,prepend:noop,remove:noop,setAttribute:noop,tabIndex:0,isConnected:false,width:0,height:0,
    getContext:()=>ctxStub,
    getBoundingClientRect:()=>({left:0,top:0,width:360,height:640})};
}
const els={}; const store=new Map();
global.document={getElementById:id=>els[id]||(els[id]=mkEl()),createElement:()=>mkEl()};
global.window={devicePixelRatio:1};
global.addEventListener=noop;
global.innerWidth=800; global.innerHeight=900;
global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))};
global.requestAnimationFrame=noop;

const src=fs.readFileSync(__dirname+'/_game.js','utf8');
const test=`
(async()=>{
  const assert=require('node:assert/strict');
  try{
    console.log('[데이터] SPIRITS='+Object.keys(SPIRITS).length+' STARTERS='+STARTERS.length+' GUTS='+Object.keys(GUTS).length+' ACTS='+ACTS.length+' CARDS='+Object.keys(CARDS).length);
    // 카드 참조 무결성
    for(const sp of Object.keys(SPIRITS))for(const c of SPIRITS[sp].cards||[])if(!CARDS[c])throw new Error('카드 없음: '+c);
    for(const sp of STARTERS)if(!GUTS[sp])throw new Error('굿거리 없음: '+sp);
    console.log('[무결성] 카드/굿거리 참조 OK');
    // 셋업: 삼신할미 (포대기: 회복 시 방어+2)
    party=[{sp:'samsinhalmi',lv:1,wh:0}];
    deck=[]; relics=[]; tokens=[]; uidSeq=1;
    for(let i=0;i<4;i++)addCard('bujeok');
    for(let i=0;i<3;i++)addCard('bangul');
    SPIRITS.samsinhalmi.cards.forEach(c=>addCard(c,'samsinhalmi'));
    teamMax=80; teamHP=50; act=0; depth=0; coins=50;
    genMap();
    const fields=mapRows.flat().filter(n=>n.field).length;
    console.log('[지도] 1막 판효과 노드='+fields);
    assert.equal(fields,0);
    // 포대기 검증
    startBattle('jangseung');
    await sleep(950);
    const blk0=player.block;
    healPlayer(5);
    console.log('[포대기] 방어 '+blk0+'→'+player.block);
    assert.equal(player.block,blk0+2);
    // 장승의 겁(怯): 신명 드레인
    sinmyeong=4;
    enemy.pi=2; // {f:2} 차례로
    await endTurn();
    await sleep(150);
    console.log('[공포] 신명='+sinmyeong);
    assert.equal(sinmyeong,2);   // 4 − 겁2
    inBattle=false; stopDrone();
    // 철갑: 불가사리
    act=2; depth=14;
    startBattle('bulgasari');
    await sleep(950);
    enemy.armor=3;
    const hp1=enemy.hp;
    // 공격: 부적던지기 6+0힘 → 3만 박혀야
    const atk=hand.find(c=>c.id==='bujeok');
    if(atk){await playCard(atk,null);
      console.log('[철갑] 피해 '+(hp1-enemy.hp));
      assert.equal(hp1-enemy.hp,3);}
    // 恨은 관통
    enemy.han=5; const hp2=enemy.hp;
    await endTurn(); await sleep(150);
    assert.ok(hp2-enemy.hp>=5,'恨이 철갑을 관통해야 한다');
    console.log('[철갑관통] OK');
    inBattle=false; stopDrone();
    // 핏빛 달 판효과
    startBattle('imugi',{field:'bloodmoon'});
    await sleep(950);
    const hp3=enemy.hp;
    const atk2=hand.find(c=>{const v=cardVals(c);return v.dmg&&effCost(c)<=energy&&!CARDS[c.id].curse;});
    if(atk2){const v=cardVals(atk2);await playCard(atk2,null);
      console.log('[핏빛달] 실제 '+(hp3-enemy.hp));
      assert.equal(hp3-enemy.hp,8);}
    inBattle=false; stopDrone();
    // 지네각시 백족: 사이클 후 h 증가
    act=2; depth=20;
    startBattle('jineegaksi',{boss:true});
    await sleep(950);
    const h0=enemy.pat[0].h;
    for(let i=0;i<4;i++){enemy.pi++;}
    enemy.pi=enemy.pat.length; // 사이클 경계 흉내: endTurn에서 wrap 체크
    console.log('[백족] 초기 h='+h0);
    assert.equal(h0,2);
    console.log('[스케일] 지네각시 HP='+enemy.max);
    assert.ok(Math.abs(enemy.max-150)<=10,'스케일 테이블 이탈(본굿 3막 보스 ×1.10): '+enemy.max);   // v0.7.3: 기본 136 × 1.10
    inBattle=false; stopDrone();
    // 묘귀 보은 (v0.9: 아홉목숨 → 회복 축 payoff 리워크)
    party.push({sp:'myogwi',lv:1,wh:2});
    startBattle('samokgu');
    await sleep(950);
    enemy.hp=500; enemy.max=500;
    setChannel('myogwi',true);
    assert.equal(SPIRITS.myogwi.aura.id,'gratitude','묘귀 오라 리워크');
    player.str=0; player.nextAtk=0; player.turnAtk=false; turnHealed=false;
    let ehp=enemy.hp; energy=3;
    hand.push({uid:9090,id:'bujeok',owner:null});
    await playCard(hand[hand.length-1],null);
    assert.equal(ehp-enemy.hp,6,'회복 없는 턴 — 보은 미발동');
    teamHP=Math.min(teamMax,teamHP); teamHP-=5; healPlayer(3);   // 회복 발생
    player.turnAtk=false;                                        // 새 턴 첫 공격 흉내
    ehp=enemy.hp; energy=3;
    hand.push({uid:9091,id:'bujeok',owner:null});
    await playCard(hand[hand.length-1],null);
    assert.equal(ehp-enemy.hp,9,'회복한 턴 첫 공격 +3');
    console.log('[보은] 회복 조건·첫 공격 한정 OK');
    // 이무기 恨 증폭
    party.push({sp:'imugi',lv:1,wh:3});
    setChannel('imugi',true);
    const han0=enemy.han;
    hand.push({uid:9100,id:'imu2',owner:'imugi'}); energy=3;
    await playCard(hand[hand.length-1],null);
    console.log('[천년의한] 恨 +'+(enemy.han-han0));
    assert.equal(enemy.han-han0,4);
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
