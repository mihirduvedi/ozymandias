import * as T from 'three';
import { displacedSandHeight,windRippleHeight,type SandImprint } from './sediment';
import { visionTerrain,desertWeight } from './vision-geography';

// Yeats's long route needs detail under EVERY subject, not only at the origin.
export function makeVisionBed(material:T.MeshStandardMaterial,imprints:readonly SandImprint[]){
 const group=new T.Group(),spacing=1000/220,xHalf=14*spacing,zMin=-43*spacing,zMax=24*spacing;
 const coarse=new T.PlaneGeometry(1000,1000,220,220);coarse.rotateX(-Math.PI/2);
 const cp=coarse.attributes.position,cu=coarse.attributes.uv,ci=coarse.index!,kept:number[]=[];
 for(let i=0;i<cp.count;i++){const x=cp.getX(i),z=cp.getZ(i);cp.setY(i,visionTerrain(x,z));cu.setXY(i,x/2,z/2)}
 for(let i=0;i<ci.count;i+=3){const a=ci.getX(i),b=ci.getX(i+1),c=ci.getX(i+2),x=(cp.getX(a)+cp.getX(b)+cp.getX(c))/3,z=(cp.getZ(a)+cp.getZ(b)+cp.getZ(c))/3;if(Math.abs(x)>=xHalf||z<=zMin||z>=zMax)kept.push(a,b,c)}coarse.setIndex(kept);coarse.computeVertexNormals();
 const nx=336,nz=804,detail=new T.PlaneGeometry(xHalf*2,zMax-zMin,nx,nz);detail.rotateX(-Math.PI/2);detail.translate(0,0,(zMax+zMin)/2);
 const coarseHeight=(x:number,z:number)=>{const a=Math.floor(x/spacing)*spacing,b=Math.floor(z/spacing)*spacing,u=(x-a)/spacing,v=(z-b)/spacing,A=visionTerrain(a,b),B=visionTerrain(a,b+spacing),C=visionTerrain(a+spacing,b+spacing),D=visionTerrain(a+spacing,b);return u+v<=1?A+(D-A)*u+(B-A)*v:C+(B-C)*(1-u)+(D-C)*(1-v)};
 const p=detail.attributes.position,uv=detail.attributes.uv;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),edge=T.MathUtils.smoothstep(Math.min(xHalf-Math.abs(x),z-zMin,zMax-z),0,2),ripple=windRippleHeight(x,z)*(.35+.65*desertWeight(z));p.setY(i,T.MathUtils.lerp(coarseHeight(x,z),visionTerrain(x,z),edge)+(displacedSandHeight(x,z,imprints)+ripple)*edge);uv.setXY(i,x/2,z/2)}detail.computeVertexNormals();
 for(const geometry of [coarse,detail]){const mesh=new T.Mesh(geometry,material);mesh.receiveShadow=true;group.add(mesh)}
 const surfaceHeight=(x:number,z:number)=>{
  if(Math.abs(x)>=xHalf||z<=zMin||z>=zMax)return coarseHeight(x,z);
  const u=T.MathUtils.clamp((x+xHalf)/(xHalf*2)*nx,0,nx-.000001),v=T.MathUtils.clamp((z-zMin)/(zMax-zMin)*nz,0,nz-.000001),i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,k=j*(nx+1)+i,A=p.getY(k),B=p.getY(k+nx+1),C=p.getY(k+nx+2),D=p.getY(k+1);
  return a+b<=1?A+(D-A)*a+(B-A)*b:C+(B-C)*(1-a)+(D-C)*(1-b);
 };return Object.assign(group,{surfaceHeight});
}
