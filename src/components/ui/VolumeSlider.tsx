import React from 'react';
import styles from './VolumeSlider.module.css';

interface VolumeSliderProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    onMouseUp?: () => void;
}

export const VolumeSlider: React.FC<VolumeSliderProps> = ({ label, value, onChange, onMouseUp }) => {
    return (
        <div className={styles.soundControlRow}>
            <label className={styles.soundLabel}>{label}</label>
            <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                onMouseUp={onMouseUp}
                onTouchEnd={onMouseUp}
                className={styles.volumeSlider}
            />
        </div>
    );
};
