// 드래프트 경제 스모크 (v0.9): 희귀도·축 태그 완비, 3슬롯 규칙, pity, 중복 감쇠, 보장 리롤, 장터 가중, runStats v3
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
    // ---- 1) 데이터 완비: 무구 전수에 희귀도·축, 신령 전수에 축 ----
    GEAR_POOL.forEach(id=>{
      assert.ok(['c','u','r'].includes(GEAR_RAR[id]),'희귀도 누락: '+id);
      assert.ok(Array.isArray(CARD_AX[id]),'축 태그 누락: '+id);
      (CARD_AX[id]||[]).forEach(a=>assert.ok(AX_LABEL[a],'미정의 축: '+a+' @'+id));
    });
    Object.keys(SPIRITS).filter(sp=>SPIRITS[sp].cards.length).forEach(sp=>{
      assert.ok(Array.isArray(SPIRIT_AX[sp])&&SPIRIT_AX[sp].length,'신령 축 누락: '+sp);
      SPIRIT_AX[sp].forEach(a=>assert.ok(AX_LABEL[a],'미정의 축: '+a+' @'+sp));
    });
    const cnt={c:0,u:0,r:0}; GEAR_POOL.forEach(id=>cnt[GEAR_RAR[id]]++);
    assert.ok(cnt.c>=10&&cnt.u>=10&&cnt.r>=7,'등급별 최소 수량: '+JSON.stringify(cnt));
    ['sinjanggi','sinnaerim','wonhonbul','pitgap','sinbeol','bijang'].forEach(id=>assert.equal(GEAR_RAR[id],'r',id+'=레어'));
    console.log('[데이터] 희귀도('+cnt.c+'/'+cnt.u+'/'+cnt.r+')·축 태그 전수 완비 OK');
    // ---- 2) 드래프트 3슬롯 규칙 ----
    party=[{sp:'janggun',lv:1,wh:0,active:true}];
    deck=[]; relics=[]; tokens=[]; uidSeq=1; boons=[];
    teamMax=80; teamHP=80; act=0; depth=0; coins=100;
    for(let i=0;i<300;i++){
      rareLuck=0.15;
      const r=rollDraft(false);
      assert.equal(r.cards.length,3,'항상 3장');
      assert.equal(new Set(r.cards).size,3,'중복 없는 3장');
      assert.equal(gearRar(r.cards[0]),'c','슬롯A는 커먼');
      assert.ok(r.cards.some(id=>axOverlap(id)>0),'보장: 최소 1장은 내 축(str)과 겹침');
    }
    console.log('[3슬롯] 슬롯A 커먼·중복 없음·시너지 보장 300회 OK');
    for(let i=0;i<100;i++){
      rareLuck=0.15;
      const r=rollDraft(true);
      assert.equal(gearRar(r.cards[2]),'r','정예는 슬롯C 레어 확정');
      assert.equal(r.rareShown,true);
    }
    console.log('[정예] 슬롯C 레어 확정 100회 OK');
    // 중복 감쇠: 2장 보유 id는 제시 금지
    addCard('jisin'); addCard('jisin');
    for(let i=0;i<200;i++){
      rareLuck=0.15;
      assert.ok(!rollDraft(false).cards.includes('jisin'),'2장 보유 카드 제시 금지');
    }
    deck=[];
    console.log('[중복감쇠] 2장 보유 제외 200회 OK');
    // ---- 3) pity: 레어 확정·리셋·증가 ----
    rareLuck=1;
    const rp=rollDraft(false);
    assert.equal(rp.rareShown,true,'rareLuck=1이면 레어 확정');
    assert.equal(rareLuck,0.15,'레어 제시 후 리셋');
    rareLuck=0;
    const rn=rollDraft(false);
    assert.equal(rn.rareShown,false,'rareLuck=0이면 슬롯C 레어 불가 (A커먼·B는 c/u)');
    assert.ok(Math.abs(rareLuck-0.15)<1e-9,'미제시 시 +0.15');
    console.log('[pity] 확정·리셋·증가 OK');
    // ---- 4) showDraft 기록 + rareLuck 저장 왕복 ----
    genMap(); mapPos=-1; mapCur=0;
    initRunStats();
    enemy={sp:'dokkaebi',elite:true};
    inBattle=false;
    showDraft();
    assert.equal(runStats.drafts.length,1,'드래프트 기록 1건');
    const rec=runStats.drafts[0];
    assert.equal(rec.shown.length,3); assert.equal(rec.pick,null); assert.equal(rec.rare,true);
    rareLuck=0.45;
    saveRun();
    rareLuck=0.15; runStats.drafts=undefined;
    assert.equal(loadRun(),true);
    assert.equal(rareLuck,0.45,'rareLuck 저장 왕복');
    assert.ok(Array.isArray(runStats.drafts),'drafts 백필');
    console.log('[기록/저장] runStats v3 drafts·rareLuck 왕복 OK');
    // ---- 5) 장터: 재고 2장 + 가중 무예외 ----
    coins=100;
    openShop();
    assert.equal(shopStock.gears.length,2,'장터 부적 2장');
    shopStock.gears.forEach(id=>assert.ok(GEAR_POOL.includes(id)));
    console.log('[장터] 재고 구성·시너지 가중 무예외 OK');
    // rsFinal deckList
    addCard('geumjul'); deck[deck.length-1].up=true;
    rsFinal();
    assert.ok(runStats.final.deckList.includes('geumjul+'),'deckList에 강화 표기');
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
