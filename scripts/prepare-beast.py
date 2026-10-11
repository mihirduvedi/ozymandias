"""Original implicit feline anatomy + a MakeHuman CC0 human portrait.
Keeps the approved Ozymandias asset files untouched. Requires scikit-image 0.25.2
in the scoped offline mesh environment. No external model or executable is loaded.
"""
from pathlib import Path
import ast,hashlib,json
import numpy as np
import trimesh
from skimage.measure import marching_cubes
OUT=Path('public/world/vision');OUT.mkdir(parents=True,exist_ok=True)
# A continuous sculpted solid: barrel ribcage, scapulae, haunches, elbows,
# sloping hocks, broad plantar pads and four individually carved toes per paw.
lo=np.array([-4.5,-.7,-8.0]);hi=np.array([4.5,12.2,8.5]);step=.075
axes=[np.arange(a,b+step,step,dtype=np.float32) for a,b in zip(lo,hi)]
x,y,z=np.meshgrid(*axes,indexing='ij');field=np.full(x.shape,50,dtype=np.float32)
def ellipsoid(c,r):
 q0=(x-c[0])/r[0];q1=(y-c[1])/r[1];q2=(z-c[2])/r[2]
 k0=np.sqrt(q0*q0+q1*q1+q2*q2);k1=np.sqrt((q0/r[0])**2+(q1/r[1])**2+(q2/r[2])**2)
 return k0*(k0-1)/np.maximum(k1,.0001)
def union(d,k=.32):
 global field
 h=np.clip(.5+.5*(d-field)/k,0,1);field=d*(1-h)+field*h-k*h*(1-h)
def chain(a,b,ra,rb,k=.18):
 # Overlapping sculpt volumes preserve the animal's changing joint envelope.
 for t in np.linspace(0,1,9):union(ellipsoid(np.array(a)*(1-t)+np.array(b)*t,np.array(ra)*(1-t)+np.array(rb)*t),k)
# A level thoracic spine, tapered abdomen and distinct feline scapulae.
# Proportions read from Desert Lion Trust Xpl-68's standing side profile.
union(ellipsoid([0,5.4,-.7],[1.62,1.50,4.2]),.65)
union(ellipsoid([0,5.70,2.40],[1.8,1.85,2.15]),.75)
union(ellipsoid([0,5.55,-3.50],[1.5,1.6,1.6]),.65)
union(ellipsoid([0,6.60,4.00],[1.04,1.47,1.65]),.8)
# Narrower loin and a lifted abdominal tuck behind the deep rib cage.
union(ellipsoid([0,4.55,.40],[1.40,1.05,2.45]),.60)
for side in [-1,1]:
 # Scapular ridge flows into triceps; the elbow is behind the chest.
 union(ellipsoid([side*1.35,5.80,2.30],[.66,1.77,1.14]),.42)
 chain([side*1.43,5.30,2.75],[side*1.46,3.05,2.55],[.70,1.0,.72],[.39,.48,.43],.35)
 # The straight radius/ulna narrows towards the carpus, then broadens at the pad.
 chain([side*1.46,3.05,2.55],[side*1.46,.65,3.10],[.40,.46,.44],[.34,.32,.40],.22)
 # A powerful thigh with a forward knee, backwards hock and short metatarsal.
 union(ellipsoid([side*1.18,4.87,-3.60],[.79,1.58,1.18]),.50)
 chain([side*1.30,4.55,-3.5],[side*1.39,2.8,-2.62],[.73,1.08,.81],[.38,.53,.48],.37)
 chain([side*1.39,2.8,-2.62],[side*1.40,1.10,-4.00],[.39,.50,.47],[.235,.35,.30],.25)
 chain([side*1.40,1.10,-4.00],[side*1.40,.36,-3.85],[.235,.35,.30],[.32,.28,.41],.19)
 for pz in [3.48,-3.51]:
  px=side*(1.46 if pz>0 else 1.40)
  union(ellipsoid([px,.30,pz],[.62,.35,.73]),.22)
  for i in range(4):union(ellipsoid([px+(i-1.5)*.28,.22,pz+.53-(.07*abs(i-1.5))],[.175,.245,.38]),.07)
# Chest sternum and nuchal line blend into the same solid instead of hanging orbs.
union(ellipsoid([0,4.8,3.10],[.95,1.65,1.06]),.7)
# Faint scapular/loin depressions introduce anatomical planes, not mineral cracks.
field += .025*np.exp(-((np.abs(x)-1.5)/.30)**2-((y-5.9)/1.5)**2-((z-1.4)/.32)**2)
# Short coat follows continuous muscles; no mineral erosion on a living apparition.
field+=.009*np.sin(x*7+y*3)*np.sin(z*5-y*2)
v,f,_,_=marching_cubes(field,level=0,spacing=(step,step,step),allow_degenerate=False)
v+=lo
body=trimesh.Trimesh(v,f,process=True);body.fix_normals();body=body.slice_plane([0,-.02,0],[0,1,0],cap=True,engine='earcut');body.fix_normals()
body.export(OUT/'lion-body.stl')
# Load only the existing, reviewed subdivision helpers, never the asset-generating main program.
tree=ast.parse(Path('scripts/prepare-anatomy.py').read_text());ns={'np':np}
functions=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in ['compact','catmull_clark']]
exec(compile(ast.Module(body=functions,type_ignores=[]),'subdivision-helpers','exec'),ns)
b=np.load('../../work/anatomy-source/body.npz');v=b['vertices'].copy();q=b['quads']
# The adult male shape targets are already in this saved body source.
mask=(v[q][...,1]>7.0).all(axis=1);v,q=ns['compact'](v,q[mask])
for _ in range(2):v,q=ns['catmull_clark'](v,q)
f=np.vstack([q[:,[0,1,2]],q[:,[0,2,3]]]);head=trimesh.Trimesh(v,f,process=True)
head=head.slice_plane([0,7.6,0],[0,1,0],cap=True,engine='earcut');head.fix_normals()
parts=head.split(only_watertight=False);head=max(parts,key=lambda c:len(c.faces))
bounds=head.bounds;head.apply_translation([-float(bounds.mean(0)[0]),-float(bounds[0,1]),-float(bounds.mean(0)[2])]);head.apply_scale(5.4/float(head.extents[1]))
head.export(OUT/'human-head.stl')
records=[]
for name,mesh in [('lion-body',body),('human-head',head)]:
 records.append({'asset':name,'triangles':len(mesh.faces),'vertices':len(mesh.vertices),'watertight':bool(mesh.is_watertight),'bounds':mesh.bounds.tolist(),'bytes':(OUT/(name+'.stl')).stat().st_size,'sha256':hashlib.sha256((OUT/(name+'.stl')).read_bytes()).hexdigest()})
Path('docs/filmic-worlds/beast-assets.json').write_text(json.dumps(records,indent=2)+'\n');print(json.dumps(records,indent=2))
