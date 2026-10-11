"""Preserve the authored MakeHuman skin UVs on the existing smooth portrait.
CC0 source mesh + bundled CC0 middleage_african_male material and diffuse map.
No MakeHuman application/plugin code or external executable is used.
"""
from pathlib import Path
import ast,json,hashlib
import numpy as np
import trimesh
from PIL import Image
SOURCE=Path('../../work/anatomy-source');REVIEW=Path('../../work/realism-assets');OUT=Path('public/world/vision')
b=np.load(SOURCE/'body.npz');original=b['vertices'].copy();q=b['quads'];uv=[];faces=[];uvfaces=[]
for line in (SOURCE/'base.obj').read_text().splitlines():
 if line.startswith('vt '):uv.append([float(x) for x in line.split()[1:3]])
 if line.startswith('f '):
  pairs=[x.split('/') for x in line.split()[1:]];v=[int(x[0])-1 for x in pairs];t=[int(x[1])-1 for x in pairs]
  for i in range(1,len(v)-1):faces.append([v[0],v[i],v[i+1]]);uvfaces.append([t[0],t[i],t[i+1]])
faces=np.array(faces);uvfaces=np.array(uvfaces);uv=np.array(uv)
mask=(original[faces][...,1]>7.0).all(axis=1);faces=faces[mask];uvfaces=uvfaces[mask]
# Reproduce only the saved portrait transform, using the reviewed subdivision helpers.
tree=ast.parse(Path('scripts/prepare-anatomy.py').read_text());ns={'np':np}
functions=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in ['compact','catmull_clark']]
exec(compile(ast.Module(body=functions,type_ignores=[]),'subdivision-helpers','exec'),ns)
v,hq=ns['compact'](original.copy(),q[(original[q][...,1]>7.0).all(axis=1)])
for _ in range(2):v,hq=ns['catmull_clark'](v,hq)
hf=np.vstack([hq[:,[0,1,2]],hq[:,[0,2,3]]]);smooth=trimesh.Trimesh(v,hf,process=True).slice_plane([0,7.6,0],[0,1,0],cap=True,engine='earcut')
smooth=max(smooth.split(only_watertight=False),key=lambda c:len(c.faces));bounds=smooth.bounds;shift=np.array([-float(bounds.mean(0)[0]),-float(bounds[0,1]),-float(bounds.mean(0)[2])]);scale=5.4/float(smooth.extents[1])
base=trimesh.Trimesh((original+shift)*scale,faces,process=False)
head=trimesh.load(OUT/'human-head.stl',process=True);head.fix_normals()
nearest,distance,triangle=trimesh.proximity.closest_point(base,head.vertices)
weights=trimesh.triangles.points_to_barycentric(base.triangles[triangle],nearest)
headUV=np.sum(uv[uvfaces[triangle]]*weights[...,None],axis=1)
head.visual=trimesh.visual.TextureVisuals(uv=headUV,image=Image.open(REVIEW/'human-skin.png').convert('RGB'))
head.metadata={'name':'CC0 authored human portrait with preserved skin UVs'}
asset=OUT/'human-portrait.glb';head.export(asset)
record={'file':str(asset),'bytes':asset.stat().st_size,'sha256':hashlib.sha256(asset.read_bytes()).hexdigest(),'triangles':len(head.faces),'skinSource':'MakeHuman bundled middleage_african_male diffuse','sourceCommit':'8cf9645b975a98eea056b140df11a1d278da0d10','sourceMirror':'https://github.com/s20220526/makehuman-assets','license':'CC0 1.0 Universal','mapping':'Closest authored triangle UV transfer after the existing two-level subdivision and closed head crop','projectionDistanceMax':float(distance.max()),'projectionDistanceMedian':float(np.median(distance)),'portraitShift':shift.tolist(),'portraitScale':float(scale),'eyeCenters':[((original[np.arange(a,a+8)].mean(0)+shift)*scale).tolist() for a in [13606,13614]]}
Path('docs/filmic-worlds/portrait-asset.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record,indent=2))
