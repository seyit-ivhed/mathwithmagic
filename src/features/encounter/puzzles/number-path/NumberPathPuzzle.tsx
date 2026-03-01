import React, { useState, useMemo } from 'react';
import { type PuzzleProps, type NumberPathData } from '../../../../types/adventure.types';
import styles from './NumberPathPuzzle.module.css';
import {
    type CellData,
    type Position,
    findCellPosition,
    calculateSequenceState,
    validateMove
} from './NumberPathEngine';

const SUCCESS_DISPLAY_DURATION_MS = 2000;

export const NumberPathPuzzle: React.FC<PuzzleProps> = ({ data, onSolve }) => {
    const puzzleData = data as NumberPathData;
    const { gridSize = 3, startValue = 1, stepValue = 1, preFilledIndices = [] } = puzzleData;

    const totalCells = gridSize * gridSize;

    const [grid, setGrid] = useState<CellData[][]>(() => {
        const initialGrid: CellData[][] = Array.from({ length: gridSize }, () =>
            Array.from({ length: gridSize }, () => ({ value: null, isFixed: false }))
        );

        preFilledIndices.forEach(({ row, col, value }) => {
            if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
                initialGrid[row][col] = { value, isFixed: true };
            }
        });
        return initialGrid;
    });

    const [isCompleted, setIsCompleted] = useState(false);
    const [shakeCell, setShakeCell] = useState<Position | null>(null);

    const { currentHeadValue, nextExpectedValue } = useMemo(() => {
        return calculateSequenceState(grid, startValue, stepValue);
    }, [grid, startValue, stepValue]);

    const validNextPositions = useMemo(() => {
        if (isCompleted) {
            return [];
        }

        const validPositions: Position[] = [];
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = grid[r][c];
                if (cell.value === null && !cell.isFixed) {
                    if (validateMove(grid, { row: r, col: c }, currentHeadValue, nextExpectedValue, stepValue)) {
                        validPositions.push({ row: r, col: c });
                    }
                }
            }
        }
        return validPositions;
    }, [grid, isCompleted, gridSize, currentHeadValue, nextExpectedValue, stepValue]);

    const triggerShake = (position: Position) => {
        setShakeCell(position);
        setTimeout(() => setShakeCell(null), 300);
    };

    const handleUndo = (clickedValue: number) => {
        setGrid(prev => prev.map(row =>
            row.map(cell => {
                if (cell.value !== null && !cell.isFixed && cell.value >= clickedValue) {
                    return { ...cell, value: null };
                }
                return cell;
            })
        ));
    };

    const handleCellClick = (row: number, col: number) => {
        if (isCompleted) {
            return;
        }

        const cell = grid[row][col];
        if (cell.isFixed) {
            return;
        }

        if (cell.value !== null) {
            handleUndo(cell.value);
            return;
        }

        const isValid = validateMove(
            grid,
            { row, col },
            currentHeadValue,
            nextExpectedValue,
            stepValue
        );

        if (!isValid) {
            triggerShake({ row, col });
            return;
        }

        // Count current filled cells before placing
        const currentFilledCells = grid.flat().filter(c => c.value !== null).length;
        const willBeFilledAfter = currentFilledCells + 1;

        setGrid(prev => prev.map((r, ri) =>
            ri === row ? r.map((c, ci) => ci === col ? { ...c, value: nextExpectedValue } : c) : r
        ));

        // Check if this placement completes the puzzle
        if (willBeFilledAfter === totalCells) {
            setIsCompleted(true);
            setTimeout(onSolve, SUCCESS_DISPLAY_DURATION_MS);
        }
    };

    const svgPathPoints = useMemo(() => {
        const points: string[] = [];
        let currentVal = startValue;

        while (true) {
            const pos = findCellPosition(grid, currentVal);
            if (!pos) {
                break;
            }

            const cellSize = 64;
            const gap = 24;
            const x = pos.col * (cellSize + gap) + (cellSize / 2);
            const y = pos.row * (cellSize + gap) + (cellSize / 2);
            points.push(`${x},${y}`);

            currentVal += stepValue;
        }
        return points.join(' ');
    }, [grid, startValue, stepValue]);

    return (
        <div className={styles.container}>
            <div className={`${styles.puzzleWrapper} ${isCompleted ? styles.completed : ''}`}>
                <div
                    className={styles.grid}
                    style={{ gridTemplateColumns: `repeat(${gridSize}, auto)` }}
                >
                    {grid.map((row, ri) => (
                        <React.Fragment key={ri}>
                            {row.map((cell, ci) => {
                                const isNextPossible = validNextPositions.some(p => p.row === ri && p.col === ci);
                                return (
                                    <div
                                        key={`${ri}-${ci}`}
                                        data-testid={`numberpath-cell-${ri}-${ci}`}
                                        className={`
                                                ${styles.cell} 
                                                ${cell.value !== null ? styles.filled : ''}
                                                ${cell.isFixed ? styles.fixed : ''}
                                                ${cell.value === currentHeadValue && !isCompleted ? styles.lastPlaced : ''}
                                                ${isNextPossible ? styles.nextPossible : ''}
                                                ${shakeCell?.row === ri && shakeCell?.col === ci ? styles.invalid : ''}
                                            `}
                                        onClick={() => handleCellClick(ri, ci)}
                                    >
                                        {cell.value !== null ? cell.value : (isNextPossible ? <span className={styles.blinkingNumber}>{nextExpectedValue}</span> : null)}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>

                <svg className={styles.svgOverlay}>
                    <polyline
                        points={svgPathPoints}
                        fill="none"
                        className={`${styles.svgLine} ${isCompleted ? styles.active : ''}`}
                    />
                </svg>
            </div>
        </div>
    );
};

