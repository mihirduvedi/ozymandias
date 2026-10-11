/** The score links the visual material and letter motion to the original verse. */
export type Material = 'wind'|'stone'|'visage'|'pulse'|'inscription'|'erosion'|'gyre'|'fracture'|'tide'|'vision'|'birds'|'darkness'|'beast';
export const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const smooth=(a:number,b:number,v:number)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)};
export const windowed=(p:number,a:number,b:number,c:number,d:number)=>smooth(a,b,p)*(1-smooth(c,d,p));
export function materialFor(dark:boolean,index:number):Material {
 if(!dark)return index<1?'wind':index<3?'stone':index<7?'visage':index<8?'pulse':index<11?'inscription':'erosion';
 return index<2?'gyre':index<4?'fracture':index<6?'tide':index<8?'fracture':index<16?'vision':index<17?'birds':index<20?'darkness':'beast';
}
export function letterPose(q:number,u:number,material:Material,motion:boolean){
 if(!motion)return {x:0,y:0,sx:1,sy:1,rotation:0};
 const focus=Math.exp(-q*q*14),middle=Math.exp(-Math.pow((u-.5)*3.2,2));
 const departure=smooth(.06,.34,-q),sweep=Math.sin(q*5+u*4);
 let y=-middle*focus*.16+Math.sin(u*Math.PI*2+q*5)*focus*.055;
 let x=0,rotation=0;
 if(material==='gyre'){y+=Math.sin(u*5+q*7)*focus*.10;rotation=Math.cos(u*5+q*7)*focus*1.8;}
 if(material==='fracture'){y+=(u<.5?-1:1)*departure*.15;x=(u-.5)*departure*.20;rotation=(u-.5)*departure*5;}
 if(material==='tide')y+=Math.sin(u*8+q*9)*focus*.12;
 if(material==='inscription')y=-middle*focus*.035;
 if(material==='erosion'){y+=departure*(.1+u*.18);rotation=departure*Math.sin(u*18)*4;}
 if(material==='pulse')y+=Math.sin(u*7+q*12)*focus*.075;
 if(material==='beast')y+=Math.sin(u*4+q*5)*focus*.09;
 return{x,y,sx:1+middle*focus*.025,sy:.84+focus*.16+middle*focus*.70,rotation:rotation+sweep*focus*.25};
}
