import * as T from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// A continuous, broken hand: wrist fracture, palm, thumb and four carved fingers.
export function fallenHand(){
 const n=96,rings=112,positions:number[]=[],uv:number[]=[],indices:number[]=[];
 const start=-1.0,end=2.45;
 for(let j=0;j<=rings;j++){
  const z=T.MathUtils.lerp(start,end,j/rings),palm=T.MathUtils.smoothstep(z,-.75,.2),fingers=T.MathUtils.smoothstep(z,.7,1.45);
  const width=.58+.60*palm-.17*fingers,height=.64+.29*palm-.34*fingers;
  for(let i=0;i<=n;i++){
   const a=i/n*Math.PI*2,up=Math.max(0,Math.sin(a)),x=Math.cos(a)*width;
   const thumb=.31*Math.exp(-(((z-.25)/.65)**2))*Math.max(0,Math.cos(a));
   let y=.025+height*(.5+.5*Math.sin(a));
   for(const gap of [-.53,0,.53])y-=.09*Math.exp(-(((x-gap)/.064)**2))*fingers*T.MathUtils.smoothstep(up,.2,.75);
   const knuckle=.05*Math.cos(x*12)*Math.exp(-(((z-.85)/.55)**2))*up;
   const tips=(.09*Math.cos((x+.80)*12)-x*.025)*T.MathUtils.smoothstep(z,1.5,end);
   const breakWear=j===0?.055*Math.sin(a*5)+.035*Math.cos(a*11):0;
   positions.push(x+thumb,y+knuckle,z+tips+breakWear);uv.push(x*.3,z*.3);
   if(j<rings&&i<n){const a=j*(n+1)+i,b=a+n+1;indices.push(a,a+1,b,b,a+1,b+1)}
  }
 }
 for(const j of [0,rings]){const c=positions.length/3;positions.push(0,j===0?.34:.31,j===0?start:end);uv.push(0,0);for(let i=0;i<n;i++){const a=j*(n+1)+i;indices.push(...(j===0?[c,a+1,a]:[c,a,a+1]))}}
 const raw=new T.BufferGeometry();raw.setAttribute('position',new T.Float32BufferAttribute(positions,3));raw.setAttribute('uv',new T.Float32BufferAttribute(uv,2));raw.setIndex(indices);
 const geometry=mergeVertices(raw,.00001);raw.dispose();geometry.computeVertexNormals();return geometry;
}
