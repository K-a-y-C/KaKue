import { useMemo, useEffect, useRef, useState } from 'react';
import type { PartAsset } from '../import/types';
import type { RunPlan } from '../motion/preflight';
import type { SelectedPoint } from '../scene/surface-selection';
import { captureDownloadSnapshot, selectedPointsPly, selectedCoordinatesCsv, originalStep, type TerminalOutcome } from './downloads';

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

  const save = (format: 'ply' | 'csv' | 'step') => {
    if (!snapshot && format !== 'step') return;
    if (format === 'step' && !part) return;
    setDownloadError('');
    try {
      const file = format === 'ply' ? selectedPointsPly(snapshot!)
        : format === 'csv' ? selectedCoordinatesCsv(snapshot!) : originalStep(snapshot ?? part!);
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
    }
  };

  return <section aria-label="Downloads">
    <h3>Downloads</h3>
    {(captured.error || downloadError) && <p role="alert">{captured.error || downloadError}</p>}
    <button disabled={!snapshot || points.length === 0} onClick={() => save('ply')}>Download selected points (PLY)</button>
    <button disabled={!snapshot || points.length === 0} onClick={() => save('csv')}>Download coordinates (CSV)</button>
    <button disabled={!part || part.source.size === 0} onClick={() => save('step')}>Download original STEP</button>
    <p>Selected CAD surface points in robot-base millimeters. Simulated visits, not acquired measurements.</p>
  </section>;
}
