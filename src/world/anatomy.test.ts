import { readFileSync } from 'node:fs';
import { describe,it,expect,afterAll } from 'vitest';
import * as T from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { enclosedVolume } from './sediment';
import provenance from '../../public/world/anatomy/provenance.json';
const meshCache=new Map<string,T.BufferGeometry>();afterAll(()=>meshCache.forEach(g=>g.dispose()));
function load(name:string){if(meshCache.has(name))return meshCache.get(name)!.clone();const b=readFileSync(new URL(`../../public/world/anatomy/${name}.stl`,import.meta.url));const raw=new STLLoader().parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));raw.deleteAttribute('normal');const g=mergeVertices(raw,.000001);raw.dispose();g.computeVertexNormals();g.computeBoundingBox();meshCache.set(name,g.clone());return g}
describe('Authored anatomical statue fragments',()=>{
 for(const name of ['left-leg','right-leg','hand'])it(`${name} is a closed outward-facing solid with intact contact geometry`,()=>{
  const g=load(name),index=g.index!,edges=new Map<string,number>();
  for(let i=0;i<index.count;i+=3){const tri=[index.getX(i),index.getX(i+1),index.getX(i+2)];for(let j=0;j<3;j++){const a=tri[j],b=tri[(j+1)%3],key=a<b?`${a}:${b}`:`${b}:${a}`;edges.set(key,(edges.get(key)??0)+1)}}
  expect([...edges.values()].every(count=>count===2)).toBe(true);expect(enclosedVolume(g)).toBeGreaterThan(1);expect(Array.from(g.attributes.normal.array).every(Number.isFinite)).toBe(true);
  const center=new T.Vector3(...(provenance.assets.find(a=>a.file.endsWith(`${name}.stl`))!.centerMass as [number,number,number])),mesh=new T.Mesh(g,new T.MeshBasicMaterial());mesh.updateMatrixWorld();for(const direction of [new T.Vector3(0,1,0),new T.Vector3(0,0,1),new T.Vector3(1,0,0)])expect(new T.Raycaster(center.clone().addScaledVector(direction,50),direction.clone().negate()).intersectObject(mesh).length).toBeGreaterThan(0);g.dispose();mesh.material.dispose();
 });
 it('keeps the five modeled toes separate and their nails visible above a connected forefoot',()=>{
  const g=load('left-leg'),mesh=new T.Mesh(g,new T.MeshBasicMaterial());mesh.updateMatrixWorld();
  // Five individually modeled digits span the medial big toe through the short lateral toe.
  const joints=[[-.234,1.708],[.004,1.835],[.162,1.775],[.305,1.645],[.445,1.524]],hits=joints.map(([x,z])=>new T.Raycaster(new T.Vector3(x,2,z),new T.Vector3(0,-1,0)).intersectObject(mesh)[0]);
  expect(hits.every(Boolean)).toBe(true);expect(hits.every(hit=>hit.point.y>.1&&hit.point.y<.55)).toBe(true);g.dispose();mesh.material.dispose();
 });
 it('plants both feet on flat contact pads and keeps the upper shafts over their ankles',()=>{
  for(const name of ['left-leg','right-leg']){const g=load(name),p=g.attributes.position,mesh=new T.Mesh(g,new T.MeshBasicMaterial());mesh.updateMatrixWorld();let pads=0;for(let i=0;i<p.count;i++)if(Math.abs(p.getY(i))<.00001)pads++;expect(g.boundingBox!.min.y).toBeCloseTo(0,5);expect(pads).toBeGreaterThan(20);
   const centers=[2.2,5.4,6.3].map(y=>{const left=new T.Raycaster(new T.Vector3(-20,y,.1),new T.Vector3(1,0,0)).intersectObject(mesh)[0],right=new T.Raycaster(new T.Vector3(20,y,.1),new T.Vector3(-1,0,0)).intersectObject(mesh)[0];expect(left&&right).toBeTruthy();return (left.point.x+right.point.x)/2});expect(Math.max(...centers)-Math.min(...centers)).toBeLessThan(.35);g.dispose();mesh.material.dispose();
  }
 });
 it('breaks the leg ends into uneven relief instead of a single cut plane',()=>{
  for(const name of ['left-leg','right-leg']){
   const g=load(name),mesh=new T.Mesh(g,new T.MeshBasicMaterial());mesh.updateMatrixWorld();const samples:T.Vector3[]=[];
   for(let x=-.6;x<=.6;x+=.2)for(let z=-.5;z<=.5;z+=.2){const hit=new T.Raycaster(new T.Vector3(x,20,z),new T.Vector3(0,-1,0)).intersectObject(mesh)[0];if(hit)samples.push(hit.point)}
   const matrix=new T.Matrix3(),a=Array<number>(9).fill(0),b=new T.Vector3();
   for(const p of samples){const q=[p.x,p.z,1];for(let i=0;i<3;i++){b.setComponent(i,b.getComponent(i)+q[i]*p.y);for(let j=0;j<3;j++)a[j*3+i]+=q[i]*q[j]}}
   matrix.fromArray(a).invert();const fit=b.applyMatrix3(matrix),residual=samples.map(p=>p.y-fit.x*p.x-fit.y*p.z-fit.z);
   expect(samples.length).toBeGreaterThan(20);expect(Math.max(...residual)-Math.min(...residual)).toBeGreaterThan(.22);g.dispose();mesh.material.dispose();
  }
 });
});
