import workerUrl from './step.worker.js?url';
import manifest from '../../assets/demo/manifest.json';
import type { PartAsset } from './types';
export async function importStep(file: File, { signal }: { signal: AbortSignal }): Promise<PartAsset> {
  signal.throwIfAborted();
  const buffer = await file.arrayBuffer();
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerUrl);
    const finish = (error?: Error, value?: PartAsset) => {
      worker.terminate(); signal.removeEventListener('abort', abort);
      if (error) reject(error); else resolve(value!);
    };
    const abort = () => finish(new DOMException('Import cancelled', 'AbortError'));
    signal.addEventListener('abort', abort, { once: true });
    worker.onerror = () => finish(new Error('Worker failure: STEP import stopped. Try another import.'));
    worker.onmessageerror = () => finish(new Error('Worker failure: unreadable parser response.'));
    worker.onmessage = ({ data }) => {
      if (data.error) finish(new Error(data.error));
      else finish(undefined, { ...data, sourceName: file.name, sourceFormat: 'STEP', source: file, outputUnits: 'meter', partToBase: manifest.partToBase });
    };
    worker.postMessage({ buffer, parserBase: new URL(`${import.meta.env.BASE_URL}parser/occt-import-js/0.0.23/`, location.href).href }, [buffer]);
  });
}

/** Fetches and verifies the exact source paired with the prepared door cache. */
export async function loadBundledSource({ signal }: { signal: AbortSignal }): Promise<Omit<PartAsset, 'meshes'>> {
  const response = await fetch(`${import.meta.env.BASE_URL}demo-v1/door/DOOR-of-CAR.step`, { signal });
  if (!response.ok) throw new Error('Required asset unavailable: door/DOOR-of-CAR.step.');
  const source = await response.blob();
  const sourceHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await source.arrayBuffer())), n => n.toString(16).padStart(2, '0')).join('');
  if (sourceHash !== 'a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef') throw new Error('Bundled STEP identity mismatch.');
  signal.throwIfAborted();
  return { sourceName: 'DOOR-of-CAR.step', sourceFormat: 'STEP', source, sourceHash, sourceUnits: 'millimeter', outputUnits: 'meter', partToBase: manifest.partToBase };
}
