import { useState, useMemo, useEffect } from 'react';
import type { PuzzleProps, SequenceData } from '../../../../types/adventure.types';
import { validateNextStep, isSequenceComplete, generateStarPositions } from './SequenceEngine';
import styles from './SequencePuzzle.module.css';
import { playSfx } from '../../../../components/audio/audio.utils';

export const SequencePuzzle = ({ data, onSolve }: PuzzleProps) => {
    const puzzleData = data as SequenceData;
    const { options, targetValue, rules } = puzzleData;

    // Convert options to simple number array if they are complex objects (though sequence usually assumes numbers)
    const numericOptions = useMemo(() => {
        return options.map(opt => typeof opt === 'number' ? opt : opt.value);
    }, [options]);

    // Generate random positions for these options once
    const positions = useMemo(() => {
        return generateStarPositions(numericOptions.length, 15);
    }, [numericOptions.length]);

    // Find the indices of the first 3 numbers in the valid sequence
    // Sort options to find the smallest 3 values
    const initialPath = useMemo(() => {
        const sortedIndices = numericOptions
            .map((value, index) => ({ value, index }))
            .sort((a, b) => a.value - b.value)
            .slice(0, 3)
            .map(item => item.index);
        return sortedIndices;
    }, [numericOptions]);

    // State - Initialize with first 3 numbers
    const [path, setPath] = useState<number[]>(initialPath);
    const [wrongSelection, setWrongSelection] = useState<number | null>(null); // Index of wrongly clicked star
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (isSuccess) {
            const timer = setTimeout(() => {
                onSolve();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, onSolve]);

    // Reset wrong selection animation after a delay
    useEffect(() => {
        if (wrongSelection !== null) {
            const timer = setTimeout(() => {
                setWrongSelection(null);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [wrongSelection]);

    const handleStarClick = (index: number) => {
        // Prevent clicking already selected stars (unless we want to allow backtracking? Let's keep it simple: strict forward path)
        if (path.includes(index)) return;

        const selectedValue = numericOptions[index];
        const currentValues = path.map(idx => numericOptions[idx]);

        // Validate
        if (validateNextStep(currentValues, selectedValue, rules)) {
            const newPath = [...path, index];
            setPath(newPath);
            playSfx('puzzle/star-sparkle');

            // Check win condition
            const newValues = [...currentValues, selectedValue];
            if (isSequenceComplete(newValues, targetValue)) {
                setIsSuccess(true);
                playSfx('puzzle/magical-success');
            }
        } else {
            // Trigger wrong animation
            setWrongSelection(index);
            playSfx('puzzle/wrong');
        }
    };

    return (
        <div className={styles.layout}>
            <div className={styles.skyMap}>
                {/* SVG Layer for Drawing Lines */}
                <svg className={styles.connectionsLayer}>
                    {/* Define arrow marker for line direction */}
                    <defs>
                        <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="10"
                            refX="9"
                            refY="3"
                            orient="auto"
                            markerUnits="strokeWidth"
                        >
                            <polygon points="0 0, 10 3, 0 6" fill="#ffd700" />
                        </marker>
                    </defs>

                    {/* Draw lines between connected stars */}
                    {path.map((starIndex, i) => {
                        if (i === 0) return null;
                        const prevStarIndex = path[i - 1];
                        const p1 = positions[prevStarIndex];
                        const p2 = positions[starIndex];

                        return (
                            <line
                                key={`line-${i}`}
                                x1={`${p1.x}%`}
                                y1={`${p1.y}%`}
                                x2={`${p2.x}%`}
                                y2={`${p2.y}%`}
                                className={`${styles.connectionLine} ${styles.active} ${isSuccess ? styles.success : ''}`}
                                markerEnd="url(#arrowhead)"
                            />
                        );
                    })}
                </svg>

                {/* Stars Layer */}
                {numericOptions.map((value, index) => {
                    const pos = positions[index];
                    const isSelected = path.includes(index);
                    const isWrong = wrongSelection === index;

                    return (
                        <div
                            key={index}
                            data-testid={`sequence-star-${index}`}
                            className={`
                                ${styles.star} 
                                ${isSelected ? styles.selected : ''} 
                                ${isWrong ? styles.wrong : ''}
                                ${isSuccess && isSelected ? styles.success : ''}
                            `}
                            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                            onClick={() => handleStarClick(index)}
                        >
                            <div className={styles.starContent}>
                                {value}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
