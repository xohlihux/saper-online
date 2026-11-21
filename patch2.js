const fs=require('fs');let s=fs.readFileSync('index.html','utf8');
const a="window.applyLang();\n})();\n";
if(!s.includes(a))console.log('НЕ НАЙДЕНО: конец предыдущего блока');
else{s=s.replace(a,()=>"window.__R={get:()=>({RACE,RB,ME,RWIN})};\n"+a);fs.writeFileSync('index.html',s);console.log('готово');}
