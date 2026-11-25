const fs=require('fs');let s=fs.readFileSync('index.html','utf8');
const R=(a,b)=>{if(!s.includes(a)){console.log('НЕ НАЙДЕНО: '+a.slice(0,70));return;}s=s.replace(a,()=>b);};
R("if(o.t==='create'||o.t==='join'){o.pid=PID;o.col=SET.col;str=JSON.stringify(o);}","if(o.t==='create'||o.t==='join'||o.t==='resume'){o.pid=PID;o.col=SET.col;try{o.ak=localStorage.getItem('adm')||'';}catch(e){}str=JSON.stringify(o);}");
R("function raceEnd(m){\n  const pe=m.pl.find(p=>p.sl===m.winner);","function raceEnd(m){\n  const pe=m.pl.find(p=>p.sl===m.winner);if(window.CHEATED&&m.winner===ME)return;");
fs.writeFileSync('index.html',s);console.log('готово');
