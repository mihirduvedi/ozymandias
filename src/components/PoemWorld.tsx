import { useEffect, useReducer, useRef, useState } from 'react';
import type { Poem } from '../content/poems';
import { DesertWorld } from '../world/engine';
import type { WorldMode } from '../world/engine';
import { worldProfiles } from '../world/profiles';
import { tourReducer } from '../world/tour';
import { ReadingClock } from '../world/cinematography';
import './poem-world.css';
import './world-interface.css';
import './guided-reading.css';
import './vision-interface.css';
import './cohesive-interface.css';
function Compass(){return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="10"/><path d="M16 2v5m0 18v5M2 16h5m18 0h5M12 20l3-7 5-1-3 7z"/></svg>}
function ViewMark(){return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="5"/><ellipse cx="16" cy="16" rx="13" ry="9" transform="rotate(-35 16 16)"/></svg>}
export function PoemWorld({poem,motion,initialLine,plain,navigationKey}:{poem:Poem;motion:boolean;initialLine:number|null;plain:boolean;navigationKey:number}){
 const profile=worldProfiles[poem.slug];
 const {landmarks,landmarkForLine,landmarkLines,inspectionPoints}=profile;
 const host=useRef<HTMLDivElement>(null),world=useRef<DesertWorld|null>(null),reading=useRef<HTMLDialogElement>(null);
 const places=useRef<HTMLDivElement>(null),view=useRef<HTMLDivElement>(null);
 const controlsButton=useRef<HTMLButtonElement>(null);
 const readingClock=useRef(new ReadingClock());
 const tourEntry=useRef<HTMLButtonElement>(null),tourNext=useRef<HTMLButtonElement>(null);
 const [tour,dispatchTour]=useReducer(tourReducer,null);
 const tourLine=tour?.line??null,tourRevision=tour?.revision??0,tourPlaying=tour?.playing??false,tourArrived=tour?.arrived??false;
 const markerButtons=useRef(new Map<number,HTMLButtonElement>());
 const [sound,setSound]=useState(false);
 const [soundLoading,setSoundLoading]=useState(false);
 const [soundError,setSoundError]=useState('');
 const [placesOpen,setPlacesOpen]=useState(false),[viewOpen,setViewOpen]=useState(false);
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[entered,setEntered]=useState(initialLine!==null),[selected,setSelected]=useState(initialLine===null?0:landmarkForLine(initialLine)),[selectedLine,setSelectedLine]=useState(initialLine??0),[mode,setMode]=useState<WorldMode>('inspect'),[light,setLight]=useState<'late'|'day'|'dusk'>('late'),[help,setHelp]=useState(false),[limited,setLimited]=useState(false);
 const props=useRef({motion,initialLine,light,sound});
 useEffect(()=>{props.current={motion,initialLine,light,sound}},[motion,initialLine,light,sound]);
 function setLine(line:number){setSelected(landmarkForLine(line));setSelectedLine(line);setEntered(true);history.replaceState(null,'',`#/${poem.slug}/${poem.lines[line].id}`)}
 function focusLine(line:number){requestAnimationFrame(()=>reading.current?.querySelector<HTMLButtonElement>(`[data-line="${line}"] button`)?.focus())}
 useEffect(()=>{
  if(plain||!host.current)return;
  let active=true;queueMicrotask(()=>{if(active){setReady(false);setError('');setLimited(false);setMode('inspect')}});
  try{
   const instance=new DesertWorld(host.current,{
    ready:()=>{if(active)setReady(true)},error:s=>{if(active){setError(s);setReady(false)}},boundary:b=>{if(active)setLimited(b)},
    markers:points=>{if(active)for(const p of points){const button=markerButtons.current.get(p.line);if(button){button.style.transform=`translate3d(${p.x}px,${p.y}px,0) translate(-50%,-50%)`;button.style.visibility=p.visible?'visible':'hidden'}}},
    departing:line=>{if(active)dispatchTour({type:'depart',line})},arrived:line=>{if(active)dispatchTour({type:'arrive',line})},interaction:()=>{if(active)dispatchTour({type:'interrupt'})},
   },poem.slug);
   world.current=instance;instance.setMotion(props.current.motion);if(props.current.sound)void instance.setSound(true);instance.setLight(props.current.light);if(props.current.initialLine!==null)instance.goLine(props.current.initialLine);
   const pause=()=>{instance.paused=true;instance.pauseJourney(true);dispatchTour({type:'pause'})};const resume=()=>{if(!reading.current?.open)instance.resumeWorld()};
   window.addEventListener('two-deserts:pause',pause);window.addEventListener('two-deserts:resume',resume);
   return()=>{active=false;window.removeEventListener('two-deserts:pause',pause);window.removeEventListener('two-deserts:resume',resume);instance.dispose();world.current=null};
  }catch{queueMicrotask(()=>{if(active)setError('Your browser couldn’t open the world. You can still read the poem.')});return()=>{active=false}}
 },[plain,poem]);
 useEffect(()=>{world.current?.setMotion(motion)},[motion]);
 useEffect(()=>{
  dispatchTour({type:'leave'});world.current?.leaveJourney();
  if(initialLine!==null){world.current?.goLine(initialLine);queueMicrotask(()=>{setSelected(landmarkForLine(initialLine));setSelectedLine(initialLine);setEntered(true);setMode('inspect')})}
  else{world.current?.beginJourney();queueMicrotask(()=>{setSelected(0);setSelectedLine(0);setEntered(false);setMode('inspect')})}
 },[initialLine,navigationKey,landmarkForLine]);
 useEffect(()=>{
  if(tourLine===null)return;
  const line=tourLine;
  queueMicrotask(()=>{setSelected(landmarkForLine(line));setSelectedLine(line);setEntered(true);setMode('inspect')});
  history.replaceState(null,'',`#/${poem.slug}/${poem.lines[line].id}`);
  world.current?.goLine(line,true);
 },[tourLine,tourRevision,poem,landmarkForLine]);
 useEffect(()=>{readingClock.current.reset()},[tourRevision]);
 useEffect(()=>{if(tourPlaying)world.current?.pauseJourney(false);else if(tourArrived)world.current?.pauseJourney(true)},[tourPlaying,tourArrived]);
 useEffect(()=>{
  if(tourLine===null||!tourPlaying||!tourArrived||error)return;
  const clock=readingClock.current,remaining=clock.start(tourLine,profile.holds[tourLine],performance.now());
  const timer=window.setTimeout(()=>dispatchTour({type:'elapsed'}),remaining);
  return()=>{clearTimeout(timer);clock.stop(performance.now())};
 },[tourLine,tourPlaying,tourArrived,error,profile]);
 useEffect(()=>{const hide=()=>{if(document.hidden){dispatchTour({type:'pause'});world.current?.pauseJourney(true)}};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide)},[]);
 async function toggleSound(){if(soundLoading)return;const next=!sound;setSoundError('');setSoundLoading(true);try{await world.current?.setSound(next);setSound(next)}catch{setSound(false);setSoundError('Sound couldn’t load. Select Sound off to try again.')}finally{setSoundLoading(false)}}
 function startTour(){if(!ready||error)return;places.current?.hidePopover();view.current?.hidePopover();setHelp(false);world.current?.beginJourney();dispatchTour({type:'start',motion,total:poem.lines.length});requestAnimationFrame(()=>tourNext.current?.focus({preventScroll:true}))}
 function leaveTour(){dispatchTour({type:'leave'});world.current?.leaveJourney();requestAnimationFrame(()=>tourEntry.current?.focus({preventScroll:true}))}
 function toggleTour(){if(!tour)return;if(tour.playing)world.current?.pauseJourney(true);else world.current?.continueJourney(tour.line);dispatchTour({type:'toggle'})}
 function stepTour(line:number){dispatchTour({type:'step',line});world.current?.pauseJourney(false)}
 function visitLine(line:number){setLine(line);setMode('inspect');world.current?.goLine(line)}
 function visit(index:number){places.current?.hidePopover();visitLine(landmarkLines[index])}
 function openPoem(line=selectedLine){dispatchTour({type:'pause'});world.current?.pauseJourney(true);places.current?.hidePopover();view.current?.hidePopover();setHelp(false);setLine(line);reading.current?.showModal();if(world.current)world.current.paused=true;focusLine(line)}
 function closePoem(){reading.current?.close();world.current?.resumeWorld()}
 function seeLine(line:number){closePoem();if(tour)stepTour(line);else visitLine(line);requestAnimationFrame(()=>host.current?.querySelector('canvas')?.focus({preventScroll:true}))}
 function switchMode(value:WorldMode){setMode(value);setEntered(true);world.current?.setMode(value)}
 const text=<><p className="world-scroll-hint">Scroll sideways to read each full line.</p><div className="world-verse-scroll" role="region" tabIndex={0} aria-label="Complete poem. Scroll sideways to read the full lines."><p className="world-verse">{poem.lines.map((l,i)=><span key={l.id} data-line={i} data-stanza-start={i>0&&l.stanza!==poem.lines[i-1].stanza?'true':undefined} data-selected={!plain&&selectedLine===i?'true':undefined}>{plain?l.text:<button aria-current={selectedLine===i?'true':undefined} aria-label={`See in the world: ${l.text}`} onClick={()=>seeLine(i)}>{l.text}</button>}</span>)}</p></div></>;
 if(plain)return <main id="main" className="plain-reader world-plain" tabIndex={-1}><a className="text-link" href={`#/${poem.slug}/${poem.lines[selectedLine].id}`}>Return to the world</a><div className="plain-heading"><span>{poem.year}</span><h1>{poem.title}</h1><p>{poem.author}</p></div>{text}<div className="source-note"><p>{poem.rights}</p><a href={poem.source} target="_blank" rel="noreferrer">{poem.sourceName}</a></div></main>;
 return <main id="main" tabIndex={-1} className={`poem-world ${poem.slug==='the-second-coming'?'world-second-coming':''} ${entered?'world-entered':''} ${tour?'world-touring':''}`} onKeyDown={e=>{if(e.key==='Escape'&&help){setHelp(false);controlsButton.current?.focus()}else if(e.key==='Escape'&&tour&&!reading.current?.open)leaveTour()}}>
  <div className="world-viewport" ref={host}/><div className="world-vignette" aria-hidden="true"/>
  <div className="world-heading"><span>{poem.author}, {poem.year}</span><h1>{poem.title}</h1><p>A poem to walk through.</p><span className="world-origin">{poem.slug==='ozymandias'&&<svg viewBox="0 0 20 30" aria-hidden="true"><rect x="3" y="2" width="14" height="23" rx="7"/><path d="M2 28h16"/></svg>}{profile.origin}</span></div>
  {entered&&!error&&!tour&&<div className="world-selected-verse" aria-live="polite"><span>{poem.lines[selectedLine].text.endsWith('”')&&!poem.lines[selectedLine].text.includes('“')&&<i aria-hidden="true">“</i>}{poem.lines[selectedLine].text.endsWith('’')&&!poem.lines[selectedLine].text.includes('‘')&&<i aria-hidden="true">‘</i>}{poem.lines[selectedLine].text}</span></div>}
  {!entered&&!error&&<div className="world-invitation"><p>“{poem.lines[0].text}”</p><div className="world-entry-actions"><button onClick={startTour} disabled={!ready||!!error}>{ready?'Enter the poem':profile.opening}</button><button className="world-explore-entry" onClick={()=>{setEntered(true);host.current?.querySelector('canvas')?.focus()}} disabled={!ready||!!error}>Explore freely</button></div><span>Follow all fourteen lines through the ruin. Pause anytime.</span></div>}
  {error&&<div className="world-error" role="alert"><p>{error}</p><button onClick={()=>window.location.reload()}>Reload the world</button><a href={`#/${poem.slug}/plain`}>Read the poem</a></div>}
  {!error&&!ready&&entered&&<div className="world-loading" role="status">{profile.opening}</div>}
  <div className="world-tools"><div className="world-mode" role="group" aria-label="Navigation mode"><button disabled={!ready||!!error} aria-pressed={mode==='inspect'} onClick={()=>switchMode('inspect')}>Orbit</button><button disabled={!ready||!!error} aria-pressed={mode==='walk'} onClick={()=>switchMode('walk')}>Wander</button></div><button disabled={!ready||!!error||soundLoading} aria-busy={soundLoading} onClick={toggleSound} aria-pressed={sound} className="world-sound">{soundLoading?'Loading sound…':sound?'Sound on':'Sound off'}</button><button onClick={()=>openPoem()} className="world-read">Read the poem</button></div>
  {soundError&&<p className="world-sound-notice" role="status">{soundError}</p>}
  <div className="world-weather"><label><span>Light</span><select disabled={!ready||!!error} aria-label="Light" value={light} onChange={e=>{const value=e.target.value as typeof light;setLight(value);world.current?.setLight(value)}}><option value="late">{poem.slug==='ozymandias'?'Late afternoon':'Storm light'}</option><option value="day">{poem.slug==='ozymandias'?'High sun':'Pitiless sun'}</option><option value="dusk">{poem.slug==='ozymandias'?'Last light':'Darkness'}</option></select></label></div>
  {help&&<section className="world-help" id="world-help" aria-label="World controls"><h2>Find your way</h2><p>Use Orbit to circle the statue, or Wander to move through the desert. Select a plus beside the ruin to read its lines.</p><dl className="world-keys"><div><dt>Drag in Orbit</dt><dd>Look around the scene</dd></div><div><dt>Drag in Wander</dt><dd>Move forward, back, and sideways</dd></div><div><dt>Alt + drag in Wander</dt><dd>Look around</dd></div><div><dt>Right-click and drag, or Shift + drag</dt><dd>Pan across the scene</dd></div><div><dt>Two fingers</dt><dd>Pan on a touch screen</dd></div><div><dt>Scroll</dt><dd>Zoom</dd></div><div><dt>Pinch</dt><dd>Zoom in Orbit</dd></div><div><dt>WASD</dt><dd>Move in Wander</dd></div><div><dt>Hold Shift</dt><dd>Move faster in Wander</dd></div><div><dt>Arrow keys</dt><dd>Look up, down, and around</dd></div><div><dt>Shift + arrows</dt><dd>Pan sideways or vertically</dd></div><div><dt>Space or Page Up</dt><dd>Rise</dd></div><div><dt>C, Shift + Space or Page Down</dt><dd>Lower your viewpoint</dd></div><div><dt>+ and −</dt><dd>Zoom</dd></div><div><dt>Tab, then Enter</dt><dd>Read a focused marker</dd></div><div><dt>Escape</dt><dd>Close the poem or a menu</dd></div></dl><p>You can travel up to {profile.radius} meters from the statue and rise {profile.ceiling} meters above the desert.</p><button onClick={()=>{setHelp(false);controlsButton.current?.focus()}}>Close controls</button></section>}
  {limited&&!error&&<div className="world-boundary" role="status"><span>You’ve reached the edge of the {profile.landscapeLabel}.</span><button onClick={()=>visit(0)}>{profile.returnLabel}</button></div>}
  {entered&&ready&&!error&&!tour&&<div className="world-markers" role="group" aria-label={profile.placesLabel}>{inspectionPoints.map(m=><button key={m.line} ref={el=>{if(el)markerButtons.current.set(m.line,el);else markerButtons.current.delete(m.line)}} className="world-marker" style={{left:0,top:0,visibility:'hidden'}} aria-label={`Read: ${m.label}`} onClick={()=>openPoem(m.line)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>)}</div>}
  {tour&&!error&&<section className="guided-reading" aria-label="Guided reading" data-line={tour.line} data-playing={tour.playing} data-arrived={tour.arrived}>
   <div className="guided-reading-meta"><span>{tour.finished?'Reading complete':tour.playing?'Automatic reading':'Reading paused'}</span><span>Line {tour.line+1} of {poem.lines.length}</span><button onClick={leaveTour}>Leave tour</button></div>
   <div className="guided-line-scroll" role="region" aria-label="Current line. Scroll sideways to read it in full." tabIndex={0}><p key={tour.line} className="guided-line" aria-live="polite" aria-atomic="true">{poem.lines[tour.line].text}</p></div>
   <p className="guided-reading-hint">Scroll sideways to read the full line.</p>
   <div className="guided-reading-controls" role="group" aria-label="Reading controls"><button disabled={tour.line===0} onClick={()=>stepTour(tour.line-1)}>Previous line</button><button onClick={toggleTour} disabled={tour.finished}>{tour.playing?'Pause tour':'Continue tour'}</button><button ref={tourNext} onClick={()=>tour.line===poem.lines.length-1?startTour():stepTour(tour.line+1)}>{tour.line===poem.lines.length-1?'Read again':'Next line'}</button></div>
  </section>}
  <div className="world-bottom">
   <div className="world-bottom-left"><button className="world-place-trigger" popoverTarget="world-places" aria-expanded={placesOpen} disabled={!ready||!!error}><Compass/><span><span className="world-control-label">{profile.placesLabel}</span><span className="world-control-value">{entered?(poem.slug==='ozymandias'&&selectedLine===7?'The hand':landmarks[selected].short):'Choose a place'}</span></span></button>{entered&&<button ref={tourEntry} className="world-tour-entry" disabled={!ready||!!error} onClick={startTour}>Enter the poem</button>}</div>
   <div className="world-bottom-right"><button ref={controlsButton} onClick={()=>{places.current?.hidePopover();view.current?.hidePopover();setHelp(v=>!v)}} aria-expanded={help} aria-controls="world-help" className="world-help-button">Controls</button><button className="world-view-trigger" popoverTarget="world-view" aria-expanded={viewOpen} disabled={!ready||!!error}><ViewMark/><span>Adjust view</span></button></div>
  </div>
  <div ref={places} id="world-places" className="world-popover world-places" popover="auto" onToggle={e=>{const open=(e.nativeEvent as ToggleEvent).newState==='open';setPlacesOpen(open);if(open)setHelp(false)}}><span className="world-panel-label">{profile.placesLabel}</span><nav aria-label="Poem landmarks">{landmarks.map((l,i)=><button key={l.short} aria-current={entered&&selected===i?'location':undefined} onClick={()=>visit(i)} disabled={!ready||!!error}><span>{l.short}</span><small>{l.name}</small></button>)}</nav></div>
  <div ref={view} id="world-view" className="world-popover world-view-panel" popover="auto" onToggle={e=>{const open=(e.nativeEvent as ToggleEvent).newState==='open';setViewOpen(open);if(open)setHelp(false)}}><span className="world-panel-label">Adjust your view</span><div role="group" aria-label="Camera controls">
   <div className="view-directions"><button aria-label="Look up" onClick={()=>world.current?.navigate('up')}>Up<kbd>↑</kbd></button><button aria-label="Look left" onClick={()=>world.current?.navigate('left')}>Left<kbd>←</kbd></button><ViewMark/><button aria-label="Look right" onClick={()=>world.current?.navigate('right')}>Right<kbd>→</kbd></button><button aria-label="Look down" onClick={()=>world.current?.navigate('down')}>Down<kbd>↓</kbd></button></div>
   <div className="view-step"><button aria-label="Zoom in" onClick={()=>world.current?.zoom(true)}>Closer<kbd>+</kbd></button><button aria-label="Zoom out" onClick={()=>world.current?.zoom(false)}>Farther<kbd>−</kbd></button></div>
   <div className="view-step"><button onClick={()=>world.current?.navigate('rise')}>Rise<kbd>Space</kbd></button><button onClick={()=>world.current?.navigate('lower')}>Lower<kbd>C</kbd></button></div>
   {mode==='walk'&&<div className="view-step"><button onClick={()=>world.current?.navigate('forward')}>Move forward<kbd>W</kbd></button><button onClick={()=>world.current?.navigate('back')}>Move back<kbd>S</kbd></button></div>}
  </div><p>Drag or use WASD to move in Wander. Use the arrow keys to look around, Space to rise, and C to lower your view.</p></div>
  <div className="world-footnote"><div className="world-key-hints"><span>{mode==='walk'?'Drag or WASD to move':'Drag to orbit'}</span><span>{mode==='walk'?'Arrows to look':'Scroll to zoom'}</span><span>Space to rise</span><span>C to lower</span></div><span>{profile.footnote}</span></div>
  <dialog ref={reading} className="world-reading" aria-labelledby="world-reading-title" onClose={()=>{world.current?.resumeWorld()}} onClick={e=>{if(e.target===e.currentTarget)closePoem()}}>
   <div className="world-sheet-toolbar"><span>The poem</span><button className="world-reading-close" aria-label="Close poem" onClick={closePoem}><span aria-hidden="true">×</span></button></div><div className="world-sheet-body"><span className="world-reading-label">{poem.author}, {poem.year}</span><h2 id="world-reading-title">{poem.title}</h2><p className="world-reading-hint">Select a line to see it in the world.</p>{text}
   <div className="world-reading-bottom"><p>{profile.stanzaLabel} Wording and line breaks follow the <a href={poem.source} target="_blank" rel="noreferrer">{profile.edition}</a>.</p><label><span>Find a line in the world</span><select value={selectedLine} onChange={e=>seeLine(Number(e.target.value))}>{poem.lines.map((l,i)=><option key={l.id} value={i}>Line {i+1}: {l.text}</option>)}</select></label><a href={`#/${poem.slug}/plain`} onClick={closePoem}>Text only</a></div></div>
  </dialog>
 </main>;
}
