/**
 * Polls a condition until it returns true or the timeout elapses.
 * Returns true if the condition was met, false if the timeout expired.
 */
export async function pollUntil(
    condition: () => Promise<boolean>,
    options: { intervalMs: number; timeoutMs: number }
): Promise<boolean> {
    const deadline = Date.now() + options.timeoutMs;
    while (Date.now() < deadline) {
        if (await condition()) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, options.intervalMs));
    }
    return false;
}
