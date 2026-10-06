// @vitest-environment jsdom

import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getTransactionReceipt } from './groups';
import {
  isReceiptAbsent,
  RECEIPT_MAX_POLLS,
  transactionReceiptQueryOptions,
  type ReceiptPollTracker,
} from './hooks';

vi.mock('./groups', async () => {
  const actual = await vi.importActual<typeof import('./groups')>('./groups');
  return { ...actual, getTransactionReceipt: vi.fn() };
});

const HASH = 'a'.repeat(64);
const POLL_INTERVAL_MS = 5_000;

describe('transaction receipt polling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(getTransactionReceipt).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stops after the missing-receipt budget and reports the receipt absent', async () => {
    const missing = Object.assign(new Error('not indexed'), { status: 404 });
    vi.mocked(getTransactionReceipt).mockRejectedValue(missing);

    const tracker: ReceiptPollTracker = { hash: HASH, missingCount: 0 };
    const client = new QueryClient();
    const observer = new QueryObserver(client, transactionReceiptQueryOptions(HASH, tracker));
    const unsubscribe = observer.subscribe(() => undefined);

    await vi.waitFor(() => expect(getTransactionReceipt).toHaveBeenCalledTimes(1));

    for (let poll = 1; poll < RECEIPT_MAX_POLLS; poll += 1) {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    }

    expect(getTransactionReceipt).toHaveBeenCalledTimes(RECEIPT_MAX_POLLS);
    expect(tracker.missingCount).toBe(RECEIPT_MAX_POLLS);
    expect(
      isReceiptAbsent(observer.getCurrentResult().error, observer.getCurrentResult().data, tracker),
    ).toBe(true);

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3);
    expect(getTransactionReceipt).toHaveBeenCalledTimes(RECEIPT_MAX_POLLS);

    unsubscribe();
    client.clear();
  });
});
