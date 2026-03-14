import React from 'react';
import { useTranslation } from 'react-i18next';
import { Swords, Users, Puzzle, Skull } from 'lucide-react';
import styles from './LandingFeatures.module.css';

const FEATURES = [
    {
        icon: <Swords size={28} />,
        titleKey: 'landing.feature_adventures_title',
        titleDefault: 'Epic Adventures',
        descKey: 'landing.feature_adventures_desc',
        descDefault: 'Explore magical worlds filled with hundreds of challenges and quests.',
    },
    {
        icon: <Users size={28} />,
        titleKey: 'landing.feature_companions_title',
        titleDefault: 'Grow Your Companions',
        descKey: 'landing.feature_companions_desc',
        descDefault: 'Level up Amara, Tariq, and their friends by solving math puzzles.',
    },
    {
        icon: <Skull size={28} />,
        titleKey: 'landing.feature_opponents_title',
        titleDefault: 'Magical Opponents',
        descKey: 'landing.feature_opponents_desc',
        descDefault: 'Battle fearsome bosses and mysterious creatures on your journey.',
    },
    {
        icon: <Puzzle size={28} />,
        titleKey: 'landing.feature_puzzles_title',
        titleDefault: 'Real Math Practice',
        descKey: 'landing.feature_puzzles_desc',
        descDefault: 'Addition, subtraction, multiplication, and division — disguised as magic.',
    },
] as const;

export const LandingFeatures: React.FC = () => {
    const { t } = useTranslation();

    return (
        <section className={styles.features}>
            <h2 className={styles.featuresHeading}>
                {t('landing.features_heading', 'Why Math with Magic?')}
            </h2>
            <div className={styles.featuresGrid}>
                {FEATURES.map((feature) => (
                    <div key={feature.titleKey} className={styles.featureCard}>
                        <span className={styles.featureIcon} aria-hidden="true">
                            {feature.icon}
                        </span>
                        <p className={styles.featureTitle}>
                            {t(feature.titleKey, feature.titleDefault)}
                        </p>
                        <p className={styles.featureDesc}>
                            {t(feature.descKey, feature.descDefault)}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
};
