import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { fracturedBlock } from './fragments';
import { fractureMaterial,fragmentCracks,type StoneCrack } from './fractures';
import { visionTerrain,desertWeight } from './vision-geography';

export function craftedMesh(group:T.Group,g:T.BufferGeometry,m:T.Material){const o=new T.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;group.add(o);return o}
export function craftedTube(points:number[][],radius:number,m:T.Material,segments=32){return new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments,radius,8,false),m)}
export function organicMaterial(color:string,kind:'fur'|'skin'|'cloth'|'wood'){
 const m=new T.MeshStandardMaterial({color,roughness:kind==='skin'?.82:.96,metalness:0});
 m.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vCraftPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nvCraftPosition=position;');
  const frequency=kind==='fur'?95:kind==='wood'?19:kind==='cloth'?260:110;
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vCraftPosition;').replace('#include <map_fragment>',`#include <map_fragment>
   float fibre=sin(vCraftPosition.x*${frequency}.0+sin(vCraftPosition.z*11.0)*2.0)*sin(vCraftPosition.z*${(frequency/3).toFixed(3)}+vCraftPosition.y*4.0);
   float wearPatch=sin(vCraftPosition.x*2.3+vCraftPosition.z*.7)*sin(vCraftPosition.y*3.1-vCraftPosition.z*.6);
   diffuseColor.rgb*=.92+fibre*.025+wearPatch*.05;
   ${kind==='fur'?'diffuseColor.rgb*=1.0-.08*smoothstep(3.0,7.5,vCraftPosition.y);':''}
  `);
 };m.customProgramCacheKey=()=>`crafted-${kind}`;return m;
}
export async function makeFalconer(){
 const group=new T.Group();group.name='The abandoned glove';group.position.set(-22,visionTerrain(-22,48),48);group.rotation.y=.35;
 const asset=await new GLTFLoader().loadAsync('./world/vision/falconer.glb');
 asset.scene.traverse(o=>{if(o instanceof T.Mesh){const material=organicMaterial('#ffffff','cloth');material.vertexColors=true;o.material=material;o.castShadow=true;o.receiveShadow=true}});group.add(asset.scene);
 const wool=organicMaterial('#4c5149','cloth'),leather=organicMaterial('#3d3026','wood');
 const coat=new T.LatheGeometry([new T.Vector2(.34,.34),new T.Vector2(.33,.65),new T.Vector2(.245,1.12),new T.Vector2(.285,1.40),new T.Vector2(.18,1.55)],64,.16,Math.PI*2-.32);
 const p=coat.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i),a=Math.atan2(p.getZ(i),p.getX(i)),fold=.009*Math.sin(a*17)*(1.5-y);p.setX(i,p.getX(i)+Math.cos(a)*fold);p.setZ(i,p.getZ(i)+Math.sin(a)*fold)}coat.computeVertexNormals();
 const coatMesh=craftedMesh(group,coat,wool);wool.side=T.DoubleSide;coatMesh.name='Weighted wool coat';
 const collar=craftedMesh(group,new T.TorusGeometry(.116,.024,8,48,.86*Math.PI*2),wool);collar.rotation.x=Math.PI/2;collar.position.set(0,1.62,.012);
 for(let i=0;i<5;i++){const button=craftedMesh(group,new T.SphereGeometry(.012,12,8),leather);button.position.set(-.07,1.36-i*.14,.23)}
 // A hood rests on the shoulder and two weighted scarf ends follow gravity.
 const scarfMaterial=organicMaterial('#70695b','cloth');
 group.add(craftedTube([[-.08,1.61,.08],[-.14,1.39,.23],[-.10,1.06,.25]],.045,scarfMaterial));
 group.add(craftedTube([[.08,1.61,.07],[.18,1.45,.24],[.23,1.15,.22]],.035,scarfMaterial));
 const cap=craftedMesh(group,new T.SphereGeometry(1,36,20,0,Math.PI*2,0,Math.PI*.5),wool);cap.scale.set(.117,.072,.13);cap.position.set(0,1.844,.012);
 const brim=craftedMesh(group,new T.SphereGeometry(1,24,12),wool);brim.scale.set(.116,.011,.095);brim.position.set(0,1.84,.088);
 return group;
}

function archStone(inner:number,outer:number,a:number,b:number,depth:number){
 const shape=new T.Shape();shape.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);shape.absarc(0,0,inner,a,b,false);shape.lineTo(Math.cos(b)*outer,Math.sin(b)*outer);shape.absarc(0,0,outer,b,a,true);shape.closePath();
 const g=new T.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:10,bevelEnabled:true,bevelThickness:.015,bevelSize:.014,bevelSegments:2});g.translate(0,0,-depth*.5);return g;
}
function masonryBlock(width:number,height:number,depth:number,seed:number,brokenTop=false){
 const g=new T.BoxGeometry(width,height,depth,12,6,10),p=g.attributes.position,r=.026;
 const half=new T.Vector3(width/2,height/2,depth/2),inner=half.clone().addScalar(-r);
 for(let i=0;i<p.count;i++){
  const original=new T.Vector3().fromBufferAttribute(p,i),core=original.clone().clamp(inner.clone().negate(),inner),edge=original.clone().sub(core).normalize().multiplyScalar(r),point=core.add(edge);
  const erosion=.008*Math.sin(original.x*19+seed)*Math.sin(original.z*17+original.y*13);
  if(Math.abs(original.y)<height*.45){point.x+=erosion;point.z+=erosion*.7}
  if(brokenTop&&original.y>height*.42)point.y-=.035+.07*(.5+.5*Math.sin(original.x*11+seed)*Math.cos(original.z*13));
  p.setXYZ(i,point.x,point.y,point.z);
 }g.computeVertexNormals();return g;
}
function masonryCracks(seed:number,width:number,height:number):StoneCrack[]{
 if(seed%4===0||seed%4===2)return [];
 const offset=Math.sin(seed*1.71)*width*.22;
 const points=Array.from({length:8},(_,i)=>[offset+Math.sin(seed+i*2.43)*.046,-height*.48+height*.96*i/7] as [number,number]);
 return [{plane:'xy',face:1,width:.004+(seed%3)*.002,points}];
}
export function makeThreshold(stone:T.MeshStandardMaterial){
 const g=new T.Group();g.name='The road towards Bethlehem';g.position.set(-25,visionTerrain(-25,-175),-175);
 const material=stone.clone();material.onBeforeCompile=stone.onBeforeCompile;material.color.set('#918475');
 for(const side of [-1,1])for(let j=0;j<7;j++){
  const course=craftedMesh(g,masonryBlock(2.75,.74,3.25,220+j),fractureMaterial(material,masonryCracks(220+j+(side>0?50:0),2.75,.74),.97));course.position.set(side*5.82,.35+j*.73,0);
  const buttress=craftedMesh(g,masonryBlock(1.4,.74,4.0,330+j),material);buttress.position.set(side*7.35,.35+j*.73,.42);
 }
 const mortar=craftedMesh(g,archStone(4.45,5.75,0,Math.PI,3.12),new T.MeshStandardMaterial({color:'#544c42',roughness:1}));mortar.position.y=5.05;
 const count=19;for(let i=0;i<count;i++){const a=i/count*Math.PI+.004,b=(i+1)/count*Math.PI-.004;const wedge=craftedMesh(g,archStone(4.45,5.75,a,b,3.25),fractureMaterial(material,[],.93+(i%5)*.014));wedge.position.y=5.05}
 // Spandrel walls have actual bearing courses and an irregular broken skyline.
 for(const side of [-1,1])for(let j=0;j<5;j++)for(let k=0;k<6;k++){
  if(j>2&&k%3===0)continue;const width=1.72,height=.72;const block=craftedMesh(g,masonryBlock(width,height,1.8,350+k+j*6,j===4),material);block.position.set(side*(8.8+k*1.73),height/2+j*.70,.65);
 }
 const keystone=craftedMesh(g,new T.BoxGeometry(.36,.06,3.0),material);keystone.position.set(0,10.80,0);

 return g;
}

export function makeCourt(stone:T.MeshStandardMaterial){
 const g=new T.Group();g.name='A broken ceremonial court';g.position.set(-22,0,20);
 const material=stone.clone();material.onBeforeCompile=stone.onBeforeCompile;material.color.set('#8d9692');
 // A ruined apsidal wall: a recognizable structure, its centre left empty.
 for(let column=0;column<42;column++){
  const a=(column/41*1.55+.20)*Math.PI,r=9.4,height=2.4+1.3*Math.sin(column*.13)**2+.3*Math.sin(column*.29);
  for(let j=0;j<Math.floor(height/.65);j++){const block=craftedMesh(g,masonryBlock(1.22,.67,1.1,440+column*7+j,j===Math.floor(height/.65)-1),material);block.position.set(Math.cos(a)*r,.28+j*.64+visionTerrain(-22+Math.cos(a)*r,20+Math.sin(a)*r),Math.sin(a)*r);block.rotation.y=-a+Math.PI/2}
 }
 // Displaced keystone/altar fragments retain worked faces and weight.
 for(let i=0;i<19;i++){const chunk=craftedMesh(g,fracturedBlock(400+i),fractureMaterial(material,fragmentCracks(400+i),.93));chunk.scale.set(.5+(i%4)*.3,.35+(i%3)*.27,.7+(i%4)*.2);chunk.rotation.set(.1*i,.81*i,.07*i);chunk.position.set(Math.sin(i*5.2)*10,0,Math.cos(i*3.1)*8);chunk.updateMatrixWorld();const min=new T.Box3().setFromObject(chunk).min.y;chunk.position.y-=min+.12}
 for(let i=0;i<6;i++){const chair=new T.Group();chair.position.set(-5+i*1.7,visionTerrain(-27+i*1.7,17),-3);g.add(chair);const seat=craftedMesh(chair,new T.BoxGeometry(.8,.13,.7),material);seat.position.y=.58;for(const x of [-.32,.32])for(const z of [-.27,.27]){const leg=craftedMesh(chair,new T.BoxGeometry(.12,.62,.12),material);leg.position.set(x,.30,z)}const back=craftedMesh(chair,new T.BoxGeometry(.8,.62,.13),material);back.position.set(0,.9,-.32)}
 return g;
}

export function makeMoor(){
 const group=new T.Group(),time={value:0};group.name='Wind-struck coastal common';
 const tufts:T.BufferGeometry[]=[];
 for(let blade=0;blade<5;blade++){
  const positions:number[]=[],uv:number[]=[],indices:number[]=[];const height=.19+blade*.047;
  for(let j=0;j<=7;j++){const t=j/7,w=.009*(1-t)**.65;positions.push(t*t*.085-w,height*t,t*t*.022,t*t*.085+w,height*t,t*t*.022);uv.push(0,t,1,t)}
  for(let j=0;j<7;j++){const a=j*2;indices.push(a,a+2,a+1,a+1,a+2,a+3)}
  const bladeGeometry=new T.BufferGeometry();bladeGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));bladeGeometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));bladeGeometry.setIndex(indices);bladeGeometry.computeVertexNormals();bladeGeometry.rotateY(blade*2.4);bladeGeometry.translate(Math.sin(blade*2.4)*.025,0,Math.cos(blade*2.4)*.025);tufts.push(bladeGeometry);
 }const geometry=mergeGeometries(tufts)!;tufts.forEach(g=>g.dispose());
 const material=new T.MeshStandardMaterial({color:'#737f57',roughness:1,side:T.DoubleSide,vertexColors:false});
 material.onBeforeCompile=s=>{s.uniforms.uWind=time;s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nuniform float uWind;').replace('#include <begin_vertex>','#include <begin_vertex>\nvec3 root=(instanceMatrix*vec4(0.0,0.0,0.0,1.0)).xyz;float bend=position.y*position.y;transformed.x+=bend*(.35+.26*sin(root.x*.11+root.z*.13-uWind*1.4));transformed.z+=bend*.16*sin(root.z*.27-uWind);')};
 const count=15000,grass=new T.InstancedMesh(geometry,material,count),dummy=new T.Object3D();let seed=8271;
 const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};let placed=0;
 for(let i=0;i<count*3&&placed<count;i++){const x=-74+rand()*134,z=-31+rand()*157;
  const pathX=-5+Math.sin(z*.04)*7;if(Math.abs(x-pathX)<2.3||Math.hypot((x+43)/20,(z+10)/32)<1.1||Math.hypot(x+22,z-20)<12||Math.hypot(x+22,z-48)<2)continue;
  dummy.position.set(x,visionTerrain(x,z)-.012,z);dummy.rotation.set(0,rand()*Math.PI*2,.1*(rand()-.5));const size=.45+rand()*.7;dummy.scale.set(.8+rand(),size,size);dummy.updateMatrix();grass.setMatrixAt(placed++,dummy.matrix);grass.setColorAt(placed-1,new T.Color().setHSL(.18+rand()*.06,.13+rand()*.1,.20+rand()*.16));
 }grass.count=placed;grass.receiveShadow=true;group.add(grass);
 return {group,update:(t:number)=>{time.value=t}};
}

export function visionGroundMaterial(sand:T.MeshStandardMaterial){
 const m=sand.clone();m.color.set('#ccc1a6');m.normalScale.set(.35,.35);
 m.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vLand;').replace('#include <begin_vertex>','#include <begin_vertex>\nvLand=position;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vLand;').replace('#include <map_fragment>',`#include <map_fragment>
   float dry=1.0-smoothstep(-65.0,-25.0,vLand.z);
   float wearPatch=.5+.5*sin(vLand.x*.23+sin(vLand.z*.17)*2.0)*sin(vLand.z*.14);
   float grit=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
   vec3 turf=mix(vec3(.19,.235,.18),vec3(.32,.35,.26),wearPatch)*(grit*.5+.65);
   vec3 sand=mix(vec3(.67,.56,.39),diffuseColor.rgb,.82);
   float road=1.0-smoothstep(1.0,3.4,abs(vLand.x-(-5.0+sin(vLand.z*.04)*7.0)));
   turf=mix(turf,vec3(.34,.32,.25)*(grit*.35+.8),road*.7);
   float thresholdRoad=(1.0-smoothstep(2.4,4.2,abs(vLand.x+25.0+sin(vLand.z*.08)*.3)))*(1.0-smoothstep(-132.0,-121.0,vLand.z));
   sand=mix(sand,vec3(.37,.32,.25)*(grit*.4+.7),thresholdRoad*.55);
   diffuseColor.rgb=mix(turf,sand,dry);
  `);
 };m.customProgramCacheKey=()=>`coast-to-vision-${desertWeight(0)}`;return m;
}
