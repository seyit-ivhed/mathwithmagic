import { type ReactNode, useState, useRef, useCallback, useEffect } from 'react';
import SettingsMenu from './SettingsMenu';
import { DebugConsole } from './DebugConsole';
import { playSfx } from './audio/audio.utils';
import styles from './Header.module.css';

const DEBUG_TAP_THRESHOLD = 7;
const DEBUG_TAP_WINDOW_MS = 1500;

interface HeaderProps {
    leftIcon?: ReactNode;
    onLeftClick?: () => void;
    leftAriaLabel?: string;
    leftTestId?: string;
    title?: string | ReactNode;
    titleTestId?: string;
    onTitleClick?: () => void;
    rightContent?: ReactNode;
    className?: string;
}

export const Header: React.FC<HeaderProps> = ({
    leftIcon,
    onLeftClick,
    leftAriaLabel,
    leftTestId,
    title,
    titleTestId,
    onTitleClick,
    rightContent,
    className = ''
}) => {
    const [isDebugOpen, setIsDebugOpen] = useState(false);
    const tapCountRef = useRef(0);
    const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
        };
    }, []);

    const handleTitleClick = useCallback(() => {
        onTitleClick?.();
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
    }, [onTitleClick]);

    return (
        <>
            <header className={`${styles.header} ${className}`}>
                <div className={styles.leftSection}>
                    {leftIcon && onLeftClick && (
                        <button
                            className={styles.iconButton}
                            onClick={() => {
                                playSfx('interface/click');
                                onLeftClick();
                            }}
                            aria-label={leftAriaLabel}
                            title={leftAriaLabel}
                            data-testid={leftTestId}
                        >
                            {leftIcon}
                        </button>
                    )}
                </div>

                {title && (
                    <div className={styles.centerSection}>
                        {typeof title === 'string' ? (
                            <h1
                                className={styles.title}
                                data-testid={titleTestId}
                                onClick={handleTitleClick}
                            >{title}</h1>
                        ) : (
                            title
                        )}
                    </div>
                )}

                <div className={styles.rightSection}>
                    {rightContent !== undefined ? rightContent : <SettingsMenu />}
                </div>
            </header>

            {isDebugOpen && (
                <DebugConsole onClose={() => setIsDebugOpen(false)} />
            )}
        </>
    );
};
