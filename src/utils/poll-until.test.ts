import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { pollUntil } from './poll-until';

describe('pollUntil', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return true immediately when condition is met on first call', async () => {
        const condition = vi.fn().mockResolvedValue(true);

        const result = await pollUntil(condition, { intervalMs: 100, timeoutMs: 1000 });

        expect(result).toBe(true);
        expect(condition).toHaveBeenCalledTimes(1);
    });

    it('should return true after condition becomes true on a subsequent poll', async () => {
        const condition = vi.fn()
            .mockResolvedValueOnce(false)
            .mockResolvedValueOnce(true);

        const promise = pollUntil(condition, { intervalMs: 100, timeoutMs: 1000 });
        await vi.runAllTimersAsync();

        expect(await promise).toBe(true);
        expect(condition).toHaveBeenCalledTimes(2);
    });

    it('should return false when the condition is never met before timeout', async () => {
        const condition = vi.fn().mockResolvedValue(false);

        const promise = pollUntil(condition, { intervalMs: 100, timeoutMs: 500 });
        await vi.runAllTimersAsync();

        expect(await promise).toBe(false);
    });

    it('should not poll again after condition returns true', async () => {
        const condition = vi.fn()
            .mockResolvedValueOnce(false)
            .mockResolvedValueOnce(true)
            .mockResolvedValue(false);

        const promise = pollUntil(condition, { intervalMs: 100, timeoutMs: 5000 });
        await vi.runAllTimersAsync();

        expect(await promise).toBe(true);
        expect(condition).toHaveBeenCalledTimes(2);
    });
});
