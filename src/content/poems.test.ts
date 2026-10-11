import { describe,it,expect } from 'vitest';
import { poems,parseRoute,parsePublishedRoute,publishedPoems } from './poems';
describe('canonical texts and complete reading arcs',()=>{
 for(const [slug,poem] of Object.entries(poems)){
  it(`${slug}: has a complete unique ordered manifest and target state for every line`,()=>{
   const count=slug==='ozymandias'?14:22;
   expect(poem.lines).toHaveLength(count);expect(new Set(poem.lines.map(l=>l.id)).size).toBe(count);
   poem.lines.forEach((l,i)=>{expect(l.id).toBe(`${slug==='ozymandias'?'O':'Y'}${String(i+1).padStart(2,'0')}`);expect(Object.values(l.cue)).not.toContain(undefined);for(const field of ['face','figure','monument','gyre','horizon'] as const){expect(l.cue[field]).toBeGreaterThanOrEqual(0);expect(l.cue[field]).toBeLessThanOrEqual(1)}});
   expect(poem.lines.filter(l=>l.cue.ending)).toHaveLength(1);expect(poem.lines.at(-1)?.cue.ending).toBe(true);
  });
  it(`${slug}: decorative display phrases are drawn from the canonical line`,()=>{for(const l of poem.lines)expect(l.text).toContain(l.cue.phrase.replace(/\n/g,' '))});
 }
 it('preserves Shelley’s exact edition-sensitive punctuation and sonnet structure',()=>{
  expect(poems.ozymandias.lines[2].text).toBe('Stand in the desert . . . Near them, on the sand,');
  expect(poems.ozymandias.lines[9].text).toBe('‘My name is Ozymandias, king of kings:');
  expect(poems.ozymandias.lines[13].text).toBe('The lone and level sands stretch far away.”');
  expect(new Set(poems.ozymandias.lines.map(l=>l.stanza))).toEqual(new Set([0]));
 });
 it('preserves Gutenberg 1920 wording and its two stanzas',()=>{
  expect(poems['the-second-coming'].lines[12].text).toBe('Troubles my sight: a waste of desert sand;');
  expect(poems['the-second-coming'].lines[16].text).toBe('Wind shadows of the indignant desert birds.');
  expect(poems['the-second-coming'].lines.filter(l=>l.stanza===0)).toHaveLength(8);expect(poems['the-second-coming'].lines.filter(l=>l.stanza===1)).toHaveLength(14);
 });
 it('the boast-to-absence turn removes all stone and ends in a horizontal field',()=>{
  expect(poems.ozymandias.lines[10].cue.monument).toBeGreaterThan(0);
  for(const i of [11,12,13]){expect(poems.ozymandias.lines[i].cue.monument).toBe(0);expect(poems.ozymandias.lines[i].cue.face).toBe(0);expect(poems.ozymandias.lines[i].cue.horizon).toBe(1)}
  expect(new Set(poems.ozymandias.lines.map(l=>l.cue.act))).toEqual(new Set([1,2,3,4]));
 });
});
describe('static-host-compatible routes and recovery',()=>{
 it('publishes only Ozymandias and recovers hidden-world links without exposing their line IDs',()=>{
  expect(publishedPoems).toEqual(['ozymandias']);
  for(const hash of ['','#/','#/unknown','#/the-second-coming/Y22'])expect(parsePublishedRoute(hash)).toEqual({slug:'ozymandias',line:null,plain:false});
  expect(parsePublishedRoute('#/the-second-coming/plain')).toEqual({slug:'ozymandias',line:null,plain:true});
  expect(parsePublishedRoute('#/ozymandias/O11')).toEqual({slug:'ozymandias',line:10,plain:false});
  expect(poems['the-second-coming'].lines).toHaveLength(22);
 });
 it.each(['','#/','#/unknown','#main'])('unknown route %s recovers to the collection',hash=>expect(parseRoute(hash).slug).toBeNull());
 it.each(['#/ozymandias/O03','#/the-second-coming/Y22'])('resolves valid line deep link %s',hash=>expect(parseRoute(hash).line).not.toBeNull());
 it.each(['#/ozymandias/O99','#/the-second-coming/O03','#/ozymandias/Y01'])('invalid line %s falls back within its poem',hash=>expect(parseRoute(hash).line).toBe(0));
 it('recognizes both plain modes',()=>{expect(parseRoute('#/ozymandias/plain').plain).toBe(true);expect(parseRoute('#/the-second-coming/plain').plain).toBe(true)});
});
