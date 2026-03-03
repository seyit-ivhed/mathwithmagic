import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useGameStore } from '../stores/game/store';
import { usePremiumStore } from '../stores/premium.store';
import { PersistenceService } from '../services/persistence.service';
import { mergeGameState } from '../utils/merge-game-state';
import type { GameState } from '../stores/game/interfaces';

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

        // Re-initialize if auth identity changes or not initialized yet
        if (initialized.current && lastAuthId.current === user?.id) {
            return;
        }

        console.log('Starting game initialization sequence...');
        initialized.current = true; // Set immediately to prevent race conditions
        lastAuthId.current = user?.id;
        setError(null);
        setIsInitializing(true);

        try {
            if (isAuthenticated && user) {
                console.log('User is authenticated, initializing data...');

                // 1. Get or create profile (single fetch)
                const profile = await PersistenceService.getOrCreateProfile(user.id);

                // 2. Fetch state and entitlements in parallel
                const [cloudState] = await Promise.all([
                    PersistenceService.pullState(user.id),
                    initializePremium(true, profile) // Force re-fetch for new user
                ]);

                if (cloudState) {
                    console.log('Cloud state found, merging with local state...');
                    // Merge cloud state with the local (localStorage-persisted) state so
                    // that progress from an offline session is never overwritten.
                    const localState = useGameStore.getState();
                    const mergedState = mergeGameState(localState, cloudState as Partial<GameState>);
                    useGameStore.setState(mergedState);
                }
            }

            setIsInitializing(false);
        } catch (err: unknown) {
            console.error('Initialization failed:', err);
            initialized.current = false; // Reset on failure to allow retry
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
        // We might need to refresh session if it's an auth-related failure
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
