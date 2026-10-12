import * as THREE from 'three';

/** Camera-centered coverage with world-anchored lines; no surface fill outside the base. */
export function infiniteGrid(far: number): THREE.Mesh {
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(far*2, far*2), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: {
      minorColor: { value: new THREE.Color(0x515151) },
      majorColor: { value: new THREE.Color(0x626262) },
      axisColor: { value: new THREE.Color(0x777777) },
    },
    vertexShader: `
      varying vec2 worldPosition;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        worldPosition = world.xy;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      varying vec2 worldPosition;
      uniform vec3 minorColor;
      uniform vec3 majorColor;
      uniform vec3 axisColor;
      float lines(float spacing) {
        vec2 cell = worldPosition / spacing;
        vec2 width = fwidth(cell);
        vec2 distanceToLine = abs(fract(cell - 0.5) - 0.5) / max(width * 0.5, vec2(0.000001));
        float coverage = 1.0 - min(min(distanceToLine.x, distanceToLine.y), 1.0);
        // Fade subpixel cells toward the horizon instead of aliasing into a solid fill.
        return coverage * (1.0 - smoothstep(0.2, 0.5, max(width.x, width.y)));
      }
      void main() {
        float minor = lines(0.1);
        float major = lines(0.5);
        vec2 axisDistance = abs(worldPosition) / max(fwidth(worldPosition) * 0.5, vec2(0.000001));
        float axis = 1.0 - min(min(axisDistance.x, axisDistance.y), 1.0);
        float alpha = max(max(minor, major), axis);
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(mix(mix(minorColor, majorColor, major), axisColor, axis), alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  }));
  // Lines are visual references, never a selectable surface or opaque picking obstruction.
  grid.raycast = () => {};
  grid.frustumCulled = false;
  return grid;
}
