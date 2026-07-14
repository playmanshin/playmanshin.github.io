// 아트 v2 스모크: 21종 드로잉 함수를 스텁 컨텍스트로 전부 실행 (런타임 에러 검출)
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
    addEventListener:noop,appendChild:noop,isConnected:false,width:0,height:0,
    getContext:()=>ctxStub,
    getBoundingClientRect:()=>({left:0,top:0,width:360,height:640})};
}
const els={};
const store=new Map();
global.document={getElementById:id=>els[id]||(els[id]=mkEl()),createElement:()=>mkEl()};
global.window={devicePixelRatio:1};
global.addEventListener=noop;
global.innerWidth=800; global.innerHeight=900;
global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))};
global.requestAnimationFrame=noop;

const src=fs.readFileSync(__dirname+'/_game.js','utf8');
const test=`
(()=>{
  try{
    const g=new Proxy({},{
      get:(t,p)=>{
        if(p==='createLinearGradient'||p==='createRadialGradient')return()=>({addColorStop:()=>{}});
        return ()=>{};
      },
      set:()=>true
    });
    const names=Object.keys(ART);
    for(const k of names){
      for(const tt of [0,0.5,1.7,3.9]){ART[k](g,tt);}
    }
    sinwi=8;gongdeok=1;
    for(const tt of [0,0.7,2.1])drawShaman(g,tt);
    sinwi=0;gongdeok=9;
    drawShaman(g,1.1);
    console.log('ART_OK 스프라이트='+names.length+'종 + 무당, 전 시간대 무예외');
    process.exit(0);
  }catch(err){console.error('ART_FAIL',err);process.exit(1);}
})();
`;
eval(src+test);
