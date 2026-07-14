// 타격감 레이어 스모크: FX 프레임 경계/무예외 · 화이트 실루엣 캐시 · 히트스톱 · 화면 플래시 정책(다단히트/강도 설정)
const fs=require('fs');
const noop=()=>{};
const ctxStub=new Proxy({},{get:(t,p)=>{if(p==='createLinearGradient'||p==='createRadialGradient')return()=>({addColorStop:noop});return noop;},set:()=>true});
function mkEl(){return {classList:{add:noop,remove:noop,toggle:noop},style:{},textContent:'',innerHTML:'',disabled:false,addEventListener:noop,appendChild:noop,isConnected:false,width:0,height:0,tabIndex:0,setAttribute:noop,getContext:()=>ctxStub,getBoundingClientRect:()=>({left:0,top:0,width:360,height:640})};}
const els={}; const store=new Map();
global.document={getElementById:id=>els[id]||(els[id]=mkEl()),createElement:()=>mkEl()};
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
    // 1) FX 프레임 전수: 무예외 + pixelate 가시범위(x ±54.7 / y −95.85~+4.05) 안에서만 그린다
    for(const type of Object.keys(FX_DEFS)){
      const def=FX_DEFS[type];
      for(let fi=0;fi<def.n;fi++){
        const b={minx:1e9,miny:1e9,maxx:-1e9,maxy:-1e9,n:0};
        const g=new Proxy({fillRect:(x,y,w,h)=>{b.n++;b.minx=Math.min(b.minx,x);b.maxx=Math.max(b.maxx,x+w);b.miny=Math.min(b.miny,y);b.maxy=Math.max(b.maxy,y+h);}},
          {get:(t,p)=>p in t?t[p]:()=>{},set:()=>true});
        def.draw(g,fi);
        assert.ok(b.n>0,type+' 프레임 '+fi+'이 아무것도 그리지 않음');
        assert.ok(b.minx>=-54.7&&b.maxx<=54.7,type+' 프레임 '+fi+' x 경계 이탈: '+b.minx+'..'+b.maxx);
        assert.ok(b.miny>=-95.85&&b.maxy<=4.05,type+' 프레임 '+fi+' y 경계 이탈: '+b.miny+'..'+b.maxy);
      }
    }
    console.log('[FX프레임] '+Object.keys(FX_DEFS).length+'종 전 프레임 경계 OK');
    // 2) 화이트 실루엣 캐시: 생성·스탬프 동기화·재사용
    const fakeP={cv:{width:81,height:74},last:7};
    const w1=whiteOf(fakeP,'_t');
    assert.ok(whiteCache['_t']); assert.equal(whiteCache['_t'].last,7);
    const w2=whiteOf(fakeP,'_t');
    assert.equal(w1,w2,'같은 스탬프면 캐시 재사용');
    fakeP.last=8; whiteOf(fakeP,'_t');
    assert.equal(whiteCache['_t'].last,8,'원본 재렌더 시 화이트도 갱신');
    console.log('[화이트캐시] OK');
    // 3) 히트스톱: 최대값 유지
    freezeT=0; hitStop(0.11); hitStop(0.05);
    assert.equal(freezeT,0.11);
    freezeT=0;
    console.log('[히트스톱] OK');
    // 4) 플래시 정책: off는 무시, soft는 반전→백색 강등
    flashT=0; flashLevel='off'; screenFlash('white',0.09);
    assert.equal(flashT,0,'off면 화면 플래시 없음');
    flashLevel='soft'; screenFlash('invert',0.12);
    assert.ok(flashT>0); assert.equal(flashMode,'white','soft는 반전 대신 백색');
    flashT=0; flashLevel='full'; screenFlash('invert',0.12);
    assert.equal(flashMode,'invert');
    flashT=0;
    console.log('[플래시정책] OK');
    // 5) 전투 통합: 타격 → fx 스폰/히트스톱/플래시, 다단 중간 타는 화면 플래시 억제
    party=[{sp:'bari',lv:1,wh:0}]; deck=[]; relics=[]; tokens=[]; uidSeq=1;
    for(let i=0;i<7;i++)addCard('bujeok');
    teamMax=80; teamHP=80; act=1; depth=1; coins=0;
    startBattle('mulgwisin');
    await sleep(1000);
    enemy.armor=0; enemy.block=0;
    const fxN=fxAnims.length;
    flashT=0; freezeT=0;
    dmgEnemy(22,'#c99b3f',false,false,'slash');            // 마지막/단일 타
    assert.equal(fxAnims.length,fxN+1,'타격 시 임팩트 스폰');
    assert.equal(fxAnims[fxAnims.length-1].type,'slash');
    assert.ok(freezeT>=0.11,'큰 피해 히트스톱');
    assert.ok(flashT>0,'큰 피해 화면 플래시');
    flashT=0; freezeT=0;
    dmgEnemy(22,'#c99b3f',false,false,'slash',true);       // 다단 중간 타
    assert.equal(flashT,0,'중간 타는 화면 플래시 없음');
    assert.ok(freezeT<=0.06,'중간 타는 짧은 히트스톱');
    flashT=0; player.block=0;
    dmgPlayer(14,false,true);                              // 적 다단 중간 타
    assert.equal(flashT,0,'피격 중간 타도 플래시 없음');
    assert.ok(shamanHurtT>0,'피격 순백 실루엣 타이머');
    flashT=0; player.block=0;
    dmgPlayer(14);
    assert.ok(flashT>0,'피격 마지막 타는 플래시');
    console.log('[전투통합] fx/히트스톱/다단 억제 OK');
    // 6) 스프라이트 메타: 보스 유도값 + 예외 명시 + 모션 유형
    assert.equal(spriteMeta('geusundae').scale,1.6); assert.equal(spriteMeta('geusundae').hitY,64);
    assert.equal(spriteMeta('gumiho').scale,1.42);  assert.equal(spriteMeta('mulgwisin').hitY,40);
    assert.equal(spriteMeta('cheonyeo').motion,'wraith');
    assert.equal(spriteMeta('gumiho').motion,'beast');
    assert.equal(spriteMeta('geusundae').motion,'giant');
    assert.equal(spriteMeta('jangsanbeom').motion,'giant');
    console.log('[스프라이트메타] OK');
    // 7) 카드 fx 계통: 명시 태그 + 투사체(fly) 좌표 저장
    assert.equal(CARDS.bujeok.fx,'talisman');
    assert.equal(CARDS.indujil.fx,'seal');
    assert.equal(CARDS.ogugut.fx,'hanMist');
    for(const [id,c] of Object.entries(CARDS))             // 모든 fx 태그가 실존 계통인지 — 오타 하나가 런타임 오류가 된다
      if(c.fx)assert.ok(FX_DEFS[c.fx],id+': unknown fx '+c.fx);
    assert.equal(FX_DEFS.talisman.fly,2);
    enemy.hp=500; enemy.max=500; enemy.block=0; enemy.armor=0;   // 5)에서 죽었을 수 있으니 되살린다
    fxAnims.length=0;
    dmgEnemy(5,'#c99b3f',false,false,'talisman');
    const tf=fxAnims[fxAnims.length-1];
    assert.equal(tf.type,'talisman');
    assert.ok(typeof tf.fx0==='number'&&typeof tf.fy0==='number','투사체는 출발점을 가진다');
    dmgEnemy(5,'#c99b3f',false,false,'slash');
    assert.equal(fxAnims[fxAnims.length-1].fx0,undefined,'참격은 출발점 없음');
    console.log('[카드fx] 태그·투사체 OK');
    // 8) wisp: 음의 중력 상승 입자 (죽음의 재·恨 귀기)
    sparks.length=0;
    wisp(100,100,'#9a6fd0',3,20);
    assert.equal(sparks.length,3);
    assert.ok(sparks.every(s=>s.grav<0&&s.vy<0&&s.life>0.8),'위로 떠오르는 수명 있는 입자');
    sparks.length=0;
    // 9) 디졸브: 함수·베이어 행렬 존재 (픽셀 검증은 렌더 스모크 영역 밖)
    assert.equal(typeof dissolveOf,'function');
    assert.equal(BAYER4.length,4); assert.ok(BAYER4.every(r=>r.length===4));
    console.log('[디졸브/와스프] OK');
    // 10) 사운드 레이어: AC 없는 환경에서도 전 계통×강약 무예외 + 덕킹/BGM API
    muted=false;
    for(const fam of ['slash','talisman','hanMist','seal','ward','heal','impact',null])snd.cast(fam);
    for(const fam of ['slash','talisman','hanMist','seal','impact'])
      for(const pos of ['first','mid','last'])snd.strike(fam,pos);
    duckMusic(5,0.4); startDrone(); bgmTick(); stopDrone();
    assert.equal(typeof musicG,'function');
    console.log('[사운드레이어] 시전·적중·잔향/덕킹 무예외');
    inBattle=false; stopDrone();
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
