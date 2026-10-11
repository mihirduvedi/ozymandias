import fontData from '../../public/world/fonts/cinzel-inscription.json';
import * as T from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { describe,it,expect } from 'vitest';
import { engravedStone, chippedBox, makePedestal, FOOT_BEARING_HEIGHT } from './sculpture';
import { fracturedBlock, brokenLimb } from './fragments';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { enclosedVolume } from './sediment';
describe('The words are recessed geometry',()=>{
 it('places actual letter floors behind a perforated stone face, with intact counters',()=>{
  const font=new FontLoader().parse(fontData);const group=engravedStone(font,['My name is Ozymandias, king of kings:','Look on my works, ye Mighty, and despair!'],new T.MeshStandardMaterial());group.updateMatrixWorld(true);
  const solid=group.children.filter(o=>!(o as T.Mesh).material||!((o as T.Mesh).material as T.Material).transparent);const floor=solid.find(o=>o.userData.poemLine===10) as T.Mesh;
  expect(floor).toBeDefined();const geometry=floor.geometry,index=geometry.index!,positions=geometry.attributes.position;
  let recessed=0,sampled=0;for(let i=0;i<index.count;i+=Math.max(3,Math.floor(index.count/45/3)*3)){
   const p=new T.Vector3();for(let j=0;j<3;j++)p.add(new T.Vector3().fromBufferAttribute(positions,index.getX(i+j)));p.divideScalar(3);floor.localToWorld(p);
   sampled++;const ray=new T.Raycaster(new T.Vector3(p.x,p.y,4),new T.Vector3(0,0,-1));const hit=ray.intersectObjects(solid)[0];if(hit?.object===floor&&hit.point.z<3.04)recessed++;
  }expect(recessed).toBeGreaterThan(25);expect(recessed).toBe(sampled);
  const blank=new T.Raycaster(new T.Vector3(0,1.65,4),new T.Vector3(0,0,-1)).intersectObjects(solid)[0];expect(blank.point.z).toBeGreaterThan(3.04);
 });
});
describe('Colossal anatomy and fractured stone',()=>{
 it('has one flat capital across the full foot footprint and overlapping stone layers',()=>{
  const group=makePedestal(new T.MeshStandardMaterial());group.updateMatrixWorld(true);
  const layers=group.children as T.Mesh[],capital=layers[2],bounds=layers.map(m=>new T.Box3().setFromObject(m));
  expect(bounds[0].max.y-bounds[1].min.y).toBeGreaterThan(.04);expect(bounds[1].max.y-bounds[2].min.y).toBeGreaterThan(.02);
  for(const [cx,cz] of [[-1.9,.05],[1.8,-.35]])for(let x=cx-.8;x<cx+.8;x+=.2)for(let z=cz-.65;z<cz+2;z+=.2){
   const hit=new T.Raycaster(new T.Vector3(x,5,z),new T.Vector3(0,-1,0)).intersectObject(capital)[0];expect(hit).toBeDefined();expect(hit.point.y).toBeCloseTo(3.08,5);expect(FOOT_BEARING_HEIGHT-hit.point.y).toBeLessThan(0);
  }
  layers.forEach(m=>{m.geometry.dispose();(m.material as T.Material).dispose()});
 });
 it('keeps detailed fracture fragments closed for consistent shadows and mass estimates',()=>{
  for(const raw of [fracturedBlock(201),brokenLimb(204),chippedBox(9,.5,6.4,33)]){
   raw.deleteAttribute('normal');raw.deleteAttribute('uv');const g=mergeVertices(raw,.00001),index=g.index!,edges=new Map<string,number>();
   for(let i=0;i<index.count;i+=3){const t=[index.getX(i),index.getX(i+1),index.getX(i+2)];for(let j=0;j<3;j++){const a=t[j],b=t[(j+1)%3],key=a<b?`${a}:${b}`:`${b}:${a}`;edges.set(key,(edges.get(key)??0)+1)}}
   expect(index.count/3).toBeGreaterThan(1000);expect([...edges.values()].every(count=>count===2)).toBe(true);expect(enclosedVolume(g)).toBeGreaterThan(.5);raw.dispose();g.dispose();
  }
 });
});
