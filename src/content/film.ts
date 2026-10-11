/** A single deterministic editorial clock. Seconds, not scroll distance. */
export const FILM_DURATION = 144;
export const LINE_TIMES = [8,18,24,38,42,51,58,65,74,81,87,104,112,120] as const;
export const SHOTS = [
 {start:0,end:18,name:'The approach',lines:[0]},
 {start:18,end:34,name:'The wreck',lines:[1,2]},
 {start:34,end:51,name:'The face',lines:[3,4]},
 {start:51,end:74,name:'The sculptor',lines:[5,6,7]},
 {start:74,end:104,name:'The inscription',lines:[8,9,10]},
 {start:104,end:144,name:'The distance',lines:[11,12,13]},
] as const;
export function clampTime(t:number){return Math.max(0,Math.min(FILM_DURATION,Number.isFinite(t)?t:0))}
export function activeLine(t:number){return LINE_TIMES.reduce((line,start,i)=>t>=start?i:line,0)}
export function shotAt(t:number){return SHOTS.find(s=>t<s.end)??SHOTS[SHOTS.length-1]}
export function captionVisible(t:number){return t>=8&&t<130&&!(t>=96&&t<104)&&!(t>=16&&t<18)&&!(t>=32&&t<34)&&!(t>=49&&t<51)&&!(t>=72&&t<74)}
export function clock(t:number){const s=Math.floor(clampTime(t));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
const cameras=[
 // centre x/y in the same immutable landscape; zoom is optical crop.
 {t:0,x:.23,y:.47,z:2.3}, {t:8,x:.23,y:.47,z:2.3},
 {t:18,x:.64,y:.46,z:1.15},{t:24,x:.72,y:.45,z:1.4},
 {t:32,x:.72,y:.45,z:1.4},{t:38,x:.715,y:.70,z:3.0},
 {t:49,x:.715,y:.70,z:3.12},{t:65,x:.715,y:.70,z:3.12},
 {t:74,x:.82,y:.575,z:2.55},{t:87,x:.82,y:.575,z:2.55},
 {t:96,x:.67,y:.50,z:1.12},{t:104,x:.67,y:.50,z:1.12},
 {t:120,x:.23,y:.49,z:2.05},{t:130,x:.23,y:.49,z:2.05},
 {t:144,x:.23,y:.49,z:2.05},
];
export function cameraAt(time:number){
 const t=clampTime(time);const i=cameras.findIndex(k=>k.t>=t);
 if(i<=0)return cameras[0];const a=cameras[i-1],b=cameras[i];
 const q=(t-a.t)/(b.t-a.t),s=q*q*(3-2*q);
 return {x:a.x+(b.x-a.x)*s,y:a.y+(b.y-a.y)*s,z:a.z+(b.z-a.z)*s};
}
