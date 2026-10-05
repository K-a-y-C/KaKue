import { useMemo, useEffect, useRef, useState } from 'react';
import type { PartAsset } from '../import/types';
import type { RunPlan } from '../motion/preflight';
import type { SelectedPoint } from '../scene/surface-selection';
import { captureDownloadSnapshot, type TerminalOutcome } from './downloads';

import {scanArchive} from './scan-archive';

interface DownloadControlsProps {
  part: PartAsset | null;
  points: readonly SelectedPoint[];
  statuses: Readonly<Record<number, string>>;
  plan: RunPlan | null;
  standOffMm: number;
  outcome: TerminalOutcome;
}

export function DownloadControls({ part, points, statuses, plan, standOffMm, outcome }: DownloadControlsProps) {
  const captured = useMemo(() => {
    try {
      return { snapshot: part ? captureDownloadSnapshot(part, points, statuses, plan, standOffMm, outcome) : null, error: '' };
    } catch (error) {
      return { snapshot: null, error: error instanceof Error ? error.message : String(error) };
    }
  }, [part, points, statuses, plan, standOffMm, outcome]);
  const snapshot = captured.snapshot;
  const [downloadError, setDownloadError] = useState('');
  const urls = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  useEffect(() => () => {
    for (const [url, timer] of urls.current) {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
    }
    urls.current.clear();
  }, [snapshot]);

  const [saving,setSaving]=useState(false);
  const save = async () => {
    if (!snapshot || saving) return;
    setSaving(true);
    setDownloadError('');
    try {
      const file = await scanArchive(snapshot);
      const url = URL.createObjectURL(file.blob);
      // Give the browser time to acquire the Blob, while bounding its lifetime.
      urls.current.set(url, setTimeout(() => {
        URL.revokeObjectURL(url);
        urls.current.delete(url);
      }, 1000));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.name;
      try {
        document.body.append(anchor);
        anchor.click();
      } finally {
        anchor.remove();
      }
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : String(error));
    } finally { setSaving(false); }
  };

  return <section aria-label="Scan export">
    <h3>Scan export</h3>
    {(captured.error || downloadError) && <p role="alert">{captured.error || downloadError}</p>}
    <p>Point cloud (PLY) and Coordinates (CSV) in one ZIP file.</p>
    <button disabled={!snapshot || points.length === 0 || saving} onClick={() => void save()}>{saving?'Preparing export…':'Export'}</button>
    <p>Simulated point cloud and coordinates · Robot-base · mm</p>
  </section>;
}
