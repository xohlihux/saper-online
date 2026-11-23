const fs=require('fs');let s=fs.readFileSync('server.js','utf8');
const R=(a,b)=>{if(!s.includes(a)){console.log('НЕ НАЙДЕНО: '+a.slice(0,70));return;}s=s.replace(a,()=>b);};
R("'/icon-512.png','/.well-known/assetlinks.json'];","'/icon-512.png','/.well-known/assetlinks.json','/music.mp3'];");
R("  if(!PUB.includes(f)){res.writeHead(404);return res.end('not found');}","  if(!PUB.includes(f)){res.writeHead(404);return res.end('not found');}\n  if(f==='/music.mp3')return sendAudio(req,res);");
s+=`
function sendAudio(req,res){
  const p=path.join(__dirname,'music.mp3');
  fs.stat(p,(e,st)=>{
    if(e){res.writeHead(404);return res.end('no music');}
    const rg=/bytes=(\\d*)-(\\d*)/.exec(req.headers.range||'');let a=0,b=st.size-1;
    if(rg){a=rg[1]?+rg[1]:0;b=rg[2]?Math.min(+rg[2],b):b;}
    if(a>b||a>=st.size){res.writeHead(416,{'Content-Range':'bytes */'+st.size});return res.end();}
    const h={'Content-Type':'audio/mpeg','Accept-Ranges':'bytes','Content-Length':b-a+1,'Cache-Control':'public, max-age=86400'};
    if(rg){h['Content-Range']='bytes '+a+'-'+b+'/'+st.size;res.writeHead(206,h);}else res.writeHead(200,h);
    fs.createReadStream(p,{start:a,end:b}).pipe(res);
  });
}
`;
fs.writeFileSync('server.js',s);console.log('готово');
