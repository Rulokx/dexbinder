import { afterEach, describe, expect, it, vi } from 'vitest';
import { isStandaloneApp, saveTextFile } from './download';

type ShareNavigator = Navigator & {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
  standalone?: boolean;
};
const nav = navigator as ShareNavigator;

function mockStandalone(on: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: on && query === '(display-mode: standalone)',
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function mockDownload() {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  return vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'share');
  Reflect.deleteProperty(navigator, 'canShare');
  delete (window as { matchMedia?: unknown }).matchMedia;
});

describe('saveTextFile', () => {
  it('downloads normally in a regular browser tab', async () => {
    mockStandalone(false);
    const click = mockDownload();
    nav.share = vi.fn();
    nav.canShare = vi.fn(() => true);

    await expect(saveTextFile('backup.json', 'application/json;charset=utf-8', '{}')).resolves.toBe('downloaded');
    expect(click).toHaveBeenCalledOnce();
    expect(nav.share).not.toHaveBeenCalled();
  });

  it('uses the share sheet in the installed iPhone app', async () => {
    mockStandalone(true);
    const click = mockDownload();
    nav.canShare = vi.fn(() => true);
    nav.share = vi.fn().mockResolvedValue(undefined);

    await expect(saveTextFile('backup.json', 'application/json;charset=utf-8', '{"set":"me5"}')).resolves.toBe('shared');
    expect(click).not.toHaveBeenCalled();
    const data = (nav.share as ReturnType<typeof vi.fn>).mock.calls[0]![0] as ShareData;
    const file = data.files![0]!;
    expect(file.name).toBe('backup.json');
    expect(file.type).toBe('application/json');
  });

  it('reports a cancelled share without downloading', async () => {
    mockStandalone(true);
    const click = mockDownload();
    nav.canShare = vi.fn(() => true);
    nav.share = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'));

    await expect(saveTextFile('b.json', 'application/json', '{}')).resolves.toBe('cancelled');
    expect(click).not.toHaveBeenCalled();
  });

  it('falls back to a download if sharing files is not supported or fails', async () => {
    mockStandalone(true);
    const click = mockDownload();
    nav.canShare = vi.fn(() => false);
    nav.share = vi.fn();
    await expect(saveTextFile('b.csv', 'text/csv', 'a,b')).resolves.toBe('downloaded');

    nav.canShare = vi.fn(() => true);
    nav.share = vi.fn().mockRejectedValue(new DOMException('nope', 'NotAllowedError'));
    await expect(saveTextFile('b.csv', 'text/csv', 'a,b')).resolves.toBe('downloaded');
    expect(click).toHaveBeenCalledTimes(2);
  });
});

describe('isStandaloneApp', () => {
  it('detects display-mode standalone and the iOS navigator flag', () => {
    mockStandalone(true);
    expect(isStandaloneApp()).toBe(true);
    mockStandalone(false);
    expect(isStandaloneApp()).toBe(false);
    Object.defineProperty(navigator, 'standalone', { value: true, configurable: true });
    expect(isStandaloneApp()).toBe(true);
    Object.defineProperty(navigator, 'standalone', { value: undefined, configurable: true });
  });
});
