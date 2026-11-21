const fs=require('fs');let s=fs.readFileSync('index.html','utf8');
const R=(a,b)=>{if(!s.includes(a)){console.log('НЕ НАЙДЕНО: '+a.slice(0,60));return;}s=s.replace(a,()=>b);};
R("const ws=new WebSocket(","let ws=new WebSocket(");
R("\napplyLang();\n","\nwindow.applyLang=applyLang;window.setLang=setLang;applyLang();\n");
R("L.append(logo,box,bplay,bcode,err,tabs);","L.append(logo,box,bplay,bcode,window.mkDaily?window.mkDaily():el('p'),err,tabs);");
R("['ng',tr('mNg'),tr('mNgSub')]],sv[1])","['ng',tr('mNg'),tr('mNgSub')],['race',tr('mRace'),tr('mRaceSub')]],sv[1])");
R("const DICT={\n",`const DICT={
mRace:['🏁 Гонка','🏁 Race'],mRaceSub:['у каждого своё поле','a field for each'],
daily:['📅 ЕЖЕДНЕВНОЕ ПОЛЕ','📅 DAILY FIELD'],
dailyNext:[(h,m,s)=>'Следующее через '+h+':'+m+':'+s+' (МСК)',(h,m,s)=>'Next one in '+h+':'+m+':'+s+' (MSK)'],
started:['Игра уже началась','The game has already started'],roomFull:['Комната заполнена','The room is full'],
gone:['Комната закрылась, начни заново','The room is gone, start again'],
reconnecting:['Связь потеряна, переподключаюсь…','Connection lost, reconnecting…'],
newField:['💥 Взрыв! У тебя новое поле','💥 Boom! You got a new field'],
youWonRace:['🏆 Ты выиграл гонку!','🏆 You won the race!'],
raceWinner:[(n,t)=>'🏁 Победил '+n+' · '+t,(n,t)=>'🏁 '+n+' won · '+t],
startHint:['Нажми на любую клетку, чтобы начать','Tap any cell to begin'],
colorT:['ЦВЕТ ИГРОКА','PLAYER COLOR'],
raceWins:['Побед в гонках: ','Race wins: '],dailyDone:['Ежедневных полей пройдено: ','Daily fields cleared: '],
dailyToday:['Время на сегодняшнем поле: ','Time on today\\'s field: '],streak:['Серия дней подряд: ','Day streak: '],
`);
fs.writeFileSync('index.html',s);console.log('готово');
