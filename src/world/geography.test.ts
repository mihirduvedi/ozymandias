import { describe,it,expect } from 'vitest';
import { colliders,landmarks,landmarkForLine,terrainHeight,walkStep,nearbyLandmark,WORLD_RADIUS } from './geography';
describe('The walkable desert',()=>{
 it('keeps the monument basin level while the surrounding land has relief',()=>{expect(terrainHeight(0,0)).toBe(0);expect(terrainHeight(-7,5.5)).toBe(0);const heights=[20,50,100,140].flatMap(x=>[20,50,100].map(z=>terrainHeight(x,z)));expect(Math.max(...heights)-Math.min(...heights)).toBeGreaterThan(5)});
 it('grounds every walking step and bounds the navigable area',()=>{for(let i=0;i<1000;i++){const x=Math.sin(i)*140,z=Math.cos(i)*140,p=walkStep(x,z,Math.cos(i)*.16,Math.sin(i)*.16);expect(p.y).toBeCloseTo(terrainHeight(p.x,p.z)+1.8);expect(Math.hypot(p.x,p.z)).toBeLessThanOrEqual(WORLD_RADIUS+.000001)}expect(walkStep(WORLD_RADIUS-.01,0,1,0).x).toBe(WORLD_RADIUS)});
 it('stops the walker outside the pedestal and the fallen head',()=>{for(const c of colliders){let p={x:c.x,z:c.z+c.rz+2,y:1.8};for(let i=0;i<100;i++)p=walkStep(p.x,p.z,0,-.1);expect(((p.x-c.x)/c.rx)**2+((p.z-c.z)/c.rz)**2).toBeGreaterThan(1)}});
 it('slides sideways along a ruin rather than blocking all movement',()=>{const edge=colliders[0].rz+.05,p=walkStep(0,edge,.2,-.1);expect(p.x).toBe(.2);expect(p.z).toBe(edge)});
});
describe('Poem geography',()=>{
 it('re-evaluates proximity independently of the wider reading viewpoints',()=>{expect(nearbyLandmark(landmarks[3].point)).toBe(3);expect(nearbyLandmark(landmarks[3].position)).toBe(null);expect(nearbyLandmark(landmarks[0].position)).toBe(null);expect(nearbyLandmark([-21,9,27])).toBe(2)});
 it('maps every original line exactly once, in source order',()=>{expect(landmarks.flatMap(l=>[...l.lines])).toEqual(Array.from({length:14},(_,i)=>i));expect(Array.from({length:14},(_,i)=>landmarkForLine(i))).toEqual([0,1,1,2,2,2,2,2,3,3,3,4,4,4])});
 it('places every viewpoint above the ground and outside the ruins',()=>{for(const l of landmarks){const [x,y,z]=l.position;expect(y).toBeGreaterThan(terrainHeight(x,z)+.7);for(const c of colliders)expect(((x-c.x)/c.rx)**2+((z-c.z)/c.rz)**2).toBeGreaterThan(1)}});
});
