"""Independent native STEP/cache gate. Python 3.12, cadquery-ocp 7.8.1.1, vtk 9.3.1.
Uses native STEPControl, trimmed-face ray intersection and exact BREP distances;
never calls the browser importer. All reported dimensions are millimeters.
"""
import argparse, hashlib, json, math, struct, time
import numpy as np
from pathlib import Path
from importlib.metadata import version
from OCP.STEPControl import STEPControl_Reader
from OCP.IFSelect import IFSelect_RetDone
from OCP.Bnd import Bnd_Box
from OCP.BRepBndLib import BRepBndLib
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.BRep import BRep_Tool
from OCP.TopLoc import TopLoc_Location
from OCP.TopExp import TopExp_Explorer
from OCP.TopAbs import TopAbs_FACE, TopAbs_SOLID, TopAbs_SHELL, TopAbs_EDGE
from OCP.TopoDS import TopoDS
from OCP.BRepCheck import BRepCheck_Analyzer
from OCP.GProp import GProp_GProps
from OCP.BRepGProp import BRepGProp
from OCP.gp import gp_Pnt, gp_Dir, gp_Lin, gp_Pnt2d
from OCP.BRepTools import BRepTools
from OCP.BRepAdaptor import BRepAdaptor_Surface
from OCP.BRepClass import BRepClass_FaceClassifier
from OCP.TopAbs import TopAbs_IN, TopAbs_ON, TopAbs_VERTEX
from OCP.IntCurvesFace import IntCurvesFace_ShapeIntersector
from OCP.BRepBuilderAPI import BRepBuilderAPI_MakeVertex
from OCP.BRepExtrema import BRepExtrema_DistShapeShape

started = time.perf_counter()
parser = argparse.ArgumentParser()
parser.add_argument('--source', default='3d files/car-front-door-1/DOOR-of-CAR.step')
parser.add_argument('--cache', default='assets/door/door.glb')
parser.add_argument('--output', default='docs/verification/door-native-report.json')
parser.add_argument('--preview-data', help='Optional independent native triangle JSON for a preview')
args = parser.parse_args()
source = Path(args.source).read_bytes()
expected = 'a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef'
assert b'LENGTH_UNIT()NAMED_UNIT(*)SI_UNIT(.MILLI.,.METRE.)' in source, 'Source millimeter unit declaration missing'
assert len(source) == 14456880 and hashlib.sha256(source).hexdigest() == expected, 'Door source identity mismatch'
reader = STEPControl_Reader()
assert reader.ReadFile(args.source) == IFSelect_RetDone, 'Native STEP parse failed'
roots = reader.TransferRoots()
shape = reader.OneShape()
assert not shape.IsNull(), 'Native reader returned no shape'
box = Bnd_Box(); BRepBndLib.AddOptimal_s(shape, box, False, False)
full_bounds = box.Get()
BRepMesh_IncrementalMesh(shape, 1.0, False, 0.25, False)

def explore(kind):
    explorer = TopExp_Explorer(shape, kind)
    while explorer.More():
        yield explorer.Current()
        explorer.Next()

def bounds(points):
    return {'min': [min(p[k] for p in points) for k in range(3)], 'max': [max(p[k] for p in points) for k in range(3)]}

native_points, native_triangles, missing, invalid, native_faces, triangle_faces = [], [], [], [], [], []
for face_index, item in enumerate(explore(TopAbs_FACE)):
    face = TopoDS.Face_s(item)
    native_faces.append(face)
    props = GProp_GProps(); BRepGProp.SurfaceProperties_s(face, props)
    analysis = BRepCheck_Analyzer(face)
    if not analysis.IsValid():
        invalid.append({'index': face_index, 'areaMm2': props.Mass(), 'faceStatus': [str(x) for x in analysis.Result(face).Status()], 'wireIssue': 'Self-intersecting trimming wire; independently inspected native BRepCheck results'})
    location = TopLoc_Location(); triangulation = BRep_Tool.Triangulation_s(face, location)
    if triangulation is None:
        face_box = Bnd_Box(); BRepBndLib.AddOptimal_s(face, face_box, False, False)
        missing.append({'index': face_index, 'areaMm2': props.Mass(), 'boundsMm': list(face_box.Get())})
        continue
    offset = len(native_points)
    for i in range(1, triangulation.NbNodes() + 1):
        p = triangulation.Node(i).Transformed(location.Transformation())
        native_points.append([p.X(), p.Y(), p.Z()])
    for i in range(1, triangulation.NbTriangles() + 1):
        native_triangles.append([offset + n - 1 for n in triangulation.Triangle(i).Get()])
        triangle_faces.append(face_index)

cache_bytes = Path(args.cache).read_bytes()
magic, glb_version, length = struct.unpack_from('<III', cache_bytes)
assert magic == 0x46546C67 and glb_version == 2 and length == len(cache_bytes), 'Invalid GLB'
json_length = struct.unpack_from('<I', cache_bytes, 12)[0]
model = json.loads(cache_bytes[20:20 + json_length])
binary_start = 28 + json_length

def accessor(index):
    entry = model['accessors'][index]; view = model['bufferViews'][entry['bufferView']]
    size = 3 if entry['type'] == 'VEC3' else 1
    code = {5126: 'f', 5125: 'I'}[entry['componentType']]
    values = struct.unpack_from('<' + code * entry['count'] * size, cache_bytes,
                                binary_start + view.get('byteOffset', 0) + entry.get('byteOffset', 0))
    return [values[i:i + size] for i in range(0, len(values), size)] if size > 1 else list(values)

cache_points, cache_triangles, normals = [], [], []
for mesh in model['meshes']:
    for primitive in mesh['primitives']:
        offset = len(cache_points)
        cache_points.extend([[x * 1000 for x in p] for p in accessor(primitive['attributes']['POSITION'])])
        normals.extend(accessor(primitive['attributes']['NORMAL']))
        index = accessor(primitive['indices'])
        cache_triangles.extend([[offset + n for n in index[i:i + 3]] for i in range(0, len(index), 3)])
assert all(math.isfinite(x) for p in cache_points for x in p), 'Nonfinite cache coordinate'
assert all(math.isfinite(x) for n in normals for x in n), 'Nonfinite cache normal'
native_bounds = bounds(native_points); cache_bounds = bounds(cache_points)
bound_error = max(abs(native_bounds[key][k] - cache_bounds[key][k]) for key in ['min', 'max'] for k in range(3))

# Independent closest point on ALL triangles, including edge/vertex regions.
# This is exact for each sampled location; no centroid-only acceleration heuristic.
def mesh_distances(points, vertices, triangles):
    t = np.asarray(vertices, dtype=np.float64)[np.asarray(triangles)]
    a, b, c = t[:, 0], t[:, 1], t[:, 2]
    ab, ac = b-a, c-a
    dot = lambda x, y: np.einsum('ij,ij->i', x, y)
    aa, bb, cc = dot(ab, ab), dot(ab, ac), dot(ac, ac)
    denominator = aa * cc - bb * bb
    result = []
    for point in points:
        p = np.asarray(point, dtype=np.float64)
        ap = p-a; ad, cd = dot(ap, ab), dot(ap, ac)
        with np.errstate(divide='ignore', invalid='ignore'):
            u, v = (cc*ad-bb*cd)/denominator, (aa*cd-bb*ad)/denominator
        projected = a + u[:, None]*ab + v[:, None]*ac
        squared = dot(p-projected, p-projected)
        squared[(u < 0) | (v < 0) | (u+v > 1) | (denominator <= 1e-20)] = np.inf
        for start, finish in [(a,b), (b,c), (c,a)]:
            edge = finish-start
            with np.errstate(divide='ignore', invalid='ignore'):
                fraction = np.clip(dot(p-start, edge)/dot(edge, edge), 0, 1)
            fraction = np.nan_to_num(fraction)
            difference = p-start-fraction[:, None]*edge
            squared = np.minimum(squared, dot(difference, difference))
        result.append(float(np.sqrt(np.min(squared))))
    return result

def sample_mesh(points, triangles, count=40):
    result = []
    for i in range(count):
        index = i * (len(triangles)-1) // (count-1)
        vertices = [points[n] for n in triangles[index]]
        result.append({'triangle': index, 'pointMm': [sum(v[k] for v in vertices)/3 for k in range(3)]})
    return result

samples = sample_mesh(cache_points, cache_triangles)
for sample, distance in zip(samples, mesh_distances([s['pointMm'] for s in samples], native_points, native_triangles)):
    sample['distanceToNativeTrianglesMm'] = distance
reverse_samples = sample_mesh(native_points, native_triangles)
for sample, distance in zip(reverse_samples, mesh_distances([s['pointMm'] for s in reverse_samples], cache_points, cache_triangles)):
    sample['distanceToCacheMm'] = distance
    face_index = triangle_faces[sample['triangle']]
    native_distance = BRepExtrema_DistShapeShape(BRepBuilderAPI_MakeVertex(gp_Pnt(*sample['pointMm'])).Vertex(), native_faces[face_index])
    native_distance.Perform()
    assert native_distance.IsDone(), 'Native analytic face check failed'
    sample['nativeFaceIndex'] = face_index
    sample['distanceToAnalyticFaceMm'] = native_distance.Value()

# Direct trimmed analytic face samples specifically cover the two tiny faces omitted
# by browser tessellation, including the native reader's untriangulated face.
small_faces = []
for face_index in [601, 755]:
    face = native_faces[face_index]
    surface = BRepAdaptor_Surface(face)
    u0,u1,v0,v1 = BRepTools.UVBounds_s(face)
    points = []
    for i in range(21):
        for j in range(21):
            u,v = u0+(u1-u0)*i/20, v0+(v1-v0)*j/20
            if BRepClass_FaceClassifier(face, gp_Pnt2d(u,v), 1e-7).State() in [TopAbs_IN, TopAbs_ON]:
                p = surface.Value(u,v); points.append([p.X(), p.Y(), p.Z()])
    vertices = TopExp_Explorer(face, TopAbs_VERTEX)
    while vertices.More():
        p = BRep_Tool.Pnt_s(TopoDS.Vertex_s(vertices.Current())); points.append([p.X(),p.Y(),p.Z()]); vertices.Next()
    assert points, 'Missing face could not be independently sampled'
    distances = mesh_distances(points, cache_points, cache_triangles)
    small_faces.append({'nativeFaceIndex': face_index, 'sampleCount': len(points), 'maximumDistanceToCacheMm': max(distances), 'boundsMm': bounds(points)})
    print('Checked small face', face_index, 'samples', len(points), 'max distance', max(distances), flush=True)

# Probe actual trimmed surfaces, not support planes or image-derived contours.
probes = []
for name, x, z, should_hit in [('window', 2100.0, 1200.0, False), ('skin', 2100.0, 750.0, True), ('frame', 2400.0, 1470.0, True)]:
    intersector = IntCurvesFace_ShapeIntersector(); intersector.Load(shape, 1e-6)
    intersector.Perform(gp_Lin(gp_Pnt(x, -2000, z), gp_Dir(0, 1, 0)), 0.0, 4000.0)
    hits = [[intersector.Pnt(i).X(), intersector.Pnt(i).Y(), intersector.Pnt(i).Z()] for i in range(1, intersector.NbPnt() + 1)]
    t = np.asarray(cache_points)[np.asarray(cache_triangles)]
    a,b,c = t[:,0],t[:,1],t[:,2]
    divisor = (b[:,2]-c[:,2])*(a[:,0]-c[:,0])+(c[:,0]-b[:,0])*(a[:,2]-c[:,2])
    with np.errstate(divide='ignore', invalid='ignore'):
        alpha = ((b[:,2]-c[:,2])*(x-c[:,0])+(c[:,0]-b[:,0])*(z-c[:,2]))/divisor
        beta = ((c[:,2]-a[:,2])*(x-c[:,0])+(a[:,0]-c[:,0])*(z-c[:,2]))/divisor
    alpha = np.nan_to_num(alpha, nan=-1e10, posinf=-1e10, neginf=-1e10)
    beta = np.nan_to_num(beta, nan=-1e10, posinf=-1e10, neginf=-1e10)
    hit_mask = (alpha >= 0) & (beta >= 0) & (alpha+beta <= 1) & (np.abs(divisor) > 1e-12)
    cache_hit_y = (alpha*a[:,1]+beta*b[:,1]+(1-alpha-beta)*c[:,1])[hit_mask].tolist()
    assert bool(cache_hit_y) == should_hit, f'Cache {name} probe failed'
    assert len(cache_hit_y) == len(hits), f'Cache/native {name} hit count differs'
    probe_error = max((abs(a-b[1]) for a,b in zip(sorted(cache_hit_y), sorted(hits, key=lambda p: p[1]))), default=0)
    assert probe_error <= 5, f'Cache/native {name} hit differs by more than 5 mm'
    probes.append({'name': name, 'maximumCacheHitErrorMm': probe_error, 'cacheHitYMm': cache_hit_y, 'rayOriginMm': [x, -2000, z], 'rayDirection': [0, 1, 0], 'hitsMm': hits})
    assert bool(hits) == should_hit, f'Native {name} probe failed'

loose_edges = []
for edge_index, item in enumerate(explore(TopAbs_EDGE)):
    edge_box = Bnd_Box(); BRepBndLib.AddOptimal_s(item, edge_box, False, False)
    values = edge_box.Get()
    if values[2] < native_bounds['min'][2] - 5:
        loose_edges.append({'index': edge_index, 'boundsMm': list(values)})

report = {'sourceSha256': expected, 'sourceUnits': 'millimeter', 'unitsEvidence': 'AP214 SI_UNIT(.MILLI.,.METRE.) source declaration; native default length unit millimeter',
          'reader': {'package': 'cadquery-ocp', 'version': version('cadquery-ocp'), 'vtkVersion': version('vtk'), 'numpyVersion': version('numpy'), 'transferRoots': roots},
          'topology': {'solids': sum(1 for _ in explore(TopAbs_SOLID)), 'shells': sum(1 for _ in explore(TopAbs_SHELL)), 'faces': sum(1 for _ in explore(TopAbs_FACE)), 'valid': BRepCheck_Analyzer(shape).IsValid(), 'invalidFaces': invalid, 'untriangulatedFaces': missing},
          'fullSourceBoundsMm': {'min': list(full_bounds[:3]), 'max': list(full_bounds[3:])},
          'looseEdgesBelowSurface': loose_edges,
          'nativeSurfaceBoundsMm': native_bounds, 'cacheSurfaceBoundsMm': cache_bounds,
          'nativeTriangles': len(native_triangles), 'nativeMeshing': {'absoluteDeflectionMm': 1.0, 'angularDeflectionRad': 0.25}, 'cacheTriangles': len(cache_triangles),
          'maximumBoundsDifferenceMm': bound_error,
          'cacheSha256': hashlib.sha256(cache_bytes).hexdigest(),
          'normalsMaximumLengthError': max(abs(math.sqrt(sum(x*x for x in n)) - 1) for n in normals),
          'probes': probes, 'cacheToNativeTriangleSamples': samples, 'nativeToCacheTriangleSamples': reverse_samples, 'omittedBrowserFaceChecks': small_faces,
          'maximumAnalyticFaceSampleDistanceMm': max(p['distanceToAnalyticFaceMm'] for p in reverse_samples),
          'maximumSampleDistanceMm': max([p['distanceToNativeTrianglesMm'] for p in samples] + [p['distanceToCacheMm'] for p in reverse_samples] + [p['maximumDistanceToCacheMm'] for p in small_faces]),
          'verificationElapsedSeconds': time.perf_counter() - started,
          'limits': 'Surface samples are not exhaustive Hausdorff evidence. Open/invalid source topology and missing native triangulation are retained, not repaired. Loose source wires are not triangle picking surfaces.'}
Path(args.output).parent.mkdir(parents=True, exist_ok=True)
Path(args.output).write_text(json.dumps(report, indent=2) + '\n')
if args.preview_data:
    Path(args.preview_data).write_text(json.dumps({'pointsMm': native_points, 'triangles': native_triangles}))
assert bound_error <= 5, 'Cache/native surface bounds differ by more than 5 mm'
assert report['maximumAnalyticFaceSampleDistanceMm'] <= 5, 'Native sampled analytic face deflection exceeds 5 mm'
assert report['maximumSampleDistanceMm'] <= 5, 'Sampled cache surface exceeds 5 mm tolerance'
print(json.dumps({key: report[key] for key in ['nativeSurfaceBoundsMm', 'cacheSurfaceBoundsMm', 'maximumBoundsDifferenceMm', 'maximumSampleDistanceMm', 'topology']}))
