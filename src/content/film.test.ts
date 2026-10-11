import {describe,it,expect} from 'vitest';
import {activeLine,cameraAt,captionVisible,clampTime,FILM_DURATION,LINE_TIMES,SHOTS,shotAt} from './film';
import text from './ozymandias.json';
describe('Ozymandias editorial timeline',()=>{
 it('places every intact source line in its original sequence exactly once',()=>{expect(SHOTS.flatMap(s=>[...s.lines])).toEqual(text.map((_,i)=>i));expect(LINE_TIMES).toHaveLength(text.length);for(let i=1;i<14;i++)expect(LINE_TIMES[i]).toBeGreaterThan(LINE_TIMES[i-1])});
 it('resolves direct seeks without relying on playback history',()=>{LINE_TIMES.forEach((t,i)=>{expect(activeLine(t)).toBe(i);expect(shotAt(t).lines as readonly number[]).toContain(i);expect(cameraAt(t)).toEqual(cameraAt(t))})});
 it('earns an eight-second blank hold after the boast and a fourteen-second tail',()=>{expect(captionVisible(95.9)).toBe(true);for(let t=96;t<104;t+=.5)expect(captionVisible(t)).toBe(false);expect(captionVisible(104)).toBe(true);for(let t=130;t<=FILM_DURATION;t++)expect(captionVisible(t)).toBe(false)});
 it('holds the opening and the sculpture rather than maintaining constant movement',()=>{expect(cameraAt(0)).toMatchObject(cameraAt(7));expect(cameraAt(51)).toEqual(cameraAt(64));expect(cameraAt(130)).toEqual(cameraAt(144))});
 it('keeps the camera continuous at all editorial boundaries',()=>{for(let t=0;t<=144;t+=.1){const a=cameraAt(t),b=cameraAt(t+.001);expect(Math.abs(a.x-b.x)).toBeLessThan(.001);expect(Math.abs(a.y-b.y)).toBeLessThan(.001);expect(Math.abs(a.z-b.z)).toBeLessThan(.001);expect(a.z).toBeGreaterThanOrEqual(1)}});
 it('clamps invalid, reverse and end-of-film seeks safely',()=>{expect(clampTime(-10)).toBe(0);expect(clampTime(NaN)).toBe(0);expect(clampTime(1000)).toBe(144);expect(activeLine(144)).toBe(13)});
});
