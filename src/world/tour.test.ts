import { describe,it,expect } from 'vitest';
import { tourReducer,tourHolds,tourViewForLine } from './tour';
import { boundPosition,boundTarget,colliders } from './geography';
describe('Guided reading',()=>{
 it('waits for arrival, and reads every line exactly once before holding the ending',()=>{
  let state=tourReducer(null,{type:'start',motion:true});
  const seen:number[]=[];
  for(let i=0;i<14;i++){
   expect(state?.line).toBe(i);expect(tourReducer(state,{type:'elapsed'})).toBe(state);
   state=tourReducer(state,{type:'arrive',line:i});seen.push(state!.line);
   state=tourReducer(state,{type:'elapsed'});
  }
  expect(seen).toEqual(Array.from({length:14},(_,i)=>i));expect(state).toMatchObject({line:13,finished:true,playing:false});
 });
 it('pauses for manual steps, ignores late arrivals and automatically reads with motion off',()=>{
  let state=tourReducer(null,{type:'start',motion:false});expect(state?.playing).toBe(true);
  state=tourReducer(state,{type:'step',line:4});expect(tourReducer(state,{type:'arrive',line:3})).toBe(state);
  state=tourReducer(state,{type:'arrive',line:4});expect(tourReducer(state,{type:'elapsed'})).toBe(state);
  state=tourReducer(state,{type:'toggle'});expect(state?.playing).toBe(true);
  state=tourReducer(state,{type:'pause'});expect(state?.playing).toBe(false);
  expect(tourReducer(state,{type:'leave'})).toBeNull();
 });
 it('keeps tour cameras outside solids and within the shared movement limits',()=>{
  for(let i=0;i<14;i++){
   const {position,target}=tourViewForLine(i);expect(boundPosition(position).position).toEqual(position);expect(boundTarget(target)).toEqual(target);
   for(const c of colliders){const [x,y,z]=position;expect(y>c.top+.5||((x-c.x)/c.rx)**2+((z-c.z)/c.rz)**2>1).toBe(true)}
   expect(Math.hypot(...position.map((v,j)=>v-target[j]))).toBeLessThan(110);
  }
  expect(new Set(Array.from({length:14},(_,i)=>JSON.stringify(tourViewForLine(i)))).size).toBe(14);
  expect(tourHolds[13]).toBeGreaterThan(tourHolds[8]);
 });
 it('reframes repeated selections and waits for a new arrival after interruption or responsive reframing',()=>{
  let state=tourReducer(null,{type:'start',motion:true});state=tourReducer(state,{type:'arrive',line:0});
  const revision=state!.revision;state=tourReducer(state,{type:'step',line:0});expect(state!.revision).toBeGreaterThan(revision);expect(state!.arrived).toBe(false);
  state=tourReducer(state,{type:'arrive',line:0});state=tourReducer(state,{type:'toggle'});state=tourReducer(state,{type:'depart',line:0});expect(tourReducer(state,{type:'elapsed'})).toBe(state);
  state=tourReducer(state,{type:'arrive',line:0});state=tourReducer(state,{type:'interrupt'});expect(state).toMatchObject({playing:false,arrived:false});
 });
});
