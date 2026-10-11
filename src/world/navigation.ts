export function navigationInput(keys:ReadonlySet<string>,mode:'inspect'|'walk'){
 const has=(key:string)=>Number(keys.has(key));
 const shift=keys.has('shift');
 let forward=has('w')-has('s'),side=has('d')-has('a');
 const length=Math.hypot(forward,side);if(length>1){forward/=length;side/=length}
 return {
  forward:mode==='walk'?forward:0,side:mode==='walk'?side:0,
  yaw:shift?0:has('arrowleft')-has('arrowright'),
  pitch:shift?0:has('arrowup')-has('arrowdown'),
  panX:shift?has('arrowleft')-has('arrowright'):0,
  panY:shift?has('arrowup')-has('arrowdown'):0,
  rise:(has(' ')*(shift?-1:1)+has('pageup')-has('pagedown')-has('c')),
  speed:shift?8:4,
 };
}
