import React from 'react';
import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { LandingFooter } from './LandingFooter';
import './LandingPage.css';

export const LandingPage: React.FC = () => (
    <div className="landing-page">
        <LandingHero />
        <LandingFeatures />
        <LandingFooter />
    </div>
);
