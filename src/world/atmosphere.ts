import * as T from 'three';
import { terrainHeight, colliders } from './geography';
import { GRAVITY } from './sediment';
import { rng } from './sculpture';

// Quiet stretches between irregular, gradual gusts. No constant metronome.
export function gustStrength(time:number){
 const t=((time%67)+67)%67;
 const pulse=(start:number,duration:number,power:number)=>{
  const phase=(t-start)/duration;
  return phase>0&&phase<1?Math.pow(Math.sin(phase*Math.PI),2)*power:0;
 };
 return Math.min(1,pulse(3,8,.82)+pulse(22,11,1)+pulse(47,7,.68));
}
export function sandTransport(time:number){return .18+.82*gustStrength(time)}
const GRAIN_COUNT=8192, PATCH_SIZE=32;

export class DesertAtmosphere {
 readonly group=new T.Group();
 private readonly material:T.ShaderMaterial;
 private readonly grains:T.Mesh<T.InstancedBufferGeometry,T.ShaderMaterial>;
 private readonly seeds:{x:number;z:number;launch:number;phase:number;size:number;speed:number;threshold:number}[]=[];
 private readonly starts=new Float32Array(GRAIN_COUNT*3);
 private readonly ends=new Float32Array(GRAIN_COUNT*3);
 private readonly opacity=new Float32Array(GRAIN_COUNT);
 private surfaceHeight=terrainHeight;
 private readonly forward=new T.Vector3();
 private readonly halo:T.Mesh;
 private sunDirection=new T.Vector3();
 constructor(private obstacles=colliders,private dryWeight:(z:number)=>number=()=>1){
  this.group.name='Passing sand and sunlight';
  this.material=new T.ShaderMaterial({
   transparent:true,depthWrite:false,
   uniforms:{uTint:{value:new T.Color('#584b35')},uResolution:{value:new T.Vector2(1280,720)}},
   vertexShader:`attribute vec3 trailStart;attribute vec3 trailEnd;attribute float grainSize;attribute float grainOpacity;varying float vAlpha;varying vec2 vTrail;uniform vec2 uResolution;
    void main(){vec4 a=projectionMatrix*modelViewMatrix*vec4(trailStart,1.0),b=projectionMatrix*modelViewMatrix*vec4(trailEnd,1.0);
     vec2 direction=(b.xy/max(.01,b.w)-a.xy/max(.01,a.w))*uResolution;vec2 side=normalize(vec2(-direction.y,direction.x)+vec2(.00001));
     gl_Position=mix(a,b,position.x);float distanceToGrain=max(1.0,gl_Position.w);
     float projected=grainSize*uResolution.y*projectionMatrix[1][1]/(2.0*distanceToGrain);
     gl_Position.xy+=side*clamp(projected,.65,1.6)*position.y*2.0/uResolution*gl_Position.w;
     // Preserve a faint optical trace for subpixel grains, without luminous point sprites.
     vTrail=uv;vAlpha=grainOpacity*clamp(projected/.65,.60,1.0)*(1.0-smoothstep(9.0,38.0,distanceToGrain));
     if(a.w<.1||b.w<.1)vAlpha=0.0;
    }`,
   fragmentShader:`varying float vAlpha;varying vec2 vTrail;uniform vec3 uTint;
    void main(){float edge=1.0-smoothstep(.12,.5,abs(vTrail.y-.5));float tail=smoothstep(0.0,.3,vTrail.x)*(1.0-smoothstep(.82,1.0,vTrail.x));
     float alpha=edge*tail*vAlpha;if(alpha<.002)discard;
     gl_FragColor=vec4(uTint,alpha);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`,
  });
  const random=rng(772),sizes=new Float32Array(GRAIN_COUNT);
  for(let i=0;i<GRAIN_COUNT;i++){const size=.0008+random()*.0013;
   this.seeds.push({x:random()*PATCH_SIZE-PATCH_SIZE/2,z:random()*PATCH_SIZE-PATCH_SIZE/2,launch:.18+random()*.40,phase:random()*50,size,speed:1.8+random()*1.8,threshold:random()});sizes[i]=size;
  }
  const geometry=new T.InstancedBufferGeometry();geometry.instanceCount=GRAIN_COUNT;geometry.setIndex([0,1,2,0,2,3]);geometry.setAttribute('position',new T.Float32BufferAttribute([0,-.5,0,1,-.5,0,1,.5,0,0,.5,0],3));geometry.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));
  geometry.setAttribute('trailStart',new T.InstancedBufferAttribute(this.starts,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('trailEnd',new T.InstancedBufferAttribute(this.ends,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('grainSize',new T.InstancedBufferAttribute(sizes,1));geometry.setAttribute('grainOpacity',new T.InstancedBufferAttribute(this.opacity,1).setUsage(T.DynamicDrawUsage));
  this.grains=new T.Mesh(geometry,this.material);this.grains.name='Low sand saltation trails';this.grains.frustumCulled=false;this.group.add(this.grains);
  // A real depth-tested sun corona in the sky: dunes and stone can occlude it.
  const glow=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{uWarmth:{value:new T.Color('#fff0ce')},uStrength:{value:1}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`varying vec2 vUv;uniform vec3 uWarmth;uniform float uStrength;void main(){float r=length(vUv-.5)*2.0;float corona=exp(-r*r*7.0)*(1.0-smoothstep(.75,1.0,r));float core=1.0-smoothstep(.09,.14,r);gl_FragColor=vec4(uWarmth*(1.0+core*3.0),(corona*.14+core*.3)*uStrength);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
  this.halo=new T.Mesh(new T.PlaneGeometry(100,100),glow);this.halo.name='Solar corona';this.group.add(this.halo);
 }
 setSun(position:T.Vector3,light:'late'|'day'|'dusk'){
  this.sunDirection.copy(position).normalize();this.halo.position.copy(this.sunDirection).multiplyScalar(1050);this.halo.lookAt(0,0,0);
  (this.halo.material as T.ShaderMaterial).uniforms.uWarmth.value.set(light==='dusk'?'#ffd6ac':'#fff0ce');
  this.material.uniforms.uTint.value.set(light==='dusk'?'#514230':'#584b35');
 }
 setSize(width:number,height:number){this.material.uniforms.uResolution.value.set(width,height)}
 setSurface(sampler:(x:number,z:number)=>number){this.surfaceHeight=sampler}
 update(time:number,camera:T.Camera){
  const gust=gustStrength(time),transport=sandTransport(time);
  const originX=Math.round(camera.position.x/2)*2,originZ=Math.round(camera.position.z/2)*2;
  const wrap=(value:number,length:number)=>((value%length)+length)%length;
  // A fixed world-aligned patch. Camera rotation never resets the transport phase.
  let active=0;
  for(let i=0;i<this.seeds.length;i++){
   const s=this.seeds[i],speed=s.speed;
   const x=originX+wrap(s.x+time*speed-originX+PATCH_SIZE/2,PATCH_SIZE)-PATCH_SIZE/2;
   const z=originZ+wrap(s.z+time*speed*.318-originZ+PATCH_SIZE/2,PATCH_SIZE)-PATCH_SIZE/2;
   const duration=2*s.launch/GRAVITY,age=wrap(time+s.phase,duration);
   const y=this.surfaceHeight(x,z)+ballisticHop(age,s.launch)+s.size*.5;
   const exposure=.012,tailX=x-speed*exposure,tailZ=z-speed*.318*exposure,tailAge=wrap(age-exposure,duration);
   this.starts.set([tailX,this.surfaceHeight(tailX,tailZ)+ballisticHop(tailAge,s.launch)+s.size*.5,tailZ],i*3);this.ends.set([x,y,z],i*3);
   const masked=this.obstacles.some(c=>y<c.top&&((x-c.x)/c.rx)**2+((z-c.z)/c.rz)**2<1);
   // More moving grains in a gust; a few continue creeping/hopping through the quiet intervals.
   const lane=.5+.5*Math.sin((x*.318-z)*.38+Math.sin(x*.17)*1.2);
   const flowing=this.dryWeight(z)>.65&&!masked&&s.threshold<(.13+transport*.6)*(.35+lane*.65);
   this.opacity[i]=flowing?(.50+transport*.35):0;if(flowing)active++;
  }
  for(const name of ['trailStart','trailEnd','grainOpacity'])this.grains.geometry.attributes[name].needsUpdate=true;
  camera.getWorldDirection(this.forward);
  return {gust,active,sunFacing:Math.max(0,this.forward.dot(this.sunDirection))};
 }
}
// Each hop returns to the bed after 2v/g; wind never levitates a coarse grain.
export function ballisticHop(age:number,launchVelocity:number){return Math.max(0,launchVelocity*age-.5*GRAVITY*age*age)}
