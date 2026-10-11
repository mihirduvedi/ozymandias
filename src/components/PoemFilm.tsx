import {useCallback,useEffect,useRef,useState} from 'react';
import type {Poem} from '../content/poems';
import {activeLine,captionVisible,clampTime,clock,FILM_DURATION,LINE_TIMES,shotAt} from '../content/film';
import {FilmStage} from './FilmStage';
import './film.css';
export function PoemFilm({poem,motion,initialLine,navigationKey,plain}:{plain:boolean;poem:Poem;motion:boolean;initialLine:number|null;navigationKey:number}){
 const [time,setTime]=useState(()=>initialLine===null?0:LINE_TIMES[initialLine]);
 const [playing,setPlaying]=useState(false);const [ready,setReady]=useState(false);
 const [showText,setShowText]=useState(false);const viewport=useRef<HTMLElement>(null);
 const currentTime=useRef(time);const mountedNavigation=useRef(navigationKey);
 const onReady=useCallback(()=>setReady(true),[]);
 const seek=useCallback((t:number)=>{setPlaying(false);setTime(clampTime(t))},[]);
 useEffect(()=>{currentTime.current=time},[time]);
 useEffect(()=>{
  if(mountedNavigation.current===navigationKey)return;
  mountedNavigation.current=navigationKey;
  if(initialLine!==null){seek(LINE_TIMES[initialLine]);viewport.current?.scrollIntoView({block:'start',behavior:'instant'})}
 },[initialLine,navigationKey,seek]);
 useEffect(()=>{
  if(!playing||!motion||!ready||plain)return;let frame=0,last=performance.now();let next=currentTime.current;
  function tick(now:number){next=clampTime(next+Math.min(.1,(now-last)/1000));last=now;setTime(next);if(next<FILM_DURATION)frame=requestAnimationFrame(tick);else setPlaying(false)}
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[playing,motion,ready,plain]);
 useEffect(()=>{
  const hide=()=>{if(document.hidden)setPlaying(false)};
  const pause=()=>setPlaying(false);document.addEventListener('visibilitychange',hide);window.addEventListener('two-deserts:pause',pause);return()=>{document.removeEventListener('visibilitychange',hide);window.removeEventListener('two-deserts:pause',pause)};
 },[]);
 useEffect(()=>{if(!motion||plain)setPlaying(false)},[motion,plain]);
 const toggle=useCallback(()=>{if(!motion||!ready||plain)return;if(currentTime.current>=FILM_DURATION)setTime(0);setPlaying(v=>!v)},[motion,ready,plain]);
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{const target=e.target as HTMLElement;if(target.closest('input,select,button,a,summary,dialog')||document.querySelector('dialog[open]'))return;if(e.code==='Space'){e.preventDefault();toggle()}else if(e.key==='ArrowRight'){e.preventDefault();seek(currentTime.current+5)}else if(e.key==='ArrowLeft'){e.preventDefault();seek(currentTime.current-5)}};
  addEventListener('keydown',key);return()=>removeEventListener('keydown',key);
 },[toggle,seek]);
 const shot=shotAt(time),line=activeLine(time),visible=captionVisible(time)&&time>=LINE_TIMES[shot.lines[0]],atStart=time<8;
 function go(i:number){seek(LINE_TIMES[i]);history.replaceState(null,'',`#/ozymandias/${poem.lines[i].id}`)}
 const stopped=!motion||!playing;
 if(plain)return <main id="main" className="plain-reader film-plain" tabIndex={-1}><a className="text-link" href={`#/ozymandias/${poem.lines[line].id}`}>← Return to the film</a><div className="plain-heading"><span>1818</span><h1>Ozymandias</h1><p>Percy Bysshe Shelley</p></div><div className="plain-poem"><p>{poem.lines.map(l=><span className="plain-line" key={l.id}>{l.text}</span>)}</p></div><div className="source-note"><p>{poem.rights}</p><a href={poem.source} target="_blank" rel="noreferrer">{poem.sourceName} ↗</a></div></main>;
 return <main id="main" className="poem-film" tabIndex={-1}>
  <section className={`film-view ${playing&&motion?'film-running':''}`} ref={viewport} aria-label="Ozymandias, an interactive silent film" data-time={time.toFixed(2)} data-playing={playing&&motion}>
   <div className="film-masthead"><div><h1>Ozymandias</h1><p>Percy Bysshe Shelley <span>1818</span></p></div><p className="film-format">A silent reading <span>2 minutes 24 seconds</span></p></div>
   <div className="film-screen">
    <FilmStage time={time} motion={motion} onReady={onReady}/>
    <div className={`film-opening ${atStart?'':'gone'}`} aria-hidden="true"><span>Ozymandias</span><small>Percy Bysshe Shelley</small></div>
    <div className={`film-captions ${visible?'':'caption-hidden'}`} aria-hidden="true" data-shot={shot.name}>
     {shot.lines.map(i=><p key={i} className={i===line?'spoken':''} style={{visibility:time<LINE_TIMES[i]?'hidden':'visible'}}>{poem.lines[i].text}</p>)}
    </div>
    {!motion&&<span className="still-notice">Still reading · choose a line below</span>}
   </div>
   <div className="film-controls">
    <button className="film-play" onClick={toggle} disabled={!motion||!ready} aria-label={time>=FILM_DURATION?'Replay film':stopped?'Play film':'Pause film'}><span aria-hidden="true">{stopped?'▶':'Ⅱ'}</span>{!ready?'Loading scene':!motion?'Still frames':time>=FILM_DURATION?'Replay':stopped?'Play':'Pause'}</button>
    <label className="film-seek"><span className="sr-only">Film position</span><input type="range" min="0" max={FILM_DURATION} step="0.1" value={time} onChange={e=>seek(Number(e.target.value))} aria-valuetext={`${clock(time)} of ${clock(FILM_DURATION)}, ${shot.name}`} style={{'--progress':`${time/FILM_DURATION*100}%`} as React.CSSProperties}/><span className="shot-ticks" aria-hidden="true">{[18,34,51,74,104].map(t=><i key={t} style={{left:`${t/FILM_DURATION*100}%`}}/>)}</span></label>
    <span className="film-clock">{clock(time)} <i>/</i> {clock(FILM_DURATION)}</span>
    <button className="film-text-toggle" onClick={()=>{setPlaying(false);setShowText(v=>!v)}} aria-expanded={showText} aria-controls="film-source">{showText?'Close poem':'The poem'}</button>
   </div>
   <div className="film-under"><span>{time>=130?'The lone and level sands':shot.name}</span><div><button disabled={line===0} onClick={()=>go(line-1)} aria-label="Previous line">←</button><label><span className="sr-only">Choose a line</span><select value={line} onChange={e=>go(Number(e.target.value))}>{poem.lines.map((l,i)=><option key={l.id} value={i}>{l.id} — {l.text}</option>)}</select></label><button disabled={line===13} onClick={()=>go(line+1)} aria-label="Next line">→</button></div><a href="#/ozymandias/plain">Plain reading ↗</a></div>
   <div className="film-source" id="film-source" hidden={!showText}><h2>The complete poem</h2><div className="film-source-lines">{poem.lines.map((l,i)=><button key={l.id} className={line===i?'current':''} onClick={()=>go(i)} aria-label={`Seek to ${l.id}: ${l.text}`}>{l.text}</button>)}</div><p>One stanza. Fourteen lines. Wording, punctuation and alignment follow the <a href={poem.source} target="_blank" rel="noreferrer">Academy of American Poets edition ↗</a>.</p></div>
  </section>
  <div className="sr-only" hidden={showText}><h2>Ozymandias, complete text</h2><p>{poem.lines.map(l=><span key={l.id}>{l.text}<br/></span>)}</p></div>
  <footer className="film-end"><p>“Nothing beside remains.”</p><div><span>A silent, interactive interpretation.<br/>The words remain Shelley’s.</span><a href="#/ozymandias/plain">Read the complete poem ↗</a><a href="#/">Return to Two Deserts ↗</a></div></footer>
 </main>;
}
