import {useEffect,useRef} from 'react';
import type {RefObject} from 'react';
import {clamp,smooth,windowed} from '../content/motion';

/** Foreground material: each event has a source in the poem and shares its scroll score. */
export function Matter({dark,motion,position}:{dark:boolean;motion:boolean;position:RefObject<number>}){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const node=canvas.current;if(!node)return;const ctx=node.getContext('2d');if(!ctx)return;
  let w=innerWidth,h=innerHeight,frame=0,last=0,time=0,stopped=false,ticks=0;
  const look={x:0,y:0};const shard=new Image(),foot=new Image(),chip=new Image();
  shard.src='./art/shard.webp';foot.src='./art/foot.webp';chip.src='./art/limestone-chip.webp';
  const seed=(i:number)=>{const n=Math.sin(i*127.1+31.7)*43758.5453;return n-Math.floor(n)};
  function drawImage(img:HTMLImageElement,x:number,y:number,size:number,angle:number,alpha:number){
   if(!img.complete||!img.naturalWidth||alpha<.01)return;ctx!.save();ctx!.translate(x,y);ctx!.rotate(angle);ctx!.globalAlpha=alpha;ctx!.shadowColor='#0008';ctx!.shadowBlur=size*.10;ctx!.drawImage(img,-size/2,-size*img.naturalHeight/img.naturalWidth/2,size,size*img.naturalHeight/img.naturalWidth);ctx!.restore();
  }
  function stone(p:number){
   const arriving=windowed(p,.4,1.3,2.3,3.5);drawImage(foot,w*.17,h*(.63+Math.sin(p*.7)*.045),w*(w<600?.33:.19),-.09+Math.sin(p*.5)*.08,arriving*.84);
   const fragments=windowed(p,2.5,4.3,10.3,12.7);
   // Two different photographic fragments leave the larger sculpture.
   drawImage(shard,w*(.12+Math.sin(p*.65)*.02),h*(.24+Math.sin(p*.5)*.06),w*(w<600?.16:.12),p*.035,fragments*.7);
   drawImage(chip,w*(.86+Math.sin(p*.5)*.025),h*(.26+Math.sin(time*.2+p*.5)*.04),w*(w<600?.18:.095),-.3+p*.055,fragments*.64);
   // A tilted stone base grows beneath the inscription, then sinks into the same sand.
   const base=windowed(p,7.4,8.6,10.2,11.8);
   if(base>.01){ctx!.save();ctx!.globalAlpha=base*.65;const y=h*(.83+(1-base)*.18),l=w*.23,r=w*.78;
    const g=ctx!.createLinearGradient(l,y,r,y+h*.15);g.addColorStop(0,'#b9a58b');g.addColorStop(.42,'#685744');g.addColorStop(1,'#332d28');ctx!.fillStyle=g;
    ctx!.beginPath();ctx!.moveTo(l,y);ctx!.lineTo(r,y-h*.07);ctx!.lineTo(r+w*.07,y+h*.08);ctx!.lineTo(l-w*.07,y+h*.15);ctx!.closePath();ctx!.fill();
    ctx!.fillStyle='#312a24';ctx!.beginPath();ctx!.moveTo(l-w*.07,y+h*.15);ctx!.lineTo(r+w*.07,y+h*.08);ctx!.lineTo(r+w*.07,y+h*.16);ctx!.lineTo(l-w*.07,y+h*.22);ctx!.closePath();ctx!.fill();
    ctx!.strokeStyle='#ddc9a155';ctx!.lineWidth=.7;ctx!.beginPath();ctx!.moveTo(l,y);ctx!.lineTo(r,y-h*.07);ctx!.stroke();ctx!.restore();
   }
  }
  function gyre(p:number){
   const amount=windowed(p,-2,0,2,4.8);if(amount<.01)return;
   ctx!.save();ctx!.translate(w*.57,h*.46);ctx!.scale(1,.72);ctx!.rotate(p*.32+time*.018);
   for(let j=0;j<4;j++){
    ctx!.beginPath();for(let k=0;k<160;k++){const t=k/159,a=t*Math.PI*4+j*1.57,r=(.04+t*.66)*Math.min(w,h);const x=Math.cos(a)*r,y=Math.sin(a)*r;if(k===0)ctx!.moveTo(x,y);else ctx!.lineTo(x,y)}
    ctx!.strokeStyle=`rgba(188,190,168,${amount*(j===0?.13:.055)})`;ctx!.lineWidth=j===0?2.5:.8;ctx!.stroke();
   }ctx!.restore();
  }
  function water(p:number){
   const amount=windowed(p,2.8,4.2,5.8,7.5);if(amount<.01)return;
   ctx!.save();const top=h*(.77-amount*.16);const g=ctx!.createLinearGradient(0,top,0,h);g.addColorStop(0,'#a26b5144');g.addColorStop(.45,'#34444b66');g.addColorStop(1,'#151e29bb');ctx!.globalAlpha=amount;ctx!.fillStyle=g;
   ctx!.beginPath();ctx!.moveTo(0,h);for(let x=0;x<=w+10;x+=10){const y=top+Math.sin(x/w*8+time*.4+p)*h*.015+Math.sin(x/w*21-time*.22)*h*.007;ctx!.lineTo(x,y)}ctx!.lineTo(w,h);ctx!.closePath();ctx!.fill();
   for(let j=0;j<18;j++){ctx!.beginPath();const y=top+j*j*h*.0009;for(let x=0;x<=w+10;x+=14){const yy=y+Math.sin(x/w*(7+j*.4)+time*(.15+j*.008)+j)*h*(.002+j*.00035);if(x===0)ctx!.moveTo(x,yy);else ctx!.lineTo(x,yy)}ctx!.lineWidth=.6+j*.025;ctx!.strokeStyle=`rgba(${j%3===0?'204,153,112':'172,183,178'},${.06+(j/18)*.09})`;ctx!.stroke()}
   ctx!.restore();
  }
  function sun(p:number){
   const amount=windowed(p,10.2,12.3,15.2,17.2);if(amount<.01)return;
   const x=w*.22+look.x*12,y=h*.22,r=Math.min(w,h)*.13;
   ctx!.save();ctx!.globalAlpha=amount;
   const glow=ctx!.createRadialGradient(x,y,r*.78,x,y,r*2.5);glow.addColorStop(0,'#d7bc7b33');glow.addColorStop(.4,'#bc9b5224');glow.addColorStop(1,'#b7985500');ctx!.fillStyle=glow;ctx!.fillRect(x-r*2.5,y-r*2.5,r*5,r*5);
   const body=ctx!.createRadialGradient(x-r*.45,y-r*.4,0,x+r*.2,y+r*.18,r*1.2);body.addColorStop(0,'#30392f');body.addColorStop(.55,'#1b2422');body.addColorStop(1,'#091316');ctx!.fillStyle=body;ctx!.beginPath();ctx!.arc(x,y,r,0,Math.PI*2);ctx!.fill();
   ctx!.save();ctx!.clip();for(let i=0;i<160;i++){const px=x+(seed(i+310)-.5)*r*2,py=y+(seed(i+410)-.5)*r*2;ctx!.fillStyle=`rgba(153,142,110,${seed(i+510)*.07})`;ctx!.beginPath();ctx!.ellipse(px,py,2+seed(i+610)*r*.04,1+seed(i+710)*r*.014,.2,0,Math.PI*2);ctx!.fill()}ctx!.restore();
   ctx!.strokeStyle='#d4b676aa';ctx!.lineWidth=1.1;ctx!.beginPath();ctx!.arc(x,y,r,-2.5,-.4);ctx!.stroke();ctx!.strokeStyle='#d4b67633';ctx!.lineWidth=.5;ctx!.beginPath();ctx!.arc(x,y,r+.7,-2.8,.8);ctx!.stroke();ctx!.restore();
  }
  function birds(p:number){
   const amount=windowed(p,13.6,15.8,17.5,19.2);if(amount<.01)return;
   ctx!.save();ctx!.fillStyle='#101616';ctx!.globalAlpha=amount*.75;
   for(let i=0;i<9;i++){const z=.3+seed(i+70)*.7;const x=((seed(i+51)+time*.014*z+p*.035)%1)*w,y=h*(.16+seed(i+62)*.52);const s=(7+z*20)*(w<600?.7:1),flap=Math.sin(time*1.5+i+p)*s*.35;
    ctx!.save();ctx!.translate(x,y);ctx!.rotate(-.15+Math.sin(i)*.17);ctx!.beginPath();ctx!.moveTo(-s,-flap);ctx!.bezierCurveTo(-s*.6,-s*.32, -s*.2,-s*.17,0,0);ctx!.bezierCurveTo(s*.25,-s*.18,s*.62,-s*.4,s,-flap);ctx!.lineTo(s*.5,s*.05);ctx!.lineTo(0,s*.15);ctx!.lineTo(-s*.5,s*.05);ctx!.closePath();ctx!.fill();ctx!.restore();
   }ctx!.restore();
  }
  function dust(p:number){
   const decay=dark?windowed(p,1.8,3,7,8.5)+windowed(p,15,17,20,22):smooth(9.8,12,p);
   const count=w<600?65:140;ctx!.save();
   for(let i=0;i<count;i++){
    const z=.2+seed(i+101)*.8,wind=time*(.018+decay*.025)*z+p*.017*z;
    const x=((seed(i+130)+wind)%1)*w;let y=((seed(i+141)-wind*.14+2)%1)*h;
    // The empty reading corridor stays clear; material gathers above and below it.
    if(y>h*.39&&y<h*.59)y+=(i%2?1:-1)*h*.15;
    const length=1+z*(3+decay*13);ctx!.strokeStyle=`rgba(${dark?'196,190,159':'224,189,137'},${(.065+z*.14)*(1+decay*.3)})`;ctx!.lineWidth=.45+z*.65;
    ctx!.beginPath();ctx!.moveTo(x,y);ctx!.lineTo(x-length,y+length*.12);ctx!.stroke();
   }
   // A short stream leaves the passing letters during decay, rather than a generic full-screen confetti layer.
   if(!dark&&decay>.05)for(let i=0;i<45;i++){const t=((time*.09+seed(i+250))%1),x=w*(.18+seed(i+270)*.64)+t*t*w*.14,y=h*.52+t*h*.32;ctx!.fillStyle=`rgba(212,181,130,${decay*(1-t)*.26})`;ctx!.fillRect(x,y,.7+seed(i)*1.3,.7)}
   ctx!.restore();
  }
  function draw(stamp:number){frame=0;if(stopped)return;
   if(!document.hidden){time+=motion?Math.min(40,stamp-last||16)*.001:0;last=stamp;ctx!.clearRect(0,0,w,h);const p=position.current;
    if(dark){gyre(p);water(p);sun(p);birds(p)}else stone(p);
    dust(p);if(++ticks%60===0)node!.dataset.frame=String(ticks);
   }if(motion)frame=requestAnimationFrame(draw);
  }
  function schedule(){if(!frame&&!stopped)frame=requestAnimationFrame(draw)}
  function resize(){w=innerWidth;h=innerHeight;const dpr=Math.min(devicePixelRatio,1.35);node!.width=Math.round(w*dpr);node!.height=Math.round(h*dpr);ctx!.setTransform(dpr,0,0,dpr,0,0);schedule()}
  function pointer(e:PointerEvent){if(!motion)return;look.x=clamp(e.clientX/w)-.5;look.y=clamp(e.clientY/h)-.5}
  shard.onload=schedule;foot.onload=schedule;chip.onload=schedule;resize();addEventListener('resize',resize);addEventListener('scroll',schedule,{passive:true});addEventListener('pointermove',pointer,{passive:true});
  return()=>{stopped=true;cancelAnimationFrame(frame);shard.onload=null;foot.onload=null;chip.onload=null;removeEventListener('resize',resize);removeEventListener('scroll',schedule);removeEventListener('pointermove',pointer)};
 },[dark,motion,position]);
 return <canvas ref={canvas} className="matter-stage" aria-hidden="true"/>;
}
