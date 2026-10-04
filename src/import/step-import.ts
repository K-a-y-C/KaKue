import manifest from '../../assets/demo/manifest.json';
import doorManifest from '../../assets/door/manifest.json';
import type { PartAsset } from './types';
export class StepImportError extends Error {
  constructor(readonly code: string, message: string) { super(message); this.name = 'StepImportError'; }
}
/** Validate before abandoning the current session or allocating parser work. */
export function validateStepFile(file: File): void {
  if (file.size === 0) throw new StepImportError('empty', 'STEP is empty. Choose a file containing CAD geometry.');
  if (file.size > 50 * 1024 * 1024) throw new StepImportError('oversized', 'STEP exceeds the 50 MiB limit. Choose a smaller file.');
  if (!/\.(step|stp)$/i.test(file.name)) throw new StepImportError('unsupported', /\.catpart$/i.test(file.name) ? 'CATPart is not supported. Choose a STEP (.step or .stp) file.' : 'Unsupported format. Choose a STEP (.step or .stp) file.');
}
export async function importStep(file: File, { signal }: { signal: AbortSignal }): Promise<PartAsset> {
  validateStepFile(file);
  signal.throwIfAborted();
  const buffer = await file.arrayBuffer();
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try { worker = new Worker(new URL('./step.worker.ts', import.meta.url), { type: 'classic' }); } catch { reject(new StepImportError('worker-failure', 'Worker failure: STEP parser could not start. Try another import.')); return; }
    let settled = false;
    const finish = (error?: Error, value?: PartAsset) => {
      if (settled) return;
      settled = true;
      worker.terminate(); signal.removeEventListener('abort', abort);
      if (error) reject(error); else resolve(value!);
    };
    const abort = () => finish(new DOMException('Import cancelled', 'AbortError'));
    signal.addEventListener('abort', abort, { once: true });
    worker.onerror = event => { event.preventDefault(); finish(new StepImportError('worker-failure', 'Worker failure: STEP import stopped. Try another import.')); };
    worker.onmessageerror = () => finish(new StepImportError('worker-failure', 'Worker failure: unreadable parser response.'));
    worker.onmessage = ({ data }) => {
      if (data.error) finish(new StepImportError(data.error.code, data.error.message));
      else finish(undefined, { ...data, sourceName: file.name, sourceFormat: 'STEP', source: file, outputUnits: 'meter', partToBase: manifest.partToBase });
    };
    try { worker.postMessage({ buffer, parserBase: new URL(`${import.meta.env.BASE_URL}parser/occt-import-js/0.0.23/`, location.href).href }, [buffer]); } catch { finish(new StepImportError('worker-failure', 'Worker failure: could not send STEP to the parser.')); }
  });
}

/** Fetches and verifies the exact source paired with the prepared door cache. */
export async function loadBundledSource({ signal }: { signal: AbortSignal }): Promise<Omit<PartAsset, 'meshes'>> {
  const response = await fetch(`${import.meta.env.BASE_URL}demo-v1/door/DOOR-of-CAR.step`, { signal });
  if (!response.ok) throw new Error('Required asset unavailable: door/DOOR-of-CAR.step.');
  const source = await response.blob();
  const sourceHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await source.arrayBuffer())), n => n.toString(16).padStart(2, '0')).join('');
  if (sourceHash !== doorManifest.source.sha256) throw new Error('Bundled STEP identity mismatch.');
  signal.throwIfAborted();
  return { sourceName: doorManifest.source.name, sourceFormat: 'STEP', source, sourceHash, sourceUnits: doorManifest.source.units, outputUnits: 'meter', partToBase: manifest.partToBase };
}
