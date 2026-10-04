import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
const root=fileURLToPath(new URL('../../',import.meta.url));
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.ts':'text/javascript','.json':'application/json','.glb':'model/gltf-binary','.wasm':'application/wasm'};
const port=Number(process.env.ROBOT_PREVIEW_PORT??4172);
createServer((req,res)=>{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(path==='/'?'/tools/robot-assets/preview.html':path));
  if(!file.startsWith(root)) {res.writeHead(403);return res.end();}
  try {
    let bytes=readFileSync(file);
    if(extname(file)==='.ts') bytes=stripTypeScriptTypes(bytes.toString());
    res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream'});res.end(bytes);
  } catch {res.writeHead(404);res.end('Asset unavailable');}
}).listen(port,'127.0.0.1',()=>console.log(`Robot verification preview: http://127.0.0.1:${port}`));
