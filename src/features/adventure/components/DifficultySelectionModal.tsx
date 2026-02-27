import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Star, ChevronDown } from 'lucide-react';
import { FormCloseButton } from '../../../components/ui/FormCloseButton';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { DifficultyExamples } from '../../../components/ui/DifficultyExamples';
import styles from './DifficultySelectionModal.module.css';

interface DifficultySelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (difficulty: number) => void;
    title: string;
    initialDifficulty: number;
}

export const DifficultySelectionModal: React.FC<DifficultySelectionModalProps> = ({
    isOpen,
    onClose,
    onStart,
    title,
    initialDifficulty
}) => {
    const { t } = useTranslation();
    const [selectedDifficulty, setSelectedDifficulty] = useState(initialDifficulty);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [hoveredDifficulty, setHoveredDifficulty] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isOpen) {
        return null;
    }

    const difficulties = [1, 2, 3];

    const getDifficultyLabel = (level: number) => {
        switch (level) {
            case 1: return t('difficulty.apprentice');
            case 2: return t('difficulty.scout');
            case 3: return t('difficulty.adventurer');
            default: return '';
        }
    };

    const getDifficultyDescription = (level: number) => {
        switch (level) {
            case 1: return t('difficulty.desc_1');
            case 2: return t('difficulty.desc_2');
            case 3: return t('difficulty.desc_3');
            default: return '';
        }
    };


    const displayDifficulty = hoveredDifficulty ?? selectedDifficulty;

    return createPortal(
        <div className={styles.modalOverlay} data-testid="difficulty-modal">
            <div className={styles.modalContent}>
                <FormCloseButton onClick={onClose} size={32} />

                <h2 className={styles.modalTitle}>
                    {title}
                </h2>

                <div className={styles.selectionContainer}>
                    <div
                        className={styles.customDropdown}
                        ref={dropdownRef}
                        onMouseEnter={() => !isDropdownOpen && setHoveredDifficulty(selectedDifficulty)}
                        onMouseLeave={() => !isDropdownOpen && setHoveredDifficulty(null)}
                        data-testid="difficulty-dropdown"
                    >
                        <div
                            className={`${styles.dropdownHeader} ${isDropdownOpen ? styles.dropdownHeaderOpen : ''}`}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <div className={styles.selectedValue}>
                                <span className={styles.difficultyName}>{getDifficultyLabel(selectedDifficulty)}</span>
                                <div className={styles.starsMini}>
                                    {[...Array(selectedDifficulty)].map((_, i) => (
                                        <Star key={i} size={24} fill="#ffa502" color="#ffa502" />
                                    ))}
                                </div>
                            </div>
                            <ChevronDown size={32} className={`${styles.arrow} ${isDropdownOpen ? styles.arrowRotated : ''}`} />
                        </div>

                        {isDropdownOpen && (
                            <div className={styles.dropdownList}>
                                {difficulties.map((level) => (
                                    <div
                                        key={level}
                                        className={`${styles.dropdownItem} ${selectedDifficulty === level ? styles.dropdownItemSelected : ''}`}
                                        onClick={() => {
                                            setSelectedDifficulty(level);
                                            setIsDropdownOpen(false);
                                            setHoveredDifficulty(null);
                                        }}
                                        onMouseEnter={() => setHoveredDifficulty(level)}
                                        onMouseLeave={() => setHoveredDifficulty(null)}
                                        data-testid={`difficulty-dropdown-option-${level}`}
                                    >
                                        <div className={styles.itemContent}>
                                            <span className={styles.itemLabel}>{getDifficultyLabel(level)}</span>
                                            <div className={styles.itemStars}>
                                                {[...Array(level)].map((_, i) => (
                                                    <Star key={i} size={20} fill="#ffa502" color="#ffa502" />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={styles.explanationBox}>
                        <div className={styles.explanationContent}>
                            <div>
                                <p className={styles.explanationText}>
                                    {getDifficultyDescription(displayDifficulty)}
                                </p>
                            </div>
                            <div className={styles.explanationRight}>
                                <DifficultyExamples level={displayDifficulty} limit={3} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <PrimaryButton
                        data-testid="difficulty-start-btn"
                        onClick={() => onStart(selectedDifficulty)}
                    >
                        {t('difficulty.start')}
                    </PrimaryButton>
                </div>
            </div>
        </div>,
        document.body
    );
};
