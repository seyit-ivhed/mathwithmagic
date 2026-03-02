import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LatinSquareEngine } from './LatinSquareEngine';
import styles from './LatinSquarePuzzle.module.css';
import { PuzzleType, type PuzzleProps, type LatinSquareData, type LatinSquareElement } from '../../../../types/adventure.types';
import { playSfx } from '../../../../components/audio/audio.utils';

const ANIMATION_DURATION_MS = 600;
const ROTATION_MIDPOINT_MS = 300;

export const LatinSquarePuzzle: React.FC<PuzzleProps> = ({ data, onSolve }) => {
    const { t } = useTranslation();
    const puzzleData = (data as LatinSquareData) || { grid: [], fixedIndices: [], selectedRunes: [] };
    const [grid, setGrid] = useState<LatinSquareElement[][]>(() => puzzleData.grid || []);
    const fixedIndices = puzzleData.fixedIndices || [];
    const selectedRunes = puzzleData.selectedRunes || [];
    const [isSolved, setIsSolved] = useState(false);
    const [rotatingCell, setRotatingCell] = useState<{ row: number, col: number } | null>(null);

    if (!data || data.puzzleType !== PuzzleType.LATIN_SQUARE) {
        console.error(`Invalid puzzle data passed to LatinSquarePuzzle: ${data?.puzzleType}`);
        return null;
    }

    if (typeof onSolve !== 'function') {
        console.error('onSolve is not a function in LatinSquarePuzzle');
        return null;
    }

    const handleCellClick = (row: number, col: number) => {
        if (isSolved || rotatingCell || fixedIndices.some(idx => idx.row === row && idx.col === col)) {
            return;
        }

        const current = grid[row][col];
        const nextValue = current === null ? 0 : (current + 1) % selectedRunes.length;

        const updateGrid = (val: LatinSquareElement) => {
            const newGrid = grid.map((r, ri) =>
                ri === row ? r.map((c, ci) => ci === col ? val : c) : r
            );

            setGrid(newGrid);

            if (LatinSquareEngine.checkSolution(newGrid)) {
                setIsSolved(true);
                setTimeout(() => onSolve(), 2000);
                playSfx('puzzle/magical-success');
            }
        };

        if (current === null) {
            updateGrid(nextValue);
            playSfx('interface/click');
            return;
        }

        setRotatingCell({ row, col });
        playSfx('puzzle/rotating-stone');

        setTimeout(() => {
            updateGrid(nextValue);
        }, ROTATION_MIDPOINT_MS);

        setTimeout(() => setRotatingCell(null), ANIMATION_DURATION_MS);
    };

    if (grid.length === 0) {
        return null;
    }

    return (
        <div className={styles.container} data-testid="latin-square-container">
            <div className={`${styles.puzzleBoard} ${isSolved ? styles.solvedBoard : ''}`}>
                {grid.map((row, ri) => (
                    <div key={ri} className={styles.row}>
                        {row.map((cell, ci) => {
                            const isFixed = fixedIndices.some(idx => idx.row === ri && idx.col === ci);
                            const isCurrentlyRotating = rotatingCell?.row === ri && rotatingCell?.col === ci;
                            return (
                                <div
                                    key={ci}
                                    data-testid={`latin-cell-${ri}-${ci}`}
                                    className={`${styles.cell} ${isFixed ? styles.fixed : styles.interactive} ${isCurrentlyRotating ? styles.rotating : ''}`}
                                    onClick={() => handleCellClick(ri, ci)}
                                >
                                    {cell !== null && (
                                        <img
                                            src={selectedRunes[cell]}
                                            alt={t('puzzle.mirror.rune_alt', 'rune')}
                                            className={`${styles.rune} ${isSolved ? styles.solvedRune : ''}`}
                                            draggable={false}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};
