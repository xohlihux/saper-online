const fs=require('fs'),zlib=require('zlib');
const T=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;T[n]=c>>>0;}
const crc=b=>{let c=0xffffffff;for(const x of b)c=T[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
const chunk=(t,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(t),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c]);};
function icon(S){
  const raw=Buffer.alloc((S*4+1)*S),k=S/512;
  const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  for(let y=0;y<S;y++){raw[y*(S*4+1)]=0;for(let x=0;x<S;x++){
    const X=x/k,Y=y/k;let c=hex('#1b1f2a');
    const d=(a,b)=>Math.hypot(X-a,Y-b);
    if(d(256,300)<150)c=hex('#cbd5e1');
    if(d(256,300)<138)c=hex('#374151');
    if(d(215,255)<34)c=hex('#9ca3af');
    const ax=318,ay=182,bx=368,by=132,t=Math.max(0,Math.min(1,((X-ax)*(bx-ax)+(Y-ay)*(by-ay))/((bx-ax)**2+(by-ay)**2)));
    if(Math.hypot(X-(ax+t*(bx-ax)),Y-(ay+t*(by-ay)))<9)c=hex('#e5e7eb');
    if(d(372,128)<30)c=hex('#f59e0b');
    if(d(372,128)<14)c=hex('#fde68a');
    const o=y*(S*4+1)+1+x*4;raw[o]=c[0];raw[o+1]=c[1];raw[o+2]=c[2];raw[o+3]=255;}}
  const ih=Buffer.alloc(13);ih.writeUInt32BE(S,0);ih.writeUInt32BE(S,4);ih[8]=8;ih[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
fs.writeFileSync('icon-512.png',icon(512));fs.writeFileSync('icon-192.png',icon(192));
console.log('иконки готовы');
