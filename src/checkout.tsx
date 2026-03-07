import { initCookieGuard } from './utils/cookie-guard';
initCookieGuard();

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import './i18n';
import { CheckoutPage } from './features/premium/components/CheckoutPage';

const app = import.meta.env.VITE_DISABLE_STRICT_MODE ? <CheckoutPage /> : <StrictMode><CheckoutPage /></StrictMode>

createRoot(document.getElementById('root')!).render(app)
