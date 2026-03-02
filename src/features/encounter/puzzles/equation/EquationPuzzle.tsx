import { useState } from 'react';
import { PuzzleType, type PuzzleProps, type EquationData } from '../../../../types/adventure.types';
import { validateAnswer } from './EquationEngine';
import styles from './EquationPuzzle.module.css';
import { playSfx } from '../../../../components/audio/audio.utils';

const SHAKE_DURATION_MS = 500;
const SUCCESS_DELAY_MS = 2000;

export const EquationPuzzle = ({ data, onSolve }: PuzzleProps) => {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isSolved, setIsSolved] = useState(false);
    const [isShaking, setIsShaking] = useState(false);

    if (!data || data.puzzleType !== PuzzleType.EQUATION) {
        console.error('Invalid puzzle type for EquationPuzzle');
        return null;
    }

    if (typeof onSolve !== 'function') {
        console.error('onSolve is not a function in EquationPuzzle');
        return null;
    }

    const puzzleData = data as EquationData;

    if (!puzzleData.equations) {
        console.error('Invalid equation puzzle data');
        return null;
    }


    const handleChoiceSelect = (value: number) => {
        if (isSolved || isShaking) {
            return;
        }

        setSelectedAnswer(value);

        if (validateAnswer(value, puzzleData.correctAnswer)) {
            setIsSolved(true);
            playSfx('puzzle/magical-success');
            setTimeout(() => {
                onSolve();
            }, SUCCESS_DELAY_MS);
        } else {
            setIsShaking(true);
            playSfx('puzzle/wrong');
            setTimeout(() => {
                setIsShaking(false);
                setSelectedAnswer(null);
            }, SHAKE_DURATION_MS);
        }
    };

    const renderTerm = (term: { symbolIndex: number; coefficient: number }, index: number) => {
        const symbol = puzzleData.symbols[term.symbolIndex];

        return (
            <span key={index} className={styles.term}>
                {index > 0 && (
                    <span className={styles.operator}>+</span>
                )}
                <span className={styles.symbolBox} data-testid={`symbol-${term.symbolIndex}`}>
                    {symbol}
                </span>
            </span>
        );
    };

    return (
        <div className={styles.container} data-testid="equation-puzzle-container">
            <div className={`${styles.equationsArea} ${isShaking ? styles.shake : ''}`}>
                {puzzleData.equations.map((equation, eqIndex) => (
                    <div key={eqIndex} className={styles.equationRow} data-testid={`equation-${eqIndex}`}>
                        <div className={styles.leftSide}>
                            {equation.left.map((term, tIndex) => renderTerm(term, tIndex))}
                        </div>
                        <span className={styles.equals}>=</span>
                        <span className={styles.resultValue}>{equation.right}</span>
                    </div>
                ))}

                <div className={styles.divider} />

                <div className={styles.questionRow} data-testid="equation-question">
                    <span className={styles.symbolBox}>
                        {puzzleData.symbols[puzzleData.targetSymbolIndex]}
                    </span>
                    <span className={styles.equals}>=</span>
                    <span className={styles.questionMark}>?</span>
                </div>
            </div>

            <div className={styles.choicesArea} data-testid="equation-choices">
                {puzzleData.choices.map((choice, index) => {
                    const isCorrectChoice = isSolved && choice === puzzleData.correctAnswer;
                    const isWrongChoice = isShaking && choice === selectedAnswer;
                    let choiceClass = styles.choiceButton;
                    if (isCorrectChoice) {
                        choiceClass += ` ${styles.correct}`;
                    }
                    if (isWrongChoice) {
                        choiceClass += ` ${styles.wrong}`;
                    }

                    return (
                        <button
                            key={index}
                            className={choiceClass}
                            onClick={() => handleChoiceSelect(choice)}
                            disabled={isSolved}
                            data-testid={`choice-${index}`}
                        >
                            {choice}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
