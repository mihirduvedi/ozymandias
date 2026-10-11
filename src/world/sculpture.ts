import * as T from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { FontLoader, type Font } from 'three/addons/loaders/FontLoader.js';
import { mergeVertices, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { RUIN_SCALE } from './geography';
import { fracturedBlock, brokenLimb, brokenDrapery } from './fragments';
import { enclosedVolume, settleStone, sandImprint, type SandImprint } from './sediment';
import { fractureMaterial, pedestalCracks, capitalCracks, legCracks, headCracks, handCracks, fragmentCracks } from './fractures';
export function rng(seed:number){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
export function chippedBox(w:number,h:number,d:number,seed:number){
 // Uniform face topology: a rounded box places almost all vertices at its corners.
 const raw=new T.BoxGeometry(w,h,d,Math.ceil(w/.18),Math.ceil(h/.16),Math.ceil(d/.18));raw.deleteAttribute('normal');raw.deleteAttribute('uv');const g=mergeVertices(raw,.00001);raw.dispose();g.computeVertexNormals();const p=g.attributes.position,n=g.attributes.normal,random=rng(seed);
 const scars=Array.from({length:30},()=>{const i=Math.floor(random()*p.count);return {x:p.getX(i),y:p.getY(i),z:p.getZ(i),radius:.10+random()*.38,depth:.025+random()*.16}});
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  // Every joint remains a level closed bearing surface. Erosion belongs on exposed stone.
  const bearing=Math.abs(y)>h*.5-.0001;
  const corner=Math.pow(Math.abs(x)/(w*.5)*Math.abs(z)/(d*.5),4);
  let loss=.016*Math.sin(x*13+y*9+z*11+seed)-corner*(.08+.08*Math.sin(y*7+seed)**2);
  for(const s of scars)loss-=s.depth*Math.exp(-((x-s.x)**2+(y-s.y)**2+(z-s.z)**2)/(s.radius*s.radius)*2.5);
  const front=Math.max(0,n.getZ(i));
  loss-=front*.055*Math.exp(-(((x-(w*.32+.16*Math.sin(y*9)))/.055)**2));
  p.setXYZ(i,x+n.getX(i)*loss,bearing?y:y+n.getY(i)*loss,z+n.getZ(i)*loss);
 }
 const uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){uv[i*2]=p.getX(i)*.22;uv[i*2+1]=(p.getY(i)+p.getZ(i))*.22}g.setAttribute('uv',new T.BufferAttribute(uv,2));g.computeVertexNormals();const result=toCreasedNormals(g,.7);g.dispose();return result;
}
export const FOOT_BEARING_HEIGHT=3.06;
export function makePedestal(material:T.MeshStandardMaterial){
 const group=new T.Group();group.name='Weight-bearing pedestal';
 for(const [name,w,h,d,y,seed] of [['Buried foundation',10,.84,7,.08,31],['Pedestal body',8.6,2.18,5.6,1.52,32],['Capital platform',9,.50,6.4,2.83,33]] as const){
  const mesh=new T.Mesh(chippedBox(w,h,d,seed),fractureMaterial(material,seed===33?capitalCracks:pedestalCracks));mesh.name=name;mesh.position.y=y;mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.poemLine=8;group.add(mesh);
 }return group;
}
function copyStone(material:T.MeshStandardMaterial,colorScale=1,portrait=false){
 const copy=material.clone();copy.onBeforeCompile=(shader,renderer)=>{material.onBeforeCompile(shader,renderer);if(portrait)shader.fragmentShader=shader.fragmentShader.replace('diffuseColor*=grain;','grain.rgb=mix(vec3(.70,.68,.64),grain.rgb,.92);diffuseColor*=grain;')};copy.customProgramCacheKey=()=>portrait?'portrait-stone':'carved-stone';copy.color.multiplyScalar(colorScale);return copy
}
function moveOutlines(shapes:T.Shape[],scale:number,x:number,y:number){
 const moved=new Set<T.Vector2>();
 for(const shape of shapes)for(const curve of [...shape.curves,...shape.holes.flatMap(h=>h.curves)]){
  const c=curve as unknown as Record<string,unknown>;
  for(const key of ['v1','v2','v0','v3']){const v=c[key];if(v instanceof T.Vector2&&!moved.has(v)){v.x=v.x*scale+x;v.y=v.y*scale+y;moved.add(v)}}
 }
}
function inscriptionOutlines(font:Font,word:string){
 const shapes:T.Shape[]=[];let cursor=0;
 for(const character of word){const letter=font.generateShapes(character,.36);moveOutlines(letter,1,cursor,0);shapes.push(...letter);cursor+=(font.data.glyphs[character]?.ha??font.data.glyphs[' '].ha)*.36/font.data.resolution+.020}
 return shapes;
}
// Cut letter voids through the front stone, retain their counters, and place stone floors below.
export function engravedStone(font:Font,words:string[],material:T.MeshStandardMaterial){
 const group=new T.Group();group.name='Recessed inscription';
 const slab=new T.Shape();slab.moveTo(-4.12,-1.02);slab.lineTo(4.08,-1.02);slab.lineTo(4.22,-.91);slab.lineTo(4.22,.84);slab.lineTo(4.09,1.02);slab.lineTo(-4.03,1.02);slab.lineTo(-4.22,.88);slab.lineTo(-4.22,-.82);slab.closePath();
 const islands:T.Shape[]=[],letterRows:T.Shape[][]=[];
 words.forEach((word,row)=>{
  // Cinzel's T/Y overhangs overlap at normal text spacing. Separate them before cutting stone.
  const shapes=inscriptionOutlines(font,word);const measurement=new T.ShapeGeometry(shapes);measurement.computeBoundingBox();const width=measurement.boundingBox!.max.x-measurement.boundingBox!.min.x;measurement.dispose();
  const fit=Math.min(1,7.92/width),shift=-width*fit/2,baseline=row===0?.30:-.28;
  moveOutlines(shapes,fit,shift,baseline);
  for(const shape of shapes){
   slab.holes.push(shape);for(const hole of shape.holes){const island=new T.Shape();island.curves=hole.curves;islands.push(island)}
  }letterRows.push(shapes);
 });
 // Actual shallow weathering cuts in the clear stone margins, away from the verse.
 const weatherCuts:T.Shape[]=[],random=rng(317);
 for(let i=0;i<22;i++){const pit=new T.Shape(),x=-3.85+random()*7.7,y=(i%2?-.83:.87)+(random()-.5)*.08,r=.012+random()*.027;pit.absellipse(x,y,r,r*.65,0,Math.PI*2,false,random());slab.holes.push(pit);weatherCuts.push(pit)}
 for(const points of [[[-3.7,-1.00],[-3.62,-.91],[-3.67,-.75],[-3.63,-.65],[-3.69,-.75],[-3.65,-.91]],[[2.7,1.00],[2.64,.89],[2.75,.78],[2.73,.73],[2.70,.80],[2.61,.89]]]){const cut=new T.Shape();points.forEach(([x,y],i)=>i?cut.lineTo(x,y):cut.moveTo(x,y));cut.closePath();slab.holes.push(cut);weatherCuts.push(cut)}
 for(const points of [[[-4.14,-.98],[-3.75,-.75],[-3.86,-.54],[-3.47,-.44],[-3.50,-.49],[-3.91,-.52],[-3.80,-.76],[-4.18,-.99]],[[.62,-1.02],[.90,-.82],[.81,-.61],[1.14,-.41],[1.10,-.46],[.86,-.62],[.96,-.83],[.70,-1.02]]]){const cut=new T.Shape();points.forEach(([x,y],i)=>i?cut.lineTo(x,y):cut.moveTo(x,y));cut.closePath();slab.holes.push(cut);weatherCuts.push(cut)}
 // Bevels on the very narrow Cinzel hairlines can close the cuts entirely.
 const options={depth:.26,bevelEnabled:false,curveSegments:6,steps:1};
 const front=new T.Mesh(new T.ExtrudeGeometry([slab,...islands],options),copyStone(material,1.03));front.position.set(0,1.5,2.79);front.castShadow=true;front.receiveShadow=true;front.userData.poemLine=8;group.add(front);
 letterRows.forEach((shapes,row)=>{
  // A shallow incision keeps the letter floor visible from oblique, distant viewpoints.
  const floor=new T.Mesh(new T.ShapeGeometry(shapes,6),copyStone(material,.38));floor.position.set(0,1.5,3.015);floor.receiveShadow=true;floor.userData.poemLine=row===0?9:10;group.add(floor);

 });const wearFloor=new T.Mesh(new T.ShapeGeometry(weatherCuts,6),copyStone(material,.25));wearFloor.position.set(0,1.5,3.01);wearFloor.receiveShadow=true;group.add(wearFloor);return group;
}
export async function makeSculpture(material:T.MeshStandardMaterial,words:string[],onAssetError:()=>void,imprints:SandImprint[]=[]){
 const group=new T.Group();group.name='The ruined monument';group.scale.setScalar(RUIN_SCALE);
 const add=(g:T.BufferGeometry,x:number,y:number,z:number,line:number)=>{g.computeBoundingBox();const m=new T.Mesh(g,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;m.userData.poemLine=line;group.add(m);return m};
 group.add(makePedestal(material));
 imprints.push(sandImprint(0,0,5*RUIN_SCALE,3.5*RUIN_SCALE,10*7*.355*RUIN_SCALE**3,true));
 const anatomyLoader=new STLLoader();
 const anatomy=await Promise.all(['right-leg','left-leg','hand'].map(async name=>{
  const raw=await anatomyLoader.loadAsync(`./world/anatomy/${name}.stl`);raw.deleteAttribute('normal');const welded=mergeVertices(raw,.000001);raw.dispose();welded.computeVertexNormals();
  const geometry=toCreasedNormals(welded,.85);welded.dispose();const p=geometry.attributes.position,uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){uv[i*2]=p.getX(i)*.22;uv[i*2+1]=(p.getY(i)+p.getZ(i))*.22}geometry.setAttribute('uv',new T.BufferAttribute(uv,2));return geometry;
 }));
 // Authored anatomical topology: each foot, five toes, ankle, calf and knee is one closed stone.
 for(const [index,x,z] of [[0,-1.9,.05],[1,1.8,-.35]]){const leg=add(anatomy[index],x,FOOT_BEARING_HEIGHT,z,1);leg.material=fractureMaterial(material,legCracks(index===0?22:21));leg.name=index===0?'Broken right leg and foot':'Broken left leg and foot'}
 const font=await new FontLoader().loadAsync('./world/fonts/cinzel-inscription.json');group.add(engravedStone(font,words,material));
 const handGeometry=anatomy[2],hand=add(handGeometry,7.8,0,7.4,7);hand.material=fractureMaterial(material,handCracks);hand.name='Broken hand of the colossus';hand.rotation.y=-.42;settleStone(hand,handGeometry,enclosedVolume(handGeometry),imprints);
 const random=rng(102),fragments=[fracturedBlock(201),fracturedBlock(202),fracturedBlock(203),brokenLimb(204),brokenLimb(205),brokenDrapery(206)];
 const volumes=fragments.map(enclosedVolume);
 const fragmentMaterials=fragments.map((_,i)=>fractureMaterial(material,fragmentCracks(201+i)));
 for(let i=0;i<68;i++){
  const angle=random()*Math.PI*2,r=6+random()*13,x=Math.cos(angle)*r,z=Math.sin(angle)*r;if((x< -4&&x> -11&&z>2&&z<9)||(x>5&&x<11&&z>5&&z<12))continue;
  const type=i<16?i%fragments.length:Math.floor(random()*3),geometry=fragments[type];
  const scale=i<16?.65+random()*.90:.12+random()*.30,rock=add(geometry,x,0,z,11);
  rock.material=fragmentMaterials[type];
  rock.scale.set(scale*(1+random()*.65),scale*(type===3||type===4?.78:.62),scale*(1+random()*.55));
  rock.rotation.set((random()-.5)*.8,random()*Math.PI*2,(random()-.5)*.7);
  // Centuries of alternating accumulation and scour leave different exposed heights.
  rock.userData.driftBurial=i%7===0?.53:i%5===0?.38:i%3===0?.24:.10;
  const bearing=type===5?.84:type===3||type===4?.34:.58+random()*.14;
  settleStone(rock,geometry,volumes[type]*rock.scale.x*rock.scale.y*rock.scale.z,imprints,bearing,.58);
 }

 try{
  const raw=await new STLLoader().loadAsync('./world/ramesses/head.stl');raw.deleteAttribute('normal');const geometry=mergeVertices(raw,.0000001);raw.dispose();geometry.computeVertexNormals();
  const points=geometry.attributes.position,uvs=new Float32Array(points.count*2);
  const gauss=(x:number,y:number,cx:number,cy:number,wx:number,wy:number)=>Math.exp(-(((x-cx)/wx)**2+((y-cy)/wy)**2));
  for(let i=0;i<points.count;i++){
   const x=points.getX(i),y=points.getY(i),z=points.getZ(i),front=T.MathUtils.smoothstep(z,.8,1.8);
   // Shelley's frown, wrinkled lip and sneer of cold command survive the damaged portrait.
   const mouth=gauss(x,y,-.31,-1.04,.43,.40)+gauss(x,y,1.22,-.97,.43,.40);
   const brow=gauss(x,y,.04,1.72,.40,.37)+gauss(x,y,.94,1.70,.40,.37),outerBrow=gauss(x,y,-.82,1.65,.4,.3)+gauss(x,y,1.64,1.65,.4,.3);
   const furrow=gauss(x,y,.46,1.74,.13,.52);
   const lowerLip=gauss(x,y,.45,-1.50,.67,.20),centralLip=gauss(x,y,.45,-1.14,.38,.25);
   const sneer=gauss(x,y,1.15,-.98,.26,.24),lipRidge=gauss(x,y,.43,-1.12,.67,.12),crease=gauss(x,y,-.24,-.72,.06,.35)+gauss(x,y,1.11,-.60,.06,.35);
   const wrinkles=[.03,.30,.64,.91].reduce((sum,cx)=>sum+gauss(x,y,cx,-1.55,.035,.16),0);
   points.setY(i,y-front*(mouth*.76+brow*.48-outerBrow*.10-sneer*.08-centralLip*.12));points.setZ(i,z+front*(brow*.24-furrow*.25-lowerLip*.18+lipRidge*.10-crease*.13-wrinkles*.07));uvs[i*2]=x*.15;uvs[i*2+1]=y*.15;
  }
  geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.setAttribute('uv',new T.BufferAttribute(uvs,2));
  const face=new T.Mesh(geometry,fractureMaterial(material,headCracks,1.08,true));face.castShadow=true;face.receiveShadow=true;face.userData.poemLine=3;
  const head=new T.Group();head.name='Fallen face of Ramesses II';head.add(face);head.scale.setScalar(.44);head.rotation.set(-.22,.2,1.04);head.position.set(-7,1.05,5.5);group.add(head);
  // The broken portrait bears on its narrow rear fracture, unlike the broad rubble bases.
  settleStone(head,geometry,enclosedVolume(geometry)*.44**3,imprints,.22,.36);
 }catch{onAssetError()}
 return group;
}
