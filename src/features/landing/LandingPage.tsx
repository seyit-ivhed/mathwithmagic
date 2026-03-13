import React from 'react';
import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { LandingFooter } from './LandingFooter';
import styles from './LandingPage.module.css';

export const LandingPage: React.FC = () => (
    <div className={styles.landingPage}>
        <LandingHero />
        <LandingFeatures />
        <LandingFooter />
    </div>
);
