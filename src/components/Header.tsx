import type { ReactNode } from 'react';
import SettingsMenu from './SettingsMenu';
import styles from './Header.module.css';

interface HeaderProps {
    leftIcon?: ReactNode;
    onLeftClick?: () => void;
    leftAriaLabel?: string;
    title?: string | ReactNode;
    rightContent?: ReactNode;
    className?: string;
}

export const Header: React.FC<HeaderProps> = ({
    leftIcon,
    onLeftClick,
    leftAriaLabel = 'Back',
    title,
    rightContent,
    className = ''
}) => {
    return (
        <header className={`${styles.header} ${className}`}>
            <div className={styles.leftSection}>
                {leftIcon && onLeftClick && (
                    <button
                        className={styles.iconButton}
                        onClick={onLeftClick}
                        aria-label={leftAriaLabel}
                        title={leftAriaLabel}
                    >
                        {leftIcon}
                    </button>
                )}
            </div>

            {title && (
                <div className={styles.centerSection}>
                    {typeof title === 'string' ? (
                        <h1 className={styles.title}>{title}</h1>
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
