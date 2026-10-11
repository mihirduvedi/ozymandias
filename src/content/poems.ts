import ozymandias from './ozymandias.json';
import secondComing from './second-coming.json';
export type Slug = 'ozymandias' | 'the-second-coming';
export type Cue = { act: number; movement: string; treatment: string; phrase: string; monument: number; face: number; figure: number; gyre: number; horizon: number; ending: boolean };
export type Poem = {slug: Slug; title: string; author: string; year: string; numeral: string; subtitle: string; description: string; source: string; sourceName: string; rights: string; lines: {id: string; text: string; stanza: number; cue: Cue}[]};
const O: Cue[] = [
 {act:1,movement:'The encounter',treatment:'distant',phrase:'antique land',monument:0,face:0,figure:0,gyre:0,horizon:0,ending:false},
 {act:2,movement:'The fragments',treatment:'vertical',phrase:'legs of stone',monument:1,face:0,figure:0,gyre:0,horizon:0,ending:false},
 {act:2,movement:'The fragments',treatment:'vertical',phrase:'in the desert',monument:1,face:0.15,figure:0,gyre:0,horizon:0,ending:false},
 {act:2,movement:'The fragments',treatment:'face',phrase:'shattered visage',monument:0.3,face:1,figure:0,gyre:0,horizon:0,ending:false},
 {act:2,movement:'The fragments',treatment:'face',phrase:'cold command',monument:0,face:1,figure:0,gyre:0,horizon:0,ending:false},
 {act:2,movement:'The sculptor',treatment:'relief',phrase:'its sculptor',monument:0,face:1,figure:0,gyre:0,horizon:0,ending:false},
 {act:2,movement:'The sculptor',treatment:'relief',phrase:'lifeless things',monument:0,face:1,figure:0,gyre:0,horizon:0,ending:false},
 {act:2,movement:'The sculptor',treatment:'relief',phrase:'the heart that fed',monument:0,face:0.8,figure:0,gyre:0,horizon:0,ending:false},
 {act:3,movement:'The inscription',treatment:'inscription',phrase:'these words appear',monument:0.65,face:0.2,figure:0,gyre:0,horizon:0,ending:false},
 {act:3,movement:'The inscription',treatment:'boast',phrase:'king of kings',monument:0.8,face:0.1,figure:0,gyre:0,horizon:0,ending:false},
 {act:3,movement:'The inscription',treatment:'boast',phrase:'Look on my works,\nye Mighty,\nand despair!',monument:0.5,face:0,figure:0,gyre:0,horizon:0,ending:false},
 {act:4,movement:'The silence',treatment:'erode',phrase:'Nothing beside\nremains.',monument:0,face:0,figure:0,gyre:0,horizon:1,ending:false},
 {act:4,movement:'The silence',treatment:'level',phrase:'boundless and bare',monument:0,face:0,figure:0,gyre:0,horizon:1,ending:false},
 {act:4,movement:'The silence',treatment:'level',phrase:'The lone and level sands',monument:0,face:0,figure:0,gyre:0,horizon:1,ending:true},
];
const ySpecs: [number,string,string,string][] = [
 [1,'The widening gyre','gyre','Turning and turning'],[1,'The widening gyre','gyre','cannot hear'],[1,'The widening gyre','fracture','the centre\ncannot hold'],
 [2,'The unravelling','fracture','Mere anarchy'],[2,'The unravelling','tide','The blood-dimmed tide'],[2,'The unravelling','tide','innocence'],[2,'The unravelling','fracture','lack all conviction'],[2,'The unravelling','fracture','passionate intensity'],
 [3,'The revelation','revelation','some revelation'],[3,'The revelation','revelation','at hand.'],[3,'The revelation','revelation','The Second Coming!'],[3,'The revelation','vision','Spiritus Mundi'],[3,'The revelation','vision','a waste of desert sand'],
 [4,'The apparition','beast','A shape'],[4,'The apparition','beast','blank and pitiless'],[4,'The apparition','beast','its slow thighs'],[4,'The apparition','birds','desert birds.'],
 [5,'The threshold','darkness','The darkness drops'],[5,'The threshold','darkness','stony sleep'],[5,'The threshold','darkness','a rocking cradle'],[5,'The threshold','question','what rough beast'],[5,'The threshold','question','to be born?'],
];
const Y: Cue[] = ySpecs.map(([act,movement,treatment,phrase],i)=>({act,movement,treatment,phrase,monument:0,face:0,figure:i>=13?(i>=17?0.6:1):0,gyre:i<11?1:0,horizon:i>=11?1:0,ending:i===21}));
export const poems: Record<Slug,Poem> = {
 'ozymandias':{slug:'ozymandias',title:'Ozymandias',author:'Percy Bysshe Shelley',year:'1818',numeral:'I',subtitle:'The monument & the sand',description:'A king’s claim. A shattered monument. A desert that outlasts them both.',source:'https://poets.org/poem/ozymandias',sourceName:'Academy of American Poets',rights:'Public domain. Text from the Academy of American Poets edition.',lines:ozymandias.map((text,i)=>({id:`O${String(i+1).padStart(2,'0')}`,text,stanza:0,cue:O[i]}))},
 'the-second-coming':{slug:'the-second-coming',title:'The Second Coming',author:'W. B. Yeats',year:'1920',numeral:'II',subtitle:'The widening gyre',description:'The centre gives way. In the desert, something begins to stir.',source:'https://www.gutenberg.org/files/72987/72987-h/72987-h.htm#the-second-coming',sourceName:'Project Gutenberg, 1920 edition',rights:'Public domain in the United States. Text from Michael Robartes and the Dancer (1920).',lines:secondComing.map((text,i)=>({id:`Y${String(i+1).padStart(2,'0')}`,text,stanza:i<8?0:1,cue:Y[i]}))}
};
export function parseRoute(hash: string): {slug: Slug | null; line: number | null; plain: boolean} {
 const [slug,id] = hash.replace(/^#\/?/,'').split('/');
 if (slug !== 'ozymandias' && slug !== 'the-second-coming') return {slug:null,line:null,plain:false};
 const index = poems[slug].lines.findIndex(l=>l.id===id);
 return {slug,line:index>=0?index:id&&id!=='plain'?0:null,plain:id==='plain'};
}

// Keep the unpublished poem and its assets intact for a later return.
export const publishedPoems: readonly Slug[] = ['ozymandias'];
export function parsePublishedRoute(hash: string): {slug: Slug; line: number | null; plain: boolean} {
 const route=parseRoute(hash);
 return route.slug&&publishedPoems.includes(route.slug)
  ? {...route,slug:route.slug}
  : {slug:'ozymandias',line:null,plain:route.plain};
}
