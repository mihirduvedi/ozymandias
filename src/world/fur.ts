import * as T from 'three';

// Colour is absorption only; there is no painted light or shadow in this map.
function coatMap(dark:boolean){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const c=canvas.getContext('2d')!;
 c.fillStyle=dark?'#796452':'#c9b69a';c.fillRect(0,0,1024,1024);let seed=1297;
 const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<2200;i++){const x=rand()*1024,y=rand()*1024,r=8+rand()*42,t=rand(),gradient=c.createRadialGradient(x,y,0,x,y,r);gradient.addColorStop(0,`rgba(${dark?72:124},${dark?52:111},${dark?36:91},${.05+t*.10})`);gradient.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gradient;c.fillRect(x-r,y-r,r*2,r*2)}
 for(let i=0;i<80000;i++){const x=rand()*1024,y=rand()*1024,l=7+rand()*31,t=rand(),r=dark?77+t*65:159+t*57,g=dark?57+t*52:145+t*51,b=dark?39+t*37:119+t*42;
  c.strokeStyle=`rgba(${r},${g},${b},${.25+rand()*.4})`;c.lineWidth=.65+rand()*.5;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.sin(y*.012)*3,y-l*.7,x+Math.sin(y*.012)*7,y-l);c.stroke();
 }
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=8;return map;
}
export function furMaterial(dark=false){
 const material=new T.MeshPhysicalMaterial({color:dark?'#ae8a62':'#d8b383',roughness:.95,metalness:0,map:coatMap(dark),sheen:.42,sheenRoughness:.8,sheenColor:new T.Color('#aa9479'),specularIntensity:.10});
 material.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vCoatPosition;varying vec3 vCoatNormal;').replace('#include <begin_vertex>','#include <begin_vertex>\nvCoatPosition=position;vCoatNormal=normal;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vCoatPosition;varying vec3 vCoatNormal;').replace('#include <map_fragment>',`
   vec3 blend=pow(abs(vCoatNormal),vec3(5.0));blend/=blend.x+blend.y+blend.z;
   vec3 coat=texture2D(map,vCoatPosition.zy*.74).rgb*blend.x+texture2D(map,vCoatPosition.xy*.74).rgb*blend.z+texture2D(map,vCoatPosition.xz*.74).rgb*blend.y;
   float undercoat=1.0-smoothstep(2.5,5.4,vCoatPosition.y);
   float mottling=sin(vCoatPosition.z*3.7+sin(vCoatPosition.y*3.0))*sin(vCoatPosition.y*4.1+sin(vCoatPosition.z*2.1));
   float neck=smoothstep(1.3,3.9,vCoatPosition.z)*smoothstep(4.1,7.0,vCoatPosition.y);
   diffuseColor.rgb*=coat*(.94+mottling*.055);
   ${dark?'diffuseColor.rgb*=vec3(.76,.71,.64);':'diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.43,.33,.23),neck*.66);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.43,.36,.27),undercoat*.26);'}
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   float furHeight=dot(coat,vec3(.299,.587,.114));vec3 hairDx=dFdx(vViewPosition),hairDy=dFdy(vViewPosition);vec3 rx=cross(hairDy,normal),ry=cross(normal,hairDx);float determinant=dot(hairDx,rx);normal=normalize(abs(determinant)*normal-.035*sign(determinant)*(dFdx(furHeight)*rx+dFdy(furHeight)*ry));
  `);
 };material.customProgramCacheKey=()=>`combed-coat-${dark}`;return material;
}
function hairCardMap(){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=1024;const c=canvas.getContext('2d')!;c.clearRect(0,0,256,1024);
 let seed=683;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<120;i++){const x=8+rand()*240,l=670+rand()*354,t=rand();c.strokeStyle=`rgba(${174+t*45},${160+t*41},${134+t*40},${.7+rand()*.3})`;c.lineWidth=1+rand()*2;c.beginPath();c.moveTo(x,1024);c.bezierCurveTo(x+4,700,x+(rand()-.5)*19,300,x+(rand()-.5)*26,1024-l);c.stroke()}
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;return map;
}
function sampleSurface(geometry:T.BufferGeometry,rand:()=>number,point:T.Vector3,normal:T.Vector3){
 const p=geometry.attributes.position,n=geometry.attributes.normal,index=geometry.index,tri=Math.floor(rand()*(index?index.count:p.count)/3)*3;
 const a=index?index.getX(tri):tri,b=index?index.getX(tri+1):tri+1,c=index?index.getX(tri+2):tri+2,r=Math.sqrt(rand()),v=rand(),wa=1-r,wb=r*(1-v),wc=r*v;
 point.set(p.getX(a)*wa+p.getX(b)*wb+p.getX(c)*wc,p.getY(a)*wa+p.getY(b)*wb+p.getY(c)*wc,p.getZ(a)*wa+p.getZ(b)*wb+p.getZ(c)*wc);
 normal.set(n.getX(a)*wa+n.getX(b)*wb+n.getX(c)*wc,n.getY(a)*wa+n.getY(b)*wb+n.getY(c)*wc,n.getZ(a)*wa+n.getZ(b)*wb+n.getZ(c)*wc).normalize();
}
const smooth=(a:number,b:number,x:number)=>{const t=T.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
export function makeMane(body:T.BufferGeometry){
 const group=new T.Group();group.name='Mane rooted in the continuous shoulders and neck';
 // Every root belongs to the actual anatomical surface. There is no detached
 // collar shell, and fibre length falls continuously into the short shoulder coat.
 const geometry=new T.PlaneGeometry(1,1,1,6),p=geometry.attributes.position;
 for(let i=0;i<p.count;i++){const t=p.getY(i)+.5;p.setXYZ(i,p.getX(i)*(1-t*t*.95),t,Math.sin(t*Math.PI)*.07+t*t*.10)}geometry.computeVertexNormals();
 const material=new T.MeshStandardMaterial({color:'#ffffff',map:hairCardMap(),roughness:.98,side:T.DoubleSide,alphaTest:.16,depthWrite:true});
 const count=12000,hair=new T.InstancedMesh(geometry,material,count),point=new T.Vector3(),normal=new T.Vector3(),tangent=new T.Vector3(),across=new T.Vector3(),matrix=new T.Matrix4();let seed=241,added=0;
 const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<count*9&&added<count;i++){
  sampleSurface(body,rand,point,normal);
  let weight=smooth(1.0,3.4,point.z)*smooth(4.0,6.0,point.y);if(point.z>4.7&&Math.abs(point.x)<.7)weight*=.28;if(weight<.025)continue;
  const length=.025+weight*(.23+rand()*.65),width=.023+weight*(.04+rand()*.05);
  tangent.set(point.x*.07,-.84,-.40).addScaledVector(normal,.20);tangent.addScaledVector(normal,-tangent.dot(normal));if(tangent.lengthSq()<.015)tangent.set(.15,-.8,-.3);tangent.normalize();across.crossVectors(tangent,normal).normalize();matrix.makeBasis(across,tangent,normal);matrix.scale(new T.Vector3(width,length,1));matrix.setPosition(point.clone().addScaledVector(normal,.002));hair.setMatrixAt(added,matrix);
  const light=.38-weight*.19+(rand()-.5)*.075,color=new T.Color().setHSL(.092,.22,light);hair.setColorAt(added++,color);
 }hair.count=added;hair.castShadow=false;hair.receiveShadow=true;group.add(hair);return group;
}
export function surfaceCoat(body:T.BufferGeometry){
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([-.0015,0,0,.0015,0,0,-.001,-.025,.001,.001,-.025,.001,0,-.06,.004],3));geometry.setIndex([0,2,1,1,2,3,2,4,3]);geometry.computeVertexNormals();
 const material=new T.MeshStandardMaterial({color:'#998468',roughness:1,side:T.DoubleSide});
 const count=30000,coat=new T.InstancedMesh(geometry,material,count),matrix=new T.Matrix4(),normal=new T.Vector3(),point=new T.Vector3(),down=new T.Vector3(),across=new T.Vector3();let added=0,seed=3819;
 const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<count*3&&added<count;i++){
  sampleSurface(body,rand,point,normal);if(point.y<.4)continue;
  down.set(0,-.4,-.7).addScaledVector(normal,.4*normal.y+.7*normal.z);if(down.length()<.1)down.set(0,-1,0).addScaledVector(normal,normal.y);down.normalize();across.crossVectors(down,normal).normalize();
  matrix.makeBasis(across,down.clone().negate(),normal);matrix.scale(new T.Vector3(.8+rand()*.5,.6+rand()*.6,1));matrix.setPosition(point.clone().addScaledVector(normal,.002));coat.setMatrixAt(added++,matrix);
 }coat.count=added;coat.receiveShadow=true;return coat;
}

export function makeTailTuft(){
 const group=new T.Group(),core=new T.Mesh(new T.SphereGeometry(.105,24,16),furMaterial(true));core.scale.set(1,1.3,1);group.add(core);
 const card=new T.PlaneGeometry(1,1,1,6),p=card.attributes.position;for(let i=0;i<p.count;i++){const t=p.getY(i)+.5;p.setXYZ(i,p.getX(i)*(1-t*.98),t,Math.sin(t*Math.PI)*.12)}card.computeVertexNormals();
 const hair=new T.InstancedMesh(card,new T.MeshStandardMaterial({map:hairCardMap(),color:'#514133',side:T.DoubleSide,roughness:1,alphaTest:.16}),1400),matrix=new T.Matrix4(),normal=new T.Vector3(),down=new T.Vector3(),across=new T.Vector3();
 for(let i=0;i<1400;i++){const y=1-2*(i+.5)/1400,a=i*2.3999632297,r=Math.sqrt(1-y*y);normal.set(Math.cos(a)*r,y,Math.sin(a)*r);down.set(normal.x*.3,-1,normal.z*.3).normalize();across.crossVectors(down,normal).normalize();matrix.makeBasis(across,down,normal);matrix.scale(new T.Vector3(.017,.12+(i%13)*.006,1));matrix.setPosition(normal.clone().multiplyScalar(.105));hair.setMatrixAt(i,matrix)}hair.receiveShadow=true;group.add(hair);return group;
}
