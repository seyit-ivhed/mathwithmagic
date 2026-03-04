import React from 'react';
import { useTranslation } from 'react-i18next';
import './LoadingScreen.css';

interface LoadingScreenProps {
    error?: string | null;
    onRetry?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ error, onRetry }) => {
    const { t } = useTranslation();
    return (
        <div className="loading-screen" id="global-loading-screen">
            <div className="loading-content">
                {!error ? (
                    <>
                        <div className="loading-orb"></div>
                        <div className="loading-text">
                            {t('loading.initializing')}
                            <span className="loading-dots">
                                <span>.</span><span>.</span><span>.</span>
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="error-container">
                        <h2 className="error-title">{t('loading.connection_error_title')}</h2>
                        <p className="error-message">
                            {t('loading.connection_error_message')}
                        </p>
                        <button className="retry-button" onClick={onRetry}>
                            {t('loading.retry')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
