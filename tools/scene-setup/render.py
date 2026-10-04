"""Software orthographic preview of actual cache triangles; no app FK/render imports."""
import json
import numpy as np
from PIL import Image,ImageDraw
from verify import ROOT,read_glb,fk

d=json.loads((ROOT/'assets/demo/manifest.json').read_text());r=json.loads((ROOT/'assets/robot/robot-definition.json').read_text())
image=Image.new('RGB',(1500,1000),(240,245,249));draw=ImageDraw.Draw(image)
view=np.array([-.7,-1,.65]);view/=np.linalg.norm(view);right=np.cross([0,0,1],view);right/=np.linalg.norm(right);up=np.cross(view,right);basis=np.column_stack([right,up,view]);center=np.array([.8,0,.75]);scale=215
sv=np.array([[x,y,z] for x in [-.04,.04] for y in [-.03,.03] for z in [0,.08]])
sf=np.array([[0,1,3],[0,3,2],[4,6,7],[4,7,5],[0,4,5],[0,5,1],[2,3,7],[2,7,6],[0,2,6],[0,6,4],[1,5,7],[1,7,3]])
for index,angles in enumerate([d['homeAngles']]+[p['jointAngles'] for p in d['representativeRoute']]):
    all_tri=[];all_colors=[];links,E=fk(angles);tool=E.copy();tool[:3,3]-=.08*E[:3,2]
    entries=[(ROOT/'assets/door/door.glb',np.array(d['partToBase']).reshape(4,4,order='F'),np.array([155,173,181]))]+[(ROOT/'assets/robot'/l['mesh'],M,np.array([245,135,40])) for l,M in zip(r['links'],links)]
    entries.append((None,tool,np.array([55,65,78])))
    for path,M,color in entries:
        v,f,_=read_glb(path) if path else (sv,sf,None);world=v@M[:3,:3].T+M[:3,3];tri=world[f]
        normal=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);length=np.linalg.norm(normal,axis=1);normal/=np.maximum(length,1e-12)[:,None];light=np.array([-.2,-.4,1]);light/=np.linalg.norm(light)
        shade=.55+.45*np.abs(normal@light);all_colors.append(np.clip(shade[:,None]*color,0,255).astype(np.uint8));all_tri.append((tri-center)@basis)
    tri=np.concatenate(all_tri);colors=np.concatenate(all_colors);order=np.argsort(tri[:,:,2].mean(axis=1));offset=np.array([(index%3)*500+250,(index//3)*500+250]);xy=tri[:,:,:2]*[scale,-scale]+offset
    # Quantized subpixel triangles need no draw; retained input geometry/measurements are untouched.
    for i in order:
        pts=[tuple(p) for p in xy[i]]
        if np.ptp(xy[i,:,0])+np.ptp(xy[i,:,1])<.6:continue
        draw.polygon(pts,fill=tuple(int(x) for x in colors[i]))
    for p in d['representativeRoute']:
        xypt=((np.array(p['surfacePosition'])-center)@basis)[:2]*[scale,-scale]+offset;x,y=xypt;draw.ellipse((x-4,y-4,x+4,y+4),fill=(211,30,43));draw.text((x+7,y-5),str(p['id']),fill=(125,10,20))
    draw.text((index%3*500+15,index//3*500+15),'Demo home' if index==0 else f'Surface point {index}',fill=(30,45,60),font_size=22)
image.save(ROOT/'assets/demo/setup-poses.png');print('assets/demo/setup-poses.png')
