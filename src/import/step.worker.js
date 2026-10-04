/* Classic worker: published OCCT loader uses importScripts and same-origin WASM. */
onmessage = async ({ data }) => {
  try {
    importScripts(data.parserBase + 'occt-import-js.js');
    const occt = await occtimportjs({ locateFile: name => data.parserBase + name });
    const sourceHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data.buffer)), n => n.toString(16).padStart(2, '0')).join('');
    const text = new TextDecoder().decode(data.buffer);
    const entities = new Map(Array.from(text.matchAll(/#(\d+)\s*=\s*([^;]+);/g), match => [match[1], match[2]]));
    const units = new Set();
    for (const context of text.matchAll(/GLOBAL_UNIT_ASSIGNED_CONTEXT\s*\(\s*\(([^)]+)\)/gi)) {
      for (const reference of context[1].matchAll(/#(\d+)/g)) {
        const entity = entities.get(reference[1]) || '';
        if (!/LENGTH_UNIT\s*\(/i.test(entity)) continue;
        const conversion = entity.match(/CONVERSION_BASED_UNIT\s*\(\s*'([^']+)'/i);
        const si = entity.match(/SI_UNIT\s*\(\s*([^,]+),\s*\.METRE\.\s*\)/i);
        units.add(conversion ? conversion[1].toLowerCase() : si ? ({ '.MILLI.': 'millimeter', '.CENTI.': 'centimeter', '$': 'meter' }[si[1].trim().toUpperCase()] || 'unknown') : 'unknown');
      }
    }
    const sourceUnits = units.size === 1 ? [...units][0] : units.size ? 'mixed' : 'unknown';
    const result = occt.ReadStepFile(new Uint8Array(data.buffer), { linearUnit: 'meter', linearDeflectionType: 'absolute_value', linearDeflection: .001, angularDeflection: .25 });
    if (!result.success) throw new Error('Malformed STEP: the parser could not read this file.');
    const meshes = result.meshes.map(mesh => ({ name: mesh.name, positions: new Float32Array(mesh.attributes.position.array), normals: mesh.attributes.normal ? new Float32Array(mesh.attributes.normal.array) : undefined, indices: new Uint32Array(mesh.index.array), faces: mesh.brep_faces }));
    if (!meshes.some(mesh => mesh.indices.length)) throw new Error('No usable mesh: the STEP contains no triangle surfaces.');
    postMessage({ meshes, sourceHash, sourceUnits }, meshes.flatMap(mesh => [mesh.positions.buffer, mesh.indices.buffer, ...(mesh.normals ? [mesh.normals.buffer] : [])]));
  } catch (error) { postMessage({ error: error instanceof Error ? error.message : String(error) }); }
};
