import '@testing-library/jest-dom/vitest';
import { defaultFallbackInView } from 'react-intersection-observer';
import { vi } from 'vitest';

// jsdom does not calculate layout, so observed entity tables stay out of view.
defaultFallbackInView(false);

// RdfViewer scrolls to entity tables, but jsdom does not implement scrolling.
Element.prototype.scrollIntoView = vi.fn();

// Radix UI scroll areas rely on ResizeObserver, which jsdom does not implement.
vi.stubGlobal(
  'ResizeObserver',
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);
