import { readFileSync } from 'node:fs';
import { describe,it,expect } from 'vitest';
import * as T from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
describe('Solid Ramesses portrait',()=>{
 it('has two faces on every welded edge, with no open windows in the cropped stone',()=>{
  const bytes=readFileSync(new URL('../../public/world/ramesses/head.stl',import.meta.url));const raw=new STLLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));raw.deleteAttribute('normal');const geometry=mergeVertices(raw,.0000001);raw.dispose();const index=geometry.index!,edges=new Map<string,number>();
  for(let i=0;i<index.count;i+=3){const triangle=[index.getX(i),index.getX(i+1),index.getX(i+2)];for(let j=0;j<3;j++){const a=triangle[j],b=triangle[(j+1)%3],key=a<b?`${a}:${b}`:`${b}:${a}`;edges.set(key,(edges.get(key)??0)+1)}}
  expect(edges.size).toBeGreaterThan(40_000);expect([...edges.values()].every(n=>n===2)).toBe(true);geometry.dispose();
 });
 it('renders both the portrait and repaired back as outward facing solid surfaces',()=>{
  const bytes=readFileSync(new URL('../../public/world/ramesses/head.stl',import.meta.url)),geometry=new STLLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)),mesh=new T.Mesh(geometry,new T.MeshBasicMaterial());mesh.updateMatrixWorld();
  for(const axis of [new T.Vector3(1,0,0),new T.Vector3(-1,0,0),new T.Vector3(0,1,0),new T.Vector3(0,-1,0),new T.Vector3(0,0,1),new T.Vector3(0,0,-1)]){const ray=new T.Raycaster(axis.clone().multiplyScalar(100),axis.clone().negate());expect(ray.intersectObject(mesh).length).toBeGreaterThan(0)}geometry.dispose();mesh.material.dispose();
 });
});
