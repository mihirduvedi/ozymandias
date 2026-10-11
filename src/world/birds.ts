import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export type FlightBird={group:T.Group;pose:(time:number,bank:number,powered:boolean)=>void};
const slate=new T.Color('#3c4850'),ivory=new T.Color('#c5c1aa');

// A feather is a thin cambered vane with a narrow rachis, asymmetric webs and
// overlapping roots. It is not a separated finger or a thick rounded capsule.
function feather(length:number,width:number,offset=0){
 const p:number[]=[],uv:number[]=[],colors:number[]=[],idx:number[]=[];const rings=14,sides=8;
 for(let j=0;j<=rings;j++){const t=j/rings,w=width*(.30+.70*Math.sin(Math.PI*Math.pow(t,.83))**.65)*(1-t**9);
  for(let i=0;i<sides;i++){const a=i/sides*Math.PI*2,across=Math.cos(a),upper=Math.sin(a)>0;
   p.push(across*w*(across>0?.72:1),Math.sin(a)*.0013+Math.sin(Math.PI*t)*length*.032,-t*length);
   uv.push((across+1)*.5,t+offset);const c=upper?slate:ivory;colors.push(c.r,c.g,c.b);
  }
 }
 for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){const a=j*sides+i,b=j*sides+(i+1)%sides,c=a+sides,d=b+sides;idx.push(a,c,b,b,c,d)}
 for(const end of [0,rings])for(let i=1;i<sides-1;i++){const o=end*sides;idx.push(o,o+i+(end===0?1:0),o+i+(end===0?0:1))}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
function feathers(items:{x:number;y?:number;z:number;length:number;width:number;angle:number}[]){
 const pieces=items.map((f,i)=>{const g=feather(f.length,f.width,(i%5)*.071);g.rotateY(f.angle);g.translate(f.x,f.y??0,f.z);return g});const geometry=mergeGeometries(pieces)!;pieces.forEach(g=>g.dispose());return geometry;
}
function featherMaterial(raven:boolean){
 if(typeof document==='undefined')return new T.MeshStandardMaterial({color:raven?'#535c59':'#ffffff',vertexColors:true,roughness:.91});
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;const c=canvas.getContext('2d')!;
 c.fillStyle='#fff';c.fillRect(0,0,512,1024);
 // Fine barbs catch light, but never glow. Dark transverse bars remain readable
 // beneath the wing. The grey dorsal feather color is carried by the geometry.
 for(let j=0;j<9;j++){c.fillStyle=raven?'#e1dfd6':'#77776c';c.beginPath();const y=j*118+20;c.moveTo(0,y+8);c.bezierCurveTo(180,y-12,340,y-12,512,y+5);c.lineTo(512,y+40);c.bezierCurveTo(320,y+20,180,y+22,0,y+43);c.fill()}
 for(let y=0;y<1024;y+=3){c.strokeStyle='rgba(32,38,38,.13)';c.lineWidth=.7;c.beginPath();c.moveTo(255,y);c.lineTo(0,y-90);c.moveTo(255,y);c.lineTo(512,y-67);c.stroke()}
 c.strokeStyle='rgba(41,44,42,.55)';c.lineWidth=2.4;c.beginPath();c.moveTo(255,0);c.lineTo(255,1024);c.stroke();
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=8;
 const m=new T.MeshStandardMaterial({color:raven?'#535c59':'#ffffff',vertexColors:true,map,roughness:.91,metalness:0});return m;
}

// One continuous loft from the rump through the breast, throat and helmet.
// The profile is deliberately slender in flight, with no separate belly orb.
function bodyGeometry(raven:boolean){
 const profile=[[-.275,.012,.018,-.015],[-.22,.033,.043,-.014],[-.14,.059,.073,-.009],[-.02,.071,.093,0],[.095,.065,.080,.013],[.155,.049,.064,.028],[.205,.054,.063,.047],[.26,.050,.051,.049],[.296,.021,.028,.042],[.307,.004,.009,.038]];
 const curve=new T.CatmullRomCurve3(profile.map(q=>new T.Vector3(q[1],q[2],q[3])),false,'catmullrom',.18);
 const rings=96,sides=64,p:number[]=[],uv:number[]=[],color:number[]=[],idx:number[]=[];
 const dark=new T.Color(raven?'#252b2b':'#343e45'),light=new T.Color(raven?'#39403d':'#cbc7b4');
 for(let j=0;j<=rings;j++){const t=j/rings,q=curve.getPoint(t),f=t*(profile.length-1),k=Math.min(profile.length-2,Math.floor(f)),s=f-k,z=T.MathUtils.lerp(profile[k][0],profile[k+1][0],s);
  for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2,x=Math.cos(a)*q.x,y=q.z+Math.sin(a)*q.y;
   p.push(x,y,z);uv.push(i/sides,t);
   const underside=T.MathUtils.smoothstep(-Math.sin(a),.0,.48),helmet=T.MathUtils.smoothstep(z,.172,.21),cheek=Math.exp(-(((z-.255)/.05)**2))*Math.exp(-(((Math.sin(a)+.22)/.29)**2));
   const moustache=Math.exp(-(((z-.226)/.024)**2))*Math.exp(-(((Math.sin(a)+.32)/.38)**2));
   const blend=underside*(1-helmet)+cheek*.85*(1-moustache);
   const shade=dark.clone().lerp(light,Math.min(1,blend));
   if(z<.10&&underside>.4){const bar=(.5+.5*Math.sin(z*290+Math.cos(a*2)*.8))**12;shade.multiplyScalar(1-.48*bar)}
   shade.multiplyScalar(.97+.03*Math.sin(z*840+a*43));color.push(shade.r,shade.g,shade.b);
  }
 }
 for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i,b=a+sides+1;idx.push(a,a+1,b,a+1,b+1,b)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(color,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
function wingCore(outer=false){
 const p:number[]=[],uv:number[]=[],colors:number[]=[],idx:number[]=[];const rows=24,cols=18;
 for(const top of [true,false])for(let i=0;i<=rows;i++){const t=i/rows,x=outer?t*.31:t*.26,leading=outer?.01-t*.18:.075+t*.04,trailing=outer?-.20-t*.008:-.20+t*.01;
  for(let j=0;j<=cols;j++){const v=j/cols,z=T.MathUtils.lerp(leading,trailing,v),y=(top?1:-.35)*Math.sin(Math.PI*v)**.65*(outer?.008:.017)*(1-t*.85);
   p.push(x,y,z);uv.push(v,t);const c=(top?slate:ivory).clone(),bar=(.5+.5*Math.sin(v*34+t*17+Math.sin(t*23)*1.4))**12;c.multiplyScalar(top?.96+.04*Math.sin(t*79+v*42):1-.36*bar);colors.push(c.r,c.g,c.b);
  }
 }
 const layer=(rows+1)*(cols+1);
 for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+cols+1;idx.push(a,b,a+1,a+1,b,b+1);idx.push(layer+a,layer+a+1,layer+b,layer+a+1,layer+b+1,layer+b)}
 for(let i=0;i<rows;i++)for(const j of [0,cols]){const a=i*(cols+1)+j,b=a+cols+1;idx.push(a,a+layer,b,b,b+layer,a+layer)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
function bodyFeatherMap(){
 if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,512,1024);
 for(let row=0;row<50;row++)for(let col=0;col<32;col++){const x=col*16+(row%2)*8,y=row*21;ctx.strokeStyle='rgba(74,78,70,.12)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x-7,y);ctx.quadraticCurveTo(x-5,y+12,x,y+17);ctx.quadraticCurveTo(x+5,y+12,x+7,y);ctx.stroke()}
 const bodyMap=new T.CanvasTexture(canvas);bodyMap.colorSpace=T.SRGBColorSpace;bodyMap.wrapS=T.RepeatWrapping;bodyMap.anisotropy=8;
 return bodyMap;
}
export function makeFlightBird(raven=false):FlightBird{
 const group=new T.Group();group.name=raven?'Desert raven':'Peregrine falcon';
 const bodyMap=bodyFeatherMap();
 const plume=featherMaterial(raven),bodyMaterial=new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.94,map:bodyMap}),coreMaterial=new T.MeshStandardMaterial({color:raven?'#535c59':'#ffffff',vertexColors:true,roughness:.95}),black=new T.MeshStandardMaterial({color:'#151b1b',roughness:.64}),cere=new T.MeshStandardMaterial({color:raven?'#333c39':'#aaa04a',roughness:.77}),eye=new T.MeshStandardMaterial({color:'#080f10',roughness:.20});
 group.add(new T.Mesh(bodyGeometry(raven),bodyMaterial));
 const sphere=(scale:T.Vector3,pos:T.Vector3,mat:T.Material)=>{const m=new T.Mesh(new T.SphereGeometry(1,24,16),mat);m.scale.copy(scale);m.position.copy(pos);group.add(m);return m};
 for(const side of [-1,1]){
  sphere(new T.Vector3(.004,.012,.013),new T.Vector3(side*.047,.068,.259),cere);
  sphere(new T.Vector3(.003,.0085,.009),new T.Vector3(side*.0505,.068,.261),eye);
 }
 sphere(new T.Vector3(.022,.019,.025),new T.Vector3(0,.044,.300),cere);
 const beakShape=new T.Shape();beakShape.moveTo(0,0);beakShape.bezierCurveTo(.029,.009,.045,-.009,.034,-.039);beakShape.lineTo(.024,-.025);beakShape.lineTo(0,-.022);beakShape.closePath();
 const beakG=new T.ExtrudeGeometry(beakShape,{depth:.023,steps:1,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:3,curveSegments:16});beakG.rotateY(-Math.PI/2);beakG.translate(.0115,.043,.315);group.add(new T.Mesh(beakG,black));
 const wingPairs:{shoulder:T.Group;wrist:T.Group;side:number}[]=[];
 for(const side of [-1,1]){
  const shoulder=new T.Group();shoulder.position.set(side*.052,.035,.015);shoulder.scale.x=side;group.add(shoulder);
  shoulder.add(new T.Mesh(wingCore(),coreMaterial));
  shoulder.add(new T.Mesh(feathers(Array.from({length:15},(_,i)=>({x:.025+i*.015,z:-.035-i*.002,y:-.001,length:.215-i*.003,width:.021,angle:-.10+i*.015}))),plume));
  for(let row=0;row<3;row++)shoulder.add(new T.Mesh(feathers(Array.from({length:22},(_,i)=>({x:.01+i*.012,z:.082-row*.041,y:.017-row*.002,length:.11+row*.018,width:.0135,angle:-.17+i*.006}))),plume));
  const wrist=new T.Group();wrist.position.set(.25,0,.041);shoulder.add(wrist);wrist.add(new T.Mesh(wingCore(true),coreMaterial));
  wrist.add(new T.Mesh(feathers(Array.from({length:10},(_,i)=>({x:i*.006,z:.026-i*.019,length:.352-i*.013,width:.024,angle:-1.06+i*.076}))),plume));
  wrist.add(new T.Mesh(feathers(Array.from({length:16},(_,i)=>({x:i*.013,z:.025-i*.004,y:.009,length:.115,width:.017,angle:-.83}))),plume));
  wingPairs.push({shoulder,wrist,side});
 }
 const tail=new T.Group();tail.position.set(0,-.012,-.20);group.add(tail);
 tail.add(new T.Mesh(feathers(Array.from({length:12},(_,i)=>({x:(i-5.5)*.008,z:0,length:.20-Math.abs(i-5.5)*.003,width:.020,angle:(i-5.5)*.026}))),plume));
 for(const side of [-1,1]){sphere(new T.Vector3(.013,.018,.033),new T.Vector3(side*.035,-.084,-.04),cere);
  for(let j=0;j<3;j++){const claw=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(side*.035+(j-1)*.007,-.094,-.018),new T.Vector3(side*.035+(j-1)*.008,-.102,.014),new T.Vector3(side*.035+(j-1)*.008,-.091,.023)]),8,.0025,5,false),black);group.add(claw)}
 }
 group.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true}});
 return {group,pose:(time,bank,powered)=>{
  const phase=time*(raven?6.4:8.8),beat=powered?Math.sin(phase):Math.sin(time*.8)*.018;
  for(const {shoulder,wrist,side} of wingPairs){shoulder.rotation.z=side*(powered?beat*.48:.07);shoulder.rotation.x=powered?.035*(1-Math.cos(phase)):0;wrist.rotation.z=powered?Math.sin(phase-.48)*.21:0;wrist.rotation.y=.035+Math.max(0,beat)*.16}
  tail.rotation.x=powered?Math.sin(phase-.4)*.04:.025;tail.rotation.y=bank*.20;group.rotation.z=bank;
 }};
}
export function birdFlight(time:number,centre:T.Vector3,main=false,index=0){
 const angle=time*(main?.28:.12+index*.003)+index*2.37;
 const radius=main?10+6*(.5+.5*Math.sin(time*.021)):12+index*.95;
 const altitude=main?8.2+Math.sin(time*.06)*2.4:17+index*.5+Math.sin(angle*.7+index)*1.5;
 const position=new T.Vector3(centre.x+Math.cos(angle)*radius,centre.y+altitude,centre.z+Math.sin(angle)*radius);
 const tangent=new T.Vector3(-Math.sin(angle),0,Math.cos(angle));
 const speed=(main?.28:.12+index*.003)*radius,bank=-Math.atan(speed*speed/(9.81*radius));
 const powered=(time+index*1.7)%(main?8.3:11.7)<(main?2.6:3.3);
 return {position,tangent,bank,powered};
}
