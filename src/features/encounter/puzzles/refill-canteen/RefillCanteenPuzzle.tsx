import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PuzzleType, type PuzzleOption, type PuzzleProps, type RefillCanteenData } from '../../../../types/adventure.types';
import { playSfx } from '../../../../components/audio/audio.utils';
import { calculateNextSum, formatActionLabel, isPuzzleSolved } from './RefillCanteenEngine';
import { PrimaryButton } from '../../../../components/ui/PrimaryButton';
import styles from './RefillCanteenPuzzle.module.css';

const getIconForOption = (option: number | PuzzleOption): string => {
    if (typeof option === 'number') {
        return option < 0 ? '🫗' : '💧';
    }
    return option.type === 'MULTIPLY' ? '🌊' : '💧';
};

export const RefillCanteenPuzzle = ({ data, onSolve }: PuzzleProps) => {
    const puzzleData = (data as RefillCanteenData) || { targetValue: 1, options: [] };
    const [currentSum, setCurrentSum] = useState(0);
    const [isSolved, setIsSolved] = useState(false);
    const [usedOptions, setUsedOptions] = useState<number[]>([]);
    const [lastAction, setLastAction] = useState<{ label: string; id: number } | null>(null);
    const actionIdCounter = useRef(0);
    const { t } = useTranslation();

    const target = puzzleData.targetValue;
    const progress = currentSum >= target ? (currentSum > target ? 100 : 90) : (currentSum / target) * 90;
    const isOverfilled = currentSum > target;

    useEffect(() => {
        if (lastAction) {
            const timer = setTimeout(() => setLastAction(null), 1000);
            return () => clearTimeout(timer);
        }
    }, [lastAction]);

    if (!data || data.puzzleType !== PuzzleType.REFILL_CANTEEN) {
        console.error(`Invalid puzzle data passed to RefillCanteenPuzzle: ${data?.puzzleType}`);
        return null;
    }

    if (typeof onSolve !== 'function') {
        console.error('onSolve is not a function in RefillCanteenPuzzle');
        return null;
    }

    const handlePipeClick = (option: number | PuzzleOption, index: number) => {
        if (isSolved || usedOptions.includes(index)) {
            return;
        }

        playSfx('puzzle/pouring-water');
        const nextSum = calculateNextSum(currentSum, option);
        const actionLabel = formatActionLabel(option);

        setCurrentSum(nextSum);
        setUsedOptions(prev => [...prev, index]);
        setLastAction({ label: actionLabel, id: actionIdCounter.current++ });

        if (isPuzzleSolved(nextSum, target) && !isSolved) {
            setIsSolved(true);
            playSfx('puzzle/magical-success');
            setTimeout(() => {
                onSolve();
            }, 2000);
        }
    };

    const handleReset = () => {
        if (isSolved) {
            return;
        }
        setCurrentSum(0);
        setUsedOptions([]);
    };

    return (
        <div className={styles.layout}>
            <div className={styles.boardContent}>
                {/* Canteen Visual */}
                <div className={styles.canteenWrapper}>
                    {/* Target value on the left, level with the target line */}
                    <div className={styles.targetIndicator}>
                        <div className={styles.targetValue}>{target}</div>
                    </div>

                    <div className={`${styles.canteenContainer} ${isOverfilled ? styles.overfilled : ''}`}>
                        <div className={styles.canteenNeck} />
                        <div className={styles.canteenBody}>
                            <div
                                className={`${styles.liquid} ${isSolved && !isOverfilled ? styles.solved : ''}`}
                                style={{ height: `${progress}%` }}
                            >
                                <div className={styles.waves}></div>
                            </div>

                            {/* Target line showing where water should reach - at 90% height */}
                            <div className={styles.targetLine}>
                                <div className={styles.targetLineDash}></div>
                            </div>

                            <div className={styles.currentValueOverlay}>
                                {currentSum}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Water Sources (Scoops) */}
                <div className={styles.waterSourceGrid}>
                    {puzzleData.options.map((option, idx) => {
                        const label = formatActionLabel(option);
                        const icon = getIconForOption(option);
                        const isUsed = usedOptions.includes(idx);

                        return (
                            <button
                                key={`${idx}`}
                                data-testid={`scoop-option-${idx}`}
                                className={`${styles.scoop} ${isUsed ? styles.used : ''}`}
                                onClick={() => handlePipeClick(option, idx)}
                                disabled={isSolved || isUsed}
                            >
                                <div className={styles.scoopIcon}>{isUsed ? '✅' : icon}</div>
                                <div className={styles.scoopValue}>{label}</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Feedback Animations */}
            {lastAction && (
                <div
                    key={lastAction.id}
                    className={styles.floatText}
                >
                    {lastAction.label}
                </div>
            )}

            {/* Reset Button or Success Message */}
            <div className={styles.controls}>
                {!isSolved && (
                    <PrimaryButton
                        onClick={handleReset}
                    >
                        {t('common.start_over', 'Start Over')}
                    </PrimaryButton>
                )}
            </div>
        </div>
    );
};
