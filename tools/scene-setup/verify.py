"""Independent setup-only numeric gate. No runtime application FK/IK imports."""
import argparse, hashlib, json, math, struct
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
def read_glb(path):
    raw=path.read_bytes(); size=struct.unpack_from('<I',raw,12)[0]; obj=json.loads(raw[20:20+size]); start=28+size
    def acc(i):
        a=obj['accessors'][i]; v=obj['bufferViews'][a['bufferView']]; dim={'VEC3':3,'SCALAR':1}[a['type']]
        return np.frombuffer(raw,dtype={5126:'<f4',5125:'<u4',5123:'<u2'}[a['componentType']],count=a['count']*dim,offset=start+v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,dim).astype(float if dim==3 else int)
    ps=[]; ns=[]; fs=[]
    for m in obj['meshes']:
        for p in m['primitives']:
            pos=acc(p['attributes']['POSITION']); fs.extend(acc(p['indices']).reshape(-1,3)+sum(len(a) for a in ps)); ps.append(pos); ns.append(acc(p['attributes']['NORMAL']))
    return np.concatenate(ps),np.asarray(fs),np.concatenate(ns)
def rot(axis,q):
    x,y,z=axis; K=np.array([[0,-z,y],[z,0,-x],[-y,x,0.]])
    return np.eye(3)+math.sin(q)*K+(1-math.cos(q))*(K@K)
def fk(q):
    # independently specified measured/source chain, checked against authoritative manifest
    origins=[[0,0,.52],[.16,0,0],[.78,0,0],[.655,0,.15],[0,0,0],[.153,0,0]]
    axes=[[0,0,-1],[0,1,0],[0,1,0],[-1,0,0],[0,1,0],[-1,0,0]]
    out=[np.eye(4)]; T=np.eye(4)
    for o,a,v in zip(origins,axes,q):
        J=np.eye(4); J[:3,:3]=rot(a,v); J[:3,3]=o; T=T@J; out.append(T.copy())
    E=np.eye(4); E[:3,:3]=rot([0,1,0],math.pi/2); E[:3,3]=[.08,0,0]
    return out,T@E
LOW=np.radians([-185,-185,-138,-350,-130,-350]); HIGH=np.radians([185,65,175,350,130,350])
def error(q,p,R):
    _,T=fk(q)
    # nine matrix residuals avoid importing SO(3) runtime logic; finite differences in setup only
    return np.concatenate((T[:3,3]-p,.25*(T[:3,:3]-R).ravel()))
def solve(p,R,seed):
    for base in [seed,np.radians([0,-45,100,0,-45,0]),np.radians([0,-70,120,0,-60,0])]:
        q=np.array(base,dtype=float)
        for _ in range(250):
            e=error(q,p,R)
            if np.linalg.norm(e)<1e-9: return q
            J=np.column_stack([(error(q+np.eye(6)[i]*1e-6,p,R)-e)/1e-6 for i in range(6)])
            step=np.linalg.solve(J.T@J+1e-5*np.eye(6),-J.T@e)
            q=np.clip(q+np.clip(step,-.15,.15),LOW,HIGH)
        if np.linalg.norm(error(q,p,R))<.001: return q
    raise RuntimeError('Independent bounded setup pose not solved')
def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--output',default='assets/demo/manifest.json'); args=parser.parse_args()
    door=json.loads((ROOT/'assets/door/manifest.json').read_text()); robot=json.loads((ROOT/'assets/robot/robot-definition.json').read_text())
    for src in [door['source'],robot['source']]:
        b=(ROOT/src['path']).read_bytes(); assert len(b)==src['bytes'] and hashlib.sha256(b).hexdigest()==src['sha256'],'Source identity mismatch'
    for j,o,a in zip(robot['joints'],[[0,0,.52],[.16,0,0],[.78,0,0],[.655,0,.15],[0,0,0],[.153,0,0]],[[0,0,-1],[0,1,0],[0,1,0],[-1,0,0],[0,1,0],[-1,0,0]]):
        assert j['origin']==o and j['axis']==a
    for spec,path in [(door['cache'],ROOT/door['cache']['path'])]+[(l,ROOT/'assets/robot'/l['mesh']) for l in robot['links']]:
        raw=path.read_bytes(); assert len(raw)==spec['bytes'] and hashlib.sha256(raw).hexdigest()==spec['sha256'], 'Prepared cache identity mismatch: '+str(path)
    for i,j in enumerate(robot['joints']):
        assert j['parent']==('base_link' if i==0 else f'link_{i}') and j['child']==f'link_{i+1}' and j['originRotation']==[0,0,0], 'Source hierarchy/frame changed'
    assert robot['flangeLink']=='link_6' and np.allclose(np.array(robot['linkToFlange']).reshape(4,4,order='F'),np.eye(4))
    assert robot['scanner']=={'dimensions':[.08,.06,.08],'tool0ToCenter':[0,0,.04],'tool0ToEmitter':[0,0,.08],'opticalAxis':[0,0,1]}
    assert np.allclose([j['demoSpeed'] for j in robot['joints']],np.radians([20,17.5,19,43,43,63]))
    assert np.allclose([j['lower'] for j in robot['joints']],LOW) and np.allclose([j['upper'] for j in robot['joints']],HIGH), 'Authoritative intervals changed'
    assert np.allclose(robot['home'],np.radians([0,-90,90,0,0,0])), 'Source home changed'
    independentMount=np.eye(4); independentMount[:3,:3]=rot([0,1,0],math.pi/2); independentMount[:3,3]=[.08,0,0]
    toolMount=independentMount.copy();toolMount[:3,3]=0
    assert np.allclose(toolMount,np.array(robot['flangeToTool0']).reshape(4,4,order='F'))
    assert np.allclose(independentMount,np.array(robot['flangeToEmitter']).reshape(4,4,order='F')), 'Scanner mounting changed'
    assert np.allclose(fk(robot['home'])[1][:3,3],[1.048,0,1.45]), 'Measured home emitter mismatch'
    vertices,faces,normals=read_glb(ROOT/'assets/door/door.glb')
    R=np.array([[0,-1,0],[1,0,0],[0,0,1.]])
    # CAD-native surface minZ; Float32 cache differs by ~0.000013mm, retain exact CAD floor reference
    minz=.367240297; centerx=(vertices[:,0].min()+vertices[:,0].max())/2
    translation=np.array([1.4+vertices[:,1].max(),-centerx,-minz])
    transform=np.eye(4); transform[:3,:3]=R; transform[:3,3]=translation
    base=vertices@R.T+translation; triangles=base[faces]; bn=normals@R.T
    home=solve(np.array([.9,0,.8]),np.array([[0,0,1],[1,0,0],[0,1,0.]]),robot['home'])
    route=[]; seed=home
    # Rays from approach side +X, selected nearest actual triangles, never analytic substitute plane
    for i,(y,z) in enumerate([(.30,.55),(.30,.40),(.30,.30),(-.30,.30),(-.30,.55)]):
        ray=np.array([0,y,z]); d=np.array([1.,0,0]); a=triangles[:,0]; e1=triangles[:,1]-a; e2=triangles[:,2]-a
        h=np.cross(np.broadcast_to(d,e2.shape),e2); det=np.einsum('ij,ij->i',e1,h); inv=np.divide(1,det,out=np.zeros_like(det),where=np.abs(det)>1e-12)
        s=ray-a; u=inv*np.einsum('ij,ij->i',s,h); cross=np.cross(s,e1); v=inv*(cross@d); t=inv*np.einsum('ij,ij->i',e2,cross)
        eligible=(np.abs(det)>1e-12)&(u>=0)&(v>=0)&(u+v<=1)&(t>0)
        index=int(np.argmin(np.where(eligible,t,np.inf))); assert eligible[index], 'No actual triangle at representative ray '+str((y,z))
        p=ray+t[index]*d; n=bn[faces[index]].T@np.array([1-u[index]-v[index],u[index],v[index]]); n/=np.linalg.norm(n)
        if n@d>0:n=-n
        optical=-n; up=np.array([0.,0,1]) if abs(n[2])<.99 else np.array([0.,1,0]); by=up-optical*(up@optical); by/=np.linalg.norm(by); bx=np.cross(by,optical); targetR=np.column_stack([bx,by,optical]); target=p+.1*n
        q=solve(target,targetR,seed); seed=q; _,E=fk(q)
        poserr=float(np.linalg.norm(E[:3,3]-target)*1000); angle=math.degrees(math.acos(np.clip((np.trace(targetR.T@E[:3,:3])-1)/2,-1,1)))
        assert np.isfinite(q).all() and math.isfinite(poserr) and math.isfinite(angle) and poserr<=5 and angle<=5 and np.all(q>=LOW) and np.all(q<=HIGH), 'Independent pose gate failed'
        route.append({'id':i+1,'triangleIndex':index,'barycentric':[float(1-u[index]-v[index]),float(u[index]),float(v[index])],'partLocalPosition':((p-translation)@R).tolist(),'surfacePosition':p.tolist(),'approachNormal':n.tolist(),'standOffMm':100,'emitterTarget':target.tolist(),'emitterOrientation':targetR.ravel(order='F').tolist(),'jointAngles':q.tolist(),'positionErrorMm':poserr,'orientationErrorDeg':angle,'withinJointIntervals':bool(np.all(q>=LOW)&np.all(q<=HIGH))})
    homeLinks,homeE=fk(home)
    homeFlange=homeLinks[-1]
    assert np.all(home>=LOW) and np.all(home<=HIGH) and np.isfinite(home).all()
    assert np.linalg.norm(homeE[:3,3]-[.9,0,.8])<=.005
    assert np.allclose(homeE[:3,:3],np.array([[0,0,1],[1,0,0],[0,1,0.]]),atol=.001)
    data={'schemaVersion':1,'frame':'robot-base','units':{'length':'meter','angle':'radian','matrix':'column-major'},'doorManifest':'assets/door/manifest.json','robotDefinition':'assets/robot/robot-definition.json','partToBase':transform.ravel(order='F').tolist(),'homeAngles':home.tolist(),'sourceCadHomeAngles':robot['home'],'homeReason':'Source CAD home to route swept scanner through upper frame at initial spacing. Retracted camera-visible emitter home (900,0,800)mm with world-up roll independently solved and sampled clear.','homeEmitterPosition':homeE[:3,3].tolist(),'homeEmitterPose':homeE.ravel(order='F').tolist(),'homeFlangePose':homeFlange.ravel(order='F').tolist(),'homeFlangePosition':homeFlange[:3,3].tolist(),'scanner':robot['scanner'],'defaultStandOffMm':100,'rollConvention':'tool +Y is world +Z projected perpendicular to optical +Z; +X = +Y cross +Z; use world +Y when optical axis is within 0.99 dot of world +Z','baseBounds':{'min':base.min(axis=0).tolist(),'max':base.max(axis=0).tolist()},'representativeRoute':route,'clearanceEvidence':'assets/demo/clearance.json','setupPosePreview':'assets/demo/setup-poses.png','verificationEvidence':'docs/verification/issue-03-geometry.md'}
    Path(args.output).parent.mkdir(parents=True,exist_ok=True); Path(args.output).write_text(json.dumps(data,indent=2)+'\n')
    print(json.dumps({'routePositionErrorMm':max(p['positionErrorMm'] for p in route),'routeOrientationErrorDeg':max(p['orientationErrorDeg'] for p in route),'bounds':data['baseBounds']}))
if __name__=='__main__':main()
