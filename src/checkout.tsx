import { initCookieGuard } from './utils/cookie-guard';
initCookieGuard();

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import './i18n';
import { CheckoutPage } from './features/premium/components/CheckoutPage';
import { AuthProvider } from './context/AuthContext';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider>
            <CheckoutPage />
        </AuthProvider>
    </StrictMode>,
)
