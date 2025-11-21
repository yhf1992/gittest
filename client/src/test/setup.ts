import { expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Setup fetch mock for all tests
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});