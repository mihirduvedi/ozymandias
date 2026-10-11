import { describe,it,expect } from 'vitest';
import { chapters,splitEmphasis } from './chapters';
import { poems } from './poems';
describe('immersive poem sequence',()=>{
 for(const slug of ['ozymandias','the-second-coming'] as const){
  it(`${slug} chapters cover every canonical line exactly once in order`,()=>{
   const indices=chapters[slug].flatMap(ch=>Array.from({length:ch.to-ch.from+1},(_,i)=>i+ch.from));
   expect(indices).toEqual(poems[slug].lines.map((_,i)=>i));
  });
  it(`${slug} emphasis preserves all words, spaces and punctuation`,()=>{
   for(const chapter of chapters[slug])for(let i=chapter.from;i<=chapter.to;i++){
    const text=poems[slug].lines[i].text;const phrase=chapter.emphasis[i];
    if(phrase)expect(text).toContain(phrase);
    expect(splitEmphasis(text,phrase).map(p=>p.text).join('')).toBe(text);
   }
  });
 }
 it('keeps closing quotation marks with the emphasized phrase',()=>{
  const result=splitEmphasis("Look on my works, ye Mighty, and despair!’",'and despair!');
  expect(result.at(-1)).toEqual({text:'and despair!’',large:true});
 });
});
