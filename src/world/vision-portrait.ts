import * as T from 'three';

// The apparition has human skin, not the mineral roughness of Shelley's ruin.
// Pore relief is subtle; the modeled eye sockets, nose and lip remain dominant.
export function portraitSkin(map?:T.Texture){
 const m=new T.MeshPhysicalMaterial({color:map?'#e9d9c6':'#a68869',map,roughness:.76,metalness:0,ior:1.42,specularIntensity:.28});
 m.onBeforeCompile=s=>{
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vSkinPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nvSkinPosition=position;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 vSkinPosition;
   float poreHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
   float skinNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(poreHash(i),poreHash(i+vec3(1,0,0)),f.x),mix(poreHash(i+vec3(0,1,0)),poreHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(poreHash(i+vec3(0,0,1)),poreHash(i+vec3(1,0,1)),f.x),mix(poreHash(i+vec3(0,1,1)),poreHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
  `).replace('#include <map_fragment>',`#include <map_fragment>
   float pores=skinNoise(vSkinPosition*105.0),mottling=skinNoise(vSkinPosition*4.5);
   diffuseColor.rgb*=.94+mottling*.10;
   float cheek=exp(-pow((abs(vSkinPosition.x)-1.1)/.37,2.0)-pow((vSkinPosition.y-2.8)/.4,2.0))*smoothstep(.5,1.4,vSkinPosition.z);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.46,.27,.20),cheek*.06);
   float lip=exp(-pow(vSkinPosition.x/.64,4.0)-pow((vSkinPosition.y-2.2)/.15,2.0))*smoothstep(1.7,2.1,vSkinPosition.z);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.39,.24,.18),lip*.25);
  `).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec3 pdx=dFdx(vViewPosition),pdy=dFdy(vViewPosition),rx=cross(pdy,normal),ry=cross(normal,pdx);float determinant=dot(pdx,rx);
   normal=normalize(abs(determinant)*normal-.0012*sign(determinant)*(dFdx(pores)*rx+dFdy(pores)*ry));
  `);
 };m.customProgramCacheKey=()=> 'apparition-skin-pores';return m;
}

// The iris belongs to the curved eyeball surface, so it remains seated in its
// socket at oblique angles rather than becoming a separate floating disc.
export function portraitEye(){
 const m=new T.MeshPhysicalMaterial({color:'#aaa08d',roughness:.38,specularIntensity:.2,ior:1.34});
 m.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vEyeSurface;').replace('#include <begin_vertex>','#include <begin_vertex>\nvEyeSurface=position;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vEyeSurface;').replace('#include <map_fragment>',`#include <map_fragment>
  float r=length(vEyeSurface.xy),front=smoothstep(.72,.9,vEyeSurface.z),iris=(1.0-smoothstep(.38,.43,r))*front,pupil=(1.0-smoothstep(.15,.18,r))*front;
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.065,.048,.027)*(1.0+.12*sin(atan(vEyeSurface.y,vEyeSurface.x)*38.0)),iris);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.008,.009,.007),pupil);
 `)};m.customProgramCacheKey=()=> 'anatomical-curved-eye';return m;
}
