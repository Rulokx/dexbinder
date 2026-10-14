import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Plugin } from 'vite';

/** Files from the build that belong in the offline app shell. */
const SHELL_EXTENSIONS = /\.(html|js|css|webmanifest|png|svg|ico)$/i;

/**
 * Sorted, de-duplicated list of same-origin URLs (relative to the service
 * worker) to precache. Source maps and the service worker itself are excluded.
 */
export function buildPrecacheList(bundleFiles: string[], publicFiles: string[]): string[] {
  const all = [...bundleFiles, ...publicFiles]
    // Normalise Windows separators so a build on Rulok's PC produces valid URLs.
    .map((f) => f.replace(/\\/g, '/').replace(/^\.?\//, ''))
    .filter((f) => SHELL_EXTENSIONS.test(f) && f !== 'sw.js');
  return [...new Set(all)].sort();
}

/** Small deterministic hash (FNV-1a, 32-bit) — enough to version the cache. */
export function hashString(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Fill the service-worker template. The version changes whenever any hashed
 * file name or index.html changes, so each deploy gets a fresh cache.
 */
export function renderServiceWorker(template: string, precache: string[], indexHtml = ''): string {
  if (!template.includes("'__PRECACHE_MANIFEST__'") || !template.includes('__CACHE_VERSION__')) {
    throw new Error('Service worker template is missing its placeholders.');
  }
  const version = hashString(precache.join('\n') + '\n' + indexHtml);
  return template
    .replace("'__PRECACHE_MANIFEST__'", JSON.stringify(precache))
    .replace('__CACHE_VERSION__', version);
}

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

/**
 * Vite plugin: emits `sw.js` next to index.html in production builds.
 * No third-party PWA dependency needed for a shell this small.
 */
export function pwaPlugin(options: { template: string; publicDir: string }): Plugin {
  return {
    name: 'dexbinder-pwa',
    apply: 'build',
    // Run after Vite has emitted index.html so it lands in the precache list.
    enforce: 'post',
    generateBundle(_outputOptions, bundle) {
      const template = readFileSync(options.template, 'utf8');
      const publicFiles = listFiles(options.publicDir).map((f) => relative(options.publicDir, f));
      const precache = buildPrecacheList(Object.keys(bundle), publicFiles);
      const indexAsset = bundle['index.html'];
      const indexHtml =
        indexAsset && indexAsset.type === 'asset' ? String(indexAsset.source) : '';
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: renderServiceWorker(template, precache, indexHtml),
      });
    },
  };
}
