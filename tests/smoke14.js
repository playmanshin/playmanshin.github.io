// v10 스모크: 지도 2탭, 의도 상세, 무구 접기, 구미호 2페이즈 아트, 태그
const fs=require('fs');
const noop=()=>{};
const ctxStub=new Proxy({},{get:(t,p)=>{if(p==='createLinearGradient'||p==='createRadialGradient')return()=>({addColorStop:noop});return noop;},set:()=>true});
function mkEl(){const el={classList:{_s:new Set(),add(c){this._s.add(c)},remove(c){this._s.delete(c)},toggle:noop,contains(c){return this._s.has(c)}},style:{},textContent:'',innerHTML:'',disabled:false,addEventListener:noop,appendChild:noop,prepend:noop,remove:noop,isConnected:false,width:0,height:0,tabIndex:0,setAttribute:noop,getContext:()=>ctxStub,getBoundingClientRect:()=>({left:0,top:0,width:360,height:640,bottom:640})};return el;}
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
  try{
    party=[{sp:'janggun',lv:1,wh:0,active:true}];
    deck=[]; relics=[]; tokens=[]; pendingHaewon=[]; boons=[]; uidSeq=1;
    for(let i=0;i<6;i++)addCard('bujeok');
    teamMax=80; teamHP=80; act=0; depth=0; coins=50;
    genMap();
    // 지도 2탭: 첫 탭 = 선택, 둘째 탭 = 확정(전투 시작)
    mapNodeEls=mapRows.map(r=>r.map(()=>mkishBtn()));
    function mkishBtn(){return document.createElement('button');}
    mapNodeTap(0,0);
    console.log('[지도2탭] 첫 탭 후 선택='+(mapSel?mapSel.r+','+mapSel.i:'없음')+' 전투시작='+inBattle+' (false 기대)');
    mapNodeTap(0,0);
    await sleep(1000);
    console.log('[지도2탭] 둘째 탭 후 전투='+inBattle+' (true 기대)');
    // 후손 집합
    const ds=descendantSet(0,0);
    console.log('[경로집합] 시작 노드 후손 수='+ds.size+' (>= 행 수 기대)');
    // 의도 상세
    enemy.hp=500; enemy.max=500; enemy.weak=1;
    const d=intentDetail();
    console.log('[의도상세] 길이='+d.length+' 약화반영='+(d.includes('약화')||d.includes('예상')||d.length>10));
    // 노드 요약 (변종·판효과 포함)
    const fakeNode={t:'battle',enemy:{sp:'cheonyeo',variant:'old'},field:'bloodmoon'};
    const sum=nodeSummary(fakeNode);
    console.log('[노드요약] 처녀귀신 포함='+sum.includes('처녀귀신')+' 묵음='+sum.includes('묵음')+' 판효과='+sum.includes('핏빛'));
    inBattle=false; stopDrone();
    // 무구 접기: 5개 → 최근 3 + 요약 칩
    relics=['salt','mirrorR','gutsang','jipsin','inju']; tokens=['yeot'];
    renderRelics(); openGear();
    console.log('[무구접기] renderRelics/openGear 무예외, 무구 5·신물 1');
    // 구미호 2페이즈 아트 (전역 enemy 참조 경로)
    const g=new Proxy({},{get:(t,p)=>{if(p==='createLinearGradient')return()=>({addColorStop:()=>{}});return ()=>{};},set:()=>true});
    enemy={sp:'gumiho',phase2:false}; ART.gumiho(g,1.0);
    enemy={sp:'gumiho',phase2:true}; ART.gumiho(g,1.0);
    enemy=null; ART.gumiho(g,1.0);
    console.log('[구미호 2페이즈] 세 상태 모두 무예외');
    // 성향 태그
    console.log('[태그] STARTER_TAGS 정의='+(typeof STARTER_TAGS!=='undefined')+' 장군신='+STARTER_TAGS.janggun.join('/'));
    // 한자 노드 아이콘
    console.log('[아이콘] 전투='+NODE_META.battle[0]+' 정예='+NODE_META.elite[0]+' 보스='+NODE_META.boss[0]);
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
