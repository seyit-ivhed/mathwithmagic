import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const PAYMENT_BADGES = ['Visa', 'Mastercard', 'Amex'] as const;

const LEGAL_LINKS = [
    { labelKey: 'legal.privacy_policy', labelDefault: 'Privacy Policy', to: '/privacy' },
    { labelKey: 'legal.terms_of_service', labelDefault: 'Terms of Service', to: '/terms' },
    { labelKey: 'landing.footer_refund_policy', labelDefault: 'Refund Policy', to: '/terms' },
    { labelKey: 'landing.footer_cancellation_policy', labelDefault: 'Cancellation Policy', to: '/terms' },
] as const;

export const LandingFooter: React.FC = () => {
    const { t } = useTranslation();

    return (
        <footer className="landing-footer">
            <div className="landing-footer-top">
                <div className="landing-footer-brand">
                    <p className="landing-footer-brand-name">
                        {t('landing.footer_company', 'Outlean AB')}
                    </p>
                    <p className="landing-footer-tagline">
                        {t('landing.footer_address', 'Sweden')}
                    </p>
                    <p className="landing-footer-tagline">
                        {t('landing.footer_tagline', 'Making math magical for kids ages 6–8.')}
                    </p>
                </div>

                <div className="landing-footer-contact">
                    <span className="landing-footer-contact-item">
                        <a href="mailto:hello@mathwithmagic.com">
                            {t('landing.footer_contact', 'hello@mathwithmagic.com')}
                        </a>
                    </span>
                </div>

                <div className="landing-footer-payments">
                    <span className="landing-footer-payments-label">
                        {t('landing.footer_accepted_payments', 'Accepted payments')}
                    </span>
                    <div className="landing-footer-payment-badges">
                        {PAYMENT_BADGES.map((badge) => (
                            <span key={badge} className="landing-footer-payment-badge">
                                {badge}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <nav className="landing-footer-bottom" aria-label={t('landing.footer_legal_nav_label', 'Legal')}>
                {LEGAL_LINKS.map((link, index) => (
                    <React.Fragment key={link.to + link.labelKey}>
                        {index > 0 && (
                            <span className="landing-footer-sep" aria-hidden="true">|</span>
                        )}
                        <Link
                            to={link.to}
                            className="landing-footer-legal-link"
                        >
                            {t(link.labelKey, link.labelDefault)}
                        </Link>
                    </React.Fragment>
                ))}
            </nav>
        </footer>
    );
};
