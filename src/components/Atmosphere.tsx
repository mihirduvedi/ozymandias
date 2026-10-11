import {useEffect,useRef} from 'react';
/** A continuous, pointer-sensitive dust field. Positions derive from scroll,
 * not a repeating timeline; still mode draws once and stops its frame loop. */
export function Atmosphere({dark,motion,phase}:{dark:boolean;motion:boolean;phase:number}){
 const canvas=useRef<HTMLCanvasElement>(null);const progression=useRef(phase);useEffect(()=>{progression.current=phase},[phase]);
 useEffect(()=>{
  const node=canvas.current;if(!node)return;const ctx=node.getContext('2d');if(!ctx)return;
  let w=0,h=0,frame=0,previous=0,time=0,morph=progression.current;const pointer={x:.5,y:.5};
  const grains=Array.from({length:innerWidth<600?110:240},(_,i)=>({x:(Math.sin(i*127.1+31.7)*43758.5453)%1+((Math.sin(i*127.1+31.7)*43758.5453)%1<0?1:0),y:(Math.sin(i*269.5+183.3)*43758.5453)%1+((Math.sin(i*269.5+183.3)*43758.5453)%1<0?1:0),z:.2+(i%13)/13,size:.4+(i%7)*.22}));
  function resize(){w=innerWidth;h=innerHeight;const ratio=Math.min(devicePixelRatio,1.5);node!.width=w*ratio;node!.height=h*ratio;ctx!.setTransform(ratio,0,0,ratio,0,0);if(!motion)draw(0)}
  function move(e:PointerEvent){pointer.x=e.clientX/w;pointer.y=e.clientY/h;if(motion){const scene=node!.closest('main');scene?.style.setProperty('--look-x',String(pointer.x-.5));scene?.style.setProperty('--look-y',String(pointer.y-.5))}}
  function draw(stamp:number){
   if(document.hidden){if(motion)frame=requestAnimationFrame(draw);return}
   time+=Math.min(32,stamp-previous||16)*.0002;previous=stamp;
   ctx!.clearRect(0,0,w,h);morph+=(progression.current-morph)*.025;
   const scroll=scrollY/Math.max(1,document.documentElement.scrollHeight-h);const speed=motion?time:0;
   // Atmospheric contour lines curve around the reader in Yeats's gyre.
   for(let j=0;j<20;j++){
    ctx!.beginPath();ctx!.strokeStyle=dark?'rgba(193,189,164,.065)':'rgba(238,197,136,.09)';ctx!.lineWidth=.6;
    for(let x=-30;x<=w+30;x+=12){const vortex=dark?Math.sin(morph*6.28)*.5:Math.sin(morph*3.14)*.3;const y=h*(.42+j*.026)+Math.sin(x/w*(3+morph*7)+j*.25+morph*5)*h*(.025+Math.abs(vortex)*.17)+Math.cos(x/w*8+j*.3)*h*.014;if(x===-30)ctx!.moveTo(x,y);else ctx!.lineTo(x,y)}ctx!.stroke();
   }
   const gyre=dark?Math.max(0,1-morph*7):0;
   if(gyre>.01){ctx!.beginPath();ctx!.strokeStyle=`rgba(190,208,190,${gyre*.13})`;ctx!.lineWidth=.8;for(let n=0;n<320;n++){const t=n/320,a=t*Math.PI*10+scroll*3+speed*.035,r=t*Math.min(w,h)*.75;const x=w*.5+Math.cos(a)*r,y=h*.5+Math.sin(a)*r*.63;if(n===0)ctx!.moveTo(x,y);else ctx!.lineTo(x,y)}ctx!.stroke()}
   for(const grain of grains){
    let x=((grain.x+speed*.025*grain.z+scroll*.28*grain.z)%1)*w;
    let y=((grain.y-scroll*.8*grain.z+Math.sin(speed+grain.x*9)*.014+2)%1)*h;
    if(dark){const a=scroll*5+grain.x*6.28;x+=Math.cos(a)*(grain.z*65);y+=Math.sin(a)*grain.z*45}
    const dx=x-pointer.x*w,dy=y-pointer.y*h,dist=Math.hypot(dx,dy);if(motion&&dist<140){x+=dx/(dist+1)*(140-dist)*.18;y+=dy/(dist+1)*(140-dist)*.18}
    ctx!.fillStyle=dark?`rgba(225,216,194,${.13+grain.z*.3})`:`rgba(255,222,164,${.13+grain.z*.35})`;ctx!.beginPath();ctx!.ellipse(x,y,grain.size*(1+grain.z),grain.size*.55, -.4,0,Math.PI*2);ctx!.fill();
   }
   if(motion)frame=requestAnimationFrame(draw);
  }
  resize();if(motion)frame=requestAnimationFrame(draw);window.addEventListener('resize',resize);window.addEventListener('pointermove',move,{passive:true});return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);window.removeEventListener('pointermove',move)};
 },[dark,motion]);
 return <canvas ref={canvas} className="atmosphere" aria-hidden="true"/>;
}
