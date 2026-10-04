import re, math, collections, hashlib
from pathlib import Path
f=str(Path(__file__).resolve().parents[2] / '3d files/Robot/KR22_R1610-KR16_R1610.stp')
s=open(f).read()
print('SHA256',hashlib.sha256(open(f,'rb').read()).hexdigest())
ents={int(i):v.replace('\n','').replace('\r','') for i,v in re.findall(r'#(\d+)\s*=\s*(.*?);',s,re.S)}
def refs(v): return list(map(int,re.findall(r'#(\d+)',v)))
def vector(i):
    return tuple(map(float,re.search(r'\(([^()]*)\)\)$',ents[i]).group(1).split(',')))
def cyl(i):
    v=ents[i]; a=refs(v)[0]; rr=refs(ents[a]); p=vector(rr[0]); d=vector(rr[1]); r=float(v.rsplit(',',1)[1].rstrip(')'))
    # Canonical direction sign, then foot of perpendicular from origin.
    if next((x for x in d if abs(x)>1e-7),1)<0: d=tuple(-x for x in d)
    t=sum(x*y for x,y in zip(p,d)); foot=tuple(x-t*y for x,y in zip(p,d))
    return p,d,r,foot
groups=collections.defaultdict(list)
for i,v in ents.items():
    if v.startswith('CYLINDRICAL_SURFACE'):
        p,d,r,foot=cyl(i)
        if r>=25:
            key=tuple(round(x,3) for x in d+foot)
            groups[key].append((i,r,p))
print('LARGE CYLINDER AXIS CLUSTERS')
for k,items in sorted(groups.items(),key=lambda kv:(-len(kv[1]),-max(x[1] for x in kv[1]))):
    if len(items)>2 or max(x[1] for x in items)>=65:
        print('axis',k[:3],'foot',k[3:],'n',len(items),'radii',sorted(set(round(x[1],3) for x in items)), 'locs', [(i,r,tuple(round(z,3) for z in p)) for i,r,p in items[:12]])
# Do not use supporting-surface/control-point extrema as physical model bounds.
print('PLANES AT WRIST, NORMAL X')
for i,v in ents.items():
    if v.startswith('PLANE'):
        a=refs(v)[0]; rr=refs(ents[a])
        if len(rr)<2: continue
        p=vector(rr[0]); d=vector(rr[1])
        if abs(d[0])>0.9999 and 940<=p[0]<=990 and abs(p[1])<100 and abs(p[2]-1450)<100:
            print(i,p,d)
print('CYLINDERS NEAR WRIST TIP')
for i,v in ents.items():
    if v.startswith('CYLINDRICAL_SURFACE'):
        p,d,r,foot=cyl(i)
        if abs(d[0])>.9999 and 940<=p[0]<=990 and abs(p[1])<65 and abs(p[2]-1450)<65:
            print(i,p,d,r)
print('MATCH EVIDENCE RAW ENTITIES')
for i in [11813,11735,10756,11262,10704,16600,11252,11253,11254,11255,11256,11257,11258,11259,11260]:
    print('#'+str(i)+'='+ents[i])
    for a in refs(ents[i]):
        print('#'+str(a)+'='+ents[a])
        for b in refs(ents[a]):
            print('#'+str(b)+'='+ents[b])
def mmul(a,b): return [[sum(a[i][k]*b[k][j] for k in range(3)) for j in range(3)] for i in range(3)]
def mv(a,v): return [sum(a[i][j]*v[j] for j in range(3)) for i in range(3)]
def rot(axis,q):
    x,y,z=axis; c=math.cos(q); sn=math.sin(q); t=1-c
    return [[t*x*x+c,t*x*y-sn*z,t*x*z+sn*y],[t*x*y+sn*z,t*y*y+c,t*y*z-sn*x],[t*x*z-sn*y,t*y*z+sn*x,t*z*z+c]]
offsets=[(0,0,520),(160,0,0),(780,0,0),(655,0,150),(0,0,0),(153,0,0)]
axes=[(0,0,-1),(0,1,0),(0,1,0),(-1,0,0),(0,1,0),(-1,0,0)]
qs=[0,-90,90,0,0,0]
p=[0,0,0]; R=[[1,0,0],[0,1,0],[0,0,1]]
print('FK CANDIDATE POSE',qs)
measured=[None,(160,0,520),(160.000000000001,0,1300),None,(815.000003067001,0,1450),(968.000003067001,0,1450)]
for j,(off,axis,q) in enumerate(zip(offsets,axes,qs)):
    p=[x+y for x,y in zip(p,mv(R,off))]
    world_axis=mv(R,axis)
    residual=None if measured[j] is None else math.sqrt(sum((x-y)**2 for x,y in zip(p,measured[j])))
    print('joint',j+1,'origin_mm',p,'world_axis',world_axis,'center_residual_mm',residual)
    R=mmul(R,rot(axis,math.radians(q)))
