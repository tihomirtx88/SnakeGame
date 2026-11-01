'use strict';
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const size = 20;
const cell = canvas.width / size;
const scoreLabel = document.getElementById('score');
const bestLabel = document.getElementById('best');
const overlay = document.getElementById('overlay');
const startButton = document.getElementById('start');
const pauseButton = document.getElementById('pause');
const statusLabel = document.getElementById('status');
let snake, direction, nextDirection, food, score, timer;
let state = 'ready';
let best = 0;
try { best = Number(localStorage.getItem('snake-best')) || 0; } catch {}
bestLabel.textContent = best;
const vectors = { up: {x:0,y:-1}, down:{x:0,y:1}, left:{x:-1,y:0}, right:{x:1,y:0} };
function placeFood() {
  const available = [];
  for (let y=0;y<size;y++) for (let x=0;x<size;x++) {
    if (!snake.some(part => part.x===x && part.y===y)) available.push({x,y});
  }
  return available[Math.floor(Math.random()*available.length)];
}
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = '#ffffff06';
  for(let i=0;i<=size;i++) {
    ctx.beginPath(); ctx.moveTo(i*cell,0); ctx.lineTo(i*cell,canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,i*cell); ctx.lineTo(canvas.width,i*cell); ctx.stroke();
  }
  if(food) {
    ctx.fillStyle='#f4a779'; ctx.beginPath();
    ctx.arc((food.x+.5)*cell,(food.y+.5)*cell,cell*.31,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#c4ed79'; ctx.fillRect((food.x+.52)*cell,(food.y+.13)*cell,5,6);
  }
  snake.forEach((part,index)=>{
    ctx.fillStyle=index===0?'#dcff99':'#9dc65e';
    ctx.beginPath();ctx.roundRect(part.x*cell+2,part.y*cell+2,cell-4,cell-4,7);ctx.fill();
    if(index===0) {
      ctx.fillStyle='#243824';
      const vertical=direction.y!==0;
      for(const offset of [-1,1]) {
        ctx.beginPath();ctx.arc((part.x+.5)*cell+(vertical?offset*6:direction.x*6),(part.y+.5)*cell+(vertical?direction.y*6:offset*6),2.2,0,Math.PI*2);ctx.fill();
      }
    }
  });
}
function showOverlay(badge,message,hint,button) {
  document.getElementById('badge').textContent=badge;
  document.getElementById('message').textContent=message;
  document.getElementById('hint').textContent=hint;
  startButton.textContent=button;
  overlay.hidden=false;
}
function schedule() { clearInterval(timer); timer=setInterval(tick,Math.max(65,150-score*3)); }
function start() {
  snake=[{x:9,y:10},{x:8,y:10},{x:7,y:10}];
  direction={x:1,y:0};nextDirection=direction;score=0;
  food=placeFood();scoreLabel.textContent=score;state='playing';
  overlay.hidden=true;pauseButton.disabled=false;pauseButton.textContent='Пауза ⏸';
  statusLabel.textContent='В играта · всяка хапка е 10 точки';draw();schedule();
}
function finish(won=false) {
  clearInterval(timer);state='over';pauseButton.disabled=true;
  statusLabel.textContent=won?'Цялото поле е твое!':'Нов опит, нов рекорд?';
  showOverlay(won?'ПОБЕДА!':'КРАЙ НА ИГРАТА',won?'Невероятна змия!':'Още един опит?',`Твоят резултат: ${score*10} точки`,'Играй отново ↗');
}
function tick() {
  if(state!=='playing') return;
  direction=nextDirection;
  const head={x:snake[0].x+direction.x,y:snake[0].y+direction.y};
  const eating=head.x===food.x && head.y===food.y;
  const body=eating?snake:snake.slice(0,-1);
  if(head.x<0 || head.x>=size || head.y<0 || head.y>=size || body.some(p=>p.x===head.x && p.y===head.y)) {finish();return;}
  snake.unshift(head);
  if(eating) {
    score++;scoreLabel.textContent=score*10;
    if(score*10>best) {best=score*10;bestLabel.textContent=best;try{localStorage.setItem('snake-best',String(best));}catch{}}
    food=placeFood();
    if(!food){draw();finish(true);return;}
    schedule();
  } else snake.pop();
  draw();
}
function turn(name) {
  if(state!=='playing') return;
  const vector=vectors[name];
  if(vector && !(vector.x===-direction.x && vector.y===-direction.y)) nextDirection=vector;
}
function pause() {
  if(state==='playing') {
    clearInterval(timer);state='paused';pauseButton.textContent='Продължи ▶';statusLabel.textContent='Почивка за змията';
    showOverlay('ПАУЗА','Поеми си въздух.','Натисни Space или бутона, за да продължиш.','Продължи ↗');
  } else if(state==='paused') {
    state='playing';overlay.hidden=true;pauseButton.textContent='Пауза ⏸';statusLabel.textContent='В играта · всяка хапка е 10 точки';schedule();
  }
}
startButton.addEventListener('click',()=>state==='paused'?pause():start());
pauseButton.addEventListener('click',pause);
document.querySelectorAll('[data-direction]').forEach(button=>button.addEventListener('click',()=>turn(button.dataset.direction)));
const keys={ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right'};
document.addEventListener('keydown',event=>{
  if(event.target instanceof HTMLButtonElement && (event.key===' ' || event.key==='Enter')) return;
  const name=keys[event.key] || keys[event.key.toLowerCase()];
  if(name){event.preventDefault();turn(name);}
  if(event.code==='Space'){event.preventDefault();if(state==='ready'||state==='over')start();else pause();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden && state==='playing')pause();});
snake=[{x:9,y:10},{x:8,y:10},{x:7,y:10}];direction={x:1,y:0};food={x:14,y:7};draw();
