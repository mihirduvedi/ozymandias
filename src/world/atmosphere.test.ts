import { describe,it,expect } from 'vitest';
import * as T from 'three';
import { gustStrength, sandTransport, DesertAtmosphere, ballisticHop } from './atmosphere';
describe('Passing desert wind',()=>{
 it('leaves long quiet gaps and brings a gradual gust instead of continuous dust',()=>{
  for(const t of [0,2,12,17,35,41,60])expect(gustStrength(t)).toBe(0);
  expect(gustStrength(7)).toBeCloseTo(.82);expect(gustStrength(27.5)).toBe(1);
  expect(gustStrength(3.001)).toBeLessThan(.001);expect(gustStrength(10.999)).toBeLessThan(.001);
 });
 it('has a finite, bounded and continuous envelope across the loop',()=>{
  for(let t=0;t<140;t+=.02){expect(gustStrength(t)).toBeGreaterThanOrEqual(0);expect(gustStrength(t)).toBeLessThanOrEqual(1)}
  expect(gustStrength(67)).toBe(0);expect(gustStrength(67+7)).toBeCloseTo(gustStrength(7));
 });
 it('keeps sparse transport in quiet intervals and short gravity-bound hops',()=>{
  expect(sandTransport(0)).toBe(.18);expect(sandTransport(27.5)).toBe(1);
  for(const v of [.18,.3,.58]){const duration=2*v/9.81;expect(ballisticHop(duration,v)).toBeCloseTo(0);expect(ballisticHop(duration/2,v)).toBeLessThan(.018)}
 });
 it('keeps ground trails alive and world anchored when the camera turns or crosses a patch boundary',()=>{
  const air=new DesertAtmosphere(),camera=new T.PerspectiveCamera();air.setSurface((x,z)=>.07*x+.02*z);camera.position.set(12.9,3,0);
  const quiet=air.update(0,camera),mesh=air.group.children.find(o=>o.name==='Low sand saltation trails') as T.Mesh,geometry=mesh.geometry;
  expect(quiet.active).toBeGreaterThan(100);const before=Array.from(geometry.attributes.trailEnd.array);camera.rotation.y=Math.PI;air.update(0,camera);expect(Array.from(geometry.attributes.trailEnd.array)).toEqual(before);
  camera.position.x=13.1;air.update(0,camera);const p=geometry.attributes.trailEnd;let overlap=0;
  for(let i=0;i<p.count;i++){if(Math.abs(p.getX(i)-before[i*3])<.001&&Math.abs(p.getZ(i)-before[i*3+2])<.001)overlap++;const bed=.07*p.getX(i)+.02*p.getZ(i);expect(p.getY(i)-bed).toBeGreaterThan(0);expect(p.getY(i)-bed).toBeLessThan(.021)}expect(overlap/p.count).toBeGreaterThan(.9);
  air.group.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(o.material as T.Material).dispose()}});
 });
});
