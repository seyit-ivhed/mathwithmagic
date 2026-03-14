import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { analyticsService } from '../../services/analytics.service';

import adventure2 from '../../assets/images/maps/adventure-2.jpg';
import adventure3 from '../../assets/images/maps/adventure-3.jpg';
import adventure4 from '../../assets/images/maps/adventure-4.jpg';
import adventure5 from '../../assets/images/maps/adventure-5.jpg';
import adventure6 from '../../assets/images/maps/adventure-6.jpg';
import kenjiCard from '../../assets/images/companions/Kenji/unit-card/kenji-2.jpg';
import zaharaCard from '../../assets/images/companions/Zahara/unit-card/zahara-2.jpg';
import amaraEvo3 from '../../assets/images/companions/Amara/unit-card/amara-3.jpg';
import tariqEvo4 from '../../assets/images/companions/Tariq/unit-card/tariq-3.jpg';
import shadowMaster from '../../assets/images/enemies/the-evil-shogun.jpg';
import spiritKing from '../../assets/images/enemies/spirit-king.jpg';
import styles from './LandingHero.module.css';
import collage from '../../styles/collage.module.css';

export const LandingHero: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handlePlayNow = () => {
        analyticsService.trackEvent('landing_cta_clicked');
        navigate('/chronicle');
    };

    return (
        <section className={styles.hero}>
            <div className={styles.heroContent}>
                <h1 className={styles.heroHeadline}>
                    {t('landing.title', 'Math with Magic')}
                </h1>
                <p className={styles.heroTagline}>
                    {t('landing.hero_tagline', 'Solve puzzles, grow magical companions, and enjoy epic adventures — all while practicing math.')}
                </p>
                <div className={styles.ctaGroup}>
                    <button
                        className={styles.ctaButton}
                        onClick={handlePlayNow}
                        data-testid="landing-play-now-btn"
                    >
                        {t('landing.hero_cta', 'Start Your Adventure')}
                    </button>
                    <p className={styles.ctaNote}>
                        {t('landing.hero_age_note', 'Designed for children ages 6–8')}
                    </p>
                </div>
            </div>

            <div className={styles.collagePane}>
                <div className={collage.evolutionGlow} />

                <img src={adventure6} className={`${collage.collageItem} ${collage.advCard5}`} alt="" />
                <img src={adventure2} className={`${collage.collageItem} ${collage.advCard1}`} alt="" />
                <img src={adventure3} className={`${collage.collageItem} ${collage.advCard2}`} alt="" />
                <img src={adventure4} className={`${collage.collageItem} ${collage.advCard3}`} alt="" />
                <img src={adventure5} className={`${collage.collageItem} ${collage.advCard4}`} alt="" />

                <img src={shadowMaster} className={`${collage.collageItem} ${collage.oppCard1}`} alt="" />
                <img src={spiritKing} className={`${collage.collageItem} ${collage.oppCard2}`} alt="" />

                <img src={kenjiCard} className={`${collage.collageItem} ${collage.compCard1}`} alt="Kenji" />
                <img src={zaharaCard} className={`${collage.collageItem} ${collage.compCard2}`} alt="Zahara" />

                <img src={amaraEvo3} className={`${collage.collageItem} ${collage.puzCard1}`} alt="Amara" />
                <img src={tariqEvo4} className={`${collage.collageItem} ${collage.puzCard2}`} alt="Tariq" />
            </div>
        </section>
    );
};
