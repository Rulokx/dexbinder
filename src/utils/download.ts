/** Trigger a classic browser download for in-memory text content. */
export function downloadText(fileName: string, mime: string, content: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** True when running as an installed app (Home Screen on iPhone, installed PWA elsewhere). */
export function isStandaloneApp(): boolean {
  try {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      if (window.matchMedia('(display-mode: standalone)').matches) return true;
    }
    // iOS Safari's own flag for Home Screen apps.
    return (navigator as Navigator & { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}

export type SaveResult = 'downloaded' | 'shared' | 'cancelled';

/**
 * Save a text file in the way that works best on the current device.
 *
 * In an installed app on iPhone, plain downloads are unreliable, so the file
 * goes through the share sheet (Save to Files, AirDrop, iCloud Drive…).
 * Everywhere else it is a normal download.
 *
 * Must be called directly from a click handler: `navigator.share` needs the
 * user's tap, so nothing async happens before it.
 */
export async function saveTextFile(fileName: string, mime: string, content: string): Promise<SaveResult> {
  if (isStandaloneApp() && typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
    const baseMime = mime.split(';')[0]!.trim();
    const file = new File([content], fileName, { type: baseMime });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: fileName });
        return 'shared';
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
        // Any other failure: fall back to a regular download below.
      }
    }
  }
  downloadText(fileName, mime, content);
  return 'downloaded';
}
