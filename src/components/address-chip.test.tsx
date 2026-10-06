import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AddressChip } from './ui';

/** The Factory contract address, recorded in .env.example (56 chars). */
const FACTORY = 'CCC7KAX4V4GJD6FVG6GSYQ4I2D2B3CWEOQMIX6YM4QBGXTA6INCGRUYC';

describe('AddressChip', () => {
  it('exposes the full address as the accessible name, not the truncated fragment', () => {
    const raw = renderToString(<AddressChip value={FACTORY} />);
    const html = raw.replace(/<!--.*?-->/g, '');

    // The accessible name is the whole 56-character address so assistive tech receives the full identity-critical value (#11)
    expect(html).toContain(`aria-label="${FACTORY}"`);
    expect(FACTORY).toHaveLength(56);

    // The visual fragment stays on screen, but is marked aria-hidden="true" so screen readers avoid contradiction
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain(`${FACTORY.slice(0, 6)}…${FACTORY.slice(-4)}`);

    // Title attribute is preserved for pointer/mouse users
    expect(html).toContain(`title="${FACTORY}"`);
  });

  it('still renders the label when one is given without disturbing the accessible name', () => {
    const html = renderToString(<AddressChip value={FACTORY} label="Factory" />);

    expect(html).toContain('Factory');
    expect(html).toContain(`aria-label="${FACTORY}"`);
  });

  it('renders a copy-to-clipboard button with accessible label and status region', () => {
    const html = renderToString(<AddressChip value={FACTORY} />);

    // Copy affordance for touch and keyboard users
    expect(html).toContain('button type="button"');
    expect(html).toContain('aria-label="Copy address"');

    // Live status region for screen reader announcement
    expect(html).toContain('role="status"');
    expect(html).toContain('class="sr-only"');
  });
});
