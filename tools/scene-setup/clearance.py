"""Setup-only finite triangle-contact sampling; never a collision-safety guarantee."""
import argparse,json,time
import numpy as np
import vtk
from vtk.util.numpy_support import numpy_to_vtk,numpy_to_vtkIdTypeArray
from verify import ROOT,read_glb,fk,LOW,HIGH

def poly(v,f):
    p=vtk.vtkPolyData(); points=vtk.vtkPoints();points.SetData(numpy_to_vtk(v,deep=True));p.SetPoints(points)
    cells=vtk.vtkCellArray(); cells.SetCells(len(f),numpy_to_vtkIdTypeArray(np.column_stack([np.full(len(f),3),f]).astype(np.int64).ravel(),deep=True));p.SetPolys(cells);return p

def contacts(a,b):
    c=vtk.vtkCollisionDetectionFilter();c.SetInputData(0,a);c.SetInputData(1,b);m=vtk.vtkMatrix4x4();m.Identity();c.SetMatrix(0,m);c.SetMatrix(1,m);c.SetCollisionModeToFirstContact();c.SetBoxTolerance(0);c.SetCellTolerance(0);c.SetNumberOfCellsPerNode(2);c.Update();return c.GetNumberOfContacts()

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',default='assets/demo/clearance.json');args=parser.parse_args();started=time.perf_counter()
    d=json.loads((ROOT/'assets/demo/manifest.json').read_text());r=json.loads((ROOT/'assets/robot/robot-definition.json').read_text())
    v,f,_=read_glb(ROOT/'assets/door/door.glb');T=np.array(d['partToBase']).reshape(4,4,order='F');v=v@T[:3,:3].T+T[:3,3];tri=v[f];dlo=tri.min(axis=1);dhi=tri.max(axis=1);dblo=v.min(axis=0);dbhi=v.max(axis=0)
    meshes=[read_glb(ROOT/'assets/robot'/l['mesh'])[:2] for l in r['links']]
    # Scanner actual decorative box, optical +Z front, center +40mm from tool0
    sv=np.array([[x,y,z] for x in [-.04,.04] for y in [-.03,.03] for z in [0,.08]])
    sf=np.array([[0,1,3],[0,3,2],[4,6,7],[4,7,5],[0,4,5],[0,5,1],[2,3,7],[2,7,6],[0,2,6],[0,6,4],[1,5,7],[1,7,3]])
    samples=[];hits=[];floor=1.;previous=np.array(d['homeAngles']);durations=[]
    for segment,p in enumerate(d['representativeRoute']):
        end=np.array(p['jointAngles']); duration=max(1,float(np.max(1.5*np.abs(end-previous)/np.array([j['demoSpeed'] for j in r['joints']]))));durations.append(duration)
        for index,t in enumerate(np.linspace(0,1,21)):
            if segment and index==0:continue
            s=t*t*(3-2*t);q=previous+(end-previous)*s;assert np.isfinite(q).all() and np.all(q>=LOW) and np.all(q<=HIGH)
            links,E=fk(q);tool=E.copy();tool[:3,3]-=.08*E[:3,2];items=[(l['name'],v,f,m) for l,(v,f),m in zip(r['links'],meshes,links)]+[('scanner',sv,sf,tool)]
            for name,vertices,faces,M in items:
                world=vertices@M[:3,:3].T+M[:3,3];lo=world.min(axis=0);hi=world.max(axis=0);floor=min(floor,float(lo[2]))
                if not(np.all(hi>=dblo) and np.all(lo<=dbhi)):continue
                rt=world[faces];rf=faces[np.all(rt.max(axis=1)>=dblo,axis=1)&np.all(rt.min(axis=1)<=dbhi,axis=1)]
                df=f[np.all(dhi>=lo,axis=1)&np.all(dlo<=hi,axis=1)]
                if len(rf) and len(df) and contacts(poly(world,rf),poly(v,df)):hits.append({'segment':segment+1,'fraction':float(t),'body':name})
            samples.append({'segment':segment+1,'fraction':float(t),'jointAngles':q.tolist()})
        previous=end
    result={'method':'VTK 9.3.1 actual mesh triangle first-contact checks; AABB filtering only removes disjoint triangle candidates','posesChecked':len(samples),'fractionsPerSegment':21,'contactSamples':hits,'minimumFloorZ':floor,'transitionDurationsSeconds':durations,'speedBound':'Smoothstep peak derivative1.5 accounted for at10% rated source speeds','limitations':'Finite21-sample transitions; no continuous collision detection, robot self-collision, physical cell safety or runtime guarantee','elapsedSeconds':time.perf_counter()-started}
    Path=__import__('pathlib').Path;Path(args.output).write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result));assert not hits and floor>=-1e-6,'Sampled door/floor clearance failed'
if __name__=='__main__':main()
