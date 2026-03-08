import React from 'react';
import styles from './LegalModal.module.css';

const LAST_UPDATED = '2026-03-08';

interface TermsOfServiceContentProps {
    onOpenPrivacy?: () => void;
}

export const TermsOfServiceContent: React.FC<TermsOfServiceContentProps> = ({ onOpenPrivacy }) => (
    <div className={styles.legalDocument}>
        <h1 className={styles.docTitle}>Terms of Service</h1>
        <p className={styles.lastUpdated}>Last updated: {LAST_UPDATED}</p>

        <h2>1. Who We Are</h2>
        <p>
            These Terms of Service ("Terms") are between you and <strong>Outlean AB</strong>, a limited
            company registered in Sweden, operating the educational game <em>Play to Learn</em>
            ("Service"). By creating an account or making a purchase, you agree to these Terms.
        </p>
        <p>
            <strong>Contact:</strong> seyit@outlean.net
        </p>

        <h2>2. Who Can Use the Service</h2>
        <p>
            Accounts are for <strong>parents and guardians only</strong>. You must be at least 18 years
            of age to create an account. By creating an account, you confirm that:
        </p>
        <ul>
            <li>You are at least 18 years old.</li>
            <li>You are creating the account as a parent or guardian on behalf of your child.</li>
            <li>You accept these Terms on behalf of yourself.</li>
        </ul>
        <p>
            Children (the intended players) use the game without accounts and do not agree to Terms
            themselves. As a parent or guardian, you are responsible for your child's use of the
            Service.
        </p>

        <h2>3. Description of the Service</h2>
        <p>
            <em>Play to Learn</em> is an educational adventure game designed for children ages 6–8. It
            uses storytelling, math puzzles, and companion characters to make learning engaging. The
            Service is available in two tiers:
        </p>
        <ul>
            <li>
                <strong>Free tier:</strong> Access to the first adventure and two companion characters.
                No account required — children can play immediately.
            </li>
            <li>
                <strong>Premium tier:</strong> Unlocks additional adventures, companion characters,
                evolutions, and puzzles. Requires a one-time purchase by a parent or guardian with an
                account.
            </li>
        </ul>

        <h2>4. Account Responsibilities</h2>
        <ul>
            <li>Keep your login credentials confidential.</li>
            <li>
                Notify us immediately at seyit@outlean.net if you suspect unauthorized access to your
                account.
            </li>
            <li>You are responsible for all activity that occurs under your account.</li>
            <li>You may only create one account per email address.</li>
        </ul>

        <h2>5. Intellectual Property</h2>
        <p>
            All content in the Service — including game text, artwork, audio, characters, and code —
            is owned by Outlean AB or licensed to us. You receive a limited, non-transferable,
            non-exclusive licence to use the Service for personal, non-commercial purposes.
        </p>
        <p>You may not:</p>
        <ul>
            <li>Copy, modify, or distribute any part of the Service.</li>
            <li>Reverse-engineer or attempt to extract source code.</li>
            <li>Resell or sublicense access to the Service or premium content.</li>
            <li>Remove or alter any copyright or trademark notices.</li>
        </ul>

        <h2>6. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
            <li>Use the Service for any unlawful purpose.</li>
            <li>Attempt to bypass security measures or access features you have not paid for.</li>
            <li>Interfere with or disrupt the integrity or performance of the Service.</li>
            <li>Use automated tools to access the Service.</li>
        </ul>

        <h2>7. Account Termination</h2>
        <p>
            We reserve the right to suspend or terminate accounts that violate these Terms. You may
            delete your account at any time through the account settings in the game. See our{' '}
            {onOpenPrivacy ? (
                <button type="button" className={styles.inlineLink} onClick={onOpenPrivacy}>
                    Privacy Policy
                </button>
            ) : (
                'Privacy Policy'
            )}{' '}for information on how account deletion affects your data.
        </p>

        <h2>8. Service Availability</h2>
        <p>
            We strive to keep the Service available at all times but do not guarantee uninterrupted
            access. We may perform maintenance, updates, or experience outages beyond our control. We
            are not liable for any loss or inconvenience caused by downtime.
        </p>

        <h2>9. Limitation of Liability</h2>
        <p>
            To the fullest extent permitted by applicable law, Outlean AB is not liable for any
            indirect, incidental, special, consequential, or punitive damages arising from your use of
            the Service. Our total liability for any claim arising from these Terms shall not exceed
            the amount you paid for the Service in the 12 months preceding the claim.
        </p>
        <p>
            Nothing in these Terms limits liability for fraud, death or personal injury caused by
            negligence, or any liability that cannot be excluded under applicable law.
        </p>

        <h2>10. Changes to Terms</h2>
        <p>
            We may update these Terms from time to time. For material changes, we will notify you
            before the changes take effect (e.g. via email or an in-app notice). Continued use of the
            Service after the effective date constitutes acceptance of the updated Terms.
        </p>

        <h2>11. Governing Law and Disputes</h2>
        <p>
            These Terms are governed by the laws of Sweden and applicable EU law. Any disputes shall
            be resolved by the Swedish courts, with the Stockholm District Court as the court of first
            instance. EU consumers may also use the EU Online Dispute Resolution platform at{' '}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
                ec.europa.eu/consumers/odr
            </a>.
        </p>
        <p>
            For privacy-related complaints, you may contact the Swedish Data Protection Authority
            (IMY) at{' '}
            <a href="https://www.imy.se" target="_blank" rel="noopener noreferrer">imy.se</a>.
        </p>

        <h2>12. Contact</h2>
        <p>
            Questions about these Terms? Contact us at <strong>seyit@outlean.net</strong>.
        </p>

        {/* Refund Policy Section */}
        <hr className={styles.sectionDivider} />

        <h1 className={styles.docTitle} style={{ fontSize: '1.8rem', marginTop: '2rem' }}>Refund Policy</h1>
        <p className={styles.lastUpdated}>Last updated: {LAST_UPDATED}</p>

        <h2>Digital Goods — General Policy</h2>
        <p>
            Premium content in <em>Play to Learn</em> is delivered as a digital product. Because
            access is granted immediately upon purchase, <strong>digital content is generally
            non-refundable</strong> once access has been provided.
        </p>
        <p>
            If you have not yet accessed the premium content after purchasing, you may request a
            refund within 14 days of purchase by emailing <strong>seyit@outlean.net</strong> with your
            purchase confirmation and email address.
        </p>

        <h2>EU Right of Withdrawal</h2>
        <p>
            Under the EU Consumer Rights Directive, EU consumers normally have a 14-day right of
            withdrawal for digital purchases. However, this right is waived when:
        </p>
        <ul>
            <li>
                The consumer explicitly consents to immediate access to digital content before the
                withdrawal period expires, and
            </li>
            <li>The consumer acknowledges that this consent waives the right of withdrawal.</li>
        </ul>
        <p>
            At checkout, you will be asked to confirm this waiver before your purchase is processed.
            If you do not grant this waiver, your purchase cannot be completed.
        </p>
        <p>
            If you believe you are entitled to a refund for any other reason, please contact us at{' '}
            <strong>seyit@outlean.net</strong>. We will review all requests on a case-by-case basis.
        </p>

        <h2>Refund Processing</h2>
        <p>
            Approved refunds are processed within 5–10 business days and credited to the original
            payment method. We use Stripe for payment processing; Stripe's standard refund timelines
            apply.
        </p>

        <h2>How to Request a Refund</h2>
        <p>Email <strong>seyit@outlean.net</strong> with:</p>
        <ul>
            <li>Your account email address</li>
            <li>The date of purchase</li>
            <li>A brief description of the reason for your refund request</li>
        </ul>
    </div>
);
