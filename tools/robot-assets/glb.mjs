// Deterministic glTF 2 binary encoding. Vertices are already in link-local meters.
export function encodeGlb(meshes, name) {
  const chunks=[], bufferViews=[], accessors=[], primitives=[], materials=[];
  let bytes=0;
  function accessor(values,type,componentType,target,min,max) {
    const typed=componentType===5126?new Float32Array(values):new Uint32Array(values);
    const data=Buffer.from(typed.buffer);
    bufferViews.push({buffer:0,byteOffset:bytes,byteLength:data.length,target});
    chunks.push(data);bytes+=data.length;
    accessors.push({bufferView:bufferViews.length-1,componentType,count:values.length/(type==='VEC3'?3:1),type,...(min?{min,max}:{})});
    return accessors.length-1;
  }
  for(const mesh of meshes) {
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(let i=0;i<mesh.positions.length;i++) {const n=Math.fround(mesh.positions[i]),j=i%3;min[j]=Math.min(min[j],n);max[j]=Math.max(max[j],n);}
    const attributes={POSITION:accessor(mesh.positions,'VEC3',5126,34962,min,max)};
    if(mesh.normals) attributes.NORMAL=accessor(mesh.normals,'VEC3',5126,34962);
    const indices=accessor(mesh.indices,'SCALAR',5125,34963);
    const color=mesh.color??[.92,.36,.05];
    materials.push({pbrMetallicRoughness:{baseColorFactor:[...color,1],metallicFactor:.15,roughnessFactor:.65},doubleSided:false});
    primitives.push({attributes,indices,material:materials.length-1,mode:4});
  }
  const json={asset:{version:'2.0',generator:'KaKue supplied-STEP rigid-link preparation'},scene:0,scenes:[{nodes:[0]}],nodes:[{name,mesh:0}],meshes:[{name,primitives}],materials,buffers:[{byteLength:bytes}],bufferViews,accessors};
  const encoded=Buffer.from(JSON.stringify(json)),padding=(4-encoded.length%4)%4;
  const jsonChunk=Buffer.concat([encoded,Buffer.alloc(padding,32)]),binary=Buffer.concat(chunks);
  const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+jsonChunk.length+binary.length,8);header.writeUInt32LE(jsonChunk.length,12);header.writeUInt32LE(0x4e4f534a,16);
  const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(binary.length);binHeader.writeUInt32LE(0x004e4942,4);
  return Buffer.concat([header,jsonChunk,binHeader,binary]);
}
