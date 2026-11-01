const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function game(){
  const elements=new Map();
  const context=new Proxy({}, {get:()=>()=>{}});
  const document={getElementById(id){if(!elements.has(id))elements.set(id,{textContent:'',hidden:false,addEventListener(){},getContext:()=>context,width:600,height:600});return elements.get(id);},querySelectorAll:()=>[],addEventListener(){}};
  const sandbox=vm.createContext({document,localStorage:{getItem:()=>null,setItem(){}},setInterval:()=>1,clearInterval(){},HTMLButtonElement:class{}});
  vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../game.js'),'utf8'),sandbox);
  return code=>vm.runInContext(code,sandbox);
}
test('start, movement, reverse prevention, pause and restart',()=>{
 const run=game();run('start()');assert.equal(run('state'),'playing');
 run("turn('left');tick()");assert.equal(run('snake[0].x'),10);
 run('pause();tick()');assert.equal(run('state'),'paused');assert.equal(run('snake[0].x'),10);
 run('pause();tick()');assert.equal(run('snake[0].x'),11);
 run('start()');assert.equal(run('score'),0);assert.equal(run('snake.length'),3);
});
test('food grows snake, updates score and record, never spawns in body',()=>{
 const run=game();run('start();food={x:10,y:10};tick()');
 assert.equal(run('snake.length'),4);assert.equal(run('score'),1);assert.equal(run('best'),10);
 assert.equal(run('snake.some(p=>p.x===food.x&&p.y===food.y)'),false);
});
test('wall and body collisions end game',()=>{
 const run=game();run('start();for(let i=0;i<11;i++)tick()');assert.equal(run('state'),'over');
 run('start();snake=[{x:5,y:5},{x:6,y:5},{x:6,y:6},{x:5,y:6}];tick()');assert.equal(run('state'),'over');
});
test('moving into vacated tail is allowed and filling board wins',()=>{
 const run=game();run('start();snake=[{x:5,y:5},{x:5,y:6},{x:6,y:6},{x:6,y:5}];food={x:0,y:0};tick()');assert.equal(run('state'),'playing');
 run('start();snake=[];for(let y=0;y<20;y++)for(let x=0;x<20;x++)if(x!==1||y!==0)snake.push({x,y});food={x:1,y:0};tick()');
 assert.equal(run('state'),'over');assert.equal(run('snake.length'),400);assert.equal(run("document.getElementById('badge').textContent"),'ПОБЕДА!');
});
