import {useEffect,useRef,useState} from 'react';
import {cameraAt} from '../content/film';
/** Film plate, camera and weather share the editorial clock, including when seeking backwards. */
export function FilmStage({time,motion,onReady}:{time:number;motion:boolean;onReady:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null);const image=useRef<HTMLImageElement|null>(null);
 const [loaded,setLoaded]=useState(false);const [failed,setFailed]=useState(false);
 useEffect(()=>{let disposed=false;const plate=new Image();plate.onload=()=>{if(disposed)return;image.current=plate;setLoaded(true);onReady()};plate.onerror=()=>{if(!disposed){setFailed(true);onReady()}};plate.src='./art/ozymandias-location.webp';return()=>{disposed=true;image.current=null}},[onReady]);
 useEffect(()=>{
  const el=canvas.current,plate=image.current;if(!el||!plate||!loaded)return;
  const ctx=el.getContext('2d',{alpha:false});if(!ctx)return;
  function paint(){
   if(!el||!ctx||!plate)return;const rect=el.getBoundingClientRect();const dpr=Math.min(devicePixelRatio,1.5);
   const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
   if(el.width!==w||el.height!==h){el.width=w;el.height=h}
   const cam=cameraAt(time);let sw=plate.width/cam.z,sh=sw*h/w;
   if(sh>plate.height){sh=plate.height;sw=sh*w/h}
   const sx=Math.max(0,Math.min(plate.width-sw,cam.x*plate.width-sw/2));
   const sy=Math.max(0,Math.min(plate.height-sh,cam.y*plate.height-sh/2));
   ctx.drawImage(plate,sx,sy,sw,sh,0,0,w,h);
   // Ground-level wind has one direction, unlike free-floating decorative fragments.
   if(motion){
    ctx.save();ctx.globalCompositeOperation='screen';
    for(let i=0;i<9;i++){
     const drift=(time*0.021+i*.143)%1;
     const y=h*(.76+i*.025);const x=drift*(w*1.8)-w*.4;
     const g=ctx.createRadialGradient(x,y,0,x,y,w*.21);
     g.addColorStop(0,`rgba(203,193,165,${.015+.015*Math.sin(time*.13+i)**2})`);g.addColorStop(1,'rgba(203,193,165,0)');
     ctx.fillStyle=g;ctx.fillRect(0,h*.65,w,h*.35);
    }ctx.restore();
   }
   // Fixed edge falloff and gentle late cooling keep the plate's motivated light intact.
   const edge=ctx.createLinearGradient(0,0,0,h);edge.addColorStop(0,'rgba(4,10,12,.12)');edge.addColorStop(.55,'rgba(4,10,12,0)');edge.addColorStop(1,'rgba(4,10,12,.3)');ctx.fillStyle=edge;ctx.fillRect(0,0,w,h);
   const dusk=Math.max(0,Math.min(1,(time-104)/40));ctx.fillStyle=`rgba(15,24,29,${dusk*.13})`;ctx.fillRect(0,0,w,h);
  }
  paint();const observer=new ResizeObserver(paint);observer.observe(el);return()=>observer.disconnect();
 },[time,motion,loaded]);
 return <div className="film-picture" aria-hidden="true"><canvas ref={canvas}/>{!loaded&&<img src="./art/ozymandias-location.webp" alt=""/>}{failed&&<span className="film-media-error">The scene could not load. The complete poem is available below.</span>}</div>;
}
