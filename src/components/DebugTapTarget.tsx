import { type ReactNode, useState, useRef, useCallback, useEffect } from 'react';
import { DebugConsole } from './DebugConsole';

const DEBUG_TAP_THRESHOLD = 7;
const DEBUG_TAP_WINDOW_MS = 1500;

interface DebugTapTargetProps {
    children: ReactNode;
    onTap?: () => void;
}

export const DebugTapTarget: React.FC<DebugTapTargetProps> = ({ children, onTap }) => {
    const [isDebugOpen, setIsDebugOpen] = useState(false);
    const tapCountRef = useRef(0);
    const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
        };
    }, []);

    const handleClick = useCallback(() => {
        onTap?.();
        tapCountRef.current += 1;

        if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

        if (tapCountRef.current >= DEBUG_TAP_THRESHOLD) {
            tapCountRef.current = 0;
            setIsDebugOpen(true);
            return;
        }

        tapTimerRef.current = setTimeout(() => {
            tapCountRef.current = 0;
        }, DEBUG_TAP_WINDOW_MS);
    }, [onTap]);

    return (
        <>
            <div onClick={handleClick} style={{ display: 'contents' }}>
                {children}
            </div>
            {isDebugOpen && <DebugConsole onClose={() => setIsDebugOpen(false)} />}
        </>
    );
};
