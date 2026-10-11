"""Pose the existing reviewed MakeHuman CC0 source; never rewrite Ozymandias.
Export a detailed, clothed-color anatomical mesh with flat boot soles.
"""
from pathlib import Path
import ast, json, hashlib
import numpy as np
import trimesh

tree=ast.parse(Path('scripts/prepare-anatomy.py').read_text())
ns={'np':np}
helpers=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in ['compact','catmull_clark']]
exec(compile(ast.Module(body=helpers,type_ignores=[]),'reviewed-subdivision','exec'),ns)
source=np.load('../../work/anatomy-source/body.npz')
v,q=source['vertices'].copy(),source['quads'].copy()
v,q=ns['compact'](v,q)
for _ in range(2):v,q=ns['catmull_clark'](v,q)
original=v.copy()
# Blend at the deltoid, keeping the shoulder attached. Left arm hangs; the
# right elbow/forearm supports an empty glove, turned towards the lost falcon.
for side,angle in [(-1,-.40),(1,1.35)]:
    pivot=np.array([side*1.7,6.3,.05]);a=side*angle
    rotation=np.array([[np.cos(a),-np.sin(a),0],[np.sin(a),np.cos(a),0],[0,0,1]])
    weight=np.clip((side*original[:,0]-1.5)/1.1,0,1)
    weight*=np.clip((original[:,1]+.2)/2.0,0,1)
    target=(original-pivot)@rotation.T+pivot
    v=v*(1-weight[:,None])+target*weight[:,None]
ground=float(v[:,1].min());scale=1.88/(10.0486-ground)
v[:,1]-=ground;v*=scale
v[:,1]=np.maximum(v[:,1],.0)
color=np.tile([57,62,57,255],(len(v),1)).astype(np.uint8)
skin=(original[:,1]>7.55)|(np.abs(original[:,0])>4.9)
color[skin]=[148,121,103,255]
color[original[:,0]>4.9]=[64,47,30,255]
color[original[:,1]<-6.5]=[38,32,27,255]
color[(original[:,1]>5.8)&(~skin)]=[71,69,59,255]
faces=np.vstack([q[:,[0,1,2]],q[:,[0,2,3]]])
mesh=trimesh.Trimesh(v,faces,process=False);mesh.fix_normals();mesh.visual.vertex_colors=color
out=Path('public/world/vision/falconer.glb');mesh.export(out)
record={'asset':'falconer.glb','source':'Existing MakeHuman Community CC0 adult anatomy','modifications':'Two Catmull-Clark subdivisions; blended arm posing, clothing/skin/boot vertex colors, 1.88m standing height, flat ground contact','triangles':len(mesh.faces),'bounds':mesh.bounds.tolist(),'glove_center':v[original[:,0]>5.4].mean(axis=0).tolist(),'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
Path('docs/filmic-worlds/falconer-asset.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record,indent=2))
