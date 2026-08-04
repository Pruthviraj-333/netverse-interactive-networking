import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merges Tailwind classes safely, resolving conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Formats a number of milliseconds as "1m 30s" */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (minutes === 0) return `${remaining}s`;
  return `${minutes}m ${remaining}s`;
}

/** Formats a byte count to human-readable (B, KB, MB) */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Debounce a function */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Clamps a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Returns a colour string for an OSI layer number */
export function osiLayerColor(layer: number): string {
  const colors: Record<number, string> = {
    7: '#8b5cf6',
    6: '#a78bfa',
    5: '#06b6d4',
    4: '#3b82f6',
    3: '#10b981',
    2: '#f59e0b',
    1: '#f43f5e',
  };
  return colors[layer] ?? '#64748b';
}

/** Returns label for OSI layer number */
export function osiLayerName(layer: number): string {
  const names: Record<number, string> = {
    7: 'Application',
    6: 'Presentation',
    5: 'Session',
    4: 'Transport',
    3: 'Network',
    2: 'Data Link',
    1: 'Physical',
  };
  return names[layer] ?? 'Unknown';
}

/** Copies text to clipboard */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Generates a simple unique ID */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
