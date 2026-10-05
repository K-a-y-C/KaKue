import * as THREE from 'three';
export type Vector3Tuple = readonly [number, number, number];
/** Surface coordinates in meters; normals retain the selected approach side. */
export interface SelectedPoint {
  readonly id: number; readonly order: number;
  readonly partPosition: Vector3Tuple; readonly partNormal: Vector3Tuple;
  readonly basePosition: Vector3Tuple; readonly baseNormal: Vector3Tuple;
  readonly meshIndex: number; readonly triangleIndex: number;
  readonly status: 'selected';
}
const tuple = (v: THREE.Vector3): Vector3Tuple => Object.freeze([v.x, v.y, v.z]);
/** Door-only picking and numbered markers behind the scene's selection seam. */
export function surfaceSelection(canvas: HTMLCanvasElement, camera: THREE.Camera, scene: THREE.Scene, part: () => THREE.Group | undefined, selected: (point: SelectedPoint) => void) {
  const markers = new THREE.Group(); scene.add(markers);
  let count = 0;
  const ray = new THREE.Raycaster();
  let down: { id: number; x: number; y: number; dragged: boolean } | undefined;
  const pointers = new Set<number>();
  const track = (event: PointerEvent) => { pointers.add(event.pointerId); if (pointers.size>1) down=undefined; };
  const start = (event: PointerEvent) => { if (event.button!==0) { down=undefined; return; } if (pointers.size>1) { down=undefined; return; } down = { id: event.pointerId, x: event.clientX, y: event.clientY, dragged: false }; };
  const move = (event: PointerEvent) => { if (down && Math.hypot(event.clientX-down.x, event.clientY-down.y)>5) down.dragged=true; };
  const up = (event: PointerEvent) => {
    const gesture=down; down=undefined; pointers.delete(event.pointerId);
    if (!gesture || gesture.id!==event.pointerId || gesture.dragged || Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)>5) return;
    const root = part(); if (!root) return;
    const rect = canvas.getBoundingClientRect();
    if (event.clientX<rect.left || event.clientX>=rect.right || event.clientY<rect.top || event.clientY>=rect.bottom) return;
    ray.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1, -(event.clientY-rect.top)/rect.height*2+1), camera);
    root.updateWorldMatrix(true, true);
    const hit = ray.intersectObject(root, true)[0];
    if (!hit || !hit.face || !(hit.object instanceof THREE.Mesh)) return;
    const occluders: THREE.Mesh[] = [];
    scene.updateMatrixWorld(true);
    scene.traverseVisible(node => {
      if (!(node instanceof THREE.Mesh)) return;
      let ancestor: THREE.Object3D | null = node;
      while (ancestor) { if (ancestor===root || ancestor===markers) return; ancestor=ancestor.parent; }
      const materials=Array.isArray(node.material)?node.material:[node.material];
      if (materials.some(material => material.visible && (!material.transparent || material.opacity===1))) occluders.push(node);
    });
    const obstruction=ray.intersectObjects(occluders,false)[0];
    if (obstruction && obstruction.distance<hit.distance-1e-6) return;
    const mesh = hit.object;
    const local = mesh.worldToLocal(hit.point.clone());
    const position = mesh.geometry.getAttribute('position');
    const a = new THREE.Vector3().fromBufferAttribute(position, hit.face.a), b = new THREE.Vector3().fromBufferAttribute(position, hit.face.b), c = new THREE.Vector3().fromBufferAttribute(position, hit.face.c);
    const weights = new THREE.Triangle(a, b, c).getBarycoord(local, new THREE.Vector3());
    const normals = mesh.geometry.getAttribute('normal');
    const normal = hit.face.normal.clone();
    if (normals && weights) normal.set(0, 0, 0).addScaledVector(new THREE.Vector3().fromBufferAttribute(normals, hit.face.a), weights.x).addScaledVector(new THREE.Vector3().fromBufferAttribute(normals, hit.face.b), weights.y).addScaledVector(new THREE.Vector3().fromBufferAttribute(normals, hit.face.c), weights.z);
    if (normal.lengthSq() < 1e-20) normal.copy(hit.face.normal);
    normal.applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld)).normalize();
    if (normal.dot(ray.ray.direction) > 0) normal.negate();
    const inverse = root.matrixWorld.clone().invert();
    const meshes: THREE.Mesh[] = []; root.traverse(node => { if (node instanceof THREE.Mesh) meshes.push(node); });
    const point: SelectedPoint = Object.freeze({ id: ++count, order: count, partPosition: tuple(hit.point.clone().applyMatrix4(inverse)), partNormal: tuple(normal.clone().applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(inverse))), basePosition: tuple(hit.point), baseNormal: tuple(normal), meshIndex: meshes.indexOf(mesh), triangleIndex: hit.faceIndex ?? 0, status: 'selected' });
    const label = document.createElement('canvas'); label.width=64; label.height=64;
    const context = label.getContext('2d')!; context.fillStyle='#142e44'; context.beginPath(); context.arc(32,32,29,0,Math.PI*2); context.fill(); context.strokeStyle='white'; context.lineWidth=3; context.stroke(); context.fillStyle='white'; context.font='bold 32px sans-serif'; context.textAlign='center'; context.textBaseline='middle'; context.fillText(String(point.order),32,33);
    const texture = new THREE.CanvasTexture(label);
    const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false })); marker.position.copy(hit.point); marker.scale.set(.06,.06,1); marker.renderOrder=1; markers.add(marker);
    selected(point);
  };
  const cancel = (event: PointerEvent) => { pointers.delete(event.pointerId); down=undefined; };
  window.addEventListener('pointerdown', track, true);
  window.addEventListener('pointercancel', cancel);
  window.addEventListener('pointerup', cancel);
  canvas.addEventListener('pointerdown', start); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up);
  const clear = () => { for (const child of [...markers.children]) { const sprite=child as THREE.Sprite; sprite.material.map?.dispose(); sprite.material.dispose(); markers.remove(child); } count=0; down=undefined; pointers.clear(); };
  return { markers, clear, dispose() { window.removeEventListener('pointerdown',track,true); window.removeEventListener('pointercancel',cancel); window.removeEventListener('pointerup',cancel); canvas.removeEventListener('pointerdown',start); canvas.removeEventListener('pointermove',move); canvas.removeEventListener('pointerup',up); clear(); scene.remove(markers); } };
}
