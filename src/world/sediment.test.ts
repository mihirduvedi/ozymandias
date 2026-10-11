import { describe,it,expect } from 'vitest';
import * as T from 'three';
import { GRAVITY,enclosedVolume,settlementDepth,sandImprint,displacedSandHeight,settleStone,makeSandBed,type SandImprint } from './sediment';
import { ballisticHop } from './atmosphere';
describe('Gravity and stone contact',()=>{
 it('returns a wind-driven grain to the bed and bounds its peak by v²/2g',()=>{
  for(const velocity of [.35,.6,.95]){expect(ballisticHop(0,velocity)).toBe(0);expect(ballisticHop(2*velocity/GRAVITY,velocity)).toBeCloseTo(0);expect(ballisticHop(velocity/GRAVITY,velocity)).toBeCloseTo(velocity**2/(2*GRAVITY));expect(ballisticHop(1,velocity)).toBe(0)}
 });
 it('settles a heavier stone further while spreading its weight reduces settlement',()=>{
  expect(settlementDepth(2000,2,2)).toBeGreaterThan(settlementDepth(1000,2,2));expect(settlementDepth(2000,4,2)).toBeLessThan(settlementDepth(2000,2,2));expect(settlementDepth(1e9,1,1)).toBeLessThanOrEqual(.28);
 });
 it('grounds transformed vertices instead of trusting an arbitrary centre height',()=>{
  const geometry=new T.BoxGeometry(2,2,2),stone=new T.Mesh(geometry);stone.position.set(3,20,2);stone.rotation.z=.22;const imprints:SandImprint[]=[];
  const volume=enclosedVolume(geometry);expect(volume).toBeCloseTo(8);const result=settleStone(stone,geometry,volume,imprints);stone.updateMatrixWorld();const bounds=new T.Box3().setFromObject(stone);
  expect(bounds.min.y).toBeCloseTo(-result.depth);expect(result.mass).toBe(8*2650);expect(imprints[0].volume).toBeGreaterThan(0);geometry.dispose();
 });
 it('allows accumulated drifts to half-bury a stone while preserving real ground intersection',()=>{
  const g=new T.BoxGeometry(2,2,2),stone=new T.Mesh(g);stone.position.set(5,0,4);stone.userData.driftBurial=.53;const imprints:SandImprint[]=[];const result=settleStone(stone,g,8,imprints,.52,.58);stone.updateMatrixWorld();expect(result.depth).toBeGreaterThanOrEqual(1.06);expect(result.depth).toBeLessThanOrEqual(1.16);expect(new T.Box3().setFromObject(stone).min.y).toBeCloseTo(-result.depth);expect(imprints[0].profile).toHaveLength(32);g.dispose();
 });
});
describe('Displaced sand',()=>{
 it('joins the detailed local bed to the actual distant dune triangles without a height step',()=>{
  const material=new T.MeshStandardMaterial(),bed=makeSandBed(material,[]);bed.updateMatrixWorld(true);const detail=bed.children[1] as T.Mesh;detail.geometry.computeBoundingBox();const edge=detail.geometry.boundingBox!.max.x;
  for(const z of [-51.3,-24.6,4.1,39.7,61.8]){const heights=[edge-.001,edge+.001].map(x=>new T.Raycaster(new T.Vector3(x,100,z),new T.Vector3(0,-1,0)).intersectObjects(bed.children)[0]?.point.y);expect(heights.every(Number.isFinite)).toBe(true);expect(Math.abs(heights[0]-heights[1])).toBeLessThan(.003);expect(bed.surfaceHeight(edge-.001,z)).toBeCloseTo(heights[0],4);expect(bed.surfaceHeight(edge+.001,z)).toBeCloseTo(heights[1],4)}for(const m of bed.children)(m as T.Mesh).geometry.dispose();material.dispose();
 });
 it('returns the displaced volume in the surrounding berm without an infinite halo',()=>{
  for(const box of [false,true]){const s=sandImprint(0,0,1.2,.9,.2,box),step=.025;let volume=0;for(let x=-5;x<5;x+=step)for(let z=-5;z<5;z+=step)volume+=displacedSandHeight(x,z,[s])*step*step;expect(volume).toBeCloseTo(.2,2);expect(displacedSandHeight(10,10,[s])).toBe(0)}
 });
 it('keeps an isolated deposit below a dry-sand angle of repose',()=>{
  const s=sandImprint(0,0,1,.6,.8),step=.01;let slope=0;for(let x=-3;x<3;x+=.04)for(let z=-3;z<3;z+=.04){const h=displacedSandHeight(x,z,[s]),dx=(displacedSandHeight(x+step,z,[s])-h)/step,dz=(displacedSandHeight(x,z+step,[s])-h)/step;slope=Math.max(slope,Math.hypot(dx,dz))}expect(slope).toBeLessThan(Math.tan(32*Math.PI/180));
 });
 it('follows irregular footprints instead of repeating an identical circular berm',()=>{
  const jagged=sandImprint(0,0,1,.8,.1,false,0,[.55,.80,1,.75,.60,.95,.70,.8]),round=sandImprint(0,0,1,.8,.1);const a=Array.from({length:24},(_,i)=>displacedSandHeight(Math.cos(i*Math.PI/12),Math.sin(i*Math.PI/12)*.8,[jagged])),b=Array.from({length:24},(_,i)=>displacedSandHeight(Math.cos(i*Math.PI/12),Math.sin(i*Math.PI/12)*.8,[round]));expect(a.some((h,i)=>Math.abs(h-b[i])>.002)).toBe(true);
 });
});
