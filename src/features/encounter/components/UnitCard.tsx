import { type EncounterUnit, EncounterPhase } from '../../../types/encounter.types';
import { getCompanionById } from '../../../data/companions.data';
import './UnitCard.css';
import '../encounter-animations.css';
import { useTranslation } from 'react-i18next';
import { Heart, Sword } from 'lucide-react';
import { MathCardFace } from './MathCardFace';
import type { MathProblem } from '../../../types/math.types';
import { FloatingTextOverlay } from './FloatingTextOverlay';
import { UnitNameBadge } from './UnitNameBadge';
import { UnitCardImage } from './UnitCardImage';
import { AbilityCard } from './AbilityCard';
import { HealthBar } from './HealthBar';
import { useGameStore } from '../../../stores/game/store';
import { UnitCardShield } from './UnitCardShield';
import { UnitCardVFX } from './UnitCardVFX';
import { useUnitCardAnimations } from '../hooks/useUnitCardAnimations';
import { RestingIndicator } from './RestingIndicator';
import { TapHint } from './TapHint';

interface UnitCardProps {
    unit: EncounterUnit;
    phase: EncounterPhase;
    onAct?: () => void;
    isFlipped?: boolean;
    mathProblem?: MathProblem;
    onMathAnswer?: (correct: boolean) => void;
    activeVisualEffect?: string | null;
    disableInteraction?: boolean;
    showAttackHint?: boolean;
}

export const UnitCard = ({
    unit,
    phase,
    onAct,
    isFlipped = false,
    mathProblem,
    onMathAnswer,
    activeVisualEffect,
    disableInteraction = false,
    showAttackHint = false
}: UnitCardProps) => {
    const { t } = useTranslation();
    const isMonster = !unit.isPlayer;

    const companionData = !isMonster ? getCompanionById(unit.templateId) : null;
    const canAct = !unit.hasActed && !unit.isDead && phase === EncounterPhase.PLAYER_TURN && !disableInteraction;
    const isUltimateReady = !isMonster && !unit.isDead && unit.currentSpirit >= 100;

    const displayName = isMonster
        ? t(`monsters.${unit.templateId}.name`, unit.name)
        : unit.name;

    const {
        animationClass,
        setAnimationClass,
        shieldAnimClass,
        floatingTexts
    } = useUnitCardAnimations(unit, isMonster);

    const handleCardClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isMonster || disableInteraction || isFlipped || !!mathProblem) return;
        if (!canAct) return;

        if (unit.currentSpirit >= 100) {
            setAnimationClass('anim-pulse-ultimate');
        } else {
            setAnimationClass('anim-lunge-right');
        }
        setTimeout(() => setAnimationClass(''), 500);

        onAct?.();
    };

    const getCardClasses = () => {
        const classes = ['unit-card', animationClass];

        if (unit.isBoss) classes.push('is-boss');
        if (isUltimateReady) classes.push('ultimate-ready-glow');
        if (isFlipped) classes.push('is-flipped');

        if (isMonster) {
            if (unit.isBoss) {
                classes.push('border-boss');
            } else {
                classes.push('border-red');
            }
        } else {
            classes.push('border-brown');
        }

        if (unit.isDead) classes.push('is-dead');
        if (unit.hasActed && !unit.isDead) classes.push('has-acted');

        if (!isMonster && !unit.hasActed) {
            if (canAct) {
                classes.push('can-act');
            } else {
                classes.push('cannot-act');
            }
        }

        return classes.join(' ');
    };

    const activeCompanionStats = useGameStore(state =>
        !isMonster ? state.companionStats[unit.templateId] : null
    );

    const level = activeCompanionStats?.level || companionData?.level || 1;

    return (
        <div
            className={getCardClasses()}
            onClick={handleCardClick}
            data-testid={`unit-card-${unit.id}`}
            data-unit-id={unit.id}
        >
            <FloatingTextOverlay floatingTexts={floatingTexts} />
            <UnitNameBadge displayName={displayName} />

            <div className="unit-card-front">
                <UnitCardImage
                    isMonster={isMonster}
                    companionData={companionData}
                    image={unit.image}
                    level={level}
                    displayName={displayName}
                />

                <div className="card-spacer" />

                <div className="unit-info-bottom">
                    {isUltimateReady && unit.specialAbilityId ? (
                        <AbilityCard
                            abilityName={t(`abilities.${unit.specialAbilityId}.name`)}
                            abilityDescription={t(`abilities.${unit.specialAbilityId}.description`, {
                                ...unit.specialAbilityVariables,
                                value: Object.values(unit.specialAbilityVariables || {})[0]
                            })}
                            progress={unit.currentSpirit}
                            isUltimateReady={true}
                            isSimplified={false}
                            isMonster={isMonster}
                            power={unit.damage || 10}
                        />
                    ) : (companionData || isMonster) ? (
                        <div className="unit-stats-row">
                            <div className="unit-stat-item" aria-label={t('companions.stats.hp', 'HP')}>
                                <Heart size={13} className="unit-stat-hp-icon" aria-hidden="true" />
                                <span>{unit.maxHealth}</span>
                            </div>
                            <div className="unit-stat-item" aria-label={t('companions.stats.attack', 'Attack')}>
                                <Sword size={13} className="unit-stat-atk-icon" aria-hidden="true" />
                                <span>{unit.damage || 10}</span>
                            </div>
                        </div>
                    ) : null}

                    <HealthBar
                        currentHealth={unit.currentHealth}
                        maxHealth={unit.maxHealth}
                        isMonster={isMonster}
                    />
                </div>
            </div>

            {/* Shield Indicator (Remaining Turns) */}
            <UnitCardShield
                currentShield={(unit.statusEffects?.find(e => e.type === 'SHIELD')?.state.duration as number) || 0}
                animationClass={shieldAnimClass}
            />

            {
                mathProblem && onMathAnswer && (
                    <MathCardFace
                        problem={mathProblem}
                        abilityName={unit.specialAbilityId ? t(`abilities.${unit.specialAbilityId}.name`) : t('companions.stats.attack')}
                        onAnswer={onMathAnswer}
                    />
                )
            }

            <UnitCardVFX activeVisualEffect={activeVisualEffect} />

            {/* Sleeping/Resting State Indicator */}
            {unit.hasActed && !unit.isDead && !isMonster && <RestingIndicator />}

            {/* Attack Tutorial Hint (first encounter only) */}
            {showAttackHint && canAct && !isMonster && <TapHint />}

        </div>
    );
};
