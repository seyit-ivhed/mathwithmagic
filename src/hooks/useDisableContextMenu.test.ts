import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDisableContextMenu } from './useDisableContextMenu';

describe('useDisableContextMenu', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should add a contextmenu event listener on mount', () => {
        const addSpy = vi.spyOn(document, 'addEventListener');
        renderHook(() => useDisableContextMenu());

        expect(addSpy).toHaveBeenCalledWith('contextmenu', expect.any(Function));
    });

    it('should remove the contextmenu event listener on unmount', () => {
        const removeSpy = vi.spyOn(document, 'removeEventListener');
        const { unmount } = renderHook(() => useDisableContextMenu());

        unmount();

        expect(removeSpy).toHaveBeenCalledWith('contextmenu', expect.any(Function));
    });

    it('should prevent default on contextmenu event', () => {
        renderHook(() => useDisableContextMenu());

        const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
        const prevented = !document.dispatchEvent(event);

        expect(prevented).toBe(true);
    });
});
