import { describe,it,expect } from 'vitest';
import { visionLandmarks,visionLandmarkForLine,visionViewForLine,visionTerrain,visionBoundPosition,visionWalkStep,visionColliders,VISION_RADIUS } from './vision-geography';
import { worldProfiles } from './profiles';
import { tourReducer } from './tour';
describe('The Second Coming world',()=>{
 it('preserves a single identity for all twenty-two lines, with a distinct subject at each viewpoint',()=>{
  expect(visionLandmarks.flatMap(p=>p.lines).sort((a,b)=>a-b)).toEqual(Array.from({length:22},(_,i)=>i));
  for(let i=0;i<22;i++)expect(visionLandmarkForLine(i)).toBeGreaterThanOrEqual(0);
  expect(new Set(Array.from({length:22},(_,i)=>JSON.stringify(visionViewForLine(i)))).size).toBe(22);
 });
 it('carves the tide below the surrounding land instead of laying water over sand',()=>{
  expect(visionTerrain(-43,-10)).toBe(-3);expect(visionTerrain(0,0)).toBeCloseTo(0);expect(visionTerrain(-20,-10)).toBeGreaterThan(-.2);
 });
 it('keeps all tour destinations and the connecting paths above terrain and outside solids',()=>{
  for(let i=0;i<22;i++){
   const p=visionViewForLine(i).position;expect(visionBoundPosition(p).position).toEqual(p);
   const a=visionViewForLine(Math.max(0,i-1)).position;
   for(let j=0;j<=20;j++){
    const t=j/20,[x,y,z]=a.map((v,k)=>v+(p[k]-v)*t);expect(y).toBeGreaterThan(visionTerrain(x,z)+1.75);
    for(const c of visionColliders)expect(y>c.top+.5||((x-c.x)/c.rx)**2+((z-c.z)/c.rz)**2>1).toBe(true);
   }
  }
 });
 it('bounds wandering, prevents walking through the tide, and allows flight over it',()=>{
  expect(visionBoundPosition([400,900,400]).limited).toBe(true);const p=visionBoundPosition([400,900,400]).position;expect(Math.hypot(p[0],p[2])).toBeCloseTo(VISION_RADIUS);
  let walker={x:-43,z:24,y:1.8};for(let i=0;i<150;i++)walker=visionWalkStep(walker.x,walker.z,0,-.4);
  expect(walker.z).toBeGreaterThanOrEqual(22);expect(visionWalkStep(-43,24,0,-40,12).z).toBe(-16);
 });
 it('shares the reading state machine without truncating Yeats to Shelley’s fourteen lines',()=>{
  let state=tourReducer(null,{type:'start',motion:true,total:22});
  for(let i=0;i<22;i++){expect(state?.line).toBe(i);state=tourReducer(state,{type:'arrive',line:i});state=tourReducer(state,{type:'elapsed'})}
  expect(state).toMatchObject({line:21,finished:true,playing:false});expect(worldProfiles['the-second-coming'].holds).toHaveLength(22);expect(worldProfiles.ozymandias.holds).toHaveLength(14);
 });
});
