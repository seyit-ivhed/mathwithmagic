import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PuzzleType, type PuzzleProps, type BalanceData, type Weight } from '../../../../types/adventure.types';
import {
    calculateTotalWeight,
    validateBalance
} from './BalanceEngine';
import styles from './BalancePuzzle.module.css';
import { PrimaryButton } from '../../../../components/ui/PrimaryButton';
import { playSfx } from '../../../../components/audio/audio.utils';

const SUCCESS_DISPLAY_DURATION_MS = 3000;
const ARM_OFFSET_HEAVY = '100px';
const ARM_OFFSET_LIGHT = '40px';
const ARM_OFFSET_BALANCED = '70px';

export const BalancePuzzle = ({ data, onSolve }: PuzzleProps) => {
    const { t } = useTranslation();
    const initialData = (data as BalanceData) || { leftStack: [], rightStack: [] };

    const [leftStack, setLeftStack] = useState<Weight[]>(initialData.leftStack || []);
    const [rightStack, setRightStack] = useState<Weight[]>(initialData.rightStack || []);
    const [isSolved, setIsSolved] = useState(false);

    const leftTotal = calculateTotalWeight(leftStack);
    const rightTotal = calculateTotalWeight(rightStack);
    const prevBalance = useRef<'left' | 'right' | 'equal' | null>(null);

    useEffect(() => {
        const currentBalance = leftTotal > rightTotal ? 'left' : leftTotal < rightTotal ? 'right' : 'equal';

        if (prevBalance.current !== null && prevBalance.current !== currentBalance) {
            playSfx('puzzle/chains');
        }

        prevBalance.current = currentBalance;
    }, [leftTotal, rightTotal]);

    if (!data || data.puzzleType !== PuzzleType.BALANCE) {
        console.error(`Invalid puzzle data passed to BalancePuzzle: ${data?.puzzleType}`);
        return null;
    }

    if (typeof onSolve !== 'function') {
        console.error('onSolve is not a function in BalancePuzzle');
        return null;
    }

    const handleRemoveWeight = (side: 'left' | 'right', weightId: string) => {
        if (isSolved) {
            return;
        }

        playSfx('interface/click');
        if (side === 'left') {
            const next = leftStack.filter(w => w.id !== weightId);
            setLeftStack(next);
            checkSolution(next, rightStack);
        } else {
            const next = rightStack.filter(w => w.id !== weightId);
            setRightStack(next);
            checkSolution(leftStack, next);
        }
    };

    const checkSolution = (l: Weight[], r: Weight[]) => {
        if (validateBalance(l, r)) {
            setIsSolved(true);
            playSfx('puzzle/magical-success');

            setTimeout(() => {
                onSolve();
            }, SUCCESS_DISPLAY_DURATION_MS);
        }
    };

    const handleReset = () => {
        if (isSolved) {
            return;
        }
        setLeftStack(initialData.leftStack);
        setRightStack(initialData.rightStack);
    };

    // Check if all removable stones are gone
    const hasRemovableStones = [...leftStack, ...rightStack].some(w => !w.isHeavy);

    const greekSymbols = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ'];

    return (
        <div className={`${styles.container} ${isSolved ? styles.solved : ''}`} data-testid="balance-puzzle-container">
            <div className={`${styles.puzzleBoard} ${isSolved ? styles.solved : ''}`}>
                <div className={styles.greekGrid}>
                    {greekSymbols.map((symbol, index) => (
                        <div
                            key={index}
                            className={`${styles.greekSymbol} ${isSolved ? styles.glowing : ''}`}
                        >
                            {symbol}
                        </div>
                    ))}
                </div>

                <div className={styles.platesContainer}>
                    {/* Left Scale Arm */}
                    <div
                        className={`${styles.scaleArm} ${styles.leftArm}`}
                        style={{
                            transform: `translateY(${leftTotal > rightTotal ? ARM_OFFSET_HEAVY : leftTotal < rightTotal ? ARM_OFFSET_LIGHT : ARM_OFFSET_BALANCED})`
                        }}
                    >
                        <div className={styles.chain} />
                        <div className={styles.chain} />
                        <div className={styles.weightStack}>
                            {leftStack.map((weight) => (
                                <WeightComponent
                                    key={weight.id}
                                    weight={weight}
                                    side="left"
                                    onRemove={handleRemoveWeight}
                                    disabled={isSolved}
                                />
                            ))}
                        </div>
                        <div className={styles.plateInfo}>
                            {leftTotal}
                        </div>
                    </div>

                    {/* Right Scale Arm */}
                    <div
                        className={`${styles.scaleArm} ${styles.rightArm}`}
                        style={{
                            transform: `translateY(${rightTotal > leftTotal ? ARM_OFFSET_HEAVY : rightTotal < leftTotal ? ARM_OFFSET_LIGHT : ARM_OFFSET_BALANCED})`
                        }}
                    >
                        <div className={styles.chain} />
                        <div className={styles.chain} />
                        <div className={styles.weightStack}>
                            {rightStack.map((weight) => (
                                <WeightComponent
                                    key={weight.id}
                                    weight={weight}
                                    side="right"
                                    onRemove={handleRemoveWeight}
                                    disabled={isSolved}
                                />
                            ))}
                        </div>
                        <div className={styles.plateInfo}>
                            {rightTotal}
                        </div>
                    </div>
                </div>

                {/* Controls/Status */}
                <div className={styles.controls}>
                    {isSolved ? null : (
                        <div className={styles.resetWrapper}>
                            <PrimaryButton
                                onClick={handleReset}
                                data-testid="puzzle-reset-button"
                                variant={!hasRemovableStones ? 'gold' : 'primary'}
                                radiate={!hasRemovableStones}
                            >
                                {t('common.start_over', 'Start Over')}
                            </PrimaryButton>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface WeightComponentProps {
    weight: Weight;
    side: 'left' | 'right';
    onRemove: (side: 'left' | 'right', id: string) => void;
    disabled: boolean;
}

const WeightComponent = ({ weight, side, onRemove, disabled }: WeightComponentProps) => {
    return (
        <div
            data-testid={`weight-${side}-${weight.id}`}
            className={`${styles.weight} ${weight.isHeavy ? styles.heavyWeight : ''} ${disabled ? styles.disabled : ''} ${styles.weightEntering}`}
            onClick={() => {
                if (!weight.isHeavy && !disabled) {
                    onRemove(side, weight.id);
                }
            }}
        >
            {weight.value}
        </div>
    );
};
