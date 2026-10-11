"""Preserve the Egyptian portrait and seal every cropped surface correctly.
Requires numpy, trimesh, scipy, shapely, mapbox-earcut, networkx and rtree.
Run from the project root; the source scan stays untouched in ../../work.
"""
from pathlib import Path
import hashlib,json
import numpy as np
import trimesh
from fracture_mesh import broken_plane
source=Path('../../work/ramesses-scan/original.stl')
assert hashlib.sha256(source.read_bytes()).hexdigest()=='5b90fd731fe8bddf47700361e25b72be513d30d93c56aef5fbbe56606c2d6baa'
mesh=trimesh.load(source,force='mesh')
planes=[(1,7.0,1),(1,14.0,-1),(2,-11.7,1),(0,-24,1),(0,-10,-1)]
for axis,value,sign in planes:
 normal=[0.,0.,0.];normal[axis]=sign
 origin=[0.,0.,0.];origin[axis]=value
 mesh=mesh.slice_plane(origin,normal,cap=True,engine='earcut')
mesh.fix_normals(multibody=True)
assert mesh.is_watertight and mesh.is_winding_consistent
for axis,value,sign in planes[:3]:
 normal=[0.,0.,0.];normal[axis]=sign
 origin=[0.,0.,0.];origin[axis]=value
 mesh=broken_plane(mesh,origin,normal,51+axis+sign,amplitude=.42 if axis==1 else .24,resolution=.26)
bounds=mesh.bounds.copy();mesh.apply_translation(-mesh.bounding_box.centroid)
destination=Path('public/world/ramesses/head.stl');destination.write_bytes(mesh.export(file_type='stl'))
counts=np.bincount(mesh.edges_unique_inverse)
record=json.loads(Path('public/world/ramesses/provenance.json').read_text())
record['modifications']='Removed tall crown and rear slab. Sequential plane clipping with concave Earcut caps, conforming edge refinement and irregular relief on the forehead, neck and rear break surfaces; welded boundaries and repaired outward winding. Runtime deformation lowers mouth corners and inner brows, compresses the lower lip, adds lip wrinkles, a glabellar furrow, nasolabial creases and an asymmetric sneer. Dark object-local branching cracks cross broken outer surfaces. Runtime scaling, burial and cool mineral stone are literary interpretation, not historical reconstruction. The scan remains closed.'
record.update(derivedSha256=hashlib.sha256(destination.read_bytes()).hexdigest(),bytes=destination.stat().st_size,triangles=len(mesh.faces),watertight=bool(mesh.is_watertight),windingConsistent=bool(mesh.is_winding_consistent),boundaryEdges=int(np.sum(counts==1)),nonManifoldEdges=int(np.sum(counts>2)),originalCropBounds={'min':bounds[0].tolist(),'max':bounds[1].tolist()})
Path('public/world/ramesses/provenance.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps(record,indent=2))
