"""Independent known-chain FK and actual mesh finite contact samples for runtime solver answers."""
import hashlib,json,math,sys,time
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools/scene-setup'))
from verify import read_glb,fk,LOW,HIGH
from clearance import poly,contacts
started=time.perf_counter()
import argparse
parser=argparse.ArgumentParser();parser.add_argument("--browser");args=parser.parse_args()
output="issue-07-runtime-route-clearance.json"
runtime=json.loads((ROOT/'docs/verification/issue-07-runtime-route.json').read_text())
d=json.loads((ROOT/'assets/demo/manifest.json').read_text());r=json.loads((ROOT/'assets/robot/robot-definition.json').read_text());door=json.loads((ROOT/'assets/door/manifest.json').read_text())
for src in [door['source'],r['source']]:
    raw=(ROOT/src['path']).read_bytes();assert len(raw)==src['bytes'] and hashlib.sha256(raw).hexdigest()==src['sha256'],'Source identity mismatch'
for path,spec in [(ROOT/door['cache']['path'],door['cache'])]+[(ROOT/'assets/robot'/l['mesh'],l) for l in r['links']]:
    raw=path.read_bytes();assert len(raw)==spec['bytes'] and hashlib.sha256(raw).hexdigest()==spec['sha256'],'Mesh identity mismatch'
assert np.allclose(runtime['homeAngles'],d['homeAngles'])
v,f,_=read_glb(ROOT/'assets/door/door.glb');T=np.array(d['partToBase']).reshape(4,4,order='F');v=v@T[:3,:3].T+T[:3,3];tri=v[f];dlo=tri.min(axis=1);dhi=tri.max(axis=1);dblo=v.min(axis=0);dbhi=v.max(axis=0)
meshes=[read_glb(ROOT/'assets/robot'/l['mesh'])[:2] for l in r['links']]
sv=np.array([[x,y,z] for x in [-.04,.04] for y in [-.03,.03] for z in [0,.08]])
sf=np.array([[0,1,3],[0,3,2],[4,6,7],[4,7,5],[0,4,5],[0,5,1],[2,3,7],[2,7,6],[0,2,6],[0,6,4],[1,5,7],[1,7,3]])
browser_checks=None
if args.browser:
    browser=json.loads((ROOT/args.browser).read_text());assert len(browser['selectedPoints'])==5
    dwell_records=[]
    for record in browser['records']:
        if record['laser']=='true':
            point=int(record['progress'].split('Current point: ')[1].split(' ')[0])
            if not any(index==point for index,_ in dwell_records):dwell_records.append((point,record))
    assert [index for index,_ in dwell_records]==[1,2,3,4,5]
    observed=[];previous=np.array(runtime['homeAngles']);max_pose=0.;max_qdiff=0.;max_surface=0.
    for i,(_,record) in enumerate(dwell_records):
        surface_delta=float(np.linalg.norm(np.array(browser['selectedPoints'][i]['basePosition'])-np.array(d['representativeRoute'][i]['surfacePosition']))*1000);max_surface=max(max_surface,surface_delta);assert surface_delta<=5
        q=np.array([float(v) for v in record['angles'].split(',')]);duration=max(1,float(np.max(1.5*np.abs(q-previous)/np.array([j['demoSpeed'] for j in r['joints']]))))
        max_qdiff=max(max_qdiff,float(np.max(np.abs(q-np.array(runtime['points'][i]['angles'])))))
        observed.append({'point':browser['selectedPoints'][i],'angles':q.tolist(),'duration':duration});previous=q
    for record in browser['records']:
        q=np.array([float(v) for v in record['angles'].split(',')]);assert np.isfinite(q).all() and np.all(q>=LOW) and np.all(q<=HIGH)
        _,E=fk(q);pose=np.array([float(v) for v in record['pose'].split(',')]).reshape(4,4,order='F');max_pose=max(max_pose,float(np.max(np.abs(E-pose))))
    assert max_pose<1e-10
    browser_checks={'path':args.browser,'maximumSelectedSurfaceDifferenceMm':max_surface,'actualSamplesChecked':len(browser['records']),'maximumIndependentFKMatrixDifference':max_pose,'maximumJointDifferenceFromFrozenRouteRuntimeRadians':max_qdiff}
    runtime['points']=observed
    output='issue-07-runtime-route-browser-production-clearance.json' if 'production' in args.browser else 'issue-07-runtime-route-browser-clearance.json'
previous=np.array(runtime['homeAngles']);speed=np.array([j['demoSpeed'] for j in r['joints']]);hits=[];floor=1.;samples=[];endpoints=[];peak=0.;durations=[]
for segment,p in enumerate(runtime['points']):
    end=np.array(p['angles']);assert np.isfinite(end).all() and np.all(end>=LOW) and np.all(end<=HIGH)
    surface=np.array(p['point']['basePosition']);normal=np.array(p['point']['baseNormal']);normal/=np.linalg.norm(normal)
    optical=-normal;up=np.array([0.,0,1]) if abs(optical[2])<=.99 else np.array([0.,1,0]);y=up-optical*(up@optical);y/=np.linalg.norm(y);R=np.column_stack([np.cross(y,optical),y,optical]);target=surface+.1*normal
    links,E=fk(end);position=float(np.linalg.norm(E[:3,3]-target)*1000);angle=math.degrees(math.acos(np.clip((np.trace(R.T@E[:3,:3])-1)/2,-1,1)));axis=math.degrees(math.acos(np.clip(E[:3,2]@optical,-1,1)))
    assert position<=5 and angle<=5 and axis<=5
    endpoints.append({'id':p['point']['id'],'positionErrorMm':position,'orientationErrorDeg':angle,'axisErrorDeg':axis,'jointAngles':end.tolist(),'setupJointDifferenceRadians':(end-np.array(d['representativeRoute'][segment]['jointAngles'])).tolist()})
    duration=max(1,float(np.max(1.5*np.abs(end-previous)/speed)));assert abs(duration-p['duration'])<1e-9;durations.append(duration)
    for index,t in enumerate(np.linspace(0,1,21)):
        if segment and index==0:continue
        s=t*t*(3-2*t);q=previous+(end-previous)*s;assert np.isfinite(q).all() and np.all(q>=LOW) and np.all(q<=HIGH)
        ratio=float(np.max(np.abs((end-previous)*6*t*(1-t)/duration)/speed));peak=max(peak,ratio);assert ratio<=1+1e-12
        links,E=fk(q);tool=E.copy();tool[:3,3]-=.08*E[:3,2]
        items=[(l['name'],vv,ff,m) for l,(vv,ff),m in zip(r['links'],meshes,links)]+[('scanner',sv,sf,tool)]
        for name,vertices,faces,M in items:
            world=vertices@M[:3,:3].T+M[:3,3];lo=world.min(axis=0);hi=world.max(axis=0);floor=min(floor,float(lo[2]))
            if not(np.all(hi>=dblo) and np.all(lo<=dbhi)):continue
            rt=world[faces];rf=faces[np.all(rt.max(axis=1)>=dblo,axis=1)&np.all(rt.min(axis=1)<=dbhi,axis=1)]
            df=f[np.all(dhi>=lo,axis=1)&np.all(dlo<=hi,axis=1)]
            if len(rf) and len(df) and contacts(poly(world,rf),poly(v,df)):hits.append({'segment':segment+1,'fraction':float(t),'body':name})
        samples.append({'segment':segment+1,'fraction':float(t),'jointAngles':q.tolist(),'peakSpeedRatio':ratio})
    previous=end
    print(f'Segment {segment+1}: residual {position:.6f} mm / {angle:.6f} degrees; contacts so far {len(hits)}',flush=True)
result={'browserEvidence':browser_checks,'sourceHashes':runtime['sourceHashes'],'solverElapsedMs':runtime['solverElapsedMs'],'method':'Fresh TypeScript runtime IK answers, independently specified measured-chain NumPy FK, actual door/robot/scanner triangle VTK first-contact samples; same contact method as issue3 setup tooling','endpoints':endpoints,'posesChecked':len(samples),'fractionsPerSegment':21,'contactSamples':hits,'minimumFloorZ':floor,'transitionDurationsSeconds':durations,'maximumPeakSpeedRatio':peak,'samples':samples,'elapsedSeconds':time.perf_counter()-started,'limitations':'Finite 21-sample transitions; no continuous collision detection, self-collision, physical cell safety or arbitrary-point guarantee; no collision planning is added to runtime.'}
(ROOT/'docs/verification'/output).write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k not in ['samples','endpoints']}));assert not hits and floor>=-1e-6,'Runtime sampled clearance failed'
