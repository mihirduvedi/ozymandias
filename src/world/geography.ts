export type Point = [number, number, number];
export const RUIN_SCALE=3;
export const landmarks = [
 {name:'The encounter', short:'Arrival', lines:[0], position:[24,10,32] as Point, target:[0,4,0] as Point, point:[0,9.5,0] as Point},
 {name:'Two vast and trunkless legs', short:'The legs', lines:[1,2], position:[10,2.2,16] as Point, target:[0,6,0] as Point, point:[1.8,7,0] as Point},
 {name:'A shattered visage', short:'The face', lines:[3,4,5,6,7], position:[-12,4.2,15] as Point, target:[-7,1.8,5.5] as Point, point:[-7,2.3,5.5] as Point},
 {name:'These words appear', short:'The inscription', lines:[8,9,10], position:[0,3,15] as Point, target:[0,2.0,3.1] as Point, point:[0,2.6,3.12] as Point},
 {name:'Nothing beside remains', short:'The sands', lines:[11,12,13], position:[-35,10,36] as Point, target:[8,3,-20] as Point, point:[35,4,-35] as Point},
] .map(l=>{const position=l.position.map(v=>v*RUIN_SCALE) as Point;if(l.short==='Arrival')position[1]=terrainHeight(position[0],position[2])+1.85;return {...l,position,target:l.target.map(v=>v*RUIN_SCALE) as Point,point:l.point.map(v=>v*RUIN_SCALE) as Point}});
export function landmarkForLine(line:number){return landmarks.findIndex(l=>(l.lines as readonly number[]).includes(Math.min(13,Math.max(0,line))))}
export const landmarkLines = [0,1,3,10,13] as const;
export const WORLD_RADIUS = 160;
export const WORLD_CEILING = 75;
export const sandsPanorama={position:[-28,26,94] as Point,target:[0,15,5] as Point};
export function viewForLine(line:number){
 const index=Math.max(0,Math.min(13,line));
 if(index===13)return sandsPanorama;
 const base=landmarks[landmarkForLine(index)];
 const views:Record<number,{position:Point;target:Point}>={
  2:{position:[8,4.8,13],target:[0,3.8,1]},
  4:{position:[-11,3.6,12],target:[-7,1.8,5.5]},
  7:{position:[12.5,4.5,15],target:[7.8,1.1,7.8]},
  9:{position:[0,2.7,14],target:[0,1.9,3.1]},
  10:{position:[0,2.4,14],target:[0,1.5,3.1]},
  11:{position:[12,6,21],target:[3,2,9]},
  12:{position:[-20,11,30],target:[0,4.5,0]},
 };
 const view=views[index];return view?{position:view.position.map(v=>v*RUIN_SCALE) as Point,target:view.target.map(v=>v*RUIN_SCALE) as Point}:{position:base.position,target:base.target};
}
// Picking returns a verse identity, independently of the camera's broader scene group.
export function lineForHit(data:{poemLine?:unknown;inscription?:unknown},uvY?:number){
 if(data.inscription)return uvY!==undefined&&uvY>.57?9:10;
 return typeof data.poemLine==='number'&&Number.isInteger(data.poemLine)&&data.poemLine>=0&&data.poemLine<14?data.poemLine:null;
}
export function terrainHeight(x:number,z:number){
 const r=Math.hypot(x,z), blend=Math.min(1,Math.max(0,(r-24)/50));
 const a=x*.034+z*.022+Math.sin(z*.018)*1.35;
 const b=x*-.018+z*.046+Math.sin(x*.014)*.8;
 const dunes=9*Math.pow((Math.sin(a)+1)*.5,2.6)+5*Math.pow((Math.sin(b)+1)*.5,3)-3;
 return dunes*(1+.35*Math.sin(x*.008-z*.007))*blend*blend + .045*Math.sin(x*1.15+z*.7)*blend;
}
export const colliders=[{x:0,z:0,rx:5.4,rz:3.9,top:3.9},{x:-7,z:5.5,rx:3.3,rz:2.8,top:4.7},{x:-1.9,z:.05,rx:1.5,rz:1.45,top:10.5},{x:1.8,z:-.35,rx:1.5,rz:1.45,top:12.7},{x:7.8,z:7.4,rx:2,rz:2.6,top:2.0}].map(c=>({x:c.x*RUIN_SCALE,z:c.z*RUIN_SCALE,rx:c.rx*RUIN_SCALE,rz:c.rz*RUIN_SCALE,top:c.top*RUIN_SCALE}));
export function boundPosition(position:Point){
 let [x,y,z]=position;const r=Math.hypot(x,z);
 if(r>WORLD_RADIUS){x*=WORLD_RADIUS/r;z*=WORLD_RADIUS/r}
 const floor=terrainHeight(x,z)+1.8;
 y=Math.max(floor,Math.min(WORLD_CEILING,y));
 return {position:[x,y,z] as Point,limited:r>=WORLD_RADIUS-.05||position[1]>=WORLD_CEILING-.05};
}
export function boundTarget(target:Point){
 let [x,y,z]=target;const r=Math.hypot(x,z);
 if(r>70){x*=70/r;z*=70/r}
 y=Math.max(.8,Math.min(44,y));return [x,y,z] as Point;
}
export function walkStep(x:number,z:number,dx:number,dz:number,elevation=0){
 const free=(a:number,b:number)=>colliders.every(c=>terrainHeight(a,b)+1.8+elevation>c.top+.5||((a-c.x)/c.rx)**2+((b-c.z)/c.rz)**2>1);
 const bounded=boundPosition([x+dx,terrainHeight(x+dx,z+dz)+1.8+elevation,z+dz]);
 let [nx,,nz]=bounded.position;
 if(!free(nx,nz)){if(free(nx,z))nz=z;else if(free(x,nz))nx=x;else{nx=x;nz=z}}
 return {x:nx,z:nz,y:Math.min(WORLD_CEILING,terrainHeight(nx,nz)+1.8+elevation)};
}
export function nearbyLandmark(position:Point){let nearest:number|null=null,distance=8*RUIN_SCALE;for(let i=1;i<4;i++){const p=landmarks[i].point,d=Math.hypot(position[0]-p[0],position[1]-p[1],position[2]-p[2]);if(d<distance){distance=d;nearest=i}}return nearest}
export const inspectionPoints=[
 {line:1,label:'Two vast and trunkless legs',point:[1.8,5,1.4]},
 {line:3,label:'A shattered visage',point:[-7,2.8,6.8]},
 {line:7,label:'The hand that mocked them',point:[7.8,1.4,7.4]},
 {line:9,label:'My name is Ozymandias',point:[-3.65,2.32,3.24]},
 {line:10,label:'Look on my works',point:[3.65,1.03,3.24]},
 {line:13,label:'The lone and level sands',point:[-14,.3,-10]},
].map(p=>{const point=p.point.map(v=>v*RUIN_SCALE) as Point;if(p.line===13)point[1]=terrainHeight(point[0],point[2])+.24;return {...p,point}});
