// Soft air without the cactus recording's resonant howls or rumble.
// Source: dhallcomposer, Freesound 697217, CC0. See audio/CREDITS.md.
export const AMBIENCE_URL='./world/audio/quiet-desert-air.mp3';
export const AMBIENCE_FADE=12;
export const AMBIENCE_LEVEL=.35;
export function ambientPass(start:number,recordingSeconds:number,variation:number){
 const rate=.995+Math.max(0,Math.min(1,variation))*.01;
 const duration=recordingSeconds/rate;
 return {start,end:start+duration,next:start+duration-AMBIENCE_FADE,rate};
}
function fadeCurve(inward:boolean){return Float32Array.from({length:65},(_,i)=>Math[inward?'sin':'cos'](i/64*Math.PI/2))}
const fadeIn=fadeCurve(true),fadeOut=fadeCurve(false);

export class WorldAmbience {
 private context:AudioContext|null=null;private output:GainNode|null=null;
 private buffer:AudioBuffer|null=null;private loading:Promise<AudioBuffer>|null=null;
 private sources=new Set<AudioBufferSourceNode>();private controller:AbortController|null=null;
 private scheduler:ReturnType<typeof setInterval>|null=null;private suspension:ReturnType<typeof setTimeout>|null=null;
 private nextStart:number|null=null;private enabled=false;private disposed=false;private quiet=false;
 async enable(value:boolean){
  if(this.disposed)return;
  this.enabled=value;
  if(this.suspension){clearTimeout(this.suspension);this.suspension=null}
  const existing=this.context;
  if(!value){
   if(existing){this.output?.gain.setTargetAtTime(0,existing.currentTime,.16);this.suspension=setTimeout(()=>{this.suspension=null;if(!this.enabled&&!this.disposed)void existing.suspend()},700)}
   return;
  }
  const ctx=this.context??new AudioContext();this.context=ctx;
  if(!this.output){this.output=ctx.createGain();this.output.gain.value=0;this.output.connect(ctx.destination)}
  // Resume in the click's activation window, before awaiting the asset.
  await ctx.resume();
  if(!this.buffer){
   if(!this.loading){this.controller=new AbortController();this.loading=fetch(AMBIENCE_URL,{signal:this.controller.signal}).then(response=>{if(!response.ok)throw new Error('Ambience could not load');return response.arrayBuffer()}).then(data=>ctx.decodeAudioData(data))}
   try{this.buffer=await this.loading}catch(error){this.loading=null;if(this.disposed)return;this.enabled=false;await ctx.suspend();throw error}
  }
  if(this.disposed||!this.enabled)return;
  if(this.nextStart===null){this.schedule(ctx.currentTime+.03,true);this.scheduler=setInterval(()=>this.pump(),1000)}
  this.output.gain.setTargetAtTime(this.quiet?0:AMBIENCE_LEVEL,ctx.currentTime,.8);
 }
 private schedule(start:number,first=false){
  const ctx=this.context,buffer=this.buffer,output=this.output;if(!ctx||!buffer||!output)return;
  const pass=ambientPass(start,buffer.duration,Math.random()),source=ctx.createBufferSource(),envelope=ctx.createGain();
  source.buffer=buffer;source.playbackRate.value=pass.rate;source.loop=false;envelope.gain.value=0;
  source.connect(envelope);envelope.connect(output);
  envelope.gain.setValueCurveAtTime(fadeIn,start,first?6:AMBIENCE_FADE);
  envelope.gain.setValueCurveAtTime(fadeOut,pass.end-AMBIENCE_FADE,AMBIENCE_FADE);
  this.sources.add(source);source.onended=()=>{this.sources.delete(source);source.disconnect();envelope.disconnect()};
  source.start(start);this.nextStart=pass.next;
 }
 private pump(){const ctx=this.context;if(!ctx||ctx.state!=='running'||this.nextStart===null)return;if(this.nextStart<ctx.currentTime+2)this.schedule(Math.max(this.nextStart,ctx.currentTime+.02))}
 update(_time:number,_gust:number,_coast:number,paused:boolean){
  // The sound stays gentle when the camera moves or the visual wind picks up.
  if(this.quiet===paused)return;this.quiet=paused;
  if(this.enabled&&this.context)this.output?.gain.setTargetAtTime(paused?0:AMBIENCE_LEVEL,this.context.currentTime,.8);
 }
 dispose(){
  this.disposed=true;this.enabled=false;this.controller?.abort();if(this.scheduler)clearInterval(this.scheduler);if(this.suspension)clearTimeout(this.suspension);
  for(const source of this.sources){source.onended=null;source.stop();source.disconnect()}this.sources.clear();this.output?.disconnect();void this.context?.close();this.context=null;
 }
}
