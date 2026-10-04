import json, pathlib, subprocess, sys, tempfile, unittest
ROOT=pathlib.Path(__file__).resolve().parents[2]
class FixedSceneGate(unittest.TestCase):
    def test_supplied_surface_route_has_bounded_independent_emitter_solutions(self):
        with tempfile.TemporaryDirectory() as folder:
            out=pathlib.Path(folder)/'manifest.json'
            result=subprocess.run([sys.executable,str(ROOT/'tools/scene-setup/verify.py'),'--output',str(out)],cwd=ROOT,capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            data=json.loads(out.read_text())
            self.assertEqual(len(data['representativeRoute']),5)
            for point in data['representativeRoute']:
                self.assertLessEqual(point['positionErrorMm'],5)
                self.assertLessEqual(point['orientationErrorDeg'],5)
                self.assertTrue(point['withinJointIntervals'])
                self.assertLess(point['approachNormal'][0],-.5)
            self.assertAlmostEqual(data['baseBounds']['min'][2],0,places=6)
    def test_sampled_route_has_no_door_or_floor_intersections(self):
        with tempfile.TemporaryDirectory() as folder:
            out=pathlib.Path(folder)/'clearance.json'
            result=subprocess.run([sys.executable,str(ROOT/'tools/scene-setup/clearance.py'),'--output',str(out)],cwd=ROOT,capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            data=json.loads(out.read_text())
            self.assertEqual(data['contactSamples'],[])
            self.assertGreaterEqual(data['minimumFloorZ'],-1e-6)
            self.assertEqual(data['posesChecked'],101)
if __name__=='__main__': unittest.main()
