import { describe,it,expect } from 'vitest';
import { navigationInput } from './navigation';
import { boundPosition,boundTarget,WORLD_RADIUS,WORLD_CEILING,viewForLine,terrainHeight,lineForHit,landmarkLines,walkStep,RUIN_SCALE } from './geography';
describe('Spatial keyboard controls',()=>{
 it('uses arrows to look up/down rather than silently moving forward',()=>{const i=navigationInput(new Set(['arrowup','arrowleft']),'walk');expect(i.pitch).toBe(1);expect(i.yaw).toBe(1);expect(i.forward).toBe(0)});
 it('keeps WASD translation separate and normalizes diagonal movement',()=>{const i=navigationInput(new Set(['w','d']),'walk');expect(Math.hypot(i.forward,i.side)).toBeCloseTo(1);expect(i.yaw).toBe(0);expect(i.pitch).toBe(0)});
 it('supports vertical movement and modified arrow panning in both modes',()=>{for(const mode of ['walk','inspect'] as const){expect(navigationInput(new Set([' ']),mode).rise).toBe(1);expect(navigationInput(new Set(['shift',' ']),mode).rise).toBe(-1);expect(navigationInput(new Set(['c']),mode).rise).toBe(-1);const i=navigationInput(new Set(['shift','arrowup']),mode);expect(i.panY).toBe(1);expect(i.pitch).toBe(0)}});
 it('does not keep moving when its pressed-key state is cleared',()=>{const keys=new Set(['w','arrowup',' ']);keys.clear();const i=navigationInput(keys,'walk');expect(i.forward+i.pitch+i.rise+i.side+i.yaw).toBe(0)});
});
describe('The same boundary applies to every camera path',()=>{
 it('clamps an arbitrarily panned or zoomed camera to the circular desert and sky ceiling',()=>{for(let i=0;i<360;i++){const a=i*Math.PI/180;const p=boundPosition([Math.sin(a)*500,1000,Math.cos(a)*500]);expect(Math.hypot(p.position[0],p.position[2])).toBeCloseTo(WORLD_RADIUS);expect(p.position[1]).toBe(WORLD_CEILING);expect(p.limited).toBe(true)}});
 it('keeps the camera above local dunes and releases the boundary notice on return',()=>{const p=boundPosition([30,-500,45]);expect(p.position[1]).toBeCloseTo(terrainHeight(30,45)+1.8);expect(p.limited).toBe(false);expect(boundPosition([24,10,32]).position).toEqual([24,10,32]);expect(boundTarget([999,100,-999])[1]).toBe(44);expect(Math.hypot(...[boundTarget([999,100,-999])[0],boundTarget([999,100,-999])[2]])).toBeCloseTo(70)});
 it('allows flying over stone, but blocks ground-level passage through it',()=>{expect(walkStep(0,4.1*RUIN_SCALE,0,-.4*RUIN_SCALE).z).toBe(4.1*RUIN_SCALE);expect(walkStep(0,4.1*RUIN_SCALE,0,-.4*RUIN_SCALE,10*RUIN_SCALE).z).toBeCloseTo(3.7*RUIN_SCALE)});
});
describe('Exact verse and geometry identity',()=>{
 it('uses the original feet, shattered-face, inscription and distant-sands lines',()=>{expect(landmarkLines).toEqual([0,1,3,10,13]);expect(lineForHit({poemLine:1})).toBe(1);expect(lineForHit({poemLine:3})).toBe(3);expect(lineForHit({poemLine:13})).toBe(13);expect(lineForHit({inscription:true},.4)).toBe(10);expect(lineForHit({inscription:true},.8)).toBe(9);expect(lineForHit({poemLine:99})).toBe(null)});
 it('gives all fourteen selectable verses safe, finite views, with closer views for the spoken inscription',()=>{for(let i=0;i<14;i++){const v=viewForLine(i);expect(v.position.every(Number.isFinite)).toBe(true);expect(v.target.every(Number.isFinite)).toBe(true);expect(boundPosition(v.position).position).toEqual(v.position)}expect(viewForLine(10).position[2]).toBeLessThan(viewForLine(8).position[2]);expect(viewForLine(12).position).not.toEqual(viewForLine(13).position)});
});
