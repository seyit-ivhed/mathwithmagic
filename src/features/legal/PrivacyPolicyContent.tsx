import React from 'react';
import styles from './LegalModal.module.css';

const LAST_UPDATED = '2026-03-08';

export const PrivacyPolicyContent: React.FC = () => (
    <div className={styles.legalDocument}>
        <h1 className={styles.docTitle}>Privacy Policy</h1>
        <p className={styles.lastUpdated}>Last updated: {LAST_UPDATED}</p>

        <h2>1. Who We Are</h2>
        <p>
            Outlean AB is a limited company registered in Sweden (Aktiebolag). We operate the educational
            game <em>Play to Learn</em>. As a company established in the EU, we act as a <strong>data
            controller</strong> under the General Data Protection Regulation (GDPR).
        </p>
        <p>
            <strong>Privacy contact:</strong> seyit@outlean.net<br />
            <em>(This address will be updated once the game domain is purchased.)</em>
        </p>

        <h2>2. What Data We Collect and Why</h2>
        <p>
            We collect only the minimum personal data necessary to provide our service. The game is
            designed for children ages 6–8, but <strong>children play without accounts and provide no
            personal data</strong>. All account data is provided by a parent or guardian.
        </p>

        <table className={styles.dataTable}>
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Purpose</th>
                    <th>Legal Basis (GDPR)</th>
                    <th>Stored by</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Email address</td>
                    <td>Account access and identification</td>
                    <td>Art. 6(1)(b) — Contract</td>
                    <td>Supabase</td>
                </tr>
                <tr>
                    <td>Password (hashed)</td>
                    <td>Account security</td>
                    <td>Art. 6(1)(b) — Contract</td>
                    <td>Supabase</td>
                </tr>
                <tr>
                    <td>Session token</td>
                    <td>Authentication after login</td>
                    <td>Art. 6(1)(b) — Contract</td>
                    <td>Browser sessionStorage (cleared on tab close)</td>
                </tr>
                <tr>
                    <td>Game progress data</td>
                    <td>Cross-device save, gameplay continuity</td>
                    <td>Art. 6(1)(b) — Contract</td>
                    <td>Supabase</td>
                </tr>
                <tr>
                    <td>Anonymous session ID</td>
                    <td>Aggregated gameplay analytics</td>
                    <td>Art. 6(1)(f) — Legitimate interest</td>
                    <td>Supabase (play_events)</td>
                </tr>
                <tr>
                    <td>Payment data</td>
                    <td>Purchase processing</td>
                    <td>Art. 6(1)(b) — Contract</td>
                    <td>Stripe (we never store card data)</td>
                </tr>
                <tr>
                    <td>Product update consent flag</td>
                    <td>Sending optional game update emails (only if opted in)</td>
                    <td>Art. 6(1)(a) — Consent</td>
                    <td>Supabase</td>
                </tr>
            </tbody>
        </table>

        <h2>3. What We Do NOT Collect</h2>
        <ul>
            <li>No personal data from children — children play without accounts.</li>
            <li>No device fingerprints or persistent identifiers.</li>
            <li>No advertising identifiers (e.g. Facebook Pixel, Google Ads).</li>
            <li>No cross-site tracking of any kind.</li>
            <li>No data is sold, rented, or shared with third parties for commercial purposes.</li>
            <li>No behavioural advertising — there are no advertisements in the game.</li>
        </ul>

        <h2>4. Children's Privacy (COPPA)</h2>
        <p>
            <em>Play to Learn</em> is designed for children ages 6–8. However, <strong>children play
            the game without creating accounts</strong>. We do not knowingly collect personal
            information from children under the age of 13.
        </p>
        <ul>
            <li>Accounts are for parents or guardians only. You must be 18 or older to create an account.</li>
            <li>Children play anonymously — they are never prompted for personal information.</li>
            <li>Anonymous gameplay analytics use session IDs that cannot be linked to any individual.</li>
            <li>There are no behavioural advertisements in the game.</li>
        </ul>
        <p>
            If you believe a child has provided personal information to us, please contact us at
            seyit@outlean.net and we will promptly delete it.
        </p>

        <h2>5. Third-Party Data Processors</h2>
        <p>We use the following third-party processors, both bound by GDPR-compliant data processing agreements:</p>
        <ul>
            <li>
                <strong>Supabase</strong> — authentication and database hosting. We use an EU region
                to keep data within the European Economic Area. See{' '}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
                    Supabase Privacy Policy
                </a>.
            </li>
            <li>
                <strong>Stripe</strong> — payment processing. Stripe is certified under the EU-US Data
                Privacy Framework. We never receive or store your card details. See{' '}
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
                    Stripe Privacy Policy
                </a>.
            </li>
        </ul>
        <p>Neither processor sells or re-shares your data.</p>

        <h2>6. Cookies and Browser Storage</h2>
        <p>We do not use tracking cookies. Specifically:</p>
        <ul>
            <li>
                Supabase stores a session token in your browser's <code>sessionStorage</code>. This
                token is cleared automatically when you close the browser tab.
            </li>
            <li>Stripe cookies are blocked in our implementation.</li>
            <li>No third-party analytics or advertising cookies are used.</li>
        </ul>

        <h2>7. Data Retention</h2>
        <ul>
            <li>
                <strong>Account data (email, game progress):</strong> Retained until you delete your
                account.
            </li>
            <li>
                <strong>Anonymous gameplay analytics:</strong> May be retained indefinitely. Because
                the session IDs are tab-scoped and cleared on tab close, they cannot be linked to any
                person and are not considered personal data under GDPR.
            </li>
            <li>
                <strong>Stripe payment records:</strong> Stripe retains these for their own legal and
                financial obligations. We do not store payment data.
            </li>
        </ul>

        <h2>8. No Data Sales</h2>
        <p>
            We do not sell, rent, or trade your personal data. There is nothing to opt out of because
            we do not engage in data sales or sharing for commercial purposes.
        </p>

        <h2>9. Your Rights Under GDPR</h2>
        <p>
            If you are located in the EU/EEA (or the United Kingdom), you have the following rights
            regarding your personal data:
        </p>
        <ul>
            <li><strong>Right of access:</strong> Request a copy of the data we hold about you.</li>
            <li><strong>Right to rectification:</strong> Ask us to correct inaccurate data.</li>
            <li>
                <strong>Right to erasure:</strong> Delete your account at any time via the in-app
                account settings. This removes all personal data associated with your account.
            </li>
            <li>
                <strong>Right to data portability:</strong> Request your data in a machine-readable
                format (JSON/CSV) by emailing seyit@outlean.net.
            </li>
            <li>
                <strong>Right to object:</strong> Object to processing based on legitimate interests
                (e.g. analytics) by contacting us.
            </li>
            <li>
                <strong>Right to withdraw consent:</strong> Unsubscribe from product update emails at
                any time in your account settings.
            </li>
            <li>
                <strong>Right to lodge a complaint:</strong> You may lodge a complaint with the Swedish
                data protection authority, IMY (Integritetsskyddsmyndigheten), at{' '}
                <a href="https://www.imy.se" target="_blank" rel="noopener noreferrer">imy.se</a>,
                or with your local supervisory authority.
            </li>
        </ul>
        <p>
            To exercise any of these rights, email us at <strong>seyit@outlean.net</strong>. We will
            respond within 30 days as required by GDPR.
        </p>

        <h2>10. Account Deletion</h2>
        <p>
            You can delete your account directly from the account settings within the game. Deleting
            your account will permanently remove:
        </p>
        <ul>
            <li>Your email address and password (Supabase auth record)</li>
            <li>All game progress data (adventure completion, companion levels)</li>
            <li>Your product update consent preference</li>
        </ul>
        <p>
            Anonymous gameplay analytics in the <code>play_events</code> table are <strong>not
            deleted</strong> because they use tab-scoped session IDs that cannot be linked back to your
            account. These records do not constitute personal data under GDPR.
        </p>

        <h2>11. Changes to This Policy</h2>
        <p>
            We may update this Privacy Policy when our practices change. Material changes will be
            communicated before they take effect. The "Last updated" date at the top of this document
            reflects when the policy was last revised.
        </p>

        <h2>12. Contact Us</h2>
        <p>
            For any privacy-related questions or to exercise your rights, contact us at:<br />
            <strong>seyit@outlean.net</strong>
        </p>
        <p>
            <em>Outlean AB, Sweden</em>
        </p>
    </div>
);
