import * as T from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { fracturedBlock } from './fragments';
import { beastGaitShader } from './beast-motion';
import { furMaterial,makeMane,surfaceCoat,makeTailTuft } from './fur';
import { portraitSkin,portraitEye } from './vision-portrait';
import { makeFlightBird,birdFlight } from './birds';
import { makeFalconer,makeThreshold,makeCourt,makeMoor,organicMaterial,craftedTube } from './vision-craft';
import { fractureMaterial,fragmentCracks } from './fractures';
import { sandImprint,settlementDepth,STONE_DENSITY,type SandImprint } from './sediment';
import { visionTerrain } from './vision-geography';

function addMesh(group:T.Group,geometry:T.BufferGeometry,material:T.Material,line:number){const m=new T.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;m.userData.poemLine=line;group.add(m);return m}
function bearing(mesh:T.Mesh,imprints:SandImprint[],burial=.18){
 mesh.updateMatrixWorld(true);const box=new T.Box3().setFromObject(mesh),size=box.getSize(new T.Vector3());
 const mass=size.x*size.y*size.z*.66*STONE_DENSITY,depth=settlementDepth(mass,Math.max(.2,size.x*size.z*.6),size.y,burial);
 mesh.position.y+=visionTerrain(mesh.position.x,mesh.position.z)-box.min.y-depth;
 imprints.push(sandImprint(mesh.position.x,mesh.position.z,size.x*.5,size.z*.5,size.x*size.y*size.z*.66,false,mesh.rotation.y));
}
function tube(points:[number,number,number][],radius:number,material:T.Material){return new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),40,radius,8,false),material)}
function tideSurface(){
 const rings=32,segments=128,positions=[0,0,0],indices:number[]=[];
 for(let r=1;r<=rings;r++)for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2;positions.push(Math.cos(a)*18.275*r/rings,Math.sin(a)*31.175*r/rings,0)}
 for(let i=0;i<segments;i++)indices.push(0,1+i,1+(i+1)%segments);
 for(let r=1;r<rings;r++)for(let i=0;i<segments;i++){const a=1+(r-1)*segments+i,b=1+(r-1)*segments+(i+1)%segments,c=1+r*segments+i,d=1+r*segments+(i+1)%segments;indices.push(a,c,d,a,d,b)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export type VisionScene={group:T.Group;update:(time:number,line:number)=>void;resetJourney:()=>void;markers:()=>Map<number,T.Vector3>;dispose:()=>void};
export async function makeVision(stone:T.MeshStandardMaterial,imprints:SandImprint[]):Promise<VisionScene>{
 const group=new T.Group();group.name='The Second Coming: a vision to enter';
 const wood=organicMaterial('#584839','wood');
 const paler=stone.clone();paler.onBeforeCompile=stone.onBeforeCompile;paler.color.set('#aaa59c');
 const falconer=await makeFalconer();group.add(falconer,makeCourt(stone),makeThreshold(stone));
 const moor=makeMoor();group.add(moor.group);
 // One material landscape: wind-scoured coast becomes the sands of the vision.
 for(let i=0;i<26;i++){
  const geometry=fracturedBlock(903+i),m=addMesh(group,geometry,fractureMaterial(paler,fragmentCracks(i+36),.93),3);
  m.scale.set(.25+(i%4)*.22,.2+(i%3)*.25,.35+(i%5)*.17);m.rotation.set(.13*i,.91*i,.08*i);m.position.set(-23+Math.sin(i*7)*17,0,19+Math.cos(i*5)*13);bearing(m,imprints,.28);
 }
 // The coast falls to a real sea shelf; waves have a common direction and phase.
 const seaTime={value:0},seaMaterial=new T.MeshStandardMaterial({color:'#35484b',roughness:.42,metalness:.12});
 seaMaterial.onBeforeCompile=shader=>{shader.uniforms.uSeaTime=seaTime;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uSeaTime;varying vec3 vSea;').replace('#include <begin_vertex>','#include <begin_vertex>\nvSea=position;transformed.z+=.16*sin(position.x*.09+position.y*.06-uSeaTime*.75)+.07*sin(position.x*.24-uSeaTime*1.1);');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float uSeaTime;varying vec3 vSea;').replace('#include <map_fragment>','#include <map_fragment>\nfloat foam=pow(.5+.5*sin(vSea.x*.09+vSea.y*.06-uSeaTime*.75),22.0);diffuseColor.rgb+=vec3(.07,.08,.075)*foam;')};
 const sea=addMesh(group,new T.PlaneGeometry(290,260,150,150),seaMaterial,4);sea.rotation.x=-Math.PI/2;sea.position.set(-224,-5.6,25);sea.castShadow=false;
 for(let i=0;i<17;i++){const cliff=addMesh(group,fracturedBlock(730+i),paler,3);cliff.scale.set(3+i%3,2+i%4,4);cliff.rotation.y=i*.6;cliff.position.set(-79-i%2*3,0,115-i*9);bearing(cliff,imprints,.7)}
 // Cloth responds to wind at its free edges, while the mast stays planted.
 const flagTime={value:0};const flagMaterial=organicMaterial('#743e38','cloth');flagMaterial.side=T.DoubleSide;
 const flagCompile=flagMaterial.onBeforeCompile;flagMaterial.onBeforeCompile=(shader,r)=>{flagCompile(shader,r);shader.uniforms.uFlagTime=flagTime;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uFlagTime;').replace('#include <begin_vertex>','#include <begin_vertex>\nfloat freeEdge=(position.x+1.4)/2.8;transformed.z+=freeEdge*.26*sin(position.x*2.2+position.y*1.6-uFlagTime*2.1);')};
 for(const x of [-17,-28]){const pole=addMesh(group,new T.CylinderGeometry(.045,.06,4.6,16),wood,7);pole.position.set(x,visionTerrain(x,10)+2.3,10);const flag=addMesh(group,new T.PlaneGeometry(2.8,.9,30,10),flagMaterial,7);flag.position.set(x+1.4,visionTerrain(x,10)+3.6,10);flag.castShadow=false}
 const loader=new STLLoader();const [bodyRaw,portrait]=await Promise.all([loader.loadAsync('./world/vision/lion-body.stl'),new GLTFLoader().loadAsync('./world/vision/human-portrait.glb')]);
 let portraitMesh:T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>|null=null;portrait.scene.traverse(o=>{if(o instanceof T.Mesh)portraitMesh=o});
 const portraitSource=portraitMesh as unknown as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;
 const prepare=(raw:T.BufferGeometry)=>{raw.deleteAttribute('normal');const g=mergeVertices(raw,.0001);raw.dispose();g.computeVertexNormals();const uv=new Float32Array(g.attributes.position.count*2);for(let i=0;i<g.attributes.position.count;i++){uv[i*2]=g.attributes.position.getX(i)*.25;uv[i*2+1]=g.attributes.position.getY(i)*.25}g.setAttribute('uv',new T.BufferAttribute(uv,2));return g};
 const bodyGeometry=prepare(bodyRaw),headGeometry=portraitSource.geometry;headGeometry.computeVertexNormals();
 const beast=new T.Group();beast.name='Lion body and the head of a man';beast.position.set(25,visionTerrain(25,-82)+.029,-82);beast.rotation.y=Math.PI+.35;beast.scale.setScalar(1.45);group.add(beast);
 const beastMaterial=furMaterial();
 const breath={value:0},gait={value:0},gaitWeight={value:0};const compile=beastMaterial.onBeforeCompile;
 beastMaterial.onBeforeCompile=(shader,r)=>{compile(shader,r);shader.uniforms.uBreath=breath;shader.uniforms.uGait=gait;shader.uniforms.uGaitWeight=gaitWeight;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uBreath;uniform float uGait;uniform float uGaitWeight;').replace('#include <begin_vertex>','#include <begin_vertex>\nfloat ribs=smoothstep(3.5,5.0,position.y)*(1.0-smoothstep(7.0,8.5,position.y));transformed.x*=1.0+sin(uBreath*.55)*.006*ribs;'+beastGaitShader)};beastMaterial.customProgramCacheKey=()=> 'living-lion-breath';
 const body=addMesh(beast,bodyGeometry,beastMaterial,13),coat=surfaceCoat(bodyGeometry);
 // Fibre roots use the same paw deformation as the skin beneath them.
 const coatMaterial=coat.material as T.MeshStandardMaterial;
 coatMaterial.onBeforeCompile=shader=>{shader.uniforms.uGait=gait;shader.uniforms.uGaitWeight=gaitWeight;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uGait;uniform float uGaitWeight;').replace('#include <project_vertex>',T.ShaderChunk.project_vertex.replace('mvPosition = instanceMatrix * mvPosition;','mvPosition = instanceMatrix * mvPosition;\nvec3 positionRoot=mvPosition.xyz,transformedRoot=positionRoot;'+beastGaitShader.replaceAll('position','positionRoot').replaceAll('transformed','transformedRoot')+'mvPosition.xyz=transformedRoot;'))};coatMaterial.customProgramCacheKey=()=> 'combed-fibres-follow-paws';beast.add(coat);
 const depthMaterial=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking});depthMaterial.onBeforeCompile=shader=>{shader.uniforms.uGait=gait;shader.uniforms.uGaitWeight=gaitWeight;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uGait;uniform float uGaitWeight;').replace('#include <begin_vertex>','#include <begin_vertex>'+beastGaitShader)};body.customDepthMaterial=depthMaterial;
 const head=addMesh(beast,headGeometry,portraitSkin(portraitSource.material.map??undefined),14);head.scale.setScalar(.62);head.position.set(0,6.5,4.55);
 const eyeMaterial=portraitEye();
 for(const side of [-1,1]){const eye=new T.Mesh(new T.SphereGeometry(1,32,20),eyeMaterial);eye.scale.set(.29,.245,.28);eye.position.set(side*.67331,2.89830,1.54811);head.add(eye)}
 beast.add(makeMane(bodyGeometry));
 const tail=craftedTube([[0,6.55,-4.5],[.48,4.5,-5.25],[1.1,2.05,-5.6],[1.48,.75,-5.3],[1.75,.94,-4.96]],.13,beastMaterial);tail.castShadow=true;beast.add(tail);
 const tuft=makeTailTuft();tuft.position.set(1.75,.94,-4.96);beast.add(tuft);
 // Four load-bearing paws retain their plantar contact during the breathing cycle.
 for(const px of [-1.46,1.46])for(const pz of [3.48,-3.51]){const point=beast.localToWorld(new T.Vector3(px,0,pz));imprints.push(sandImprint(point.x,point.z,1.05,1.2,.08,false,.35))}
 // A sunken tide occupies an actual basin. It cannot float over the dunes.
 const tideGeometry=tideSurface();
 const tideShader={uniforms:{color:{value:new T.Color('#75414d')},tDiffuse:{value:null},textureMatrix:{value:new T.Matrix4()},uTideTime:{value:0}},
  vertexShader:`uniform mat4 textureMatrix;uniform float uTideTime;varying vec4 vUv;varying vec2 vTide;varying vec3 vWaterWorld;
   #include <common>
   #include <logdepthbuf_pars_vertex>
   void main(){vTide=position.xy;vec3 p=position;float shore=1.0-smoothstep(.95,1.075,length(vTide/vec2(17.0,29.0)));p.z+=(.035*sin(p.x*.7+p.y*.22-uTideTime*.62)+.016*sin(p.y*.9-uTideTime*.4))*shore;
    vWaterWorld=(modelMatrix*vec4(p,1.0)).xyz;vUv=textureMatrix*vec4(position,1.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
    #include <logdepthbuf_vertex>
   }`,
  fragmentShader:`uniform sampler2D tDiffuse;uniform float uTideTime;varying vec4 vUv;varying vec2 vTide;varying vec3 vWaterWorld;
   #include <common>
   #include <logdepthbuf_pars_fragment>
   void main(){
    #include <logdepthbuf_fragment>
    float coast=length(vTide/vec2(17.0,29.0));if(coast>1.075)discard;
    vec2 slope=vec2(.045*cos(vTide.x*.7+vTide.y*.22-uTideTime*.62),.025*cos(vTide.y*.9-uTideTime*.4));
    vec4 projected=vUv;projected.xy+=slope*.045*projected.w;vec3 reflected=texture2DProj(tDiffuse,projected).rgb;
    vec3 n=normalize(vec3(-slope.x,1.0,slope.y)),eyeDirection=normalize(cameraPosition-vWaterWorld);
    float fresnel=.02+.98*pow(1.0-max(dot(n,eyeDirection),0.0),5.0);
    vec3 light=mix(vec3(.10,.012,.025),reflected*vec3(1.0,.64,.70),.15+fresnel*.76);
    light*=1.0-smoothstep(.99,1.075,coast)*.14;gl_FragColor=vec4(light,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`};
 const tide=new Reflector(tideGeometry,{textureWidth:512,textureHeight:512,multisample:0,clipBias:.002,shader:tideShader});
 const tideMaterial=tide.material as T.ShaderMaterial;
 const reflect=tide.onBeforeRender;tide.onBeforeRender=(...args)=>{if(!args[1].overrideMaterial)reflect.apply(tide,args)};
 tide.rotation.x=-Math.PI/2;tide.position.set(-43,-.8,-10);tide.userData.poemLine=4;group.add(tide);
 // An abandoned ceremony at the bank; stones are half buried, not hovering props.
 for(let i=0;i<7;i++){const m=addMesh(group,fracturedBlock(948+i),fractureMaterial(paler,fragmentCracks(948+i),.93),5);m.scale.set(1.1,.75,1.1);m.position.set(-26-i*.6,0,-13-i*2.3);m.rotation.y=i*.7;bearing(m,imprints,.35)}
 const cradle=new T.Group();cradle.position.set(-5,visionTerrain(-5,-139),-139);group.add(cradle);
 for(const side of [-1,1]){const rocker=tube([[-1.15,.32,side*.65],[-.6,.07,side*.65],[0,-.02,side*.65],[.6,.07,side*.65],[1.15,.32,side*.65]],.065,wood);cradle.add(rocker)}
 for(const x of [-.65,.65])for(const side of [-1,1]){const support=addMesh(cradle,new T.BoxGeometry(.11,.49,.11),wood,19);support.position.set(x,.31,side*.65)}
 const bed=addMesh(cradle,new T.BoxGeometry(1.8,.12,1.1,8,1,5),wood,19);bed.position.y=.5;
 for(let i=0;i<13;i++)for(const side of [-1,1]){const rib=addMesh(cradle,new T.CylinderGeometry(.035,.042,.64,8),wood,19);rib.position.set(-.86+i*.143,.84,side*.55);const rail=tube([[-.95,1.17,side*.55],[0,1.25,side*.55],[.95,1.17,side*.55]],.055,wood);if(i===0)cradle.add(rail)}
 for(const side of [-1,1]){const end=addMesh(cradle,new T.BoxGeometry(.12,.68,1.12,2,4,5),wood,19);end.position.set(side*.91,.86,0)}
 const birds=Array.from({length:10},(_,i)=>{const b=makeFlightBird(i>0);b.group.scale.setScalar(i===0?1.45:1.15);group.add(b.group);return b});
 const pointMap=new Map<number,T.Vector3>();
 let previousTime=0;
 const update=(time:number,line:number)=>{
  const dt=Math.min(.1,Math.max(0,time-previousTime));previousTime=time;const moving=line===15||line>=20;gaitWeight.value+=(Number(moving&&gait.value<11.6)-gaitWeight.value)*Math.min(1,dt*.9);gait.value+=dt*gaitWeight.value;
  const travel=Math.min(3.8,gait.value*.2917);beast.position.set(25-Math.sin(.35)*travel,visionTerrain(25,-82)+.029,-82-Math.cos(.35)*travel);
  tideMaterial.uniforms.uTideTime.value=time;breath.value=time;seaTime.value=time;flagTime.value=time;moor.update(time);
  for(let i=0;i<birds.length;i++){const b=birds[i],flight=birdFlight(time,i===0?new T.Vector3(-22,0,48):beast.position,i===0,i);b.group.position.copy(flight.position);b.group.lookAt(flight.position.clone().add(flight.tangent));b.pose(time+i*.6,flight.bank,flight.powered)}
  const rock=line>=17?Math.sin(time*.24)*.015:0;cradle.rotation.z=rock;cradle.position.y=visionTerrain(-5,-139)+1.1*(1-Math.cos(rock));
  pointMap.set(0,birds[0].group.position.clone());
  // Keep the apparition's soles planted; its body slowly shifts above those contacts.
  pointMap.set(14,head.localToWorld(new T.Vector3(-1.9,3.0,1.4)));pointMap.set(13,body.localToWorld(new T.Vector3(-2,6.4,1)));
 };
 update(0,0);
 return {group,update,resetJourney:()=>{gait.value=0;gaitWeight.value=0;update(previousTime,0)},markers:()=>pointMap,dispose:()=>{tide.dispose();depthMaterial.dispose()}};
}
