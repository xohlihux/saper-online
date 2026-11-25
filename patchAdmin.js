const fs=require('fs');let s=fs.readFileSync('server.js','utf8');
const R=(a,b)=>{if(!s.includes(a)){console.log('НЕ НАЙДЕНО: '+a.slice(0,70));return;}s=s.replace(a,()=>b);};
R("  if(r.mines[k]){r.status='lost';r.boom=k;continue;}","  if(r.mines[k]){if(ws.god){r.open[k]=0;r.owner[k]=0;if(!r.flag[k]){r.flag[k]=1;r.flags++;r.fs[k]=ws.skin;}continue;}r.status='lost';r.boom=k;continue;}");
s+=`
const crypto=require('crypto');
const hsh=x=>crypto.createHash('sha256').update(String(x)).digest();
const ADM=process.env.ADMIN_KEY||'';
const badIp=new Map();
function isKey(ws,k){
  if(!ADM||!k)return false;
  const b=badIp.get(ws.ip)||{n:0,t:0};
  if(b.n>=10&&Date.now()-b.t<3600000)return false;
  const good=crypto.timingSafeEqual(hsh(k),hsh(ADM));
  if(good)badIp.delete(ws.ip);else badIp.set(ws.ip,{n:b.n+1,t:Date.now()});
  return good;
}
function finishAct(r,ws,b,ch){
  if(r.race){
    if(b.safeOpen===r.N*r.N-r.M){b.status='won';ws.doneMs=Date.now()-r.t0;r.status='won';r.winner=ws.slot;r.end=Date.now();endRound(r);sendAll(r);return;}
    bcast(r,{t:'rdiff',s:ws.slot,ch:ch.map(k=>[k,val(b,k),b.owner[k],b.fs[k]]),fl:b.flags,pl:plist(r)});
  }else{
    if(r.status==='play'&&r.safeOpen===r.N*r.N-r.M)r.status='won';
    if(r.status!=='play'&&!r.end)r.end=Date.now();
    if(r.status!=='play'){endRound(r);sendAll(r);}
    else bcast(r,{t:'diff',ch:ch.map(k=>[k,val(r,k),r.owner[k],r.fs[k]]),fl:r.flags,el:el(r),run:run(r),pl:plist(r)});
  }
}
function cheat(ws,m){
  const r=ws.room;if(!r||ws.spec||ws.ghost)return;
  const b=r.race?ws.board:r;if(!b||!b.mines)return;
  if(m.a==='god'){ws.god=!ws.god;ws.send(JSON.stringify({t:'god',on:ws.god}));return;}
  if(m.a==='xray'){const a=[];for(let i=0;i<b.N*b.N;i++)if(b.mines[i]&&!b.open[i])a.push(i);ws.send(JSON.stringify({t:'xray',mines:a}));return;}
  if(r.status!=='play')return;
  const ch=[],n=b.N*b.N;
  if(m.a==='safe'){const c=[];for(let i=0;i<n;i++)if(!b.mines[i]&&!b.open[i]&&!b.flag[i])c.push(i);if(!c.length)return;reveal(b,c[Math.floor(Math.random()*c.length)],ws,ch);}
  else if(m.a==='allsafe'){for(let i=0;i<n;i++)if(!b.mines[i]&&!b.open[i]){if(b.flag[i]){b.flag[i]=0;b.flags--;b.fs[i]=0;}reveal(b,i,ws,ch);}}
  else if(m.a==='flagall'){for(let i=0;i<n;i++)if(b.mines[i]&&!b.flag[i]&&!b.open[i]){b.flag[i]=1;b.flags++;b.fs[i]=ws.skin;ch.push(i);}}
  else return;
  finishAct(r,ws,b,ch);
}
wss.on('connection',ws=>{
  ws.prependListener('message',raw=>{
    let m;try{m=JSON.parse(raw);}catch{return;}
    if(m&&m.ak&&!ws.admin&&(m.t==='create'||m.t==='join'||m.t==='resume'))ws.admin=isKey(ws,m.ak);
  });
  ws.on('message',raw=>{
    let m;try{m=JSON.parse(raw);}catch{return;}
    if(!m||typeof m!=='object')return;
    if(m.t==='admin'){ws.admin=isKey(ws,m.key);ws.send(JSON.stringify({t:'admin',ok:!!ws.admin}));return;}
    if(m.t==='cheat'&&ws.admin)cheat(ws,m);
  });
});
`;
fs.writeFileSync('server.js',s);console.log('готово');
