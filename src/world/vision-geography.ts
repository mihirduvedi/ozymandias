import { WORLD_CEILING, type Point } from './geography';
export const VISION_RADIUS=200,VISION_CEILING=WORLD_CEILING;
export const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
export const desertWeight=(z:number)=>1-smooth(-65,-25,z);
export function visionTerrain(x:number,z:number){
 const coast=1-desertWeight(z),far=smooth(65,130,Math.abs(x));
 const moor=(.12*Math.sin(x*.13)*Math.sin(z*.09)+far*(3+2*Math.sin(x*.045+z*.04)))*coast;
 const dunes=(Math.sin(x*.031+z*.015+Math.sin(z*.01))*4+Math.sin(z*.043-x*.013)*2+4)*smooth(95,155,Math.hypot(x,z+90))*desertWeight(z);
 const basin=Math.hypot((x+43)/17,(z+10)/29);
 const sea=coast*8*smooth(75,93,-x);
 return (moor+dunes)*(smooth(.75,1.25,basin))-3*(1-smooth(.75,1.25,basin))-sea;
}
const view=(x:number,height:number,z:number,target:Point)=>({position:[x,visionTerrain(x,z)+height,z] as Point,target});
const views=[
 view(-12,4.3,59,[-22,8.2,48]),
 view(-15,1.9,58,[-22,1.7,48]),
 view(-11,2.1,35,[-22,2.6,20]),
 view(-8,2.1,26,[-23,1.5,20]),
 view(-12,2.2,6,[-43,-.8,-10]),
 view(-10,2.1,-2,[-28,.3,-8]),
 view(-8,2.1,-12,[-24,1.3,17]),
 view(-4,2.1,-21,[-17,3.7,10]),
 view(-1,2.1,-30,[25,10,-82]),
 view(2,2.1,-36,[25,11,-82]),
 view(4,2.1,-44,[25,13,-82]),
 view(2,2.1,-51,[25,10,-82]),
 view(-1,2.1,-57,[10,.4,-68]),
 view(-8,2.6,-66,[25,8.5,-82]),
 view(5,4.6,-110,[22.7,12.6,-88]),
 view(-4,2.6,-117,[25,5,-82]),
 view(-5,3.3,-122,[25,22,-82]),
 view(-6,2.1,-130,[-25,5,-175]),
 view(-9,2.1,-135,[25,9,-82]),
 view(-12,2.1,-141,[-5,.75,-139]),
 view(-15,2.1,-147,[25,10,-82]),
 view(-25,2.1,-156,[-25,5,-175]),
];
export function visionViewForLine(line:number){return views[Math.max(0,Math.min(21,line))]}
export const visionArrival=view(9,1.9,86,[-22,7,48]);
export const visionLandmarks=[
 {name:'The widening gyre',short:'The falcon',lines:[0,1],...views[1],point:[-22,2,48] as Point},
 {name:'The centre cannot hold',short:'The centre',lines:[2,3,6,7],...views[2],point:[-22,2,20] as Point},
 {name:'The blood-dimmed tide',short:'The tide',lines:[4,5],...views[4],point:[-43,-.8,-10] as Point},
 {name:'A waste of desert sand',short:'The vision',lines:[8,9,10,11,12],...views[12],point:[10,.4,-68] as Point},
 {name:'A shape with lion body',short:'The beast',lines:[13,14,15,16,18,20],...views[13],point:[25,14,-82] as Point},
 {name:'A rocking cradle',short:'The cradle',lines:[19],...views[19],point:[-5,1,-139] as Point},
 {name:'Towards Bethlehem',short:'The threshold',lines:[17,21],...views[21],point:[-25,5,-175] as Point},
];
export function visionLandmarkForLine(line:number){return visionLandmarks.findIndex(l=>l.lines.includes(Math.max(0,Math.min(21,line))))}
export const visionLandmarkLines=[0,2,4,12,13,19,21];
export const visionMarkers=[
 {line:1,label:'The falcon cannot hear the falconer',point:[-22,2,48] as Point},
 {line:2,label:'The centre cannot hold',point:[-22,1,20] as Point},
 {line:4,label:'The blood-dimmed tide',point:[-43,-.8,-10] as Point},
 {line:13,label:'A shape with lion body and the head of a man',point:[25,10,-82] as Point},
 {line:14,label:'A gaze blank and pitiless',point:[22.7,12.6,-88] as Point},
 {line:19,label:'A rocking cradle',point:[-5,1,-139] as Point},
 {line:21,label:'Towards Bethlehem',point:[-25,5,-175] as Point},
];
const courtWalls=Array.from({length:42},(_,i)=>{const a=(i/41*1.55+.20)*Math.PI;return {x:-22+Math.cos(a)*9.4,z:20+Math.sin(a)*9.4,rx:.74,rz:.74,top:3.1}});
const thresholdWalls=[-1,1].flatMap(side=>Array.from({length:6},(_,i)=>({x:-25+side*(8.8+i*1.73),z:-174.35,rx:.9,rz:1,top:3.6})));
export const visionColliders=[...courtWalls,...thresholdWalls,
 {x:25,z:-82,rx:6.6,rz:11.8,top:18},
 {x:-43,z:-10,rx:19,rz:32,top:1.5},
 {x:-22,z:48,rx:.5,rz:.5,top:2.5},
 {x:-30.9,z:-175,rx:1.6,rz:1.8,top:11},
 {x:-19.1,z:-175,rx:1.6,rz:1.8,top:11},
];
export const visionTourHolds=[7,8,8,6,9,8,6,7,6,5,6,8,7,10,12,9,9,7,9,10,9,16];
export function visionBoundPosition(p:Point){let [x,y,z]=p;const r=Math.hypot(x,z);if(r>VISION_RADIUS){x*=VISION_RADIUS/r;z*=VISION_RADIUS/r}y=Math.max(visionTerrain(x,z)+1.8,Math.min(VISION_CEILING,y));return {position:[x,y,z] as Point,limited:r>=VISION_RADIUS-.05||p[1]>=VISION_CEILING-.05}}
export function visionBoundTarget(p:Point){return [Math.max(-190,Math.min(190,p[0])),Math.max(-3,Math.min(50,p[1])),Math.max(-195,Math.min(140,p[2]))] as Point}
export function visionWalkStep(x:number,z:number,dx:number,dz:number,elevation=0){
 const free=(a:number,b:number)=>!(a<-81&&b>-25&&elevation<7)&&visionColliders.every(c=>visionTerrain(a,b)+1.8+elevation>c.top+.5||((a-c.x)/c.rx)**2+((b-c.z)/c.rz)**2>1);
 let [nx,,nz]=visionBoundPosition([x+dx,visionTerrain(x+dx,z+dz)+1.8+elevation,z+dz]).position;
 if(!free(nx,nz)){if(free(nx,z))nz=z;else if(free(x,nz))nx=x;else{nx=x;nz=z}}
 return {x:nx,z:nz,y:Math.min(VISION_CEILING,visionTerrain(nx,nz)+1.8+elevation)};
}
