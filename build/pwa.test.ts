// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildPrecacheList, hashString, renderServiceWorker } from './pwa';

const template = readFileSync(new URL('./service-worker.js', import.meta.url), 'utf8');

describe('PWA build helpers', () => {
  it('precaches the app shell and nothing else', () => {
    const list = buildPrecacheList(
      ['index.html', 'assets/index-abc.js', 'assets/index-abc.css', 'assets/index-abc.js.map', 'sw.js'],
      // The backslash path is what a Windows build produces.
      ['manifest.webmanifest', 'icons/icon-192.png', 'icons\\apple-touch-icon.png', '.DS_Store'],
    );
    expect(list).toEqual([
      'assets/index-abc.css',
      'assets/index-abc.js',
      'icons/apple-touch-icon.png',
      'icons/icon-192.png',
      'index.html',
      'manifest.webmanifest',
    ]);
  });

  it('renders a service worker with the file list and a content-based version', () => {
    const files = ['index.html', 'assets/index-abc.js'];
    const sw = renderServiceWorker(template, files, '<html>v1</html>');
    expect(sw).toContain('const PRECACHE = ["index.html","assets/index-abc.js"];');
    expect(sw).not.toContain('__CACHE_VERSION__');
    expect(sw).not.toContain('__PRECACHE_MANIFEST__');

    const same = renderServiceWorker(template, files, '<html>v1</html>');
    const changed = renderServiceWorker(template, files, '<html>v2</html>');
    expect(same).toBe(sw);
    expect(changed).not.toBe(sw);
  });

  it('never intercepts cross-origin requests such as card images', () => {
    expect(template).toContain('if (url.origin !== self.location.origin) return;');
  });

  it('hashString is stable and 8 hex characters', () => {
    expect(hashString('dexbinder')).toMatch(/^[0-9a-f]{8}$/);
    expect(hashString('dexbinder')).toBe(hashString('dexbinder'));
    expect(hashString('a')).not.toBe(hashString('b'));
  });

  it('refuses a template without placeholders', () => {
    expect(() => renderServiceWorker('self.x = 1;', [])).toThrow(/placeholders/);
  });
});
