import * as T from 'three';
import { terrainHeight, RUIN_SCALE } from './geography';

export const GRAVITY=9.81;
export const STONE_DENSITY=2650;
// A bounded dry-sand foundation approximation, not a granular material solver.
const BED_STIFFNESS=35_000;
const REPOSE_SLOPE=Math.tan(32*Math.PI/180);
export type SandImprint={x:number;z:number;rx:number;rz:number;angle:number;volume:number;box?:boolean;amplitude:number;width:number;phase:number;profile?:number[]};
export function settlementDepth(mass:number,area:number,height:number,maxBurial=.28){
 return Math.min(height*maxBurial,Math.max(0,mass)*GRAVITY/(Math.max(.01,area)*BED_STIFFNESS));
}
function footprint(s:SandImprint,theta:number){
 if(s.box)return 1/Math.max(Math.abs(Math.cos(theta)),Math.abs(Math.sin(theta)));
 if(!s.profile)return 1;
 const t=((theta/(Math.PI*2)+1)%1)*s.profile.length,index=Math.floor(t);return T.MathUtils.lerp(s.profile[index],s.profile[(index+1)%s.profile.length],t-index);
}
function deposit(s:SandImprint,r:number,theta:number){
 const edge=footprint(s,theta),direction=theta+s.angle;
 // Scoured shoulders, irregular small lobes and a larger wind-aligned lee deposit.
 const lee=1+.50*Math.cos(direction-.308)+.18*Math.sin(theta*3+s.phase);
 const offset=.04+.06*Math.sin(theta*2+s.phase);
 const core=1-Math.exp(-((r/.7)**4));
 return Math.exp(-(((r-edge-offset)/s.width)**2))*lee*core;
}
export function sandImprint(x:number,z:number,rx:number,rz:number,volume:number,box=false,angle=0,profile?:number[]):SandImprint{
 const s:SandImprint={x,z,rx,rz,volume,box,angle,profile,amplitude:0,width:.26,phase:x*.73+z*.91};
 for(let i=0;i<18;i++){
  let integral=0;const da=Math.PI*2/64,dr=.025;
  for(let a=0;a<64;a++)for(let r=dr/2;r<1.5+s.width*4;r+=dr)integral+=deposit(s,r,(a+.5)*da)*r*dr*da;
  s.amplitude=volume/(rx*rz*integral);
  // Check both radial and angular gradients; a lee lobe cannot exceed dry sand's repose.
  let slope=0;
  for(let a=0;a<32;a++)for(let r=.05;r<1.5+s.width*3;r+=.08){const theta=a*Math.PI/16,h=deposit(s,r,theta),radial=(deposit(s,r+.01,theta)-h)/.01,angular=(deposit(s,r,theta+.01)-h)/(.01*r);slope=Math.max(slope,Math.hypot(radial,angular)/Math.min(rx,rz)*s.amplitude)}
  if(slope<REPOSE_SLOPE*.92)break;s.width*=1.16;
 }
 return s;
}
export function displacedSandHeight(x:number,z:number,imprints:readonly SandImprint[]){
 let height=0;
 for(const s of imprints){const dx=x-s.x,dz=z-s.z,c=Math.cos(s.angle),n=Math.sin(s.angle),a=(dx*c+dz*n)/s.rx,b=(-dx*n+dz*c)/s.rz,r=Math.hypot(a,b);if(r>1.5+s.width*3.5)continue;
  height+=s.amplitude*deposit(s,r,Math.atan2(b,a));
 }return height;
}
export function windRippleHeight(x:number,z:number){
 const patch=.5+.5*Math.sin(x*.13+Math.sin(z*.11)*2.1),warp=1.8*Math.sin(z*.23)+.9*Math.sin(x*.14-z*.09);
 const phase=x*4.1+z*1.3+warp;
 return (.004+.012*patch)*Math.sin(phase)+.018*Math.sin(x*.47+z*.31)*Math.sin(z*.17-x*.11);
}
export function enclosedVolume(geometry:T.BufferGeometry){
 const p=geometry.attributes.position,index=geometry.index,count=index?.count??p.count;let volume=0;
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 for(let i=0;i<count;i+=3){a.fromBufferAttribute(p,index?index.getX(i):i);b.fromBufferAttribute(p,index?index.getX(i+1):i+1);c.fromBufferAttribute(p,index?index.getX(i+2):i+2);volume+=a.dot(b.cross(c))/6}return Math.abs(volume);
}
export function settleStone(object:T.Object3D,geometry:T.BufferGeometry,volume:number,imprints:SandImprint[],bearingFraction=.52,maxBurial=.28){
 object.position.y=0;object.updateWorldMatrix(true,false);const p=geometry.attributes.position,point=new T.Vector3();const bounds=new T.Box3();let contact=-Infinity;
 // Contact uses transformed vertices and the local slope, not the stone's centre.
 const matrix=object.matrixWorld.clone(),parentScale=new T.Vector3(1,1,1),parentPosition=new T.Vector3();object.parent?.getWorldScale(parentScale);object.parent?.getWorldPosition(parentPosition);
 for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(matrix);bounds.expandByPoint(point);contact=Math.max(contact,terrainHeight(point.x,point.z)-point.y)}
 const size=bounds.getSize(new T.Vector3());volume*=parentScale.x*parentScale.y*parentScale.z;const mass=volume*STONE_DENSITY;
 const depth=Math.max(settlementDepth(mass,size.x*size.z*bearingFraction,size.y,maxBurial),size.y*(object.userData.driftBurial??0));
 object.position.y=(contact-depth-parentPosition.y)/parentScale.y;
 const centre=bounds.getCenter(new T.Vector3()),rx=Math.max(.12,size.x*.5),rz=Math.max(.12,size.z*.5),profile=Array<number>(32).fill(.25);
 // Cross-section at the buried level, sampled from the real rotated stone geometry.
 for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(matrix);if(point.y>bounds.min.y+depth+size.y*.12)continue;const a=(point.x-centre.x)/rx,b=(point.z-centre.z)/rz,theta=(Math.atan2(b,a)/(Math.PI*2)+1)%1,bin=Math.floor(theta*32);profile[bin]=Math.max(profile[bin],Math.hypot(a,b))}
 const smooth=profile.map((r,i)=>(profile[(i+31)%32]+r*2+profile[(i+1)%32])/4);
 const displaced=volume*Math.min(.55,depth/Math.max(.01,size.y))*.45;
 imprints.push(sandImprint(centre.x,centre.z,rx,rz,displaced,false,0,smooth));
 object.userData.massKg=mass;object.userData.settlementMetres=depth;
 return {mass,depth,contact};
}

export function makeSandBed(material:T.MeshStandardMaterial,imprints:readonly SandImprint[],surface=terrainHeight){
 const group=new T.Group();group.name='Dunes and displaced sand';
 const spacing=1000/220,extent=spacing*Math.ceil(23.4*RUIN_SCALE/spacing);
 const coarse=new T.PlaneGeometry(1000,1000,220,220);coarse.rotateX(-Math.PI/2);
 const p=coarse.attributes.position,uv=coarse.attributes.uv,index=coarse.index!,kept:number[]=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,surface(x,z));uv.setXY(i,x/2,z/2)}
 // Replace the centre with a genuinely sculpted bed; no overlaid decal or dark contact halo.
 for(let i=0;i<index.count;i+=3){const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2),x=(p.getX(a)+p.getX(b)+p.getX(c))/3,z=(p.getZ(a)+p.getZ(b)+p.getZ(c))/3;if(Math.abs(x)>=extent||Math.abs(z)>=extent)kept.push(a,b,c)}
 coarse.setIndex(kept);coarse.computeVertexNormals();
 const detail=new T.PlaneGeometry(extent*2,extent*2,392,392);detail.rotateX(-Math.PI/2);
 const local=detail.attributes.position,localUv=detail.attributes.uv;
 const coarseHeight=(x:number,z:number)=>{const a=Math.floor(x/spacing)*spacing,b=Math.floor(z/spacing)*spacing,u=(x-a)/spacing,v=(z-b)/spacing,A=surface(a,b),B=surface(a,b+spacing),C=surface(a+spacing,b+spacing),D=surface(a+spacing,b);return u+v<=1?A+(D-A)*u+(B-A)*v:C+(B-C)*(1-u)+(D-C)*(1-v)};
 for(let i=0;i<local.count;i++){const x=local.getX(i),z=local.getZ(i),edge=T.MathUtils.smoothstep(extent-Math.max(Math.abs(x),Math.abs(z)),0,2),height=T.MathUtils.lerp(coarseHeight(x,z),surface(x,z),edge);local.setY(i,height+(displacedSandHeight(x,z,imprints)+windRippleHeight(x,z))*edge);localUv.setXY(i,x/2,z/2)}detail.computeVertexNormals();
 for(const geometry of [coarse,detail]){const mesh=new T.Mesh(geometry,material);mesh.receiveShadow=true;mesh.userData.poemLine=13;group.add(mesh)}
 // Sample the exact rendered triangles for dust contact, including deposited sediment.
 const sample=(geometry:T.BufferGeometry,half:number,segments:number,x:number,z:number)=>{
  const u=T.MathUtils.clamp((x+half)/(half*2)*segments,0,segments-.000001),v=T.MathUtils.clamp((z+half)/(half*2)*segments,0,segments-.000001),i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,p=geometry.attributes.position,k=j*(segments+1)+i,A=p.getY(k),B=p.getY(k+segments+1),C=p.getY(k+segments+2),D=p.getY(k+1);
  return a+b<=1?A+(D-A)*a+(B-A)*b:C+(B-C)*(1-a)+(D-C)*(1-b);
 };
 return Object.assign(group,{surfaceHeight:(x:number,z:number)=>Math.abs(x)<extent&&Math.abs(z)<extent?sample(detail,extent,392,x,z):sample(coarse,500,220,x,z)});
}
