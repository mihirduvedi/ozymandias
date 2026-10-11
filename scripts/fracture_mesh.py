"""Conforming fracture-surface refinement. Shared edges remain closed solids."""
import numpy as np
import trimesh

def refine_edges(mesh, select, passes=6):
 for _ in range(passes):
  v=mesh.vertices;edges=mesh.edges_unique;mid=v[edges].mean(1)
  selected=select(v,edges,mid)
  ids=np.where(selected)[0]
  if not len(ids):break
  lookup={tuple(edges[i]):len(v)+j for j,i in enumerate(ids)}
  faces=[]
  for tri in mesh.faces:
   t=list(map(int,tri));a,b,c=t
   mids=[lookup.get(tuple(sorted(e)),-1) for e in [(a,b),(b,c),(c,a)]]
   count=sum(i>=0 for i in mids)
   if count==0:faces.append(t);continue
   if count==3:
    ab,bc,ca=mids;faces.extend([[a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]]);continue
   rotate=next(i for i in range(3) if mids[i]>=0) if count==1 else next(i for i in range(3) if mids[i]>=0 and mids[(i+1)%3]>=0)
   a,b,c=[t[(i+rotate)%3] for i in range(3)];ab,bc,ca=[mids[(i+rotate)%3] for i in range(3)]
   if count==1:faces.extend([[a,ab,c],[ab,b,c]])
   else:faces.extend([[ab,b,bc],[a,ab,c],[ab,bc,c]])
  mesh=trimesh.Trimesh(np.vstack([v,mid[ids]]),faces,process=False)
 return mesh

def broken_plane(mesh,origin,normal,seed,amplitude=.28,resolution=.15):
 """Roughen a former cut, including its shared rim and adjoining side walls."""
 origin=np.array(origin,dtype=float);normal=np.array(normal,dtype=float);normal/=np.linalg.norm(normal)
 def selection(v,edges,mid):
  return (np.abs((mid-origin)@normal)<.36)&(np.linalg.norm(v[edges[:,0]]-v[edges[:,1]],axis=1)>resolution)
 mesh=refine_edges(mesh,selection,passes=7)
 tangent=np.array([1.,0,0]) if abs(normal[0])<.8 else np.array([0.,0,1])
 tangent-=normal*np.dot(tangent,normal);tangent/=np.linalg.norm(tangent);bitangent=np.cross(normal,tangent)
 v=mesh.vertices.copy();delta=v-origin;u=delta@tangent;w=delta@bitangent;distance=np.abs(delta@normal)
 window=np.clip(1-distance/.55,0,1);window=window*window*(3-2*window)
 # Uneven tensile cleavage: coherent shelves, small splinters and missing corner chunks.
 field=.65*np.sin(u*1.6+seed)*np.cos(w*1.3-seed*.3)+.22*np.sin(u*4.5+w*3.1+seed)+.08*np.cos(w*9.0-u*5.2)
 field-=.48*np.exp(-((u-.3*np.sin(seed))**2+(w+.4)**2)/.16)
 mesh.vertices=v+normal*(window*field*amplitude)[:,None]
 mesh.fix_normals()
 assert mesh.is_watertight and mesh.is_winding_consistent
 return mesh
