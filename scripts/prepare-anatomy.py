"""Derive closed, weathered statue anatomy from MakeHuman's CC0 authored base.
Only asset data is used; no MakeHuman program code is imported or executed.
Requires the scoped mesh-repair Python environment. Run from the project root.
"""
from pathlib import Path
import json,hashlib
import numpy as np
import trimesh
from fracture_mesh import broken_plane
SOURCE=Path('../../work/anatomy-source');OUT=Path('public/world/anatomy');OUT.mkdir(parents=True,exist_ok=True)
vertices=[];groups={};group=''
for line in (SOURCE/'base.obj').read_text().splitlines():
 if line.startswith('v '):vertices.append([float(x) for x in line.split()[1:4]])
 elif line.startswith('g '):group=line[2:];groups.setdefault(group,[])
 elif line.startswith('f '):groups[group].append([int(x.split('/')[0])-1 for x in line.split()[1:]])
vertices=np.array(vertices)
TARGETS=['african-male-young.target','universal-male-young-maxmuscle-averageweight.target']
for target in TARGETS:
 for line in (SOURCE/target).read_text().splitlines():
  if line and not line.startswith('#'):
   data=line.split();vertices[int(data[0])]+=np.array([float(x) for x in data[1:]])
quads=np.array(groups['body'])
def compact(v,q):
 ids,inverse=np.unique(q,return_inverse=True);return v[ids].copy(),inverse.reshape(q.shape)
def catmull_clark(v,q):
 """Limit-surface subdivision retains modeled joints and individual digit topology."""
 nv,nf=len(v),len(q);face=v[q].mean(1)
 raw=np.stack([q,np.roll(q,-1,axis=1)],axis=-1).reshape(-1,2)
 edges,inv=np.unique(np.sort(raw,axis=1),axis=0,return_inverse=True);ne=len(edges)
 edge_count=np.bincount(inv,minlength=ne);edge_sum=np.zeros((ne,3));np.add.at(edge_sum,inv,np.repeat(face,4,axis=0))
 midpoint=v[edges].mean(1);ep=(v[edges].sum(1)+edge_sum)/(2+edge_count[:,None]);ep[edge_count==1]=midpoint[edge_count==1]
 face_sum=np.zeros_like(v);face_count=np.bincount(q.ravel(),minlength=nv);np.add.at(face_sum,q.ravel(),np.repeat(face,4,axis=0))
 mid_sum=np.zeros_like(v);ec=np.bincount(edges.ravel(),minlength=nv);np.add.at(mid_sum,edges.ravel(),np.repeat(midpoint,2,axis=0))
 vp=(face_sum/face_count[:,None]+2*mid_sum/ec[:,None]+(face_count[:,None]-3)*v)/face_count[:,None]
 boundary=edges[edge_count==1];bs=np.zeros_like(v);bc=np.bincount(boundary.ravel(),minlength=nv)
 np.add.at(bs,boundary[:,0],v[boundary[:,1]]);np.add.at(bs,boundary[:,1],v[boundary[:,0]])
 mask=bc>0;vp[mask]=.75*v[mask]+.25*bs[mask]/bc[mask,None]
 eq=inv.reshape(nf,4)+nv;fp=np.arange(nf)+nv+ne
 nq=np.stack([q,eq,np.broadcast_to(fp[:,None],q.shape),np.roll(eq,1,axis=1)],axis=-1).reshape(-1,4)
 return np.vstack([vp,ep,face]),nq

def crack_refinement(mesh,seed):
 """Conforming edge splits only near fine fissures; preserve a watertight solid."""
 for _ in range(2):
  v=mesh.vertices;edges=mesh.edges_unique;mid=v[edges].mean(1);y=mid[:,1]
  near=np.zeros(len(edges),dtype=bool)
  for low,high,offset in [(1.7,4.0,.19),(5.4,6.9,-.25)]:
   path=offset+.16*np.sin(y*1.7+seed)+.05*np.sin(y*7)
   near|=(np.abs(mid[:,0]-path)<.12)&(y>low-.12)&(y<high+.12)&(mid[:,2]>.08)
  near&=np.linalg.norm(v[edges[:,0]]-v[edges[:,1]],axis=1)>.018
  ids=np.where(near)[0];new=np.full(len(edges),-1,dtype=int);new[ids]=np.arange(len(v),len(v)+len(ids))
  lookup={tuple(e):int(new[i]) for i,e in enumerate(edges) if new[i]>=0}
  faces=[]
  for tri in mesh.faces:
   a,b,c=map(int,tri);mids=[lookup.get(tuple(sorted(e)),-1) for e in [(a,b),(b,c),(c,a)]];count=sum(i>=0 for i in mids)
   if count==0:faces.append([a,b,c]);continue
   if count==3:
    ab,bc,ca=mids;faces.extend([[a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]]);continue
   rotate=mids.index(next(i for i in mids if i>=0)) if count==1 else next(i for i in range(3) if mids[i]>=0 and mids[(i+1)%3]>=0)
   t=[a,b,c];a,b,c=[t[(i+rotate)%3] for i in range(3)];ab,bc,ca=[mids[(i+rotate)%3] for i in range(3)]
   if count==1:faces.extend([[a,ab,c],[ab,b,c]])
   else:faces.extend([[ab,b,bc],[a,ab,c],[ab,bc,c]])
  mesh=trimesh.Trimesh(np.vstack([v,mid[ids]]),faces,process=False);mesh.fix_normals()
 return mesh

def weather(mesh,seed,leg=False):
 """Local mineral loss, impact pits and fine fissures on a continuous closed surface."""
 v=mesh.vertices.copy();normals=mesh.vertex_normals
 field=np.sin(v[:,0]*14+seed)*np.sin(v[:,1]*11+v[:,2]*7)+.5*np.sin(v[:,2]*23-v[:,1]*17+seed)
 loss=field*.009
 random=np.random.default_rng(seed)
 candidates=np.where((v[:,1]>1.1)&(v[:,1]<v[:,1].max()-.12))[0] if leg else np.arange(len(v))
 for index in random.choice(candidates,52 if leg else 22,replace=False):
  radius=random.uniform(.08,.29) if leg else random.uniform(.05,.16)
  depth=random.uniform(.035,.14) if leg else random.uniform(.015,.06)
  delta=(v-v[index])/radius
  loss-=depth*np.exp(-np.sum(delta*delta,axis=1)*2.5)
 if leg:
  # A few broad spalls interrupt perfect muscle detail; most carved anatomy survives.
  for index in random.choice(candidates,5,replace=False):
   loss-=.12*np.exp(-np.sum(((v-v[index])/.48)**2,axis=1)*2)
  front=np.clip((normals[:,2]-.15)/.65,0,1)
  for low,high,offset in [(1.7,4.0,.19),(5.4,6.9,-.25)]:
   path=offset+.16*np.sin(v[:,1]*1.7+seed)+.05*np.sin(v[:,1]*7)
   window=np.clip((v[:,1]-low)/.15,0,1)*np.clip((high-v[:,1])/.15,0,1)
   loss-=.024*np.exp(-((v[:,0]-path)/.009)**2)*window*front
  loss*=np.clip((v[:,1]-.65)/.4,0,1) # Keep the approved modeled toes and nails.
 mesh.vertices=v+normals*loss[:,None]
 mesh.fix_normals();return mesh
records=[]
for side,name,cut in [(1,'left-leg',.35),(-1,'right-leg',-1.1)]:
 # Work above the final fracture plane so Catmull-Clark's boundary stays outside the crop.
 mask=(vertices[quads][...,1]<3.2).all(1)
 v,q=compact(vertices,quads[mask]);
 for _ in range(2):v,q=catmull_clark(v,q)
 faces=np.vstack([q[:,[0,1,2]],q[:,[0,2,3]]]);m=trimesh.Trimesh(v,faces,process=True)
 m=m.slice_plane([side*1.1,cut,0],[.13*side,-1,.09],cap=True,engine='earcut');m=m.slice_plane([0,0,0],[side,0,0],cap=True,engine='earcut');m=max(m.split(),key=lambda c:c.volume);m.fix_normals()
 m=broken_plane(m,[side*1.1,cut,0],[.13*side,-1,.09],23+side,amplitude=.42,resolution=.09)
 # Feet stay one continuous solid with the legs; no seam between ankle and instep.
 m.apply_translation([-side*2.165825,8.1952,-.182525]);m.apply_scale(.96)
 # A king's planted stance: ankle, knee and thigh share a vertical load-bearing axis.
 v=m.vertices.copy();y=v[:,1]
 lean=np.interp(y,[.78,5.29,9.32],[0,-side*.565,-side*.986])
 v[:,0]-=lean
 shaft=np.clip((y-.85)/1.1,0,1)
 thigh=np.clip((y-5.5)/2,0,1)
 v[:,0]*=1+shaft*(.23+.13*thigh)
 v[:,2]*=1+shaft*(.10+.07*thigh)
 # Balance the outer muscle envelope over the plantar pads as well as the bone axis.
 v[:,0]-=side*np.interp(y,[.85,2.2,3.5,5.4,6.3,8.4],[0,.115,.129,-.129,-.263,-.30])
 # Plantar contact pads share one flat plane; the higher arch retains its shape.
 blend=np.clip((v[:,1]-.09)/.11,0,1);blend=blend*blend*(3-2*blend)
 v[:,1]*=blend
 m.vertices=v;m.fix_normals()
 seed=21 if side==1 else 22;m=crack_refinement(m,seed);m=weather(m,seed,leg=True)
 
 if not m.is_watertight:
  edge_counts=np.bincount(m.edges_unique_inverse);be=m.edges_unique[edge_counts==1];print(name,'boundary',len(be),m.vertices[be].min((0,1)),m.vertices[be].max((0,1)));m.export(str(SOURCE/(name+'-debug.ply')))
 assert m.is_watertight and m.is_winding_consistent,(name,m.is_watertight)
 dest=OUT/(name+'.stl');dest.write_bytes(m.export(file_type='stl'))
 records.append(dict(file='/world/anatomy/'+dest.name,triangles=len(m.faces),bounds=m.bounds.tolist(),centerMass=m.center_mass.tolist(),volume=float(m.volume),watertight=True,sha256=hashlib.sha256(dest.read_bytes()).hexdigest()))
# A fallen left hand, with thumb opposition, finger joints and modeled nails.
mask=(vertices[quads][...,0]>4.0).all(1)
v,q=compact(vertices,quads[mask]);
for _ in range(2):v,q=catmull_clark(v,q)
m=trimesh.Trimesh(v,np.vstack([q[:,[0,1,2]],q[:,[0,2,3]]]),process=True)
m=m.slice_plane([4.68,3.31,1.75],[.65,-.60,.45],cap=True,engine='earcut');m=max(m.split(),key=lambda c:c.volume);m.fix_normals()
m=broken_plane(m,[4.68,3.31,1.75],[.65,-.60,.45],31,amplitude=.16,resolution=.055)
# Construct an orthonormal anatomical frame: wrist-to-fingers forward, palm normal up.
forward=np.array([.25,-.99,1.75]);forward/=np.linalg.norm(forward);side=np.array([1.,0,0]);side-=forward*np.dot(side,forward);side/=np.linalg.norm(side);up=np.cross(forward,side)
v=m.vertices.copy()-np.array([5.05,2.70,2.05]);m.vertices=np.column_stack([v@side,v@up,v@forward]);m.apply_scale(1.42);m=weather(m,31)
assert m.is_watertight and m.is_winding_consistent
# Convex support hull + center of mass chooses a gravity-stable resting face (Z-up API).
poses,probabilities=m.compute_stable_poses(threshold=.04);pose=poses[int(np.argmax(probabilities))];m.apply_transform(pose)
z_to_y=np.eye(4);z_to_y[:3,:3]=[[1,0,0],[0,0,1],[0,-1,0]];m.apply_transform(z_to_y)
m.apply_translation(-m.bounds.mean(0));dest=OUT/'hand.stl';dest.write_bytes(m.export(file_type='stl'))
records.append(dict(file='/world/anatomy/hand.stl',triangles=len(m.faces),bounds=m.bounds.tolist(),centerMass=m.center_mass.tolist(),volume=float(m.volume),watertight=True,sha256=hashlib.sha256(dest.read_bytes()).hexdigest()))
commit=json.loads((SOURCE/'tree.json').read_text())['sha']
record=dict(source='MakeHuman Community authored human base and adult male targets',commit=commit,url=f'https://github.com/makehumancommunity/makehuman/tree/{commit}',license='CC0 1.0 Universal',licenseUrl=f'https://github.com/makehumancommunity/makehuman/blob/{commit}/LICENSE.ASSETS.md',modifications='Adult male asset targets; two Catmull-Clark subdivision levels; separate leg and hand crops; concave caps with conforming edge subdivision and coherent irregular fracture relief; vertical ankle-knee-thigh alignment; broader shaft and thigh anatomy; flat plantar bearing pads with preserved foot arches and individual toes; localized mineral pits, spalls and fine incised fissures; object-local dark fracture shading at runtime; hand resting orientation computed from convex support hull and center of mass. No MakeHuman application code is included.',sources=[dict(file=n,sha256=hashlib.sha256((SOURCE/n).read_bytes()).hexdigest()) for n in ['base.obj',*TARGETS]],assets=records)
(OUT/'provenance.json').write_text(json.dumps(record,indent=2)+'\n');(OUT/'LICENSE.CC0.txt').write_bytes((SOURCE/'LICENSE.ASSETS.md').read_bytes());print(json.dumps(records,indent=2))
