import { afterEach,describe,expect,it,vi } from 'vitest';
import { AMBIENCE_FADE,AMBIENCE_LEVEL,AMBIENCE_URL,ambientPass,WorldAmbience } from './ambience';

function audioHarness(){
 const gains:{gain:{value:number;setTargetAtTime:ReturnType<typeof vi.fn>;setValueCurveAtTime:ReturnType<typeof vi.fn>};connect:ReturnType<typeof vi.fn>;disconnect:ReturnType<typeof vi.fn>}[]=[];
 const sources:{buffer:unknown;loop:boolean;playbackRate:{value:number};start:ReturnType<typeof vi.fn>;stop:ReturnType<typeof vi.fn>;connect:ReturnType<typeof vi.fn>;disconnect:ReturnType<typeof vi.fn>;onended:null|(()=>void)}[]=[];
 const context={currentTime:0,state:'running',destination:{},resume:vi.fn(async()=>{context.state='running'}),suspend:vi.fn(async()=>{context.state='suspended'}),close:vi.fn(async()=>{}),decodeAudioData:vi.fn(async()=>({duration:189.665})),
  createGain:vi.fn(()=>{const node={gain:{value:0,setTargetAtTime:vi.fn(),setValueCurveAtTime:vi.fn()},connect:vi.fn(),disconnect:vi.fn()};gains.push(node);return node}),
  createBufferSource:vi.fn(()=>{const node={buffer:null as unknown,loop:true,playbackRate:{value:1},start:vi.fn(),stop:vi.fn(),connect:vi.fn(),disconnect:vi.fn(),onended:null as null|(()=>void)};sources.push(node);return node})};
 vi.stubGlobal('AudioContext',class{constructor(){return context}});
 const fetch=vi.fn(async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));vi.stubGlobal('fetch',fetch);
 return {context,gains,sources,fetch};
}
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals()});
describe('Quiet desert air',()=>{
 it('crossfades full recordings rather than repeating a short gust, with varying pass lengths',()=>{
  const slow=ambientPass(0,189.665,0),fast=ambientPass(slow.next,189.665,1);
  expect(slow.next).toBeGreaterThan(175);expect(fast.end-fast.start).toBeGreaterThan(180);
  expect(slow.end-fast.start).toBe(AMBIENCE_FADE);expect(slow.rate).not.toBe(fast.rate);
 });
 it('loads only after sound is selected, schedules overlapping sources, and preserves playback across mute',async()=>{
  vi.useFakeTimers();const h=audioHarness(),bed=new WorldAmbience();
  await bed.enable(false);expect(h.fetch).not.toHaveBeenCalled();
  await bed.enable(true);expect(h.fetch).toHaveBeenCalledWith(AMBIENCE_URL,expect.anything());expect(h.context.resume).toHaveBeenCalledOnce();
  expect(h.sources[0].loop).toBe(false);expect(h.sources[0].start).toHaveBeenCalledOnce();
  const firstDuration=189.665/h.sources[0].playbackRate.value;h.context.currentTime=firstDuration-13;
  await vi.advanceTimersByTimeAsync(1000);expect(h.sources).toHaveLength(2);
  expect(h.sources[1].start.mock.calls[0][0]).toBeCloseTo(.03+firstDuration-12);
  await bed.enable(false);expect(h.context.suspend).not.toHaveBeenCalled();await vi.advanceTimersByTimeAsync(700);expect(h.context.suspend).toHaveBeenCalledOnce();
  await bed.enable(true);expect(h.fetch).toHaveBeenCalledOnce();expect(h.sources).toHaveLength(2);
  bed.dispose();expect(h.context.close).toHaveBeenCalledOnce();expect(h.sources.every(s=>s.stop.mock.calls.length===1)).toBe(true);expect(vi.getTimerCount()).toBe(0);
 });
 it('does not pump the volume with visual gusts, and fades quiet on pause',async()=>{
  vi.useFakeTimers();const h=audioHarness(),bed=new WorldAmbience();await bed.enable(true);
  const output=h.gains[0].gain,initial=output.setTargetAtTime.mock.calls.length;
  for(let i=0;i<200;i++)bed.update(i,i%2,0,false);
  expect(output.setTargetAtTime.mock.calls.length).toBe(initial);
  bed.update(200,1,0,true);expect(output.setTargetAtTime).toHaveBeenLastCalledWith(0,0,.8);
  bed.update(200,0,0,false);expect(output.setTargetAtTime).toHaveBeenLastCalledWith(AMBIENCE_LEVEL,0,.8);expect(AMBIENCE_LEVEL).toBeLessThan(.4);bed.dispose();
 });
 it('permits retry after a failed asset request without starting a source',async()=>{
  vi.useFakeTimers();const h=audioHarness(),bed=new WorldAmbience();h.fetch.mockRejectedValueOnce(new Error('Offline'));
  await expect(bed.enable(true)).rejects.toThrow('Offline');expect(h.sources).toHaveLength(0);
  await bed.enable(true);expect(h.sources).toHaveLength(1);bed.dispose();
 });
});
