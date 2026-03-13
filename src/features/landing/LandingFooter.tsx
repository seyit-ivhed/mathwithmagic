import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './LandingFooter.module.css';

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
        <footer className={styles.footer}>
            <div className={styles.footerTop}>
                <div className={styles.footerBrand}>
                    <p className={styles.footerBrandName}>
                        {t('landing.footer_company', 'Outlean AB')}
                    </p>
                    <p className={styles.footerTagline}>
                        {t('landing.footer_address', 'Sweden')}
                    </p>
                    <p className={styles.footerTagline}>
                        {t('landing.footer_tagline', 'Making math magical for kids ages 6–8.')}
                    </p>
                </div>

                <div className={styles.footerContact}>
                    <span className={styles.footerContactItem}>
                        <a href="mailto:hello@mathwithmagic.com">
                            {t('landing.footer_contact', 'hello@mathwithmagic.com')}
                        </a>
                    </span>
                </div>

                <div className={styles.footerPayments}>
                    <span className={styles.footerPaymentsLabel}>
                        {t('landing.footer_accepted_payments', 'Accepted payments')}
                    </span>
                    <div className={styles.footerPaymentBadges}>
                        {PAYMENT_BADGES.map((badge) => (
                            <span key={badge} className={styles.footerPaymentBadge}>
                                {badge}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <nav className={styles.footerBottom} aria-label={t('landing.footer_legal_nav_label', 'Legal')}>
                {LEGAL_LINKS.map((link, index) => (
                    <React.Fragment key={link.to + link.labelKey}>
                        {index > 0 && (
                            <span className={styles.footerSep} aria-hidden="true">|</span>
                        )}
                        <Link
                            to={link.to}
                            className={styles.footerLegalLink}
                        >
                            {t(link.labelKey, link.labelDefault)}
                        </Link>
                    </React.Fragment>
                ))}
            </nav>
        </footer>
    );
};
