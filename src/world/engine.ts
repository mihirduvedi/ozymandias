import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { RUIN_SCALE } from './geography';
import type { Slug } from '../content/poems';
import { worldProfiles,type WorldProfile } from './profiles';
import { makeVision,type VisionScene } from './vision';
import { makeVisionBed } from './vision-bed';
import { visionGroundMaterial } from './vision-craft';
import { desertWeight } from './vision-geography';
import { FilmPath,ReadingDolly,SmoothFilmPath,stillCamera,panoramaFrame } from './cinematography';
import { tourTravelSeconds } from './tour';
import { WorldAmbience } from './ambience';
import { navigationInput } from './navigation';
import { makeSculpture } from './sculpture';
import { makeSandBed, type SandImprint } from './sediment';
import { DesertAtmosphere } from './atmosphere';
export type WorldMode='inspect'|'walk';
export type WorldMarker={line:number;label:string;x:number;y:number;visible:boolean};
export type WorldCallbacks={ready:()=>void;error:(s:string)=>void;boundary:(limited:boolean)=>void;markers:(points:WorldMarker[])=>void;departing?:(line:number)=>void;arrived?:(line:number)=>void;interaction?:()=>void};
export class DesertWorld {
 renderer:T.WebGLRenderer;scene=new T.Scene();camera=new T.PerspectiveCamera(47,1,.1,1700);controls:OrbitControls;
 mode:WorldMode='inspect';motion=true;paused=false;disposed=false;private frame=0;private previous=0;private dirty=true;private measuredFrames=0;private measureStart=0;private time=0;private keys=new Set<string>();
 private baseFov=47;private yaw=0;private pitch=0;private elevation=0;private atBoundary=false;private drag:{id:number;x:number;y:number;pan:boolean}|null=null;
 private markerTime=0;private markerOcclusion=new Map<number,boolean>();private currentLine:number|null=null;
 private occlusionView=new T.Matrix4();private occlusionProjection=new T.Matrix4();
 private ambience=new WorldAmbience();private heldShot:{position:T.Vector3;target:T.Vector3;age:number;line:number;dolly:ReadingDolly|null}|null=null;
 private guided=false;private journeyPaused=false;
 private targetFlight:{from:T.Vector3;to:T.Vector3;fromTarget:T.Vector3;toTarget:T.Vector3;fromFov:number;toFov:number;t:number;duration:number;path:FilmPath|SmoothFilmPath|null}|null=null;
 private sun=new T.DirectionalLight('#ffe4bc',3.1);private sky=new Sky();private ambient=new T.HemisphereLight('#c9d8e8','#b79567',2.3);
 private twilight={value:0};
 private composer:EffectComposer;private output:OutputPass;private contactOcclusion:GTAOPass;private atmosphere:DesertAtmosphere;private profile:WorldProfile;private vision:VisionScene|null=null;private observedLine=0;private lightChoice:'late'|'day'|'dusk'='late';private selectedSun=new T.Vector3();private gloom=0;private lightExposure=.85;private lightPower=4.1;private observer:ResizeObserver;private assetGroup:T.Group|null=null;
 private bag:T.Texture[]=[];private environment:T.WebGLRenderTarget|null=null;private readonly host:HTMLDivElement;private callbacks:WorldCallbacks;
 constructor(host:HTMLDivElement,callbacks:WorldCallbacks,slug:Slug='ozymandias'){
  this.host=host;this.callbacks=callbacks;this.profile=worldProfiles[slug];this.atmosphere=new DesertAtmosphere(this.profile.colliders,slug==='the-second-coming'?desertWeight:undefined);
  this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.85;
  this.renderer.info.autoReset=false;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.shadowMap.autoUpdate=slug==='the-second-coming';
  const canvas=this.renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label',`${slug==='ozymandias'?'Ozymandias desert':'The Second Coming vision'}. Drag to look in Orbit or travel in Wander. Arrows look around. Use Space to rise and C to lower your view. Scroll to zoom.`);canvas.setAttribute('role','img');host.appendChild(canvas);
  this.scene.fog=new T.FogExp2('#d2bc9a',.0035);this.scene.background=new T.Color('#d2bc9a');
  this.scene.add(this.ambient,this.sun,this.atmosphere.group);this.sun.position.set(-45,21,35);this.sun.castShadow=true;this.sun.shadow.mapSize.set(4096,4096);this.sun.shadow.camera.left=-88;this.sun.shadow.camera.right=88;this.sun.shadow.camera.top=80;this.sun.shadow.camera.bottom=-80;this.sun.shadow.camera.near=1;this.sun.shadow.camera.far=400;this.sun.shadow.normalBias=.012;this.sun.shadow.bias=-.000035;this.sun.shadow.intensity=.98;
  this.sun.shadow.radius=2.6;
  // Keep the sky's solar disc bright while retaining detail in the surrounding haze.
  this.sky.material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('( Lin + L0 ) * 0.04','( Lin + L0 ) * 0.012');if(slug==='the-second-coming'){
   shader.uniforms.poemTwilight=this.twilight;
   shader.fragmentShader=shader.fragmentShader.replace('i < 4; i ++','i < 6; i ++').replace('cloudUV * 1000.0, evolve ) * 0.7','cloudUV * 1550.0, evolve ) * 0.53');
   shader.fragmentShader=shader.fragmentShader.replace('varying vec3 vWorldPosition;','varying vec3 vWorldPosition;\nuniform float poemTwilight;').replace('vSunE * Fex * 0.22 * 0.04','vSunE * Fex * 0.22 * 0.010').replace('Lin * 0.04 +','Lin * 0.012 +').replace('gl_FragColor = vec4( texColor, 1.0 );',`vec3 twilightSky=mix(vec3(.090,.120,.160),vec3(.012,.022,.042),smoothstep(-.02,.65,direction.y));
    gl_FragColor=vec4(mix(texColor,twilightSky,poemTwilight),1.0);`);
  }};
  this.sky.material.uniforms.cloudCoverage.value=0;
  this.sky.scale.setScalar(1200);this.scene.add(this.sky);this.setLight('late');
  this.controls=new OrbitControls(this.camera,canvas);this.controls.enableDamping=true;this.controls.dampingFactor=.075;this.controls.minDistance=3;this.controls.maxDistance=slug==='ozymandias'?110:150;this.controls.maxPolarAngle=Math.PI-.12;this.controls.minPolarAngle=.12;this.controls.screenSpacePanning=true;this.controls.zoomSpeed=.7;this.controls.rotateSpeed=.55;
  this.composer=new EffectComposer(this.renderer);this.composer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.composer.renderTarget1.samples=4;this.composer.renderTarget2.samples=4;this.output=new OutputPass();this.composer.addPass(new RenderPass(this.scene,this.camera));this.contactOcclusion=new GTAOPass(this.scene,this.camera,512,512);this.contactOcclusion.updateGtaoMaterial({radius:.38,thickness:.22,distanceFallOff:1,samples:8,scale:.75});this.contactOcclusion.updatePdMaterial({radius:3,samples:8,depthPhi:1,normalPhi:3});this.contactOcclusion.blendIntensity=.32;if(slug==='the-second-coming'){this.contactOcclusion.updateGtaoMaterial({radius:.80,thickness:.45,distanceFallOff:1,samples:8,scale:.75});this.contactOcclusion.blendIntensity=.24}this.composer.addPass(this.contactOcclusion);this.composer.addPass(this.output);
  this.controls.addEventListener('start',this.cancelFlight);this.controls.addEventListener('change',this.changed);
  this.camera.position.fromArray(this.profile.arrival.position);this.controls.target.fromArray(this.profile.arrival.target);this.controls.update();
  canvas.addEventListener('pointerdown',this.down);canvas.addEventListener('pointermove',this.move);canvas.addEventListener('pointerup',this.up);canvas.addEventListener('pointercancel',this.cancelDrag);canvas.addEventListener('wheel',this.wheel,{passive:false});canvas.addEventListener('keydown',this.keyDown);canvas.addEventListener('keyup',this.keyUp);canvas.addEventListener('blur',this.clearKeys);canvas.addEventListener('contextmenu',this.context);
  window.addEventListener('blur',this.clearKeys);document.addEventListener('visibilitychange',this.visibility);canvas.addEventListener('webglcontextlost',this.contextLost);
  this.observer=new ResizeObserver(this.resize);this.observer.observe(host);this.resize();
  this.frame=requestAnimationFrame(this.tick);void this.build();
 }
 private async build(){
  const loader=new T.TextureLoader();
  const load=async(url:string,color=false)=>{const t=await loader.loadAsync(url);if(this.disposed){t.dispose();throw new Error('Disposed')}t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=T.SRGBColorSpace;this.bag.push(t);return t};
  try{
   const [sandColor,sandNormal,sandRough,stoneColor,stoneNormal,stoneRough]=await Promise.all([load('./world/sand/color.jpg',true),load('./world/sand/normal.jpg'),load('./world/sand/roughness.jpg'),load('./world/stone/color.jpg',true),load('./world/stone/normal.jpg'),load('./world/stone/roughness.jpg')]);
   const sand=new T.MeshStandardMaterial({color:'#d9bf94',map:sandColor,normalMap:sandNormal,normalScale:new T.Vector2(.48,.48),roughnessMap:sandRough,roughness:.97});
   // Photographed fine grain supports, rather than replaces, sculpted wind ripples.
   sand.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vSandPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nvSandPosition = position;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vSandPosition;').replace('#include <map_fragment>',`#include <map_fragment>
    float dunePatch=.5+.5*sin(vSandPosition.x*.13+sin(vSandPosition.z*.11)*2.1);
    diffuseColor.rgb = mix(vec3(.84,.71,.50), diffuseColor.rgb, .62);
    float ripple = sin(vSandPosition.x*4.1 + vSandPosition.z*1.3 + sin(vSandPosition.z*.23)*1.8 + sin(vSandPosition.x*.14-vSandPosition.z*.09)*.9);
    float fade = 1.0-smoothstep(12.0,65.0,length(vSandPosition.xz-cameraPosition.xz));
    diffuseColor.rgb *= .94+dunePatch*.09+ripple*(.014+dunePatch*.018)*fade;
    diffuseColor.rgb += vec3(-.009,-.006,.002)*sin(vSandPosition.x*.37+vSandPosition.z*.29);`).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    normal = normalize(normal + vec3(ripple*(.045+dunePatch*.03)*fade,0.0,0.0));`)};
   const stone=new T.MeshStandardMaterial({map:stoneColor,normalMap:stoneNormal,roughnessMap:stoneRough,color:'#c6bdb5',normalScale:new T.Vector2(.30,.30),roughness:1});
   stone.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vStonePosition;varying vec3 vStoneNormal;').replace('#include <begin_vertex>','#include <begin_vertex>\nvStonePosition=(modelMatrix*vec4(position,1.0)).xyz;vStoneNormal=normalize(mat3(modelMatrix)*normal);');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vStonePosition;varying vec3 vStoneNormal;').replace('#include <map_fragment>',`vec3 weight=pow(abs(vStoneNormal),vec3(4.0));weight/=weight.x+weight.y+weight.z;
     vec4 grain=texture2D(map,vStonePosition.yz*.38)*weight.x+texture2D(map,vStonePosition.xz*.38)*weight.y+texture2D(map,vStonePosition.xy*.38)*weight.z;
     float luminance=dot(grain.rgb,vec3(.2126,.7152,.0722));grain.rgb=mix(vec3(.48,.48,.51),vec3(.86,.82,.77),smoothstep(.14,.72,luminance));
     float weather=sin(vStonePosition.x*.58+sin(vStonePosition.z*.73)*1.6)*sin(vStonePosition.y*.42+vStonePosition.z*.30);
     grain.rgb*=1.0+weather*.07;
     grain.rgb+=vec3(.018,.006,-.009)*smoothstep(.42,.75,luminance)*sin(vStonePosition.y*2.1+vStonePosition.x*.31);diffuseColor*=grain;`);
   };
   stoneColor.repeat.set(3,3);stoneNormal.repeat.set(3,3);stoneRough.repeat.set(3,3);
   const imprints:SandImprint[]=[];
   let group:T.Group;
   if(this.profile.slug==='the-second-coming'){this.vision=await makeVision(stone,imprints);group=this.vision.group}
   else group=await makeSculpture(stone,['My name is Ozymandias, king of kings:','Look on my works, ye Mighty, and despair!'],()=>this.callbacks.error('The statue couldn’t load. Reload the world to try again.'),imprints);
   if(this.disposed){this.disposeObject(group);return}this.assetGroup=group;this.scene.add(group);
   const bed=this.vision?makeVisionBed(visionGroundMaterial(sand),imprints):makeSandBed(sand,imprints,this.profile.terrainHeight);this.scene.add(bed);this.atmosphere.setSurface(bed.surfaceHeight);
   if(this.vision){const skyScene=new T.Scene();skyScene.add(this.sky.clone());const pmrem=new T.PMREMGenerator(this.renderer);this.environment=pmrem.fromScene(skyScene,.03,.1,1600,{size:128});this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.18;pmrem.dispose()}
   this.host.dataset.sandContacts=String(imprints.length);this.renderer.shadowMap.needsUpdate=true;this.dirty=true;this.callbacks.ready();
  }catch(error){console.error('World asset loading failed',error);if(!this.disposed)this.callbacks.error('The world couldn’t load. You can still read the poem.')}
 }
 private disposeObject(object:T.Object3D){object.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Points){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{for(const value of Object.values(m))if(value instanceof T.Texture)value.dispose();m.dispose()})}})}
 private changed=()=>{this.dirty=true};
 setLight(value:'late'|'day'|'dusk'){this.lightChoice=value;
  const settings={late:{sun:[-45,21,35],color:'#ffe4bc',power:4.1,fog:'#d2bc9a',exposure:.85,turbidity:4},day:{sun:[-20,65,30],color:'#fff3df',power:4.6,fog:'#c7c9c7',exposure:.78,turbidity:2.4},dusk:{sun:[-55,8,-8],color:'#ffc894',power:3.2,fog:'#b99d9a',exposure:.90,turbidity:5}}[value];
  if(this.profile.slug==='the-second-coming'){
   const visionLight={late:{sun:[-40,30,20],color:'#dae5e5',power:2.8,fog:'#96a8ad',exposure:.92,turbidity:5},day:{sun:[-30,50,30],color:'#f3e4d6',power:4.2,fog:'#b8aba5',exposure:.78,turbidity:3.2},dusk:{sun:[-55,1,-35],color:'#ffd3b1',power:2.6,fog:'#817481',exposure:.98,turbidity:6}}[value];Object.assign(settings,visionLight);
  }
  this.dirty=true;this.lightExposure=settings.exposure;this.lightPower=settings.power;this.sun.position.fromArray(settings.sun).multiplyScalar(RUIN_SCALE);this.selectedSun.copy(this.sun.position);this.sun.color.set(settings.color);this.sun.intensity=settings.power;this.renderer.toneMappingExposure=settings.exposure;
  this.renderer.shadowMap.needsUpdate=true;
  this.scene.fog=new T.FogExp2(settings.fog,.0035);const u=this.sky.material.uniforms;u.turbidity.value=settings.turbidity;u.rayleigh.value=1.0;u.mieCoefficient.value=.003;u.mieDirectionalG.value=.8;u.sunPosition.value.copy(this.sun.position);this.ambient.intensity=value==='dusk'?1.15:1.35;this.ambient.groundColor.set('#c8ad81');this.atmosphere.setSun(this.sun.position,value);if(this.profile.slug==='the-second-coming'){u.cloudCoverage.value=.42;u.cloudScale.value=.00085;u.cloudDensity.value=.43;u.cloudElevation.value=.28;u.cloudSpeed.value=.000025;this.sun.target.position.set(-8,0,-48);this.scene.add(this.sun.target);this.sun.shadow.camera.left=-140;this.sun.shadow.camera.right=140;this.sun.shadow.camera.top=140;this.sun.shadow.camera.bottom=-140;this.sun.shadow.camera.far=650;this.sun.shadow.camera.updateProjectionMatrix();this.ambient.color.set('#afc4cd');this.ambient.groundColor.set('#777266');this.ambient.intensity=value==='dusk'?.85:1.3}
 }
 setMotion(value:boolean){this.motion=value;this.controls.enableDamping=value&&!this.guided;if(!value){if(this.mode==='inspect')this.controls.update();if(this.targetFlight){this.camera.position.copy(this.targetFlight.to);this.controls.target.copy(this.targetFlight.toTarget);this.camera.fov=this.targetFlight.toFov;this.camera.updateProjectionMatrix();this.targetFlight=null;this.controls.update();this.constrain();if(this.currentLine!==null)this.callbacks.arrived?.(this.currentLine)}this.dirty=true}}
 beginJourney(){
  this.targetFlight=null;this.heldShot=null;this.clearKeys();this.mode='inspect';this.controls.enabled=true;
  this.camera.fov=this.baseFov;this.camera.updateProjectionMatrix();
  if(this.vision){this.vision.resetJourney();this.gloom=0;this.twilight.value=0;this.setLight(this.lightChoice)}
  this.camera.position.fromArray(this.profile.arrival.position);this.controls.target.fromArray(this.profile.arrival.target);this.controls.enableDamping=false;this.controls.update();this.controls.enableDamping=this.motion;this.dirty=true;
  if(this.motion)this.host.animate([{opacity:0},{opacity:1}],{duration:1200,easing:'ease-out'});
 }
 setSound(value:boolean){return this.ambience.enable(value)}
 pauseJourney(value:boolean){this.journeyPaused=value;this.ambience.update(this.time,0,0,value||this.paused)}
 resumeWorld(){this.paused=false;if(!this.guided)this.pauseJourney(false)}
 continueJourney(line:number){if(this.guided&&this.currentLine===line&&(this.targetFlight||this.heldShot))this.pauseJourney(false);else this.goLine(line,true)}
 leaveJourney(){this.guided=false;this.pauseJourney(false);this.targetFlight=null;this.heldShot=null;this.controls.enableDamping=this.motion}
 setMode(mode:WorldMode){
  this.clearKeys();this.mode=mode;this.targetFlight=null;this.currentLine=null;this.controls.enabled=mode==='inspect';this.camera.fov=this.baseFov;this.camera.updateProjectionMatrix();
  if(mode==='walk'){const direction=new T.Vector3();this.camera.getWorldDirection(direction);this.yaw=Math.atan2(-direction.x,-direction.z);this.pitch=T.MathUtils.clamp(Math.asin(direction.y),-1.48,1.48);this.elevation=Math.max(0,this.camera.position.y-this.profile.terrainHeight(this.camera.position.x,this.camera.position.z)-1.8);this.constrain();this.look()}
  else{const direction=new T.Vector3();this.camera.getWorldDirection(direction);this.controls.target.copy(this.camera.position).addScaledVector(direction,12);this.constrain();this.controls.update()}
 }
 go(index:number){this.goLine(this.profile.landmarkLines[index]??0)}
 goLine(line:number,guided=false){
  const previous=!this.journeyPaused&&this.guided?(this.targetFlight?.path instanceof SmoothFilmPath?this.targetFlight.path.sample(this.targetFlight.t):this.heldShot?.dolly?.sample(this.heldShot.age)):null;
  this.heldShot=null;if(guided)this.callbacks.departing?.(line);
  this.currentLine=line;this.observedLine=line;this.guided=guided;this.journeyPaused=false;
  this.controls.enableDamping=false;this.controls.update();this.controls.enableDamping=this.motion&&!guided;
  const l=guided?this.profile.tourViewForLine(line):this.profile.viewForLine(line);this.clearKeys();this.mode='inspect';this.controls.enabled=true;
  const fromFov=this.camera.fov;let toFov=this.baseFov;
  const to=new T.Vector3(...l.position),toTarget=new T.Vector3(...l.target);
  if(this.profile.slug==='ozymandias'&&line===13){const frame=panoramaFrame(to,toTarget,this.camera.aspect,this.baseFov);to.copy(frame.position);toFov=frame.fov}
  if(this.vision&&line===0){const falcon=this.vision.markers().get(0);if(falcon)toTarget.copy(falcon)}
  if(this.profile.slug==='ozymandias'&&line>=8&&line<=10){const distance=4.45*RUIN_SCALE*1.12/(Math.tan(toFov*Math.PI/360)*this.camera.aspect);to.z=Math.max(to.z,toTarget.z+distance)}
  if(this.motion){
   const duration=guided?(this.vision?T.MathUtils.clamp(this.camera.position.distanceTo(to)/2.2,4,14):tourTravelSeconds(this.camera.position.distanceTo(to))):2.2;
   const dolly=new ReadingDolly(to,toTarget,this.profile.terrainHeight,line);
   const path=guided?(this.vision?new FilmPath(this.camera.position,to,this.controls.target,toTarget,this.profile.terrainHeight,line):new SmoothFilmPath(previous??stillCamera(this.camera.position,this.controls.target),dolly.sample(0),duration)):null;
   this.targetFlight={from:this.camera.position.clone(),to,fromTarget:this.controls.target.clone(),toTarget,fromFov,toFov,t:0,duration,path};
  }
  else{this.camera.position.copy(to);this.controls.target.copy(toTarget);this.camera.fov=toFov;this.camera.updateProjectionMatrix();this.controls.update();this.constrain();this.callbacks.arrived?.(line)}
 }
 zoom(inward:boolean){this.cancelFlight();if(this.mode==='inspect'){if(inward)this.controls.dollyIn(1/1.18);else this.controls.dollyOut(1/1.18);this.controls.update();this.constrain()}else{this.camera.fov=T.MathUtils.clamp(this.camera.fov+(inward?-5:5),28,70);this.camera.updateProjectionMatrix();this.dirty=true}}
 navigate(command:'left'|'right'|'up'|'down'|'forward'|'back'|'rise'|'lower'){
  this.cancelFlight();
  if(command==='rise'||command==='lower'){this.rise(command==='rise'?1.7:-1.7);return}
  if(this.mode==='inspect'){if(command==='left'||command==='right')this.controls.rotateLeft(command==='left'?.14:-.14);else if(command==='up'||command==='down')this.controls.rotateUp(command==='up'?.10:-.10);else this.pan(command==='forward'?35:-35,0);this.controls.update();this.constrain()}
  else if(command==='left'||command==='right'){this.yaw+=command==='left'?.14:-.14;this.look()}else if(command==='up'||command==='down'){this.pitch=T.MathUtils.clamp(this.pitch+(command==='up'?.1:-.1),-1.48,1.48);this.look()}else this.walk(command==='forward'?1.7:-1.7,0);
 }
 private walk(distance:number,strafe:number){
  const p=this.camera.position,next=this.profile.walkStep(p.x,p.z,-Math.sin(this.yaw)*distance+Math.cos(this.yaw)*strafe,-Math.cos(this.yaw)*distance-Math.sin(this.yaw)*strafe,this.elevation);p.set(next.x,next.y,next.z);this.constrain();this.look();
 }
 private rise(distance:number){
  this.camera.position.y+=distance;if(this.mode==='inspect')this.controls.target.y+=distance;
  this.constrain();this.elevation=Math.max(0,this.camera.position.y-this.profile.terrainHeight(this.camera.position.x,this.camera.position.z)-1.8);
  if(this.mode==='inspect')this.controls.update();else this.look();this.dirty=true;
 }
 private pan(x:number,y:number){
  if(this.mode==='inspect'){this.controls.pan(x,y);this.controls.update();this.constrain()}
  else{const side=x*.035,vertical=y*.035;this.walk(0,side);if(vertical)this.rise(vertical)}
 }
 private constrain(){
  const before=this.camera.position.toArray();const beforeTarget=this.controls.target.toArray();
  const result=this.profile.boundPosition(before as [number,number,number]);this.camera.position.fromArray(result.position);
  // A camera may fly over the ruins, but never settle inside their stone.
  for(const c of this.profile.colliders)if(this.camera.position.y<c.top+.5){const dx=this.camera.position.x-c.x,dz=this.camera.position.z-c.z,ratio=Math.hypot(dx/c.rx,dz/c.rz);if(ratio<1){if(ratio<.001)this.camera.position.z=c.z+c.rz+.02;else{this.camera.position.x=c.x+dx/ratio*1.005;this.camera.position.z=c.z+dz/ratio*1.005}this.dirty=true}}
  this.controls.target.fromArray(this.profile.boundTarget(this.controls.target.toArray() as [number,number,number]));
  if(result.limited!==this.atBoundary){this.atBoundary=result.limited;this.callbacks.boundary(result.limited)}if(before.some((v,i)=>Math.abs(v-this.camera.position.getComponent(i))>.0001)||beforeTarget.some((v,i)=>Math.abs(v-this.controls.target.getComponent(i))>.0001))this.dirty=true;
 }
 private look(){this.dirty=true;this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ')}
 private cancelFlight=()=>{this.heldShot=null;this.targetFlight=null;this.currentLine=null;this.guided=false;this.controls.enableDamping=this.motion;this.callbacks.interaction?.()};
 private down=(e:PointerEvent)=>{if(this.paused)return;const twoFingers=e.pointerType==='touch'&&this.drag!==null;this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,pan:e.button===2||e.shiftKey||e.ctrlKey||e.metaKey||twoFingers};this.renderer.domElement.focus({preventScroll:true});if(this.mode==='walk')this.renderer.domElement.setPointerCapture(e.pointerId)};
 private move=(e:PointerEvent)=>{if(!this.drag||this.drag.id!==e.pointerId||this.paused)return;if(this.mode==='walk'){const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;if(this.drag.pan)this.pan(-dx,dy);else if(e.altKey){this.yaw-=dx*.004;this.pitch=T.MathUtils.clamp(this.pitch-dy*.004,-1.48,1.48);this.look()}else this.walk(dy*.055,-dx*.055)}this.drag.x=e.clientX;this.drag.y=e.clientY};
 private up=(e:PointerEvent)=>{if(this.renderer.domElement.hasPointerCapture(e.pointerId))this.renderer.domElement.releasePointerCapture(e.pointerId);this.drag=null};
 private cancelDrag=()=>{this.drag=null};
 private wheel=(e:WheelEvent)=>{if(this.mode==='walk'){e.preventDefault();this.zoom(e.deltaY<0)}};
 private keyDown=(e:KeyboardEvent)=>{
  if(this.paused)return;const k=e.key.toLowerCase();
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','+','-','=',' ','c','pageup','pagedown','shift'].includes(k)){
   e.preventDefault();this.cancelFlight();if(e.shiftKey)this.keys.add('shift');
   if(k==='+'||k==='=')this.zoom(true);else if(k==='-')this.zoom(false);
   else{this.keys.add(k);if(!e.repeat){if(k===' '||k==='pageup'||k==='pagedown'||k==='c')this.rise((k==='pagedown'||k==='c'||(k===' '&&e.shiftKey))?-1.2:1.2);
    else if(k.startsWith('arrow')){if(e.shiftKey)this.pan(k==='arrowleft'?20:k==='arrowright'?-20:0,k==='arrowup'?20:k==='arrowdown'?-20:0);else this.navigate(k.slice(5) as 'up'|'down'|'left'|'right')}
    else if(this.mode==='walk'&&['w','a','s','d'].includes(k))this.walk(k==='w'?.35:k==='s'?-.35:0,k==='d'?.35:k==='a'?-.35:0);
   }}
  }
 };
 private keyUp=(e:KeyboardEvent)=>{this.keys.delete(e.key.toLowerCase());if(!e.shiftKey)this.keys.delete('shift')};private clearKeys=()=>{this.keys.clear();this.drag=null};private context=(e:Event)=>e.preventDefault();
 private visibility=()=>{this.clearKeys();this.previous=0};private contextLost=(e:Event)=>{e.preventDefault();this.callbacks.error('The graphics connection was lost. Reload the world to return.');cancelAnimationFrame(this.frame)};
 private resize=()=>{this.dirty=true;const {width,height}=this.host.getBoundingClientRect();const nextFov=width<700?65:47;if(this.camera.fov===this.baseFov)this.camera.fov=nextFov;this.baseFov=nextFov;this.renderer.setSize(width,height);this.atmosphere.setSize(width,height);this.composer.setSize(width,height);this.contactOcclusion.setSize(Math.max(1,Math.round(width*.75)),Math.max(1,Math.round(height*.75)));this.camera.aspect=width/Math.max(height,1);this.camera.updateProjectionMatrix();if(this.currentLine!==null&&this.profile.slug==='ozymandias'&&(this.currentLine>=8&&this.currentLine<=10||this.currentLine===13)){const wasPaused=this.journeyPaused;this.goLine(this.currentLine,this.guided);this.journeyPaused=wasPaused}};
 private tick=(now:number)=>{if(this.disposed)return;this.frame=requestAnimationFrame(this.tick);const elapsed=this.previous?(now-this.previous)/1000:0,dt=Math.min(.04,elapsed);this.previous=now;if(document.hidden)return;
  if(!this.paused){
   let arrivedThisFrame=false;
   if(this.targetFlight&&!this.journeyPaused){
    const f=this.targetFlight;f.t=Math.min(1,f.t+(this.guided?Math.min(.1,elapsed):dt)/f.duration);
    const t=this.guided?(this.vision?f.t**3*(f.t*(f.t*6-15)+10):f.t):f.t*f.t*(3-2*f.t);
    if(f.fromFov!==f.toFov){const lens=f.t**3*(f.t*(f.t*6-15)+10);this.camera.fov=T.MathUtils.lerp(f.fromFov,f.toFov,lens);this.camera.updateProjectionMatrix()}
    if(f.path){const shot=f.path.sample(t);this.camera.position.copy(shot.position);this.controls.target.copy(shot.target);if(this.vision&&this.currentLine===0){const falcon=this.vision.markers().get(0);if(falcon)this.controls.target.lerp(falcon,Math.min(1,t*3))}}
    else{this.camera.position.lerpVectors(f.from,f.to,t);this.controls.target.lerpVectors(f.fromTarget,f.toTarget,t)}
    if(f.t===1){
     this.targetFlight=null;
     arrivedThisFrame=true;
     if(this.guided){const position=this.camera.position.clone(),target=this.controls.target.clone(),line=this.currentLine??0;this.heldShot={position,target,age:0,line,dolly:this.vision?null:new ReadingDolly(position,target,this.profile.terrainHeight,line)}}
     if(this.currentLine!==null)this.callbacks.arrived?.(this.currentLine);
    }
   }
   if(this.heldShot&&this.motion&&!this.journeyPaused&&!arrivedThisFrame){
    const h=this.heldShot;h.age=Math.min(this.profile.holds[h.line],h.age+Math.min(.1,elapsed));
    if(h.dolly){const shot=h.dolly.sample(h.age);this.camera.position.copy(shot.position);this.controls.target.copy(shot.target)}
    else{
     const phase=h.age/this.profile.holds[h.line],glide=phase*phase*(3-2*phase),side=new T.Vector3().subVectors(h.target,h.position);side.y=0;side.normalize();
     this.camera.position.copy(h.position).add(new T.Vector3(-side.z,0,side.x).multiplyScalar(glide*.35));
     this.camera.position.y=Math.max(this.camera.position.y,this.profile.terrainHeight(this.camera.position.x,this.camera.position.z)+1.85);
     if(this.vision&&h.line===0){const bird=this.vision.markers().get(0);if(bird)h.target.lerp(bird,Math.min(.08,dt*.85))}this.controls.target.copy(h.target);
    }
   }
   const input=navigationInput(this.keys,this.mode);
   if(input.rise)this.rise(input.rise*dt*6);
   if(input.panX||input.panY)this.pan(input.panX*dt*220,input.panY*dt*220);
   if(this.mode==='walk'){
    this.yaw+=input.yaw*dt*.9;this.pitch=T.MathUtils.clamp(this.pitch+input.pitch*dt*.7,-1.48,1.48);
    if(input.forward||input.side)this.walk(input.forward*dt*input.speed,input.side*dt*input.speed);else if(input.yaw||input.pitch)this.look();
   }else{
    if(input.yaw)this.controls.rotateLeft(input.yaw*dt*.6);if(input.pitch)this.controls.rotateUp(input.pitch*dt*.5);
    this.controls.update(dt);this.constrain();this.camera.lookAt(this.controls.target);
   }
   if(this.motion)this.time+=Math.min(.1,elapsed)
  }

  if(this.vision){this.vision.update(this.time,this.observedLine);const dry=desertWeight(this.camera.position.z),targetGloom=this.observedLine>=17?.52:0;this.sky.material.uniforms.time.value=this.time;this.sky.material.uniforms.cloudCoverage.value=.42*(1-dry);this.gloom+=(targetGloom-this.gloom)*(this.motion?Math.min(.05,dt*.5):1);this.renderer.toneMappingExposure=this.lightExposure*(1-this.gloom*.28);this.sun.intensity=this.lightPower*(1-this.gloom*.65)*(this.lightChoice==='late'?1+dry*.3:1);this.ambient.intensity=(this.lightChoice==='dusk'?.85:1.3)-dry*.25;if(this.lightChoice==='late'){this.sun.position.lerpVectors(new T.Vector3(-120,90,60),new T.Vector3(-80,165,50),dry);this.sun.color.copy(new T.Color('#dae5e5').lerp(new T.Color('#ffe8c9'),dry))}else this.sun.position.copy(this.selectedSun);const night=this.gloom/.52;this.twilight.value=night;this.sun.position.lerp(new T.Vector3(-150,-40,50),night);this.sky.material.uniforms.sunPosition.value.copy(this.sun.position);this.sun.intensity*=Math.max(0,1-night*1.12);this.ambient.intensity*=1-night*.52;this.atmosphere.setSun(this.sun.position,night>.15?'dusk':this.lightChoice);if(this.scene.fog instanceof T.FogExp2){this.scene.fog.color.lerp(new T.Color(this.observedLine>=17?'#727180':new T.Color('#96a8ad').lerp(new T.Color('#baa996'),dry)),this.motion?.025:1);this.scene.fog.density=.0035+this.gloom*.002}}

  if(this.assetGroup)this.projectMarkers(now)
  if((this.motion&&!this.paused)||this.dirty){const air=this.atmosphere.update(this.time,this.camera);this.ambience.update(this.time,air.gust,this.vision?1-desertWeight(this.camera.position.z):0,this.paused||this.journeyPaused);this.host.dataset.gust=air.gust.toFixed(3);this.host.dataset.windGrains=String(air.active);this.host.dataset.sunFacing=air.sunFacing.toFixed(3);this.renderer.info.reset();this.composer.render(dt);this.dirty=false;this.measuredFrames++;if(!this.measureStart)this.measureStart=now;if(now-this.measureStart>2000){this.host.dataset.fps=(this.measuredFrames*1000/(now-this.measureStart)).toFixed(1);this.measureStart=now;this.measuredFrames=0}}

  this.host.dataset.camera=this.camera.position.toArray().map(v=>v.toFixed(2)).join(',');this.host.dataset.triangles=String(this.renderer.info.render.triangles);this.host.dataset.mode=this.mode;this.host.dataset.pitch=this.camera.rotation.x.toFixed(3);this.host.dataset.yaw=this.camera.rotation.y.toFixed(3);this.host.dataset.boundary=String(this.atBoundary);this.host.dataset.target=this.controls.target.toArray().map(v=>v.toFixed(2)).join(',');this.host.dataset.wind=this.time.toFixed(2);this.host.dataset.journey=this.targetFlight?'travelling':'settled';
 };
 private projectMarkers(now:number){
  this.camera.updateMatrixWorld(true);
  const {width,height}=this.host.getBoundingClientRect(),ray=new T.Raycaster(),checkOcclusion=now-this.markerTime>100&&(!this.camera.matrixWorld.equals(this.occlusionView)||!this.camera.projectionMatrix.equals(this.occlusionProjection));
  if(checkOcclusion){this.markerTime=now;this.occlusionView.copy(this.camera.matrixWorld);this.occlusionProjection.copy(this.camera.projectionMatrix)}
  const anchors=this.vision?.markers();
  const points=this.profile.inspectionPoints.map(p=>{const worldPoint=anchors?.get(p.line)?.clone()??new T.Vector3(...p.point),distance=worldPoint.distanceTo(this.camera.position),point=worldPoint.clone().project(this.camera);
   const x=(point.x*.5+.5)*width,y=(-.5*point.y+.5)*height,top=height<560?160:215,bottom=height<560?height-110:height-210,inFrame=point.z>-1&&point.z<1&&x>34&&x<width-34&&y>top&&y<bottom;
   if(checkOcclusion&&inFrame){ray.set(this.camera.position,worldPoint.sub(this.camera.position).normalize());const hit=this.assetGroup?ray.intersectObject(this.assetGroup,true)[0]:undefined;this.markerOcclusion.set(p.line,!!hit&&hit.distance<distance-.6*RUIN_SCALE&&hit.object.userData.poemLine!==p.line)}
   return {line:p.line,label:p.label,x,y,visible:inFrame&&!this.markerOcclusion.get(p.line)};
  });
  // Preserve exact attachment points; hide a farther affordance rather than sliding icons apart.
  const occupied:{x:number;y:number}[]=[];
  for(const p of [...points].sort((a,b)=>Number(b.line===this.currentLine)-Number(a.line===this.currentLine))){if(!p.visible)continue;if(occupied.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<54))p.visible=false;else occupied.push(p)}
  this.callbacks.markers(points);
 }
 dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.observer.disconnect();this.controls.dispose();const c=this.renderer.domElement;c.removeEventListener('pointerdown',this.down);c.removeEventListener('pointermove',this.move);c.removeEventListener('pointerup',this.up);c.removeEventListener('pointercancel',this.cancelDrag);c.removeEventListener('wheel',this.wheel);c.removeEventListener('keydown',this.keyDown);c.removeEventListener('keyup',this.keyUp);c.removeEventListener('blur',this.clearKeys);c.removeEventListener('contextmenu',this.context);c.removeEventListener('webglcontextlost',this.contextLost);window.removeEventListener('blur',this.clearKeys);document.removeEventListener('visibilitychange',this.visibility);this.ambience.dispose();this.vision?.dispose();this.environment?.dispose();this.disposeObject(this.scene);this.bag.forEach(t=>t.dispose());this.output.dispose();this.contactOcclusion.dispose();this.composer.dispose();this.renderer.dispose();c.remove()}
}
