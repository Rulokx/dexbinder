import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom does not implement these; stub so components can call them safely.
if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  if (!URL.createObjectURL) {
    URL.createObjectURL = vi.fn(() => 'blob:fake');
  }
  if (!URL.revokeObjectURL) {
    URL.revokeObjectURL = vi.fn();
  }
}

afterEach(() => {
  cleanup();
  // Build-tool tests run in the node environment, which has no localStorage.
  if (typeof localStorage !== 'undefined') localStorage.clear();
  vi.restoreAllMocks();
});
