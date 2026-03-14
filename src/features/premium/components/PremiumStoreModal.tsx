import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Sparkles, Map, Users, Skull, Puzzle } from 'lucide-react';
import { FormCloseButton } from '../../../components/ui/FormCloseButton';
import { analyticsService } from '../../../services/analytics.service';
import { useModalAccessibility } from '../../../hooks/useModalAccessibility';
import styles from './PremiumStoreModal.module.css';
import collage from '../../../styles/collage.module.css';

// Import Assets
import adventure2 from '../../../assets/images/maps/adventure-2.jpg';
import adventure3 from '../../../assets/images/maps/adventure-3.jpg';
import adventure4 from '../../../assets/images/maps/adventure-4.jpg';
import adventure5 from '../../../assets/images/maps/adventure-5.jpg';
import adventure6 from '../../../assets/images/maps/adventure-6.jpg';

import kenjiCard from '../../../assets/images/companions/Kenji/unit-card/kenji-2.jpg';
import zaharaCard from '../../../assets/images/companions/Zahara/unit-card/zahara-2.jpg';
import amaraEvo3 from '../../../assets/images/companions/Amara/unit-card/amara-3.jpg';
import tariqEvo4 from '../../../assets/images/companions/Tariq/unit-card/tariq-3.jpg';

import shadowMaster from '../../../assets/images/enemies/the-evil-shogun.jpg';
import spiritKing from '../../../assets/images/enemies/spirit-king.jpg';

interface PremiumStoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceAdventureId?: string;
}

export const PremiumStoreModal: React.FC<PremiumStoreModalProps> = ({ isOpen, onClose, sourceAdventureId }) => {
    const { t } = useTranslation();
    const modalRef = useModalAccessibility(onClose, isOpen);

    useEffect(() => {
        if (isOpen) {
            analyticsService.trackEvent('premium_store_viewed', { source_adventure_id: sourceAdventureId ?? null });
        }
    // sourceAdventureId intentionally omitted — the event should fire only when the
    // modal opens (isOpen transition), not whenever the source prop changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleUnlock = () => {
        analyticsService.trackEvent('premium_unlock_clicked');
        window.location.href = '/checkout.html';
    };

    return (
        <div
            className={styles.premiumModalOverlay}
            role="dialog"
            aria-modal="true"
            aria-label={t('premium.store.title')}
            ref={modalRef}
        >
            <FormCloseButton onClick={onClose} className={styles.closeButton} />

            <div className={styles.singlePageLayout}>
                {/* Left Side: Information and CTA */}
                <div className={styles.infoPane}>
                    <h1 className={styles.mainTitle}>{t('premium.store.title')}</h1>
                    <p className={styles.description}>{t('premium.store.description')}</p>

                    <ul className={styles.benefitList}>
                        <li className={styles.benefitItem}>
                            <Map size={24} />
                            <span>{t('premium.store.features.adventures_title')}</span>
                        </li>
                        <li className={styles.benefitItem}>
                            <Users size={24} />
                            <span>{t('premium.store.features.companions_title')}</span>
                        </li>
                        <li className={styles.benefitItem}>
                            <Sparkles size={24} />
                            <span>{t('premium.store.features.evolutions_title')}</span>
                        </li>
                        <li className={styles.benefitItem}>
                            <Skull size={24} />
                            <span>{t('premium.store.features.opponents_title')}</span>
                        </li>
                        <li className={styles.benefitItem}>
                            <Puzzle size={24} />
                            <span>{t('premium.store.features.puzzles_title')}</span>
                        </li>
                        <li className={styles.benefitItem}>
                            <ShieldCheck size={24} />
                            <span>{t('premium.store.features.support_title')}</span>
                        </li>
                    </ul>

                    <div className={styles.ctaContainer}>
                        <div className={styles.priceTag}>{t('premium.store.price')}</div>
                        <button className={styles.unlockButton} onClick={handleUnlock}>
                            {t('premium.store.buy_now')}
                        </button>
                    </div>
                </div>

                {/* Right Side: Visual Collage */}
                <div className={collage.collagePane}>
                    <div className={collage.evolutionGlow} />

                    {/* Adventures Pile */}
                    <img src={adventure6} className={`${collage.collageItem} ${collage.advCard5}`} alt="" />
                    <img src={adventure2} className={`${collage.collageItem} ${collage.advCard1}`} alt="" />
                    <img src={adventure3} className={`${collage.collageItem} ${collage.advCard2}`} alt="" />
                    <img src={adventure4} className={`${collage.collageItem} ${collage.advCard3}`} alt="" />
                    <img src={adventure5} className={`${collage.collageItem} ${collage.advCard4}`} alt="" />

                    {/* Opponents Floating Around */}
                    <img src={shadowMaster} className={`${collage.collageItem} ${collage.oppCard1}`} alt="" />
                    <img src={spiritKing} className={`${collage.collageItem} ${collage.oppCard2}`} alt="" />

                    {/* Companion Cards Foregrounded */}
                    <img src={kenjiCard} className={`${collage.collageItem} ${collage.compCard1}`} alt="Kenji" />
                    <img src={zaharaCard} className={`${collage.collageItem} ${collage.compCard2}`} alt="Zahara" />

                    {/* Amara and Tariq Evolutions */}
                    <img src={amaraEvo3} className={`${collage.collageItem} ${collage.puzCard1}`} alt="Amara Evo 2" />
                    <img src={tariqEvo4} className={`${collage.collageItem} ${collage.puzCard2}`} alt="Tariq Evo 4" />
                </div>
            </div>
        </div>
    );
};
