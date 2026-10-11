import { terrainHeight, sandsPanorama, type Point } from './geography';

// These holds start after arrival, so travel never consumes the reading time.
export const tourHolds = [3, 3.5, 3, 3.5, 4, 3.5, 3.5, 3.5, 3, 4, 4, 3, 3.5, 5];
export function tourTravelSeconds(distance:number){return Math.max(1.8,Math.min(7,distance/6.5))}
export function tourViewForLine(line:number):{position:Point;target:Point}{
 const eye=(x:number,z:number,height=2.2)=>[x,terrainHeight(x,z)+height,z] as Point;
 const views=[
  {position:eye(36,76),target:[0,14,0] as Point},
  {position:eye(22,51,4),target:[0,20,0] as Point},
  {position:[-9,7,43] as Point,target:[0,16,3] as Point},
  {position:[-24,9,38] as Point,target:[-21,7.5,16.5] as Point},
  {position:[-31,10.5,30] as Point,target:[-21,6.8,16.5] as Point},
  {position:[-28,10,32] as Point,target:[-21,6.8,16.5] as Point},
  {position:[-12,11,43] as Point,target:[0,9,8] as Point},
  {position:[17,9,41] as Point,target:[23.4,3.3,23.4] as Point},
  {position:[10,6,43] as Point,target:[0,6,9.3] as Point},
  {position:[2,6,45] as Point,target:[0,5.7,9.3] as Point},
  {position:[-5,5,43] as Point,target:[0,4.5,9.3] as Point},
  {position:[-12,8,45] as Point,target:[0,15,0] as Point},
  {position:[-28,24,69] as Point,target:[0,14,6] as Point},
  sandsPanorama,
 ];
 return views[Math.max(0,Math.min(13,line))];
}

export type TourState={line:number;total:number;revision:number;playing:boolean;arrived:boolean;finished:boolean}|null;
export type TourAction={type:'start';motion:boolean;total?:number}|{type:'step';line:number}|{type:'depart';line:number}|{type:'arrive';line:number}|{type:'toggle'}|{type:'pause'}|{type:'interrupt'}|{type:'elapsed'}|{type:'leave'};
export function tourReducer(state:TourState,action:TourAction):TourState{
 if(action.type==='start')return {line:0,total:action.total??14,revision:(state?.revision??0)+1,playing:true,arrived:false,finished:false};
 if(action.type==='leave')return null;
 if(!state)return state;
 switch(action.type){
  case 'step':return {...state,line:Math.max(0,Math.min(state.total-1,action.line)),revision:state.revision+1,playing:false,arrived:false,finished:false};
  case 'depart':return action.line===state.line?{...state,arrived:false}:state;
  case 'arrive':return action.line===state.line?{...state,arrived:true}:state;
  case 'pause':return state.playing?{...state,playing:false}:state;
  case 'interrupt':return {...state,playing:false,arrived:false};
  case 'toggle':return {...state,playing:!state.playing};
  case 'elapsed':
   if(!state.playing||!state.arrived)return state;
   return state.line===state.total-1?{...state,playing:false,finished:true}:{...state,line:state.line+1,arrived:false};
 }
}
