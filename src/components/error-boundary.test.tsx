/**
 * @vitest-environment jsdom
 *
 * The boundary is what stands between a render error and a blank document, and
 * server rendering cannot prove it: `renderToString` has no error boundaries —
 * an error during SSR throws straight through them. These run against a real
 * DOM instead, the way a browser does, which is also the only way to assert
 * the thing that matters: what is still on the page after the failure.
 */
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';
import { RouteError } from '@/routes/RouteError';

declare global {
  /**
   * Tells React the renderer is inside a test's `act`, so renders flush
   * synchronously instead of being scheduled. React documents this flag for
   * tests that drive the renderer directly rather than through a helper.
   */
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);

  // React still reports a caught render error through `console.error`, which
  // is correct in an app and noise in a test that expects the throw. Silenced
  // per test and restored afterwards, so a genuine warning still surfaces
  // everywhere else.
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

/** The failure under test: a component that throws during render. */
function Boom(): ReactNode {
  throw new Error('malformed amount in row 4');
}

describe('ErrorBoundary', () => {
  it('passes its children through untouched when nothing has thrown', async () => {
    await act(async () => {
      root.render(
        <ErrorBoundary>
          <p>12.5 USDC</p>
        </ErrorBoundary>,
      );
    });

    expect(container.textContent).toBe('12.5 USDC');
  });

  it('catches a thrown render error and keeps the app shell mounted', async () => {
    await act(async () => {
      root.render(
        <div>
          <header data-testid="shell">Susu Protocol</header>
          <ErrorBoundary>
            <Boom />
          </ErrorBoundary>
        </div>,
      );
    });

    // The shell — and in the real tree, the providers standing behind it —
    // never unmounted...
    expect(document.querySelector('[data-testid="shell"]')?.textContent).toBe('Susu Protocol');
    // ...and the failure became a visible notice rather than an empty document.
    const alert = document.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('could not be displayed');
    expect(document.body.textContent?.trim()).not.toBe('');
  });

  it('re-renders the subtree from the fallback, because a transient throw may pass', async () => {
    // Read during render, reassigned only by the test between renders: a
    // component that mutates closed-over state while rendering is exactly the
    // impurity the linter refuses, and here the flag is scenario, not state.
    let failing = true;
    function Flaky(): ReactNode {
      if (failing) throw new Error('first render fails');
      return <p>second attempt rendered</p>;
    }

    await act(async () => {
      root.render(
        <ErrorBoundary>
          <Flaky />
        </ErrorBoundary>,
      );
    });
    expect(container.textContent).not.toContain('second attempt rendered');

    const retry = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Try again',
    );
    if (retry === undefined) throw new Error('Expected a "Try again" button in the fallback.');

    failing = false;
    await act(async () => {
      retry.click();
    });

    expect(container.textContent).toContain('second attempt rendered');
  });
});

describe('RouteError', () => {
  it('replaces a route that throws while its layout stays mounted', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/app',
          element: (
            <div>
              <nav data-testid="layout">Susu Protocol</nav>
              <Outlet />
            </div>
          ),
          children: [{ index: true, element: <Boom />, errorElement: <RouteError /> }],
        },
      ],
      { initialEntries: ['/app'] },
    );

    await act(async () => {
      root.render(<RouterProvider router={router} />);
    });

    expect(document.querySelector('[data-testid="layout"]')?.textContent).toBe('Susu Protocol');
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      'could not be displayed',
    );
  });
});
