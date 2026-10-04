"""Render independently read native triangles. Requires Pillow 12.3.0."""
import argparse, json
from PIL import Image, ImageDraw
p = argparse.ArgumentParser(); p.add_argument('native_triangles_json'); p.add_argument('--output', default='docs/verification/door-native-preview.png'); args = p.parse_args()
data = json.load(open(args.native_triangles_json))
points, triangles = data['pointsMm'], data['triangles']
image = Image.new('RGB', (1650, 750), 'white'); draw = ImageDraw.Draw(image)
minimum = [min(p[k] for p in points) for k in range(3)]; maximum = [max(p[k] for p in points) for k in range(3)]
for panel, (x, y, title) in enumerate([(0,2,'X-Z front view (mm)'), (0,1,'X-Y top view (mm)'), (1,2,'Y-Z edge view (mm)')]):
    scale = min(480/(maximum[x]-minimum[x]), 620/(maximum[y]-minimum[y]))
    projected = [(panel*550+40+(p[x]-minimum[x])*scale, 700-(p[y]-minimum[y])*scale) for p in points]
    for triangle in triangles:
        draw.polygon([projected[i] for i in triangle], fill='#8795a3', outline='#536170')
    draw.text((panel*550+40,20),title,fill='black')
    draw.text((panel*550+40,40),'Native STEP reader / 1 mm tessellation',fill='black')
image.save(args.output)
