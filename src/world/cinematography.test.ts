import { describe,it,expect } from 'vitest';
import { Vector3,PerspectiveCamera } from 'three';
import { FilmPath,ReadingClock,ReadingDolly,SmoothFilmPath,stillCamera,panoramaFrame } from './cinematography';
import { tourTravelSeconds } from './tour';
import { worldProfiles } from './profiles';
import { makeFlightBird,birdFlight } from './birds';
import { pawCycle } from './beast-motion';
import { makeVisionBed } from './vision-bed';
import { MeshStandardMaterial } from 'three';

describe('Directed presence',()=>{
 it('keeps the faster Ozymandias journey moving through every reading, above land and clear of the ruin',()=>{
  const profile=worldProfiles.ozymandias;
  let previous=stillCamera(new Vector3(...profile.arrival.position),new Vector3(...profile.arrival.target)),duration=0;
  previous.position.sub(previous.target).clampLength(3,110).add(previous.target);
  const verify=(p:Vector3)=>{
   expect(p.y).toBeGreaterThanOrEqual(profile.terrainHeight(p.x,p.z)+1.8);
   expect(Math.hypot(p.x,p.z)).toBeLessThan(profile.radius);
   for(const c of profile.colliders)expect(p.y>c.top+.5||((p.x-c.x)/c.rx)**2+((p.z-c.z)/c.rz)**2>1).toBe(true);
  };
  for(let line=0;line<14;line++){
   const view=profile.tourViewForLine(line),position=new Vector3(...view.position),target=new Vector3(...view.target);
   const dolly=new ReadingDolly(position,target,profile.terrainHeight,line);
   const travel=tourTravelSeconds(previous.position.distanceTo(position)),path=new SmoothFilmPath(previous,dolly.sample(0),travel);
   duration+=travel+profile.holds[line];
   for(let j=0;j<=100;j++){const shot=path.sample(j/100);verify(shot.position);expect(shot.position.distanceTo(shot.target)).toBeLessThan(110.000001)}
   for(const key of ['position','target','velocity','acceleration','targetVelocity','targetAcceleration'] as const){
    expect(path.sample(0)[key].distanceTo(previous[key])).toBeLessThan(1e-7);
    expect(path.sample(1)[key].distanceTo(dolly.sample(0)[key])).toBeLessThan(1e-7);
   }
   for(let j=0;j<=100;j++)verify(dolly.sample(profile.holds[line]*j/100).position);
   const a=dolly.sample(.1),b=dolly.sample(.2),c=dolly.sample(profile.holds[line]-.1),d=dolly.sample(profile.holds[line]);
   expect(a.position.distanceTo(b.position)).toBeGreaterThan(.025);
   expect(c.position.distanceTo(d.position)).toBeGreaterThan(.025);
   if(line>=8&&line<=10)expect(d.position.distanceTo(target)).toBeCloseTo(position.distanceTo(target),5);
   previous=d;
  }
  expect(duration).toBeLessThan(95);
 });
 it('connects camera motion without a velocity or acceleration jump at verse boundaries',()=>{
  const from=stillCamera(new Vector3(0,12,60),new Vector3(0,10,0)),dolly=new ReadingDolly(new Vector3(-20,12,40),new Vector3(-21,7,16.5),()=>0,4),duration=4;
  const path=new SmoothFilmPath(from,dolly.sample(0),duration),epsilon=.00001,a=path.sample(1-epsilon/duration),b=dolly.sample(epsilon);
  expect(a.velocity.distanceTo(b.velocity)).toBeLessThan(.0001);expect(a.acceleration.distanceTo(b.acceleration)).toBeLessThan(.001);
  const next=new SmoothFilmPath(dolly.sample(3.5),stillCamera(new Vector3(17,9,41),new Vector3(23.4,3.3,23.4)),6);
  expect(next.sample(0).velocity.distanceTo(dolly.sample(3.5).velocity)).toBeLessThan(1e-7);
 });
 it('frames the complete monument, fallen head and hand on desktop and phone throughout the final reading',()=>{
  const p=worldProfiles.ozymandias,view=p.tourViewForLine(13),target=new Vector3(...view.target);
  const silhouette=[[-10,39,0],[10,39,0],[-32,2,23],[-12,14,16],[17,1,29],[30,5,29],[-16,0,9],[16,12,9]];
  for(const [aspect,fov] of [[1280/720,47],[390/844,65]]){
   const frame=panoramaFrame(new Vector3(...view.position),target,aspect,fov),dolly=new ReadingDolly(frame.position,target,p.terrainHeight,13),camera=new PerspectiveCamera(frame.fov,aspect,.1,1700);
   for(let second=0;second<=5;second++){
    const shot=dolly.sample(second);expect(shot.position.distanceTo(target)).toBeLessThan(110);
    camera.position.copy(shot.position);camera.lookAt(target);camera.updateMatrixWorld(true);
    for(const point of silhouette){const screen=new Vector3(...point).project(camera);expect(Math.abs(screen.x)).toBeLessThan(1);expect(Math.abs(screen.y)).toBeLessThan(1)}
   }
  }
 });
 it('preserves remaining reading time across pause, and resets at the next line',()=>{
  const clock=new ReadingClock();expect(clock.start(0,9,1000)).toBe(9000);clock.stop(3500);
  expect(clock.start(0,9,20000)).toBe(6500);clock.stop(21000);
  expect(clock.start(1,12,22000)).toBe(12000);clock.reset();expect(clock.start(1,12,23000)).toBe(12000);
 });
 it('samples every curved tour connection above land, outside actors, within bounds',()=>{
  for(const profile of Object.values(worldProfiles)){
   let previous=profile.arrival;
   for(let line=0;line<profile.holds.length;line++){
    const next=profile.tourViewForLine(line),path=new FilmPath(new Vector3(...previous.position),new Vector3(...next.position),new Vector3(...previous.target),new Vector3(...next.target),profile.terrainHeight,line);
    for(let j=0;j<=100;j++){
     const p=path.sample(j/100).position;
     expect(p.y).toBeGreaterThanOrEqual(profile.terrainHeight(p.x,p.z)+1.8);
     expect(Math.hypot(p.x,p.z)).toBeLessThan(profile.radius);
     for(const c of profile.colliders)expect(p.y>c.top+.5||((p.x-c.x)/c.rx)**2+((p.z-c.z)/c.rz)**2>1).toBe(true);
    }previous=next;
   }
  }
 });
 it('banks the falcon into the circuit, alternates powered flight/glides, and articulates both joints',()=>{
  const a=birdFlight(0,new Vector3(),true),b=birdFlight(5,new Vector3(),true);expect(a.powered).toBe(true);expect(b.powered).toBe(false);expect(a.bank).toBeLessThan(0);expect(a.position.y).toBeGreaterThan(5);
  const bird=makeFlightBird();bird.pose(.2,a.bank,true);const powered=bird.group.children.map(c=>c.rotation.toArray());bird.pose(5,b.bank,false);expect(bird.group.children.map(c=>c.rotation.toArray())).not.toEqual(powered);
  bird.group.traverse(o=>{if('geometry' in o)(o.geometry as {dispose:()=>void}).dispose()});
 });
 it('keeps loaded paws down, clears the ground during swing and returns to the next contact',()=>{
  expect(pawCycle(0,0)).toMatchObject({stance:true,lift:0});expect(pawCycle(5.8*.8,0).lift).toBeGreaterThan(0);
  expect(pawCycle(5.8,0)).toEqual(pawCycle(0,0));
  const paws=[0,.25,.5,.75].map(offset=>pawCycle(2,offset));expect(paws.filter(p=>p.stance).length).toBeGreaterThanOrEqual(2);
 });
 it('continues the detailed bed beneath the beast, cradle and threshold',()=>{
  const bed=makeVisionBed(new MeshStandardMaterial(),[]);
  for(const [x,z] of [[25,-82],[-5,-139],[-25,-175]]){
   expect(Number.isFinite(bed.surfaceHeight(x,z))).toBe(true);
   expect(Math.abs(bed.surfaceHeight(x,z)-worldProfiles['the-second-coming'].terrainHeight(x,z))).toBeLessThan(.06);
  }
  bed.traverse(o=>{if('geometry' in o)(o.geometry as {dispose:()=>void}).dispose()});
 });
});
