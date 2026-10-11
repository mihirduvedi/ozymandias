import {useState,useEffect,useRef,useCallback} from 'react';
import type {CSSProperties} from 'react';
import type {Poem} from '../content/poems';
import {Arrow} from './Icons';
import {DesertStage} from './DesertStage';
import {Matter} from './Matter';
import {letterPose,materialFor} from '../content/motion';
import './world.css';
type Props={poem:Poem;motion:boolean;plain:boolean;initialLine:number|null;navigationKey:number};
export function Reader({poem,motion,plain,initialLine,navigationKey}:Props){
 const [active,setActive]=useState(initialLine??0),[started,setStarted]=useState(initialLine!==null);
 const root=useRef<HTMLElement>(null),lines=useRef<(HTMLDivElement|null)[]>([]),cover=useRef<HTMLElement>(null),select=useRef<HTMLSelectElement>(null);
 const activeRef=useRef(active),position=useRef(initialLine??0),lastPlain=useRef(plain),returnY=useRef(0),visited=useRef(!plain);
 const dark=poem.slug==='the-second-coming';
 const go=useCallback((index:number)=>{
  const n=Math.max(0,Math.min(poem.lines.length-1,index)),el=lines.current[n];
  if(el)window.scrollTo({top:scrollY+el.getBoundingClientRect().top+el.offsetHeight/2-innerHeight/2,behavior:'instant'});
  activeRef.current=n;position.current=n;setActive(n);setStarted(true);returnY.current=scrollY;visited.current=true;
  history.replaceState(null,'',`#/${poem.slug}/${poem.lines[n].id}`);
 },[poem]);
 useEffect(()=>{
  if(plain)window.scrollTo(0,0);
  else if(lastPlain.current){const saved=returnY.current;requestAnimationFrame(()=>visited.current?window.scrollTo(0,saved):go(activeRef.current))}
  else if(initialLine!==null)requestAnimationFrame(()=>go(initialLine));
  else window.scrollTo(0,0);
  lastPlain.current=plain;
 },[plain,initialLine,navigationKey,go]);
 useEffect(()=>{
  if(plain)return;let frame=0,disposed=false;
  function fit(){
   const ctx=document.createElement('canvas').getContext('2d');if(!ctx)return;ctx.font='400 100px "Barlow Condensed"';
   const width=Math.max(...poem.lines.map(l=>Array.from(l.text).reduce((sum,c)=>sum+ctx.measureText(c).width,0)));
   // Every verse uses the same fit; the longest source line sets the limit, including peak enlargement.
   const size=Math.min(60,(innerWidth-(innerWidth<600?28:110))*100/(width*1.16));
   root.current?.style.setProperty('--verse-size',`${size}px`);
  }
  function paint(){
   frame=0;returnY.current=scrollY;visited.current=true;const vh=innerHeight;
   setStarted(scrollY>(cover.current?.offsetHeight??vh)*.62);
   let nearest=0,distance=Infinity;
   lines.current.forEach((el,i)=>{
    if(!el)return;const r=el.getBoundingClientRect(),q=(r.top+r.height/2-vh/2)/vh,d=Math.abs(q);
    if(d<distance){distance=d;nearest=i}
    if(r.top>vh*1.2||r.bottom<-vh*.2)return;
    const focus=Math.exp(-q*q*14);el.style.setProperty('--lens',String(motion?.82+focus*.28:1));
    el.style.setProperty('--ink',String(Math.min(1,.50+focus*.50)));
    el.style.setProperty('--bend',`${motion?q*2:0}deg`);
    const text=el.querySelector<HTMLElement>('.poem-verse');
    const room=Math.max(0,(innerWidth-(text?.offsetWidth??innerWidth)*1.14)/2-22);
    el.style.setProperty('--travel',`${motion?Math.sin(q*6)*focus*Math.min(room,innerWidth*.1):0}px`);
    const glyphs=el.querySelectorAll<HTMLElement>('.verse-glyph');glyphs.forEach((glyph,j)=>{const pose=letterPose(q,j/Math.max(1,glyphs.length-1),materialFor(dark,i),motion);glyph.style.transform=`translate(${pose.x}em,${pose.y}em) scale(${pose.sx},${pose.sy}) rotate(${pose.rotation}deg)`});
    const verse=el.querySelector<HTMLElement>('.poem-verse');if(verse){const v=verse.getBoundingClientRect();verse.style.setProperty('--fade-top',`${Math.max(0,90-v.top)}px`);verse.style.setProperty('--fade-bottom',`${Math.max(0,v.bottom-(vh-92))}px`)}
   });
   const el=lines.current[nearest];if(el){const r=el.getBoundingClientRect();position.current=nearest+(vh/2-r.top-r.height/2)/Math.max(1,r.height)}
   if(activeRef.current!==nearest){activeRef.current=nearest;setActive(nearest);if(scrollY>(cover.current?.offsetHeight??vh))history.replaceState(null,'',`#/${poem.slug}/${poem.lines[nearest].id}`)}
  }
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(paint)};
  const resize=()=>{fit();if(scrollY>(cover.current?.offsetHeight??innerHeight))go(activeRef.current);schedule()};
  fit();document.fonts.ready.then(()=>{if(!disposed){fit();schedule()}});schedule();addEventListener('scroll',schedule,{passive:true});addEventListener('resize',resize);
  return()=>{disposed=true;cancelAnimationFrame(frame);removeEventListener('scroll',schedule);removeEventListener('resize',resize)};
 },[plain,motion,poem,go,dark]);
 const other=dark?'ozymandias':'the-second-coming';
 if(plain)return <main id="main" className="plain-reader" tabIndex={-1}>
  <a className="text-link" href={`#/${poem.slug}/${poem.lines[active].id}`}><Arrow back/> Return to the poem</a>
  <div className="plain-heading"><span>{poem.year}</span><h1>{poem.title}</h1><p>{poem.author}</p></div>
  <div className="plain-poem">{[0,1].filter(s=>poem.lines.some(l=>l.stanza===s)).map(s=><p key={s}>{poem.lines.filter(l=>l.stanza===s).map(l=><span className="plain-line" key={l.id}>{l.text}</span>)}</p>)}</div>
  <Source poem={poem}/><a className="text-link" href={`#/${other}/plain`}>Read the other poem <Arrow/></a>
 </main>;
 return <main ref={root} id="main" className={`cinema-reader ${dark?'cinema-night':'cinema-sand'} ${motion?'cinema-motion':'cinema-still'}`} tabIndex={-1}>
  <DesertStage dark={dark} motion={motion} position={position}/>
  <Matter dark={dark} motion={motion} position={position}/>
  <section className="poem-prologue" ref={cover}>
   <span className="prologue-author">{poem.author} <i>·</i> {poem.year}</span><h1>{poem.title}</h1>
   <div className="prologue-actions"><button onClick={()=>{go(0);requestAnimationFrame(()=>select.current?.focus({preventScroll:true}))}}>Read the poem <span>↓</span></button><a href={`#/${poem.slug}/plain`}>Plain reading ↗</a></div>
  </section>
  <div className="sr-only"><h2>{poem.title}, complete text</h2>{poem.lines.map(l=><p key={l.id}>{l.text}</p>)}</div>
  <div className="poem-rail" aria-hidden="true">
   {poem.lines.map((line,i)=><div className={`poem-line ${i>0&&line.stanza!==poem.lines[i-1].stanza?'stanza-start':''}`} key={line.id} ref={el=>{lines.current[i]=el}} style={{'--lens':1,'--ink':.7} as CSSProperties}><p id={line.id} className={`poem-verse material-${materialFor(dark,i)}`}>{Array.from(line.text).map((c,j)=><span className="verse-glyph" key={j}>{c}</span>)}</p></div>)}
  </div>
  <nav hidden={!started} className="reading-dock" aria-label="Reading controls"><button disabled={active===0} onClick={()=>go(active-1)} aria-label="Previous line"><Arrow back/></button><label><span className="sr-only">Choose a line</span><span aria-hidden="true" className="dock-count">{String(active+1).padStart(2,'0')} <span className="count-divider">/</span> {poem.lines.length}<i>⌄</i></span><select ref={select} value={active} onChange={e=>go(Number(e.target.value))}>{poem.lines.map((l,i)=><option key={l.id} value={i}>{String(i+1).padStart(2,'0')} / {poem.lines.length} — {l.text}</option>)}</select></label><button disabled={active===poem.lines.length-1} onClick={()=>go(active+1)} aria-label="Next line"><Arrow/></button></nav>
  <footer className="poem-end"><span className="end-title">{poem.title}</span><button onClick={()=>go(0)}>Read again ↑</button><Source poem={poem}/><a className="next-poem" href={`#/${other}`}><span>Read the other poem</span><strong>{dark?'Ozymandias':'The Second Coming'}</strong><Arrow/></a><a href="#/">Two Deserts ↗</a></footer>
 </main>;
}
export function Art({name,className,lazy=false}:{name:string;className:string;lazy?:boolean}){return <img className={className} src={`./art/${name}.webp`} alt="" draggable={false} loading={lazy?'lazy':'eager'} decoding="async" onError={e=>{e.currentTarget.style.visibility='hidden'}}/>}
function Source({poem}:{poem:Poem}){return <div className="source-note"><p>{poem.rights}</p><a href={poem.source} target="_blank" rel="noreferrer">{poem.sourceName} ↗</a></div>}
