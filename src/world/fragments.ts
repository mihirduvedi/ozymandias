import * as T from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { mergeVertices, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

function randomFrom(seed:number){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
function grain(x:number,y:number,z:number,seed:number){
 return .018*Math.sin(x*12.1+y*8.7+seed)*Math.sin(z*10.3-x*4.1)
  +.009*Math.sin(x*31.7-y*21.3+z*25.1+seed);
}
// Subdivision gives each broken plane a real chipped surface while preserving its large fracture.
function weathered(raw:T.BufferGeometry,seed:number,steps=9){
 const source=raw.index?raw.toNonIndexed():raw,points=source.attributes.position,positions:number[]=[];
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),normal=new T.Vector3(),ab=new T.Vector3(),ac=new T.Vector3();
 const vertex=(u:number,v:number)=>{
  const p=a.clone().addScaledVector(ab,u/steps).addScaledVector(ac,v/steps);
  // A position-based displacement is identical on both sides of a shared edge.
  const noise=grain(p.x,p.y,p.z,seed),radial=p.clone().normalize();p.addScaledVector(radial,noise);
  positions.push(p.x,p.y,p.z);
 };
 for(let i=0;i<points.count;i+=3){a.fromBufferAttribute(points,i);b.fromBufferAttribute(points,i+1);c.fromBufferAttribute(points,i+2);ab.subVectors(b,a);ac.subVectors(c,a);normal.crossVectors(ab,ac).normalize();
  for(let u=0;u<steps;u++)for(let v=0;v<steps-u;v++){vertex(u,v);vertex(u+1,v);vertex(u,v+1);if(v<steps-u-1){vertex(u+1,v);vertex(u+1,v+1);vertex(u,v+1)}}
 }
 const detailed=new T.BufferGeometry();detailed.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 const welded=mergeVertices(detailed,.00001);detailed.dispose();welded.computeVertexNormals();
 const g=toCreasedNormals(welded,.58);welded.dispose();
 const uv=new Float32Array(g.attributes.position.count*2);for(let i=0;i<g.attributes.position.count;i++){uv[i*2]=g.attributes.position.getX(i)*.3;uv[i*2+1]=g.attributes.position.getZ(i)*.3}g.setAttribute('uv',new T.BufferAttribute(uv,2));
 if(source!==raw)source.dispose();raw.dispose();return g;
}
export function fracturedBlock(seed:number){
 const random=randomFrom(seed),vertices:T.Vector3[]=[];
 // Off-centre corners and missing corner wedges produce fracture planes rather than pebbles.
 for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){
  const corner=new T.Vector3(x*(.7+random()*.3),y*(.55+random()*.4),z*(.65+random()*.35));
  if(x+y+z===3){vertices.push(corner.clone().multiply(new T.Vector3(.54,1,1)),corner.clone().multiply(new T.Vector3(1,.55,1)),corner.clone().multiply(new T.Vector3(1,1,.52)))}else vertices.push(corner);
 }
 return weathered(new ConvexGeometry(vertices),seed);
}
export function brokenLimb(seed:number){
 const random=randomFrom(seed),vertices:T.Vector3[]=[];
 // Part of the carved circumference survives between two irregular break surfaces.
 for(const y of [-1,1])for(let i=0;i<18;i++){const angle=i/18*Math.PI*2,r=.68+.045*Math.sin(angle*3+seed);vertices.push(new T.Vector3(Math.cos(angle)*r,y*(.82+random()*.23)+Math.cos(angle)*.17,Math.sin(angle)*r))}
 return weathered(new ConvexGeometry(vertices),seed,7);
}
export function brokenDrapery(seed:number){
 const vertices:T.Vector3[]=[];
 for(const y of [-1,1])for(const radius of [.82,1.08])for(let i=0;i<=12;i++){
  const a=-.9+i/12*1.8,r=radius+(radius>1?.045*Math.cos(a*30):0);
  vertices.push(new T.Vector3(Math.sin(a)*r,y*.72+Math.sin(a*3+seed)*.08,Math.cos(a)*r));
 }
 // The thick remnant carries an outer arc and sculpted channels, with exposed broken ends.
 const raw=new ConvexGeometry(vertices);raw.translate(0,0,-.65);return weathered(raw,seed,7);
}
