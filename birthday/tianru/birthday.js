'use strict';
const scene = document.querySelector('.birthday-scene');
const cloudCanvas = document.getElementById('clouds');
const starCanvas = document.getElementById('stardust');
const cloudContext = cloudCanvas.getContext('2d', { alpha: true });
const starContext = starCanvas.getContext('2d', { alpha: true });
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const audio = document.getElementById('birthday-audio');
const musicButton = document.getElementById('music-toggle');
const musicLabel = document.getElementById('music-label');
const notice = document.getElementById('music-notice');
const blowButton = document.getElementById('blow-candle');
const blowLabel = document.getElementById('blow-label');
const touchHint = document.getElementById('touch-hint');
const cakeImage = document.querySelector('.birthday-cake');
let width = innerWidth, height = innerHeight, ratio = 1;
let cloudLayers = [], motes = [], particles = [], balloons = [], fireworks = [];
let clock = 0, previousTime = 0, animationFrame = 0, partyTime = -1;
let party = false, musicPending = false, noticeTimer = 0, frameCount = 0;
const pointer = { x: -1000, y: -1000, active: false, until: 0, lastX: -1000, lastY: -1000 };
const cloudImage = new Image();
cloudImage.src = 'cloud-v2.png';
const palette = ['#d5a75d', '#b294c2', '#c98da4', '#fff0b8', '#8fb9d6'];
const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
audio.volume = 0.48;

// Each cloud has its own position, velocity and depth. They are not a moving background.
function buildSky() {
 const formations = [
  [-.18,.39,.55, 12,.53,.65], [.72,.37,.52,-10,.48,.7],
  [.17,.65,.72, 17,.72,.82], [.76,.67,.78,-13,.68,.8],
  [-.26,.85,.83,23,.91,.93], [.38,.93,.98,20,.92,1],
  [.99,.9,.88,-20,.9,1], [-.09,1.11,1.03,27,1,1],
  [.83,1.14,1.1,-24,1,1]
 ];
 cloudLayers = formations.map((f,i) => ({
  x:f[0]*width, y:f[1]*height, size:clamp(width*f[2],370,1350),
  velocity:f[3], depth:f[4], alpha:f[5], phase:i*1.6,
  offsetX:0, offsetY:0
 }));
 motes = Array.from({length: width<650?34:60},()=>({
  x:rand(0,width),y:rand(0,height),radius:rand(.7,2.1),vx:rand(-5,5),vy:rand(-9,-3),
  phase:rand(0,Math.PI*2),spark:Math.random()>.78
 }));
}
function resize() {
 const rect = scene.getBoundingClientRect();
 width = rect.width; height = rect.height;
 ratio = Math.min(devicePixelRatio || 1, 1.75);
 [cloudCanvas,starCanvas].forEach(canvas=>{
  canvas.width = Math.round(width*ratio); canvas.height = Math.round(height*ratio);
 });
 cloudContext?.setTransform(ratio,0,0,ratio,0,0);
 starContext?.setTransform(ratio,0,0,ratio,0,0);
 buildSky();
 if(motionPreference.matches) render(0,0);
}
new ResizeObserver(resize).observe(scene);

// A soft fallback makes the animated scene usable even if the cloud asset fails.
const fallbackCloud = document.createElement('canvas');
fallbackCloud.width=600;fallbackCloud.height=320;
const fc=fallbackCloud.getContext('2d');
for(let i=0;i<26;i++){
 const x=60+(i%9)*56, y=155+Math.sin(i*1.7)*42, r=50+(i%4)*10;
 const gradient=fc.createRadialGradient(x,y,0,x,y,r);
 gradient.addColorStop(0,'rgba(255,255,255,.55)');
 gradient.addColorStop(.5,'rgba(248,251,255,.4)');
 gradient.addColorStop(1,'rgba(244,250,255,0)');
 fc.fillStyle=gradient;fc.fillRect(x-r,y-r,r*2,r*2);
}
function drawClouds(dt) {
 if(!cloudContext)return;
 const ctx=cloudContext;ctx.clearRect(0,0,width,height);
 const image=cloudImage.complete && cloudImage.naturalWidth?cloudImage:fallbackCloud;
 const aspect=image.height/image.width;
 const opening=partyTime>=0?Math.max(0,1-(clock-partyTime)/5):0;
 for(const cloud of cloudLayers){
  if(dt)cloud.x+=cloud.velocity*dt;
  if(cloud.x>width+cloud.size*.65)cloud.x=-cloud.size*.65;
  if(cloud.x<-cloud.size*.75)cloud.x=width+cloud.size*.5;
  const mouseX=pointer.active?(pointer.x/width-.5)*cloud.depth*35:0;
  const mouseY=pointer.active?(pointer.y/height-.5)*cloud.depth*20:0;
  const direction=cloud.x<width/2?-1:1;
  const targetX=mouseX+direction*opening*100*cloud.depth;
  cloud.offsetX+=(targetX-cloud.offsetX)*Math.min(1,dt*2.5 || 1);
  cloud.offsetY+=(mouseY-cloud.offsetY)*Math.min(1,dt*2 || 1);
  const bob=motionPreference.matches?0:Math.sin(clock*.23+cloud.phase)*13*cloud.depth;
  ctx.globalAlpha=cloud.alpha;
  ctx.drawImage(image,cloud.x-cloud.size*.5+cloud.offsetX,cloud.y-cloud.size*aspect*.5+bob+cloud.offsetY,cloud.size,cloud.size*aspect);
 }
 ctx.globalAlpha=1;
}
function sparkle(ctx,x,y,r,angle=0){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();
 ctx.moveTo(0,-r);ctx.quadraticCurveTo(r*.17,-r*.17,r,0);
 ctx.quadraticCurveTo(r*.17,r*.17,0,r);ctx.quadraticCurveTo(-r*.17,r*.17,-r,0);
 ctx.quadraticCurveTo(-r*.17,-r*.17,0,-r);ctx.fill();ctx.restore();
}
function addSparkles(x,y,count,burst=false) {
 if(motionPreference.matches)return;
 for(let i=0;i<count;i++){
  const a=rand(0,Math.PI*2),speed=burst?rand(32,145):rand(10,46);
  particles.push({kind:'star',x:x+rand(-6,6),y:y+rand(-6,6),vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-18,
   life:rand(.7,1.65),maxLife:1.65,size:burst?rand(2,7):rand(1.4,5.5),angle:rand(0,6.28),spin:rand(-2,2),
   color:palette[Math.floor(rand(0,palette.length))]});
 }
 if(particles.length>550)particles.splice(0,particles.length-550);
}
function burstFirework(x,y){
 for(let i=0;i<45;i++){
  const a=i/45*Math.PI*2,speed=rand(70,160);
  particles.push({kind:'star',x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:rand(1.4,2.4),maxLife:2.4,
   size:rand(1.6,4),angle:a,spin:rand(-2,2),color:palette[i%palette.length]});
 }
}
function launchParty(){
 if(motionPreference.matches)return;
 for(let i=0;i<145;i++){
  const left=i%2===0;
  particles.push({kind:'confetti',x:left?-8:width+8,y:height*.68+rand(-35,35),
   vx:(left?1:-1)*rand(width*.17,width*.57),vy:rand(-height*.66,-height*.26),
   life:rand(3.5,5.5),maxLife:5.5,size:rand(3,7),angle:rand(0,6.28),spin:rand(-8,8),
   color:palette[i%palette.length]});
 }
 balloons=Array.from({length:8},(_,i)=>({x:width*(i%2===0?rand(.03,.2):rand(.8,.97)),y:height+rand(70,500),
  radius:rand(width<650?16:24,width<650?26:39),speed:rand(35,60),phase:rand(0,6.28),
  color:['#c6e5f5','#ecccd7','#dbd0ee','#f4e1b5'][i%4]}));
 fireworks=[{at:clock+.2,x:width*.17,y:height*.32},{at:clock+.8,x:width*.83,y:height*.29},
  {at:clock+1.4,x:width*.32,y:height*.16},{at:clock+2.1,x:width*.7,y:height*.19}];
}
function drawBalloons(ctx,dt){
 for(let i=balloons.length-1;i>=0;i--){
  const b=balloons[i];b.y-=b.speed*dt;
  if(b.y<-b.radius*4){balloons.splice(i,1);continue}
  const x=b.x+Math.sin(clock*.65+b.phase)*18,y=b.y,r=b.radius;
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(clock*.7+b.phase)*.07);
  ctx.strokeStyle='#fff9';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,r*.9);
  ctx.bezierCurveTo(-8,r*1.6,12,r*2.1,-5,r*3.6);ctx.stroke();
  const grad=ctx.createLinearGradient(-r,-r,r,r);grad.addColorStop(0,'#ffffff');grad.addColorStop(.3,b.color);grad.addColorStop(1,b.color);
  ctx.fillStyle=grad;ctx.globalAlpha=.8;ctx.beginPath();ctx.moveTo(0,r);
  ctx.bezierCurveTo(-r*2,-r*.25,-r*.85,-r*1.9,0,-r*.8);
  ctx.bezierCurveTo(r*.85,-r*1.9,r*2,-r*.25,0,r);ctx.fill();
  ctx.strokeStyle='#fff9';ctx.lineWidth=1;ctx.stroke();
  ctx.beginPath();ctx.ellipse(-r*.4,-r*.55,r*.12,r*.3,.6,0,Math.PI*2);ctx.fillStyle='#ffffffaa';ctx.fill();
  ctx.restore();
 }
}
function drawDust(dt){
 if(!starContext)return;
 const ctx=starContext;ctx.clearRect(0,0,width,height);
 for(const mote of motes){
  if(dt){
   mote.x+=(mote.vx+Math.sin(clock*.4+mote.phase)*2)*dt;mote.y+=mote.vy*dt;
   if(pointer.active && performance.now()<pointer.until){
    const dx=mote.x-pointer.x,dy=mote.y-pointer.y,d=Math.hypot(dx,dy);
    if(d<115&&d>1){mote.x+=dx/d*(115-d)*dt*2.8;mote.y+=dy/d*(115-d)*dt*2.8}
   }
   if(mote.y<-10)mote.y=height+10;if(mote.x<-10)mote.x=width+10;if(mote.x>width+10)mote.x=-10;
  }
  ctx.globalAlpha=.3+(Math.sin(clock*1.4+mote.phase)+1)*.22;
  ctx.fillStyle=mote.spark?'#fff7dc':'#fff';
  ctx.shadowColor='#fff5d1';ctx.shadowBlur=mote.spark?7:0;
  if(mote.spark)sparkle(ctx,mote.x,mote.y,mote.radius*2.5,clock*.1);
  else{ctx.beginPath();ctx.arc(mote.x,mote.y,mote.radius,0,Math.PI*2);ctx.fill()}
 }
 ctx.shadowBlur=0;ctx.globalAlpha=1;
 // Translucent floating pearls catch the morning light.
 for(let i=0;i<5;i++){
  const x=width*([.08,.9,.16,.86,.72][i])+Math.sin(clock*.24+i)*12;
  const y=height*([.29,.47,.72,.78,.12][i])+Math.cos(clock*.33+i)*14;
  const r=width<650?7+i*2:10+i*3;
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.strokeStyle='#ffffff75';ctx.lineWidth=.8;ctx.stroke();
  ctx.beginPath();ctx.arc(x-r*.1,y-r*.1,r*.68,Math.PI*1.03,Math.PI*1.5);
  ctx.strokeStyle='#ffffffbf';ctx.lineWidth=1.2;ctx.stroke();
 }
 drawBalloons(ctx,dt);
 for(let i=particles.length-1;i>=0;i--){
  const p=particles[i];p.life-=dt;
  if(p.life<=0){particles.splice(i,1);continue}
  p.x+=p.vx*dt;p.y+=p.vy*dt;p.angle+=p.spin*dt;
  if(p.kind==='confetti'){
   p.vy+=120*dt;p.vx*=Math.pow(.8,dt);
   ctx.globalAlpha=Math.min(1,p.life);ctx.fillStyle=p.color;
   ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
   ctx.scale(Math.cos(p.angle*.6),1);ctx.fillRect(-p.size*.5,-p.size,p.size,p.size*1.8);ctx.restore();
  }else{
   p.vx*=Math.pow(.3,dt);p.vy+=10*dt;
   ctx.globalAlpha=Math.min(1,p.life*1.5);ctx.fillStyle=p.color;
   ctx.shadowColor=p.color;ctx.shadowBlur=9;
   sparkle(ctx,p.x,p.y,p.size*Math.min(1,p.life*2),p.angle);
   ctx.shadowBlur=0;
  }
 }
 ctx.globalAlpha=1;
}
function render(timestamp,forcedDt){
 const dt=forcedDt!==undefined?forcedDt:Math.min((timestamp-previousTime)/1000 || .016,.04);
 previousTime=timestamp;clock+=dt;frameCount++;
 if(pointer.active&&performance.now()>pointer.until)pointer.active=false;
 drawClouds(dt);
 while(fireworks.length && fireworks[0].at<=clock){const f=fireworks.shift();burstFirework(f.x,f.y)}
 drawDust(dt);
}
function animate(timestamp){
 animationFrame=0;
 if(document.hidden||motionPreference.matches)return;
 if (timestamp-previousTime >= 1000/60-1) render(timestamp);
 animationFrame=requestAnimationFrame(animate);
}
function startAnimation(){
 if(!animationFrame&&!document.hidden&&!motionPreference.matches){previousTime=performance.now();animationFrame=requestAnimationFrame(animate)}
}
function onPointer(event){
 if(event.pointerType==='mouse' && event.type==='pointermove' && Math.hypot(event.clientX-pointer.lastX,event.clientY-pointer.lastY)<4)return;
 const rect=scene.getBoundingClientRect();pointer.x=event.clientX-rect.left;pointer.y=event.clientY-rect.top;
 pointer.active=true;pointer.until=performance.now()+1300;
 const burst=event.type==='pointerdown';
 addSparkles(pointer.x,pointer.y,burst?28:4,burst);
 pointer.lastX=event.clientX;pointer.lastY=event.clientY;
 touchHint.classList.add('dismissed');
}
scene.addEventListener('pointermove',onPointer,{passive:true});
scene.addEventListener('pointerdown',onPointer,{passive:true});
scene.addEventListener('pointerleave',()=>{pointer.active=false;pointer.lastX=-1000;pointer.lastY=-1000});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){cancelAnimationFrame(animationFrame);animationFrame=0}else startAnimation();
});
motionPreference.addEventListener('change',()=>{
 if(motionPreference.matches){cancelAnimationFrame(animationFrame);animationFrame=0;particles=[];balloons=[];fireworks=[];render(0,0)}
 else startAnimation();
});
cloudImage.addEventListener('load',()=>{if(motionPreference.matches)render(0,0)});
function cakeReady(){scene.classList.add('assets-ready');document.getElementById('load-note').textContent=''}
if(cakeImage.complete&&cakeImage.naturalWidth)cakeReady();else cakeImage.addEventListener('load',cakeReady,{once:true});
cakeImage.addEventListener('error',()=>{document.getElementById('load-note').textContent='蛋糕没加载出来，刷新一下试试。'});

function updateMusic(){
 const playing=!audio.paused;
 musicButton.classList.toggle('playing',playing);
 musicButton.setAttribute('aria-pressed',String(playing));
 musicButton.setAttribute('aria-label',playing?'暂停生日歌':'播放生日歌');
 musicLabel.textContent=playing?'播放中':'生日歌';
}
function showNotice(text){
 notice.textContent=text;notice.classList.add('visible');clearTimeout(noticeTimer);
 noticeTimer=setTimeout(()=>notice.classList.remove('visible'),4000);
}
async function playMusic(){
 if(musicPending)return;
 musicPending=true;musicButton.setAttribute('aria-busy','true');
 try{await audio.play()}catch{showNotice('生日歌没放出来，再点一下右上角试试。');updateMusic()}
 finally{musicPending=false;musicButton.removeAttribute('aria-busy')}
}
musicButton.addEventListener('click',()=>{if(!audio.paused)audio.pause();else void playMusic()});
audio.addEventListener('play',updateMusic);audio.addEventListener('pause',updateMusic);
audio.addEventListener('error',()=>{updateMusic();showNotice('音乐没加载出来，刷新一下试试。')});
blowButton.addEventListener('click',async()=>{
 if(party){
  party=false;partyTime=-1;scene.classList.remove('party','party-pop');
  particles=[];balloons=[];fireworks=[];
  blowLabel.textContent='许好愿啦，吹蜡烛';
  if(motionPreference.matches)render(0,0);return;
 }
 if(audio.paused)void playMusic();
 blowButton.disabled=true;scene.classList.add('blowing');
 if(!motionPreference.matches)await new Promise(resolve=>setTimeout(resolve,450));
 scene.classList.remove('blowing');
 party=true;partyTime=clock;scene.classList.add('party','party-pop');
 blowLabel.textContent='生日快乐！！';
 launchParty();
 setTimeout(()=>{blowLabel.textContent='再点一次蜡烛';blowButton.disabled=false;scene.classList.remove('party-pop')},2200);
 if(motionPreference.matches)render(0,0);
});
// Diagnostics are read-only, to verify that animation and touch effects actually run.
window.birthdayScene = Object.freeze({getStats:()=>({
 frames:frameCount,cloudPositions:cloudLayers.map(c=>Math.round(c.x)),
 particles:particles.length,balloons:balloons.length,party,
 reducedMotion:motionPreference.matches
})});
resize();startAnimation();
