import { Vector3 } from 'three';

export type CameraKinetics={position:Vector3;target:Vector3;velocity:Vector3;acceleration:Vector3;targetVelocity:Vector3;targetAcceleration:Vector3};
export function stillCamera(position:Vector3,target:Vector3):CameraKinetics{return {position:position.clone(),target:target.clone(),velocity:new Vector3(),acceleration:new Vector3(),targetVelocity:new Vector3(),targetAcceleration:new Vector3()}}
export function panoramaFrame(position:Vector3,target:Vector3,aspect:number,baseFov:number){
 return aspect<.9?{position:position.clone().sub(target).setLength(106.5).add(target),fov:82}:{position:position.clone(),fov:baseFov};
}

// A quintic Hermite connection preserves both velocity and acceleration at
// each join. Reading arcs and travelling shots share the same time domain;
// there is no second easing curve or fresh push at the start of a verse.
class CameraCurve {
 private coefficients:Vector3[];
 constructor(p0:Vector3,p1:Vector3,v0:Vector3,v1:Vector3,a0:Vector3,a1:Vector3,private duration:number){
  const d=p1.clone().sub(p0),u0=v0.clone().multiplyScalar(duration),u1=v1.clone().multiplyScalar(duration),b0=a0.clone().multiplyScalar(duration*duration),b1=a1.clone().multiplyScalar(duration*duration);
  this.coefficients=[p0.clone(),u0,b0.clone().multiplyScalar(.5),
   d.clone().multiplyScalar(10).addScaledVector(u0,-6).addScaledVector(u1,-4).addScaledVector(b0,-1.5).addScaledVector(b1,.5),
   d.clone().multiplyScalar(-15).addScaledVector(u0,8).addScaledVector(u1,7).addScaledVector(b0,1.5).addScaledVector(b1,-1),
   d.clone().multiplyScalar(6).addScaledVector(u0,-3).addScaledVector(u1,-3).addScaledVector(b0,-.5).addScaledVector(b1,.5)];
 }
 sample(t:number){
  const position=new Vector3(),velocity=new Vector3(),acceleration=new Vector3();
  this.coefficients.forEach((c,i)=>{position.addScaledVector(c,t**i);if(i>0)velocity.addScaledVector(c,i*t**(i-1)/this.duration);if(i>1)acceleration.addScaledVector(c,i*(i-1)*t**(i-2)/(this.duration*this.duration))});
  return {position,velocity,acceleration};
 }
}
export class SmoothFilmPath {
 private eye:CameraCurve;private attention:CameraCurve;
 constructor(from:CameraKinetics,to:CameraKinetics,duration:number){
  this.eye=new CameraCurve(from.position,to.position,from.velocity,to.velocity,from.acceleration,to.acceleration,duration);
  this.attention=new CameraCurve(from.target,to.target,from.targetVelocity,to.targetVelocity,from.targetAcceleration,to.targetAcceleration,duration);
 }
 sample(t:number):CameraKinetics{const eye=this.eye.sample(t),attention=this.attention.sample(t);return {...eye,target:attention.position,targetVelocity:attention.velocity,targetAcceleration:attention.acceleration}}
}

// A modest lateral dolly creates parallax between foreground and subject.
// Attention eases separately from travel; no animated focal-length change.
export class FilmPath {
 private c1:Vector3;private c2:Vector3;
 constructor(private from:Vector3,private to:Vector3,private fromTarget:Vector3,private toTarget:Vector3,private terrain:(x:number,z:number)=>number,line:number){
  const delta=to.clone().sub(from),side=new Vector3(-delta.z,0,delta.x).normalize().multiplyScalar(Math.min(1.2,delta.length()*.035)*(line%2===0?1:-1));
  this.c1=from.clone().lerp(to,.32).add(side);this.c2=from.clone().lerp(to,.70).add(side);
 }
 sample(t:number){
  const u=1-t,position=this.from.clone().multiplyScalar(u*u*u).addScaledVector(this.c1,3*u*u*t).addScaledVector(this.c2,3*u*t*t).addScaledVector(this.to,t*t*t);
  // Eye height follows the land; a dune is not something the lens can pass through.
  position.y=Math.max(position.y,this.terrain(position.x,position.z)+1.85);
  const attention=t*t*(3-2*t),target=this.fromTarget.clone().lerp(this.toTarget,attention);
  return {position,target};
 }
}

// Follow the subject on a small arc throughout the reading. The wider final
// views also retreat into the desert; inscription shots retain their distance.
export class ReadingDolly {
 private radius:number;private bearing:number;private speed:number;private direction:number;private retreat:number;
 constructor(private position:Vector3,private target:Vector3,private terrain:(x:number,z:number)=>number,line:number){
  const offset=position.clone().sub(target);
  this.radius=Math.hypot(offset.x,offset.z);this.bearing=Math.atan2(offset.x,offset.z);
  this.speed=line>=8&&line<=10?.8:line>=3&&line<=6?1.25:1.4;
  this.direction=line>=3&&line<=6?1:-1;this.retreat=line>=11?.45:0;
 }
 sample(seconds:number):CameraKinetics{
  const angular=this.direction*this.speed/Math.max(3,this.radius),angle=this.bearing+angular*seconds,radius=this.radius+this.retreat*seconds;
  const position=new Vector3(this.target.x+Math.sin(angle)*radius,this.position.y,this.target.z+Math.cos(angle)*radius);
  position.y=Math.max(position.y,this.terrain(position.x,position.z)+1.85);
  const velocity=new Vector3(Math.cos(angle)*angular*radius+Math.sin(angle)*this.retreat,0,-Math.sin(angle)*angular*radius+Math.cos(angle)*this.retreat);
  const acceleration=new Vector3(-Math.sin(angle)*angular*angular*radius+2*Math.cos(angle)*angular*this.retreat,0,-Math.cos(angle)*angular*angular*radius-2*Math.sin(angle)*angular*this.retreat);
  return {position,target:this.target.clone(),velocity,acceleration,targetVelocity:new Vector3(),targetAcceleration:new Vector3()};
 }
}

// Pause resumes the remaining hold, rather than restarting the entire line.
export class ReadingClock {
 private line=-1;private remaining=0;private since:number|null=null;
 start(line:number,seconds:number,now:number){if(line!==this.line){this.line=line;this.remaining=seconds*1000}this.since=now;return this.remaining}
 stop(now:number){if(this.since!==null)this.remaining=Math.max(0,this.remaining-(now-this.since));this.since=null}
 reset(){this.line=-1;this.remaining=0;this.since=null}
}
