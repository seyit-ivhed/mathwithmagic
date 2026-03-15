import './HealthBar.css';


interface HealthBarProps {
    currentHealth: number;
    maxHealth: number;
    isMonster: boolean;
}

export const HealthBar = ({ currentHealth, maxHealth, isMonster }: HealthBarProps) => {
    const healthPercent = (currentHealth / maxHealth) * 100;

    return (
        <div
            className="health-bar-container"
            role="progressbar"
            aria-valuenow={currentHealth}
            aria-valuemin={0}
            aria-valuemax={maxHealth}
            aria-label={`Health: ${currentHealth} of ${maxHealth}`}
        >
            <div
                className={`health-bar-fill ${isMonster ? 'monster' : 'player'}`}
                style={{ width: `${healthPercent}%` }}
            />
            <div className="health-text" aria-hidden="true">
                {currentHealth}
            </div>
        </div>
    );
};
