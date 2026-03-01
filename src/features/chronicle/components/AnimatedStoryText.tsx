import React, { useMemo, useRef } from 'react';
import styles from './AnimatedStoryText.module.css';

interface AnimatedStoryTextProps {
    text: string;
    isSkipped: boolean;
    onComplete: () => void;
    wordDelayMs?: number;
}

export const AnimatedStoryText: React.FC<AnimatedStoryTextProps> = ({
    text,
    isSkipped,
    onComplete,
    wordDelayMs = 450
}) => {
    const words = useMemo(() => text.split(' '), [text]);

    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const prevKeyRef = useRef('');
    const animationKey = `${words.length}-${wordDelayMs}-${isSkipped}`;

    if (prevKeyRef.current !== animationKey) {
        prevKeyRef.current = animationKey;

        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (isSkipped) {
            onCompleteRef.current();
        } else {
            const totalTime = words.length * wordDelayMs + 500;
            timerRef.current = setTimeout(() => {
                onCompleteRef.current();
            }, totalTime);
        }
    }

    return (
        <span className={styles.container}>
            {words.map((word, index) => {
                const delay = (index * wordDelayMs) / 1000;
                return (
                    <span
                        key={index}
                        className={`${styles.word} ${isSkipped ? styles.skipped : ''}`}
                        style={{
                            animationDelay: `${delay}s`,
                            animationDuration: '0.4s'
                        }}
                    >
                        {word}{' '}
                    </span>
                );
            })}
        </span>
    );
};
