import './HealthBar.css';


interface HealthBarProps {
    currentHealth: number;
    maxHealth: number;
    isMonster: boolean;
}

export const HealthBar = ({ currentHealth, maxHealth, isMonster }: HealthBarProps) => {
    const healthPercent = (currentHealth / maxHealth) * 100;

    return (
        <div className="health-bar-container">
            <div
                className={`health-bar-fill ${isMonster ? 'monster' : 'player'}`}
                style={{ width: `${healthPercent}%` }}
            />
            <div className="health-text">
                {currentHealth}
            </div>
        </div>
    );
};
