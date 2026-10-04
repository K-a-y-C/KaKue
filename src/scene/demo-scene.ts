import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { robotDefinition } from '../robot/definition';
import { forwardKinematics } from '../robot/forward-kinematics';
import manifest from '../../assets/demo/manifest.json';
export interface SceneInformation { doorWidthMm: string; doorHeightMm: string; robotLinkCount: number; emitterMm: string[] }
function disposeObject(object: THREE.Object3D) {
  object.traverse(node => {
    if ((node instanceof THREE.Mesh || node instanceof THREE.LineSegments)) {
      node.geometry.dispose();
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach(material => material.dispose());
    }
  });
}
/** Opens the fixed actual scene and returns the complete lifecycle cleanup. */
export function openDemoScene(host: HTMLElement, ready: (info: SceneInformation) => void, fail: (message: string) => void): () => void {
  let active = true;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e8edf1');
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
  catch { fail('WebGL2 is required to display this scene. Use a desktop browser with hardware acceleration enabled, then reload.'); return () => {}; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', '3D robot and door scene');
  host.append(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(40, 1, .01, 30);
  camera.up.set(0, 0, 1);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x7c8896, 2));
  const light = new THREE.DirectionalLight(0xffffff, 3); light.position.set(2, -3, 4); scene.add(light);
  const grid = new THREE.GridHelper(4, 40, 0x8593a3, 0xc7d0d9); grid.rotation.x = Math.PI/2; scene.add(grid);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(4,4), new THREE.MeshStandardMaterial({ color: 0xe3e9ee, roughness: 1, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
  scene.add(floor);
  const majorGrid = new THREE.GridHelper(4, 8, 0x708498, 0xa1b0bf); majorGrid.rotation.x = Math.PI/2; scene.add(majorGrid);
  const resize = () => { const { width, height } = host.getBoundingClientRect(); renderer.setSize(width, height); camera.aspect = width/height; camera.updateProjectionMatrix(); };
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  const loader = new GLTFLoader();
  const load = async (path: string) => {
    let loaded: THREE.Group;
    try { loaded = (await loader.loadAsync(`${import.meta.env.BASE_URL}demo-v1/${path}`)).scene; }
    catch { throw new Error(`Required asset unavailable: ${path}.`); }
    if (!active) { disposeObject(loaded); throw new Error('Scene closed'); }
    return loaded;
  };
  void (async () => {
    const pose = forwardKinematics(robotDefinition, manifest.homeAngles);
    for (const link of robotDefinition.links) {
      const group = await load('robot/'+link.mesh); group.matrixAutoUpdate = false;
      group.matrix.fromArray(pose.linkMatrices[link.name]).multiply(new THREE.Matrix4().fromArray(link.visualTransform)); scene.add(group);
    }
    const tool = new THREE.Group(); tool.matrixAutoUpdate = false; tool.matrix.fromArray(pose.tool0); scene.add(tool);
    const scanner = new THREE.Mesh(new THREE.BoxGeometry(...robotDefinition.scanner.dimensions as [number,number,number]), new THREE.MeshStandardMaterial({ color: 0x273e51, roughness: .4 }));
    scanner.position.fromArray(robotDefinition.scanner.tool0ToCenter); tool.add(scanner);
    const emitter = new THREE.Mesh(new THREE.CircleGeometry(.012, 16), new THREE.MeshBasicMaterial({ color: 0xf34444, side: THREE.DoubleSide }));
    emitter.position.fromArray(robotDefinition.scanner.tool0ToEmitter); tool.add(emitter);
    const door = await load('door/door.glb'); door.matrixAutoUpdate=false; door.matrix.fromArray(manifest.partToBase); scene.add(door);
    scene.updateMatrixWorld(true);
    const doorSize = new THREE.Box3().setFromObject(door).getSize(new THREE.Vector3());
    const bounds = new THREE.Box3(); scene.children.filter(child => child !== floor && child !== grid && child !== majorGrid && !(child instanceof THREE.Light)).forEach(child => bounds.expandByObject(child));
    const center = bounds.getCenter(new THREE.Vector3());
    controls.target.copy(center);
    const distance = bounds.getSize(new THREE.Vector3()).length() / (2*Math.sin(THREE.MathUtils.degToRad(20))) * 1.1;
    camera.position.copy(center).add(new THREE.Vector3(-1.6,-2.4,1.5).normalize().multiplyScalar(distance));
    controls.update();
    renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
    renderer.render(scene,camera);
    ready({ doorWidthMm: (doorSize.y*1000).toFixed(1), doorHeightMm: (doorSize.z*1000).toFixed(1), robotLinkCount: robotDefinition.links.length, emitterMm: Array.from(pose.emitter.slice(12,15), n => (n*1000).toFixed(1)) });
  })().catch(error => { if (active) fail(`Could not load the supplied scene assets. ${error instanceof Error ? error.message : String(error)} Reload after checking the required files.`); });
  return () => { active=false; observer.disconnect(); controls.dispose(); renderer.setAnimationLoop(null); disposeObject(scene); renderer.dispose(); renderer.domElement.remove(); };
}
