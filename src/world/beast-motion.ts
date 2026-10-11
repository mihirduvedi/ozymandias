// A slow four-beat gait. During stance, the foot moves backwards relative to
// the progressing torso; during swing it follows a low ballistic-shaped arc.
// Different paws carry weight while the other lifts. This is a kinematic rig.
export const beastGaitShader=`
 float fore=step(0.0,position.z),right=step(0.0,position.x);
 float phase=fract(uGait/5.8+fore*.5+right*.25);
 float swing=clamp((phase-.72)/.28,0.0,1.0);
 float footZ=phase<.72?.42-phase/.72*.84:-.42+swing*.84;
 float lift=phase<.72?0.0:sin(swing*3.14159265)*.19;
 float limb=(1.0-smoothstep(2.6,5.2,position.y))*smoothstep(.9,1.3,abs(position.x));
 transformed.z+=footZ*limb*uGaitWeight;
 transformed.y+=lift*limb*uGaitWeight;
`;

export function pawCycle(time:number,offset:number){
 const phase=((time/5.8+offset)%1+1)%1,swing=Math.max(0,(phase-.72)/.28);
 return {stance:phase<.72,offset:phase<.72?.42-phase/.72*.84:-.42+swing*.84,lift:phase<.72?0:Math.sin(swing*Math.PI)*.19};
}
