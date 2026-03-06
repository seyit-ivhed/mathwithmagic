import type { ReactNode } from 'react';
import SettingsMenu from './SettingsMenu';
import { DebugTapTarget } from './DebugTapTarget';
import { playSfx } from './audio/audio.utils';
import styles from './Header.module.css';

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
    return (
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
                        <DebugTapTarget onTap={onTitleClick}>
                            <h1
                                className={styles.title}
                                data-testid={titleTestId}
                            >{title}</h1>
                        </DebugTapTarget>
                    ) : (
                        title
                    )}
                </div>
            )}

            <div className={styles.rightSection}>
                {rightContent !== undefined ? rightContent : <SettingsMenu />}
            </div>
        </header>
    );
};
