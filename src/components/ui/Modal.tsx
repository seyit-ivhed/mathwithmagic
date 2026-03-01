import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FormCloseButton } from './FormCloseButton';
import styles from './Modal.module.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    testId?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, testId }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    return createPortal(
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} ref={modalRef} data-testid={testId}>
                <FormCloseButton onClick={onClose} size={32} />
                <h2 className={styles.modalTitle}>{title}</h2>
                {children}
            </div>
        </div>,
        document.body
    );
};
