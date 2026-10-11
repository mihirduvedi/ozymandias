import type { Slug } from './poems';
export type Chapter = {from:number;to:number;kind:string;image?:string;objects?:string[];emphasis:Record<number,string>};
export const chapters:Record<Slug,Chapter[]>={
 'ozymandias':[
  {from:0,to:1,kind:'encounter',image:'ruins',objects:['foot'],emphasis:{1:'Two vast and trunkless'}},
  {from:2,to:3,kind:'visage',image:'sand',objects:['shattered-visage','shard'],emphasis:{3:'a shattered visage'}},
  {from:4,to:6,kind:'command',image:'eye',objects:['shard'],emphasis:{4:'cold command',6:'lifeless things'}},
  {from:7,to:8,kind:'hand',image:'sand',objects:['hand'],emphasis:{7:'The hand',8:'these words appear:'}},
  {from:9,to:9,kind:'king',image:'ruins',objects:['shard','foot'],emphasis:{9:'king of kings:'}},
  {from:10,to:10,kind:'works',image:'sand',objects:['shattered-visage','shard'],emphasis:{10:'and despair!'}},
  {from:11,to:11,kind:'nothing',image:'sand',objects:['shard'],emphasis:{11:'Nothing beside remains.'}},
  {from:12,to:13,kind:'silence',image:'sand',emphasis:{12:'boundless and bare',13:'The lone and level sands'}}
 ],
 'the-second-coming':[
  {from:0,to:1,kind:'turning',image:'storm',objects:['falcon'],emphasis:{0:'Turning and turning',1:'cannot hear'}},
  {from:2,to:3,kind:'fracture',image:'storm',objects:['shard'],emphasis:{2:'Things fall apart;',3:'anarchy'}},
  {from:4,to:5,kind:'tide',image:'tide',emphasis:{4:'blood-dimmed tide',5:'is drowned;'}},
  {from:6,to:7,kind:'intensity',image:'storm',objects:['falcon'],emphasis:{6:'The best',7:'passionate intensity.'}},
  {from:8,to:10,kind:'revelation',image:'storm',objects:['shard'],emphasis:{8:'revelation',9:'the Second Coming',10:'The Second Coming!'}},
  {from:11,to:13,kind:'vision',image:'beast-land',emphasis:{11:'Spiritus Mundi',13:'lion body'}},
  {from:14,to:16,kind:'gaze',image:'eye',objects:['falcon'],emphasis:{14:'blank and pitiless',16:'desert birds.'}},
  {from:17,to:19,kind:'sleep',image:'beast-land',objects:['shard'],emphasis:{18:'twenty centuries',19:'nightmare'}},
  {from:20,to:21,kind:'beast',image:'beast-land',objects:['rough-beast'],emphasis:{20:'rough beast',21:'to be born?'}}
 ]
};
export function splitEmphasis(text:string,phrase?:string){
 if(!phrase)return [{text,large:false}];
 const at=text.indexOf(phrase);if(at<0)return [{text,large:false}];
 let end=at+phrase.length;
 while(end<text.length&&/[,.!?;:’”]/.test(text[end]))end++;
 return [{text:text.slice(0,at),large:false},{text:text.slice(at,end),large:true},{text:text.slice(end),large:false}].filter(part=>part.text.length>0);
}
