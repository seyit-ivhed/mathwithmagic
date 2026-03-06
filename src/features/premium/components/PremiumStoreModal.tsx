import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Sparkles, Map, Users, Skull, Puzzle } from 'lucide-react';
import { FormCloseButton } from '../../../components/ui/FormCloseButton';
import { analyticsService } from '../../../services/analytics.service';
import './Premium.css';

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

    useEffect(() => {
        if (isOpen) {
            analyticsService.trackEvent('premium_store_viewed', { source_adventure_id: sourceAdventureId ?? null });
        }
    // sourceAdventureId intentionally omitted — the event should fire only when the
    // modal opens (isOpen transition), not whenever the source prop changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) return null;

    const handleUnlock = () => {
        analyticsService.trackEvent('premium_unlock_clicked');
        window.location.href = `/checkout.html?ref_session=${analyticsService.getSessionId()}`;
    };

    const handleClose = () => {
        analyticsService.trackEvent('premium_store_dismissed');
        onClose();
    };

    return (
        <div className="premium-modal-overlay">
            <FormCloseButton onClick={handleClose} />

            <div className="premium-single-page-layout">
                {/* Left Side: Information and CTA */}
                <div className="premium-info-pane">
                    <h1 className="premium-main-title">{t('premium.store.title')}</h1>
                    <p className="premium-description">{t('premium.store.description')}</p>

                    <ul className="benefit-list-compact">
                        <li className="benefit-item">
                            <Map size={24} />
                            <span>{t('premium.store.features.adventures_title')}</span>
                        </li>
                        <li className="benefit-item">
                            <Users size={24} />
                            <span>{t('premium.store.features.companions_title')}</span>
                        </li>
                        <li className="benefit-item">
                            <Sparkles size={24} />
                            <span>{t('premium.store.features.evolutions_title')}</span>
                        </li>
                        <li className="benefit-item">
                            <Skull size={24} />
                            <span>{t('premium.store.features.opponents_title')}</span>
                        </li>
                        <li className="benefit-item">
                            <Puzzle size={24} />
                            <span>{t('premium.store.features.puzzles_title')}</span>
                        </li>
                        <li className="benefit-item">
                            <ShieldCheck size={24} />
                            <span>{t('premium.store.features.support_title')}</span>
                        </li>
                    </ul>

                    <div className="cta-container">
                        <div className="price-tag-large">{t('premium.store.price')}</div>
                        <button className="unlock-button-large" onClick={handleUnlock}>
                            {t('premium.store.buy_now')}
                        </button>
                    </div>
                </div>

                {/* Right Side: Visual Collage */}
                <div className="premium-collage-pane">
                    <div className="evolution-glow" />

                    {/* Adventures Pile */}
                    <img src={adventure6} className="collage-item adv-card-5" alt="" />
                    <img src={adventure2} className="collage-item adv-card-1" alt="" />
                    <img src={adventure3} className="collage-item adv-card-2" alt="" />
                    <img src={adventure4} className="collage-item adv-card-3" alt="" />
                    <img src={adventure5} className="collage-item adv-card-4" alt="" />

                    {/* Opponents Floating Around */}
                    <img src={shadowMaster} className="collage-item opp-card-1" alt="" />
                    <img src={spiritKing} className="collage-item opp-card-2" alt="" />

                    {/* Companion Cards Foregrounded */}
                    <img src={kenjiCard} className="collage-item comp-card-1" alt="Kenji" />
                    <img src={zaharaCard} className="collage-item comp-card-2" alt="Zahara" />

                    {/* Amara and Tariq Evolutions */}
                    <img src={amaraEvo3} className="collage-item puz-card-1" alt="Amara Evo 2" />
                    <img src={tariqEvo4} className="collage-item puz-card-2" alt="Tariq Evo 4" />
                </div>
            </div>
        </div>
    );
};
