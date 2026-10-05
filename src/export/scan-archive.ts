import {selectedPointsPly,selectedCoordinatesCsv,type DownloadSnapshot} from './downloads.ts';

function crc32(bytes:Uint8Array):number {
  let crc=0xffffffff;
  for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  return (crc^0xffffffff)>>>0;
}
/** ZIP's stored method avoids a dependency and keeps both small text files deterministic. */
export async function scanArchive(snapshot:DownloadSnapshot) {
  if(snapshot.outcome!=='completed'||snapshot.points.length===0||snapshot.points.some(point=>point.status!=='visited'))throw new Error('Scan export requires a successful completed scan.');
  const files=[selectedPointsPly(snapshot),selectedCoordinatesCsv(snapshot)];
  const local:Uint8Array<ArrayBuffer>[]=[],central:Uint8Array<ArrayBuffer>[]=[];
  let offset=0;
  for(const file of files){
    const name=new TextEncoder().encode(file.name),data=new Uint8Array(await file.blob.arrayBuffer()),crc=crc32(data);
    const header=new Uint8Array(30+name.length),view=new DataView(header.buffer);
    view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint16(12,33,true); // 1980-01-01
    view.setUint32(14,crc,true);view.setUint32(18,data.length,true);view.setUint32(22,data.length,true);view.setUint16(26,name.length,true);header.set(name,30);
    local.push(header,data);
    const directory=new Uint8Array(46+name.length),entry=new DataView(directory.buffer);
    entry.setUint32(0,0x02014b50,true);entry.setUint16(4,20,true);entry.setUint16(6,20,true);entry.setUint16(14,33,true);
    entry.setUint32(16,crc,true);entry.setUint32(20,data.length,true);entry.setUint32(24,data.length,true);entry.setUint16(28,name.length,true);entry.setUint32(42,offset,true);directory.set(name,46);
    central.push(directory);offset+=header.length+data.length;
  }
  const end=new Uint8Array(22),view=new DataView(end.buffer);
  view.setUint32(0,0x06054b50,true);view.setUint16(8,files.length,true);view.setUint16(10,files.length,true);
  view.setUint32(12,central.reduce((sum,entry)=>sum+entry.length,0),true);view.setUint32(16,offset,true);
  return {name:files[0].name.replace(/-selected-points\.ply$/,'-scan-results.zip'),blob:new Blob([...local,...central,end],{type:'application/zip'})};
}
