const http=require('http'),fs=require('fs'),path=require('path');
const {WebSocketServer}=require('ws');
const SIZES={s:15,m:35,l:80,x:120},DENS=0.155;
const COLORS=['#ef4444','#f97316','#eab308','#84cc16','#22c55e','#06b6d4','#3b82f6','#a855f7','#ec4899','#f8fafc'];
const server=http.createServer((req,res)=>{
  fs.readFile(path.join(__dirname,'index.html'),(e,d)=>{
    if(e){res.writeHead(500);return res.end('no index.html');}
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(d);
  });
});
const wss=new WebSocketServer({server});
const rooms={};
const NBC={};
function nbs(N){if(NBC[N])return NBC[N];const a=[];for(let i=0;i<N*N;i++){const x=i%N,y=(i-x)/N,l=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx>=0&&nx<N&&ny>=0&&ny<N)l.push(ny*N+nx);}a.push(l);}return NBC[N]=a;}
function neigh(r,i){return nbs(r.N)[i];}
function count(r,i){let c=0;for(const j of neigh(r,i))c+=r.mines[j];return c;}
function randMines(r,safe){const m=new Uint8Array(r.N*r.N);let n=0;while(n<r.M){const k=Math.floor(Math.random()*m.length);if(!m[k]&&!safe.has(k)){m[k]=1;n++;}}return m;}
function numbers(N,m){const nb=nbs(N),n=new Uint8Array(N*N);for(let i=0;i<N*N;i++){let c=0;for(const j of nb[i])c+=m[j];n[i]=c;}return n;}
function solve(N,num,start,M){
  const nb=nbs(N),T=N*N,st=new Uint8Array(T),q=[],inq=new Uint8Array(T);let opened=0,mf=0;
  const push=c=>{if(!inq[c]){inq[c]=1;q.push(c);}};
  function openCell(i0){const s=[i0];while(s.length){const i=s.pop();if(st[i])continue;st[i]=1;opened++;push(i);for(const j of nb[i])if(st[j]===1)push(j);if(num[i]===0)for(const j of nb[i])if(!st[j])s.push(j);}}
  function setMine(j){if(st[j])return;st[j]=2;mf++;for(const k of nb[j])if(st[k]===1)push(k);}
  function info(c){let f=0;const u=[];for(const j of nb[c]){if(st[j]===2)f++;else if(st[j]===0)u.push(j);}return {u,r:num[c]-f};}
  openCell(start);
  for(;;){
    while(q.length){
      const c=q.pop();inq[c]=0;if(st[c]!==1)continue;
      const a=info(c);if(!a.u.length)continue;
      if(a.r===0)a.u.forEach(x=>openCell(x));else if(a.r===a.u.length)a.u.forEach(x=>setMine(x));
    }
    let acted=false;const cons=new Map();
    for(let c=0;c<T;c++)if(st[c]===1){const a=info(c);if(a.u.length)cons.set(c,a);}
    for(const [c,A] of cons){
      const seen=new Set();
      for(const j of A.u)for(const d of nb[j]){
        if(d===c||seen.has(d))continue;seen.add(d);
        const B=cons.get(d);if(!B||B.u.length<=A.u.length)continue;
        if(!A.u.every(x=>B.u.includes(x)))continue;
        const diff=B.u.filter(x=>!A.u.includes(x)),r=B.r-A.r;
        if(r===0)diff.forEach(x=>{if(!st[x]){openCell(x);acted=true;}});
        else if(r===diff.length)diff.forEach(x=>{if(!st[x]){setMine(x);acted=true;}});
      }
    }
    if(acted)continue;
    const rem=M-mf,unk=T-opened-mf;
    if(unk>0&&rem===0){for(let i=0;i<T;i++)if(!st[i])openCell(i);continue;}
    if(unk>0&&rem===unk){for(let i=0;i<T;i++)if(!st[i])setMine(i);continue;}
    break;
  }
  return {st,solved:opened===T-M};
}
function genNG(r,start){
  const N=r.N,T=N*N,nb=nbs(N),safe=new Set([start,...nb[start]]),t0=Date.now();
  let best=null;
  while(Date.now()-t0<6000){
    const m=randMines(r,safe);best=m;
    for(let it=0;it<3000;it++){
      const res=solve(N,numbers(N,m),start,r.M);
      if(res.solved)return m;
      const F=[],I=[];
      for(let i=0;i<T;i++){
        if(res.st[i]||safe.has(i))continue;
        let adj=false;for(const j of nb[i])if(res.st[j]===1){adj=true;break;}
        if(adj){if(m[i])F.push(i);}else if(!m[i])I.push(i);
      }
      if(!F.length||!I.length)break;
      const k=Math.max(1,Math.ceil(F.length*0.3));
      for(let a=0;a<k&&F.length&&I.length;a++){
        const fi=Math.floor(Math.random()*F.length),ii=Math.floor(Math.random()*I.length);
        m[F[fi]]=0;m[I[ii]]=1;F[fi]=F[F.length-1];F.pop();I[ii]=I[I.length-1];I.pop();
      }
    }
  }
  return best;
}
function place(r,i){r.mines=r.mode==='ng'?genNG(r,i):randMines(r,new Set([i,...neigh(r,i)]));}
function reveal(r,i,ws,ch){const st=[i];while(st.length){const k=st.pop();if(r.open[k]||r.flag[k])continue;r.open[k]=1;r.owner[k]=ws.ci+1;ch.push(k);
  if(r.mines[k]){r.status='lost';r.boom=k;continue;}
  r.safeOpen++;ws.score++;if(count(r,k)===0)for(const j of neigh(r,k))st.push(j);}}
function val(r,i){if(r.open[i])return r.mines[i]?(i===r.boom?10:9):count(r,i);if(r.status==='lost'&&r.mines&&r.mines[i]&&!r.flag[i])return 9;if(r.flag[i])return -2;return -1;}
function chord(r,i,ws,ch){if(!r.open[i]||r.mines[i])return;const nb=neigh(r,i);if(nb.filter(j=>r.flag[j]).length!==count(r,i))return;nb.forEach(j=>{if(!r.flag[j]&&!r.open[j])reveal(r,j,ws,ch);});}
const MSK=()=>new Date(Date.now()+10800000).toISOString().slice(0,10);
function seeded(seed,fn){const o=Math.random;let a=seed|0;Math.random=()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};try{return fn();}finally{Math.random=o;}}
function dseed(day){let h=2166136261;for(const c of 'saper-daily-'+day){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function mkBoard(N,M){return {N,M,mines:null,open:new Uint8Array(N*N),flag:new Uint8Array(N*N),owner:new Uint8Array(N*N),fs:new Uint8Array(N*N),status:'play',boom:-1,flags:0,safeOpen:0};}
function newRoom(code,size,mode,vis){
  const dl=mode==='daily',N=dl?35:(SIZES[size]||15),M=Math.round(N*N*DENS);
  return Object.assign(mkBoard(N,M),{code,size:dl?'m':size,mode,vis:vis!==false&&!dl,race:mode==='race'||dl,daily:dl,clients:new Set(),chat:[],t0:0,end:0,vote:null,slots:0,winner:-1,layout:null,day:''});}
const ok=c=>!c.ghost&&(c.readyState===undefined||c.readyState===1);
function el(r){return r.t0?(r.end||Date.now())-r.t0:0;}
function run(r){return !!r.t0&&r.status==='play';}
function plist(r){const tot=r.N*r.N-r.M;return [...r.clients].map(c=>({n:c.name,c:c.ci,s:r.race&&c.board?Math.round(100*c.board.safeOpen/tot):c.score,off:!!c.ghost,sl:c.slot,bm:c.booms||0,dn:c.doneMs||0}));}
function bcast(r,o){const s=JSON.stringify(o);r.clients.forEach(c=>{if(ok(c))c.send(s);});}
const bcells=b=>Array.from({length:b.N*b.N},(_,i)=>val(b,i));
function full(r){return {t:'full',code:r.code,N:r.N,M:r.M,md:r.mode,cols:COLORS,cells:bcells(r),own:Array.from(r.owner),sk:Array.from(r.fs),status:r.status,fl:r.flags,el:el(r),run:run(r),pl:plist(r),chat:r.chat};}
function rfull(r){return {t:'rfull',code:r.code,N:r.N,M:r.M,md:r.mode,cols:COLORS,status:r.status,st:!!r.t0,el:el(r),run:run(r),winner:r.winner,day:r.day,pl:plist(r),chat:r.chat,
  boards:[...r.clients].map(c=>({s:c.slot,n:c.name,c:c.ci,cells:bcells(c.board),own:Array.from(c.board.owner),sk:Array.from(c.board.fs),fl:c.board.flags,bm:c.booms||0}))};}
function sendFull(r,ws){ws.send(JSON.stringify(r.race?{...rfull(r),me:ws.slot}:full(r)));}
function sendAll(r){if(r.race){const o=rfull(r);r.clients.forEach(c=>{if(ok(c))c.send(JSON.stringify({...o,me:c.slot}));});}else bcast(r,full(r));}
function doRestart(r){const n=newRoom(r.code,r.size,r.mode,r.vis);n.clients=r.clients;n.chat=r.chat;rooms[r.code]=n;
  n.clients.forEach(c=>{c.room=n;c.score=0;c.booms=0;c.doneMs=0;c.slot=n.slots++;c.board=n.race?mkBoard(n.N,n.M):null;});sendAll(n);}
function checkVote(r){const v=r.vote;if(!v)return;
  const live=[...r.clients].filter(ok);
  for(const c of [...v.set])if(!live.includes(c))v.set.delete(c);
  if(live.length&&live.every(c=>v.set.has(c))){clearTimeout(v.timer);doRestart(r);}
  else bcast(r,{t:'vote',n:v.set.size,of:live.length,ms:Math.max(0,v.end-Date.now())});}
function startVote(r,ws){
  if(!r.vote){const v={set:new Set(),end:Date.now()+5000};v.timer=setTimeout(()=>{if(rooms[r.code]===r&&r.vote===v)doRestart(r);},5000);r.vote=v;}
  r.vote.set.add(ws);checkVote(r);}
function leave(ws){const r=ws.room;clearTimeout(ws.gts);if(!r)return;r.clients.delete(ws);ws.room=null;ws.ghost=false;
  if(r.clients.size===0){if(r.vote)clearTimeout(r.vote.timer);delete rooms[r.code];}
  else{bcast(r,{t:'pl',pl:plist(r)});checkVote(r);}}
function ghostify(ws){const r=ws.room;if(!r||ws.ghost)return;ws.ghost=true;ws.gts=setTimeout(()=>{if(ws.ghost)leave(ws);},90000);bcast(r,{t:'pl',pl:plist(r)});checkVote(r);}
function enter(ws,r,want){leave(ws);const used=[...r.clients].map(c=>c.ci);
  const fr=COLORS.map((_,k)=>k).filter(k=>!used.includes(k));
  ws.ci=(Number.isInteger(want)&&want>=0&&want<COLORS.length&&!used.includes(want))?want:(fr.length?fr[Math.floor(Math.random()*fr.length)]:r.clients.size%COLORS.length);
  ws.score=0;ws.booms=0;ws.doneMs=0;ws.slot=r.slots++;ws.board=r.race?mkBoard(r.N,r.M):null;ws.ghost=false;
  r.clients.add(ws);ws.room=r;
  if(r.race)sendAll(r);else{sendFull(r,ws);bcast(r,{t:'pl',pl:plist(r)});}}
const L='ABCDEFGHJKLMNPQRSTUVWXYZ';
function genCode(){let c;do{c='';for(let i=0;i<4;i++)c+=L[Math.floor(Math.random()*L.length)];}while(rooms[c]);return c;}
const cen=r=>Math.floor(r.N/2)*r.N+Math.floor(r.N/2);
const csafe=r=>new Set([cen(r),...neigh(r,cen(r))]);
function fresh(r,w,L){const b=mkBoard(r.N,r.M);b.mines=L;w.board=b;reveal(b,cen(r),w,[]);w.score=0;}
function startRace(r){r.day=MSK();r.t0=Date.now();r.layout=r.daily?seeded(dseed(r.day),()=>genNG(r,cen(r))):randMines(r,csafe(r));r.clients.forEach(w=>fresh(r,w,r.layout));sendAll(r);}
function regen(r,w){fresh(r,w,r.daily?r.layout:randMines(r,csafe(r)));}
function rboard(r,w){const b=w.board;return {t:'rboard',s:w.slot,cells:bcells(b),own:Array.from(b.owner),sk:Array.from(b.fs),fl:b.flags,bm:w.booms,pl:plist(r)};}
function raceAction(r,ws,m){
  if(r.status!=='play'||ws.ghost||!ws.board)return;
  const i=m.i;if(!Number.isInteger(i)||i<0||i>=r.N*r.N)return;
  if(!r.t0){if(m.t==='open')startRace(r);return;}
  const b=ws.board,ch=[];
  if(m.t==='chord')chord(b,i,ws,ch);
  else if(b.open[i])return;
  else if(m.t==='flag'){b.flag[i]^=1;b.flags+=b.flag[i]?1:-1;b.fs[i]=b.flag[i]?ws.skin:0;ch.push(i);}
  else if(m.t==='open'){if(b.flag[i])return;reveal(b,i,ws,ch);}
  if(b.status==='lost'){ws.booms++;regen(r,ws);bcast(r,rboard(r,ws));bcast(r,{t:'rboom',s:ws.slot});return;}
  if(b.safeOpen===r.N*r.N-r.M){b.status='won';ws.doneMs=Date.now()-r.t0;r.status='won';r.winner=ws.slot;r.end=Date.now();sendAll(r);return;}
  bcast(r,{t:'rdiff',s:ws.slot,ch:ch.map(k=>[k,val(b,k),b.owner[k],b.fs[k]]),fl:b.flags,pl:plist(r)});
}
wss.on('connection',ws=>{
  ws.room=null;ws.skin=0;
  ws.on('message',raw=>{
    let m;try{m=JSON.parse(raw);}catch{return;}
    if(m.t==='list'){ws.send(JSON.stringify({t:'rooms',list:Object.values(rooms).filter(r=>r.vis&&!r.t0&&r.status==='play'&&[...r.clients].filter(ok).length&&r.clients.size<(r.race?6:COLORS.length)).map(r=>({code:r.code,N:r.N,md:r.mode,pl:[...r.clients].map(c=>c.name)}))}));return;}
    if(m.t==='resume'){
      const r=rooms[m.code],g=r&&[...r.clients].find(c=>c.ghost&&c.pid&&c.pid===m.pid);
      if(!g)return ws.send(JSON.stringify({t:'error',code:'gone'}));
      clearTimeout(g.gts);['name','ci','score','skin','pid','slot','board','booms','doneMs'].forEach(k=>{ws[k]=g[k];});
      g.ghost=false;g.room=null;r.clients.delete(g);r.clients.add(ws);ws.room=r;ws.ghost=false;
      sendFull(r,ws);bcast(r,{t:'pl',pl:plist(r)});return;}
    if(m.t==='create'||m.t==='join'){
      ws.name=String(m.name||'Игрок').slice(0,12);ws.pid=String(m.pid||'').slice(0,40);
      ws.skin=Number.isInteger(m.skin)&&m.skin>=0&&m.skin<100?m.skin:0;
      if(m.t==='create'){const c=genCode(),md=['ng','race','daily'].includes(m.mode)?m.mode:'n';rooms[c]=newRoom(c,m.size,md,m.vis!==false);enter(ws,rooms[c],m.col);}
      else{const r=rooms[m.code];
        if(!r)return ws.send(JSON.stringify({t:'error',code:'nf'}));
        if(r.race&&r.t0&&r.status==='play')return ws.send(JSON.stringify({t:'error',code:'started'}));
        if(r.clients.size>=(r.race?6:COLORS.length))return ws.send(JSON.stringify({t:'error',code:'full'}));
        enter(ws,r,m.col);}
      return;}
    if(m.t==='leave'){leave(ws);return;}
    const r=ws.room;if(!r)return;
    if(m.t==='chat'){const x=String(m.text||'').slice(0,200);if(!x)return;const o={t:'chat',n:ws.name,c:ws.ci,x};r.chat.push(o);if(r.chat.length>50)r.chat.shift();bcast(r,o);return;}
    if(m.t==='vote'){if(m.a==='restart')startVote(r,ws);return;}
    if(r.race){raceAction(r,ws,m);return;}
    if(r.status!=='play')return;
    const i=m.i;if(!Number.isInteger(i)||i<0||i>=r.N*r.N)return;
    const ch=[];
    if(m.t==='chord'&&r.mines)chord(r,i,ws,ch);
    else if(r.open[i])return;
    else if(m.t==='flag'){r.flag[i]^=1;r.flags+=r.flag[i]?1:-1;r.fs[i]=r.flag[i]?ws.skin:0;ch.push(i);}
    else if(m.t==='open'){if(r.flag[i])return;if(!r.mines){place(r,i);r.t0=Date.now();}reveal(r,i,ws,ch);}
    if(r.status==='play'&&r.safeOpen===r.N*r.N-r.M)r.status='won';
    if(r.status!=='play'&&!r.end)r.end=Date.now();
    if(r.status!=='play')bcast(r,full(r));
    else bcast(r,{t:'diff',ch:ch.map(k=>[k,val(r,k),r.owner[k],r.fs[k]]),fl:r.flags,el:el(r),run:run(r),pl:plist(r)});
  });
  ws.on('close',()=>ghostify(ws));
});
server.listen(process.env.PORT||3000,()=>console.log('Сервер запущен: http://localhost:3000'));
const TYPES={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png'};
const PUB=['/index.html','/manifest.json','/sw.js','/icon-192.png','/icon-512.png','/.well-known/assetlinks.json'];
server.removeAllListeners('request');
server.on('request',(req,res)=>{
  let f=req.url.split('?')[0];if(f==='/')f='/index.html';
  if(!PUB.includes(f)){res.writeHead(404);return res.end('not found');}
  fs.readFile(path.join(__dirname,f),(e,d)=>{
    if(e){res.writeHead(404);return res.end('not found');}
    res.writeHead(200,{'Content-Type':TYPES[path.extname(f)]});res.end(d);
  });
});
