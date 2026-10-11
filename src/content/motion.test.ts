import {describe,it,expect} from 'vitest';
import {letterPose,materialFor,smooth,windowed} from './motion';
describe('reading motion score',()=>{
 it('assigns materials to the source events',()=>{expect(materialFor(false,9)).toBe('inscription');expect(materialFor(false,12)).toBe('erosion');expect(materialFor(true,4)).toBe('tide');expect(materialFor(true,16)).toBe('birds');});
 it('keeps still reading undeformed for every material',()=>{for(let i=0;i<22;i++)expect(letterPose(-.2,.4,materialFor(true,i),false)).toEqual({x:0,y:0,sx:1,sy:1,rotation:0});});
 it('bulges the centre more than the ends and settles outside focus',()=>{expect(letterPose(0,.5,'wind',true).sy).toBeGreaterThan(letterPose(0,0,'wind',true).sy);expect(letterPose(.8,.5,'wind',true).sy).toBeLessThan(1);});
 it('bounds the glyph width and displacement throughout both poems',()=>{for(const dark of [false,true])for(let i=0;i<(dark?22:14);i++)for(let q=-.6;q<=.6;q+=.04)for(let u=0;u<=1;u+=.05){const p=letterPose(q,u,materialFor(dark,i),true);expect(p.sx).toBeLessThanOrEqual(1.026);expect(Math.abs(p.x)).toBeLessThanOrEqual(.1);expect(Math.abs(p.y)).toBeLessThan(.55);}});
 it('makes material windows continuous and bounded',()=>{expect(smooth(1,3,0)).toBe(0);expect(smooth(1,3,4)).toBe(1);expect(windowed(4,1,2,6,7)).toBe(1);expect(windowed(8,1,2,6,7)).toBe(0);});
});
