import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDebugCommands } from '../features/debug/hooks/useDebugCommands';
import { FormCloseButton } from './ui/FormCloseButton';
import styles from './DebugConsole.module.css';

interface DebugConsoleProps {
    onClose: () => void;
}

export const DebugConsole: React.FC<DebugConsoleProps> = ({ onClose }) => {
    const [input, setInput] = useState('');
    const { history, handleCommand } = useDebugCommands();
    const inputRef = useRef<HTMLInputElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        if (historyRef.current) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
    }, [history]);

    const onFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleCommand(input);
        setInput('');
    };

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Debug Console</h2>
                    <FormCloseButton onClick={onClose} className={styles.closeButton} />
                </div>
                <div className={styles.history} ref={historyRef}>
                    {history.map((line, i) => (
                        <div key={i} className={styles.logLine}>{line}</div>
                    ))}
                </div>
                <form onSubmit={onFormSubmit} className={styles.inputArea} aria-label="Debug command">
                    <span className={styles.prompt}>$</span>
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.input}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        autoComplete="off"
                        autoCapitalize="off"
                        spellCheck="false"
                    />
                </form>
            </div>
        </div>,
        document.body
    );
};
