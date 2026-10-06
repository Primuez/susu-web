/**
 * @vitest-environment jsdom
 *
 * The first acceptance criterion of SUSU-LABS/susu-web#8: rendering a
 * component with a malformed amount shows an inline unavailable state, not an
 * empty document.
 *
 * The real `IndexedGroupCard` is rendered rather than a stand-in, because its
 * own render path is where the throw used to happen — a test of a mock would
 * keep passing even if this call site regressed. The DOM is required because
 * "the document still renders" is the claim.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IndexedGroupCard } from './IndexedGroupCard';
import type { GroupSummary } from '@/lib/api/groups';
import { AMOUNT_UNAVAILABLE } from '@/lib/susu/amounts';

declare global {
  /** See the note in error-boundary.test.tsx. */
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

/** A group exactly as the index might send one, except for the amount. */
function groupReporting(contributionAmount: string): GroupSummary {
  return {
    contractId: 'CDFWHQGVJXCKFUZLQ2J4C4S3Q5P6R7T8V9W0X1Y2Z3A4B5C6D7E8F9G0H',
    factoryContractId: 'CFACTORYXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    groupId: 12,
    creator: 'CCREATORXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    token: 'USDC',
    contributionAmount,
    memberCapacity: 10,
    createdLedger: 4_100_000,
    status: 'open',
    memberCount: 3,
    currentRound: 1,
    completedRounds: 0,
    contributedTotal: '0',
    paidOutTotal: '0',
    feeTotal: '0',
    lastEventLedger: 4_100_050,
  };
}

describe('a card whose amount the index malformed', () => {
  it.each(['12.5', '', 'abc'])(
    'renders "%s" as the unavailable marker, inline, without blanking the document',
    async (contributionAmount) => {
      const router = createMemoryRouter(
        [{ path: '/', element: <IndexedGroupCard group={groupReporting(contributionAmount)} /> }],
        { initialEntries: ['/'] },
      );

      await act(async () => {
        root.render(<RouterProvider router={router} />);
      });

      const text = document.body.textContent ?? '';
      // The figure's slot says "unavailable"...
      expect(text).toContain(`${AMOUNT_UNAVAILABLE} USDC`);
      // ...and everything else about the card is still there, so the document
      // did not go blank and no figure was invented in its place.
      expect(text).toContain('per round');
      expect(text).toContain('Waiting for 7 more');
      expect(text.trim()).not.toBe('');
    },
  );
});
