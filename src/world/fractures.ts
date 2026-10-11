import * as T from 'three';
type Plane='xy'|'zy'|'xz';
export type StoneCrack={plane:Plane;points:[number,number][];width:number;face?:number};
const number=(n:number)=>n.toFixed(5);
export const legCracks=(seed:number):StoneCrack[]=>[[1.7,4,.19],[5.4,6.9,-.25]].map(([low,high,offset])=>({plane:'xy',face:1,width:.011,points:Array.from({length:17},(_,i)=>{const y=low+(high-low)*i/16;return [offset+.16*Math.sin(y*1.7+seed)+.05*Math.sin(y*7),y]})}));
export const pedestalCracks:StoneCrack[]=[
 {plane:'zy',face:1,width:.028,points:[[-2.65,.96],[-1.7,.65],[-1.42,.13],[-.88,-.18],[-1.01,-.63],[-.5,-1.05]]},
 {plane:'zy',face:1,width:.013,points:[[-1.42,.13],[-.91,.48],[-.35,.6]]},
 {plane:'xy',face:-1,width:.033,points:[[3.3,1.06],[2.77,.66],[2.96,.25],[2.43,-.19],[2.55,-.69],[2.12,-1.03]]},
];
export const capitalCracks:StoneCrack[]=[
 {plane:'xz',face:1,width:.022,points:[[-4.45,-2.6],[-3.65,-1.85],[-3.92,-.8],[-3.34,-.33],[-3.48,.63],[-3.07,1.8]]},
 {plane:'xz',face:1,width:.015,points:[[4.42,2.5],[3.78,2.24],[3.40,1.5],[2.67,1.26]]},
 {plane:'xy',face:1,width:.018,points:[[-3.9,.24],[-3.6,.08],[-3.76,-.23]]},
];
export const headCracks:StoneCrack[]=[
 {plane:'xy',face:1,width:.024,points:[[-2.1,3.3],[-1.88,2.66],[-2.22,2.23],[-2.08,1.44],[-2.5,.91],[-2.64,.25],[-3.05,-.12]]},
 {plane:'xy',face:1,width:.013,points:[[-2.5,.91],[-3.22,1.22],[-3.71,.97]]},
 {plane:'xy',face:1,width:.022,points:[[2.35,-3.3],[2.04,-2.86],[2.23,-2.3],[1.82,-2.06]]},
 {plane:'xz',face:1,width:.026,points:[[-3.9,-3.5],[-2.8,-2.63],[-2.3,-1.46],[-1.32,-.93],[-.6,.16],[.32,.42]]},
 {plane:'xz',face:-1,width:.024,points:[[3.73,-3.5],[2.48,-2.53],[1.48,-1.96],[1.67,-.97],[.82,-.21]]},
];
export const handCracks:StoneCrack[]=[
 {plane:'xz',face:1,width:.010,points:[[-.93,-.3],[-.52,-.21],[-.36,.18],[.03,.4],[.12,.91]]},
 {plane:'xz',face:1,width:.007,points:[[-.36,.18],[.31,.06],[.58,.26]]},
 {plane:'zy',face:1,width:.011,points:[[-1.5,.05],[-.96,.18],[-.58,.02],[-.17,.18]]},
];
export function fragmentCracks(seed:number):StoneCrack[]{
 const shift=.18*Math.sin(seed),flip=seed%2?1:-1;
 return [{plane:'xy',face:1,width:.012,points:[[-.76,.86],[-.35,.57],[-.46,.15],[shift,-.14],[.09,-.52],[.43,-.82]]},
  {plane:'xz',face:1,width:.010,points:[[-.88,flip*.53],[-.35,flip*.41],[shift,flip*.1],[.52,-flip*.08],[.81,-flip*.42]]}];
}
// Object-local crack fields are part of the stone shader, so they cannot float or z-fight.
export function fractureMaterial(base:T.MeshStandardMaterial,cracks:StoneCrack[],colorScale=1,portrait=false){
 const material=base.clone();material.color.multiplyScalar(colorScale);
 const fields=cracks.map(crack=>{
  const axis=crack.plane==='xy'?'z':crack.plane==='zy'?'x':'y',facing=crack.face??1;
  const segments=crack.points.slice(1).map((b,i)=>{const a=crack.points[i];return `ruinSegment(p.${crack.plane},vec2(${number(a[0])},${number(a[1])}),vec2(${number(b[0])},${number(b[1])}),${number(crack.width)})`});
  return `min(1.0,${segments.join('+')})*smoothstep(.15,.65,n.${axis}*${number(facing)})`;
 });
 const key=JSON.stringify({cracks,portrait});
 material.onBeforeCompile=(shader,renderer)=>{
  base.onBeforeCompile(shader,renderer);
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vRuinLocal;varying vec3 vRuinNormal;').replace('#include <begin_vertex>','#include <begin_vertex>\nvRuinLocal=position;vRuinNormal=normal;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 vRuinLocal;varying vec3 vRuinNormal;
   float ruinSegment(vec2 p,vec2 a,vec2 b,float width){
    vec2 d=b-a;float t=clamp(dot(p-a,d)/dot(d,d),0.0,1.0);
    float distanceToCrack=length(p-a-d*t);float aa=max(fwidth(distanceToCrack)*.7,.0005);
    return 1.0-smoothstep(width*.32,width+aa,distanceToCrack);
   }
   float ruinFissure(vec3 p,vec3 n){return min(1.0,${fields.length?fields.join('+'):'0.0'});}
  `).replace('#include <color_fragment>',`#include <color_fragment>
   float ruinDamage=ruinFissure(vRuinLocal,normalize(vRuinNormal));
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.21,.19,.18),ruinDamage*.86);
  `);
  if(portrait)shader.fragmentShader=shader.fragmentShader.replace('diffuseColor*=grain;','grain.rgb=mix(vec3(.70,.68,.64),grain.rgb,.92);diffuseColor*=grain;');
 };
 material.customProgramCacheKey=()=>`fractured-stone:${key}`;
 return material;
}
