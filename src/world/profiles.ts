import type { Slug } from '../content/poems';
import { landmarks,landmarkForLine,landmarkLines,inspectionPoints,terrainHeight,walkStep,viewForLine,boundPosition,boundTarget,colliders,WORLD_RADIUS,WORLD_CEILING,type Point } from './geography';
import { tourHolds,tourViewForLine } from './tour';
import { visionArrival,visionLandmarks,visionLandmarkForLine,visionLandmarkLines,visionMarkers,visionTerrain,visionWalkStep,visionViewForLine,visionBoundPosition,visionBoundTarget,visionColliders,VISION_RADIUS,VISION_CEILING,visionTourHolds } from './vision-geography';
export type WorldProfile={
 slug:Slug;landmarks:{name:string;short:string;lines:number[];position:Point;target:Point;point:Point}[];
 landmarkForLine:(line:number)=>number;landmarkLines:readonly number[];
 inspectionPoints:{line:number;label:string;point:Point}[];arrival:{position:Point;target:Point};
 terrainHeight:(x:number,z:number)=>number;walkStep:typeof walkStep;viewForLine:typeof viewForLine;tourViewForLine:typeof viewForLine;
 boundPosition:typeof boundPosition;boundTarget:typeof boundTarget;colliders:typeof colliders;radius:number;ceiling:number;holds:number[];
 origin:string;placesLabel:string;landscapeLabel:string;returnLabel:string;footnote:string;opening:string;edition:string;stanzaLabel:string;
};
export const worldProfiles:Record<Slug,WorldProfile>={
 ozymandias:{slug:'ozymandias',landmarks,landmarkForLine,landmarkLines,inspectionPoints,arrival:landmarks[0],terrainHeight,walkStep,viewForLine,tourViewForLine,boundPosition,boundTarget,colliders,radius:WORLD_RADIUS,ceiling:WORLD_CEILING,holds:tourHolds,origin:'In the shadow of Ramesses II',placesLabel:'Explore the ruin',landscapeLabel:'desert',returnLabel:'Return to the statue',footnote:'A desert that outlasts its king.',opening:'Opening the desert…',edition:'Academy of American Poets edition',stanzaLabel:'One stanza, fourteen lines.'},
 'the-second-coming':{slug:'the-second-coming',landmarks:visionLandmarks,landmarkForLine:visionLandmarkForLine,landmarkLines:visionLandmarkLines,inspectionPoints:visionMarkers,arrival:visionArrival,terrainHeight:visionTerrain,walkStep:visionWalkStep,viewForLine:visionViewForLine,tourViewForLine:visionViewForLine,boundPosition:visionBoundPosition,boundTarget:visionBoundTarget,colliders:visionColliders,radius:VISION_RADIUS,ceiling:VISION_CEILING,holds:visionTourHolds,origin:'At the edge of a troubled century',placesLabel:'Explore the vision',landscapeLabel:'vision',returnLabel:'Return to the gyre',footnote:'The centre cannot hold.',opening:'Opening the vision…',edition:'1920 Project Gutenberg edition',stanzaLabel:'Two stanzas, twenty-two lines.'},
};
