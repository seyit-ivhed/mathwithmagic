import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MirrorEngine } from './MirrorEngine';
import styles from './MirrorPuzzle.module.css';
import { PuzzleType, type PuzzleProps, type MirrorData, type MirrorGridCell } from '../../../../types/adventure.types';
import { playSfx } from '../../../../components/audio/audio.utils';

const ANIMATION_DURATION_MS = 600;
const ROTATION_MIDPOINT_MS = 300;
const VICTORY_DELAY_MS = 2000;

export const MirrorPuzzle = ({ data, onSolve }: PuzzleProps) => {
    const { t } = useTranslation();
    const puzzleData = useMemo(() => (data as MirrorData) || { targetValue: 0, leftOptions: [], rightOptions: [], selectedRunes: [] }, [data]);
    const gridSize = puzzleData.targetValue || 0;
    const [leftPattern, setLeftPattern] = useState<MirrorGridCell[]>([]);
    const [rightPattern, setRightPattern] = useState<MirrorGridCell[]>([]);
    const [isSolved, setIsSolved] = useState(false);
    const [rotatingCell, setRotatingCell] = useState<{ x: number, y: number } | null>(null);

    useEffect(() => {
        setLeftPattern(puzzleData.leftOptions || []);
        setRightPattern(puzzleData.rightOptions || []);
    }, [puzzleData]);

    if (!data || data.puzzleType !== PuzzleType.MIRROR) {
        console.error(`Invalid puzzle data passed to MirrorPuzzle: ${data?.puzzleType}`);
        return null;
    }

    if (typeof onSolve !== 'function') {
        console.error('onSolve is not a function in MirrorPuzzle');
        return null;
    }

    const handleCellClick = (x: number, y: number) => {
        if (isSolved || rotatingCell) {
            return;
        }

        setRotatingCell({ x, y });
        playSfx('puzzle/rotating-stone');

        setTimeout(() => {
            const updatedRight = MirrorEngine.rotateCell(rightPattern, x, y);
            setRightPattern(updatedRight);

            if (MirrorEngine.checkSolution(leftPattern, updatedRight, gridSize)) {
                setIsSolved(true);
                setTimeout(() => onSolve(), VICTORY_DELAY_MS);
                playSfx('puzzle/magical-success');
            }
        }, ROTATION_MIDPOINT_MS);

        setTimeout(() => setRotatingCell(null), ANIMATION_DURATION_MS);
    };

    const renderGrid = (pattern: MirrorGridCell[], isInteractive: boolean) => {
        const cells = [];
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const cell = pattern.find(c => c.x === x && c.y === y);
                if (!cell) {
                    continue;
                }

                const isCurrentlyRotating = isInteractive && rotatingCell?.x === x && rotatingCell?.y === y;
                const runeSrc = puzzleData.selectedRunes[cell.runeIndex];

                cells.push(
                    <div
                        key={`${x}-${y}`}
                        data-testid={`mirror-cell-${isInteractive ? 'right' : 'left'}-${x}-${y}`}
                        className={`${styles.cell} ${isInteractive ? styles.interactive : ''} ${isCurrentlyRotating ? styles.rotating : ''}`}
                        onClick={isInteractive ? () => handleCellClick(x, y) : undefined}
                    >
                        {runeSrc && (
                            <img
                                src={runeSrc}
                                alt={t('puzzle.mirror.rune_alt', 'rune')}
                                className={styles.rune}
                                draggable={false}
                            />
                        )}
                    </div>
                );
            }
        }
        return (
            <div className={`${styles.grid} ${isInteractive ? styles.rightSide : styles.leftSide}`} style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
                {cells}
            </div>
        );
    };

    return (
        <div className={`${styles.container} ${isSolved ? styles.solved : ''}`} data-testid="mirror-puzzle-container">
            <div className={`${styles.puzzleBoard} ${isSolved ? styles.solved : ''}`}>
                <div className={styles.side}>
                    <h3 data-testid="mirror-pattern-title">{t('puzzle.mirror.pattern_title', 'Pattern')}</h3>
                    {renderGrid(leftPattern, false)}
                </div>
                <div className={styles.divider} />
                <div className={styles.side}>
                    <h3 data-testid="mirror-mirror-title">{t('puzzle.mirror.mirror_title', 'Mirror')}</h3>
                    {renderGrid(rightPattern, true)}
                </div>
            </div>
        </div>
    );
};
