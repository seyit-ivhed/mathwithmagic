import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useGameStore } from '../stores/game/store';
import { usePremiumStore } from '../stores/premium.store';
import { PersistenceService } from '../services/persistence.service';

export const useInitializeGame = () => {
    const { isAuthenticated, user, loading: authLoading, refreshSession } = useAuth();
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const initializePremium = usePremiumStore(state => state.initialize);
    const initialized = useRef(false);
    const lastAuthId = useRef<string | undefined>(user?.id);

    const performInitialization = useCallback(async () => {
        await Promise.resolve();
        if (authLoading) return;

        if (initialized.current && lastAuthId.current === user?.id) {
            return;
        }

        console.log('Starting game initialization sequence...');
        initialized.current = true;
        lastAuthId.current = user?.id;
        setError(null);
        setIsInitializing(true);

        try {
            if (isAuthenticated && user) {
                console.log('User is authenticated, initializing data...');

                const profile = await PersistenceService.getOrCreateProfile(user.id);

                const [cloudState] = await Promise.all([
                    PersistenceService.pullState(user.id),
                    initializePremium(true, profile)
                ]);

                if (cloudState) {
                    console.log('Cloud state found, rehydrating store...');
                    useGameStore.setState(cloudState);
                }
            }

            setIsInitializing(false);
        } catch (err: unknown) {
            console.error('Initialization failed:', err);
            initialized.current = false;
            setError('offline');
            setIsInitializing(false);
        }
    }, [authLoading, isAuthenticated, user, initializePremium]);

    useEffect(() => {
        const runInit = async () => {
            await performInitialization();
        };
        runInit();
    }, [performInitialization]);

    const retry = useCallback(() => {
        initialized.current = false;
        refreshSession().then(() => {
            performInitialization();
        });
    }, [performInitialization, refreshSession]);

    return {
        isInitializing: isInitializing || authLoading,
        error,
        retry
    };
};
