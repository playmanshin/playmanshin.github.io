// v8 스모크: 맵 그래프 불변식 (200회 생성) + 경로 검증 + 저장 버전
const fs=require('fs');
const noop=()=>{};
const ctxStub=new Proxy({},{get:(t,p)=>{if(p==='createLinearGradient'||p==='createRadialGradient')return()=>({addColorStop:noop});return noop;},set:()=>true});
function mkEl(){return {classList:{add:noop,remove:noop,toggle:noop},style:{},textContent:'',innerHTML:'',disabled:false,addEventListener:noop,appendChild:noop,prepend:noop,remove:noop,isConnected:false,width:0,height:0,tabIndex:0,setAttribute:noop,getContext:()=>ctxStub,getBoundingClientRect:()=>({left:0,top:0,width:360,height:640,bottom:640})};}
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
    party=[{sp:'janggun',lv:1,wh:0}]; deck=[]; uidSeq=1; addCard('bujeok');
    act=0;
    // 그래프 불변식 200회
    let bad=0;
    for(let trial=0;trial<200;trial++){
      genMap();
      for(let r=0;r<mapRows.length-1;r++){
        const A=mapRows[r],B=mapRows[r+1];
        // 막다른 길 없음
        A.forEach((a,i)=>{if(!a.next||!a.next.length){bad++;console.log('출구없음',trial,r,i);}});
        // 모든 노드 진입 가능
        B.forEach((b,j)=>{if(!A.some(a=>a.next.includes(j))){bad++;console.log('진입불가',trial,r+1,j);}});
        // 인덱스 유효
        A.forEach(a=>a.next.forEach(j=>{if(j<0||j>=B.length){bad++;console.log('범위밖',trial,r);}}));
      }
      // 시작→보스 도달 (전진 BFS)
      let frontier=new Set([0]);
      for(let r=0;r<mapRows.length-1;r++){
        const nf=new Set();
        frontier.forEach(i=>mapRows[r][i].next.forEach(j=>nf.add(j)));
        frontier=nf;
        if(!frontier.size){bad++;console.log('경로단절',trial,r);break;}
      }
    }
    console.log('[그래프] 200회 생성, 위반='+bad);
    assert.equal(bad,0);
    // 경로 검증: next에 없는 노드 선택 차단
    genMap();
    mapPos=0; mapCur=0; mapRows[0][0].chosen=true;
    const nxt=mapRows[0][0].next;
    const blockedIdx=[...Array(mapRows[1].length).keys()].find(j=>!nxt.includes(j));
    console.log('[경로검증] 허용='+JSON.stringify(nxt)+' / 차단 대상='+blockedIdx+
      ' reachable(허용)='+reachableNext(1,nxt[0])+' reachable(차단)='+(blockedIdx===undefined?'해당없음':reachableNext(1,blockedIdx)));
    // 저장 버전 게이트
    localStorage.setItem('ms_run',JSON.stringify({party:[{sp:'janggun'}],deck:[]}));  // 구버전 (mapVersion 없음)
    const oldLoad=loadRun();
    console.log('[구버전 저장] load='+oldLoad+' 저장잔존='+(localStorage.getItem('ms_run')?'있음':'폐기됨'));
    assert.equal(oldLoad,false); assert.equal(localStorage.getItem('ms_run'),null);
    teamHP=60;teamMax=80;coins=30;tokens=[];relics=[];genMap();mapPos=2;mapCur=1;
    saveRun(); mapCur=0; mapPos=0;
    const ok=loadRun();
    console.log('[신버전 저장] load='+ok+' mapPos='+mapPos+' mapCur='+mapCur);
    assert.equal(ok,true); assert.equal(mapPos,2); assert.equal(mapCur,1);
    console.log('SMOKE_OK');
    process.exit(0);
  }catch(err){console.error('SMOKE_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
