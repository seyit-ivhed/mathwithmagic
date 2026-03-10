import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import { useGameStore } from '../stores/game/store';
import { usePremiumStore } from '../stores/premium.store';
import { PersistenceService } from '../services/persistence.service';
import { mergeGameState } from '../utils/merge-game-state';
import type { GameState } from '../stores/game/interfaces';
import { analyticsService } from '../services/analytics.service';

export const INIT_TIMEOUT_MS = 10000;

export const useInitializeGame = () => {
    const { isAuthenticated, user, loading: authLoading, refreshSession } = useAuth();
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const initializePremium = usePremiumStore(state => state.initialize);
    const initialized = useRef(false);
    const lastAuthId = useRef<string | undefined>(user?.id);
    const sessionStartedFired = useRef(false);

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

        const doInit = async () => {
            if (isAuthenticated && user) {
                console.log('User is authenticated, initializing data...');

                const profile = await PersistenceService.getOrCreateProfile(user.id);

                const [cloudState] = await Promise.all([
                    PersistenceService.pullState(user.id),
                    initializePremium(true, profile)
                ]);

                if (cloudState) {
                    console.log('Cloud state found, merging with local state...');
                    const localState = useGameStore.getState();
                    const mergedState = mergeGameState(localState, cloudState as Partial<GameState>);
                    useGameStore.setState(mergedState);
                } else {
                    console.log('No cloud state found, pushing local state to new account...');
                    await PersistenceService.pushState(user.id, useGameStore.getState());
                }
            }
        };

        try {
            let timeoutId: ReturnType<typeof setTimeout> | undefined;
            await Promise.race([
                doInit(),
                new Promise<never>((_, reject) => {
                    timeoutId = setTimeout(() => reject(new Error('Game initialization timed out')), INIT_TIMEOUT_MS);
                })
            ]).finally(() => clearTimeout(timeoutId));

            setIsInitializing(false);
            if (!sessionStartedFired.current) {
                sessionStartedFired.current = true;
                const hasProgress = Object.keys(useGameStore.getState().encounterResults).length > 0;
                analyticsService.trackEvent('session_started', { has_progress: hasProgress });
            }
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
