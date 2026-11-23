const fs=require('fs');let s=fs.readFileSync('index.html','utf8');
const R=(a,b)=>{if(!s.includes(a)){console.log('НЕ НАЙДЕНО: '+a.slice(0,70));return;}s=s.replace(a,()=>b);};
R('<meta name="theme-color" content="#1b1f2a">','<meta name="theme-color" content="#1b1f2a"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Сапер"><link rel="apple-touch-icon" href="/icon-192.png">');
R("'setup','codes','sets'].forEach","'setup','codes','sets','plog'].forEach");
R("let busy=false;","window.__AC={get:()=>AC,rn:rwName};let busy=false;");
R("function raceEnd(m){\n  const pe=m.pl.find(p=>p.sl===m.winner);","function raceEnd(m){\n  const pe=m.pl.find(p=>p.sl===m.winner);window.__log&&window.__log({k:m.md==='daily'?'daily':'race',w:m.winner===ME,N:m.N,M:m.M,ms:pe?pe.dn:0,md:m.md});");
fs.writeFileSync('index.html',s);console.log('готово');
