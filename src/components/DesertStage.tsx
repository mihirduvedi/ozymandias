import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

const vertex = `attribute vec2 aPosition; varying vec2 vUv;
void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
const fragment = `precision highp float;
varying vec2 vUv;
uniform sampler2D uSand,uRuins,uStorm,uTide,uLandscape,uFace,uFalcon,uBeast;
uniform float uPosition,uTime,uAspect,uDark,uMotion;
uniform vec2 uPointer;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
float field(vec2 p){return noise(p)*.57+noise(p*2.03)*.28+noise(p*4.07)*.15;}
vec2 cover(vec2 p,float ratio){vec2 q=p-.5;if(uAspect>ratio)q.y*=ratio/uAspect;else q.x*=uAspect/ratio;return q+.5;}
float interval(float p,float a,float b,float c,float d){return smoothstep(a,b,p)*(1.-smoothstep(c,d,p));}
vec4 specimen(sampler2D image,vec2 centre,float width,float ratio,float angle){
 vec2 size=vec2(width,width*uAspect/ratio);vec2 q=(vUv-centre)/size;
 q=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*q;vec2 uv=q+.5;
 if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.)return vec4(0.);
 return texture2D(image,uv);
}
void main(){
 float p=uPosition,t=uTime*uMotion;vec2 uv=vUv+uPointer*.009*uMotion;
 float night=uDark,water=interval(p,2.8,4.2,5.8,7.8)*night;
 float vision=interval(p,9.,11.8,16.5,18.5)*night;
 float emptiness=smoothstep(10.8,13.,p)*(1.-night);
 float horizon=.43+sin(uv.x*3.2+p*.13)*.025;
 float ground=1.-smoothstep(horizon-.025,horizon+.025,uv.y);
 float depth=1./max(.035,horizon-uv.y+.065);
 vec2 plane=vec2((uv.x-.5)*depth*uAspect,depth);
 float dune=sin(plane.x*.6+sin(plane.y*.27+p*.12)*2.3+t*.09)+sin(plane.y*.41-plane.x*.13+t*.035)*.52;
 float slope=cos(plane.x*.6+sin(plane.y*.27+p*.12)*2.3+t*.09);
 float sandNoise=field(plane*.78+vec2(t*.08,p*.04));
 vec3 warm=mix(vec3(.17,.145,.12),vec3(.53,.43,.31),.5+slope*.22+dune*.1+(sandNoise-.5)*.16);
 vec3 cold=mix(vec3(.09,.12,.14),vec3(.31,.33,.31),.5+slope*.21+dune*.08);
 vec3 land=mix(warm,cold,night*(1.-vision*.5));
 vec2 skyPoint=uv*vec2(uAspect,1.);
 float clouds=field(skyPoint*3.8+vec2(t*.022,-t*.012)+vec2(p*.035,0.));
 vec3 sky=mix(vec3(.30,.255,.19),vec3(.075,.084,.092),night);
 sky=mix(sky,vec3(.59,.49,.34),vision*.68);
 sky+=vec3(.19,.17,.12)*clouds;
 sky*=.72+uv.y*.32;
 vec3 colour=mix(sky,land,ground);
 // Source images give the moving material fine detail, rather than being the whole scene.
 vec2 photo=cover(uv+vec2(sin(dune)*.012,(sandNoise-.5)*.007),1.5);
 vec3 detail=texture2D(uSand,photo).rgb;
 if(night>.5)detail=texture2D(uStorm,photo).rgb;
 colour=mix(colour,detail,.14*(1.-vision*.35));
 if(night<.5){
  colour=mix(colour,texture2D(uRuins,photo).rgb,interval(p,-3.,0.,1.4,3.4)*.33);
  vec2 centre=vec2(.73+sin(p*.57)*.12,.29+sin((p-3.)*.44)*.15);
  float width=mix(.46,.26,smoothstep(5.,10.5,p));
  if(uAspect<1.){centre=vec2(.60,.22+sin(p*.5)*.055);width=.76;}
  centre.x=min(centre.x,.98-width*.5);
  vec4 face=specimen(uFace,centre+uPointer*.017*uMotion,width,1.5,sin(p*.3)*.055);
  float arrival=smoothstep(1.8,3.2,p),erosion=smoothstep(8.8,11.9,p+(field(vUv*18.+vec2(t*.06,0.))-.5)*2.1);
  float shadow=exp(-pow((uv.x-centre.x)/.24,2.)-pow((uv.y-(centre.y-.14))/.07,2.))*.25;
  colour*=1.-shadow*arrival*(1.-erosion);
  colour=mix(colour,face.rgb,face.a*arrival*(1.-erosion)*.95);
  // Wind-carved ribbons of sand are driven by the same decay that takes the stone.
  float gust=field(vec2(uv.x*3.-t*.09,uv.y*8.+sin(uv.x*4.+p*.4)*1.3));
  float sweep=smoothstep(.60,.76,gust)*exp(-pow((uv.y-.22-sin(uv.x*4.+p*.25)*.07)/.13,2.));
  colour=mix(colour,vec3(.58,.47,.31),sweep*(.18+emptiness*.26));
  colour=mix(colour,vec3(.36,.32,.26),emptiness*.18);
 }else{
  // The widening gyre changes the cloud field itself.
  vec2 q=(uv-vec2(.55,.54))*vec2(uAspect,1.);float r=length(q),a=atan(q.y,q.x);
  float gyre=interval(p,-3.,0.,2.,4.5);
  float spiral=field(vec2(a*1.3-r*5.+p*.45+t*.09,r*7.-t*.035));
  float circling=pow(max(0.,sin(a*3.-r*19.+p*.5+t*.13)),8.)*exp(-r*1.6);
  colour+=vec3(.22,.24,.23)*(spiral*.4+circling*.16)*gyre;
  // A rift opens across the world as the centre gives way.
  float breakage=interval(p,1.5,2.4,3.8,5.2);
  float fault=abs(uv.x-.53-sin(uv.y*10.+p*.3)*.022);
  float opening=(1.-smoothstep(.001,.006+breakage*.025,fault))*breakage;
  colour=mix(colour,vec3(.025,.035,.039),opening*.85);
  float wave=sin(uv.x*16.+t*.35+p*.65)*.012+sin(uv.x*33.-t*.17)*.006;
  float wet=(1.-smoothstep(.30+water*.14+wave,.32+water*.14+wave,uv.y))*water;
  vec3 waterColour=mix(vec3(.075,.12,.16),vec3(.35,.20,.14),.5+.5*sin(uv.y*72.+wave*28.-t*.22));
  colour=mix(colour,waterColour,wet*.75);
  colour=mix(colour,texture2D(uLandscape,photo).rgb,vision*.28);
  // Revelation changes the temperature and source of the light.
  float light=exp(-length((uv-vec2(.28,.82))*vec2(uAspect,1.))*3.4)*vision;
  colour+=vec3(.29,.22,.12)*light;
  vec2 birdCentre=vec2(.60+sin(p*.85)*.23,.74+sin(p*.65)*.10);
  vec4 bird=specimen(uFalcon,birdCentre,.23,1.5,-.13+sin(p*.6)*.12);
  colour=mix(colour,bird.rgb,bird.a*interval(p,-3.,0.,1.7,3.6)*.9);
  vec2 centre=vec2(.82-smoothstep(18.,21.,p)*.18,.24+sin(p*.21)*.025);float width=.55;
  if(uAspect<1.){centre=vec2(.65,.20);width=.98;}
  vec4 beast=specimen(uBeast,centre+uPointer*.012*uMotion,width,1.5,sin(p*.32)*.035);
  colour=mix(colour,beast.rgb,beast.a*smoothstep(17.6,20.6,p)*.86);
  colour*=1.-interval(p,16.8,18.1,19.6,21.6)*.33;
 }
 // Depth and controlled light preserve the reading plane without visible panels.
 float reading=exp(-pow((uv.y-.5)/.17,2.));colour*=1.-reading*.55;
 colour*=1.-smoothstep(.72,1.,uv.y)*.33;
 colour*=1.-(1.-smoothstep(0.,.16,uv.y))*.28;
 float grain=(hash(gl_FragCoord.xy+floor(t*8.))-.5)*.012;
 gl_FragColor=vec4(colour+grain,1.);
}
`;

export function DesertStage({ dark, motion, position }: { dark:boolean; motion:boolean; position:RefObject<number> }) {
 const canvas=useRef<HTMLCanvasElement>(null);
 const [fallback,setFallback]=useState(false);
 useEffect(()=>{
  const node=canvas.current;if(!node)return;
  const gl=node.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});
  if(!gl){setFallback(true);return;}
  let stopped=false,frame=0;const images:HTMLImageElement[]=[];
  const textures:WebGLTexture[]=[];const shaders:WebGLShader[]=[];
  const pointer={x:0,y:0};let clock=0,last=0;
  function shader(type:number,source:string){const s=gl!.createShader(type)!;gl!.shaderSource(s,source);gl!.compileShader(s);if(!gl!.getShaderParameter(s,gl!.COMPILE_STATUS))throw new Error('Stage shader could not compile');shaders.push(s);return s;}
  let program:WebGLProgram|null=null;
  try{
   program=gl.createProgram()!;gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Stage shader could not link');
  }catch{setFallback(true);shaders.forEach(s=>gl.deleteShader(s));if(program)gl.deleteProgram(program);return;}
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const attribute=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
  const uniforms=Object.fromEntries(['uPosition','uTime','uAspect','uDark','uMotion','uPointer'].map(name=>[name,gl.getUniformLocation(program!,name)]));
  gl.uniform1f(uniforms.uDark,dark?1:0);gl.uniform1f(uniforms.uMotion,motion?1:0);
  const assets=[['Sand','sand'],['Ruins','ruins'],['Storm','storm'],['Tide','tide'],['Landscape','beast-land'],['Face','shattered-visage'],['Falcon','falcon'],['Beast','rough-beast']];
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  assets.forEach(([uniform,name],unit)=>{
   const texture=gl.createTexture()!;textures.push(texture);gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,texture);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([35,31,27,0]));
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.uniform1i(gl.getUniformLocation(program!,`u${uniform}`),unit);
   const img=new Image();images.push(img);img.onload=()=>{if(stopped)return;gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);schedule()};img.src=`./art/${name}.webp`;
  });
  function resize(){const ratio=Math.min(devicePixelRatio,1.35);node!.width=Math.round(innerWidth*ratio);node!.height=Math.round(innerHeight*ratio);gl!.viewport(0,0,node!.width,node!.height);gl!.uniform1f(uniforms.uAspect,innerWidth/innerHeight);schedule()}
  function draw(t:number){frame=0;if(stopped)return;if(!document.hidden){clock+=motion?Math.min(40,t-last||16)*.001:0;last=t;gl!.uniform1f(uniforms.uPosition,position.current);gl!.uniform1f(uniforms.uTime,clock);gl!.uniform2f(uniforms.uPointer,pointer.x,pointer.y);gl!.drawArrays(gl!.TRIANGLES,0,6)}if(motion)frame=requestAnimationFrame(draw)}
  function schedule(){if(!frame&&!stopped)frame=requestAnimationFrame(draw)}
  function move(e:PointerEvent){pointer.x=e.clientX/innerWidth-.5;pointer.y=.5-e.clientY/innerHeight;if(motion)schedule()}
  const lost=(e:Event)=>{e.preventDefault();stopped=true;setFallback(true);cancelAnimationFrame(frame)};
  node.addEventListener('webglcontextlost',lost);addEventListener('resize',resize);addEventListener('scroll',schedule,{passive:true});addEventListener('pointermove',move,{passive:true});resize();
  return()=>{stopped=true;cancelAnimationFrame(frame);images.forEach(img=>{img.onload=null});node.removeEventListener('webglcontextlost',lost);removeEventListener('resize',resize);removeEventListener('scroll',schedule);removeEventListener('pointermove',move);textures.forEach(t=>gl.deleteTexture(t));shaders.forEach(s=>gl.deleteShader(s));gl.deleteBuffer(buffer);gl.deleteProgram(program)};
 },[dark,motion,position]);
 return <div className={`desert-stage ${fallback?'stage-fallback':''}`} data-renderer={fallback?'fallback':'webgl'} aria-hidden="true"><img className="stage-backup" src={`./art/${dark?'storm':'sand'}.webp`} alt=""/><canvas ref={canvas}/></div>;
}
